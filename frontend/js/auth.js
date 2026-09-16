/**
 * auth.js
 * Quản lý xác thực: Đăng nhập (/login) và Đăng ký (/register).
 * Xử lý validation trực tiếp tại từng field, loading state, và điều hướng theo role.
 */

(() => {
    // Tránh load script 2 lần nếu có nhiều thẻ script
    if (window.__AUTH_JS_INITIALIZED__) return;
    window.__AUTH_JS_INITIALIZED__ = true;

    // ─── 1. Tự động chuyển trang nếu đã đăng nhập ─────────────────────────────
    (function checkExistingSession() {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
                const payload = JSON.parse(atob(base64));
                if (payload.exp && Date.now() < payload.exp * 1000) {
                    const role = payload.role || 'ADMIN';
                    const target = role === 'CUSTOMER' ? 'customer-rooms.html' : 'dashboard.html';
                    window.location.replace(target);
                    return;
                }
            }
        } catch {
            // Token hỏng - dọn dẹp
        }

        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
    })();

    // ─── 2. Helpers thông báo & Validation ────────────────────────────────────
    function showAlert(message, type = 'error') {
        const alertBox = document.getElementById('authAlert');
        const alertText = document.getElementById('authAlertText');
        if (!alertBox || !alertText) return;

        alertText.textContent = message;
        alertBox.className = `auth-alert visible ${type}`;
        const icon = alertBox.querySelector('.auth-alert-icon');
        if (icon) {
            icon.textContent = type === 'success' ? '✅' : '⚠️';
        }
    }

    function hideAlert() {
        const alertBox = document.getElementById('authAlert');
        if (alertBox) {
            alertBox.className = 'auth-alert';
        }
    }

    function setFieldError(fieldId, message) {
        const fieldEl = document.getElementById(`field-${fieldId}`);
        const errorEl = document.getElementById(`error-${fieldId}`);
        if (fieldEl) {
            if (message) {
                fieldEl.classList.add('has-error');
            } else {
                fieldEl.classList.remove('has-error');
            }
        }
        if (errorEl) {
            errorEl.textContent = message || '';
        }
    }

    function clearFieldError(fieldId) {
        setFieldError(fieldId, '');
        hideAlert();
    }

    function setButtonLoading(button, isLoading, defaultText = '') {
        if (!button) return;
        button.disabled = isLoading;
        if (isLoading) {
            button.classList.add('loading');
            const textSpan = button.querySelector('.auth-btn-text');
            if (textSpan) textSpan.textContent = 'Đang xử lý...';
        } else {
            button.classList.remove('loading');
            const textSpan = button.querySelector('.auth-btn-text');
            if (textSpan && defaultText) textSpan.textContent = defaultText;
        }
    }

    // ─── 3. Khởi tạo khi DOM sẵn sàng ─────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        setupNavigationLinks();
        setupLoginForm();
        setupRegisterForm();
    });

    // Hỗ trợ cả Web Server (/login, /register) và static file (login.html, register.html)
    function setupNavigationLinks() {
        const toRegister = document.getElementById('toRegisterLink');
        if (toRegister) {
            toRegister.addEventListener('click', (e) => {
                if (window.location.protocol === 'file:') {
                    e.preventDefault();
                    window.location.href = 'register.html';
                }
            });
        }

        const toLogin = document.getElementById('toLoginLink');
        if (toLogin) {
            toLogin.addEventListener('click', (e) => {
                if (window.location.protocol === 'file:') {
                    e.preventDefault();
                    window.location.href = 'login.html';
                }
            });
        }
    }

    // ─── 4. Xử lý Form Đăng nhập ──────────────────────────────────────────────
    function setupLoginForm() {
        const form = document.getElementById('loginForm');
        if (!form) return;

        const usernameInput = document.getElementById('loginUsername');
        const passwordInput = document.getElementById('loginPassword');
        const submitBtn = document.getElementById('loginSubmitBtn');

        // Xóa lỗi khi gõ
        usernameInput?.addEventListener('input', () => clearFieldError('loginUsername'));
        passwordInput?.addEventListener('input', () => clearFieldError('loginPassword'));

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAlert();

            const username = (usernameInput?.value || '').trim();
            const password = passwordInput?.value || '';

            // Validation tại client
            let hasError = false;

            if (!username) {
                setFieldError('loginUsername', 'Vui lòng nhập tên đăng nhập.');
                hasError = true;
            } else {
                setFieldError('loginUsername', '');
            }

            if (!password) {
                setFieldError('loginPassword', 'Vui lòng nhập mật khẩu.');
                hasError = true;
            } else {
                setFieldError('loginPassword', '');
            }

            if (hasError) return;

            setButtonLoading(submitBtn, true, 'Đăng nhập');

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    const message = result.message || 'Tên đăng nhập hoặc mật khẩu không đúng.';
                    showAlert(message, 'error');
                    setButtonLoading(submitBtn, false, 'Đăng nhập');
                    return;
                }

                // Lưu token & user
                if (result.data && result.data.token) {
                    localStorage.setItem('authToken', result.data.token);
                    if (result.data.user) {
                        localStorage.setItem('authUser', JSON.stringify(result.data.user));
                    }

                    showAlert('Đăng nhập thành công! Đang chuyển hướng...', 'success');

                    const role = result.data.user?.role || 'ADMIN';
                    const targetPage = role === 'CUSTOMER' ? 'customer-rooms.html' : 'dashboard.html';

                    setTimeout(() => {
                        window.location.replace(targetPage);
                    }, 500);
                } else {
                    showAlert('Phản hồi server không hợp lệ. Vui lòng thử lại.', 'error');
                    setButtonLoading(submitBtn, false, 'Đăng nhập');
                }
            } catch (err) {
                console.error('Lỗi đăng nhập:', err);
                showAlert('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.', 'error');
                setButtonLoading(submitBtn, false, 'Đăng nhập');
            }
        });
    }

    // ─── 5. Xử lý Form Đăng ký ────────────────────────────────────────────────
    function setupRegisterForm() {
        const form = document.getElementById('registerForm');
        if (!form) return;

        const usernameInput = document.getElementById('registerUsername');
        const passwordInput = document.getElementById('registerPassword');
        const confirmPasswordInput = document.getElementById('registerConfirmPassword');
        const submitBtn = document.getElementById('registerSubmitBtn');

        // Xóa lỗi khi gõ
        usernameInput?.addEventListener('input', () => clearFieldError('registerUsername'));
        passwordInput?.addEventListener('input', () => clearFieldError('registerPassword'));
        confirmPasswordInput?.addEventListener('input', () => clearFieldError('registerConfirmPassword'));

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAlert();

            const username = (usernameInput?.value || '').trim();
            const password = passwordInput?.value || '';
            const confirmPassword = confirmPasswordInput?.value || '';

            // Validation tại client
            let hasError = false;

            // Username validation: 8-30 ký tự, có ít nhất 1 chữ cái, chỉ gồm chữ cái & số
            const usernameRegex = /^(?=.*[A-Za-z])[A-Za-z0-9]{8,30}$/;
            if (!username) {
                setFieldError('registerUsername', 'Vui lòng nhập tên đăng nhập.');
                hasError = true;
            } else if (!usernameRegex.test(username)) {
                setFieldError('registerUsername', 'Tên đăng nhập phải dài 8–30 ký tự, có ít nhất một chữ cái.');
                hasError = true;
            } else {
                setFieldError('registerUsername', '');
            }

            // Password validation: 8-30 ký tự
            if (!password) {
                setFieldError('registerPassword', 'Vui lòng nhập mật khẩu.');
                hasError = true;
            } else if (password.length < 8 || password.length > 30) {
                setFieldError('registerPassword', 'Mật khẩu phải dài từ 8 đến 30 ký tự.');
                hasError = true;
            } else {
                setFieldError('registerPassword', '');
            }

            // Confirm password validation
            if (!confirmPassword) {
                setFieldError('registerConfirmPassword', 'Vui lòng xác nhận lại mật khẩu.');
                hasError = true;
            } else if (confirmPassword !== password) {
                setFieldError('registerConfirmPassword', 'Mật khẩu xác nhận không khớp.');
                hasError = true;
            } else {
                setFieldError('registerConfirmPassword', '');
            }

            if (hasError) return;

            setButtonLoading(submitBtn, true, 'Đăng ký');

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, confirmPassword })
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    const message = result.message || 'Đăng ký không thành công.';
                    // Kiểm tra lỗi trùng lặp tên đăng nhập
                    if (
                        response.status === 409 ||
                        (result.errors && result.errors.some(err => /tồn tại|Username/i.test(err))) ||
                        /tồn tại|đã được sử dụng/i.test(message)
                    ) {
                        setFieldError('registerUsername', 'Tên đăng nhập này đã tồn tại trong hệ thống.');
                    } else if (result.errors && result.errors.length > 0) {
                        showAlert(result.errors.join('<br>'), 'error');
                    } else {
                        showAlert(message, 'error');
                    }
                    setButtonLoading(submitBtn, false, 'Đăng ký');
                    return;
                }

                // Đăng ký thành công
                showAlert('Đăng ký tài khoản thành công! Đang chuyển sang đăng nhập...', 'success');
                form.reset();

                setTimeout(() => {
                    if (window.location.protocol === 'file:') {
                        window.location.href = 'login.html';
                    } else {
                        window.location.href = '/login';
                    }
                }, 1200);

            } catch (err) {
                console.error('Lỗi đăng ký:', err);
                showAlert('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.', 'error');
                setButtonLoading(submitBtn, false, 'Đăng ký');
            }
        });
    }
})();