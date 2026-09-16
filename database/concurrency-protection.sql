-- Chạy một lần trên database hotel_management hiện có trước khi nạp lại procedures.sql.
-- MySQL 8.4 / InnoDB
USE hotel_management;

ALTER TABLE DAT_PHONG
    ADD COLUMN PhienBan INT UNSIGNED NOT NULL DEFAULT 1 AFTER GhiChu;

CREATE TABLE IF NOT EXISTS ID_SEQUENCE (
    TenSequence VARCHAR(64) NOT NULL,
    GiaTriTiepTheo BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (TenSequence)
) ENGINE = InnoDB;

CREATE INDEX IDX_CTDPT_MaPhong_MaDatPhong
    ON CHI_TIET_DAT_PHONG (MaPhong, MaDatPhong);

-- Không insert sequence ở đây: SP_TAO_DAT_PHONG tự lấy MAX hiện có khi khởi tạo lần đầu.
-- Sau khi chạy file này, chạy lại database/procedures.sql để cập nhật SP_TAO_DAT_PHONG.
