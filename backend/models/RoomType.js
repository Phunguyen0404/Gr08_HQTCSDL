const pool = require('../config/db');

function mapRoomTypeFromRow(row) {
    if (!row) return null;
    return {
        id: row.MaLoaiPhong,
        name: row.TenLoaiPhong,
        description: row.MoTa || '',
        capacity: Number(row.SucChua || 1),
        price: Number(row.GiaCoBan || 0),
        status: row.TrangThai || 'ACTIVE'
    };
}

/** Lấy toàn bộ danh sách loại phòng từ MySQL. */
async function getAll() {
    const [rows] = await pool.query(
        `SELECT MaLoaiPhong, TenLoaiPhong, MoTa, SucChua, GiaCoBan, TrangThai
           FROM LOAI_PHONG
          WHERE TrangThai = 'ACTIVE'
          ORDER BY GiaCoBan ASC`
    );
    return rows.map(mapRoomTypeFromRow);
}

/** Tìm loại phòng theo id (MaLoaiPhong). */
async function getById(id) {
    const [[row]] = await pool.query(
        `SELECT MaLoaiPhong, TenLoaiPhong, MoTa, SucChua, GiaCoBan, TrangThai
           FROM LOAI_PHONG
          WHERE MaLoaiPhong = ?`,
        [id]
    );
    return mapRoomTypeFromRow(row);
}

/** Thêm mới một loại phòng vào MySQL. */
async function create(data) {
    const [existing] = await pool.query(
        `SELECT MAX(CAST(SUBSTRING(MaLoaiPhong, 3) AS UNSIGNED)) as maxId
           FROM LOAI_PHONG
          WHERE MaLoaiPhong REGEXP '^LP[0-9]+$'`
    );
    const nextSeq = (existing[0]?.maxId || 0) + 1;
    const maLoaiPhong = data.code || `LP${String(nextSeq).padStart(3, '0')}`;

    await pool.query(
        `INSERT INTO LOAI_PHONG (MaLoaiPhong, TenLoaiPhong, MoTa, SucChua, GiaCoBan, TrangThai)
         VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
        [
            maLoaiPhong,
            data.name,
            data.description || null,
            Number(data.capacity || 2),
            Number(data.price || 0)
        ]
    );

    return getById(maLoaiPhong);
}

/** Cập nhật thông tin loại phòng theo id. */
async function update(id, data) {
    const current = await getById(id);
    if (!current) return null;

    await pool.query(
        `UPDATE LOAI_PHONG
            SET TenLoaiPhong = COALESCE(?, TenLoaiPhong),
                MoTa = COALESCE(?, MoTa),
                SucChua = COALESCE(?, SucChua),
                GiaCoBan = COALESCE(?, GiaCoBan)
          WHERE MaLoaiPhong = ?`,
        [
            data.name ?? null,
            data.description ?? null,
            data.capacity ? Number(data.capacity) : null,
            data.price ? Number(data.price) : null,
            id
        ]
    );

    return getById(id);
}

/** Xóa loại phòng theo id (chuyển sang INACTIVE). */
async function remove(id) {
    const [result] = await pool.query(
        `UPDATE LOAI_PHONG SET TrangThai = 'INACTIVE' WHERE MaLoaiPhong = ?`,
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
