# CONVENTIONS.md -  Quy ước dự án Quản lý Khách sạn

> File này ghi lại các quy ước đã thống nhất trong nhóm. Đọc kỹ trước khi code.
Nếu muốn thay đổi quy ước nào, hãy thảo luận với cả nhóm trước khi sửa file này.
> 

---

## 1. Quy ước đặt tên (Naming Convention)

| Đối tượng | Quy ước | Ví dụ |
| --- | --- | --- |
| Tên bảng MySQL | `snake_case`, số ít | `user`, `room_type`, `booking` |
| Tên cột MySQL | `snake_case` | `room_id`, `check_in_date`, `total_price` |
| Khóa chính | `id` | `id` |
| Khóa ngoại | `<tên_bảng>_id` | `room_id`, `user_id` |
| Biến/hàm JS | `camelCase` | `getRoomById`, `totalPrice` |
| Class JS | `PascalCase` | `BookingController` |
| Tên file JS | `kebab-case` | `booking-controller.js`, `auth-middleware.js` |
| Hằng số | `UPPER_SNAKE_CASE` | `MAX_BOOKING_DAYS` |
| Nhánh Git | `feature/ten-chuc-nang`, `fix/ten-loi` | `feature/dat-phong`, `fix/loi-dang-nhap` |

---

## 2. Cấu trúc thư mục

```
hotel-management/
│
├── database/                    # Chứa toàn bộ script liên quan đến CSDL, tách riêng khỏi code backend
│   ├── schema.sql                # Script tạo bảng, khóa chính, khóa ngoại, ràng buộc
│   └── seed.sql                  # Dữ liệu mẫu để test (VD: vài phòng, vài tài khoản mẫu)
│
├── backend/                     # Toàn bộ server-side (NodeJS/Express)
│   │
│   ├── config/                   # Cấu hình hệ thống, kết nối tài nguyên bên ngoài
│   │   └── db.js                  # Khởi tạo kết nối MySQL (pool connection)
│   │
│   ├── controllers/              # Nhận request, gọi Service xử lý, trả response — KHÔNG chứa logic nghiệp vụ nặng
│   │   ├── authController.js      # Xử lý request đăng nhập/đăng ký
│   │   ├── roomController.js      # Xử lý request liên quan phòng
│   │   ├── bookingController.js   # Xử lý request đặt/hủy phòng
│   │   ├── customerController.js  # Xử lý request quản lý khách hàng
│   │   └── invoiceController.js   # Xử lý request hóa đơn/thanh toán
│   │
│   ├── services/                  # Chứa business logic thật sự: transaction, tính toán, kiểm tra ràng buộc nghiệp vụ
│   │   ├── bookingService.js      # Logic đặt phòng: kiểm tra trùng lịch, transaction, lock tránh race condition
│   │   └── invoiceService.js      # Logic tính tiền, tạo hóa đơn
│   │
│   ├── models/                   # Chứa các hàm truy vấn CSDL (query) cho từng bảng — KHÔNG chứa business logic
│   │   ├── User.js                # Query liên quan bảng user
│   │   ├── Room.js                # Query liên quan bảng room
│   │   ├── Booking.js             # Query liên quan bảng booking
│   │   ├── Customer.js            # Query liên quan bảng customer
│   │   └── Invoice.js             # Query liên quan bảng invoice
│   │
│   ├── routes/                   # Định nghĩa endpoint API, map URL → Controller tương ứng
│   │   ├── authRoutes.js
│   │   ├── roomRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── customerRoutes.js
│   │   └── invoiceRoutes.js
│   │
│   ├── middleware/                # Xử lý trước khi request chạm tới Controller
│   │   ├── authMiddleware.js       # Kiểm tra JWT, xác thực người dùng, phân quyền
│   │   ├── errorHandler.js         # Bắt lỗi tập trung, format response lỗi thống nhất
│   │   └── validators/             # Validate dữ liệu đầu vào (body, params) trước khi vào Controller
│   │       ├── bookingValidator.js
│   │       └── authValidator.js
│   │
│   ├── utils/                    # Hàm dùng chung, không gắn với 1 chức năng cụ thể nào
│   │   └── helpers.js              # VD: format ngày giờ, tạo mã đặt phòng random...
│   │
│   ├── .env                      # Biến môi trường thật (KHÔNG commit lên Git)
│   ├── .env.example              # Mẫu biến môi trường cần khai báo, để thành viên mới setup nhanh
│   ├── server.js                 # File khởi chạy Express app, gắn route, middleware
│   └── package.json              # Khai báo dependency & script chạy backend (npm start, npm run dev...)
│
├── frontend/                    # Toàn bộ client-side (HTML/CSS/JS thuần)
│   │
│   ├── public/                   # Các trang HTML chính, mỗi file tương ứng 1 màn hình
│   │   ├── index.html             # Trang đăng nhập / trang chủ
│   │   ├── dashboard.html         # Trang tổng quan quản trị
│   │   ├── rooms.html             # Màn hình quản lý phòng
│   │   ├── bookings.html          # Màn hình quản lý đặt phòng
│   │   ├── customers.html         # Màn hình quản lý khách hàng
│   │   └── invoices.html          # Màn hình hóa đơn
│   │
│   ├── css/                      # Toàn bộ style, tách theo từng phần để dễ maintain
│   │   ├── style.css               # Style dùng chung toàn site
│   │   └── dashboard.css           # Style riêng cho trang quản trị
│   │
│   ├── js/                       # Logic xử lý phía client cho từng trang
│   │   ├── api.js                  # Hàm gọi API dùng chung (wrap fetch/axios)
│   │   ├── auth.js                 # Xử lý đăng nhập, lưu token, kiểm tra phiên
│   │   ├── rooms.js                # Logic thao tác trang phòng
│   │   ├── bookings.js             # Logic thao tác trang đặt phòng
│   │   ├── customers.js            # Logic thao tác trang khách hàng
│   │   └── invoices.js             # Logic thao tác trang hóa đơn
│   │
│   └── assets/                   # Tài nguyên tĩnh dùng cho giao diện
│       └── images/                 # Hình ảnh, icon, logo...
│
├── .gitignore                   # Khai báo file/thư mục không đưa lên Git (node_modules, .env...)
├── README.md                    # Mô tả project, cách cài đặt & chạy
└── CONVENTIONS.md               # Quy ước dùng chung của nhóm (naming, git flow, API format...)
```

---

## 3. Công nghệ & thư viện dùng chung

- Kết nối MySQL: `mysql2` (query thuần)
- Xác thực: `JWT` (jsonwebtoken)
- Mã hóa mật khẩu: `bcrypt`
- Validate dữ liệu: `express-validator`
- Biến môi trường: `dotenv`  (thư viện giúp NodeJS đọc .env)
- Format code: `Prettier` + `ESLint` (dùng chung config trong repo)

> Không cài thêm thư viện lạ vào project nếu chưa thông báo với nhóm.
> 

---

## 4. Chuẩn API (REST)

**Định dạng endpoint:**

```
GET    /api/rooms          → lấy danh sách phòng
GET    /api/rooms/:id      → lấy chi tiết 1 phòng
POST   /api/rooms          → tạo phòng mới
PUT    /api/rooms/:id      → cập nhật phòng
DELETE /api/rooms/:id      → xóa phòng
```

**Format response chung:**

json

```json
{
  "success": true,
  "data": {},
  "message": "Thao tác thành công"
}
```

**Format lỗi:**

json

```json
{
  "success": false,
  "data": null,
  "message": "Mô tả lỗi cụ thể"
}
```

**Mã lỗi HTTP dùng chung:**

| Mã | Ý nghĩa |
| --- | --- |
| 200 | Thành công |
| 201 | Tạo mới thành công |
| 400 | Dữ liệu đầu vào không hợp lệ |
| 401 | Chưa đăng nhập / token sai |
| 403 | Không có quyền truy cập |
| 404 | Không tìm thấy dữ liệu |
| 500 | Lỗi server |

---

## 5. Quy trình Git

**Mô hình nhánh:**

```
main   → bản ổn định, chỉ merge từ dev sau khi test kỹ
dev    → nhánh tổng hợp, các feature merge vào đây trước
feature/xxx → mỗi người làm 1 nhánh riêng cho từng chức năng
```

**Quy tắc commit message:**

```
feat: thêm chức năng đặt phòng
fix: sửa lỗi không lưu được ngày check-in
refactor: tối ưu lại controller booking
docs: cập nhật README
```

**Quy trình:**

1. Tạo nhánh `feature/...` từ `dev`
2. Code xong → commit → push nhánh
3. Tạo Pull Request vào `dev`
4. Có ít nhất 1 thành viên review trước khi merge
5. Chỉ merge `dev` → `main` khi cả nhóm đồng ý (cuối mỗi giai đoạn)

---

## 6. Phân quyền người dùng

| Vai trò | Quyền hạn chính |
| --- | --- |
| Customer | Đặt phòng, xem phòng trống, hủy đặt phòng của mình |
| Staff | Đặt phòng hộ khách, nhận/trả phòng, thanh toán |
| Admin | Quản lý phòng/loại phòng, quản lý tài khoản, xem thống kê |

> Middleware kiểm tra quyền đặt tại `/server/middlewares/auth-middleware.js`, áp dụng cho từng route theo vai trò yêu cầu.
> 

---

## 7. Môi trường chung

- Node.js version: `>= 18.x` (thống nhất ghi trong `package.json` → `engines`)
- Dùng chung file `.eslintrc` và `.prettierrc` (không tự ý đổi rule cá nhân)
- File `.env` **không commit lên Git**, chỉ commit `.env.example`

---

## 8. Kiểm thử

- Test API bằng Postman trước khi tích hợp với frontend
- Người phụ trách module nào tự test module đó trước khi tạo Pull Request
- Test tích hợp cuối mỗi giai đoạn do cả nhóm cùng thực hiện

---

*Cập nhật lần cuối: ______ | Người cập nhật: ______*k