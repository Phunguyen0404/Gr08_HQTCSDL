(() => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTitle = document.getElementById('authTitle');
    const authMessage = document.getElementById('authMessage');
    const authSwitch = document.getElementById('authSwitch');
    const authSwitchText = document.getElementById('authSwitchText');

    function showMessage(message, isError = false) {
        authMessage.textContent = message;
        authMessage.setAttribute('aria-live', isError ? 'assertive' : 'polite');
    }

    function validateRegistration(username, password, confirmPassword) {
        if (!/^[A-Za-z0-9]{8,30}$/.test(username) || !/[A-Za-z]/.test(username)) {
            return 'Tên đăng nhập phải dài 8-30 ký tự, chỉ gồm chữ cái và chữ số, và có ít nhất một chữ cái.';
        }
        if (password.length < 8 || password.length > 30) {
            return 'Mật khẩu phải dài 8-30 ký tự.';
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
        showMessage('');
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(loginForm);
        const username = formData.get('username').trim();
        const password = formData.get('password');

        if (!username || !password) {
            showMessage('Vui lòng nhập tên đăng nhập và mật khẩu.', true);
            return;
        }

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
            showMessage(result.message || 'Đăng nhập thành công.');
        } catch (error) {
            showMessage(error.message, true);
        }
    });

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

        try {
            const result = await window.api.register({ username, password, confirmPassword });
            loginForm.reset();
            setMode(false);
            showMessage(result.message || 'Đăng ký thành công. Vui lòng đăng nhập.');
        } catch (error) {
            showMessage(error.message, true);
        }
    });

    authSwitch.addEventListener('click', () => setMode(registerForm.hidden));
})();