const API_URL = "/api/staff";

let staffList = [];


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(value) {

    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("vi-VN");
}


// =====================================================
// GET STATUS
// =====================================================

function getStatus(staff) {

    return String(
        staff.trangThaiTaiKhoan ||
        staff.TrangThaiTaiKhoan ||
        staff.TrangThai ||
        staff.trangThaiNhanVien ||
        "ACTIVE"
    ).toUpperCase();
}


// =====================================================
// GET NAME
// =====================================================

function getName(staff) {

    return staff.HoTen || "Không có tên";
}


// =====================================================
// GET INITIALS
// =====================================================

function getInitials(name) {

    if (!name) {
        return "?";
    }

    const words = name.trim().split(/\s+/);

    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }

    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();
}


// =====================================================
// STATUS HTML
// =====================================================

function getStatusHTML(status) {

    if (status === "ACTIVE") {

        return `
            <span class="status-badge active">
                <span class="status-dot"></span>
                Hoạt động
            </span>
        `;
    }


    if (status === "LOCKED") {

        return `
            <span class="status-badge locked">
                <span class="status-dot"></span>
                Đã khóa
            </span>
        `;
    }


    if (status === "INACTIVE") {

        return `
            <span class="status-badge inactive">
                <span class="status-dot"></span>
                Không hoạt động
            </span>
        `;
    }


    return `
        <span class="status-badge inactive">
            <span class="status-dot"></span>
            ${status}
        </span>
    `;
}


// =====================================================
// LOAD STAFF
// =====================================================

async function loadStaff() {

    const tbody =
        document.getElementById("staffTableBody");


    if (!tbody) {
        console.error(
            "Không tìm thấy staffTableBody"
        );

        return;
    }


    tbody.innerHTML = `
        <tr>
            <td
                colspan="8"
                class="staff-message"
            >
                Đang tải dữ liệu nhân viên...
            </td>
        </tr>
    `;


    try {

        console.log(
            ">>> Đang gọi API:",
            API_URL
        );


        const response =
            await fetch(API_URL);


        console.log(
            ">>> HTTP:",
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
            ">>> API STAFF:",
            result
        );


        if (!result.success) {

            throw new Error(
                result.message ||
                "API trả về lỗi"
            );
        }


        if (!Array.isArray(result.data)) {

            throw new Error(
                "API không trả về danh sách nhân viên"
            );
        }


        staffList = result.data;


        console.log(
            ">>> Số nhân viên:",
            staffList.length
        );


        updateStatistics();

        renderStaff();

    }

    catch (error) {

        console.error(
            ">>> LỖI STAFF:",
            error
        );


        staffList = [];


        updateStatistics();


        tbody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="staff-message error-message"
                >
                    Không thể tải dữ liệu nhân viên.
                    <br>
                    ${error.message}
                </td>
            </tr>
        `;
    }
}


// =====================================================
// STATISTICS
// =====================================================

function updateStatistics() {

    const totalElement =
        document.getElementById("totalStaff");


    const activeElement =
        document.getElementById("activeStaff");


    const lockedElement =
        document.getElementById("lockedStaff");


    const countText =
        document.getElementById("staffCountText");


    const total =
        staffList.length;


    let active = 0;

    let locked = 0;


    staffList.forEach(function (staff) {

        const status =
            getStatus(staff);


        if (status === "ACTIVE") {
            active++;
        }


        if (status === "LOCKED") {
            locked++;
        }

    });


    if (totalElement) {
        totalElement.textContent = total;
    }


    if (activeElement) {
        activeElement.textContent = active;
    }


    if (lockedElement) {
        lockedElement.textContent = locked;
    }


    if (countText) {

        countText.textContent =
            `${total} nhân viên`;
    }
}


// =====================================================
// RENDER
// =====================================================

function renderStaff() {

    const tbody =
        document.getElementById("staffTableBody");


    if (!tbody) {
        return;
    }


    const searchInput =
        document.getElementById("searchInput");


    const statusFilter =
        document.getElementById("statusFilter");


    const keyword =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedStatus =
        statusFilter
            ? statusFilter.value.toUpperCase()
            : "ALL";


    const filteredStaff =
        staffList.filter(function (staff) {

            const name =
                String(staff.HoTen || "")
                    .toLowerCase();


            const email =
                String(staff.Email || "")
                    .toLowerCase();


            const phone =
                String(staff.SoDienThoai || "")
                    .toLowerCase();


            const maNV =
                String(staff.MaNV || "")
                    .toLowerCase();


            const username =
                String(staff.TenDangNhap || "")
                    .toLowerCase();


            const status =
                getStatus(staff);


            const matchesSearch =
                keyword === "" ||
                name.includes(keyword) ||
                email.includes(keyword) ||
                phone.includes(keyword) ||
                maNV.includes(keyword) ||
                username.includes(keyword);


            const matchesStatus =
                selectedStatus === "ALL" ||
                status === selectedStatus;


            return (
                matchesSearch &&
                matchesStatus
            );

        });


    if (filteredStaff.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="staff-message"
                >
                    Không tìm thấy nhân viên phù hợp.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        filteredStaff.map(function (staff) {

            const maNV =
                staff.MaNV || "-";


            const name =
                staff.HoTen || "-";


            const email =
                staff.Email || "-";


            const phone =
                staff.SoDienThoai || "-";


            const role =
                staff.ChucVu ||
                staff.VaiTro ||
                "-";


            const status =
                getStatus(staff);


            const username =
                staff.TenDangNhap || "";


            const ngayVaoLam =
                formatDate(
                    staff.NgayVaoLam
                );


            const initials =
                getInitials(name);


            return `
                <tr>

                    <td>
                        <span class="staff-id">
                            ${maNV}
                        </span>
                    </td>


                    <td>

                        <div class="staff-info">

                            <div class="staff-avatar">
                                ${initials}
                            </div>

                            <div>

                                <div class="staff-name">
                                    ${name}
                                </div>

                                <div class="staff-username">
                                    ${username}
                                </div>

                            </div>

                        </div>

                    </td>


                    <td>
                        ${email}
                    </td>


                    <td>
                        ${phone}
                    </td>


                    <td>
                        ${role}
                    </td>


                    <td>
                        ${getStatusHTML(status)}
                    </td>


                    <td>
                        ${ngayVaoLam}
                    </td>


                    <td>

                        <div class="action-buttons">

                            ${
                                status === "LOCKED"
                                ? `
                                    <button
                                        class="action-btn unlock-btn"
                                        type="button"
                                        onclick="unlockStaff('${staff.MaTaiKhoan || ""}')"
                                    >
                                        Mở khóa
                                    </button>
                                `
                                : `
                                    <button
                                        class="action-btn lock-btn"
                                        type="button"
                                        onclick="lockStaff('${staff.MaTaiKhoan || ""}')"
                                    >
                                        Khóa
                                    </button>
                                `
                            }

                        </div>

                    </td>

                </tr>
            `;

        }).join("");
}


// =====================================================
// SEARCH
// =====================================================

function setupSearch() {

    const input =
        document.getElementById("searchInput");


    if (!input) {
        return;
    }


    input.addEventListener(
        "input",
        renderStaff
    );
}


// =====================================================
// FILTER
// =====================================================

function setupFilter() {

    const filter =
        document.getElementById("statusFilter");


    if (!filter) {
        return;
    }


    filter.addEventListener(
        "change",
        renderStaff
    );
}


// =====================================================
// ADD STAFF
// =====================================================

function setupAddStaff() {

    const button =
        document.getElementById("addStaffBtn");


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            alert(
                "Chức năng thêm nhân viên sẽ được triển khai sau."
            );

        }
    );
}


// =====================================================
// LOCK
// =====================================================

function lockStaff(maTaiKhoan) {

    if (!maTaiKhoan) {

        alert(
            "Không xác định được mã tài khoản."
        );

        return;
    }


    alert(
        "Chức năng khóa tài khoản chưa kết nối API."
    );
}


// =====================================================
// UNLOCK
// =====================================================

function unlockStaff(maTaiKhoan) {

    if (!maTaiKhoan) {

        alert(
            "Không xác định được mã tài khoản."
        );

        return;
    }


    alert(
        "Chức năng mở khóa tài khoản chưa kết nối API."
    );
}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    window.location.href =
        "/login.html";
}


// =====================================================
// START
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupSearch();

        setupFilter();

        setupAddStaff();


        const logoutButton =
            document.getElementById("logoutBtn");


        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                logout
            );
        }


        loadStaff();

    }
);