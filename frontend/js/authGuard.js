/**
 * authGuard.js
 * Bảo vệ trang frontend theo role (ADMIN / CUSTOMER).
 * Sử dụng: gọi requireAuth(['ADMIN']) ở đầu mỗi trang cần bảo vệ.
 */

(() => {
    // ─── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Decode phần payload của JWT mà không cần thư viện bên ngoài.
     * @param {string} token
     * @returns {object|null}
     */
    function decodeJWT(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            // Thêm padding nếu cần
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const jsonStr = atob(base64);
            return JSON.parse(jsonStr);
        } catch {
            return null;
        }
    }

    /**
     * Kiểm tra token có còn hợp lệ (chưa hết hạn) không.
     * @param {object} payload – decoded JWT payload
     * @returns {boolean}
     */
    function isTokenExpired(payload) {
        if (!payload || typeof payload.exp !== 'number') return true;
        return Date.now() >= payload.exp * 1000;
    }

    /**
     * Lấy thông tin user hiện tại từ localStorage + xác minh JWT.
     * @returns {{ token: string, user: object, payload: object }|null}
     */
    function getCurrentSession() {
        const token = localStorage.getItem('authToken');
        if (!token) return null;

        const payload = decodeJWT(token);
        if (!payload || isTokenExpired(payload)) {
            // Xóa session hết hạn
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            return null;
        }

        let user = null;
        try {
            user = JSON.parse(localStorage.getItem('authUser') || 'null');
        } catch {
            user = null;
        }

        // Nếu authUser bị thiếu, lấy từ payload
        if (!user) {
            user = {
                maTaiKhoan: payload.maTaiKhoan,
                username: payload.username,
                role: payload.role
            };
        }

        return { token, user, payload };
    }

    // ─── Redirect helpers ────────────────────────────────────────────────────────

    function redirectToLogin() {
        window.location.replace('../public/index.html');
    }

    function redirectByRole(role) {
        const map = {
            ADMIN: '../public/dashboard.html',
            CUSTOMER: '../public/bookings.html'
        };
        window.location.replace(map[role] || '../public/index.html');
    }

    // ─── Public API ──────────────────────────────────────────────────────────────

    /**
     * Bảo vệ trang hiện tại: chỉ cho phép các role trong allowedRoles.
     * Gọi ở đầu script của mỗi trang được bảo vệ.
     *
     * @param {string[]} allowedRoles – ví dụ: ['ADMIN', 'STAFF']
     */
    function requireAuth(allowedRoles = []) {
        const session = getCurrentSession();

        if (!session) {
            redirectToLogin();
            return;
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(session.user.role)) {
            // Không đủ quyền – redirect về trang phù hợp với role
            redirectByRole(session.user.role);
            return;
        }

        // Gắn thông tin user lên DOM nếu có placeholder
        applyUserInfo(session.user);
    }

    /**
     * Điền thông tin user thực vào các placeholder trên trang.
     * Tìm các element có data-auth-* attribute.
     */
    function applyUserInfo(user) {
        const roleLabel = { ADMIN: 'Quản trị viên', CUSTOMER: 'Khách hàng' };
        const initials = (user.username || 'U').slice(0, 2).toUpperCase();

        document.querySelectorAll('[data-auth-username]').forEach(el => {
            el.textContent = user.username || '';
        });
        document.querySelectorAll('[data-auth-role]').forEach(el => {
            el.textContent = roleLabel[user.role] || user.role || '';
        });
        document.querySelectorAll('[data-auth-initials]').forEach(el => {
            el.textContent = initials;
        });
    }

    /**
     * Đăng xuất: xóa session và redirect về login.
     */
    function logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        redirectToLogin();
    }

    /**
     * Lấy session hiện tại (cho các trang cần đọc user info).
     */
    function getSession() {
        return getCurrentSession();
    }

    // ─── Export ──────────────────────────────────────────────────────────────────

    window.authGuard = {
        requireAuth,
        logout,
        getSession,
        redirectByRole
    };
})();
