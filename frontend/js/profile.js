// ============================================================
// PROFILE CONTROLLER - LUXURY EDITORIAL THEME
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    initProfilePage();
});

async function initProfilePage() {
    const session = typeof authGuard !== 'undefined' ? authGuard.getSession() : null;
    if (!session || !session.user) {
        window.location.href = '/login?redirect=profile.html';
        return;
    }

    // Set greeting & logout
    const greeting = document.getElementById('userGreeting');
    if (greeting) {
        const name = session.user.hoTen || session.user.username;
        greeting.innerHTML = `Xin chào, <strong style="color:var(--amber-dark);">${name}</strong>`;
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            authGuard.logout();
        });
    }

    // Load Profile
    await loadCustomerProfile();

    // Form submit
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
    }
}

function formatCurrency(val) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
}

function formatDateInput(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
}

async function loadCustomerProfile() {
    const session = authGuard.getSession();
    const token = session?.token;

    try {
        const res = await fetch('/api/customers/profile', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        const result = await res.json();
        if (!result.success || !result.data) {
            showToast(result.message || 'Không thể tải thông tin hồ sơ.', 'error');
            return;
        }

        const data = result.data;
        const stats = data.stats || {};

        // Fill Hero / Sidebar Card
        document.getElementById('profileNameDisplay').textContent = data.HoTen || session.user.username;
        document.getElementById('profileUsernameDisplay').textContent = `@${session.user.username}`;
        document.getElementById('profileMaKH').textContent = data.MaKH || '-';
        document.getElementById('membershipTier').textContent = stats.membershipTier || 'Hạng Tiêu Chuẩn';
        document.getElementById('statTotalBookings').textContent = stats.totalBookings ?? 0;
        document.getElementById('statCompletedStays').textContent = stats.completedStays ?? 0;
        document.getElementById('statTotalSpend').textContent = formatCurrency(stats.totalSpend || 0);
        
        const discountRateEl = document.getElementById('membershipDiscount');
        if (discountRateEl) {
            discountRateEl.textContent = stats.discountRate ? `-${stats.discountRate}% ưu đãi đặt phòng` : 'Tích lũy thêm để nhận ưu đãi';
        }

        // Initials avatar
        const initials = getInitials(data.HoTen || session.user.username);
        const avatarEl = document.getElementById('profileAvatar');
        if (avatarEl) avatarEl.textContent = initials;

        // Fill Form Fields
        document.getElementById('inputHoTen').value = data.HoTen || '';
        document.getElementById('inputCCCD').value = data.CCCD || '';
        document.getElementById('inputPhone').value = data.SoDienThoai || '';
        document.getElementById('inputEmail').value = data.Email || '';
        document.getElementById('inputNgaySinh').value = formatDateInput(data.NgaySinh);
        document.getElementById('inputGioiTinh').value = data.GioiTinh || 'MALE';
        document.getElementById('inputQuocTich').value = data.QuocTich || 'Việt Nam';
        document.getElementById('inputDiaChi').value = data.DiaChi || '';

        // Load Preferences from localStorage
        loadPreferences();

    } catch (err) {
        console.error('Error loading profile:', err);
        showToast('Lỗi kết nối khi tải hồ sơ cá nhân.', 'error');
    }
}

async function handleProfileSubmit(e) {
    e.preventDefault();
    const session = authGuard.getSession();
    const token = session?.token;

    const hoTen = document.getElementById('inputHoTen').value.trim();
    const cccd = document.getElementById('inputCCCD').value.trim();
    const soDienThoai = document.getElementById('inputPhone').value.trim();
    const email = document.getElementById('inputEmail').value.trim();
    const ngaySinh = document.getElementById('inputNgaySinh').value || null;
    const gioiTinh = document.getElementById('inputGioiTinh').value;
    const quocTich = document.getElementById('inputQuocTich').value.trim();
    const diaChi = document.getElementById('inputDiaChi').value.trim();

    if (!hoTen || !cccd || !soDienThoai) {
        showToast('Vui lòng điền đủ Họ tên, CCCD/Hộ chiếu và Số điện thoại.', 'error');
        return;
    }

    const saveBtn = document.getElementById('saveProfileBtn');
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = 'Đang lưu...';

    try {
        const res = await fetch('/api/customers/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
                hoTen,
                cccd,
                soDienThoai,
                email,
                ngaySinh,
                gioiTinh,
                quocTich,
                diaChi
            })
        });

        const result = await res.json();
        if (result.success) {
            showToast('✓ Cập nhật hồ sơ cá nhân thành công!', 'success');
            
            // Save preferences
            savePreferences();

            // Update session user in localStorage
            if (session && session.user) {
                session.user.hoTen = hoTen;
                session.user.soDienThoai = soDienThoai;
                localStorage.setItem('authUser', JSON.stringify(session.user));
            }

            // Update Header greeting & Display Name
            document.getElementById('profileNameDisplay').textContent = hoTen;
            const greeting = document.getElementById('userGreeting');
            if (greeting) {
                greeting.innerHTML = `Xin chào, <strong style="color:var(--amber-dark);">${hoTen}</strong>`;
            }
            const avatarEl = document.getElementById('profileAvatar');
            if (avatarEl) avatarEl.textContent = getInitials(hoTen);

        } else {
            showToast(result.message || 'Không thể lưu thay đổi.', 'error');
        }
    } catch (err) {
        console.error('Error saving profile:', err);
        showToast('Lỗi kết nối khi cập nhật hồ sơ.', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
    }
}

function savePreferences() {
    const prefs = {
        floor: document.getElementById('prefFloor')?.value || '',
        bed: document.getElementById('prefBed')?.value || '',
        nonSmoking: document.getElementById('prefNonSmoking')?.checked || false,
        quiet: document.getElementById('prefQuiet')?.checked || false,
        airportShuttle: document.getElementById('prefAirport')?.checked || false,
        notes: document.getElementById('prefNotes')?.value || ''
    };
    localStorage.setItem('hotelCustomerPreferences', JSON.stringify(prefs));
}

function loadPreferences() {
    try {
        const raw = localStorage.getItem('hotelCustomerPreferences');
        if (!raw) return;
        const prefs = JSON.parse(raw);
        if (prefs.floor && document.getElementById('prefFloor')) document.getElementById('prefFloor').value = prefs.floor;
        if (prefs.bed && document.getElementById('prefBed')) document.getElementById('prefBed').value = prefs.bed;
        if (document.getElementById('prefNonSmoking')) document.getElementById('prefNonSmoking').checked = !!prefs.nonSmoking;
        if (document.getElementById('prefQuiet')) document.getElementById('prefQuiet').checked = !!prefs.quiet;
        if (document.getElementById('prefAirport')) document.getElementById('prefAirport').checked = !!prefs.airportShuttle;
        if (document.getElementById('prefNotes')) document.getElementById('prefNotes').value = prefs.notes || '';
    } catch (e) {
        console.error('Failed to load preferences:', e);
    }
}

function getInitials(name) {
    if (!name) return 'KH';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function showToast(message, type = 'success') {
    let toast = document.getElementById('profileToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'profileToast';
        toast.style.cssText = `
            position: fixed;
            bottom: 32px;
            right: 32px;
            padding: 14px 24px;
            background: #1a1a1a;
            color: #ffffff;
            font-size: 13.5px;
            font-weight: 500;
            border-left: 3px solid #d4af37;
            box-shadow: 0 8px 30px rgba(0,0,0,0.15);
            z-index: 99999;
            transition: opacity 0.3s ease, transform 0.3s ease;
            transform: translateY(10px);
            opacity: 0;
        `;
        document.body.appendChild(toast);
    }

    if (type === 'error') {
        toast.style.borderLeftColor = '#ef4444';
    } else {
        toast.style.borderLeftColor = '#d4af37';
    }

    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
    }, 4000);
}
