# 📋 Jira Stories Chi Tiết — EPIC 7 → EPIC 8

---
---

# ⚙️ EPIC-7: Admin & Report

---

## JP-47: Report Generation API

### Summary
`[JP-47] Thiết kế API sinh báo cáo phân tích xu hướng nghiên cứu`

### Description
**User Story:**
Là một **Researcher/Lecturer**, tôi muốn **tạo và tải về báo cáo phân tích xu hướng nghiên cứu** dưới dạng **JSON hoặc PDF đơn giản** để **sử dụng trong bài giảng, đề cương nghiên cứu, hoặc báo cáo cho cơ quan**.

**Technical Details:**
- Tạo `ReportService.java` + Impl:
  - `generateTrendReport(ReportRequest request)` → `ReportResponse`
  - `getReportHistory(String username, Pageable pageable)` → `Page<ReportSummaryResponse>`
- `ReportRequest.java`:
  ```java
  {
    "title": "AI Research Trend Report 2024-2026",
    "keywords": ["artificial intelligence", "machine learning", "deep learning"],
    "yearFrom": 2024,
    "yearTo": 2026,
    "format": "JSON"    // JSON hoặc PDF
  }
  ```
- `ReportResponse.java`:
  ```java
  {
    "id": 1,
    "title": "AI Research Trend Report 2024-2026",
    "generatedAt": "2026-05-20T10:00:00",
    "summary": {
      "totalPapersAnalyzed": 1500,
      "timeRange": "2024-2026",
      "keywordsAnalyzed": 3
    },
    "trendData": [
      {
        "keyword": "artificial intelligence",
        "dataPoints": [{ "year": 2024, "count": 500 }, { "year": 2025, "count": 650 }, { "year": 2026, "count": 350 }],
        "totalPapers": 1500,
        "growthRate": 30.0
      },
      ...
    ],
    "topAuthors": [
      { "name": "John Smith", "paperCount": 25 },
      ...
    ],
    "topJournals": [
      { "name": "IEEE Transactions", "paperCount": 120 },
      ...
    ]
  }
  ```
- Tạo `ReportController.java`:
  - `POST /api/reports/generate` (AUTH) → sinh report JSON.
  - `GET /api/reports/history` (AUTH) → lịch sử reports đã tạo.
  - `GET /api/reports/{id}` (AUTH) → xem lại report cũ.
  - `GET /api/reports/{id}/download` (AUTH) → tải file PDF (optional, dùng iText hoặc OpenPDF).
- Đối với PDF (optional — nếu có thời gian):
  - Sử dụng thư viện **OpenPDF** hoặc **iText** (free version).
  - PDF chứa: tiêu đề, bảng tổng kết, bảng trend data, danh sách top authors/journals.
  - Trả về `byte[]` với Content-Type: `application/pdf`.

### Acceptance Criteria
- [ ] POST `/api/reports/generate` → HTTP 200, trả về report JSON đầy đủ.
- [ ] Report chứa đúng trend data cho các keywords được yêu cầu.
- [ ] Report chứa top authors và top journals liên quan.
- [ ] GET `/api/reports/history` → danh sách reports user đã tạo.
- [ ] GET `/api/reports/1` → xem lại report cũ.
- [ ] API yêu cầu JWT.
- [ ] (Optional) GET `/api/reports/1/download` → tải file PDF.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 4 (BE Trend) |
| **Epic** | EPIC-7: Admin & Report |
| **Sprint** | Sprint 5 |
| **Priority** | 🟡 Medium |
| **Story Points** | 5 |

---

## JP-48: Frontend - Admin Panel

### Summary
`[JP-48] Thiết kế giao diện trang Admin Panel`

### Description
**User Story:**
Là một **System Administrator**, tôi muốn **có một trang quản trị chuyên dụng** để **quản lý users, cấu hình nguồn dữ liệu API, và trigger đồng bộ dữ liệu thủ công** mà không cần can thiệp vào database.

**Technical Details:**
- Tạo file `src/pages/AdminPanel.jsx`.
- Route: `/admin` (Protected Route — chỉ role ADMIN).
- Layout dạng **Tabs** (Ant Design `Tabs`):
  - **Tab 1 — User Management:**
    - Table danh sách users: Username, Email, Full Name, Role, Status (Active/Inactive), Created At.
    - Search bar tìm user theo username/email.
    - Filter theo Role (dropdown).
    - Actions trên mỗi row:
      - Toggle Active/Inactive (Switch component).
      - Change Role (Select dropdown inline edit).
    - Pagination.
    - Gọi APIs: `GET /api/admin/users`, `PUT /api/admin/users/{id}/status`, `PUT /api/admin/users/{id}/role`.
  - **Tab 2 — API Data Sources:**
    - Table danh sách sources: Name, Base URL, Status (Active/Inactive), Last Sync At.
    - Toggle Active/Inactive cho mỗi source.
    - Button "Sync Now" cho mỗi source → trigger sync thủ công.
    - Khi sync đang chạy → hiện Spin loading trên button.
    - Hiển thị kết quả sync gần nhất: new papers, duplicates, errors.
    - Gọi APIs: `GET /api/admin/datasources`, `PUT /api/admin/datasources/{id}`, `POST /api/admin/sync/trigger`.
  - **Tab 3 — System Stats:**
    - Thống kê nhanh: total users, total papers, total syncs, last sync time.
    - Bảng sync history (5 lần sync gần nhất): source, time, results.
- Ant Design: `Tabs`, `Table`, `Switch`, `Select`, `Button`, `Spin`, `Tag`, `Popconfirm`, `message`.

### Acceptance Criteria
- [ ] Trang `/admin` chỉ hiển thị khi user có role ADMIN. User khác thấy trang 403.
- [ ] Tab User Management: hiển thị table users, search, filter, pagination hoạt động.
- [ ] Toggle Active/Inactive → API được gọi → status cập nhật.
- [ ] Tab API Sources: hiển thị danh sách sources với trạng thái.
- [ ] Nhấn "Sync Now" → trigger API sync → hiển thị loading → hiển thị kết quả.
- [ ] Tab System Stats: hiển thị các con số thống kê.
- [ ] Responsive table (scroll ngang trên mobile).

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 5 (FE Core) |
| **Epic** | EPIC-7: Admin & Report |
| **Sprint** | Sprint 5-6 |
| **Priority** | 🟡 Medium |
| **Story Points** | 5 |

---

## JP-49: Frontend - Reports Page

### Summary
`[JP-49] Thiết kế giao diện trang Reports`

### Description
**User Story:**
Là một **User đã đăng nhập**, tôi muốn **tạo báo cáo phân tích xu hướng tùy chỉnh** bằng cách **chọn keywords và khoảng thời gian** và **xem hoặc tải về báo cáo** để **sử dụng cho mục đích nghiên cứu hoặc giảng dạy**.

**Technical Details:**
- Tạo file `src/pages/Reports.jsx`.
- Route: `/reports` (Protected Route).
- Layout:
  - **Section 1 — Create Report:**
    - Form tạo report:
      - Input: Report title.
      - Multi-select: Keywords (autocomplete từ API `/keywords/top`).
      - Year range: From - To.
      - Format: Radio button (JSON / PDF).
      - Button "Tạo báo cáo" (Primary).
    - Sau khi tạo → hiển thị report ngay bên dưới.
  - **Section 2 — Report Viewer:**
    - Hiển thị report dạng structured:
      - Summary card: Total papers, time range, keywords analyzed.
      - Trend chart (reuse TrendLineChart component).
      - Table: Top Authors (name, paper count).
      - Table: Top Journals (name, paper count).
    - Button "Tải PDF" (nếu có API download PDF).
    - Button "Copy JSON" (copy raw JSON vào clipboard).
  - **Section 3 — Report History:**
    - Table lịch sử reports đã tạo: Title, Created At, Keywords, Action (View/Download).
    - Click "View" → load report cũ vào Report Viewer.
- Gọi APIs: `POST /api/reports/generate`, `GET /api/reports/history`, `GET /api/reports/{id}`.
- Tạo `src/api/reportApi.js`.

### Acceptance Criteria
- [ ] Form tạo report hiển thị đúng các fields.
- [ ] Nhấn "Tạo báo cáo" → gọi API → hiển thị report trong Report Viewer.
- [ ] Report Viewer hiển thị: summary, trend chart, top authors table, top journals table.
- [ ] Report History hiển thị danh sách reports cũ.
- [ ] Click "View" trong history → load report cũ.
- [ ] Button "Copy JSON" → copy JSON vào clipboard + hiện thông báo "Đã copy".
- [ ] Protected route — redirect login nếu chưa đăng nhập.
- [ ] Loading state khi đang tạo report.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 6 (FE Dashboard) |
| **Epic** | EPIC-7: Admin & Report |
| **Sprint** | Sprint 6 |
| **Priority** | 🟡 Medium |
| **Story Points** | 3 |

---
---

# 🧪 EPIC-8: Integration, Testing & Polish

---

## JP-50: Integration Testing (End-to-End)

### Summary
`[JP-50] Kiểm thử tích hợp End-to-End cho các luồng chính`

### Description
**User Story:**
Là một **Team Leader**, tôi muốn **kiểm thử toàn bộ hệ thống từ đầu đến cuối** để **đảm bảo Frontend gọi đúng API Backend, dữ liệu hiển thị chính xác, và tất cả luồng nghiệp vụ hoạt động trơn tru trước khi nộp bài**.

**Technical Details:**
- **Luồng 1 — Auth Flow:**
  1. Mở trang `/register` → điền form → nhấn Đăng ký → tạo user thành công.
  2. Mở trang `/login` → đăng nhập → redirect về Dashboard.
  3. Xem profile → cập nhật thông tin → verify đã update.
  4. Đổi mật khẩu → logout → đăng nhập lại bằng password mới.
  5. Để JWT hết hạn → gọi API → verify bị redirect về login.
- **Luồng 2 — Search + Bookmark Flow:**
  1. Mở trang Search → nhập keyword "machine learning" → nhấn Tìm kiếm.
  2. Verify danh sách papers hiển thị đúng.
  3. Click vào 1 paper → verify trang Detail hiển thị đầy đủ.
  4. Nhấn Bookmark → verify icon đổi trạng thái.
  5. Mở trang Bookmarks → verify paper vừa bookmark xuất hiện.
  6. Nhấn Bỏ lưu → verify paper biến mất.
- **Luồng 3 — Trend Analysis Flow:**
  1. Mở trang Dashboard → verify stat cards hiển thị số liệu.
  2. Verify line chart hiển thị dữ liệu papers theo năm.
  3. Verify trending topics hiển thị.
  4. Mở trang Trend Analysis → nhập keyword → verify chart hiển thị.
  5. Thêm keyword thứ 2 → verify compare mode.
- **Luồng 4 — Data Sync Flow:**
  1. Đăng nhập Admin → mở Admin Panel.
  2. Nhấn "Sync Now" cho OpenAlex source.
  3. Verify sync chạy và có kết quả (new papers > 0).
  4. Verify papers mới xuất hiện trong Search.
  5. Verify trends được cập nhật.
- **Luồng 5 — Follow + Notification Flow:**
  1. Follow 1 journal.
  2. Trigger sync → có paper mới thuộc journal đó.
  3. Verify notification bell hiển thị badge > 0.
  4. Click bell → verify thông báo hiển thị.
  5. Mark as read → verify badge giảm.
- Ghi chép kết quả test vào file Excel hoặc Google Sheet:
  - Cột: Test Case ID | Mô tả | Expected Result | Actual Result | Status (Pass/Fail) | Ghi chú

### Acceptance Criteria
- [ ] Tất cả 5 luồng test đều PASS (không có lỗi nghiêm trọng).
- [ ] Không có lỗi 500 Internal Server Error trong suốt quá trình test.
- [ ] Không có lỗi CORS.
- [ ] Không có lỗi JWT (token gắn đúng, expired xử lý đúng).
- [ ] Dữ liệu hiển thị trên Frontend khớp với dữ liệu trong Database.
- [ ] File kết quả test đã được ghi chép đầy đủ.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Leader (Bạn) |
| **Epic** | EPIC-8: Integration, Testing & Polish |
| **Sprint** | Sprint 6-7 |
| **Priority** | 🔴 Highest |
| **Story Points** | 5 |

---

## JP-51: Unit Tests cho Service Layer

### Summary
`[JP-51] Viết Unit Tests cho các Service classes quan trọng`

### Description
**User Story:**
Là một **Developer**, tôi muốn **viết unit tests cho các service layer chính** để **đảm bảo logic nghiệp vụ hoạt động đúng và phát hiện bug sớm khi refactor code**.

**Technical Details:**
- Sử dụng **JUnit 5** + **Mockito** + **AssertJ**.
- Mỗi thành viên viết test cho service mình phụ trách:
  
  **Thành viên 2 — Auth Tests:**
  - `AuthServiceTest.java`:
    - `testRegisterSuccess()` → mock UserRepository → verify user saved, password encoded.
    - `testRegisterDuplicateUsername()` → verify throws DuplicateResourceException.
    - `testLoginSuccess()` → verify JWT token returned.
    - `testLoginWrongPassword()` → verify throws UnauthorizedException.
  
  **Thành viên 3 — Paper Tests:**
  - `PaperServiceTest.java`:
    - `testSearchByKeyword()` → mock PaperRepository → verify correct results.
    - `testSearchWithFilters()` → verify multiple filters applied correctly.
    - `testGetPaperById()` → verify returns full detail.
    - `testGetPaperByIdNotFound()` → verify throws ResourceNotFoundException.
  - `BookmarkServiceTest.java`:
    - `testAddBookmark()` → verify bookmark saved.
    - `testAddDuplicateBookmark()` → verify throws exception.
  
  **Thành viên 4 — Trend Tests:**
  - `TrendAnalysisServiceTest.java`:
    - `testGetTrendByKeyword()` → verify correct aggregation.
    - `testCompareTrends()` → verify multi-keyword data.
    - `testGetTopTrendingTopics()` → verify sorted by growth rate.
    - `testGrowthRateCalculation()` → verify: (100 - 80) / 80 * 100 = 25%.
  
  **Leader — Core Tests:**
  - `DataSyncServiceTest.java`:
    - `testSyncFromSource()` → mock ExternalApiClient → verify papers saved.
    - `testDeduplicationByDoi()` → verify duplicate skipped.
    - `testDeduplicationByTitle()` → verify title-based dedup.
    - `testSyncResultCounts()` → verify new/duplicate/error counts.

- Cấu trúc test: Arrange → Act → Assert (AAA pattern).
- Mỗi class test tối thiểu 3-5 test methods.
- Chạy test: `mvn test` → tất cả tests PASS.

### Acceptance Criteria
- [ ] Tổng cộng tối thiểu **20 unit test methods** trên toàn bộ project.
- [ ] `mvn test` chạy thành công, tất cả tests PASS (0 failures).
- [ ] Mỗi thành viên Backend có ít nhất 3 test methods cho service của mình.
- [ ] Tests sử dụng Mockito để mock dependencies (không connect database thật).
- [ ] Tests cover các happy path và error path (ít nhất 1 test cho exception case).
- [ ] Test naming convention rõ ràng: `testMethodName_condition_expectedResult()`.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Tất cả Backend (Leader, TV2, TV3, TV4) |
| **Epic** | EPIC-8: Integration, Testing & Polish |
| **Sprint** | Sprint 6 |
| **Priority** | 🟠 High |
| **Story Points** | 5 |

---

## JP-52: Bug Fixing & UI/UX Polish

### Summary
`[JP-52] Sửa bugs, polish giao diện và tối ưu trải nghiệm người dùng`

### Description
**User Story:**
Là một **Team Leader**, tôi muốn **toàn bộ hệ thống không còn bugs nghiêm trọng** và **giao diện đẹp, mượt, chuyên nghiệp** để **đồ án đạt điểm cao khi demo trước giảng viên**.

**Technical Details:**
- **Bug Fixing:**
  - Duyệt qua tất cả bugs phát hiện từ Integration Testing (JP-50).
  - Phân loại: Critical (block user) / Major (sai logic) / Minor (UI lệch).
  - Ưu tiên fix Critical trước → Major → Minor.
  - Mỗi bug fix tạo 1 commit riêng: `[BUGFIX] Mô tả ngắn`.

- **UI/UX Polish (Frontend):**
  - Kiểm tra và fix responsive trên các kích thước: Desktop (1920px), Laptop (1366px), Tablet (768px), Mobile (375px).
  - Thêm loading states cho tất cả API calls (Spin, Skeleton).
  - Thêm empty states cho tất cả trang danh sách (bookmarks, notifications, search results).
  - Thêm error states (hiển thị thông báo lỗi thân thiện khi API fail).
  - Kiểm tra và chuẩn hóa font size, spacing, color cho toàn app.
  - Thêm hover effects cho các elements interactive (buttons, cards, links).
  - Kiểm tra tab navigation và accessibility cơ bản.

- **Backend Polish:**
  - Kiểm tra không có N+1 query (dùng `@EntityGraph` hoặc `JOIN FETCH`).
  - Kiểm tra tất cả API trả về format `ApiResponse<T>` thống nhất.
  - Kiểm tra validation messages rõ ràng, thân thiện (tiếng Việt hoặc tiếng Anh nhất quán).
  - Kiểm tra log level phù hợp (không log password, không log quá nhiều ở production).

### Acceptance Criteria
- [ ] Tất cả bugs Critical đã được fix.
- [ ] Tất cả bugs Major đã được fix (Minor có thể ghi nhận nhưng chấp nhận).
- [ ] Giao diện responsive trên cả Desktop và Mobile (không bị vỡ layout).
- [ ] Tất cả trang có loading state khi đang tải dữ liệu.
- [ ] Tất cả trang danh sách có empty state khi không có dữ liệu.
- [ ] Không có lỗi console JavaScript trên trình duyệt.
- [ ] Không có lỗi Hibernate N+1 query (kiểm tra bằng Hibernate logging).
- [ ] Toàn bộ API response format thống nhất.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Tất cả thành viên |
| **Epic** | EPIC-8: Integration, Testing & Polish |
| **Sprint** | Sprint 6-7 |
| **Priority** | 🟠 High |
| **Story Points** | 5 |

---

## JP-53: Documentation

### Summary
`[JP-53] Viết tài liệu dự án: README, API docs, hướng dẫn cài đặt`

### Description
**User Story:**
Là một **giảng viên chấm bài**, tôi muốn **có tài liệu hướng dẫn rõ ràng** để **tôi có thể clone repo, cài đặt, và chạy project thành công trên máy của mình mà không cần nhờ sinh viên hỗ trợ**.

**Technical Details:**
- **README.md** (root directory):
  ```markdown
  # Scientific Journal Publication Trend Tracking System
  
  ## Giới thiệu
  [Mô tả ngắn về dự án]
  
  ## Thành viên nhóm
  | STT | Họ tên | MSSV | Vai trò |
  
  ## Công nghệ sử dụng
  [Table tech stack]
  
  ## Yêu cầu hệ thống
  - Java 17+
  - Maven 3.8+
  - MySQL 8.x
  - Node.js 18+
  - npm 9+
  
  ## Hướng dẫn cài đặt và chạy
  ### Backend
  1. Tạo database: `CREATE DATABASE journal_tracker_db;`
  2. Cấu hình `application.yml` (username, password MySQL).
  3. `cd backend && mvn spring-boot:run`
  4. Swagger UI: http://localhost:8080/swagger-ui.html
  
  ### Frontend
  1. `cd frontend && npm install`
  2. `npm run dev`
  3. Truy cập: http://localhost:5173
  
  ## Tài khoản mặc định
  - Admin: admin / admin123
  - Researcher: researcher1 / password123
  - Student: student1 / password123
  
  ## Cấu trúc project
  [Mô tả cấu trúc thư mục]
  
  ## API Documentation
  [Link Swagger UI hoặc file API.md]
  ```
- **API Documentation:**
  - Swagger UI tự sinh từ SpringDoc annotations.
  - Thêm `@Operation(summary = "...")` và `@ApiResponse` annotations cho tất cả Controller methods.
  - Verify Swagger UI hiển thị đầy đủ tất cả endpoints, request/response schema.
- **docs/API.md** (backup):
  - Liệt kê tất cả API endpoints dạng table: Method | URL | Auth | Description.

### Acceptance Criteria
- [ ] README.md có đầy đủ: giới thiệu, thành viên, tech stack, hướng dẫn cài đặt, tài khoản mặc định.
- [ ] Một người mới clone repo → đọc README → cài đặt và chạy được project thành công.
- [ ] Swagger UI (`/swagger-ui.html`) hiển thị đầy đủ tất cả API endpoints.
- [ ] Mỗi API endpoint trên Swagger có description rõ ràng.
- [ ] File `docs/API.md` liệt kê tất cả endpoints.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Leader (Bạn) + Thành viên 2 |
| **Epic** | EPIC-8: Integration, Testing & Polish |
| **Sprint** | Sprint 7 |
| **Priority** | 🟡 Medium |
| **Story Points** | 3 |

---

## JP-54: Demo Preparation

### Summary
`[JP-54] Chuẩn bị demo: sample data, slide thuyết trình, và kịch bản demo`

### Description
**User Story:**
Là một **nhóm sinh viên**, chúng tôi muốn **có bài thuyết trình chuyên nghiệp và kịch bản demo mạch lạc** để **trình bày đồ án trước giảng viên một cách tự tin, rõ ràng và gây ấn tượng tốt**.

**Technical Details:**
- **Sample Data đẹp:**
  - Tạo script `V3__demo_data.sql`:
    - 50-100 bài báo mẫu trong lĩnh vực CS/AI (có thể sync thật từ OpenAlex hoặc insert thủ công).
    - 10+ journals đa dạng.
    - 30+ authors.
    - 20+ keywords phổ biến với usage_count hợp lý.
    - 3-5 research topics.
    - Dữ liệu publication_trends đã được tính toán sẵn.
    - Tài khoản demo đã có bookmarks, follows, notifications.
  - Dữ liệu phải đủ "đẹp" để biểu đồ trend hiển thị line chart có ý nghĩa (xu hướng tăng/giảm rõ ràng).

- **Slide thuyết trình (PowerPoint / Google Slides):**
  - Slide 1: Trang bìa — tên đề tài, tên nhóm, giảng viên hướng dẫn.
  - Slide 2: Bối cảnh & Vấn đề.
  - Slide 3: Mục tiêu & Phạm vi.
  - Slide 4: Kiến trúc hệ thống (sơ đồ architecture).
  - Slide 5: Công nghệ sử dụng.
  - Slide 6: ERD (Entity Relationship Diagram).
  - Slide 7: Use Case Diagram tổng quan.
  - Slide 8-12: Demo screenshots (Dashboard, Search, Trend Analysis, Admin).
  - Slide 13: Phân công nhiệm vụ nhóm.
  - Slide 14: Kết luận & Hướng phát triển.
  - Slide 15: Q&A.

- **Kịch bản demo (Demo Script):**
  1. **Mở Dashboard** → giới thiệu tổng quan hệ thống (stat cards, charts).
  2. **Tìm kiếm** → search "machine learning" → show kết quả + filters.
  3. **Xem chi tiết** → click vào 1 paper → show thông tin đầy đủ.
  4. **Bookmark** → bookmark paper → vào Bookmarks page verify.
  5. **Trend Analysis** → so sánh "AI" vs "blockchain" → show line chart.
  6. **Follow** → follow 1 journal → show notification khi có bài mới.
  7. **Admin Panel** → quản lý users, trigger sync, xem sources.
  8. **Report** → tạo report → xem kết quả.
  - Thời gian demo: 10-15 phút.
  - Phân công: ai demo phần nào, ai trả lời câu hỏi gì.

- **Rehearsal (Tập dượt):**
  - Ngày 07/07 → 09/07: Tập demo ít nhất 2 lần.
  - Đảm bảo: không bị lỗi khi demo live, dữ liệu đẹp, mạng ổn định.

### Acceptance Criteria
- [ ] Sample data đã import thành công, Dashboard hiển thị đẹp.
- [ ] Biểu đồ trend hiển thị line chart có xu hướng rõ ràng (không phải data random).
- [ ] Slide thuyết trình hoàn chỉnh, ít nhất 12 slides.
- [ ] Kịch bản demo đã viết chi tiết từng bước.
- [ ] Đã tập dượt demo ít nhất 2 lần trước ngày nộp.
- [ ] Demo chạy mượt từ đầu đến cuối không có lỗi critical.
- [ ] Mỗi thành viên biết mình trả lời câu hỏi gì.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Tất cả thành viên |
| **Epic** | EPIC-8: Integration, Testing & Polish |
| **Sprint** | Sprint 7 |
| **Priority** | 🔴 Highest |
| **Story Points** | 5 |
