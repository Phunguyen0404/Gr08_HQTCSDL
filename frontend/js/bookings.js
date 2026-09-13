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