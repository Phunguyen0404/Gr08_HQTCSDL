### 📝 Hướng dẫn đồng bộ nhánh Feature với nhánh DEV mới



> **LƯU Ý QUAN TRỌNG:** Nhánh `DEV` hiện đã được tạo và đẩy lên Remote. Để tránh xung đột code (conflict) và lỗi làm vỡ dự án, **tất cả thành viên tuyệt đối không tạo Pull Request merge thẳng vào DEV khi chưa làm các bước dưới đây ở máy cá nhân (local).**



---



#### 🔄 Quy trình cập nhật code cho các nhánh Feature cũ



Nếu bạn đang làm việc trên một nhánh `feature` đã tạo từ trước, hãy thực hiện lần lượt các bước sau tại Terminal máy của bạn:



1. **Chuyển về nhánh Feature của bạn:** Bước 1.

Đảm bảo bạn đang đứng ở đúng nhánh tính năng đang làm việc và đã commit hết các thay đổi hiện tại:



```bash

git checkout feature/ten-nhanh-cua-ban

git status



```



*(Nếu còn file chưa commit, hãy `git add` và `git commit` trước).*





2. **Kéo nhánh DEV mới nhất từ Remote về:** Bước 2.

Tải thông tin các nhánh mới nhất từ server và gộp nhánh `DEV` vào nhánh tính năng của bạn tại máy local:



```bash

git fetch origin

git merge origin/dev



```





3. **Giải quyết Xung đột (Conflict) nếu có:** Bước 3.

* Nếu terminal báo **CONFLICT**, hãy mở VS Code (hoặc IDE đang dùng) để kiểm tra các file bị lỗi.

* Chọn giữ lại code đúng (Accept Current / Incoming / Both Changes).

* Sau khi sửa xong hết các file conflict, chạy lệnh:



```bash

git add .

git commit -m "fix: resolve conflict with dev"



```





4. **Kiểm tra ứng dụng tại máy local (Test):** Bước 4.

Chạy thử project tại máy bạn (build/run app) để đảm bảo tính năng của bạn và code từ nhánh `DEV` hoạt động bình thường, không làm hỏng ứng dụng.





5. **Đẩy code sạch lên Remote & Tạo Pull Request:** Bước 5.

Sau khi đã test chạy ổn định, đẩy code từ local lên lại nhánh feature trên remote:



```bash

git push origin feature/ten-nhanh-cua-ban



```



Cuối cùng, lên GitHub/GitLab tạo **Pull Request (PR)** từ `feature/ten-nhanh-cua-ban` vào `DEV`.





---



#### 📌 Quy tắc làm việc từ thời điểm này trở đi:



1. **Tạo nhánh mới:** Mọi nhánh tính năng mới từ bây giờ phải được tạo ra từ nhánh `DEV` (`git checkout dev` -> `git pull` -> `git checkout -b feature/tinh-nang-moi`).

2. **Không commit trực tiếp:** Không đẩy code thẳng lên nhánh `DEV`. Mọi thay đổi đều phải thông qua Pull Request.

---
