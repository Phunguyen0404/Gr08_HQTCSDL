const { store } = require('../config/db');

/** Lấy toàn bộ danh sách loại phòng. */
function getAll() {
    return store.roomTypes;
}

/** Tìm loại phòng theo id. */
function getById(id) {
    return store.roomTypes.find((item) => Number(item.id) === Number(id));
}

/** Thêm mới một loại phòng. */
function create(data) {
    const nextId = Math.max(0, ...store.roomTypes.map((item) => Number(item.id))) + 1;
    const roomType = {
        id: nextId,
        name: data.name,
        description: data.description || '',
        price: Number(data.price || 0),
        capacity: Number(data.capacity || 1)
    };

    store.roomTypes.push(roomType);
    return roomType;
}

/** Cập nhật thông tin loại phòng theo id. */
function update(id, data) {
    const index = store.roomTypes.findIndex((item) => Number(item.id) === Number(id));
    if (index === -1) return null;

    store.roomTypes[index] = {
        ...store.roomTypes[index],
        name: data.name ?? store.roomTypes[index].name,
        description: data.description ?? store.roomTypes[index].description,
        price: data.price ?? store.roomTypes[index].price,
        capacity: data.capacity ?? store.roomTypes[index].capacity
    };

    return store.roomTypes[index];
}

/** Xóa loại phòng theo id. */
function remove(id) {
    const index = store.roomTypes.findIndex((item) => Number(item.id) === Number(id));
    if (index === -1) return false;

    store.roomTypes.splice(index, 1);
    return true;
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
};
