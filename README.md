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


---



#### 🔄 Quy trình cập nhật code cho các nhánh Feature cũ



Nếu bạn đang làm việc trên một nhánh `feature` đã tạo từ trước, hãy thực hiện lần lượt các bước sau tại Terminal máy của bạn:



1. **Chuyển về nhánh Feature của bạn:** Bước 1.

Đảm bảo bạn đang đứng ở đúng nhánh tính năng đang làm việc và đã commit hết các thay đổi hiện tại:




git checkout feature/ten-nhanh-cua-ban

git status




*(Nếu còn file chưa commit, hãy `git add` và `git commit` trước).*





2. **Kéo nhánh DEV mới nhất từ Remote về:** Bước 2.

Tải thông tin các nhánh mới nhất từ server và gộp nhánh `DEV` vào nhánh tính năng của bạn tại máy local:




git fetch origin

git merge origin/dev






3. **Giải quyết Xung đột (Conflict) nếu có:** Bước 3.

* Nếu terminal báo **CONFLICT**, hãy mở VS Code (hoặc IDE đang dùng) để kiểm tra các file bị lỗi.

* Chọn giữ lại code đúng (Accept Current / Incoming / Both Changes).

* Sau khi sửa xong hết các file conflict, chạy lệnh:




git add .

git commit -m "fix: resolve conflict with dev"




4. **Kiểm tra ứng dụng tại máy local (Test):** Bước 4.

Chạy thử project tại máy bạn (build/run app) để đảm bảo tính năng của bạn và code từ nhánh `DEV` hoạt động bình thường, không làm hỏng ứng dụng.





5. **Đẩy code sạch lên Remote & Tạo Pull Request:** Bước 5.

Sau khi đã test chạy ổn định, đẩy code từ local lên lại nhánh feature trên remote:

git push origin feature/ten-nhanh-cua-ban

Cuối cùng, lên GitHub/GitLab tạo **Pull Request (PR)** từ `feature/ten-nhanh-cua-ban` vào `DEV`.





---



#### 📌 Quy tắc làm việc từ thời điểm này trở đi:



1. **Tạo nhánh mới:** Mọi nhánh tính năng mới từ bây giờ phải được tạo ra từ nhánh `DEV` (`git checkout dev` -> `git pull` -> `git checkout -b feature/tinh-nang-moi`).

2. **Không commit trực tiếp:** Không đẩy code thẳng lên nhánh `DEV`. Mọi thay đổi đều phải thông qua Pull Request.

---
