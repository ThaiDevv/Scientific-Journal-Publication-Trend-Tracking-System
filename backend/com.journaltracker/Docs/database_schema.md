# 🗄️ Database Schema — Journal Trend Tracker

> Trích xuất từ Jira Stories **EPIC-1 → EPIC-3**
> Database: MySQL | Tên DB: `journal_tracker_db`
> Quản lý migration: Flyway (`V1__init_schema.sql`)

---

## 📋 Danh sách các bảng (14 bảng)

| # | Tên bảng | Mô tả |
|---|----------|-------|
| 1 | `users` | Tài khoản người dùng |
| 2 | `research_papers` | Bài báo khoa học |
| 3 | `journals` | Tạp chí khoa học |
| 4 | `authors` | Tác giả bài báo |
| 5 | `keywords` | Từ khóa nghiên cứu |
| 6 | `research_topics` | Chủ đề nghiên cứu |
| 7 | `publication_trends` | Xu hướng xuất bản |
| 8 | `bookmarks` | Bài báo đã lưu của user |
| 9 | `notifications` | Thông báo hệ thống |
| 10 | `follows` | Theo dõi (journal/author/keyword) |
| 11 | `api_data_sources` | Nguồn API dữ liệu bên ngoài |
| 12 | `paper_authors` | 🔗 Bảng trung gian: bài báo ↔ tác giả |
| 13 | `paper_keywords` | 🔗 Bảng trung gian: bài báo ↔ từ khóa |
| 14 | `topic_keywords` | 🔗 Bảng trung gian: chủ đề ↔ từ khóa |

---

## 1. `users`

> Lưu thông tin tài khoản. Role được lưu dạng STRING (không phải ordinal).

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `id` | BIGINT | PK, AUTO_INCREMENT | Khóa chính |
| `username` | VARCHAR(50) | NOT NULL, UNIQUE | Tên đăng nhập |
| `email` | VARCHAR(100) | NOT NULL, UNIQUE | Địa chỉ email |
| `password_hash` | VARCHAR(255) | NOT NULL | Mật khẩu BCrypt hash |
| `full_name` | VARCHAR(150) | NOT NULL | Họ và tên |
| `role` | ENUM / VARCHAR(20) | NOT NULL | `RESEARCHER` \| `LECTURER` \| `STUDENT` \| `ADMIN` |
| `is_active` | BOOLEAN | DEFAULT TRUE | Tài khoản có hoạt động không |
| `created_at` | DATETIME | NOT NULL | Thời điểm tạo (auto) |
| `updated_at` | DATETIME | NOT NULL | Thời điểm cập nhật (auto) |

**Validation (DTO):** `username` size 3–50, `email` đúng format, `password` min 6 ký tự, role chỉ được chọn từ 3 giá trị (không bao gồm ADMIN khi đăng ký)

---

## 2. `journals`

> Tạp chí khoa học. Được tham chiếu từ `research_papers`.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `id` | BIGINT | PK, AUTO_INCREMENT | Khóa chính |
| `name` | VARCHAR(255) | NOT NULL | Tên tạp chí |
| `issn` | VARCHAR(20) | | Mã ISSN |
| `publisher` | VARCHAR(255) | | Nhà xuất bản |
| `field` | VARCHAR(100) | | Lĩnh vực (ví dụ: Computer Science) |
| `paper_count` | INT | DEFAULT 0 | Tổng số bài báo |

> 💡 Tạo bảng `journals` **trước** `research_papers` vì `research_papers` có FK → `journals.id`

---

## 3. `research_papers`

> Bài báo khoa học. DOI là định danh duy nhất từ nguồn bên ngoài.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `id` | BIGINT | PK, AUTO_INCREMENT | Khóa chính |
| `doi` | VARCHAR(255) | UNIQUE | Digital Object Identifier |
| `title` | VARCHAR(1000) | NOT NULL | Tiêu đề bài báo |
| `abstract_text` | TEXT | | Tóm tắt bài báo (nội dung dài) |
| `publication_year` | INT | | Năm xuất bản |
| `source_url` | VARCHAR(2000) | | URL gốc bài báo |
| `source_api` | VARCHAR(50) | | Nguồn API (OpenAlex / Crossref / Semantic Scholar) |
| `journal_id` | BIGINT | FK → `journals.id` | Tạp chí chứa bài báo |
| `fetched_at` | DATETIME | | Thời điểm thu thập từ API |
| `created_at` | DATETIME | NOT NULL | Thời điểm tạo record |

**Quan hệ:**
- `ManyToOne` → `journals` (qua `journal_id`)
- `ManyToMany` → `authors` (qua bảng `paper_authors`)
- `ManyToMany` → `keywords` (qua bảng `paper_keywords`)

---

## 4. `authors`

> Tác giả bài báo. `external_id` là ID từ nguồn API bên ngoài.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `id` | BIGINT | PK, AUTO_INCREMENT | Khóa chính |
| `name` | VARCHAR(255) | NOT NULL | Tên tác giả |
| `external_id` | VARCHAR(255) | UNIQUE | ID từ API ngoài (OpenAlex author ID, v.v.) |
| `affiliation` | VARCHAR(500) | | Đơn vị công tác (trường/viện) |

**Quan hệ:** `ManyToMany` ↔ `research_papers` (qua bảng `paper_authors`)

---

## 5. `keywords`

> Từ khóa nghiên cứu. `usage_count` tăng khi được gán vào bài báo mới.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `id` | BIGINT | PK, AUTO_INCREMENT | Khóa chính |
| `name` | VARCHAR(255) | NOT NULL, UNIQUE | Tên từ khóa (case-insensitive unique) |
| `usage_count` | INT | DEFAULT 0 | Số lượng bài báo sử dụng từ khóa này |

**Quan hệ:** `ManyToMany` ↔ `research_papers` (qua `paper_keywords`)

---

## 6. `research_topics`

> Chủ đề nghiên cứu tổng hợp. `is_trending` đánh dấu chủ đề đang nổi.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `id` | BIGINT | PK, AUTO_INCREMENT | Khóa chính |
| `name` | VARCHAR(255) | NOT NULL | Tên chủ đề |
| `description` | TEXT | | Mô tả chi tiết chủ đề |
| `is_trending` | BOOLEAN | DEFAULT FALSE | Đánh dấu đang trending |

**Quan hệ:** `ManyToMany` ↔ `keywords` (qua bảng `topic_keywords`)

---

## 7. `publication_trends`

> Lưu dữ liệu xu hướng xuất bản theo năm, tính cho từng keyword.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `id` | BIGINT | PK, AUTO_INCREMENT | Khóa chính |
| `keyword_id` | BIGINT | FK → `keywords.id` | Từ khóa tham chiếu |
| `year` | INT | NOT NULL | Năm thống kê |
| `paper_count` | INT | DEFAULT 0 | Số bài báo trong năm đó |
| `growth_rate` | DECIMAL(5,2) | | Tỷ lệ tăng trưởng so với năm trước (%) |

---

## 8. `bookmarks`

> Danh sách bài báo user đã lưu. Cascade DELETE khi xóa user hoặc paper.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `id` | BIGINT | PK, AUTO_INCREMENT | Khóa chính |
| `user_id` | BIGINT | FK → `users.id` ON DELETE CASCADE | Người dùng |
| `paper_id` | BIGINT | FK → `research_papers.id` ON DELETE CASCADE | Bài báo được lưu |
| `created_at` | DATETIME | NOT NULL | Thời điểm bookmark |

> 💡 Nên thêm UNIQUE constraint trên `(user_id, paper_id)` để tránh bookmark trùng

---

## 9. `notifications`

> Thông báo gửi đến từng user. Cascade DELETE khi xóa user.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `id` | BIGINT | PK, AUTO_INCREMENT | Khóa chính |
| `user_id` | BIGINT | FK → `users.id` ON DELETE CASCADE | Người nhận thông báo |
| `title` | VARCHAR(255) | NOT NULL | Tiêu đề thông báo |
| `message` | TEXT | NOT NULL | Nội dung thông báo |
| `is_read` | BOOLEAN | DEFAULT FALSE | Đã đọc chưa |
| `created_at` | DATETIME | NOT NULL | Thời điểm tạo thông báo |

---

## 10. `follows`

> User có thể follow journal, author, hoặc keyword. `follow_type` + `target_id` xác định đối tượng.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `id` | BIGINT | PK, AUTO_INCREMENT | Khóa chính |
| `user_id` | BIGINT | FK → `users.id` ON DELETE CASCADE | Người follow |
| `follow_type` | VARCHAR(20) | NOT NULL | `JOURNAL` \| `AUTHOR` \| `KEYWORD` |
| `target_id` | BIGINT | NOT NULL | ID của journal/author/keyword được follow |
| `created_at` | DATETIME | NOT NULL | Thời điểm follow |

> 💡 Nên thêm UNIQUE constraint trên `(user_id, follow_type, target_id)` để tránh follow trùng

---

## 11. `api_data_sources`

> Cấu hình các nguồn API bên ngoài dùng để thu thập dữ liệu bài báo.

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `id` | BIGINT | PK, AUTO_INCREMENT | Khóa chính |
| `name` | VARCHAR(100) | NOT NULL | Tên nguồn (OpenAlex, Crossref, Semantic Scholar) |
| `base_url` | VARCHAR(500) | NOT NULL | URL gốc của API |
| `api_key` | VARCHAR(500) | | API Key (nếu cần) |
| `is_active` | BOOLEAN | DEFAULT TRUE | Nguồn này có đang được dùng không |
| `last_sync_at` | DATETIME | | Lần cuối đồng bộ dữ liệu |

---

## 12. `paper_authors` 🔗

> **Bảng trung gian** — Quan hệ ManyToMany giữa `research_papers` và `authors`

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `paper_id` | BIGINT | PK (composite), FK → `research_papers.id` | Bài báo |
| `author_id` | BIGINT | PK (composite), FK → `authors.id` | Tác giả |

---

## 13. `paper_keywords` 🔗

> **Bảng trung gian** — Quan hệ ManyToMany giữa `research_papers` và `keywords`

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `paper_id` | BIGINT | PK (composite), FK → `research_papers.id` | Bài báo |
| `keyword_id` | BIGINT | PK (composite), FK → `keywords.id` | Từ khóa |

---

## 14. `topic_keywords` 🔗

> **Bảng trung gian** — Quan hệ ManyToMany giữa `research_topics` và `keywords`

| Cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
|-----|-------------|-----------|-------|
| `topic_id` | BIGINT | PK (composite), FK → `research_topics.id` | Chủ đề |
| `keyword_id` | BIGINT | PK (composite), FK → `keywords.id` | Từ khóa |

---

## 🔗 Sơ đồ quan hệ (ERD tóm tắt)

```
users (1) ────────── (N) bookmarks (N) ────────── (1) research_papers
users (1) ────────── (N) notifications
users (1) ────────── (N) follows

research_papers (N) ──── (N) authors          [via paper_authors]
research_papers (N) ──── (N) keywords         [via paper_keywords]
research_papers (N) ──── (1) journals

research_topics (N) ──── (N) keywords         [via topic_keywords]

keywords (1) ────────── (N) publication_trends
```

---

## 📦 Thứ tự tạo bảng trong Migration

> Phải tạo đúng thứ tự để tránh lỗi FK constraint

```
1. journals
2. users
3. research_papers      (FK → journals)
4. authors
5. keywords
6. research_topics
7. publication_trends   (FK → keywords)
8. bookmarks            (FK → users, research_papers)
9. notifications        (FK → users)
10. follows             (FK → users)
11. api_data_sources
12. paper_authors       (FK → research_papers, authors)
13. paper_keywords      (FK → research_papers, keywords)
14. topic_keywords      (FK → research_topics, keywords)
```

---

## 📝 Sample Data (`V2__insert_sample_data.sql`)

| Loại dữ liệu | Số lượng | Ghi chú |
|---|---|---|
| Admin account | 1 | `admin` / `admin123` (BCrypt hashed) |
| User mẫu | 2 | 1 Researcher + 1 Student |
| Research Papers | 5–10 | Bài báo mẫu |
| Journals | 3 | Ví dụ: IEEE, Nature, Springer |
| Authors | 5 | Tên tác giả mẫu |
| Keywords | 10 | Các từ khóa phổ biến |
