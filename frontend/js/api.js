<<<<<<< HEAD
const API_BASE_URL = 'http://localhost:3000/api';

// === REST Helpers ===
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
        
        return data.data || data; // backend returns { success: true, data: ... }
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// === Room Types API ===
window.RoomTypeAPI = {
    getAll: () => fetchAPI('/room-types'),
    create: (data) => fetchAPI('/room-types', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchAPI(`/room-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchAPI(`/room-types/${id}`, { method: 'DELETE' })
};

// === Rooms API ===
window.RoomAPI = {
    getAll: () => fetchAPI('/rooms'),
    getById: (id) => fetchAPI(`/rooms/${id}`),
    create: (data) => fetchAPI('/rooms', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => fetchAPI(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => fetchAPI(`/rooms/${id}`, { method: 'DELETE' }),
    getAvailable: (checkIn, checkOut) => fetchAPI(`/rooms/available?checkIn=${checkIn}&checkOut=${checkOut}`),
    checkAvailability: (roomId, checkIn, checkOut) => fetchAPI(`/rooms/check-availability?roomId=${roomId}&checkIn=${checkIn}&checkOut=${checkOut}`)
};
=======
(() => {
    const API_BASE_PATH = '/api';

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

        const response = await fetch(`${API_BASE_PATH}${path}`, {
            ...options,
            headers,
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

    window.api = {
        request,
        register(payload) {
            return request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        },
        login(payload) {
            return request('/auth/login', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        },
    };
})();
>>>>>>> feature/auth
