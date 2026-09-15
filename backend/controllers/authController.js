const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SALT_ROUNDS = 10;
const MAX_ACCOUNT_ID_ATTEMPTS = 3;
const JWT_EXPIRES_IN = '1h';

function isDuplicateEntry(error) {
    return error?.code === 'ER_DUP_ENTRY';
}

function isDuplicateAccountId(error) {
    const databaseMessage = error?.sqlMessage || error?.message || '';

    return isDuplicateEntry(error) && databaseMessage.includes('PRIMARY');
}

async function register(req, res) {
    const { username, password } = req.body;

    try {
        const existingAccount = await User.findByUsername(username);

        if (existingAccount) {
            return res.status(409).json({
                success: false,
                message: 'Username đã tồn tại.'
            });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        for (let attempt = 1; attempt <= MAX_ACCOUNT_ID_ATTEMPTS; attempt += 1) {
            const maTaiKhoan = await User.generateAccountId();

            try {
                await User.createAccount({
                    maTaiKhoan,
                    username,
                    passwordHash,
                    role: 'CUSTOMER',
                    status: 'ACTIVE'
                });

                return res.status(201).json({
                    success: true,
                    message: 'Đăng ký tài khoản thành công.',
                    data: {
                        maTaiKhoan,
                        username,
                        vaiTro: 'CUSTOMER',
                        trangThai: 'ACTIVE'
                    }
                });
            } catch (error) {
                if (isDuplicateAccountId(error) && attempt < MAX_ACCOUNT_ID_ATTEMPTS) {
                    continue;
                }

                if (isDuplicateEntry(error) && !isDuplicateAccountId(error)) {
                    return res.status(409).json({
                        success: false,
                        message: 'Username đã tồn tại.'
                    });
                }

                throw error;
            }
        }
    } catch (error) {
        console.error('Registration failed:', error.message);
    }

    return res.status(500).json({
        success: false,
        message: 'Không thể đăng ký tài khoản. Vui lòng thử lại sau.'
    });
}

async function login(req, res) {
    const { username, password } = req.body;

    try {
        const account = await User.findByUsername(username);

        if (!account) {
            return res.status(401).json({
                success: false,
                message: 'Tên đăng nhập hoặc mật khẩu không đúng.'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, account.MatKhauHash);

        if (!isPasswordValid || account.TrangThai !== 'ACTIVE') {
            return res.status(401).json({
                success: false,
                message: 'Tên đăng nhập hoặc mật khẩu không đúng.'
            });
        }

        const token = jwt.sign(
            {
                maTaiKhoan: account.MaTaiKhoan,
                username: account.TenDangNhap,
                role: account.VaiTro
            },
            process.env.JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        return res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công.',
            data: {
                token,
                user: {
                    maTaiKhoan: account.MaTaiKhoan,
                    username: account.TenDangNhap,
                    role: account.VaiTro,
                    status: account.TrangThai
                }
            }
        });
    } catch (error) {
        console.error('Login failed:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Không thể đăng nhập. Vui lòng thử lại sau.'
        });
    }
}

module.exports = {
    register,
    login
};
