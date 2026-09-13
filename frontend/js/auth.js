/**
 * auth.js
 * Xử lý đăng nhập và đăng ký tài khoản.
 * Sau khi đăng nhập thành công, redirect theo role:
 *   ADMIN    → dashboard.html
 *   STAFF    → rooms.html
 *   CUSTOMER → bookings.html
 */

(() => {
    // ─── Nếu đã có token hợp lệ → auto redirect ─────────────────────────────────
    (function autoRedirectIfLoggedIn() {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        // Decode payload nhanh để kiểm tra expiry
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                if (payload.exp && Date.now() < payload.exp * 1000) {
                    redirectByRole(payload.role);
                    return;
                }
            }
        } catch {
            // Token lỗi – xóa và để user đăng nhập lại
        }

        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
    })();

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    function redirectByRole(role) {
        const map = {
            ADMIN: 'dashboard.html',
            STAFF: 'rooms.html',
            CUSTOMER: 'bookings.html'
        };
        window.location.replace(map[role] || 'dashboard.html');
    }

    function showMessage(message, isError = false) {
        authMessage.textContent = message;
        authMessage.className = isError ? 'auth-message error' : 'auth-message success';
        authMessage.setAttribute('aria-live', isError ? 'assertive' : 'polite');
    }

    function clearMessage() {
        authMessage.textContent = '';
        authMessage.className = 'auth-message';
    }

    function setLoading(form, loading) {
        const btn = form.querySelector('button[type="submit"]');
        if (btn) {
            btn.disabled = loading;
            btn.textContent = loading
                ? (form.id === 'loginForm' ? 'Đang đăng nhập...' : 'Đang đăng ký...')
                : (form.id === 'loginForm' ? 'Đăng nhập' : 'Đăng ký');
        }
    }

    function validateRegistration(username, password, confirmPassword) {
        if (!/^[A-Za-z0-9]{8,30}$/.test(username) || !/[A-Za-z]/.test(username)) {
            return 'Tên đăng nhập phải dài 8–30 ký tự, chỉ gồm chữ cái và chữ số, và có ít nhất một chữ cái.';
        }
        if (password.length < 8 || password.length > 30) {
            return 'Mật khẩu phải dài 8–30 ký tự.';
        }
        if (password !== confirmPassword) {
            return 'Mật khẩu xác nhận không khớp.';
        }
        return null;
    }

    function setMode(isRegister) {
        loginForm.hidden = isRegister;
        registerForm.hidden = !isRegister;
        authTitle.textContent = isRegister ? 'Đăng ký' : 'Đăng nhập';
        authSwitchText.textContent = isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?';
        authSwitch.textContent = isRegister ? 'Đăng nhập' : 'Đăng ký';
        clearMessage();
    }

    // ─── DOM refs ────────────────────────────────────────────────────────────────

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTitle = document.getElementById('authTitle');
    const authMessage = document.getElementById('authMessage');
    const authSwitch = document.getElementById('authSwitch');
    const authSwitchText = document.getElementById('authSwitchText');

    // ─── Login ───────────────────────────────────────────────────────────────────

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(loginForm);
        const username = formData.get('username').trim();
        const password = formData.get('password');

        if (!username || !password) {
            showMessage('Vui lòng nhập tên đăng nhập và mật khẩu.', true);
            return;
        }

        setLoading(loginForm, true);
        clearMessage();

        try {
            const result = await window.api.login({ username, password });
            const token = result?.data?.token;

            if (!token) {
                throw new Error('Phản hồi đăng nhập không có token.');
            }

            localStorage.setItem('authToken', token);
            if (result.data.user) {
                localStorage.setItem('authUser', JSON.stringify(result.data.user));
            }

            showMessage('Đăng nhập thành công! Đang chuyển hướng...');

            // Redirect sau 600ms để user thấy thông báo
            setTimeout(() => {
                redirectByRole(result.data.user?.role);
            }, 600);
        } catch (error) {
            setLoading(loginForm, false);
            showMessage(error.message || 'Đăng nhập thất bại.', true);
        }
    });

    // ─── Register ────────────────────────────────────────────────────────────────

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(registerForm);
        const username = formData.get('username').trim();
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        const validationError = validateRegistration(username, password, confirmPassword);
        if (validationError) {
            showMessage(validationError, true);
            return;
        }

        setLoading(registerForm, true);
        clearMessage();

        try {
            const result = await window.api.register({ username, password, confirmPassword });
            registerForm.reset();
            setMode(false);
            showMessage(result.message || 'Đăng ký thành công! Vui lòng đăng nhập.');
        } catch (error) {
            setLoading(registerForm, false);
            showMessage(error.message || 'Đăng ký thất bại.', true);
        }
    });

    // ─── Toggle mode ─────────────────────────────────────────────────────────────

    authSwitch.addEventListener('click', () => setMode(registerForm.hidden));
})();