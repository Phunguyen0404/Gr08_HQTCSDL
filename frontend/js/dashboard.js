document.addEventListener("DOMContentLoaded", loadDashboard);

async function loadDashboard() {
    try {
        const response = await fetch("http://localhost:3000/api/dashboard");

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(
                data.message || "Không thể lấy dữ liệu Dashboard"
            );
        }

        console.log("DỮ LIỆU DASHBOARD:", data);

        // ==========================================
        // 1. THẺ THỐNG KÊ
        // ==========================================

        const statCards = document.querySelectorAll(".stat-card");

        // ------------------------------------------
        // Doanh thu hôm nay
        // Backend: data.revenue.today
        // ------------------------------------------
        if (statCards[0]) {
            const title = statCards[0].querySelector("h2");

            if (title) {
                title.textContent = formatMoney(
                    data.revenue?.today || 0
                );
            }

            const text = statCards[0].querySelector("p");

            if (text) {
                text.innerHTML =
                    '<span>Dữ liệu thực tế từ hệ thống</span>';
            }
        }

        // ------------------------------------------
        // Doanh thu tháng
        // Backend: data.revenue.month
        // ------------------------------------------
        if (statCards[1]) {
            const title = statCards[1].querySelector("h2");

            if (title) {
                title.textContent = formatMoney(
                    data.revenue?.month || 0
                );
            }

            const text = statCards[1].querySelector("p");

            if (text) {
                text.innerHTML =
                    '<span>Dữ liệu thực tế từ hệ thống</span>';
            }
        }

        // ------------------------------------------
        // Tỷ lệ lấp đầy
        // Backend: data.occupancy
        // ------------------------------------------
        if (statCards[2]) {
            const title = statCards[2].querySelector("h2");

            if (title) {
                title.textContent =
                    `${Number(data.occupancy || 0).toFixed(2)}%`;
            }

            const text = statCards[2].querySelector("p");

            if (text) {
                text.innerHTML =
                    '<span>Dữ liệu thực tế từ hệ thống</span>';
            }
        }

        // ------------------------------------------
        // Tài khoản nhân viên
        // Backend: data.staff.total
        // ------------------------------------------
        if (statCards[3]) {
            const title = statCards[3].querySelector("h2");

            if (title) {
                title.textContent =
                    data.staff?.total || 0;
            }

            const activeText =
                statCards[3].querySelector(".active-text");

            if (activeText) {
                activeText.textContent =
                    `${data.staff?.active || 0} đang hoạt động`;
            }
        }


        // ==========================================
        // 2. BIỂU ĐỒ DOANH THU
        // ==========================================

        const bars =
            document.querySelectorAll(".bar");

        const chartData =
            data.revenueChart || [];

        // Xóa toàn bộ chiều cao giả
        bars.forEach(bar => {
            bar.style.height = "0%";
        });

        if (chartData.length > 0 && bars.length > 0) {

            const values = chartData.map(item =>
                Number(item.doanhThu || 0)
            );

            const maxRevenue =
                Math.max(...values, 1);

            chartData.forEach((item, index) => {

                if (index >= bars.length) {
                    return;
                }

                const value =
                    Number(item.doanhThu || 0);

                const height =
                    (value / maxRevenue) * 100;

                bars[index].style.height =
                    `${height}%`;

                const wrapper =
                    bars[index].closest(".bar-wrapper");

                if (wrapper) {

                    const label =
                        wrapper.querySelector("span");

                    if (label) {
                        label.textContent =
                            formatChartDate(item.ngay);
                    }
                }

                // Hiện doanh thu khi rê chuột
                bars[index].title =
                    formatMoney(value);
            });
        }


        // ==========================================
        // 3. TỶ LỆ LẤP ĐẦY
        // ==========================================

        const occupancyRate =
            Number(data.occupancy || 0);

        const circle =
            document.querySelector(".circle");

        if (circle) {
            circle.style.background =
                `conic-gradient(
                    #c59b5f 0 ${occupancyRate}%,
                    #eee ${occupancyRate}% 100%
                )`;
        }

        const circleValue =
            document.querySelector(
                ".circle-inner strong"
            );

        if (circleValue) {
            circleValue.textContent =
                `${occupancyRate.toFixed(2)}%`;
        }


        // ==========================================
        // 4. TRẠNG THÁI PHÒNG
        // ==========================================

        const roomCounts = {
            AVAILABLE: 0,
            OCCUPIED: 0,
            CLEANING: 0,
            MAINTENANCE: 0,
            OUT_OF_SERVICE: 0
        };

        (data.rooms || []).forEach(room => {

            const status =
                room.TrangThai;

            if (
                Object.prototype.hasOwnProperty.call(
                    roomCounts,
                    status
                )
            ) {
                roomCounts[status] =
                    Number(room.soLuong || 0);
            }
        });

        const roomStatus =
            document.querySelector(".room-status");

        if (roomStatus) {

            const rows =
                roomStatus.children;

            // Đang sử dụng
            if (rows[0]) {
                const number =
                    rows[0].querySelector("strong");

                if (number) {
                    number.textContent =
                        `${roomCounts.OCCUPIED} phòng`;
                }
            }

            // Phòng trống
            if (rows[1]) {
                const number =
                    rows[1].querySelector("strong");

                if (number) {
                    number.textContent =
                        `${roomCounts.AVAILABLE} phòng`;
                }
            }

            // Đang dọn
            if (rows[2]) {
                const number =
                    rows[2].querySelector("strong");

                if (number) {
                    number.textContent =
                        `${roomCounts.CLEANING} phòng`;
                }
            }

            // Bảo trì
            if (rows[3]) {
                const number =
                    rows[3].querySelector("strong");

                if (number) {
                    number.textContent =
                        `${roomCounts.MAINTENANCE} phòng`;
                }
            }
        }


        // ==========================================
        // 5. DANH SÁCH NHÂN VIÊN
        // ==========================================

        const staffTableBody =
            document.querySelector(
                ".staff-panel table tbody"
            );

        if (staffTableBody) {

            staffTableBody.innerHTML = "";

            (data.staffList || []).forEach(staff => {

                const row =
                    document.createElement("tr");

                const initials =
                    getInitials(staff.HoTen);

                // Trạng thái tài khoản
                let statusText =
                    "Đang hoạt động";

                let statusClass =
                    "active";

                if (
                    staff.trangThaiTaiKhoan === "LOCKED"
                ) {
                    statusText =
                        "Đã khóa";

                    statusClass =
                        "locked";
                }

                if (
                    staff.trangThaiTaiKhoan === "INACTIVE"
                ) {
                    statusText =
                        "Không hoạt động";

                    statusClass =
                        "locked";
                }

                // Vai trò thật từ TAI_KHOAN
                let roleText =
                    staff.VaiTro || "STAFF";

                if (roleText === "ADMIN") {
                    roleText = "Admin";
                } else if (roleText === "STAFF") {
                    roleText = "Staff";
                } else if (roleText === "CUSTOMER") {
                    roleText = "Customer";
                }

                row.innerHTML = `
                    <td>
                        <div class="staff-info">

                            <div class="staff-avatar">
                                ${escapeHTML(initials)}
                            </div>

                            <div>
                                <strong>
                                    ${escapeHTML(
                                        staff.HoTen
                                    )}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        staff.MaNV
                                    )}
                                </small>
                            </div>

                        </div>
                    </td>

                    <td>
                        ${escapeHTML(
                            staff.Email || ""
                        )}
                    </td>

                    <td>
                        <span class="role staff">
                            ${escapeHTML(roleText)}
                        </span>
                    </td>

                    <td>
                        <span class="status ${statusClass}">
                            ${statusText}
                        </span>
                    </td>

                    <td>
                        ${formatDate(
                            staff.NgayVaoLam
                        )}
                    </td>

                    <td>
                        <button class="btn-action">
                            ${
                                staff.trangThaiTaiKhoan ===
                                "LOCKED"
                                    ? "Mở khóa"
                                    : "Khóa"
                            }
                        </button>
                    </td>
                `;

                staffTableBody.appendChild(row);
            });
        }

    } catch (error) {

        console.error(
            "Lỗi kết nối Dashboard:",
            error
        );

        // Không để dữ liệu giả tiếp tục tồn tại
        clearFakeDashboardData();
    }
}


// ==========================================
// ĐỊNH DẠNG TIỀN
// ==========================================

function formatMoney(value) {

    const number =
        Number(value || 0);

    return (
        new Intl.NumberFormat("vi-VN")
            .format(number)
        + " ₫"
    );
}


// ==========================================
// ĐỊNH DẠNG NGÀY
// ==========================================

function formatDate(value) {

    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (isNaN(date.getTime())) {
        return value;
    }

    const day =
        String(date.getDate())
            .padStart(2, "0");

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const year =
        date.getFullYear();

    return `${day}/${month}/${year}`;
}


// ==========================================
// ĐỊNH DẠNG NGÀY CHO BIỂU ĐỒ
// ==========================================

function formatChartDate(value) {

    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (isNaN(date.getTime())) {
        return value;
    }

    const day =
        String(date.getDate())
            .padStart(2, "0");

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    return `${day}/${month}`;
}


// ==========================================
// LẤY CHỮ CÁI ĐẦU TÊN
// ==========================================

function getInitials(name) {

    if (!name) {
        return "";
    }

    const words =
        name.trim().split(/\s+/);

    if (words.length === 1) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        words[0].charAt(0) +
        words[words.length - 1].charAt(0)
    ).toUpperCase();
}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================
// XÓA DỮ LIỆU GIẢ NẾU API LỖI
// ==========================================

function clearFakeDashboardData() {

    const statCards =
        document.querySelectorAll(".stat-card");

    if (statCards[0]) {
        const title =
            statCards[0].querySelector("h2");

        if (title) {
            title.textContent = "0 ₫";
        }
    }

    if (statCards[1]) {
        const title =
            statCards[1].querySelector("h2");

        if (title) {
            title.textContent = "0 ₫";
        }
    }

    if (statCards[2]) {
        const title =
            statCards[2].querySelector("h2");

        if (title) {
            title.textContent = "0%";
        }
    }

    if (statCards[3]) {
        const title =
            statCards[3].querySelector("h2");

        if (title) {
            title.textContent = "0";
        }
    }

    document
        .querySelectorAll(".bar")
        .forEach(bar => {
            bar.style.height = "0%";
        });
}