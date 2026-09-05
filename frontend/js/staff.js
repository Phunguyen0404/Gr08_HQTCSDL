document.addEventListener("DOMContentLoaded", () => {

    const API_URL = "http://localhost:3000/api/staff";

    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    const tableBody = document.getElementById("staffTableBody");
    const emptyMessage = document.getElementById("emptyMessage");

    const totalStaff = document.getElementById("totalStaff");
    const activeStaff = document.getElementById("activeStaff");
    const lockedStaff = document.getElementById("lockedStaff");

    const addStaffBtn = document.getElementById("addStaffBtn");

    let staffData = [];


    // =========================================================
    // 1. LẤY DỮ LIỆU NHÂN VIÊN TỪ BACKEND
    // =========================================================

    async function loadStaff() {

        try {

            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}`
                );
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(
                    result.message || "Không thể lấy dữ liệu"
                );
            }

            staffData = result.data || [];

            renderStaff(staffData);

            updateStatistics();

        } catch (error) {

            console.error(
                "Lỗi kết nối danh sách nhân viên:",
                error
            );

            tableBody.innerHTML = "";

            emptyMessage.textContent =
                "Không thể kết nối đến hệ thống.";

            emptyMessage.style.display = "block";

        }
    }


    // =========================================================
    // 2. HIỂN THỊ DANH SÁCH NHÂN VIÊN
    // =========================================================

    function renderStaff(data) {

        tableBody.innerHTML = "";

        if (data.length === 0) {

            emptyMessage.textContent =
                "Không có nhân viên nào.";

            emptyMessage.style.display = "block";

            return;
        }

        emptyMessage.style.display = "none";


        data.forEach(staff => {

            const row = document.createElement("tr");

            const accountStatus =
                staff.trangThaiTaiKhoan || "ACTIVE";

            const employeeStatus =
                staff.trangThaiNhanVien || "ACTIVE";

            const status =
                accountStatus === "LOCKED"
                    ? "LOCKED"
                    : employeeStatus;


            // -------------------------------------------------
            // ĐỊNH DẠNG NGÀY
            // -------------------------------------------------

            let ngayVaoLam = "";

            if (staff.NgayVaoLam) {

                const date =
                    new Date(staff.NgayVaoLam);

                ngayVaoLam =
                    date.toLocaleDateString("vi-VN");

            }


            // -------------------------------------------------
            // TRẠNG THÁI
            // -------------------------------------------------

            const isActive =
                status === "ACTIVE";

            const statusClass =
                isActive
                    ? "active"
                    : "locked";

            const statusText =
                isActive
                    ? "Đang hoạt động"
                    : "Đã khóa";


            // -------------------------------------------------
            // NÚT
            // -------------------------------------------------

            const buttonClass =
                isActive
                    ? "action-btn"
                    : "action-btn unlock-btn";

            const buttonText =
                isActive
                    ? "🔒 Khóa"
                    : "🔓 Mở khóa";


            // -------------------------------------------------
            // DỮ LIỆU TÌM KIẾM
            // -------------------------------------------------

            const searchData = [

                staff.MaNV,
                staff.HoTen,
                staff.Email,
                staff.SoDienThoai,
                staff.ChucVu,
                staff.VaiTro

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            row.dataset.search = searchData;

            row.dataset.status = status;

            row.dataset.manv = staff.MaNV;


            // -------------------------------------------------
            // HTML
            // -------------------------------------------------

            row.innerHTML = `

                <td>${staff.MaNV || ""}</td>

                <td>
                    ${staff.HoTen || ""}
                </td>

                <td>
                    ${staff.Email || ""}
                </td>

                <td>
                    ${staff.ChucVu || ""}
                </td>

                <td>
                    ${staff.VaiTro || ""}
                </td>

                <td>

                    <span class="status ${statusClass}">

                        <i></i>

                        ${statusText}

                    </span>

                </td>

                <td>
                    ${ngayVaoLam}
                </td>

                <td>

                    <button
                        type="button"
                        class="${buttonClass}"
                        data-action="${isActive ? "lock" : "unlock"}"
                    >
                        ${buttonText}
                    </button>

                </td>

            `;


            tableBody.appendChild(row);

        });

    }


    // =========================================================
    // 3. THỐNG KÊ
    // =========================================================

    function updateStatistics() {

        const total =
            staffData.length;

        const active =
            staffData.filter(staff => {

                return (
                    staff.trangThaiTaiKhoan === "ACTIVE"
                    &&
                    staff.trangThaiNhanVien === "ACTIVE"
                );

            }).length;


        const locked =
            staffData.filter(staff => {

                return (
                    staff.trangThaiTaiKhoan === "LOCKED"
                );

            }).length;


        totalStaff.textContent = total;

        activeStaff.textContent = active;

        lockedStaff.textContent = locked;

    }


    // =========================================================
    // 4. TÌM KIẾM + LỌC
    // =========================================================

    function filterStaff() {

        const keyword =
            searchInput.value
                .trim()
                .toLowerCase();

        const selectedStatus =
            statusFilter.value;


        const rows =
            tableBody.querySelectorAll("tr");


        let visibleCount = 0;


        rows.forEach(row => {

            const searchData =
                row.dataset.search || "";

            const rowStatus =
                row.dataset.status || "";


            const matchKeyword =
                searchData.includes(keyword);


            let matchStatus = true;


            if (selectedStatus !== "ALL") {

                if (
                    selectedStatus === "ACTIVE"
                ) {

                    matchStatus =
                        rowStatus === "ACTIVE";

                } else {

                    matchStatus =
                        rowStatus === "LOCKED"
                        ||
                        rowStatus === "INACTIVE";

                }

            }


            if (
                matchKeyword
                &&
                matchStatus
            ) {

                row.style.display = "";

                visibleCount++;

            } else {

                row.style.display = "none";

            }

        });


        if (visibleCount === 0) {

            emptyMessage.textContent =
                "Không tìm thấy nhân viên phù hợp.";

            emptyMessage.style.display = "block";

        } else {

            emptyMessage.style.display = "none";

        }

    }


    searchInput.addEventListener(
        "input",
        filterStaff
    );


    statusFilter.addEventListener(
        "change",
        filterStaff
    );


    // =========================================================
    // 5. NÚT KHÓA / MỞ KHÓA
    // =========================================================

    tableBody.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(".action-btn");


            if (!button) {
                return;
            }


            const row =
                button.closest("tr");


            if (!row) {
                return;
            }


            const currentStatus =
                row.dataset.status;


            const status =
                row.querySelector(".status");


            if (currentStatus === "ACTIVE") {

                // ---------------------------------------------
                // ACTIVE → LOCKED
                // ---------------------------------------------

                row.dataset.status = "LOCKED";

                status.className =
                    "status locked";

                status.innerHTML =
                    "<i></i> Đã khóa";


                button.className =
                    "action-btn unlock-btn";

                button.dataset.action =
                    "unlock";

                button.innerHTML =
                    "🔓 Mở khóa";


            } else {

                // ---------------------------------------------
                // LOCKED → ACTIVE
                // ---------------------------------------------

                row.dataset.status = "ACTIVE";

                status.className =
                    "status active";

                status.innerHTML =
                    "<i></i> Đang hoạt động";


                button.className =
                    "action-btn";

                button.dataset.action =
                    "lock";

                button.innerHTML =
                    "🔒 Khóa";

            }

        }
    );


    // =========================================================
    // 6. NÚT THÊM NHÂN VIÊN
    // =========================================================

    if (addStaffBtn) {

        addStaffBtn.addEventListener(
            "click",
            () => {

                alert(
                    "Chức năng thêm nhân viên sẽ được kết nối với database ở bước tiếp theo."
                );

            }
        );

    }


    // =========================================================
    // 7. KHỞI ĐỘNG
    // =========================================================

    loadStaff();

});