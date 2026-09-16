const validateRegister = (req, res, next) => {
    const {
        username,
        password,
        confirmPassword
    } = req.body;

    const errors = [];

    // Username
    if (typeof username !== 'string' || username.trim() === '') {
        errors.push('Username không được để trống.');
    } else if (!/^(?=.*[A-Za-z])[A-Za-z0-9]{8,30}$/.test(username)) {
        errors.push(
            'Username phải dài 8-30 ký tự, chỉ gồm chữ cái không dấu và chữ số, đồng thời phải có ít nhất một chữ cái.'
        );
    }

    // Password
    if (
        typeof password !== 'string' ||
        password.length < 8 ||
        password.length > 30
    ) {
        errors.push('Password phải dài từ 8 đến 30 ký tự.');
    }

    // Confirm password
    if (typeof confirmPassword !== 'string') {
        errors.push('Confirm password không hợp lệ.');
    } else if (password !== confirmPassword) {
        errors.push('Confirm password không khớp với password.');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu đăng ký không hợp lệ.',
            errors
        });
    }

    next();
};

const validateLogin = (req, res, next) => {
    const { username, password } = req.body;
    const errors = [];

    if (typeof username !== 'string' || username.trim() === '') {
        errors.push('Username không được để trống.');
    }

    if (typeof password !== 'string' || password === '') {
        errors.push('Password không được để trống.');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu đăng nhập không hợp lệ.',
            errors
        });
    }

    next();
};

module.exports = {
    validateRegister,
    validateLogin
};
