// ============================================================
// LOGIC TÌM PHÒNG & ĐẶT PHÒNG KHÁCH HÀNG (CUSTOMER ROOMS)
// ============================================================

const roomList = document.getElementById('roomList');
const resultSummary = document.getElementById('resultSummary');
const stayInfo = document.getElementById('stayInfo');
const searchRoomForm = document.getElementById('searchRoomForm');
const checkInInput = document.getElementById('checkIn');
const checkOutInput = document.getElementById('checkOut');
const guestSelect = document.getElementById('guestSelect');
const typeFilter = document.getElementById('typeFilter');
const userArea = document.getElementById('userArea');

// State
let allAvailableRooms = [];
let currentBookingRoom = null;
let stayNights = 1;

// Room type images
const ROOM_IMAGES = {
    LP001: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&auto=format&fit=crop&q=80',
    LP002: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80',
    LP003: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80',
    STD: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&auto=format&fit=crop&q=80',
    DLX: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80',
    SUI: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80'
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&auto=format&fit=crop&q=80';

function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(value || 0);
}

function calculateNights(checkInStr, checkOutStr) {
    const d1 = new Date(checkInStr);
    const d2 = new Date(checkOutStr);
    const diffTime = d2.getTime() - d1.getTime();
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, nights || 1);
}

// Render Topbar user status
function renderUserArea() {
    const session = typeof authGuard !== 'undefined' ? authGuard.getSession() : null;

    if (session && session.user) {
        const displayName = session.user.hoTen || session.user.username;
        userArea.innerHTML = `
            <a href="home.html" class="nav-link">🏠 Trang chủ</a>
            <a href="my-bookings.html" class="nav-link" style="font-weight: 600;">📋 Đơn của tôi</a>
            <a href="profile.html" class="nav-link" style="color: var(--lux-accent, #c5a880); font-weight: 600;">👤 Hồ sơ cá nhân</a>
            <div style="display:flex; align-items:center; gap:8px; margin-left:8px;">
                <div style="width:34px; height:34px; border-radius:0; background:var(--lux-fg, #1a1a1a); color:#ffffff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px;">
                    ${displayName.slice(0, 2).toUpperCase()}
                </div>
                <span style="font-size:13px; font-weight:600; color:var(--lux-fg, #1a1a1a);">${displayName}</span>
            </div>
            <button id="logoutBtn" style="background:transparent; color:#dc2626; border:1px solid rgba(220,38,38,0.3); border-radius:0; padding:6px 12px; font-size:12px; font-weight:600; cursor:pointer;">
                Đăng xuất
            </button>
        `;
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            authGuard.logout();
        });
    } else {
        userArea.innerHTML = `
            <a href="home.html" class="nav-link">🏠 Trang chủ</a>
            <a href="/login" class="nav-link" style="color: #2563eb; font-weight: 600;">Đăng nhập</a>
            <a href="/register" style="background:#2563eb; color:#fff; padding:6px 14px; border-radius:8px; text-decoration:none; font-size:13px; font-weight:600;">Đăng ký</a>
        `;
    }
}

// Render Room Cards
function renderRooms(rooms) {
    const filterType = typeFilter ? typeFilter.value : 'ALL';
    const filteredRooms = filterType === 'ALL'
        ? rooms
        : rooms.filter(r => r.roomTypeId === filterType || r.roomType === filterType);

    if (!filteredRooms || filteredRooms.length === 0) {
        roomList.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 36px; margin-bottom: 8px;">🏨</div>
                <h3 style="margin: 0 0 8px; color: #1e293b;">Không có phòng phù hợp</h3>
                <p style="margin: 0; font-size: 14px;">Vui lòng chọn khoảng thời gian khác hoặc giảm số lượng khách.</p>
            </div>
        `;
        resultSummary.textContent = '0 phòng phù hợp';
        return;
    }

    resultSummary.textContent = `${filteredRooms.length} phòng khả dụng`;

    roomList.innerHTML = filteredRooms.map((room) => {
        const imgUrl = ROOM_IMAGES[room.roomTypeId] || DEFAULT_IMAGE;
        const roomRate = Number(room.price || 500000);
        const totalEst = roomRate * stayNights;

        return `
            <article class="room-card">
                <div class="room-img-wrap">
                    <img src="${imgUrl}" alt="${room.name}" class="room-img" loading="lazy" />
                    <span class="room-type-badge">${room.roomType || 'Standard'}</span>
                </div>
                <div class="room-body">
                    <div class="room-title-row">
                        <h3 class="room-name">${room.name}</h3>
                        <span style="background: #dcfce7; color: #166534; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 999px;">
                            Còn trống
                        </span>
                    </div>

                    <div class="room-features">
                        <span class="room-feature">👥 Tối đa ${room.capacity || 2} khách</span>
                        <span>•</span>
                        <span class="room-feature">📍 Tầng ${room.floor || 1}</span>
                    </div>

                    <p style="font-size: 13px; color: #64748b; margin: 0 0 16px; line-height: 1.5;">
                        ${room.note || 'Phòng tiện nghi cao cấp, trang bị wifi tốc độ cao, điều hòa và bữa sáng.'}
                    </p>

                    <div class="price-section">
                        <div>
                            <div class="price-per-night">Giá mỗi đêm:</div>
                            <div class="price-val">${formatCurrency(roomRate)}</div>
                            <div class="total-est">Tổng ${stayNights} đêm: <strong>${formatCurrency(totalEst)}</strong></div>
                        </div>
                        <button class="btn-book" type="button" onclick="openBookingModal('${room.code}', '${room.name}', '${room.roomType}', ${roomRate}, ${room.capacity})">
                            Đặt ngay
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

// Fetch and load available rooms
async function loadAvailableRooms() {
    const checkIn = checkInInput.value;
    const checkOut = checkOutInput.value;
    const guests = guestSelect.value;

    if (!checkIn || !checkOut) return;

    stayNights = calculateNights(checkIn, checkOut);
    stayInfo.textContent = `📅 Lưu trú: ${checkIn} ➔ ${checkOut} (${stayNights} đêm) • ${guests} khách`;

    roomList.innerHTML = '<div class="empty-state">Đang tìm kiếm phòng trống thực tế...</div>';

    try {
        const rooms = await RoomAPI.getAvailable(checkIn, checkOut);
        allAvailableRooms = Array.isArray(rooms) ? rooms : [];

        // Load room types into filter if needed
        populateTypeFilter(allAvailableRooms);

        renderRooms(allAvailableRooms);
    } catch (error) {
        console.error('Lỗi tải phòng:', error);
        roomList.innerHTML = `<div class="empty-state">Không thể kết nối đến máy chủ: ${error.message}</div>`;
    }
}

function populateTypeFilter(rooms) {
    if (!typeFilter) return;
    const currentVal = typeFilter.value;
    const typeSet = new Map();

    rooms.forEach(r => {
        if (r.roomTypeId && r.roomType) {
            typeSet.set(r.roomTypeId, r.roomType);
        }
    });

    typeFilter.innerHTML = '<option value="ALL">Tất cả loại phòng</option>';
    typeSet.forEach((name, id) => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = name;
        typeFilter.appendChild(opt);
    });

    if (currentVal && typeSet.has(currentVal)) {
        typeFilter.value = currentVal;
    }
}

typeFilter?.addEventListener('change', () => {
    renderRooms(allAvailableRooms);
});

searchRoomForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (new Date(checkOutInput.value) <= new Date(checkInInput.value)) {
        alert('Ngày trả phòng phải lớn hơn ngày nhận phòng ít nhất 1 ngày.');
        return;
    }
    loadAvailableRooms();
});

// Modal Logic
window.openBookingModal = function (roomCode, roomName, roomTypeName, rate, capacity) {
    const session = typeof authGuard !== 'undefined' ? authGuard.getSession() : null;

    if (!session || !session.user) {
        const goLogin = confirm('Quý khách vui lòng đăng nhập tài khoản để xác nhận đặt phòng.\n\nNhấn "OK" để chuyển đến trang Đăng nhập.');
        if (goLogin) {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
        }
        return;
    }

    const checkIn = checkInInput.value;
    const checkOut = checkOutInput.value;
    stayNights = calculateNights(checkIn, checkOut);
    const totalAmount = rate * stayNights;

    currentBookingRoom = {
        code: roomCode,
        name: roomName,
        roomType: roomTypeName,
        rate: rate,
        capacity: capacity,
        total: totalAmount
    };

    document.getElementById('modalRoomName').textContent = `${roomName} (${roomCode})`;
    document.getElementById('modalRoomType').textContent = roomTypeName;
    document.getElementById('modalStayDates').textContent = `${checkIn} đến ${checkOut} (${stayNights} đêm)`;
    document.getElementById('modalRoomRate').textContent = `${formatCurrency(rate)} / đêm`;
    document.getElementById('modalTotalAmount').textContent = formatCurrency(totalAmount);

    // Pre-fill user details if available
    const nameInput = document.getElementById('customerName');
    const phoneInput = document.getElementById('customerPhone');

    nameInput.value = session.user.hoTen || session.user.username || '';
    phoneInput.value = session.user.soDienThoai || '';

    const modal = document.getElementById('bookingModal');
    modal.style.display = 'flex';
};

window.closeBookingModal = function () {
    const modal = document.getElementById('bookingModal');
    modal.style.display = 'none';
    currentBookingRoom = null;
};

window.showBookingSuccessModal = function ({ bookingCode, room, checkIn, checkOut, nights }) {
    document.getElementById('successBookingCode').textContent = bookingCode;
    document.getElementById('successRoomName').textContent = room.name;
    document.getElementById('successStayDates').textContent = `${checkIn} → ${checkOut} (${nights} đêm)`;
    document.getElementById('successTotalAmount').textContent = formatCurrency(room.total);
    document.getElementById('bookingSuccessModal').style.display = 'flex';
};

window.continueBrowsingRooms = function () {
    document.getElementById('bookingSuccessModal').style.display = 'none';
    loadAvailableRooms();
};

window.viewMyBookings = function () {
    window.location.href = 'my-bookings.html';
};

window.submitBooking = async function (e) {
    e.preventDefault();
    if (!currentBookingRoom) return;

    const session = typeof authGuard !== 'undefined' ? authGuard.getSession() : null;
    if (!session || !session.user) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = '/login';
        return;
    }

    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const customerNote = document.getElementById('customerNote').value.trim();
    const submitBtn = document.getElementById('submitBookingBtn');

    if (!customerName || !customerPhone) {
        alert('Vui lòng điền họ tên và số điện thoại liên hệ.');
        return;
    }

    const payload = {
        customerId: session.user.maKH || session.user.maTaiKhoan,
        checkIn: `${checkInInput.value} 14:00:00`,
        checkOut: `${checkOutInput.value} 12:00:00`,
        guests: Number(guestSelect.value) || 2,
        note: `Khách: ${customerName} (SĐT: ${customerPhone}). ${customerNote ? 'Ghi chú: ' + customerNote : ''}`.trim(),
        rooms: [
            {
                MaPhong: currentBookingRoom.code,
                DonGia: currentBookingRoom.rate
            }
        ]
    };

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang xử lý đặt phòng...';

        const token = session.token;
        const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (res.ok && result.success) {
            const bookingCode = result.data?.bookingCode || result.data?.maBookingCode || 'Đã ghi nhận';
            // closeBookingModal clears the shared selection; retain it for this dialog.
            const bookedRoom = currentBookingRoom;
            closeBookingModal();
            showBookingSuccessModal({
                bookingCode,
                room: bookedRoom,
                checkIn: checkInInput.value,
                checkOut: checkOutInput.value,
                nights: stayNights
            });
        } else {
            alert('Không thể đặt phòng: ' + (result.message || 'Lỗi hệ thống'));
        }
    } catch (err) {
        console.error('Booking submission error:', err);
        alert('Lỗi kết nối đặt phòng: ' + err.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Xác nhận đặt ngay';
    }
};

// INITIALIZATION
(function init() {
    renderUserArea();

    // Read query params if any
    const urlParams = new URLSearchParams(window.location.search);
    const qCheckIn = urlParams.get('checkIn');
    const qCheckOut = urlParams.get('checkOut');
    const qGuests = urlParams.get('guests') || urlParams.get('soPhong');
    const qLoaiPhong = urlParams.get('loaiPhong');

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const toISO = (d) => d.toISOString().slice(0, 10);

    checkInInput.value = qCheckIn || toISO(today);
    checkInInput.min = toISO(today);

    checkOutInput.value = qCheckOut || toISO(tomorrow);
    checkOutInput.min = toISO(tomorrow);

    if (qGuests && guestSelect) {
        guestSelect.value = qGuests;
    }

    checkInInput.addEventListener('change', () => {
        const nextDay = new Date(checkInInput.value);
        nextDay.setDate(nextDay.getDate() + 1);
        checkOutInput.min = toISO(nextDay);
        if (checkOutInput.value <= checkInInput.value) {
            checkOutInput.value = toISO(nextDay);
        }
    });

    loadAvailableRooms().then(() => {
        if (qLoaiPhong && typeFilter) {
            typeFilter.value = qLoaiPhong;
            renderRooms(allAvailableRooms);
        }
    });
})();
