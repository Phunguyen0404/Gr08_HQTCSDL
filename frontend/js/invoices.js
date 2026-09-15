// ============================================================
// INVOICE PAGE
// ============================================================

const API_URL = "http://localhost:3000/api/invoices";

let invoiceList = [];
let filteredInvoices = [];


// ============================================================
// DOM
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log(">>> INVOICE JS ĐÃ CHẠY <<<");

    loadInvoices();

    const searchInput =
        document.getElementById("invoiceSearch");

    const statusFilter =
        document.getElementById("statusFilter");


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterInvoices
        );

    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            filterInvoices
        );

    }

});


// ============================================================
// FORMAT MONEY
// ============================================================

function formatMoney(value) {

    const number = Number(value || 0);

    return number.toLocaleString(
        "vi-VN"
    ) + " đ";

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(value) {

    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString(
        "vi-VN"
    );

}


// ============================================================
// STATUS
// ============================================================

function getStatusText(status) {

    const value =
        String(status || "")
            .toUpperCase();


    if (value === "PAID") {
        return "Đã thanh toán";
    }


    if (value === "ISSUED") {
        return "Chưa thanh toán";
    }


    if (value === "CANCELLED") {
        return "Đã hủy";
    }


    if (value === "DRAFT") {
        return "Nháp";
    }


    return status || "-";

}


// ============================================================
// STATUS CLASS
// ============================================================

function getStatusClass(status) {

    const value =
        String(status || "")
            .toUpperCase();


    if (value === "PAID") {
        return "paid";
    }


    if (value === "ISSUED") {
        return "unpaid";
    }


    if (value === "CANCELLED") {
        return "cancelled";
    }


    return "other";

}


// ============================================================
// LOAD INVOICES
// ============================================================

async function loadInvoices() {

    const tbody =
        document.getElementById(
            "invoiceTableBody"
        );


    if (!tbody) {

        console.error(
            "Không tìm thấy #invoiceTableBody"
        );

        return;

    }


    // Hiển thị loading ban đầu

    tbody.innerHTML = `
        <tr>
            <td colspan="8"
                class="invoice-message">
                Đang tải dữ liệu hóa đơn...
            </td>
        </tr>
    `;


    try {

        console.log(
            ">>> ĐANG GỌI API:",
            API_URL
        );


        const response =
            await fetch(API_URL);


        console.log(
            ">>> HTTP STATUS:",
            response.status
        );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const result =
            await response.json();


        console.log(
            ">>> DỮ LIỆU HÓA ĐƠN:",
            result
        );


        if (!result.success) {

            throw new Error(
                result.message ||
                "API trả về lỗi"
            );

        }


        // ================================================
        // LẤY ĐÚNG invoices
        // ================================================

        invoiceList =
            Array.isArray(result.invoices)
                ? result.invoices
                : [];


        filteredInvoices =
            [...invoiceList];


        console.log(
            ">>> SỐ HÓA ĐƠN:",
            invoiceList.length
        );


        // ================================================
        // CẬP NHẬT THỐNG KÊ
        // ================================================

        updateSummary();


        // ================================================
        // HIỂN THỊ BẢNG
        // ================================================

        renderInvoices();


    }

    catch (error) {

        console.error(
            ">>> LỖI LOAD INVOICE:",
            error
        );


        tbody.innerHTML = `
            <tr>
                <td colspan="8"
                    class="invoice-message error">

                    Không thể tải dữ liệu hóa đơn.

                    <br>

                    <small>
                        ${error.message}
                    </small>

                </td>
            </tr>
        `;


        // Đưa thống kê về 0

        updateSummary([]);

    }

}


// ============================================================
// UPDATE SUMMARY
// ============================================================

function updateSummary() {

    const totalInvoices =
        document.getElementById(
            "totalInvoices"
        );


    const paidInvoices =
        document.getElementById(
            "paidInvoices"
        );


    const unpaidInvoices =
        document.getElementById(
            "unpaidInvoices"
        );


    const totalAmount =
        document.getElementById(
            "totalAmount"
        );


    const total =
        invoiceList.length;


    const paid =
        invoiceList.filter(
            invoice =>
                String(
                    invoice.TrangThai || ""
                ).toUpperCase() === "PAID"
        ).length;


    const unpaid =
        invoiceList.filter(
            invoice =>
                String(
                    invoice.TrangThai || ""
                ).toUpperCase() === "ISSUED"
        ).length;


    const amount =
        invoiceList.reduce(
            (sum, invoice) =>
                sum +
                Number(
                    invoice.TongTien || 0
                ),
            0
        );


    if (totalInvoices) {

        totalInvoices.textContent =
            total;

    }


    if (paidInvoices) {

        paidInvoices.textContent =
            paid;

    }


    if (unpaidInvoices) {

        unpaidInvoices.textContent =
            unpaid;

    }


    if (totalAmount) {

        totalAmount.textContent =
            formatMoney(amount);

    }

}


// ============================================================
// FILTER
// ============================================================

function filterInvoices() {

    const searchInput =
        document.getElementById(
            "invoiceSearch"
        );


    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    const keyword =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const status =
        statusFilter
            ? statusFilter.value
                .trim()
                .toUpperCase()
            : "";


    filteredInvoices =
        invoiceList.filter(
            invoice => {

                // ==========================================
                // SEARCH
                // ==========================================

                const searchText = `

                    ${invoice.MaHoaDon || ""}

                    ${invoice.HoTen || ""}

                    ${invoice.MaBookingCode || ""}

                    ${invoice.MaLuuTru || ""}

                    ${invoice.MaKH || ""}

                `
                    .toLowerCase();


                const matchSearch =
                    !keyword ||
                    searchText.includes(
                        keyword
                    );


                // ==========================================
                // STATUS
                // ==========================================

                const invoiceStatus =
                    String(
                        invoice.TrangThai || ""
                    ).toUpperCase();


                const matchStatus =
                    !status ||
                    invoiceStatus === status;


                return (
                    matchSearch &&
                    matchStatus
                );

            }
        );


    renderInvoices();

}


// ============================================================
// RENDER TABLE
// ============================================================

function renderInvoices() {

    const tbody =
        document.getElementById(
            "invoiceTableBody"
        );


    if (!tbody) {
        return;
    }


    // ================================================
    // KHÔNG CÓ DỮ LIỆU
    // ================================================

    if (
        !filteredInvoices ||
        filteredInvoices.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="8"
                    class="invoice-message">

                    Không có hóa đơn nào.

                </td>
            </tr>
        `;

        return;

    }


    // ================================================
    // RENDER
    // ================================================

    tbody.innerHTML =
        filteredInvoices
            .map(invoice => {

                const customer =
                    invoice.HoTen ||
                    "Khách vãng lai";


                const booking =
                    invoice.MaBookingCode ||
                    "-";


                const status =
                    getStatusText(
                        invoice.TrangThai
                    );


                const statusClass =
                    getStatusClass(
                        invoice.TrangThai
                    );


                return `

                    <tr>

                        <!-- MÃ HÓA ĐƠN -->

                        <td>

                            <strong>
                                ${escapeHTML(
                                    invoice.MaHoaDon || "-"
                                )}
                            </strong>

                        </td>


                        <!-- KHÁCH HÀNG -->

                        <td>

                            <div class="customer-cell">

                                <div class="customer-avatar">

                                    ${getInitials(
                                        customer
                                    )}

                                </div>


                                <div>

                                    <div class="customer-name">

                                        ${escapeHTML(
                                            customer
                                        )}

                                    </div>


                                    <div class="customer-code">

                                        ${escapeHTML(
                                            invoice.MaKH || ""
                                        )}

                                    </div>

                                </div>

                            </div>

                        </td>


                        <!-- BOOKING -->

                        <td>

                            <span class="booking-code">

                                ${escapeHTML(
                                    booking
                                )}

                            </span>

                        </td>


                        <!-- NGÀY LẬP -->

                        <td>

                            ${formatDate(
                                invoice.NgayLap
                            )}

                        </td>


                        <!-- TIỀN PHÒNG -->

                        <td>

                            ${formatMoney(
                                invoice.TongTienPhong
                            )}

                        </td>


                        <!-- THUẾ -->

                        <td>

                            ${formatMoney(
                                invoice.Thue
                            )}

                        </td>


                        <!-- GIẢM GIÁ -->

                        <td>

                            ${formatMoney(
                                invoice.GiamGia
                            )}

                        </td>


                        <!-- TỔNG TIỀN -->

                        <td>

                            <strong class="total-money">

                                ${formatMoney(
                                    invoice.TongTien
                                )}

                            </strong>

                        </td>


                        <!-- TRẠNG THÁI -->

                        <td>

                            <span
                                class="invoice-status ${statusClass}"
                            >

                                <span class="status-dot"></span>

                                ${status}

                            </span>

                        </td>

                    </tr>

                `;

            })
            .join("");

}


// ============================================================
// GET INITIALS
// ============================================================

function getInitials(name) {

    if (!name) {
        return "?";
    }


    const words =
        String(name)
            .trim()
            .split(/\s+/);


    if (words.length === 1) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}