const { store } = require('../config/db');

/*Lấy toàn bộ danh sách phòng. */
function getAll() {
    return store.rooms;
}

/*Tìm phòng theo id. */
function getById(id) {
    return store.rooms.find((item) => Number(item.id) === Number(id));
}

/*Thêm mới một phòng. */
function create(data) {
    const nextId = Math.max(0, ...store.rooms.map((item) => Number(item.id))) + 1;
    const room = {
        id: nextId,
        code: data.code,
        name: data.name,
        roomTypeId: data.roomTypeId,
        roomType: data.roomType || 'Standard',
        price: Number(data.price || 0),
        capacity: Number(data.capacity || 1),
        status: data.status || 'available',
        note: data.note || ''
    };

    store.rooms.push(room);
    return room;
}

/*Cập nhật thông tin phòng theo id. */
function update(id, data) {
    const index = store.rooms.findIndex((item) => Number(item.id) === Number(id));
    if (index === -1) return null;

    store.rooms[index] = {
        ...store.rooms[index],
        code: data.code ?? store.rooms[index].code,
        name: data.name ?? store.rooms[index].name,
        roomTypeId: data.roomTypeId ?? store.rooms[index].roomTypeId,
        roomType: data.roomType ?? store.rooms[index].roomType,
        price: data.price ?? store.rooms[index].price,
        capacity: data.capacity ?? store.rooms[index].capacity,
        status: data.status ?? store.rooms[index].status,
        note: data.note ?? store.rooms[index].note
    };

    return store.rooms[index];
}

/*Xóa phòng theo id. */
function remove(id) {
    const index = store.rooms.findIndex((item) => Number(item.id) === Number(id));
    if (index === -1) return false;

    store.rooms.splice(index, 1);
    return true;
}

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
};
