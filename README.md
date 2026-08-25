# Hotel Management System

Hệ thống quản lý khách sạn: quản lý phòng, đặt phòng, khách hàng và hóa đơn. Backend viết bằng Node.js/Express, frontend HTML/CSS/JS thuần, cơ sở dữ liệu MySQL.

## 📌 Tính năng chính

- Đăng nhập / đăng ký, phân quyền người dùng (JWT)
- Quản lý phòng (thêm/sửa/xóa, trạng thái phòng)
- Đặt phòng / hủy phòng (kiểm tra trùng lịch, tránh race condition bằng transaction + lock)
- Quản lý khách hàng
- Quản lý hóa đơn / thanh toán

## Quản trị hệ thống và báo cáo thống kê
#1. Quản trị hệ thống
a.Xem danh sách nhân viên
Get/api/admin/staff
- Admin vào trang quản lí
- Gọi API
- Hệ thống trả về danh sách nhân viên

b.Xem thông tin nhân viên
Get/api/admin/staff/:id
- Admin chọn một nhân viên
- Gọi API với ID của nhân viên
- Hệ thống trả về thông tin nhân viên đó

c.Khóa/mở khóa tài khoản
PATCH/api/admin/staff/:id/status
- Admin bấm khóa hoặc mở khóa
- Gửi id để + thêm trạng mới 
- Hệ thống cập nhật trạng thái tài khoản

┌─------------------------------------------------------------------------------------------------┐
│ 🏨 HOTEL MANAGEMENT                                     |⌕|tìm kiếm...      |🔔|   Admin ▼     |
|-------------------------------------------------------------------------------------------------|
│🏠 Dashboard    │    QUẢN LÍ NHÂN VIÊN                                                           │
│--------------------------------------------------------------------------------------------------|   
|               | ┌----------------------┐    ┌----------------------┐  ┌--------------------┐     |
│ 👤 Tài khoản | ||💰|DOANH THU HÔM NAY |    ||📊| DOANH THU THÁNG |  ||🏨| TỶ LỆ LẤP ĐẦY  |     |    
|               | |       12.500.000$    |    |     185.500.000$     |  |           78%      |     |
|    nhân viên  | └----------------------┘   └----------------------┘ └----------------------┘     |
|               |                                                                                  |                              |               |                                                                                  | 
|               |   ┌-------------------------------------------┐                                  | 
|  💰Doanh thu |   | DOANH THU                7 ngày gần nhất▼ |                                   |
|              |    |thống kê doanh thu theo ngày               |           -------------          |
|🏨 tỉ lệ     |     | 20M  ---------------------------|\\|------|         -  TỈ LỆ    ... -        | 
|   lấp đầy    |    |                                 |\\| |\\| |        -  LẤP ĐẦY         -      |
|              |    | 15M  ----------------|\\|-------|\\|-|\\|-|       -       ----          -    |
|              |    |            |\\|      |\\| |\\|  |\\| |\\| |      -      -     -         -    |
|              |    | 10M  ------|\\|-|\\|-|\\|-|\\|--|\\|-|\\| |      -      - 78% -         -    |
|              |    |      |\\|  |\\| |\\| |\\| |\\|  |\\| |\\| |     -         ----          -    |
|              |    | 5M   |\\|--|\\|-|\\|-|\\|-|\\|--|\\|-|\\| |     -   ĐSD    39P           -   | # ĐANG SỬ DỤNG
|              |    |      |\\|  |\\| |\\| |\\| |\\|  |\\| |\\| |      -  PT     11P           -   | # PHÒNG TRỐNG`ww2
|              |    | 0M   |\\|--|\\|-|\\|-|\\|-|\\|--|\\|-|\\| |        -ĐD     3P           -    | #ĐANG DỌN
|              |    |       T2    T3   T4   T5   T6    T7   CN  |        - BT    2P         -      | #BẢO TRÌ
|              |    └-------------------------------------------┘           --------------         |
|              |                                                                                   |                              |              |    QUẢN LÍ TÀI KHOẢN NHÂN VIÊN              |+ THÊM NHÂN VIÊN|                    |
│              |  ┌-------------------------------------------------------------------------------┐|
│              |  │  Nhân viên   │ Email                  |vai trò   | Trạng thái     |  Ngày tạo ||
│              |  └-------------------------------------------------------------------------------┘|
│              |  │  Nguyễn Văn A │Nguyenvana@gmail.com   │Nhân viên │ Đang hoạt động | 1/8/2026  ||
│              |  │  Trần Thị B   │Tranthib@gmail.com     │Nhân viên | Đang hoạt động | 4/8/2026  ||  
│              |  │  Lê Văn C     │Levanc@gmail.com       │Nhân viên │ Đã khóa        | 21/8/2026 ||
│              |  │  Phạm Thị D   │Phamthid@gmail.com     │Nhân viên │ Đang hoạt động | 10/7/2026 || 
│ |AD |ADMIN   |  └-------------------------------------------------------------------------------┘|
│ Quản trị viên|                                                                                   |
│┌----------┐  |                                                                                   |
│  ĐĂNG XUẤT   |                                                                                   |
|└----------┘  |                                                                                   | 
└--------------------------------------------------------------------------------------------------┘
#2. Báo cáo thống kê
a.Xem thống kê doanh thu
Get/admin/reports/revenue
- Admin vào trang báo cáo thống kê
- Chọn khoảng thời gian hoặc xem theo ngày/tháng
- Gọi API
- Hệ thống lấy dữ liệu doanh thu
- Trả về thống kê doanh thu cho Admin

b.Xem tỷ lệ lấp đầy phòng
Get/api/admin/ reports/occupancy
- Admin vào trang báo cáo thống kê
- Chọn khoảng thời gian cần xem
- Gọi API
- Hệ thống lấy lấy dữ liệu phòng và lưu trú
- Trả về tỷ lệ lấp đầy phòng cho admin.


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