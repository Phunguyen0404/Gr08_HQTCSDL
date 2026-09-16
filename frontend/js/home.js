// ============================================================
// TRANG CHỦ - TÌM PHÒNG, CHỌN PHÒNG CỤ THỂ, ĐẶT PHÒNG
// ============================================================

const tienVN = new Intl.NumberFormat('vi-VN');
const dinhDangNgay = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

// Trạng thái bộ đếm phòng/khách trên thanh tìm kiếm
const state = {
    phong: 1,
    nguoiLon: 2,
    treEm: 0
};

const gioiHan = {
    phong: { min: 1, max: 10 },
    nguoiLon: { min: 1, max: 20 },
    treEm: { min: 0, max: 10 }
};

// Điều kiện tìm kiếm đang áp dụng cho khu vực "Phòng còn trống"
const timKiem = {
    diemDen: '',
    ngayNhan: '',
    ngayTra: '',
    soPhong: 1,
    nguoiLon: 2,
    treEm: 0,
    maUuDai: '',
    maLoaiPhong: ''
};

// Danh sách phòng cụ thể đang tải (chưa lọc) và danh sách phòng đã chọn
let danhSachPhongTrong = [];
const phongDaChon = new Map(); // Map<MaPhong, room>


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
// MENU MOBILE
// ============================================================

function setupMenu() {
    const toggle = document.getElementById('menuToggle');
    const nav = document.querySelector('.main-nav');

    toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
    });
}


// ============================================================
// CHỌN SỐ PHÒNG - SỐ NGƯỜI (popover trên thanh tìm kiếm)
// ============================================================

function capNhatNhanKhach() {
    const parts = [
        `${state.phong} phòng`,
        `${state.nguoiLon} người lớn`
    ];

    if (state.treEm > 0) {
        parts.push(`${state.treEm} trẻ em`);
    }

    document.getElementById('guestLabel').textContent = parts.join(' - ');
}

function capNhatNutStepper() {
    document.querySelectorAll('.guest-row').forEach((row) => {
        const key = row.dataset.counter;
        const value = state[key];

        row.querySelector('output, o').textContent = value;
        row.querySelector('[data-step="-1"]').disabled = value <= gioiHan[key].min;
        row.querySelector('[data-step="1"]').disabled = value >= gioiHan[key].max;
    });
}

function moPopover(open) {
    const trigger = document.getElementById('guestTrigger');
    const popover = document.getElementById('guestPopover');

    popover.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
}

function setupGuestPicker() {
    const trigger = document.getElementById('guestTrigger');
    const popover = document.getElementById('guestPopover');
    const field = trigger.closest('.search-field');

    trigger.addEventListener('click', () => moPopover(popover.hidden));

    document.getElementById('guestDone').addEventListener('click', () => moPopover(false));

    popover.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-step]');
        if (!btn) return;

        const key = btn.closest('.guest-row').dataset.counter;
        const next = state[key] + Number(btn.dataset.step);

        if (next < gioiHan[key].min || next > gioiHan[key].max) return;

        state[key] = next;

        if (key === 'phong' && state.nguoiLon < next) {
            state.nguoiLon = next;
        }

        capNhatNutStepper();
        capNhatNhanKhach();
    });

    document.addEventListener('click', (e) => {
        if (!popover.hidden && !field.contains(e.target)) {
            moPopover(false);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !popover.hidden) {
            moPopover(false);
            trigger.focus();
        }
    });

    capNhatNutStepper();
    capNhatNhanKhach();
}


// ============================================================
// NGÀY MẶC ĐỊNH
// ============================================================

function setupDates() {
    const nhan = document.getElementById('ngayNhan');
    const tra = document.getElementById('ngayTra');

    const homNay = new Date();
    const ngayMai = new Date();
    ngayMai.setDate(homNay.getDate() + 1);

    nhan.value = toISO(homNay);
    nhan.min = toISO(homNay);
    tra.value = toISO(ngayMai);
    tra.min = toISO(ngayMai);

    nhan.addEventListener('change', () => {
        const sau = new Date(nhan.value);
        sau.setDate(sau.getDate() + 1);
        tra.min = toISO(sau);

        if (tra.value <= nhan.value) {
            tra.value = toISO(sau);
        }
    });
}


// ============================================================
// FORM TÌM KIẾM -> CẬP NHẬT timKiem VÀ TẢI LẠI PHÒNG TRỐNG
// (không rời trang nữa, chỉ cuộn xuống khu vực "Phòng còn trống")
// ============================================================

function docTimKiemTuForm() {
    timKiem.diemDen = document.getElementById('diemDen').value.trim();
    timKiem.ngayNhan = document.getElementById('ngayNhan').value || toISO(homNayCong(0));
    timKiem.ngayTra = document.getElementById('ngayTra').value || toISO(homNayCong(1));
    timKiem.soPhong = state.phong;
    timKiem.nguoiLon = state.nguoiLon;
    timKiem.treEm = state.treEm;
    timKiem.maUuDai = document.getElementById('maUuDai').value.trim();
}

function setupSearch() {
    const form = document.getElementById('tim-kiem');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        docTimKiemTuForm();
        veTomTatKetQua();
        taiPhongTrong();
        document.getElementById('ketQua').scrollIntoView({ behavior: 'smooth' });
    });
}

function veTomTatKetQua() {
    const khach = [`${timKiem.soPhong} phòng`, `${timKiem.nguoiLon} người lớn`];
    if (timKiem.treEm > 0) khach.push(`${timKiem.treEm} trẻ em`);

    document.getElementById('ketQuaTomTat').textContent =
        `${parseNgayVN(timKiem.ngayNhan)} - ${parseNgayVN(timKiem.ngayTra)} · ${khach.join(' - ')}`;

    document.getElementById('tripDates').textContent =
        `${parseNgayVN(timKiem.ngayNhan)} - ${parseNgayVN(timKiem.ngayTra)}`;
    document.getElementById('tripNights').textContent = `${soDem()} đêm`;
}


// ============================================================
// DANH SÁCH LOẠI PHÒNG (chỉ để XEM MÔ TẢ, không đặt phòng trực tiếp)
// ============================================================

const loaiPhongMau = [
    {
        MaLoaiPhong: 'STD',
        TenLoaiPhong: 'Phòng Standard',
        MoTa: 'Phòng 24m² với giường đôi, bàn làm việc và cửa sổ hướng vườn.',
        SucChua: 2,
        GiaCoBan: 850000
    },
    {
        MaLoaiPhong: 'DLX',
        TenLoaiPhong: 'Phòng Deluxe',
        MoTa: 'Phòng 32m² có ban công riêng, bồn tắm và tầm nhìn ra hồ bơi.',
        SucChua: 3,
        GiaCoBan: 1450000
    },
    {
        MaLoaiPhong: 'SUI',
        TenLoaiPhong: 'Phòng Suite',
        MoTa: 'Căn 48m² tách phòng khách và phòng ngủ, kèm quầy bar mini.',
        SucChua: 4,
        GiaCoBan: 2600000
    }
];

function taoTheLoaiPhong(loai) {
    const card = document.createElement('article');
    card.className = 'room-card';

    const media = document.createElement('div');
    media.className = 'room-media';
    media.style.backgroundImage = `url("../assets/images/rooms/${loai.MaLoaiPhong}.jpg")`;

    const body = document.createElement('div');
    body.className = 'room-body';

    const ten = document.createElement('h3');
    ten.textContent = loai.TenLoaiPhong;

    const meta = document.createElement('p');
    meta.className = 'room-meta';
    meta.textContent = `Tối đa ${loai.SucChua} khách`;

    const moTa = document.createElement('p');
    moTa.className = 'room-desc';
    moTa.textContent = loai.MoTa || 'Đang cập nhật mô tả.';

    const foot = document.createElement('div');
    foot.className = 'room-foot';

    const gia = document.createElement('p');
    gia.className = 'room-price';
    gia.innerHTML = `${tienVN.format(Number(loai.GiaCoBan))}đ <span>/ đêm</span>`;

    // Khu này chỉ để XEM MÔ TẢ, không đặt phòng trực tiếp nữa.
    const link = document.createElement('a');
    link.className = 'room-link';
    link.href = '#';
    link.textContent = 'Xem chi tiết';
    link.addEventListener('click', (e) => {
        e.preventDefault();
        moModalChiTietLoaiPhong(loai);
    });

    foot.append(gia, link);
    body.append(ten, meta, moTa, foot);
    card.append(media, body);

    return card;
}

function veLoaiPhong(danhSach) {
    const grid = document.getElementById('roomGrid');
    grid.innerHTML = '';

    if (!danhSach.length) {
        const empty = document.createElement('p');
        empty.className = 'grid-state';
        empty.textContent = 'Chưa có loại phòng nào được mở bán.';
        grid.appendChild(empty);
        return;
    }

    danhSach.forEach((loai) => grid.appendChild(taoTheLoaiPhong(loai)));
}

function veBoLocLoaiPhong(danhSach) {
    const select = document.getElementById('locLoaiPhong');
    // Giữ lại option "Tất cả loại phòng" ở đầu, xoá các option cũ
    select.querySelectorAll('option:not([value=""])').forEach((opt) => opt.remove());

    danhSach.forEach((loai) => {
        const opt = document.createElement('option');
        opt.value = loai.MaLoaiPhong;
        opt.textContent = loai.TenLoaiPhong;
        select.appendChild(opt);
    });

    select.addEventListener('change', () => {
        timKiem.maLoaiPhong = select.value;
        veDanhSachPhongDaLoc();
    });
}

async function loadLoaiPhong() {
    try {
        // Dùng PublicRoomTypeAPI (dữ liệu MySQL thật từ bảng LOAI_PHONG),
        // KHÔNG dùng window.RoomTypeAPI (dữ liệu mẫu, field không khớp).
        const data = await window.PublicRoomTypeAPI.getAll();
        const danhSach = Array.isArray(data) ? data : [];
        const dangBan = danhSach.filter((loai) => loai.TrangThai !== 'INACTIVE');
        const ketQua = dangBan.length ? dangBan : loaiPhongMau;

        veLoaiPhong(ketQua);
        veBoLocLoaiPhong(ketQua);
    } catch (error) {
        console.error('Không tải được loại phòng:', error);
        veLoaiPhong(loaiPhongMau);
        veBoLocLoaiPhong(loaiPhongMau);
    }
}

function locTheoLoaiPhong(maLoaiPhong) {
    timKiem.maLoaiPhong = maLoaiPhong;
    document.getElementById('locLoaiPhong').value = maLoaiPhong;
    veDanhSachPhongDaLoc();
    document.getElementById('ketQua').scrollIntoView({ behavior: 'smooth' });
}


// ============================================================
// MODAL XEM MÔ TẢ LOẠI PHÒNG
// ============================================================

let loaiPhongDangXem = null;

function moModalChiTietLoaiPhong(loai) {
    loaiPhongDangXem = loai;

    document.getElementById('roomTypeDetailMedia').style.backgroundImage =
        `url("../assets/images/rooms/${loai.MaLoaiPhong}.jpg")`;
    document.getElementById('roomTypeDetailTen').textContent = loai.TenLoaiPhong;
    document.getElementById('roomTypeDetailMeta').textContent = `Tối đa ${loai.SucChua} khách`;
    document.getElementById('roomTypeDetailMoTa').textContent = loai.MoTa || 'Đang cập nhật mô tả.';
    document.getElementById('roomTypeDetailGia').innerHTML =
        `${tienVN.format(Number(loai.GiaCoBan))}đ <span class="muted">/ đêm</span>`;

    document.getElementById('roomTypeModal').hidden = false;
}

function dongModalChiTietLoaiPhong() {
    document.getElementById('roomTypeModal').hidden = true;
}


// ============================================================
// DANH SÁCH PHÒNG TRỐNG (chọn phòng cụ thể)
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
    btn.textContent = phongDaChon.has(room.MaPhong) ? 'Đã chọn' : 'Chọn phòng';
    if (phongDaChon.has(room.MaPhong)) {
        btn.classList.add('is-selected');
        card.classList.add('is-selected');
    }
    btn.addEventListener('click', () => toggleChonPhong(room, card, btn));

    side.append(price, btn);
    card.append(media, info, side);

    return card;
}

function veDanhSachPhong(danhSach) {
    const grid = document.getElementById('roomResultGrid');
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

function veDanhSachPhongDaLoc() {
    const danhSach = timKiem.maLoaiPhong
        ? danhSachPhongTrong.filter((room) => room.MaLoaiPhong === timKiem.maLoaiPhong)
        : danhSachPhongTrong;

    veDanhSachPhong(danhSach);
}

async function taiPhongTrong() {
    const grid = document.getElementById('roomResultGrid');
    grid.innerHTML = '<p class="grid-state">Đang tìm phòng trống...</p>';

    try {
        const tongKhach = timKiem.nguoiLon + timKiem.treEm;
        // Chia đều số khách cho số phòng: tìm phòng có sức chứa phù hợp
        // cho TỪNG phòng, thay vì đòi một phòng chứa hết tổng số khách.
        const khachMoiPhong = Math.max(1, Math.ceil(tongKhach / timKiem.soPhong));

        const danhSach = await window.BookingAPI.getAvailableRooms(
            timKiem.ngayNhan,
            timKiem.ngayTra,
            khachMoiPhong
        );

        danhSachPhongTrong = Array.isArray(danhSach) ? danhSach : [];
        veDanhSachPhongDaLoc();
    } catch (error) {
        console.error('Không tải được phòng trống:', error);
        danhSachPhongTrong = [];
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

let modal;
let modalSteps;
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

        const form = document.getElementById('profileForm');
        form.hoTen.value = profile?.HoTen || '';
        form.soDienThoai.value = profile?.SoDienThoai || '';
        form.email.value = profile?.Email || '';
        form.diaChi.value = profile?.DiaChi || '';
        form.ngaySinh.value = profile?.NgaySinh ? String(profile.NgaySinh).slice(0, 10) : '';
        form.gioiTinh.value = profile?.GioiTinh || '';
        form.cccd.value = profile?.CCCD || '';

        // FIX: luôn set lại readOnly (kể cả về false) cho MỖI tài khoản.
        // Đây là single-page app (home.html không load lại trang khi
        // đăng nhập/đăng xuất), nên nếu chỉ set readOnly bên trong
        // "if (profile)", một tài khoản MỚI chưa có hồ sơ sẽ vẫn giữ
        // nguyên trạng thái khoá + giá trị CCCD sót lại từ tài khoản
        // trước đó đã xem trong cùng phiên trình duyệt.
        document.getElementById('profileCccd').readOnly = Boolean(profile?.CCCD);
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
        // Định dạng object {MaPhong, DonGia} theo đúng SP_TAO_DAT_PHONG
        // (JSON_TABLE ... PATH '$.MaPhong') - KHÔNG gửi mảng chuỗi.
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

        // Phòng vừa đặt coi như hết trống: xoá giỏ và tải lại danh sách.
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
            <a href="#" class="utility-link" id="loginTrigger">
                <svg viewBox="0 0 24 24" class="icon" aria-hidden="true">
                    <circle cx="11" cy="11" r="7"></circle>
                    <line x1="16.5" y1="16.5" x2="21" y2="21"></line>
                </svg>
                <span>Đăng nhập</span>
            </a>
            <span class="utility-sep">/</span>
            <button class="utility-link" type="button">
                <span>VIE</span>
                <svg viewBox="0 0 24 24" class="icon icon-sm" aria-hidden="true">
                    <polyline points="9 6 15 12 9 18"></polyline>
                </svg>
            </button>
        `;
        document.getElementById('loginTrigger').addEventListener('click', (e) => {
            e.preventDefault();
            moModal();
        });
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
        hoSoKhachHang = null;
        veKhuVucTaiKhoan();
    });
}


// ============================================================
// KHỞI CHẠY
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    modal = document.getElementById('bookingModal');
    modalSteps = document.querySelectorAll('#modalSteps li');

    setupMenu();
    setupGuestPicker();
    setupDates();
    setupSearch();
    veKhuVucTaiKhoan();
    loadLoaiPhong();

    // Tải sẵn phòng trống theo ngày mặc định để mục "Phòng còn trống"
    // không trống rỗng khi vừa vào trang (giống trang mẫu Vinpearl).
    docTimKiemTuForm();
    veTomTatKetQua();
    veGioPhong();
    taiPhongTrong();

    document.getElementById('continueBtn').addEventListener('click', moModal);
    document.getElementById('modalClose').addEventListener('click', dongModal);
    document.getElementById('successClose').addEventListener('click', dongModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) dongModal();
    });

    document.getElementById('roomTypeModalClose').addEventListener('click', dongModalChiTietLoaiPhong);
    document.getElementById('roomTypeModal').addEventListener('click', (e) => {
        if (e.target.id === 'roomTypeModal') dongModalChiTietLoaiPhong();
    });
    document.getElementById('roomTypeDetailDatPhong').addEventListener('click', () => {
        if (loaiPhongDangXem) locTheoLoaiPhong(loaiPhongDangXem.MaLoaiPhong);
        dongModalChiTietLoaiPhong();
    });

    document.getElementById('tabLogin').addEventListener('click', () => chonTab('login'));
    document.getElementById('tabRegister').addEventListener('click', () => chonTab('register'));

    document.getElementById('loginModalForm').addEventListener('submit', xuLyDangNhap);
    document.getElementById('registerModalForm').addEventListener('submit', xuLyDangKy);
    document.getElementById('profileForm').addEventListener('submit', xuLyLuuHoSo);
    document.getElementById('confirmForm').addEventListener('submit', xuLyXacNhanDatPhong);
});