const roomList = document.getElementById('roomList');
const resultSummary = document.getElementById('resultSummary');
const searchRoomForm = document.getElementById('searchRoomForm');
const checkInInput = document.getElementById('checkIn');
const checkOutInput = document.getElementById('checkOut');

function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(value || 0);
}

function renderRooms(rooms) {
    if (!rooms || rooms.length === 0) {
        roomList.innerHTML = '<div class="empty-state">Không có phòng trống phù hợp với khoảng thời gian bạn chọn.</div>';
        resultSummary.textContent = '0 phòng phù hợp';
        return;
    }

    roomList.innerHTML = rooms.map((room) => `
        <article class="room-card">
            <header>
                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
                    <strong>${room.code || 'PXXX'}</strong>
                    <span class="badge badge-ok">Trống</span>
                </div>
                <h3 style="margin:12px 0 0;">${room.name || 'Phòng'}</h3>
            </header>
            <div style="padding: 18px;">
                <div class="room-meta">
                    <span>Loại phòng</span>
                    <strong>${room.roomType || 'Standard'}</strong>
                </div>
                <div class="room-meta">
                    <span>Giá / đêm</span>
                    <strong>${formatCurrency(room.price)}</strong>
                </div>
                <div class="room-meta">
                    <span>Sức chứa</span>
                    <strong>${room.capacity || 2} người</strong>
                </div>
                <div class="room-meta">
                    <span>Ghi chú</span>
                    <strong>${room.note || 'Phòng sạch, tiện nghi đầy đủ'}</strong>
                </div>
                <button class="btn btn-primary" type="button" style="margin-top: 12px; width: 100%;">
                    Đặt phòng ngay
                </button>
            </div>
        </article>
    `).join('');

    resultSummary.textContent = `${rooms.length} phòng phù hợp`;
}

async function searchAvailableRooms(event) {
    event.preventDefault();

    const checkIn = checkInInput.value;
    const checkOut = checkOutInput.value;

    if (!checkIn || !checkOut) {
        alert('Vui lòng chọn ngày nhận phòng và ngày trả phòng.');
        return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
        alert('Ngày trả phòng phải lớn hơn ngày nhận phòng.');
        return;
    }

    try {
        const rooms = await RoomAPI.getAvailable(checkIn, checkOut);
        renderRooms(rooms);
    } catch (error) {
        alert('Không thể tìm phòng trống: ' + error.message);
    }
}

searchRoomForm.addEventListener('submit', searchAvailableRooms);

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
checkInInput.value = today.toISOString().slice(0, 10);
checkOutInput.value = tomorrow.toISOString().slice(0, 10);

RoomAPI.getAvailable(checkInInput.value, checkOutInput.value)
    .then((rooms) => renderRooms(rooms))
    .catch(() => {
        roomList.innerHTML = '<div class="empty-state">Hiện chưa có phòng trống cho khoảng thời gian này.</div>';
        resultSummary.textContent = '0 phòng phù hợp';
    });
