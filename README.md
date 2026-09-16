### 📝 Hướng dẫn đồng bộ nhánh Feature với nhánh DEV mới



> **LƯU Ý QUAN TRỌNG:** Nhánh `DEV` hiện đã được tạo và đẩy lên Remote. Để tránh xung đột code (conflict) và lỗi làm vỡ dự án, **tất cả thành viên tuyệt đối không tạo Pull Request merge thẳng vào DEV khi chưa làm các bước dưới đây ở máy cá nhân (local).**

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
└----------------------------------------------------------------## 🛠️ Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Backend | Node.js, Express |
| Frontend | HTML, CSS, JavaScript thuần |
| Database | MySQL |
| Auth | JWT |

---

### 🔄 Quy trình cập nhật code cho các nhánh Feature cũ

Nếu bạn đang làm việc trên một nhánh `feature` đã tạo từ trước, hãy thực hiện lần lượt các bước sau tại Terminal máy của bạn:

1. **Chuyển về nhánh Feature của bạn:**
```bash
git checkout feature/ten-nhanh-cua-ban
git status
```
*(Nếu còn file chưa commit, hãy `git add` và `git commit` trước).*

2. **Kéo nhánh DEV mới nhất từ Remote về:**
```bash
git fetch origin
git merge origin/dev
```

3. **Giải quyết Xung đột (Conflict) nếu có:**
* Nếu terminal báo **CONFLICT**, hãy mở VS Code (hoặc IDE đang dùng) để kiểm tra các file bị lỗi.
* Chọn giữ lại code đúng (Accept Current / Incoming / Both Changes).
* Sau khi sửa xong hết các file conflict, chạy lệnh:
```bash
git add .
git commit -m "fix: resolve conflict with dev"
```

4. **Kiểm tra ứng dụng tại máy local (Test):**
Chạy thử project tại máy bạn (build/run app) để đảm bảo tính năng của bạn và code từ nhánh `dev` hoạt động bình thường, không làm hỏng ứng dụng.

5. **Đẩy code sạch lên Remote & Tạo Pull Request:**
Sau khi đã test chạy ổn định, đẩy code từ local lên lại nhánh feature trên remote:
```bash
git push origin feature/ten-nhanh-cua-ban
```
Cuối cùng, lên GitHub/GitLab tạo **Pull Request (PR)** từ `feature/ten-nhanh-cua-ban` vào `dev`.

---

#### 📌 Quy tắc làm việc từ thời điểm này trở đi:
1. **Tạo nhánh mới:** Mọi nhánh tính năng mới từ bây giờ phải được tạo ra từ nhánh `dev` (`git checkout dev` -> `git pull origin dev` -> `git checkout -b feature/tinh-nang-moi`).
2. **Không commit trực tiếp:** Không đẩy code thẳng lên nhánh `dev`. Mọi thay đổi đều phải thông qua Pull Request.

---

## Chạy MySQL bằng Docker

1. Tạo file môi trường:

```bash
cp .env.example .env
```

2. Khởi động database:

```bash
docker compose up -d
```

3. Chạy backend:

```bash
npm install
npm run dev
```

MySQL sẽ chạy trong Docker ở `127.0.0.1:3307`, và lần khởi tạo đầu tiên sẽ tự import `database/schema.sql` cùng `database/seed.sql`.

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
```   │       ├── bookingValidator.js
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

