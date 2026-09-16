const pool = require('../config/db');

const STATUS_DB_TO_VI = {
    AVAILABLE: 'Trống',
    OCCUPIED: 'Đang thuê',
    CLEANING: 'Đang dọn dẹp',
    MAINTENANCE: 'Bảo trì',
    OUT_OF_SERVICE: 'Ngừng phục vụ'
};

const STATUS_VI_TO_DB = {
    'Trống': 'AVAILABLE',
    'available': 'AVAILABLE',
    'AVAILABLE': 'AVAILABLE',
    'Đang thuê': 'OCCUPIED',
    'occupied': 'OCCUPIED',
    'OCCUPIED': 'OCCUPIED',
    'Bảo trì': 'MAINTENANCE',
    'maintenance': 'MAINTENANCE',
    'MAINTENANCE': 'MAINTENANCE',
    'Đang dọn dẹp': 'CLEANING',
    'cleaning': 'CLEANING',
    'CLEANING': 'CLEANING',
    'Ngừng phục vụ': 'OUT_OF_SERVICE',
    'OUT_OF_SERVICE': 'OUT_OF_SERVICE'
};

function mapRoomFromRow(row) {
    if (!row) return null;
    return {
        id: row.MaPhong,
        code: row.MaPhong,
        name: `Phòng ${row.SoPhong}`,
        roomNumber: row.SoPhong,
        roomTypeId: row.MaLoaiPhong,
        roomType: row.TenLoaiPhong || 'Standard',
        price: Number(row.GiaCoBan || 0),
        capacity: Number(row.SucChua || 2),
        floor: Number(row.Tang || 1),
        status: STATUS_DB_TO_VI[row.TrangThai] || 'Trống',
        statusCode: row.TrangThai,
        note: row.MoTa || ''
    };
}

/** Lấy toàn bộ danh sách phòng từ MySQL. */
async function getAll() {
    const [rows] = await pool.query(
        `SELECT p.MaPhong, p.SoPhong, p.Tang, p.TrangThai, p.MoTa,
                lp.MaLoaiPhong, lp.TenLoaiPhong, lp.GiaCoBan, lp.SucChua
           FROM PHONG p
           JOIN LOAI_PHONG lp ON lp.MaLoaiPhong = p.MaLoaiPhong
          ORDER BY p.Tang ASC, p.SoPhong ASC`
    );
    return rows.map(mapRoomFromRow);
}

/** Tìm phòng theo mã phòng / id. */
async function getById(id) {
    const [[row]] = await pool.query(
        `SELECT p.MaPhong, p.SoPhong, p.Tang, p.TrangThai, p.MoTa,
                lp.MaLoaiPhong, lp.TenLoaiPhong, lp.GiaCoBan, lp.SucChua
           FROM PHONG p
           JOIN LOAI_PHONG lp ON lp.MaLoaiPhong = p.MaLoaiPhong
          WHERE p.MaPhong = ? OR p.SoPhong = ?`,
        [id, id]
    );
    return mapRoomFromRow(row);
}

/** Thêm mới một phòng vào MySQL. */
async function create(data) {
    const maPhong = data.code || `P${data.roomNumber || data.name?.replace(/\D/g, '') || '999'}`;
    const soPhong = data.roomNumber || data.name?.replace(/\D/g, '') || maPhong.replace(/\D/g, '');
    const maLoaiPhong = data.roomTypeId || 'LP001';
    const tang = Number(data.floor || String(soPhong).charAt(0) || 1);
    const dbStatus = STATUS_VI_TO_DB[data.status] || 'AVAILABLE';

    await pool.query(
        `INSERT INTO PHONG (MaPhong, MaLoaiPhong, SoPhong, Tang, TrangThai, MoTa)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            MaLoaiPhong = VALUES(MaLoaiPhong),
            Tang = VALUES(Tang),
            TrangThai = VALUES(TrangThai),
            MoTa = VALUES(MoTa)`,
        [maPhong, maLoaiPhong, soPhong, tang, dbStatus, data.note || null]
    );

    return getById(maPhong);
}

/** Cập nhật thông tin phòng theo id. */
async function update(id, data) {
    const current = await getById(id);
    if (!current) return null;

    const dbStatus = data.status ? (STATUS_VI_TO_DB[data.status] || data.status) : null;
    const soPhong = data.roomNumber || (data.name ? data.name.replace(/\D/g, '') : null);
    const tang = data.floor ? Number(data.floor) : null;

    await pool.query(
        `UPDATE PHONG
            SET SoPhong = COALESCE(?, SoPhong),
                MaLoaiPhong = COALESCE(?, MaLoaiPhong),
                Tang = COALESCE(?, Tang),
                TrangThai = COALESCE(?, TrangThai),
                MoTa = COALESCE(?, MoTa)
          WHERE MaPhong = ?`,
        [
            soPhong,
            data.roomTypeId || null,
            tang,
            dbStatus,
            data.note ?? null,
            id
        ]
    );

    return getById(id);
}

/** Xóa phòng theo id. */
async function remove(id) {
    const [result] = await pool.query(
        `DELETE FROM PHONG WHERE MaPhong = ?`,
        [id]
    );
    return result.affectedRows > 0;
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
};
