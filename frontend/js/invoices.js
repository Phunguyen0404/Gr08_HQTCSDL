// ============================================================
// INVOICE PAGE
// ============================================================

const API_URL = "/api/invoices";

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


        const token = localStorage.getItem('authToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
        const response =
            await fetch(API_URL, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });


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
                <td colspan="10"
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
                <td colspan="10"
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

                        <!-- THAO TÁC -->
                        <td>
                            <button type="button" style="padding:5px 12px; font-size:12px; border-radius:6px; border:1px solid #087ba7; color:#087ba7; background:#fff; cursor:pointer; font-weight:600;" onclick="viewInvoiceDetail('${escapeHTML(invoice.MaHoaDon)}')">
                                👁️ Xem
                            </button>
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

// ============================================================
// MODAL CHI TIẾT HÓA ĐƠN
// ============================================================

window.viewInvoiceDetail = async function (id) {
    const modal = document.getElementById("invoiceDetailModal");
    const content = document.getElementById("modalInvContent");
    const actions = document.getElementById("modalInvActions");
    const title = document.getElementById("modalInvTitle");

    if (!modal) return;
    modal.style.display = "flex";
    title.textContent = `Chi tiết hóa đơn ${id}`;
    content.innerHTML = `<div style="text-align:center; padding:30px; color:#64748b;">Đang tải chi tiết hóa đơn...</div>`;

    try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const res = await fetch(`/api/invoices/${id}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const json = await res.json();

        if (!json.success || !json.data) {
            content.innerHTML = `<div style="color:#dc2626; padding:20px;">${json.message || 'Không thể lấy thông tin hóa đơn.'}</div>`;
            return;
        }

        const inv = json.data;
        const roomsHtml = (inv.rooms || []).map(r => `
            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px dashed #e2e8f0; font-size:13px;">
                <span>Phòng <strong>${r.SoPhong || r.MaPhong}</strong> (${r.TenLoaiPhong || 'Standard'})</span>
                <strong>${formatMoney(r.DonGiaDat || 0)} / đêm</strong>
            </div>
        `).join('') || '<div style="font-size:13px; color:#64748b;">Không có thông tin phòng.</div>';

        const paymentsHtml = (inv.payments || []).map(p => `
            <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px dashed #e2e8f0; font-size:13px;">
                <span>${formatDate(p.NgayThanhToan)} (${p.PhuongThuc || 'CASH'})</span>
                <strong style="color:#166534;">+ ${formatMoney(p.SoTien || 0)}</strong>
            </div>
        `).join('') || '<div style="font-size:13px; color:#64748b;">Chưa có giao dịch thanh toán nào.</div>';

        const daThanhToan = Number(inv.DaThanhToan || 0);
        const tongTien = Number(inv.TongTien || 0);
        const conLai = Math.max(0, tongTien - daThanhToan);
        const isPaid = String(inv.TrangThai || '').toUpperCase() === 'PAID' || conLai <= 0;

        content.innerHTML = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; font-size:13px;">
                <div>
                    <div style="color:#64748b;">Khách hàng</div>
                    <strong style="font-size:15px; color:#0f172a;">${escapeHTML(inv.HoTen || 'Khách vãng lai')}</strong>
                    <div style="color:#64748b; margin-top:2px;">Mã KH: ${escapeHTML(inv.MaKH || '-')}</div>
                    <div style="color:#64748b;">SĐT: ${escapeHTML(inv.SoDienThoai || '-')}</div>
                </div>
                <div>
                    <div style="color:#64748b;">Lưu trú & Đơn đặt</div>
                    <strong style="font-size:14px; color:#0f172a;">Mã Booking: ${escapeHTML(inv.MaBookingCode || '-')}</strong>
                    <div style="color:#64748b; margin-top:2px;">Mã lưu trú: ${escapeHTML(inv.MaLuuTru || '-')}</div>
                    <div style="color:#64748b;">Ngày lập: ${formatDate(inv.NgayLap)}</div>
                </div>
            </div>

            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px; margin-bottom:16px;">
                <div style="font-weight:700; font-size:13px; margin-bottom:8px; color:#334155;">Danh sách phòng lưu trú:</div>
                ${roomsHtml}
            </div>

            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px; margin-bottom:16px;">
                <div style="font-weight:700; font-size:13px; margin-bottom:8px; color:#334155;">Lịch sử thanh toán:</div>
                ${paymentsHtml}
            </div>

            <div style="border-top:1px solid #cbd5e1; padding-top:12px; font-size:14px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                    <span>Tiền phòng:</span>
                    <span>${formatMoney(inv.TongTienPhong)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                    <span>Thuế VAT:</span>
                    <span>${formatMoney(inv.Thue)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                    <span>Giảm giá:</span>
                    <span>${formatMoney(inv.GiamGia)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:16px; font-weight:700; color:#0f172a;">
                    <span>Tổng hóa đơn:</span>
                    <span>${formatMoney(inv.TongTien)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:6px; color:#166534; font-weight:600;">
                    <span>Đã thanh toán:</span>
                    <span>${formatMoney(daThanhToan)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:700; color:${isPaid ? '#166534' : '#dc2626'};">
                    <span>Còn lại cần thu:</span>
                    <span>${formatMoney(conLai)}</span>
                </div>
            </div>
        `;

        actions.innerHTML = `
            <button type="button" onclick="closeInvoiceModal()" style="padding:8px 16px; border:1px solid #cbd5e1; background:#fff; border-radius:8px; cursor:pointer; font-weight:600;">Đóng</button>
            ${!isPaid ? `
                <button type="button" onclick="payInvoice('${id}', ${conLai})" style="padding:8px 18px; border:none; background:#16a34a; color:#fff; border-radius:8px; cursor:pointer; font-weight:600;">
                    💳 Thu tiền (${formatMoney(conLai)})
                </button>
            ` : '<span style="color:#166534; font-weight:700; font-size:14px; align-self:center;">✓ Đã thanh toán đủ</span>'}
        `;

    } catch (err) {
        content.innerHTML = `<div style="color:#dc2626; padding:20px;">Lỗi kết nối: ${err.message}</div>`;
    }
};

window.closeInvoiceModal = function () {
    const modal = document.getElementById("invoiceDetailModal");
    if (modal) modal.style.display = "none";
};

window.payInvoice = async function (id, amount) {
    const confirmPay = confirm(`Xác nhận thu ${formatMoney(amount)} cho hóa đơn ${id}?`);
    if (!confirmPay) return;

    try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const res = await fetch(`/api/invoices/${id}/pay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ amount, method: 'CASH' })
        });

        const data = await res.json();
        if (data.success) {
            alert('Đã ghi nhận thanh toán thành công!');
            closeInvoiceModal();
            loadInvoices();
        } else {
            alert('Lỗi: ' + (data.message || 'Không thể thanh toán'));
        }
    } catch (err) {
        alert('Lỗi kết nối: ' + err.message);
    }
};