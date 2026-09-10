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
