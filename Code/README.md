
# MODULE ROOM MANAGEMENT

## Attributes (Thuộc tính)
| Thuộc tính| Kiểu dữ liệu |
|-----------|--------------|
| Mã Phòng  | INT          |
| Số phòng  | INT          |
| Loại Phòng| String       |
| Tầng      | INT          |
| Sức chứa  | INT          |
| Diện Tích | float        |
| Trạng thái| String       |
| Mô tả     | String       |
| Hình ảnh  | VARCHAR(255) |
| Ghi Chú   | String       |


# Luồng Hoạt Động

## ADMIN 

```mermaid
flowchart TD
    A[Đăng nhập] --> B[Quản lý phòng]
    B --> C[Thêm phòng]
    B --> D[Cập nhật phòng]
    B --> E[Xoá Phòng]
    C --> F[Lưu dữ liệu]
    D --> F
    E --> F
    F --> G[Hiển thị danh sách quản lý phòng]
```
**Quyền**
- Thêm, xoá, sửa  thông tin phòng.
- Thay đổi trạng thái phòng.
- Quản lý hình ảnh của phòng
