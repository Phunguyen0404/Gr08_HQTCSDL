const state = {
    availableRooms: [],
    selectedRoom: null,
    checkIn: null,
    checkOut: null,
    guests: 1,
    deposit: 0,
    customer: null,
    lookupResults: []
};

const staffIdInput = document.getElementById('staffIdInput');
const noteInput = document.getElementById('noteInput');

const lookupCccdInput = document.getElementById('lookupCccdInput');
const lookupPhoneInput = document.getElementById('lookupPhoneInput');
const lookupBtn = document.getElementById('lookupBtn');
const lookupResultsEl = document.getElementById('lookupResults');

const regHoTen = document.getElementById('regHoTen');
const regCccd = document.getElementById('regCccd');
const regPhone = document.getElementById('regPhone');
const regEmail = document.getElementById('regEmail');
const regNgaySinh = document.getElementById('regNgaySinh');
const regGioiTinh = document.getElementById('regGioiTinh');
const regDiaChi = document.getElementById('regDiaChi');
const registerBtn = document.getElementById('registerBtn');

const customerCard = document.getElementById('customerCard');
const customerCardName = document.getElementById('customerCardName');
const customerCardMeta = document.getElementById('customerCardMeta');
const clearCustomerBtn = document.getElementById('clearCustomerBtn');

const checkInInput = document.getElementById('checkInInput');
const checkOutInput = document.getElementById('checkOutInput');
const guestsInput = document.getElementById('guestsInput');
const depositInput = document.getElementById('depositInput');
const searchBtn = document.getElementById('searchBtn');
const formMessage = document.getElementById('formMessage');
const roomGrid = document.getElementById('roomGrid');

const summarySection = document.getElementById('summarySection');
const summaryRoomName = document.getElementById('summaryRoomName');
const summaryDates = document.getElementById('summaryDates');
const summaryPrice = document.getElementById('summaryPrice');
const summaryTotal = document.getElementById('summaryTotal');
const confirmBtn = document.getElementById('confirmBtn');

const stepEls = {
    customer: document.getElementById('stepCustomer'),
    criteria: document.getElementById('stepCriteria'),
    rooms: document.getElementById('stepRooms'),
    confirm: document.getElementById('stepConfirm')
};

function updateSteps() {
    const hasCustomer = !!state.customer;
    const hasCriteria = !!(checkInInput.value && checkOutInput.value);
    const hasRooms = state.availableRooms.length > 0;
    const hasSelection = !!state.selectedRoom;

    const steps = [
        { el: stepEls.customer, done: hasCustomer },
        { el: stepEls.criteria, done: hasCriteria && hasRooms, active: hasCustomer && !hasRooms },
        { el: stepEls.rooms, done: hasSelection, active: hasRooms && !hasSelection },
        { el: stepEls.confirm, active: hasSelection }
    ];

    steps.forEach(({ el, done, active }) => {
        if (!el) return;
        el.classList.remove('active', 'done');
        if (done) el.classList.add('done');
        else if (active) el.classList.add('active');
    });

    if (!hasCustomer) stepEls.customer?.classList.add('active');
}

function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

function formatDate(value) {
    return new Date(value).toLocaleDateString('vi-VN');
}

function showMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className = 'form-message' + (type ? ' ' + type : '');
}

function nightsBetween(checkIn, checkOut) {
    const ms = new Date(checkOut) - new Date(checkIn);
    return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

async function apiRequest(url, options = {}) {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };
    const res = await fetch(url, { ...options, headers });
    const body = await res.json();
    if (!res.ok || !body.success) {
        throw new Error(body.message || 'Đã có lỗi xảy ra');
    }
    return body.data;
}

// === Tabs khách hàng ===
document.querySelectorAll('.customer-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.customer-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.customer-tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab + 'Panel').classList.add('active');
    });
});

// === Tìm khách hàng đã có ===
function renderLookupResults() {
    if (!state.lookupResults.length) {
        lookupResultsEl.innerHTML = '<p style="margin:12px 0 0;font-size:13px;color:var(--lux-muted-fg);">Không tìm thấy khách hàng phù hợp. Hãy thử tab "Khách mới".</p>';
        return;
    }
    lookupResultsEl.innerHTML = state.lookupResults.map(c => `
    <div class="lookup-result-row">
      <div>
        <strong>${c.HoTen}</strong><br>
        <small>CCCD ${c.CCCD} · SĐT ${c.SoDienThoai}</small>
      </div>
      <button type="button" class="pick-btn" data-makh="${c.MaKH}">Chọn khách này</button>
    </div>
  `).join('');
}

async function handleLookup() {
    const cccd = lookupCccdInput.value.trim();
    const phone = lookupPhoneInput.value.trim();
    if (!cccd && !phone) {
        showMessage('Vui lòng nhập số CCCD hoặc số điện thoại để tìm kiếm.', 'error');
        return;
    }
    lookupBtn.disabled = true;
    try {
        const query = new URLSearchParams();
        if (cccd) query.set('cccd', cccd);
        if (phone) query.set('phone', phone);
        state.lookupResults = await apiRequest(`/api/customers/search?${query}`);
        renderLookupResults();
    } catch (err) {
        showMessage(err.message, 'error');
    } finally {
        lookupBtn.disabled = false;
    }
}

lookupResultsEl.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-makh]');
    if (!button) return;
    const customer = state.lookupResults.find(c => c.MaKH === button.dataset.makh);
    if (customer) setCustomer(customer);
});

// === Đăng ký khách vãng lai mới ===
async function handleRegister() {
    const payload = {
        hoTen: regHoTen.value.trim(),
        cccd: regCccd.value.trim(),
        soDienThoai: regPhone.value.trim(),
        email: regEmail.value.trim() || undefined,
        ngaySinh: regNgaySinh.value || undefined,
        gioiTinh: regGioiTinh.value || undefined,
        diaChi: regDiaChi.value.trim() || undefined
    };

    if (!payload.hoTen || !payload.cccd || !payload.soDienThoai) {
        showMessage('Vui lòng nhập đủ Họ tên, CCCD và Số điện thoại.', 'error');
        return;
    }

    registerBtn.disabled = true;
    try {
        const customer = await apiRequest('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        setCustomer(customer);
        showMessage(`Đăng ký khách vãng lai thành công · Mã KH ${customer.MaKH}`, 'success');
    } catch (err) {
        showMessage(err.message, 'error');
    } finally {
        registerBtn.disabled = false;
    }
}

function setCustomer(customer) {
    state.customer = customer;
    customerCardName.textContent = customer.HoTen;
    customerCardMeta.textContent = `Mã KH ${customer.MaKH} · CCCD ${customer.CCCD} · SĐT ${customer.SoDienThoai}`;
    customerCard.style.display = 'flex';
    updateSteps();
}

clearCustomerBtn.addEventListener('click', () => {
    state.customer = null;
    customerCard.style.display = 'none';
    updateSteps();
});

// === Tìm phòng trống ===
function renderRooms() {
    if (!state.availableRooms.length) {
        roomGrid.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            Không có phòng trống phù hợp trong khoảng ngày này.
          </div>`;
        updateSteps();
        return;
    }

    const isSelected = (room) => state.selectedRoom && state.selectedRoom.MaPhong === room.MaPhong;

    roomGrid.innerHTML = state.availableRooms.map(room => `
    <article class="room-card ${isSelected(room) ? 'selected' : ''}" data-room="${room.MaPhong}">
      <div class="room-card-header">
        <span class="room-number">${room.SoPhong}</span>
        <span class="room-type-tag">${room.TenLoaiPhong}</span>
      </div>
      <div class="room-card-body">
        <h3>Phòng ${room.SoPhong} · Tầng ${room.Tang}</h3>
        <p class="room-card-meta">${room.MoTa || 'Phòng tiêu chuẩn'} · Sức chứa ${room.SucChua} người</p>
        <div class="room-card-footer">
          <div class="room-price">
            <div class="amount">${formatCurrency(room.GiaCoBan)}</div>
            <div class="unit">/ đêm</div>
          </div>
          <button type="button" class="choose-btn" data-action="choose" data-room="${room.MaPhong}">
            ${isSelected(room) ? '✓ Đã chọn' : 'Chọn phòng'}
          </button>
        </div>
      </div>
    </article>
  `).join('');
    updateSteps();
}

function renderSummary() {
    if (!state.selectedRoom) {
        summarySection.style.display = 'none';
        updateSteps();
        return;
    }
    const nights = nightsBetween(state.checkIn, state.checkOut);
    const total = nights * Number(state.selectedRoom.GiaCoBan);

    summaryRoomName.textContent = `Phòng ${state.selectedRoom.SoPhong} · ${nights} đêm`;
    summaryDates.textContent = `${formatDate(state.checkIn)} – ${formatDate(state.checkOut)} · ${state.guests} khách`;
    summaryPrice.textContent = formatCurrency(state.selectedRoom.GiaCoBan);
    summaryTotal.textContent = formatCurrency(total);
    summarySection.style.display = 'block';
    updateSteps();
}

async function handleSearch() {
    state.checkIn = checkInInput.value;
    state.checkOut = checkOutInput.value;
    state.guests = Number(guestsInput.value) || 1;
    state.deposit = Number(depositInput.value) || 0;

    if (!state.checkIn || !state.checkOut) {
        showMessage('Vui lòng chọn ngày nhận và trả phòng.', 'error');
        return;
    }
    if (new Date(state.checkIn) >= new Date(state.checkOut)) {
        showMessage('Ngày nhận phòng phải trước ngày trả phòng.', 'error');
        return;
    }

    showMessage('Đang tìm phòng trống...', '');
    state.selectedRoom = null;
    renderSummary();

    try {
        const query = new URLSearchParams({
            checkIn: state.checkIn,
            checkOut: state.checkOut,
            guests: state.guests
        });
        state.availableRooms = await apiRequest(`/api/bookings/available-rooms?${query}`);
        renderRooms();
        showMessage(`Tìm thấy ${state.availableRooms.length} phòng trống.`, 'success');
    } catch (err) {
        showMessage(err.message, 'error');
    }
}

roomGrid.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action="choose"]');
    if (!button) return;
    const room = state.availableRooms.find(r => r.MaPhong === button.dataset.room);
    if (!room) return;
    state.selectedRoom = room;
    renderRooms();
    renderSummary();
    summarySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

// === Xác nhận đặt phòng hộ ===
async function handleConfirm() {
    if (!state.selectedRoom) return;
    if (!state.customer) {
        showMessage('Vui lòng chọn hoặc đăng ký khách hàng trước khi đặt phòng.', 'error');
        return;
    }

    confirmBtn.disabled = true;
    try {
        const result = await apiRequest('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerId: state.customer.MaKH,
                staffId: staffIdInput.value.trim() || 'NV001',
                checkIn: state.checkIn.includes(' ') ? state.checkIn : `${state.checkIn} 14:00:00`,
                checkOut: state.checkOut.includes(' ') ? state.checkOut : `${state.checkOut} 12:00:00`,
                guests: state.guests,
                deposit: state.deposit || 0,
                note: noteInput.value.trim() || undefined,
                rooms: [{ MaPhong: state.selectedRoom.MaPhong, DonGia: state.selectedRoom.GiaCoBan }]
            })
        });

        showMessage(`Đặt phòng hộ thành công · Mã đơn ${result.bookingCode} cho khách ${state.customer.HoTen}`, 'success');
        state.selectedRoom = null;
        renderSummary();
        await handleSearch();
    } catch (err) {
        showMessage(err.message, 'error');
    } finally {
        confirmBtn.disabled = false;
    }
}

lookupBtn.addEventListener('click', handleLookup);
registerBtn.addEventListener('click', handleRegister);
searchBtn.addEventListener('click', handleSearch);
confirmBtn.addEventListener('click', handleConfirm);

(function setDefaultDates() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);

    checkInInput.value = tomorrow.toISOString().slice(0, 10);
    checkOutInput.value = dayAfter.toISOString().slice(0, 10);
    updateSteps();
})();