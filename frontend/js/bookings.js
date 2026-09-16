const API_URL = "/api/bookings";

let allBookings = [];


/* =========================
   LOAD BOOKINGS
========================= */

async function loadBookings() {

    try {

        const token = localStorage.getItem('authToken');
        const response = await fetch(API_URL, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (!response.ok) {
            throw new Error("Không thể kết nối API");
        }

        const result = await response.json();

        if (result.success) {

            allBookings = result.data || result.bookings || [];

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
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <button
                        class="detail-btn"
                        style="padding:5px 10px; font-size:12px;"
                        onclick="showBookingDetail('${booking.MaDatPhong}')"
                    >
                        Chi tiết
                    </button>
                    ${(booking.TrangThai === 'PENDING' || booking.TrangThai === 'CONFIRMED') ? `
                        <button
                            type="button"
                            style="padding:5px 10px; font-size:12px; background:#16a34a; color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:600;"
                            onclick="handleCheckIn('${booking.MaDatPhong}')"
                        >
                            Nhận phòng
                        </button>
                        <button
                            type="button"
                            style="padding:5px 10px; font-size:12px; background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; border-radius:6px; cursor:pointer; font-weight:600;"
                            onclick="handleCancelBooking('${booking.MaDatPhong}')"
                        >
                            Hủy
                        </button>
                    ` : ''}
                    ${booking.TrangThai === 'CHECKED_IN' ? `
                        <button
                            type="button"
                            style="padding:5px 10px; font-size:12px; background:#2563eb; color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:600;"
                            onclick="handleCheckOut('${booking.MaDatPhong}')"
                        >
                            Trả phòng & HĐ
                        </button>
                    ` : ''}
                </div>
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
   BOOKING DETAIL & ACTIONS
========================= */

async function showBookingDetail(maDatPhong) {
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_URL}/${maDatPhong}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await res.json();
        const b = data.data || data;

        const roomsText = (b.rooms || []).map(r => `• Phòng ${r.SoPhong || r.MaPhong} (${r.TenLoaiPhong || 'Standard'}) - ${formatMoney(r.DonGiaDat || r.GiaCoBan)}`).join('\n') || b.rooms || 'Chưa phân phòng';

        alert(
            `CHI TIẾT ĐƠN ĐẶT PHÒNG [${b.MaBookingCode || b.MaDatPhong}]\n\n` +
            `• Khách hàng: ${b.HoTen || "-"} (SĐT: ${b.SoDienThoai || "Không có"})\n` +
            `• CCCD/CMND: ${b.CCCD || "-"}\n` +
            `• Ngày đặt: ${formatDate(b.NgayDat)}\n` +
            `• Ngày nhận dự kiến: ${formatDate(b.NgayNhanDuKien)}\n` +
            `• Ngày trả dự kiến: ${formatDate(b.NgayTraDuKien)}\n` +
            `• Số lượng khách: ${b.SoNguoiDuKien || 1} người\n` +
            `• Tiền cọc: ${formatMoney(b.TienCocDuKien)}\n` +
            `• Trạng thái: ${getStatusText(b.TrangThai)}\n\n` +
            `DANH SÁCH PHÒNG:\n${roomsText}\n\n` +
            `Ghi chú: ${b.GhiChu || "-"}`
        );
    } catch (err) {
        alert('Lỗi lấy chi tiết: ' + err.message);
    }
}

async function handleCheckIn(maDatPhong) {
    const confirmed = confirm(`Xác nhận KHÁCH ĐÃ ĐẾN NHẬN PHÒNG cho đơn ${maDatPhong}?\n\nPhòng sẽ được chuyển sang trạng thái "Đang thuê" (Occupied).`);
    if (!confirmed) return;

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_URL}/${maDatPhong}/check-in`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ staffId: 'NV001' })
        });

        const data = await res.json();
        if (data.success) {
            alert('✓ Check-in thành công! Đã tạo thông tin lưu trú.');
            loadBookings();
        } else {
            alert('Không thể Check-in: ' + (data.message || 'Lỗi server'));
        }
    } catch (err) {
        alert('Lỗi kết nối Check-in: ' + err.message);
    }
}

async function handleCheckOut(maDatPhong) {
    const confirmed = confirm(`Xác nhận TRẢ PHÒNG & XUẤT HÓA ĐƠN cho đơn ${maDatPhong}?\n\nHệ thống sẽ tính tổng tiền phòng, sinh hóa đơn và chuyển phòng sang trạng thái "Đang dọn dẹp" (Cleaning).`);
    if (!confirmed) return;

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_URL}/${maDatPhong}/check-out`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ staffId: 'NV001' })
        });

        const data = await res.json();
        if (data.success) {
            alert(`✓ Trả phòng thành công!\n• Mã hóa đơn: ${data.data?.maHoaDon || ''}\n• Tổng tiền: ${formatMoney(data.data?.totalAmount || 0)}\n\nVui lòng kiểm tra tại mục Quản lý Hóa đơn.`);
            loadBookings();
        } else {
            alert('Không thể Check-out: ' + (data.message || 'Lỗi server'));
        }
    } catch (err) {
        alert('Lỗi kết nối Check-out: ' + err.message);
    }
}

async function handleCancelBooking(maDatPhong) {
    const confirmed = confirm(`Bạn có chắc chắn muốn HỦY đơn đặt phòng ${maDatPhong} không?`);
    if (!confirmed) return;

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_URL}/${maDatPhong}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        });

        const data = await res.json();
        if (data.success) {
            alert('✓ Hủy đơn đặt phòng thành công.');
            loadBookings();
        } else {
            alert('Không thể hủy đơn: ' + (data.message || 'Lỗi server'));
        }
    } catch (err) {
        alert('Lỗi kết nối hủy đơn: ' + err.message);
    }
}


/* =========================
   ADD BOOKING
========================= */

document
    .getElementById("addBookingBtn")
    .addEventListener("click", function () {
        window.location.href = "walkin-booking.html";
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
