// ============================================================
// MY BOOKINGS CONTROLLER - LUXURY RESORT THEME
// ============================================================

const STATUS_MAP = {
    PENDING: { label: 'Chờ xác nhận', class: 'status-pending' },
    CONFIRMED: { label: 'Đã xác nhận', class: 'status-confirmed' },
    CHECKED_IN: { label: 'Đang lưu trú', class: 'status-checked-in' },
    COMPLETED: { label: 'Đã hoàn tất', class: 'status-completed' },
    CANCELLED: { label: 'Đã hủy', class: 'status-cancelled' },
    NO_SHOW: { label: 'Vắng mặt', class: 'status-cancelled' }
};

let bookingPendingCancellation = null;

function formatCurrency(val) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatBookingTimestamp(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '-';

    return new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(date) + ' (GMT+7)';
}

async function loadMyBookings() {
    const session = typeof authGuard !== 'undefined' ? authGuard.getSession() : null;
    if (!session || !session.user) {
        window.location.href = '/login?redirect=my-bookings.html';
        return;
    }

    const greeting = document.getElementById('userGreeting');
    if (greeting) {
        const name = session.user.hoTen || session.user.username;
        greeting.innerHTML = `Xin chào, <strong style="color:var(--amber-dark);">${name}</strong>`;
    }

    const container = document.getElementById('bookingsList');
    const customerId = session.user.maKH || session.user.maTaiKhoan;

    try {
        const token = session.token;
        const res = await fetch(`/api/bookings?customerId=${encodeURIComponent(customerId)}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        const data = await res.json();
        const bookings = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        // Cancelled bookings remain in the database for audit purposes, but are
        // deliberately not shown in the customer's active-booking list.
        const visibleBookings = bookings.filter((booking) => (booking.TrangThai || booking.status) !== 'CANCELLED');

        if (visibleBookings.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 44px; margin-bottom: 12px;">📭</div>
                    <h3>Bạn chưa có kỳ lưu trú nào</h3>
                    <p>Hãy khám phá các loại phòng nghỉ dưỡng cao cấp và đặt kỳ lưu trú đầu tiên của bạn!</p>
                    <a href="customer-rooms.html" class="btn btn-amber" style="margin-top: 18px;">Khám phá phòng ngay</a>
                </div>
            `;
            return;
        }

        container.innerHTML = visibleBookings.map(b => {
            const statusConfig = STATUS_MAP[b.TrangThai || b.status] || { label: b.TrangThai, class: 'status-pending' };
            const canCancel = (b.TrangThai || b.status) === 'PENDING';
            const roomText = b.roomNames || b.rooms || 'Phòng tiêu chuẩn';

            return `
                <div class="booking-card" id="card-${b.MaDatPhong || b.bookingId}">
                    <div class="booking-header">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span class="booking-code">${b.MaBookingCode || b.bookingCode || b.MaDatPhong}</span>
                            <span style="font-size:13px; color:var(--muted);">Đặt lúc: ${formatBookingTimestamp(b.NgayDat || b.bookedAt)}</span>
                        </div>
                        <span class="booking-status ${statusConfig.class}">${statusConfig.label}</span>
                    </div>

                    <div class="booking-details-grid">
                        <div class="detail-item">
                            <label>Phòng nghỉ</label>
                            <strong>🏨 ${roomText}</strong>
                        </div>
                        <div class="detail-item">
                            <label>Thời gian lưu trú</label>
                            <strong>📅 ${formatDate(b.NgayNhanDuKien || b.checkIn)} ➔ ${formatDate(b.NgayTraDuKien || b.checkOut)}</strong>
                        </div>
                        <div class="detail-item">
                            <label>Số lượng khách</label>
                            <strong>👥 ${b.SoNguoiDuKien || b.guests || 1} khách</strong>
                        </div>
                        <div class="detail-item">
                            <label>Tiền cọc / Giá tạm tính</label>
                            <strong style="color:var(--amber-dark);">${formatCurrency(b.TienCocDuKien || b.deposit || b.totalRoomRate || 0)}</strong>
                        </div>
                    </div>

                    ${b.GhiChu ? `
                        <div style="font-size: 13.5px; color: var(--muted); background: var(--sand); padding: 10px 14px; border-radius: 4px; border-left: 3px solid var(--amber);">
                            <strong>Ghi chú:</strong> ${b.GhiChu}
                        </div>
                    ` : ''}

                    <div class="booking-footer">
                        <span style="font-size: 12px; color: var(--muted);">Mã đơn hệ thống: ${b.MaDatPhong || b.bookingId}</span>
                        ${canCancel ? `
                            <button type="button" class="btn-cancel" onclick="cancelCustomerBooking('${b.MaDatPhong || b.bookingId}')">
                                Hủy đơn đặt phòng
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Lỗi tải đơn đặt:', err);
        container.innerHTML = `<div class="empty-state"><p style="color:#dc2626;">Lỗi kết nối: ${err.message}</p></div>`;
    }
}

window.cancelCustomerBooking = function (bookingId) {
    bookingPendingCancellation = bookingId;
    document.getElementById('cancelBookingModal').style.display = 'flex';
};

window.closeCancelBookingModal = function () {
    document.getElementById('cancelBookingModal').style.display = 'none';
    bookingPendingCancellation = null;
};

window.closeCancelSuccessModal = function () {
    document.getElementById('cancelSuccessModal').style.display = 'none';
};

window.confirmCustomerCancellation = async function () {
    const bookingId = bookingPendingCancellation;
    if (!bookingId) return;

    const session = typeof authGuard !== 'undefined' ? authGuard.getSession() : null;
    if (!session || !session.user) return;

    const confirmButton = document.getElementById('confirmCancelBtn');

    try {
        confirmButton.disabled = true;
        confirmButton.textContent = 'Đang hủy...';
        const token = session.token;
        const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
                customerId: session.user.maKH || session.user.maTaiKhoan
            })
        });

        const data = await res.json();
        if (res.ok && data.success) {
            closeCancelBookingModal();
            loadMyBookings();
            document.getElementById('cancelSuccessModal').style.display = 'flex';
        } else {
            alert('Không thể hủy đơn: ' + (data.message || 'Lỗi xử lý'));
        }
    } catch (err) {
        alert('Lỗi kết nối hủy đơn: ' + err.message);
    } finally {
        confirmButton.disabled = false;
        confirmButton.textContent = 'Xác nhận hủy';
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    if (typeof authGuard !== 'undefined') {
        authGuard.requireAuth(['CUSTOMER', 'ADMIN']);
    }
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        authGuard.logout();
    });
    loadMyBookings();
});
