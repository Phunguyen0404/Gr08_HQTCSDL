const pool = require('../config/db');

const sessions = new Map();
const SESSION_NAMES = new Set(['A', 'B']);

async function ensureTable() {
    await pool.query(`CREATE TABLE IF NOT EXISTS DEMO_DAT_PHONG (
        MaDatPhong VARCHAR(30) PRIMARY KEY,
        MaPhong VARCHAR(20) NOT NULL,
        SoKhach INT NOT NULL,
        TrangThai VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        GhiChu VARCHAR(255) NULL,
        CapNhatLuc DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`);
}

function requireSession(name) {
    if (!SESSION_NAMES.has(name)) throw Object.assign(new Error('Phiên demo phải là A hoặc B.'), { status: 400 });
}

async function closeSession(name, rollback = true) {
    const item = sessions.get(name);
    if (!item) return;
    sessions.delete(name);
    try { if (rollback) await item.conn.rollback(); } catch (_) { /* connection may already be rolled back */ }
    item.conn.release();
}

async function reset() {
    await ensureTable();
    await Promise.all([...SESSION_NAMES].map((name) => closeSession(name)));
    await pool.query('DELETE FROM DEMO_DAT_PHONG');
    await pool.query(`INSERT INTO DEMO_DAT_PHONG (MaDatPhong, MaPhong, SoKhach, TrangThai, GhiChu) VALUES
        ('BK-DEMO-001', 'P101', 2, 'PENDING', 'Đơn nháp của khách A'),
        ('BK-DEMO-002', 'P202', 2, 'PENDING', 'Đơn nháp của khách B'),
        ('BK-DEMO-003', 'P303', 1, 'PENDING', 'Khách chờ xác nhận'),
        ('BK-DEMO-004', 'P404', 3, 'CONFIRMED', 'Đơn đã xác nhận')`);
    return getState();
}

async function getState() {
    await ensureTable();
    const [rows] = await pool.query('SELECT MaDatPhong, MaPhong, SoKhach, TrangThai, GhiChu, CapNhatLuc FROM DEMO_DAT_PHONG ORDER BY MaDatPhong');
    return { rows, activeSessions: [...sessions.keys()] };
}

async function begin(name, isolation = 'REPEATABLE READ') {
    requireSession(name);
    const allowed = new Set(['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE']);
    if (!allowed.has(isolation)) throw Object.assign(new Error('Isolation level không hợp lệ.'), { status: 400 });
    await closeSession(name);
    await ensureTable();
    const conn = await pool.getConnection();
    try {
        await conn.query(`SET SESSION TRANSACTION ISOLATION LEVEL ${isolation}`);
        await conn.beginTransaction();
        sessions.set(name, { conn, isolation });
        return { session: name, isolation };
    } catch (error) {
        conn.release();
        throw error;
    }
}

async function run(name, action, payload = {}) {
    requireSession(name);
    const item = sessions.get(name);
    if (!item) throw Object.assign(new Error(`Phiên ${name} chưa BEGIN.`), { status: 409 });
    const { conn } = item;
    try {
        if (action === 'read') {
            const [[row]] = await conn.query('SELECT MaDatPhong, MaPhong, SoKhach, TrangThai, GhiChu FROM DEMO_DAT_PHONG WHERE MaDatPhong = ?', [payload.id || 'BK-DEMO-001']);
            return { action, row };
        }
        if (action === 'range-read') {
            const [rows] = await conn.query("SELECT MaDatPhong, MaPhong, SoKhach, TrangThai FROM DEMO_DAT_PHONG WHERE TrangThai = 'PENDING' ORDER BY MaDatPhong");
            return { action, rows };
        }
        if (action === 'write') {
            const [result] = await conn.query('UPDATE DEMO_DAT_PHONG SET SoKhach = ?, GhiChu = ? WHERE MaDatPhong = ?', [Number(payload.value), `Cập nhật bởi người dùng ${name} (chưa commit)`, payload.id || 'BK-DEMO-001']);
            return { action, affectedRows: result.affectedRows };
        }
        if (action === 'insert') {
            const id = `BK-PHANTOM-${name}`;
            await conn.query('INSERT INTO DEMO_DAT_PHONG (MaDatPhong, MaPhong, SoKhach, TrangThai, GhiChu) VALUES (?, ?, ?, ?, ?)', [id, 'P505', Number(payload.value || 1), 'PENDING', `Đơn được tạo bởi người dùng ${name}`]);
            return { action, id };
        }
        if (action === 'lock') {
            const [[row]] = await conn.query('SELECT MaDatPhong, MaPhong, SoKhach, TrangThai FROM DEMO_DAT_PHONG WHERE MaDatPhong = ? FOR UPDATE', [payload.id || 'BK-DEMO-001']);
            return { action, row, message: `Đã khóa ${row?.MaDatPhong}.` };
        }
        throw Object.assign(new Error('Thao tác demo không hợp lệ.'), { status: 400 });
    } catch (error) {
        if (error.code === 'ER_LOCK_DEADLOCK') {
            await closeSession(name, false);
            error.status = 409;
            error.message = `InnoDB phát hiện deadlock và đã rollback Session ${name}.`;
        }
        throw error;
    }
}

async function finish(name, commit) {
    requireSession(name);
    const item = sessions.get(name);
    if (!item) throw Object.assign(new Error(`Phiên ${name} chưa BEGIN.`), { status: 409 });
    try { if (commit) await item.conn.commit(); else await item.conn.rollback(); }
    finally { sessions.delete(name); item.conn.release(); }
    return getState();
}

module.exports = { reset, getState, begin, run, finish };
