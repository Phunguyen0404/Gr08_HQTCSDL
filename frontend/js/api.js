// ============================================================
// API CLIENT DÙNG CHUNG CHO TOÀN BỘ FRONTEND
// ============================================================

const API_BASE_URL = '/api';

// === REST helper cho các API không cần token (kiểu cũ) ===
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Lỗi kết nối API');
        }

        return data.data !== undefined ? data.data : data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// === REST helper có gắn Bearer token (dùng cho các API yêu cầu đăng nhập) ===
async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const hasBody = options.body !== undefined && options.body !== null;

    if (hasBody && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const token = localStorage.getItem('authToken');
    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers
    });

    const contentType = response.headers.get('content-type') || '';
    const result = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        const message = typeof result === 'object' && result !== null
            ? result.message || result.error ||
                (Array.isArray(result.errors) ? result.errors.join(', ') : result.errors)
            : result;
        const error = new Error(
            typeof message === 'string'
                ? message
                : message ? JSON.stringify(message) : 'Yêu cầu không thành công'
        );
        error.status = response.status;
        error.details = result;
        throw error;
    }

    return result;
}

// === Auth API (đăng ký / đăng nhập) ===
window.api = {
    request,
    register(payload) {
        return request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    },
    login(payload) {
        return request('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
    },
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
    },
    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('authUser') || 'null');
        } catch (e) {
            return null;
        }
    },
    isLoggedIn() {
        return Boolean(localStorage.getItem('authToken'));
    }
};

// === Room Types API (dữ liệu mẫu - dùng cho trang quản trị) ===
window.RoomTypeAPI = {
    getAll: () => fetchAPI('/room-types'),
    create: (data) => fetchAPI('/room-types', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchAPI(`/room-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchAPI(`/room-types/${id}`, { method: 'DELETE' })
};

// === Rooms API (dữ liệu mẫu - dùng cho trang quản trị) ===
window.RoomAPI = {
    getAll: () => fetchAPI('/rooms'),
    getById: (id) => fetchAPI(`/rooms/${id}`),
    create: (data) => fetchAPI('/rooms', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchAPI(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchAPI(`/rooms/${id}`, { method: 'DELETE' }),
    getAvailable: (checkIn, checkOut) => fetchAPI(`/rooms/available?checkIn=${checkIn}&checkOut=${checkOut}`),
    checkAvailability: (roomId, checkIn, checkOut) => fetchAPI(`/rooms/check-availability?roomId=${roomId}&checkIn=${checkIn}&checkOut=${checkOut}`)
};

// === Loại phòng công khai (dữ liệu MySQL thật - dùng cho trang chủ) ===
window.PublicRoomTypeAPI = {
    getAll: () => fetchAPI('/public/room-types')
};

// === Đặt phòng cho khách hàng (dữ liệu MySQL thật) ===
window.BookingAPI = {
    // Công khai - không cần đăng nhập
    getAvailableRooms: (checkIn, checkOut, guests) =>
        fetchAPI(`/room-booking/available-rooms?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&guests=${encodeURIComponent(guests || 1)}`),
    // Cần đăng nhập
    create: (payload) => request('/room-booking', { method: 'POST', body: JSON.stringify(payload) }),
    listMine: () => request('/room-booking'),
    getById: (id) => request(`/room-booking/${id}`),
    cancel: (id, customerId) => request(`/room-booking/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ customerId }) })
};

// === Hồ sơ khách hàng ===
window.CustomerAPI = {
    getMyProfile: () => request('/customers/me'),
    saveMyProfile: (payload) => request('/customers/me', { method: 'POST', body: JSON.stringify(payload) })
};