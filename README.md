# Hotel Management System

Hệ thống quản lý khách sạn: quản lý phòng, đặt phòng, khách hàng và hóa đơn. Backend viết bằng Node.js/Express, frontend HTML/CSS/JS thuần, cơ sở dữ liệu MySQL.

## 📌 Tính năng chính

- Đăng nhập / đăng ký, phân quyền người dùng (JWT)
- Quản lý phòng (thêm/sửa/xóa, trạng thái phòng)
- Đặt phòng / hủy phòng (kiểm tra trùng lịch, tránh race condition bằng transaction + lock)
- Quản lý khách hàng
- Quản lý hóa đơn / thanh toán

## 🛠️ Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Backend | Node.js, Express |
| Frontend | HTML, CSS, JavaScript thuần |
| Database | MySQL |
| Auth | JWT |

## 📁 Cấu trúc thư mục

```
hotel-management/
│
├── database/                    # Script liên quan CSDL, tách riêng khỏi backend
│   ├── schema.sql                # Tạo bảng, khóa chính, khóa ngoại, ràng buộc
│   └── seed.sql                  # Dữ liệu mẫu để test
│
├── backend/                     # Server-side (Node.js/Express)
│   ├── config/
│   │   └── db.js                  # Khởi tạo kết nối MySQL (pool connection)
│   │
│   ├── controllers/              # Nhận request, gọi Service xử lý, trả response
│   │   ├── authController.js
│   │   ├── roomController.js
│   │   ├── bookingController.js
│   │   ├── customerController.js
│   │   └── invoiceController.js
│   │
│   ├── services/                 # Business logic: transaction, tính toán, ràng buộc nghiệp vụ
│   │   ├── bookingService.js     # Kiểm tra trùng lịch, transaction, lock tránh race condition
│   │   └── invoiceService.js      # Tính tiền, tạo hóa đơn
│   │
│   ├── models/                   # Hàm truy vấn CSDL cho từng bảng
│   │   ├── User.js
│   │   ├── Room.js
│   │   ├── Booking.js
│   │   ├── Customer.js
│   │   └── Invoice.js
│   │
│   ├── routes/                   # Định nghĩa endpoint API, map URL → Controller
│   │   ├── authRoutes.js
│   │   ├── roomRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── customerRoutes.js
│   │   └── invoiceRoutes.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js       # Kiểm tra JWT, xác thực, phân quyền
│   │   ├── errorHandler.js         # Bắt lỗi tập trung, format response lỗi thống nhất
│   │   └── validators/
│   │       ├── bookingValidator.js
│   │       └── authValidator.js
│   │
│   ├── utils/
│   │   └── helpers.js              # Format ngày giờ, tạo mã đặt phòng random...
│   │
│   ├── .env                      # Biến môi trường thật (KHÔNG commit lên Git)
│   ├── .env.example              # Mẫu biến môi trường để setup nhanh
│   ├── server.js                 # Khởi chạy Express app, gắn route, middleware
│   └── package.json
│
├── frontend/                    # Client-side (HTML/CSS/JS thuần)
│   ├── public/
│   │   ├── index.html             # Trang đăng nhập / trang chủ
│   │   ├── dashboard.html         # Trang tổng quan quản trị
│   │   ├── rooms.html             # Quản lý phòng
│   │   ├── bookings.html          # Quản lý đặt phòng
│   │   ├── customers.html         # Quản lý khách hàng
│   │   └── invoices.html          # Hóa đơn
│   │
│   ├── css/
│   │   ├── style.css               # Style dùng chung
│   │   └── dashboard.css           # Style riêng trang quản trị
│   │
│   ├── js/
│   │   ├── api.js                  # Hàm gọi API dùng chung (wrap fetch/axios)
│   │   ├── auth.js                 # Đăng nhập, lưu token, kiểm tra phiên
│   │   ├── rooms.js
│   │   ├── bookings.js
│   │   ├── customers.js
│   │   └── invoices.js
│   │
│   └── assets/
│       └── images/
│
├── .gitignore
├── README.md
└── CONVENTIONS.md               # Quy ước nhóm (naming, git flow, API format...)
```