// ============================================================
// TRANG CHỦ - ĐẶT PHÒNG
// ============================================================

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

const tienVN = new Intl.NumberFormat('vi-VN');


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
// CHỌN SỐ PHÒNG - SỐ NGƯỜI
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

        row.querySelector('output').textContent = value;
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

function toISO(date) {
    return date.toISOString().slice(0, 10);
}

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
// GỬI FORM TÌM KIẾM
// ============================================================

function setupSearch() {
    const form = document.getElementById('tim-kiem');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const params = new URLSearchParams({
            diemDen: document.getElementById('diemDen').value.trim(),
            ngayNhan: document.getElementById('ngayNhan').value,
            ngayTra: document.getElementById('ngayTra').value,
            soPhong: state.phong,
            nguoiLon: state.nguoiLon,
            treEm: state.treEm,
            maUuDai: document.getElementById('maUuDai').value.trim()
        });

        window.location.href = `rooms.html?${params.toString()}`;
    });
}


// ============================================================
// DANH SÁCH LOẠI PHÒNG
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

    const link = document.createElement('a');
    link.className = 'room-link';
    link.href = `rooms.html?loaiPhong=${encodeURIComponent(loai.MaLoaiPhong)}`;
    link.textContent = 'Xem phòng';

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

async function loadLoaiPhong() {
    try {
        const data = await window.RoomTypeAPI.getAll();
        const danhSach = Array.isArray(data) ? data : [];
        const dangBan = danhSach.filter((loai) => loai.TrangThai !== 'INACTIVE');

        veLoaiPhong(dangBan.length ? dangBan : loaiPhongMau);
    } catch (error) {
        console.error('Không tải được loại phòng:', error);
        veLoaiPhong(loaiPhongMau);
    }
}


// ============================================================
// KHỞI CHẠY
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    setupMenu();
    setupGuestPicker();
    setupDates();
    setupSearch();
    loadLoaiPhong();
});