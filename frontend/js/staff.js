// ============================================================
// STAFF PAGE
// ============================================================

const API_URL =
    "http://localhost:3000/api/staff";

let staffList = [];


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (
        isNaN(
            date.getTime()
        )
    ) {
        return "-";
    }

    return date.toLocaleDateString(
        "vi-VN"
    );

}


// ============================================================
// GET ACCOUNT STATUS
// ============================================================

function getAccountStatus(staff) {

    return String(

        staff.trangThaiTaiKhoan ||

        staff.TrangThaiTaiKhoan ||

        staff.trangThaiNhanVien ||

        staff.TrangThai ||

        "ACTIVE"

    ).toUpperCase();

}


// ============================================================
// GET NAME
// ============================================================

function getName(staff) {

    return (

        staff.HoTen ||

        staff.hoTen ||

        staff.Ho_Ten ||

        "Không có tên"

    );

}


// ============================================================
// GET EMAIL
// ============================================================

function getEmail(staff) {

    const email =

        staff.Email ||

        staff.EmailNV ||

        staff.email ||

        staff.emailNV ||

        "";

    return email
        ? String(email).trim()
        : "-";

}


// ============================================================
// GET PHONE
// ============================================================

function getPhone(staff) {

    const phone =

        staff.SoDienThoai ||

        staff.SoDienThoaiNV ||

        staff.soDienThoai ||

        staff.soDienThoaiNV ||

        staff.SoDienThoaiNhanVien ||

        "";

    return phone
        ? String(phone).trim()
        : "-";

}


// ============================================================
// GET ADDRESS
// ============================================================

function getAddress(staff) {

    const address =

        staff.DiaChi ||

        staff.DiaChiNV ||

        staff.diaChi ||

        staff.diaChiNV ||

        "";

    return address
        ? String(address).trim()
        : "-";

}


// ============================================================
// GET ROLE
// ============================================================

function getRole(staff) {

    return (

        staff.ChucVu ||

        staff.VaiTro ||

        staff.chucVu ||

        staff.vaiTro ||

        "-"

    );

}


// ============================================================
// GET ACCOUNT CODE
// ============================================================

function getAccountCode(staff) {

    return (

        staff.MaTaiKhoan ||

        staff.maTaiKhoan ||

        "-"

    );

}


// ============================================================
// GET USERNAME
// ============================================================

function getUsername(staff) {

    return (

        staff.TenDangNhap ||

        staff.tenDangNhap ||

        "-"

    );

}


// ============================================================
// GET CCCD
// ============================================================

function getCCCD(staff) {

    return (

        staff.CCCD ||

        staff.cccd ||

        "-"

    );

}


// ============================================================
// GET GENDER
// ============================================================

function getGender(staff) {

    return (

        staff.GioiTinh ||

        staff.GioiTinhNV ||

        staff.gioiTinh ||

        staff.gioiTinhNV ||

        "-"

    );

}


// ============================================================
// INITIALS
// ============================================================

function getInitials(name) {

    if (!name) {

        return "NV";

    }

    const words =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (
        words.length === 1
    ) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();

    }

    return (

        words[0][0] +

        words[
            words.length - 1
        ][0]

    ).toUpperCase();

}


// ============================================================
// STATUS TEXT
// ============================================================

function getStatusText(status) {

    if (status === "ACTIVE") {

        return "Đang hoạt động";

    }

    if (status === "LOCKED") {

        return "Đã khóa";

    }

    if (status === "INACTIVE") {

        return "Không hoạt động";

    }

    return "-";

}


// ============================================================
// STATUS HTML
// ============================================================

function getStatusHTML(status) {

    if (status === "ACTIVE") {

        return `

            <span
                class="status-badge active"
            >

                <span
                    class="status-dot"
                ></span>

                Đang hoạt động

            </span>

        `;

    }


    if (status === "LOCKED") {

        return `

            <span
                class="status-badge locked"
            >

                <span
                    class="status-dot"
                ></span>

                Đã khóa

            </span>

        `;

    }


    if (status === "INACTIVE") {

        return `

            <span
                class="status-badge inactive"
            >

                <span
                    class="status-dot"
                ></span>

                Không hoạt động

            </span>

        `;

    }


    return `

        <span
            class="status-badge"
        >

            ${escapeHTML(status)}

        </span>

    `;

}


// ============================================================
// LOAD STAFF
// ============================================================

async function loadStaff() {

    const tbody =
        document.getElementById(
            "staffTableBody"
        );


    if (!tbody) {

        console.error(
            "Không tìm thấy #staffTableBody"
        );

        return;

    }


    try {

        console.log(
            "========================================"
        );

        console.log(
            ">>> ĐANG GỌI API STAFF"
        );

        console.log(
            ">>> URL:",
            API_URL
        );


        const response =
            await fetch(
                API_URL
            );


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
            ">>> API STAFF:",
            result
        );


        if (
            !result.success
        ) {

            throw new Error(
                result.message ||
                "API trả về lỗi"
            );

        }


        if (
            !Array.isArray(
                result.data
            )
        ) {

            throw new Error(
                "API không trả về danh sách nhân viên"
            );

        }


        staffList =
            result.data;


        console.log(
            ">>> SỐ NHÂN VIÊN:",
            staffList.length
        );


        // ====================================================
        // DEBUG DỮ LIỆU
        // ====================================================

        staffList.forEach(
            function (staff, index) {

                console.log(
                    `>>> NHÂN VIÊN ${index + 1}:`,
                    {
                        MaNV:
                            staff.MaNV,

                        HoTen:
                            staff.HoTen,

                        Email:
                            getEmail(staff),

                        SoDienThoai:
                            getPhone(staff),

                        DiaChi:
                            getAddress(staff),

                        ChucVu:
                            getRole(staff)

                    }
                );

            }
        );


        console.log(
            "========================================"
        );


        updateStatistics();

        renderStaff();

    }


    catch (error) {

        console.error(
            ">>> LỖI LOAD STAFF:",
            error
        );


        staffList = [];


        updateStatistics();


        tbody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="staff-message"
                >

                    Không thể lấy dữ liệu nhân viên.

                </td>

            </tr>

        `;

    }

}


// ============================================================
// STATISTICS
// ============================================================

function updateStatistics() {

    const totalElement =
        document.getElementById(
            "totalStaff"
        );


    const activeElement =
        document.getElementById(
            "activeStaff"
        );


    const lockedElement =
        document.getElementById(
            "lockedStaff"
        );


    const inactiveElement =
        document.getElementById(
            "inactiveStaff"
        );


    const total =
        staffList.length;


    let active = 0;

    let locked = 0;

    let inactive = 0;


    staffList.forEach(
        function (staff) {

            const status =
                getAccountStatus(
                    staff
                );


            if (
                status === "ACTIVE"
            ) {

                active++;

            }


            else if (
                status === "LOCKED"
            ) {

                locked++;

            }


            else {

                inactive++;

            }

        }
    );


    if (totalElement) {

        totalElement.textContent =
            total;

    }


    if (activeElement) {

        activeElement.textContent =
            active;

    }


    if (lockedElement) {

        lockedElement.textContent =
            locked;

    }


    if (inactiveElement) {

        inactiveElement.textContent =
            inactive;

    }

}


// ============================================================
// RENDER STAFF
// ============================================================

function renderStaff() {

    const tbody =
        document.getElementById(
            "staffTableBody"
        );


    if (!tbody) {

        return;

    }


    const searchInput =
        document.getElementById(
            "staffSearch"
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


    const selectedStatus =
        statusFilter
            ? statusFilter.value
                .trim()
                .toUpperCase()
            : "ALL";


    const filteredStaff =
        staffList.filter(
            function (staff) {


                const name =
                    getName(
                        staff
                    ).toLowerCase();


                const email =
                    getEmail(
                        staff
                    ).toLowerCase();


                const phone =
                    getPhone(
                        staff
                    ).toLowerCase();


                const address =
                    getAddress(
                        staff
                    ).toLowerCase();


                const maNV =
                    String(
                        staff.MaNV ||
                        ""
                    ).toLowerCase();


                const maTaiKhoan =
                    String(
                        getAccountCode(
                            staff
                        )
                    ).toLowerCase();


                const username =
                    String(
                        getUsername(
                            staff
                        )
                    ).toLowerCase();


                const role =
                    getRole(
                        staff
                    ).toLowerCase();


                const status =
                    getAccountStatus(
                        staff
                    );


                const matchesSearch =

                    keyword === "" ||

                    name.includes(
                        keyword
                    ) ||

                    email.includes(
                        keyword
                    ) ||

                    phone.includes(
                        keyword
                    ) ||

                    address.includes(
                        keyword
                    ) ||

                    maNV.includes(
                        keyword
                    ) ||

                    maTaiKhoan.includes(
                        keyword
                    ) ||

                    username.includes(
                        keyword
                    ) ||

                    role.includes(
                        keyword
                    );


                const matchesStatus =

                    selectedStatus ===
                        "ALL" ||

                    status ===
                        selectedStatus;


                return (

                    matchesSearch &&

                    matchesStatus

                );

            }
        );


    // ========================================================
    // KHÔNG CÓ DỮ LIỆU
    // ========================================================

    if (
        filteredStaff.length === 0
    ) {

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


    // ========================================================
    // HIỂN THỊ DANH SÁCH
    // ========================================================

    tbody.innerHTML =

        filteredStaff

            .map(
                function (staff) {


                    const maNV =
                        staff.MaNV ||
                        "-";


                    const maTaiKhoan =
                        getAccountCode(
                            staff
                        );


                    const name =
                        getName(
                            staff
                        );


                    const email =
                        getEmail(
                            staff
                        );


                    const phone =
                        getPhone(
                            staff
                        );


                    const role =
                        getRole(
                            staff
                        );


                    const status =
                        getAccountStatus(
                            staff
                        );


                    const ngayVaoLam =
                        formatDate(
                            staff.NgayVaoLam
                        );


                    const initials =
                        getInitials(
                            name
                        );


                    return `

                        <tr>

                            <!-- MÃ NV -->

                            <td>

                                <span
                                    class="staff-id"
                                >

                                    ${escapeHTML(
                                        maNV
                                    )}

                                </span>

                            </td>


                            <!-- NHÂN VIÊN -->

                            <td>

                                <div
                                    class="staff-info"
                                >

                                    <div
                                        class="staff-avatar"
                                    >

                                        ${escapeHTML(
                                            initials
                                        )}

                                    </div>


                                    <div>

                                        <div
                                            class="staff-name"
                                        >

                                            ${escapeHTML(
                                                name
                                            )}

                                        </div>


                                        <div
                                            class="staff-username"
                                        >

                                            ${escapeHTML(
                                                maTaiKhoan
                                            )}

                                        </div>

                                    </div>

                                </div>

                            </td>


                            <!-- EMAIL -->

                            <td>

                                ${escapeHTML(
                                    email
                                )}

                            </td>


                            <!-- SỐ ĐIỆN THOẠI -->

                            <td>

                                ${escapeHTML(
                                    phone
                                )}

                            </td>


                            <!-- CHỨC VỤ -->

                            <td>

                                ${escapeHTML(
                                    role
                                )}

                            </td>


                            <!-- TRẠNG THÁI -->

                            <td>

                                ${getStatusHTML(
                                    status
                                )}

                            </td>


                            <!-- NGÀY VÀO LÀM -->

                            <td>

                                ${escapeHTML(
                                    ngayVaoLam
                                )}

                            </td>


                            <!-- THAO TÁC -->

                            <td>

                                <div
                                    class="action-buttons"
                                >

                                    <button
                                        type="button"
                                        class="action-btn detail-btn"
                                        data-id="${escapeHTML(
                                            maNV
                                        )}"
                                        title="Xem chi tiết"
                                    >

                                        👁

                                    </button>

                                </div>

                            </td>

                        </tr>

                    `;

                }
            )

            .join("");


    // ========================================================
    // DETAIL BUTTON
    // ========================================================

    tbody
        .querySelectorAll(
            ".detail-btn"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {


                        const maNV =
                            this.dataset.id;


                        const staff =
                            staffList.find(
                                function (item) {

                                    return (

                                        String(
                                            item.MaNV
                                        ) ===

                                        String(
                                            maNV
                                        )

                                    );

                                }
                            );


                        if (staff) {

                            showStaffDetail(
                                staff
                            );

                        }

                    }
                );

            }
        );

}


// ============================================================
// SEARCH SETUP
// ============================================================

function setupSearch() {

    const searchInput =
        document.getElementById(
            "staffSearch"
        );


    const headerSearch =
        document.getElementById(
            "headerSearch"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {

                renderStaff();

            }
        );

    }


    if (headerSearch) {

        headerSearch.addEventListener(
            "input",
            function () {


                if (searchInput) {

                    searchInput.value =
                        this.value;

                }


                renderStaff();

            }
        );

    }

}


// ============================================================
// STATUS FILTER SETUP
// ============================================================

function setupStatusFilter() {

    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    if (!statusFilter) {

        return;

    }


    statusFilter.addEventListener(
        "change",
        function () {

            renderStaff();

        }
    );

}


// ============================================================
// ADD STAFF
// ============================================================

function setupAddStaffButton() {

    const button =
        document.getElementById(
            "addStaffBtn"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        function () {

            alert(
                "Chức năng thêm nhân viên sẽ triển khai sau."
            );

        }
    );

}


// ============================================================
// SHOW STAFF DETAIL
// ============================================================

function showStaffDetail(staff) {

    const status =
        getAccountStatus(
            staff
        );


    const name =
        getName(
            staff
        );


    const email =
        getEmail(
            staff
        );


    const phone =
        getPhone(
            staff
        );


    const address =
        getAddress(
            staff
        );


    const role =
        getRole(
            staff
        );


    const accountCode =
        getAccountCode(
            staff
        );


    const username =
        getUsername(
            staff
        );


    const cccd =
        getCCCD(
            staff
        );


    const gender =
        getGender(
            staff
        );


    const message = `

Mã nhân viên: ${staff.MaNV || "-"}

Mã tài khoản: ${accountCode}

Họ tên: ${name}

CCCD: ${cccd}

Email: ${email}

Số điện thoại: ${phone}

Địa chỉ: ${address}

Chức vụ: ${role}

Ngày sinh: ${formatDate(
        staff.NgaySinh
    )}

Ngày vào làm: ${formatDate(
        staff.NgayVaoLam
    )}

Giới tính: ${gender}

Trạng thái nhân viên: ${getStatusText(
        status
    )}

Tên đăng nhập: ${username}

Vai trò tài khoản: ${staff.VaiTro || "-"}

Trạng thái tài khoản: ${getStatusText(
        String(
            staff.trangThaiTaiKhoan ||
            staff.TrangThaiTaiKhoan ||
            ""
        ).toUpperCase()
    )}

    `;


    alert(
        message
    );

}


// ============================================================
// LOCK STAFF
// ============================================================

async function lockStaff(
    maTaiKhoan
) {

    if (!maTaiKhoan) {

        alert(
            "Không xác định được mã tài khoản."
        );

        return;

    }


    const confirmResult =
        confirm(
            "Bạn có chắc muốn khóa tài khoản này?"
        );


    if (!confirmResult) {

        return;

    }


    alert(
        "Chức năng khóa tài khoản sẽ kết nối với Server ở bước tiếp theo."
    );

}


// ============================================================
// UNLOCK STAFF
// ============================================================

async function unlockStaff(
    maTaiKhoan
) {

    if (!maTaiKhoan) {

        alert(
            "Không xác định được mã tài khoản."
        );

        return;

    }


    const confirmResult =
        confirm(
            "Bạn có chắc muốn mở khóa tài khoản này?"
        );


    if (!confirmResult) {

        return;

    }


    alert(
        "Chức năng mở khóa tài khoản sẽ kết nối với Server ở bước tiếp theo."
    );

}


// ============================================================
// LOGOUT
// ============================================================

function logout() {

    window.location.href =
        "index.html";

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupSearch();

        setupStatusFilter();

        setupAddStaffButton();

        loadStaff();

    }
);