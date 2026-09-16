// ============================================================
// TRANG ĐẶT PHÒNG (CHO KHÁCH)
// ============================================================

const tienVN = new Intl.NumberFormat('vi-VN');
const dinhDangNgay = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const params = new URLSearchParams(window.location.search);

const timKiem = {
    diemDen: params.get('diemDen') || '',
    ngayNhan: params.get('ngayNhan') || toISO(homNayCong(0)),
    ngayTra: params.get('ngayTra') || toISO(homNayCong(1)),
    soPhong: Number(params.get('soPhong')) || 1,
    nguoiLon: Number(params.get('nguoiLon')) || 2,
    treEm: Number(params.get('treEm')) || 0,
    maUuDai: params.get('maUuDai') || ''
};

// Danh sách phòng đã chọn: Map<MaPhong, room>
const phongDaChon = new Map();


function homNayCong(soNgay) {
    const d = new Date();
    d.setDate(d.getDate() + soNgay);
    return d;
}

function toISO(date) {
    return date.toISOString().slice(0, 10);
}

function parseNgayVN(iso) {
    if (!iso) return '-';
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return dinhDangNgay.format(d);
}

function soDem() {
    const a = new Date(`${timKiem.ngayNhan}T00:00:00`);
    const b = new Date(`${timKiem.ngayTra}T00:00:00`);
    const dem = Math.round((b - a) / 86400000);
    return dem > 0 ? dem : 1;
}


// ============================================================
// THANH TÓM TẮT
// ============================================================

function veTomTat() {
    if (timKiem.diemDen) {
        document.getElementById('summaryDestination').textContent = timKiem.diemDen;
    }

    document.getElementById('summaryDates').textContent =
        `${parseNgayVN(timKiem.ngayNhan)} - ${parseNgayVN(timKiem.ngayTra)}`;

    const khach = [`${timKiem.soPhong} phòng`, `${timKiem.nguoiLon} người lớn`];
    if (timKiem.treEm > 0) khach.push(`${timKiem.treEm} trẻ em`);
    document.getElementById('summaryGuests').textContent = khach.join(' - ');

    if (timKiem.maUuDai) {
        document.getElementById('summaryPromo').value = timKiem.maUuDai;
    }

    document.getElementById('tripDates').textContent =
        `${parseNgayVN(timKiem.ngayNhan)} - ${parseNgayVN(timKiem.ngayTra)}`;
    document.getElementById('tripNights').textContent = `${soDem()} đêm`;
}


// ============================================================
// DANH SÁCH PHÒNG TRỐNG
// ============================================================

function taoTheChonPhong(room) {
    const card = document.createElement('article');
    card.className = 'booking-room-card';
    card.dataset.maPhong = room.MaPhong;

    const media = document.createElement('div');
    media.className = 'booking-room-media';
    media.style.backgroundImage = `url("../assets/images/rooms/${room.MaLoaiPhong}.jpg")`;

    const info = document.createElement('div');
    info.className = 'booking-room-info';

    const h3 = document.createElement('h3');
    h3.textContent = `${room.TenLoaiPhong} - Phòng ${room.SoPhong}`;

    const meta = document.createElement('p');
    meta.className = 'booking-room-meta';
    meta.innerHTML = `<span>Tầng ${room.Tang}</span><span>Tối đa ${room.SucChua} khách</span>`;

    const desc = document.createElement('p');
    desc.className = 'booking-room-desc';
    desc.textContent = room.MoTa || 'Đang cập nhật mô tả.';

    info.append(h3, meta, desc);

    const side = document.createElement('div');
    side.className = 'booking-room-side';

    const price = document.createElement('p');
    price.className = 'booking-room-price';
    price.innerHTML = `${tienVN.format(Number(room.GiaCoBan))}đ <span>/ đêm</span>`;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-outline room-select-btn';
    btn.textContent = 'Chọn phòng';
    btn.addEventListener('click', () => toggleChonPhong(room, card, btn));

    side.append(price, btn);
    card.append(media, info, side);

    return card;
}

function veDanhSachPhong(danhSach) {
    const grid = document.getElementById('roomGrid');
    grid.innerHTML = '';

    if (!danhSach.length) {
        const empty = document.createElement('p');
        empty.className = 'grid-state';
        empty.textContent = 'Không còn phòng trống phù hợp trong khoảng ngày đã chọn.';
        grid.appendChild(empty);
        return;
    }

    danhSach.forEach((room) => grid.appendChild(taoTheChonPhong(room)));
}

async function taiPhongTrong() {
    const grid = document.getElementById('roomGrid');
    grid.innerHTML = '<p class="grid-state">Đang tìm phòng trống...</p>';

    try {
        const tongKhach = timKiem.nguoiLon + timKiem.treEm;
        // FIX: trước đây truyền thẳng tổng số khách làm sức chứa yêu cầu
        // của TỪNG phòng (lp.SucChua >= tongKhach ở backend), nên khi
        // khách chọn "2 phòng - 4 người lớn" (2 người/phòng) thì mọi
        // phòng sức chứa 2 đều bị loại vì 2 < 4. Chia đều số khách cho
        // số phòng để tìm phòng có sức chứa phù hợp cho từng phòng.
        const khachMoiPhong = Math.max(1, Math.ceil(tongKhach / timKiem.soPhong));

        const danhSach = await window.BookingAPI.getAvailableRooms(
            timKiem.ngayNhan,
            timKiem.ngayTra,
            khachMoiPhong
        );
        veDanhSachPhong(Array.isArray(danhSach) ? danhSach : []);
    } catch (error) {
        console.error('Không tải được phòng trống:', error);
        grid.innerHTML = '';
        const err = document.createElement('p');
        err.className = 'grid-state';
        err.textContent = 'Có lỗi khi tìm phòng trống. Vui lòng thử lại.';
        grid.appendChild(err);
    }
}


// ============================================================
// GIỎ PHÒNG ĐÃ CHỌN (TRIP CARD)
// ============================================================

function toggleChonPhong(room, card, btn) {
    const daChon = phongDaChon.has(room.MaPhong);

    if (daChon) {
        phongDaChon.delete(room.MaPhong);
        btn.textContent = 'Chọn phòng';
        btn.classList.remove('is-selected');
        card.classList.remove('is-selected');
    } else {
        phongDaChon.set(room.MaPhong, room);
        btn.textContent = 'Đã chọn';
        btn.classList.add('is-selected');
        card.classList.add('is-selected');
    }

    veGioPhong();
}

function xoaKhoiGio(maPhong) {
    phongDaChon.delete(maPhong);

    const card = document.querySelector(`.booking-room-card[data-ma-phong="${maPhong}"]`);
    if (card) {
        card.classList.remove('is-selected');
        const btn = card.querySelector('.room-select-btn');
        if (btn) {
            btn.textContent = 'Chọn phòng';
            btn.classList.remove('is-selected');
        }
    }

    veGioPhong();
}

function veGioPhong() {
    const container = document.getElementById('tripRooms');
    const totalRow = document.getElementById('tripTotal');
    const totalDivider = document.getElementById('tripTotalDivider');
    const continueBtn = document.getElementById('continueBtn');

    container.innerHTML = '';

    if (phongDaChon.size === 0) {
        const empty = document.createElement('p');
        empty.className = 'trip-empty muted';
        empty.textContent = 'Bạn chưa chọn phòng nào.';
        container.appendChild(empty);

        totalRow.hidden = true;
        totalDivider.hidden = true;
        continueBtn.disabled = true;
        return;
    }

    let tongTien = 0;

    phongDaChon.forEach((room) => {
        const block = document.createElement('div');
        block.className = 'trip-selected-room';

        const ten = document.createElement('strong');
        ten.textContent = `${room.TenLoaiPhong} - Phòng ${room.SoPhong}`;

        const gia = document.createElement('span');
        gia.className = 'trip-room-price';
        gia.textContent = `${tienVN.format(Number(room.GiaCoBan) * soDem())}đ`;

        const xoa = document.createElement('button');
        xoa.type = 'button';
        xoa.className = 'summary-link';
        xoa.style.alignSelf = 'flex-start';
        xoa.textContent = 'Bỏ chọn';
        xoa.addEventListener('click', () => xoaKhoiGio(room.MaPhong));

        block.append(ten, gia, xoa);
        container.appendChild(block);

        tongTien += Number(room.GiaCoBan) * soDem();
    });

    totalRow.hidden = false;
    totalRow.innerHTML = `<span>Tổng cộng</span><strong>${tienVN.format(tongTien)}đ</strong>`;
    totalDivider.hidden = false;
    continueBtn.disabled = false;
}

function tongTienGio() {
    let tong = 0;
    phongDaChon.forEach((room) => {
        tong += Number(room.GiaCoBan) * soDem();
    });
    return tong;
}


// ============================================================
// MODAL ĐẶT PHÒNG
// ============================================================

const modal = document.getElementById('bookingModal');
const modalSteps = document.querySelectorAll('#modalSteps li');

let hoSoKhachHang = null;

function moModal() {
    modal.hidden = false;
    lamMoiBuocModal();
}

function dongModal() {
    modal.hidden = true;
}

function hienBuoc(tenBuoc) {
    document.querySelectorAll('.modal-step').forEach((step) => {
        step.hidden = true;
    });

    modalSteps.forEach((li) => {
        li.classList.remove('is-active', 'is-done');
    });

    const thuTu = ['account', 'confirm', 'success'];
    const viTri = thuTu.indexOf(tenBuoc);

    modalSteps.forEach((li) => {
        const idx = thuTu.indexOf(li.dataset.step);
        if (idx < viTri) li.classList.add('is-done');
        if (idx === viTri) li.classList.add('is-active');
    });

    if (tenBuoc === 'account') {
        if (window.api.isLoggedIn()) {
            document.getElementById('stepProfile').hidden = false;
        } else {
            document.getElementById('stepAccount').hidden = false;
        }
    } else if (tenBuoc === 'confirm') {
        document.getElementById('stepConfirm').hidden = false;
        veTomTatXacNhan();
    } else if (tenBuoc === 'success') {
        document.getElementById('stepSuccess').hidden = false;
    }
}

async function lamMoiBuocModal() {
    if (!window.api.isLoggedIn()) {
        hienBuoc('account');
        return;
    }

    try {
        const response = await window.CustomerAPI.getMyProfile();
        const profile = response?.data || null;
        hoSoKhachHang = profile;

        if (profile) {
            const form = document.getElementById('profileForm');
            form.hoTen.value = profile.HoTen || '';
            form.soDienThoai.value = profile.SoDienThoai || '';
            form.email.value = profile.Email || '';
            form.diaChi.value = profile.DiaChi || '';
            if (profile.NgaySinh) form.ngaySinh.value = String(profile.NgaySinh).slice(0, 10);
            if (profile.GioiTinh) form.gioiTinh.value = profile.GioiTinh;
            form.cccd.value = profile.CCCD || '';
            document.getElementById('profileCccd').readOnly = Boolean(profile.CCCD);
        }
    } catch (error) {
        console.error('Không tải được hồ sơ khách hàng:', error);
    }

    hienBuoc('account');
}

function veTomTatXacNhan() {
    const box = document.getElementById('confirmSummary');
    const dsHtml = [];

    phongDaChon.forEach((room) => {
        dsHtml.push(`${room.TenLoaiPhong} - Phòng ${room.SoPhong} (${tienVN.format(Number(room.GiaCoBan))}đ/đêm)`);
    });

    box.innerHTML = `
        <p><strong>Ngày nhận:</strong> ${parseNgayVN(timKiem.ngayNhan)}</p>
        <p><strong>Ngày trả:</strong> ${parseNgayVN(timKiem.ngayTra)} (${soDem()} đêm)</p>
        <p><strong>Số khách:</strong> ${timKiem.nguoiLon} người lớn${timKiem.treEm > 0 ? `, ${timKiem.treEm} trẻ em` : ''}</p>
        <p><strong>Phòng đã chọn:</strong><br>${dsHtml.join('<br>')}</p>
        <p><strong>Tổng tiền:</strong> ${tienVN.format(tongTienGio())}đ</p>
    `;
}


// --- Đăng nhập / Đăng ký trong modal ---

function chonTab(tab) {
    const isLogin = tab === 'login';
    document.getElementById('tabLogin').classList.toggle('is-active', isLogin);
    document.getElementById('tabRegister').classList.toggle('is-active', !isLogin);
    document.getElementById('loginModalForm').hidden = !isLogin;
    document.getElementById('registerModalForm').hidden = isLogin;
}

async function xuLyDangNhap(e) {
    e.preventDefault();
    const form = e.target;
    const errorBox = document.getElementById('loginError');
    errorBox.textContent = '';

    const username = form.username.value.trim();
    const password = form.password.value;

    try {
        const result = await window.api.login({ username, password });
        const token = result?.data?.token;
        if (!token) throw new Error('Phản hồi đăng nhập không có token.');

        localStorage.setItem('authToken', token);
        if (result.data.user) {
            localStorage.setItem('authUser', JSON.stringify(result.data.user));
        }

        veKhuVucTaiKhoan();
        await lamMoiBuocModal();
    } catch (error) {
        errorBox.textContent = error.message || 'Đăng nhập thất bại.';
    }
}

async function xuLyDangKy(e) {
    e.preventDefault();
    const form = e.target;
    const errorBox = document.getElementById('registerError');
    errorBox.textContent = '';

    const username = form.username.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    if (password !== confirmPassword) {
        errorBox.textContent = 'Mật khẩu xác nhận không khớp.';
        return;
    }

    try {
        await window.api.register({ username, password, confirmPassword });

        const result = await window.api.login({ username, password });
        const token = result?.data?.token;
        localStorage.setItem('authToken', token);
        if (result.data.user) {
            localStorage.setItem('authUser', JSON.stringify(result.data.user));
        }

        veKhuVucTaiKhoan();
        await lamMoiBuocModal();
    } catch (error) {
        errorBox.textContent = error.message || 'Đăng ký thất bại.';
    }
}

async function xuLyLuuHoSo(e) {
    e.preventDefault();
    const form = e.target;
    const errorBox = document.getElementById('profileError');
    errorBox.textContent = '';

    const payload = {
        hoTen: form.hoTen.value.trim(),
        cccd: form.cccd.value.trim() || undefined,
        soDienThoai: form.soDienThoai.value.trim(),
        email: form.email.value.trim() || undefined,
        ngaySinh: form.ngaySinh.value || undefined,
        gioiTinh: form.gioiTinh.value || undefined,
        diaChi: form.diaChi.value.trim() || undefined
    };

    try {
        const response = await window.CustomerAPI.saveMyProfile(payload);
        hoSoKhachHang = response?.data || null;
        hienBuoc('confirm');
    } catch (error) {
        errorBox.textContent = error.message || 'Không lưu được hồ sơ.';
    }
}

async function xuLyXacNhanDatPhong(e) {
    e.preventDefault();
    const form = e.target;
    const errorBox = document.getElementById('confirmError');
    errorBox.textContent = '';

    const customerId = hoSoKhachHang?.MaKH;
    if (!customerId) {
        errorBox.textContent = 'Chưa tìm thấy hồ sơ khách hàng, vui lòng thử lại.';
        return;
    }

    const payload = {
        customerId,
        checkIn: timKiem.ngayNhan,
        checkOut: timKiem.ngayTra,
        guests: timKiem.nguoiLon + timKiem.treEm,
        note: form.note.value.trim() || undefined,
        // FIX: SP_TAO_DAT_PHONG dùng JSON_TABLE(... PATH '$.MaPhong'),
        // nên cần mảng OBJECT {MaPhong, DonGia}, không phải mảng chuỗi
        // mã phòng. Gửi mảng chuỗi khiến mọi lượt đặt phòng đều fail
        // với lỗi "Danh sách phòng không hợp lệ hoặc không tồn tại".
        rooms: Array.from(phongDaChon.values()).map((room) => ({
            MaPhong: room.MaPhong,
            DonGia: Number(room.GiaCoBan)
        }))
    };

    try {
        const response = await window.BookingAPI.create(payload);
        const result = response?.data || {};
        document.getElementById('successCode').textContent = result.bookingCode || result.bookingId || '-';
        hienBuoc('success');

        // Đặt phòng xong thì các phòng vừa chọn coi như đã hết trống:
        // xoá giỏ và tải lại danh sách phòng trống để tránh khách chọn
        // lại phòng vừa được đặt.
        phongDaChon.clear();
        veGioPhong();
        taiPhongTrong();
    } catch (error) {
        errorBox.textContent = error.message || 'Đặt phòng thất bại. Vui lòng thử lại.';
    }
}


// ============================================================
// KHU VỰC TÀI KHOẢN Ở HEADER
// ============================================================

function veKhuVucTaiKhoan() {
    const area = document.getElementById('authArea');

    if (!window.api.isLoggedIn()) {
        area.innerHTML = `
            <a href="index.html" class="utility-link dark">
                <svg viewBox="0 0 24 24" class="icon" aria-hidden="true">
                    <circle cx="11" cy="11" r="7"></circle>
                    <line x1="16.5" y1="16.5" x2="21" y2="21"></line>
                </svg>
                <span>Đăng nhập</span>
            </a>
        `;
        return;
    }

    const user = window.api.getCurrentUser();
    const ten = user?.username || 'Khách hàng';
    const chuCai = ten.slice(0, 2).toUpperCase();

    area.innerHTML = `
        <div class="user-chip">
            <span class="avatar">${chuCai}</span>
            <span>${ten}</span>
        </div>
        <button type="button" class="logout-link" id="logoutBtn">Đăng xuất</button>
    `;

    document.getElementById('logoutBtn').addEventListener('click', () => {
        window.api.logout();
        veKhuVucTaiKhoan();
    });
}


// ============================================================
// KHỞI CHẠY
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    veTomTat();
    veKhuVucTaiKhoan();
    veGioPhong();
    taiPhongTrong();

    document.getElementById('continueBtn').addEventListener('click', moModal);
    document.getElementById('modalClose').addEventListener('click', dongModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) dongModal();
    });

    document.getElementById('tabLogin').addEventListener('click', () => chonTab('login'));
    document.getElementById('tabRegister').addEventListener('click', () => chonTab('register'));

    document.getElementById('loginModalForm').addEventListener('submit', xuLyDangNhap);
    document.getElementById('registerModalForm').addEventListener('submit', xuLyDangKy);
    document.getElementById('profileForm').addEventListener('submit', xuLyLuuHoSo);
    document.getElementById('confirmForm').addEventListener('submit', xuLyXacNhanDatPhong);
});