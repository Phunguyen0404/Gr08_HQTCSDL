<<<<<<< HEAD
const state = {
    availableRooms: [],
    selectedRoom: null,
    checkIn: null,
    checkOut: null,
    guests: 2,
    customerId: ''
};

const checkInInput = document.getElementById('checkInInput');
const checkOutInput = document.getElementById('checkOutInput');
const guestsInput = document.getElementById('guestsInput');
const customerIdInput = document.getElementById('customerIdInput');
const searchBtn = document.getElementById('searchBtn');
const formMessage = document.getElementById('formMessage');
const roomGrid = document.getElementById('roomGrid');
const summarySection = document.getElementById('summarySection');
const summaryRoomName = document.getElementById('summaryRoomName');
const summaryDates = document.getElementById('summaryDates');
const summaryPrice = document.getElementById('summaryPrice');
const summaryTotal = document.getElementById('summaryTotal');
const confirmBtn = document.getElementById('confirmBtn');
const bookingList = document.getElementById('bookingList');

function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

function formatDate(value) {
    return new Date(value).toLocaleDateString('vi-VN');
}

function showMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className = 'form-message' + (type ? ' ' + type : '');
}

function nightsBetween(checkIn, checkOut) {
    const ms = new Date(checkOut) - new Date(checkIn);
    return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

async function apiRequest(url, options) {
    const res = await fetch(url, options);
    const body = await res.json();
    if (!res.ok || !body.success) {
        throw new Error(body.message || 'Đã có lỗi xảy ra');
    }
    return body.data;
}

function renderRooms() {
    if (!state.availableRooms.length) {
        roomGrid.innerHTML = '<p class="empty-state">Không có phòng trống phù hợp trong khoảng ngày này.</p>';
        return;
    }

    roomGrid.innerHTML = state.availableRooms.map(room => `
    <div class="ticket ${state.selectedRoom && state.selectedRoom.MaPhong === room.MaPhong ? 'selected' : ''}" data-room="${room.MaPhong}">
      <div class="ticket-img">
        <span class="code">RM · ${room.SoPhong}</span>
        <span class="tag">${room.TenLoaiPhong}</span>
      </div>
      <div class="perforation"></div>
      <div class="ticket-body">
        <h3>Phòng ${room.SoPhong} · Tầng ${room.Tang}</h3>
        <p class="desc">${room.MoTa || ''} · Sức chứa ${room.SucChua} người</p>
        <div class="ticket-footer">
          <div class="price">
            <div class="amount">${formatCurrency(room.GiaCoBan)}</div>
            <div class="unit">/ đêm</div>
          </div>
          <button type="button" class="choose-btn" data-action="choose" data-room="${room.MaPhong}">Chọn phòng</button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderSummary() {
    if (!state.selectedRoom) {
        summarySection.style.display = 'none';
        return;
    }

    const nights = nightsBetween(state.checkIn, state.checkOut);
    const total = nights * Number(state.selectedRoom.GiaCoBan);

    summaryRoomName.textContent = `Phòng ${state.selectedRoom.SoPhong} · ${nights} đêm`;
    summaryDates.textContent = `${formatDate(state.checkIn)} – ${formatDate(state.checkOut)} · ${state.guests} khách`;
    summaryPrice.textContent = formatCurrency(state.selectedRoom.GiaCoBan);
    summaryTotal.textContent = formatCurrency(total);
    summarySection.style.display = 'block';
}

function getStatusClass(status) {
    return 'status-' + status.toLowerCase();
}

function renderBookings(bookings) {
    if (!bookings.length) {
        bookingList.innerHTML = '<p class="empty-state">Chưa có đơn đặt phòng nào.</p>';
        return;
    }

    bookingList.innerHTML = bookings.map(b => `
    <div class="booking-row" data-booking="${b.bookingId}">
      <div class="info">
        <h4>${b.bookingCode} · Phòng ${b.rooms || '—'}</h4>
        <p>${formatDate(b.checkIn)} – ${formatDate(b.checkOut)} · ${b.guests} khách</p>
      </div>
      <span class="status-pill ${getStatusClass(b.status)}">${b.status}</span>
      <button type="button" class="cancel-btn" data-action="cancel" data-booking="${b.bookingId}"
        ${['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(b.status) ? 'disabled' : ''}>
        Hủy đặt phòng
      </button>
    </div>
  `).join('');
}

async function loadMyBookings() {
    if (!state.customerId) return;
    try {
        const bookings = await apiRequest(`/api/bookings?customerId=${encodeURIComponent(state.customerId)}`);
        renderBookings(bookings);
    } catch (err) {
        showMessage(err.message, 'error');
    }
}

async function handleSearch() {
    state.checkIn = checkInInput.value;
    state.checkOut = checkOutInput.value;
    state.guests = Number(guestsInput.value) || 1;
    state.customerId = customerIdInput.value.trim();

    if (!state.checkIn || !state.checkOut) {
        showMessage('Vui lòng chọn ngày nhận và trả phòng.', 'error');
        return;
    }
    if (new Date(state.checkIn) >= new Date(state.checkOut)) {
        showMessage('Ngày nhận phòng phải trước ngày trả phòng.', 'error');
        return;
    }

    showMessage('Đang tìm phòng trống...', '');
    state.selectedRoom = null;
    renderSummary();

    try {
        const query = new URLSearchParams({
            checkIn: state.checkIn,
            checkOut: state.checkOut,
            guests: state.guests
        });
        state.availableRooms = await apiRequest(`/api/bookings/available-rooms?${query}`);
        renderRooms();
        showMessage(`Tìm thấy ${state.availableRooms.length} phòng trống.`, 'success');
    } catch (err) {
        showMessage(err.message, 'error');
    }

    loadMyBookings();
}

function handleRoomGridClick(event) {
    const button = event.target.closest('button[data-action="choose"]');
    if (!button) return;

    const room = state.availableRooms.find(r => r.MaPhong === button.dataset.room);
    if (!room) return;

    state.selectedRoom = room;
    renderRooms();
    renderSummary();
    summarySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function handleConfirm() {
    if (!state.selectedRoom) return;
    if (!state.customerId) {
        showMessage('Vui lòng nhập mã khách hàng trước khi đặt phòng.', 'error');
        return;
    }

    confirmBtn.disabled = true;
    try {
        const result = await apiRequest('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerId: state.customerId,
                checkIn: state.checkIn,
                checkOut: state.checkOut,
                guests: state.guests,
                rooms: [{ MaPhong: state.selectedRoom.MaPhong, DonGia: state.selectedRoom.GiaCoBan }]
            })
        });

        showMessage(`Đặt phòng thành công · Mã đơn ${result.bookingCode}`, 'success');
        state.selectedRoom = null;
        renderSummary();
        await handleSearch();
    } catch (err) {
        showMessage(err.message, 'error');
    } finally {
        confirmBtn.disabled = false;
    }
}

async function handleBookingListClick(event) {
    const button = event.target.closest('button[data-action="cancel"]');
    if (!button) return;

    const bookingId = button.dataset.booking;
    const confirmCancel = window.confirm(`Bạn có chắc muốn hủy đơn ${bookingId}?`);
    if (!confirmCancel) return;

    button.disabled = true;
    try {
        await apiRequest(`/api/bookings/${bookingId}/cancel`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId: state.customerId })
        });
        showMessage('Đã hủy đơn đặt phòng.', 'success');
        loadMyBookings();
    } catch (err) {
        showMessage(err.message, 'error');
        button.disabled = false;
    }
}

searchBtn.addEventListener('click', handleSearch);
confirmBtn.addEventListener('click', handleConfirm);
roomGrid.addEventListener('click', handleRoomGridClick);
bookingList.addEventListener('click', handleBookingListClick);

(function setDefaultDates() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);

    checkInInput.value = tomorrow.toISOString().slice(0, 10);
    checkOutInput.value = dayAfter.toISOString().slice(0, 10);
})();
=======
const API_URL = "http://localhost:3000/api/bookings";

let allBookings = [];


/* =========================
   LOAD BOOKINGS
========================= */

async function loadBookings() {

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Không thể kết nối API");
        }

        const result = await response.json();

        if (result.success) {

            allBookings = result.bookings || [];

            updateSummary();

            renderBookings(allBookings);

        } else {

            throw new Error("API trả về lỗi");

        }

    } catch (error) {

        console.error("Lỗi load booking:", error);

        allBookings = [];

        updateSummary();

        renderBookings([]);

    }

}


/* =========================
   FORMAT DATE
========================= */

function formatDate(dateString) {

    if (!dateString) {
        return "-";
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return "-";
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}


/* =========================
   FORMAT MONEY
========================= */

function formatMoney(value) {

    if (value === null || value === undefined) {
        return "0 ₫";
    }

    return Number(value).toLocaleString("vi-VN") + " ₫";
}


/* =========================
   STATUS
========================= */

function getStatusText(status) {

    const statusMap = {

        PENDING: "Chờ xác nhận",

        CONFIRMED: "Đã xác nhận",

        CHECKED_IN: "Đã nhận phòng",

        COMPLETED: "Hoàn tất",

        CANCELLED: "Đã hủy",

        NO_SHOW: "Không đến"

    };

    return statusMap[status] || status;

}


function getStatusClass(status) {

    const classMap = {

        PENDING: "pending",

        CONFIRMED: "confirmed",

        CHECKED_IN: "checked-in",

        COMPLETED: "completed",

        CANCELLED: "cancelled",

        NO_SHOW: "no-show"

    };

    return classMap[status] || "";

}


/* =========================
   UPDATE SUMMARY
========================= */

function updateSummary() {

    const total = allBookings.length;

    const confirmed = allBookings.filter(
        booking => booking.TrangThai === "CONFIRMED"
    ).length;

    const pending = allBookings.filter(
        booking => booking.TrangThai === "PENDING"
    ).length;

    const cancelled = allBookings.filter(
        booking => booking.TrangThai === "CANCELLED"
    ).length;


    document.getElementById("totalBookings").textContent = total;

    document.getElementById("confirmedBookings").textContent = confirmed;

    document.getElementById("pendingBookings").textContent = pending;

    document.getElementById("cancelledBookings").textContent = cancelled;

}


/* =========================
   RENDER TABLE
========================= */

function renderBookings(bookings) {

    const tableBody =
        document.getElementById("bookingTableBody");

    const emptyState =
        document.getElementById("emptyState");

    const bookingCount =
        document.getElementById("bookingCount");


    tableBody.innerHTML = "";


    bookingCount.textContent =
        `${bookings.length} đặt phòng`;


    if (bookings.length === 0) {

        emptyState.style.display = "block";

        return;

    }


    emptyState.style.display = "none";


    bookings.forEach(booking => {

        const row = document.createElement("tr");


        row.innerHTML = `

            <td>
                <span class="booking-code">
                    ${booking.MaBookingCode || "-"}
                </span>
            </td>

            <td>
                <span class="customer-name">
                    ${booking.HoTen || "-"}
                </span>
            </td>

            <td>
                ${formatDate(booking.NgayDat)}
            </td>

            <td>
                ${formatDate(booking.NgayNhanDuKien)}
            </td>

            <td>
                ${formatDate(booking.NgayTraDuKien)}
            </td>

            <td>
                ${booking.SoNguoiDuKien || 0}
            </td>

            <td>
                ${formatMoney(booking.TienCocDuKien)}
            </td>

            <td>

                <span class="status ${getStatusClass(booking.TrangThai)}">

                    ${getStatusText(booking.TrangThai)}

                </span>

            </td>

            <td>

                <button
                    class="detail-btn"
                    onclick="showBookingDetail('${booking.MaDatPhong}')"
                >
                    Chi tiết
                </button>

            </td>

        `;

        tableBody.appendChild(row);

    });

}


/* =========================
   SEARCH + FILTER
========================= */

function filterBookings() {

    const searchInput =
        document.getElementById("searchInput");

    const statusFilter =
        document.getElementById("statusFilter");


    const keyword =
        searchInput.value
            .trim()
            .toLowerCase();


    const selectedStatus =
        statusFilter.value;


    const filtered =
        allBookings.filter(booking => {

            const bookingCode =
                String(booking.MaBookingCode || "")
                    .toLowerCase();

            const customerName =
                String(booking.HoTen || "")
                    .toLowerCase();


            const matchSearch =
                bookingCode.includes(keyword) ||
                customerName.includes(keyword);


            const matchStatus =
                selectedStatus === "ALL" ||
                booking.TrangThai === selectedStatus;


            return matchSearch && matchStatus;

        });


    renderBookings(filtered);

}


/* =========================
   BOOKING DETAIL
========================= */

function showBookingDetail(maDatPhong) {

    const booking =
        allBookings.find(
            item => item.MaDatPhong === maDatPhong
        );


    if (!booking) {
        return;
    }


    const room =
        booking.SoPhong || "Chưa phân phòng";


    alert(

        `THÔNG TIN ĐẶT PHÒNG\n\n` +

        `Mã đặt phòng: ${booking.MaBookingCode || "-"}\n` +

        `Khách hàng: ${booking.HoTen || "-"}\n` +

        `Phòng: ${room}\n` +

        `Ngày đặt: ${formatDate(booking.NgayDat)}\n` +

        `Ngày nhận: ${formatDate(booking.NgayNhanDuKien)}\n` +

        `Ngày trả: ${formatDate(booking.NgayTraDuKien)}\n` +

        `Số người: ${booking.SoNguoiDuKien || 0}\n` +

        `Tiền cọc: ${formatMoney(booking.TienCocDuKien)}\n` +

        `Trạng thái: ${getStatusText(booking.TrangThai)}\n\n` +

        `Ghi chú: ${booking.GhiChu || "-"}`

    );

}


/* =========================
   ADD BOOKING
========================= */

document
    .getElementById("addBookingBtn")
    .addEventListener("click", function () {

        alert("Chức năng Đặt phòng mới sẽ được thực hiện ở trang đặt phòng.");

    });


/* =========================
   EVENTS
========================= */

document
    .getElementById("searchInput")
    .addEventListener("input", filterBookings);


document
    .getElementById("statusFilter")
    .addEventListener("change", filterBookings);


/* =========================
   START
========================= */

loadBookings();
>>>>>>> feature/admin
