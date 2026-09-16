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
            checkIn: document.getElementById('ngayNhan').value,
            checkOut: document.getElementById('ngayTra').value,
            soPhong: state.phong,
            guests: state.nguoiLon + state.treEm,
            nguoiLon: state.nguoiLon,
            treEm: state.treEm,
            maUuDai: document.getElementById('maUuDai').value.trim()
        });

        window.location.href = `customer-rooms.html?${params.toString()}`;
    });
}


// ============================================================
// DANH SÁCH LOẠI PHÒNG
// ============================================================

const loaiPhongDuPhong = [
    {
        MaLoaiPhong: 'LP001',
        TenLoaiPhong: 'Standard',
        MoTa: 'Phòng tiêu chuẩn 1 giường.',
        SucChua: 2,
        GiaCoBan: 600000,
        Img: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&auto=format&fit=crop&q=80'
    },
    {
        MaLoaiPhong: 'LP002',
        TenLoaiPhong: 'Deluxe',
        MoTa: 'Phòng cao cấp 1 giường.',
        SucChua: 2,
        GiaCoBan: 900000,
        Img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80'
    },
    {
        MaLoaiPhong: 'LP003',
        TenLoaiPhong: 'Family',
        MoTa: 'Phòng gia đình 2 giường.',
        SucChua: 4,
        GiaCoBan: 1400000,
        Img: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&auto=format&fit=crop&q=80'
    },
    {
        MaLoaiPhong: 'LP004',
        TenLoaiPhong: 'Suite',
        MoTa: 'Phòng Suite cao cấp.',
        SucChua: 3,
        GiaCoBan: 2000000,
        Img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80'
    }
];

function chuanHoaLoaiPhong(loai) {
    return {
        MaLoaiPhong: loai.MaLoaiPhong || loai.id,
        TenLoaiPhong: loai.TenLoaiPhong || loai.name,
        MoTa: loai.MoTa ?? loai.description,
        SucChua: loai.SucChua ?? loai.capacity,
        GiaCoBan: loai.GiaCoBan ?? loai.price,
        TrangThai: loai.TrangThai || loai.status,
        Img: loai.Img || loai.image
    };
}

function taoTheLoaiPhong(loai) {
    const card = document.createElement('article');
    card.className = 'room-card';

    const media = document.createElement('div');
    media.className = 'room-media';
    const bgUrl = loai.Img || `https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80`;
    media.style.backgroundImage = `url("${bgUrl}")`;
    media.style.backgroundSize = 'cover';
    media.style.backgroundPosition = 'center';

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
    link.href = `customer-rooms.html?loaiPhong=${encodeURIComponent(loai.MaLoaiPhong)}`;
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

    danhSach.forEach((loai, i) => {
        const card = taoTheLoaiPhong(loai);
        card.style.transitionDelay = `${i * 0.12}s`;
        grid.appendChild(card);
        requestAnimationFrame(() => {
            setTimeout(() => card.classList.add('is-visible'), 50 + i * 120);
        });
    });
}


// ============================================================
// SCROLL REVEAL & HEADER
// ============================================================

function setupScrollReveal() {
    const heroReveals = document.querySelectorAll('.hero .reveal');
    heroReveals.forEach((el, i) => {
        setTimeout(() => el.classList.add('is-visible'), 200 + i * 120);
    });

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.reveal').forEach((el) => {
        if (!el.closest('.hero')) observer.observe(el);
    });
}

function setupHeaderScroll() {
    const header = document.getElementById('siteHeader');
    if (!header) return;

    const onScroll = () => {
        header.classList.toggle('is-scrolled', window.scrollY > 60);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}


// ============================================================
// ĐẾM SỐ THỐNG KÊ
// ============================================================

function animateCounter(el) {
    const target = Number(el.dataset.count) || 0;
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();

    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}

function setupCounters() {
    const nums = document.querySelectorAll('.stat-num[data-count]');
    if (!nums.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.5 }
    );

    nums.forEach((el) => observer.observe(el));
}


// ============================================================
// ƯU ĐÃI COUNTDOWN
// ============================================================

function setupOfferCountdown() {
    const el = document.getElementById('offerDeadline');
    if (!el) return;

    const end = new Date();
    end.setDate(end.getDate() + 30);

    function update() {
        const diff = end - Date.now();
        const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        el.innerHTML = `Kết thúc sau <strong>${days}</strong> ngày`;
    }

    update();
    setInterval(update, 60000);
}

async function loadLoaiPhong() {
    try {
        const data = await window.RoomTypeAPI.getAll();
        const danhSach = Array.isArray(data) ? data.map(chuanHoaLoaiPhong) : [];
        const dangBan = danhSach.filter((loai) => loai.TrangThai !== 'INACTIVE');

        veLoaiPhong(dangBan.length ? dangBan : loaiPhongDuPhong);
    } catch (error) {
        console.error('Không tải được loại phòng:', error);
        veLoaiPhong(loaiPhongDuPhong);
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
    setupScrollReveal();
    setupHeaderScroll();
    setupCounters();
    setupOfferCountdown();
    loadLoaiPhong();
});
