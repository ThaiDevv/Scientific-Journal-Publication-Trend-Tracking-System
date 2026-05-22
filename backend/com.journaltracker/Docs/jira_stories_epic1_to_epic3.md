# 📋 Jira Stories Chi Tiết — EPIC 1 → EPIC 3

> Copy trực tiếp nội dung từng Story vào Jira.
> Các trường **Summary** → dán vào ô tiêu đề, **Description** → dán vào ô mô tả, **Acceptance Criteria** → dán cuối Description hoặc vào checklist.

---
---

# 🏛️ EPIC-1: Project Setup & Foundation

---

## JP-1: Khởi tạo Spring Boot Project

### Summary
`[JP-1] Khởi tạo Spring Boot project và cấu hình Maven dependencies`

### Description
**User Story:**
Là một **Developer trong nhóm**, tôi muốn **có một project Spring Boot sẵn sàng** để **tôi có thể bắt đầu code các tính năng ngay lập tức mà không phải tự setup từ đầu**.

**Technical Details:**
- Truy cập [start.spring.io](https://start.spring.io) để khởi tạo project Spring Boot **3.2.x**.
- **Group:** `com.journaltracker`
- **Artifact:** `journal-trend-tracker`
- **Package name:** `com.journaltracker`
- **Java version:** 17
- **Build tool:** Maven
- Dependencies cần thêm vào `pom.xml`:
  - `spring-boot-starter-web`
  - `spring-boot-starter-data-jpa`
  - `spring-boot-starter-security`
  - `spring-boot-starter-validation`
  - `spring-boot-starter-webflux` (cho WebClient gọi API ngoài)
  - `mysql-connector-j`
  - `flyway-core` + `flyway-mysql`
  - `jjwt-api`, `jjwt-impl`, `jjwt-jackson` (version 0.12.x)
  - `mapstruct` + `mapstruct-processor`
  - `springdoc-openapi-starter-webmvc-ui`
  - `lombok`
  - `spring-boot-starter-test`
- Tạo cấu trúc package theo chuẩn:
  ```
  com.journaltracker/
  ├── config/
  ├── controller/
  ├── dto/request/
  ├── dto/response/
  ├── entity/
  ├── repository/
  ├── service/
  ├── service/impl/
  ├── security/
  ├── scheduler/
  ├── client/
  ├── mapper/
  ├── exception/
  └── util/
  ```
- Tạo file `application.yml` với các cấu hình cơ bản (server port, datasource, jpa, logging).

### Acceptance Criteria
- [ ] Project build thành công bằng lệnh `mvn clean install` mà không có lỗi.
- [ ] Chạy `mvn spring-boot:run` → ứng dụng khởi động thành công trên port 8080.
- [ ] Truy cập `http://localhost:8080/swagger-ui.html` hiển thị giao diện Swagger (có thể trống API).
- [ ] Tất cả các package đã được tạo đúng cấu trúc.
- [ ] File `application.yml` đã có các cấu hình cơ bản (datasource, jpa, server).
- [ ] Code đã được push lên branch `develop` trên GitHub.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Leader (Bạn) |
| **Epic** | EPIC-1: Project Setup & Foundation |
| **Sprint** | Sprint 1 |
| **Priority** | 🔴 Highest |
| **Story Points** | 3 |

---

## JP-2: Thiết kế Database & Flyway Migration

### Summary
`[JP-2] Thiết kế ERD hoàn chỉnh và tạo Flyway migration script`

### Description
**User Story:**
Là một **Developer**, tôi muốn **database schema đã sẵn sàng và được quản lý bằng Flyway** để **mọi thành viên chỉ cần chạy project là database tự động tạo đúng cấu trúc, không cần import SQL thủ công**.

**Technical Details:**
- Tạo database MySQL tên `journal_tracker_db`.
- Tạo file Flyway migration `V1__init_schema.sql` trong thư mục `src/main/resources/db/migration/`.
- File migration phải tạo đầy đủ các bảng sau:
  - `users` (id, username, email, password_hash, full_name, role, is_active, created_at, updated_at)
  - `research_papers` (id, doi, title, abstract_text, publication_year, source_url, source_api, journal_id, fetched_at, created_at)
  - `journals` (id, name, issn, publisher, field, paper_count)
  - `authors` (id, name, external_id, affiliation)
  - `keywords` (id, name, usage_count)
  - `research_topics` (id, name, description, is_trending)
  - `publication_trends` (id, keyword_id, year, paper_count, growth_rate)
  - `bookmarks` (id, user_id, paper_id, created_at)
  - `notifications` (id, user_id, title, message, is_read, created_at)
  - `follows` (id, user_id, follow_type, target_id, created_at)
  - `api_data_sources` (id, name, base_url, api_key, is_active, last_sync_at)
  - `paper_authors` (paper_id, author_id) — bảng trung gian
  - `paper_keywords` (paper_id, keyword_id) — bảng trung gian
  - `topic_keywords` (topic_id, keyword_id) — bảng trung gian
- Tạo file `V2__insert_sample_data.sql` chứa dữ liệu mẫu:
  - 1 tài khoản Admin mặc định (admin/admin123)
  - 2 tài khoản user mẫu (1 Researcher, 1 Student)
  - 5-10 bài báo mẫu, 3 journals, 5 authors, 10 keywords
- Cấu hình Flyway trong `application.yml`.

### Acceptance Criteria
- [ ] Chạy `mvn spring-boot:run` → Flyway tự động tạo tất cả bảng trong database `journal_tracker_db`.
- [ ] Kiểm tra MySQL → tất cả 14 bảng đã được tạo đúng cấu trúc, đúng kiểu dữ liệu.
- [ ] Các khóa ngoại (Foreign Key) hoạt động đúng (ví dụ: xóa user → bookmarks liên quan bị xóa CASCADE).
- [ ] Dữ liệu mẫu từ `V2__insert_sample_data.sql` đã được insert thành công.
- [ ] Chạy lại `mvn spring-boot:run` lần 2 → Flyway KHÔNG chạy lại migration cũ (idempotent).

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Leader (Bạn) |
| **Epic** | EPIC-1: Project Setup & Foundation |
| **Sprint** | Sprint 1 |
| **Priority** | 🔴 Highest |
| **Story Points** | 5 |

---

## JP-3: Cấu hình Spring Security + JWT

### Summary
`[JP-3] Cấu hình Spring Security 6 và JWT authentication`

### Description
**User Story:**
Là một **User**, tôi muốn **hệ thống bảo vệ các API yêu cầu đăng nhập** để **chỉ những người đã xác thực mới truy cập được dữ liệu cá nhân (bookmark, notification, follow)**.

**Technical Details:**
- Tạo `SecurityConfig.java`:
  - Tắt CSRF (vì dùng JWT, không dùng session).
  - Cấu hình `SessionCreationPolicy.STATELESS`.
  - Cho phép truy cập công khai (permitAll): `/api/auth/**`, `/swagger-ui/**`, `/v3/api-docs/**`, `/api/papers/search`.
  - Tất cả API còn lại yêu cầu authenticated.
  - Thêm `JwtAuthenticationFilter` vào trước `UsernamePasswordAuthenticationFilter`.
  - Cấu hình `PasswordEncoder` bằng `BCryptPasswordEncoder`.
- Tạo `JwtTokenProvider.java`:
  - Method `generateToken(UserDetails)` → trả về JWT string.
  - Method `validateToken(String token)` → trả về true/false.
  - Method `getUsernameFromToken(String token)` → trả về username.
  - Cấu hình `jwt.secret` và `jwt.expiration` (24h) trong `application.yml`.
- Tạo `JwtAuthenticationFilter.java` (extends `OncePerRequestFilter`):
  - Đọc header `Authorization: Bearer <token>`.
  - Validate token → set Authentication vào SecurityContext.
- Tạo `CustomUserDetailsService.java` (implements `UserDetailsService`):
  - Load user từ database theo username.

### Acceptance Criteria
- [ ] Gọi API `/api/papers/search` mà KHÔNG có token → Trả về 200 OK (public API).
- [ ] Gọi API `/api/bookmarks` mà KHÔNG có token → Trả về 401 Unauthorized.
- [ ] Gọi API `/api/bookmarks` với header `Authorization: Bearer <valid_token>` → Trả về 200 OK.
- [ ] Gọi API với token hết hạn hoặc token sai → Trả về 401 Unauthorized.
- [ ] Password trong database được lưu dưới dạng BCrypt hash (không lưu plain text).
- [ ] Swagger UI vẫn truy cập được mà không cần token.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Leader (Bạn) |
| **Epic** | EPIC-1: Project Setup & Foundation |
| **Sprint** | Sprint 1 |
| **Priority** | 🔴 Highest |
| **Story Points** | 5 |

---

## JP-4: Setup Global Exception Handler

### Summary
`[JP-4] Tạo GlobalExceptionHandler và chuẩn hóa API Response`

### Description
**User Story:**
Là một **Frontend Developer**, tôi muốn **tất cả API trả về response có cấu trúc thống nhất** để **tôi chỉ cần viết một hàm xử lý response duy nhất cho toàn bộ ứng dụng, không phải xử lý mỗi API một kiểu khác nhau**.

**Technical Details:**
- Tạo class `ApiResponse<T>` trong package `dto/response/`:
  ```java
  {
    "success": true/false,
    "message": "Thông báo",
    "data": { ... },        // dữ liệu trả về (nullable)
    "timestamp": "2026-05-20T14:00:00"
  }
  ```
- Tạo `GlobalExceptionHandler.java` (annotated `@RestControllerAdvice`):
  - Xử lý `ResourceNotFoundException` → HTTP 404
  - Xử lý `BadRequestException` → HTTP 400
  - Xử lý `UnauthorizedException` → HTTP 401
  - Xử lý `AccessDeniedException` → HTTP 403
  - Xử lý `DuplicateResourceException` → HTTP 409
  - Xử lý `MethodArgumentNotValidException` (validation errors) → HTTP 400 kèm danh sách lỗi từng field
  - Xử lý `Exception` chung (fallback) → HTTP 500
- Tạo các custom exception class tương ứng trong package `exception/`.
- Tất cả Controller trong project đều phải sử dụng `ApiResponse<T>` làm kiểu trả về.

### Acceptance Criteria
- [ ] Gọi API với resource không tồn tại (ví dụ: GET /api/papers/999999) → Trả về `{ "success": false, "message": "Paper not found with id: 999999" }` với HTTP 404.
- [ ] Gọi API POST với dữ liệu thiếu field bắt buộc → Trả về HTTP 400 kèm danh sách validation errors theo từng field.
- [ ] Gọi API thành công → Trả về `{ "success": true, "data": {...} }` với HTTP 200.
- [ ] Mọi lỗi không lường trước (Exception bất kỳ) → Trả về HTTP 500 với message chung, KHÔNG lộ stack trace ra response.
- [ ] Tất cả response đều có trường `timestamp`.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Leader (Bạn) |
| **Epic** | EPIC-1: Project Setup & Foundation |
| **Sprint** | Sprint 1 |
| **Priority** | 🔴 Highest |
| **Story Points** | 3 |

---

## JP-5: Cấu hình Swagger & CORS

### Summary
`[JP-5] Cấu hình SpringDoc OpenAPI (Swagger UI) và CORS cho phép Frontend gọi API`

### Description
**User Story:**
Là một **Developer trong nhóm**, tôi muốn **có giao diện Swagger UI để test API trực tiếp trên trình duyệt** và **Frontend (React chạy port 5173) có thể gọi API Backend (port 8080) mà không bị lỗi CORS**.

**Technical Details:**
- Tạo `SwaggerConfig.java`:
  - Cấu hình tiêu đề API: "Scientific Journal Trend Tracker API"
  - Cấu hình version: "1.0"
  - Thêm Security Scheme cho JWT Bearer token (để test API protected ngay trên Swagger).
- Tạo `WebConfig.java` (implements `WebMvcConfigurer`):
  - Override `addCorsMappings()`:
    - Allowed origins: `http://localhost:5173` (Vite dev server), `http://localhost:3000`
    - Allowed methods: GET, POST, PUT, DELETE, OPTIONS
    - Allowed headers: `*`
    - Allow credentials: true
- Cấu hình trong `application.yml`:
  ```yaml
  springdoc:
    api-docs:
      path: /v3/api-docs
    swagger-ui:
      path: /swagger-ui.html
  ```

### Acceptance Criteria
- [ ] Truy cập `http://localhost:8080/swagger-ui.html` → hiển thị giao diện Swagger với danh sách API.
- [ ] Trên Swagger UI có nút "Authorize" → nhập JWT token → có thể test các API protected.
- [ ] Frontend React chạy trên `localhost:5173` gọi API `localhost:8080` → KHÔNG bị lỗi CORS.
- [ ] Gọi OPTIONS request (preflight) → trả về headers CORS đúng.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Leader (Bạn) |
| **Epic** | EPIC-1: Project Setup & Foundation |
| **Sprint** | Sprint 1 |
| **Priority** | 🟡 Medium |
| **Story Points** | 2 |

---

## JP-6: Setup React + Vite Project

### Summary
`[JP-6] Khởi tạo React 18 + Vite project cho Frontend`

### Description
**User Story:**
Là một **Frontend Developer**, tôi muốn **có một project React sẵn sàng với đầy đủ thư viện cần thiết** để **tôi có thể bắt đầu code giao diện ngay lập tức**.

**Technical Details:**
- Khởi tạo project bằng lệnh: `npm create vite@latest frontend -- --template react`
- Cài đặt các dependencies:
  ```bash
  npm install antd @ant-design/icons
  npm install axios
  npm install react-router-dom
  npm install recharts
  npm install zustand          # state management
  npm install dayjs             # xử lý ngày tháng
  ```
- Tạo cấu trúc thư mục:
  ```
  src/
  ├── api/           # Axios instances, API call functions
  │   └── axiosConfig.js
  ├── components/    # Shared UI components
  │   └── Layout/
  ├── pages/         # Page components
  ├── hooks/         # Custom React hooks
  ├── context/       # React Context (Auth)
  ├── utils/         # Helper functions
  ├── assets/        # Images, icons
  ├── App.jsx        # Main app with Router
  └── main.jsx       # Entry point
  ```
- Tạo `axiosConfig.js`:
  - Base URL: `http://localhost:8080/api`
  - Interceptor tự động gắn JWT token vào header `Authorization`.
  - Interceptor xử lý response error (401 → redirect về login).
- Tạo `App.jsx` với React Router cơ bản (routes rỗng cho các trang chính).

### Acceptance Criteria
- [ ] Chạy `npm run dev` → ứng dụng khởi động thành công trên `localhost:5173`.
- [ ] Truy cập `localhost:5173` → hiển thị trang mặc định (có thể là trang trắng "Hello World").
- [ ] Tất cả thư viện trong danh sách đã cài đặt thành công (kiểm tra `package.json`).
- [ ] File `axiosConfig.js` đã cấu hình base URL và JWT interceptor.
- [ ] Cấu trúc thư mục đã tạo đúng theo mô tả.
- [ ] Code đã push lên branch `feature/frontend-setup` trên GitHub.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 5 (FE Core) |
| **Epic** | EPIC-1: Project Setup & Foundation |
| **Sprint** | Sprint 1 |
| **Priority** | 🔴 Highest |
| **Story Points** | 3 |

---

## JP-7: Setup Git Repository & Branching Strategy

### Summary
`[JP-7] Tạo GitHub repository và thiết lập quy tắc branching cho cả nhóm`

### Description
**User Story:**
Là một **Team Leader**, tôi muốn **có một GitHub repository với quy tắc branching rõ ràng** để **cả nhóm 6 người code trên cùng một source mà không bị xung đột hoặc mất code của nhau**.

**Technical Details:**
- Tạo repository trên GitHub (Public hoặc Private tùy nhóm).
- Repository name: `journal-trend-tracker`
- Cấu trúc repository:
  ```
  journal-trend-tracker/
  ├── backend/        # Spring Boot project
  ├── frontend/       # React Vite project
  ├── docs/           # Tài liệu dự án
  ├── .gitignore
  └── README.md
  ```
- Tạo file `.gitignore` bao gồm:
  - Java: `target/`, `*.class`, `.idea/`, `*.iml`
  - Node: `node_modules/`, `dist/`, `.env`
  - OS: `.DS_Store`, `Thumbs.db`
- Tạo branch `develop` từ `main`.
- Viết `README.md` với nội dung: tên dự án, mô tả ngắn, danh sách thành viên, hướng dẫn cài đặt & chạy.
- Thiết lập Branch protection rule cho `main` và `develop`:
  - Yêu cầu Pull Request trước khi merge.
  - Yêu cầu ít nhất 1 người review (Leader).
- Quy tắc đặt tên branch:
  - `feature/{tên-tính-năng}` (ví dụ: `feature/auth-api`, `feature/search-page`)
  - `bugfix/{mô-tả-bug}` (ví dụ: `bugfix/login-500-error`)
- Quy tắc commit message: `[JP-XX] Mô tả ngắn gọn`

### Acceptance Criteria
- [ ] Repository đã tạo trên GitHub và tất cả 6 thành viên đã được mời làm Collaborator.
- [ ] Branch `main` và `develop` đã tồn tại.
- [ ] File `.gitignore` đã loại trừ đúng các file/thư mục cần thiết.
- [ ] File `README.md` có đầy đủ tên dự án, mô tả, và hướng dẫn cài đặt.
- [ ] Tất cả thành viên đã clone repo về máy thành công và tạo được feature branch riêng.
- [ ] Branch protection rule đã được bật cho `main` và `develop`.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Leader (Bạn) |
| **Epic** | EPIC-1: Project Setup & Foundation |
| **Sprint** | Sprint 1 |
| **Priority** | 🔴 Highest |
| **Story Points** | 2 |

---
---

# 🔑 EPIC-2: Authentication & User Management

---

## JP-8: User Entity & Repository

### Summary
`[JP-8] Tạo User Entity, Role Enum và UserRepository`

### Description
**User Story:**
Là một **Backend Developer**, tôi muốn **có Entity User ánh xạ chính xác với bảng `users` trong database** để **tôi có thể thao tác CRUD trên bảng users thông qua JPA**.

**Technical Details:**
- Tạo `Role.java` (Enum) trong package `entity/`:
  ```java
  public enum Role {
      RESEARCHER, LECTURER, STUDENT, ADMIN
  }
  ```
- Tạo `User.java` (Entity) với các annotations:
  - `@Entity`, `@Table(name = "users")`
  - Các fields: id (Long, auto-generated), username (unique), email (unique), passwordHash, fullName, role (Enum → `@Enumerated(EnumType.STRING)`), isActive (default true), createdAt, updatedAt.
  - `@PrePersist` và `@PreUpdate` cho auto timestamps.
  - Sử dụng Lombok: `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder`.
- Tạo `UserRepository.java` (extends `JpaRepository<User, Long>`):
  - `Optional<User> findByUsername(String username);`
  - `Optional<User> findByEmail(String email);`
  - `boolean existsByUsername(String username);`
  - `boolean existsByEmail(String email);`

### Acceptance Criteria
- [ ] Chạy project → Hibernate KHÔNG tạo thêm bảng mới (bảng đã có từ Flyway migration).
- [ ] Viết unit test: save một User mới vào database → đọc lại thành công.
- [ ] `findByUsername("admin")` → trả về user Admin từ sample data.
- [ ] `existsByEmail("email_khong_ton_tai@test.com")` → trả về `false`.
- [ ] Trường `role` lưu dưới dạng String trong database (không phải ordinal number).

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 2 (BE Auth) |
| **Epic** | EPIC-2: Authentication & User Management |
| **Sprint** | Sprint 1 |
| **Priority** | 🔴 Highest |
| **Story Points** | 2 |

---

## JP-9: API Đăng ký tài khoản

### Summary
`[JP-9] Thiết kế API đăng ký tài khoản mới (Register)`

### Description
**User Story:**
Là một **User mới (Researcher/Lecturer/Student)**, tôi muốn **đăng ký tài khoản trên hệ thống** để **tôi có thể sử dụng các tính năng cá nhân hóa như bookmark, follow và nhận thông báo**.

**Technical Details:**
- Tạo `RegisterRequest.java` (DTO) trong `dto/request/`:
  ```java
  {
    "username": "nguyenvana",         // @NotBlank, @Size(min=3, max=50)
    "email": "nguyenvana@gmail.com",  // @NotBlank, @Email
    "password": "Password123!",       // @NotBlank, @Size(min=6)
    "fullName": "Nguyễn Văn A",       // @NotBlank
    "role": "RESEARCHER"              // @NotNull, Enum: RESEARCHER/LECTURER/STUDENT
  }
  ```
- Tạo `AuthResponse.java` (DTO) trong `dto/response/`:
  ```java
  {
    "token": "eyJhbGciOi...",
    "tokenType": "Bearer",
    "username": "nguyenvana",
    "role": "RESEARCHER"
  }
  ```
- Tạo `AuthService.java` interface + `AuthServiceImpl.java`:
  - Method `register(RegisterRequest request)`:
    - Kiểm tra username đã tồn tại → throw `DuplicateResourceException`.
    - Kiểm tra email đã tồn tại → throw `DuplicateResourceException`.
    - Mã hóa password bằng BCrypt.
    - Lưu User vào database.
    - Sinh JWT token và trả về `AuthResponse`.
- Tạo `AuthController.java`:
  - `POST /api/auth/register` → nhận `@Valid @RequestBody RegisterRequest` → trả về `ApiResponse<AuthResponse>`.

### Acceptance Criteria
- [ ] POST `/api/auth/register` với dữ liệu hợp lệ → HTTP 201, trả về JWT token.
- [ ] POST `/api/auth/register` với username đã tồn tại → HTTP 409 Conflict, message: "Username already exists".
- [ ] POST `/api/auth/register` với email đã tồn tại → HTTP 409 Conflict, message: "Email already exists".
- [ ] POST `/api/auth/register` thiếu field `username` → HTTP 400 Bad Request kèm validation error.
- [ ] POST `/api/auth/register` với email sai format → HTTP 400 Bad Request.
- [ ] Password trong database được lưu dạng BCrypt hash (kiểm tra trực tiếp trong MySQL).
- [ ] Role ADMIN không được phép đăng ký qua API này (chỉ chấp nhận RESEARCHER/LECTURER/STUDENT).

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 2 (BE Auth) |
| **Epic** | EPIC-2: Authentication & User Management |
| **Sprint** | Sprint 2 |
| **Priority** | 🔴 Highest |
| **Story Points** | 3 |

---

## JP-10: API Đăng nhập & JWT

### Summary
`[JP-10] Thiết kế API đăng nhập và xác thực bằng JWT`

### Description
**User Story:**
Là một **User (Researcher/Lecturer/Student)**, tôi muốn **đăng nhập vào hệ thống bằng username và password** để **tôi có thể sử dụng các tính năng cá nhân hóa như bookmark, follow, và xem thông báo**.

**Technical Details:**
- Tạo `LoginRequest.java` (DTO):
  ```java
  {
    "username": "nguyenvana",     // @NotBlank
    "password": "Password123!"   // @NotBlank
  }
  ```
- Trong `AuthService.java` thêm method `login(LoginRequest request)`:
  - Sử dụng `AuthenticationManager.authenticate()` với `UsernamePasswordAuthenticationToken`.
  - Nếu thành công → sinh JWT token → trả về `AuthResponse`.
  - Nếu thất bại → throw `UnauthorizedException`.
- Trong `AuthController.java`:
  - `POST /api/auth/login` → nhận `@Valid @RequestBody LoginRequest` → trả về `ApiResponse<AuthResponse>`.
- Cấu hình `AuthenticationManager` bean trong `SecurityConfig.java`.

### Acceptance Criteria
- [ ] POST `/api/auth/login` với đúng username/password → HTTP 200, trả về JWT token hợp lệ.
- [ ] POST `/api/auth/login` với password sai → HTTP 401, message: "Invalid username or password".
- [ ] POST `/api/auth/login` với username không tồn tại → HTTP 401, message: "Invalid username or password" (không tiết lộ username có tồn tại hay không).
- [ ] JWT token trả về chứa username và role trong payload (decode bằng [jwt.io](https://jwt.io) để verify).
- [ ] Token có thời gian hết hạn 24 giờ.
- [ ] Dùng token nhận được gọi API protected → thành công.
- [ ] Test thành công trên Postman và chụp ảnh đính kèm.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 2 (BE Auth) |
| **Epic** | EPIC-2: Authentication & User Management |
| **Sprint** | Sprint 2 |
| **Priority** | 🔴 Highest |
| **Story Points** | 3 |

---

## JP-11: Refresh Token

### Summary
`[JP-11] Thiết kế API Refresh Token để gia hạn phiên đăng nhập`

### Description
**User Story:**
Là một **User đang sử dụng hệ thống**, tôi muốn **phiên đăng nhập được tự động gia hạn khi token sắp hết hạn** để **tôi không bị bắt đăng nhập lại giữa chừng khi đang làm việc**.

**Technical Details:**
- Tạo `RefreshTokenRequest.java` (DTO):
  ```java
  {
    "token": "eyJhbGciOi..."   // JWT token hiện tại (sắp hết hạn)
  }
  ```
- Trong `AuthService.java` thêm method `refreshToken(RefreshTokenRequest request)`:
  - Validate token hiện tại (phải hợp lệ, chưa hết hạn hoặc hết hạn trong vòng 1 giờ).
  - Sinh JWT token mới với expiration mới.
  - Trả về `AuthResponse` với token mới.
- Trong `AuthController.java`:
  - `POST /api/auth/refresh` → trả về `ApiResponse<AuthResponse>`.

### Acceptance Criteria
- [ ] POST `/api/auth/refresh` với token hợp lệ → HTTP 200, trả về token mới.
- [ ] POST `/api/auth/refresh` với token hết hạn quá lâu (>1 giờ) → HTTP 401.
- [ ] POST `/api/auth/refresh` với token không hợp lệ → HTTP 401.
- [ ] Token mới có expiration mới (24h kể từ thời điểm refresh).

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 2 (BE Auth) |
| **Epic** | EPIC-2: Authentication & User Management |
| **Sprint** | Sprint 2 |
| **Priority** | 🟡 Medium |
| **Story Points** | 2 |

---

## JP-12: User Profile CRUD

### Summary
`[JP-12] Thiết kế API xem và cập nhật thông tin cá nhân`

### Description
**User Story:**
Là một **User đã đăng nhập**, tôi muốn **xem và chỉnh sửa thông tin cá nhân của mình (họ tên, email)** và **đổi mật khẩu** để **thông tin tài khoản luôn chính xác và bảo mật**.

**Technical Details:**
- Tạo `UserResponse.java` (DTO):
  ```java
  {
    "id": 1,
    "username": "nguyenvana",
    "email": "nguyenvana@gmail.com",
    "fullName": "Nguyễn Văn A",
    "role": "RESEARCHER",
    "createdAt": "2026-05-20T10:00:00"
  }
  ```
- Tạo `UpdateProfileRequest.java`:
  ```java
  {
    "fullName": "Nguyễn Văn A Updated",   // @NotBlank
    "email": "newemail@gmail.com"          // @Email
  }
  ```
- Tạo `ChangePasswordRequest.java`:
  ```java
  {
    "currentPassword": "OldPass123!",   // @NotBlank
    "newPassword": "NewPass456!"        // @NotBlank, @Size(min=6)
  }
  ```
- Tạo `UserService.java` interface + `UserServiceImpl.java`:
  - `getMyProfile(String username)` → trả về `UserResponse`
  - `updateProfile(String username, UpdateProfileRequest request)` → update và trả về `UserResponse`
  - `changePassword(String username, ChangePasswordRequest request)` → đổi password
- Endpoints:
  - `GET /api/users/me` → lấy profile user đang đăng nhập (từ JWT).
  - `PUT /api/users/me` → cập nhật profile.
  - `PUT /api/users/me/password` → đổi mật khẩu.

### Acceptance Criteria
- [ ] GET `/api/users/me` với JWT hợp lệ → HTTP 200, trả về thông tin user (KHÔNG chứa password).
- [ ] PUT `/api/users/me` → cập nhật fullName và email thành công.
- [ ] PUT `/api/users/me` với email trùng user khác → HTTP 409.
- [ ] PUT `/api/users/me/password` với currentPassword đúng → HTTP 200, password đã đổi (đăng nhập lại bằng password mới thành công).
- [ ] PUT `/api/users/me/password` với currentPassword sai → HTTP 400, message: "Current password is incorrect".

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 2 (BE Auth) |
| **Epic** | EPIC-2: Authentication & User Management |
| **Sprint** | Sprint 3 |
| **Priority** | 🟡 Medium |
| **Story Points** | 3 |

---

## JP-13: Admin - Quản lý Users

### Summary
`[JP-13] Thiết kế API Admin quản lý danh sách users`

### Description
**User Story:**
Là một **System Administrator**, tôi muốn **xem danh sách tất cả user, tìm kiếm user, và kích hoạt/vô hiệu hóa tài khoản** để **quản lý hệ thống người dùng hiệu quả**.

**Technical Details:**
- Endpoints (yêu cầu role ADMIN):
  - `GET /api/admin/users` → danh sách users (phân trang).
    - Query params: `page`, `size`, `search` (tìm theo username hoặc email), `role` (filter theo role).
  - `GET /api/admin/users/{id}` → chi tiết user.
  - `PUT /api/admin/users/{id}/status` → kích hoạt/vô hiệu hóa.
    - Request body: `{ "isActive": true/false }`
  - `PUT /api/admin/users/{id}/role` → thay đổi role user.
    - Request body: `{ "role": "RESEARCHER" }`
- Tạo `UserPageResponse.java`:
  ```java
  {
    "content": [ UserResponse, ... ],
    "pageNumber": 0,
    "pageSize": 10,
    "totalElements": 50,
    "totalPages": 5
  }
  ```
- Sử dụng annotation `@PreAuthorize("hasRole('ADMIN')")` cho tất cả endpoints này.

### Acceptance Criteria
- [ ] GET `/api/admin/users` với role ADMIN → HTTP 200, trả về danh sách users phân trang.
- [ ] GET `/api/admin/users` với role RESEARCHER → HTTP 403 Forbidden.
- [ ] GET `/api/admin/users?search=nguyen` → trả về users có username/email chứa "nguyen".
- [ ] GET `/api/admin/users?role=STUDENT` → trả về chỉ các user có role STUDENT.
- [ ] PUT `/api/admin/users/{id}/status` → isActive chuyển từ true sang false → user đó không thể đăng nhập.
- [ ] Admin không thể vô hiệu hóa chính mình.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 2 (BE Auth) |
| **Epic** | EPIC-2: Authentication & User Management |
| **Sprint** | Sprint 3 |
| **Priority** | 🟠 High |
| **Story Points** | 3 |

---

## JP-14: Frontend - Login Page

### Summary
`[JP-14] Thiết kế giao diện trang Đăng nhập`

### Description
**User Story:**
Là một **User**, tôi muốn **có một trang đăng nhập đẹp mắt, dễ sử dụng** để **tôi có thể nhập username và password để truy cập hệ thống**.

**Technical Details:**
- Tạo file `src/pages/Login.jsx`.
- Sử dụng Ant Design components: `Form`, `Input`, `Button`, `Card`, `Typography`, `message`.
- Layout:
  - Trang full-screen với background gradient hoặc hình ảnh liên quan đến khoa học.
  - Card đăng nhập căn giữa màn hình.
  - Logo hoặc tên hệ thống phía trên form.
  - 2 input fields: Username và Password (có icon prefix).
  - Nút "Đăng nhập" (primary, full-width).
  - Link "Chưa có tài khoản? Đăng ký" bên dưới.
- Logic:
  - Gọi API `POST /api/auth/login` bằng Axios.
  - Nếu thành công → lưu JWT token vào `localStorage` → redirect đến Dashboard (`/`).
  - Nếu thất bại → hiển thị thông báo lỗi bằng `message.error()`.
  - Validation: username và password không được để trống.
- Tạo file `src/api/authApi.js`:
  ```javascript
  export const loginApi = (data) => axios.post('/auth/login', data);
  export const registerApi = (data) => axios.post('/auth/register', data);
  ```

### Acceptance Criteria
- [ ] Trang Login hiển thị đúng layout (card căn giữa, có logo/tên app, có 2 input fields).
- [ ] Nhấn "Đăng nhập" khi chưa nhập gì → hiện validation error.
- [ ] Nhập đúng username/password → redirect về trang Dashboard.
- [ ] Nhập sai username/password → hiện thông báo lỗi "Sai tên đăng nhập hoặc mật khẩu".
- [ ] Sau khi đăng nhập, refresh trang → vẫn giữ trạng thái đăng nhập (token lưu trong localStorage).
- [ ] Có link dẫn đến trang Đăng ký.
- [ ] Giao diện responsive (hiển thị tốt trên cả desktop và mobile).

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 5 (FE Core) |
| **Epic** | EPIC-2: Authentication & User Management |
| **Sprint** | Sprint 2 |
| **Priority** | 🔴 Highest |
| **Story Points** | 3 |

---

## JP-15: Frontend - Register Page

### Summary
`[JP-15] Thiết kế giao diện trang Đăng ký`

### Description
**User Story:**
Là một **User mới**, tôi muốn **có trang đăng ký để tạo tài khoản** với **thông tin cơ bản và lựa chọn vai trò (Researcher/Lecturer/Student)**.

**Technical Details:**
- Tạo file `src/pages/Register.jsx`.
- Sử dụng Ant Design: `Form`, `Input`, `Select`, `Button`, `Card`.
- Form fields:
  - Username (text input, required)
  - Email (email input, required)
  - Full Name (text input, required)
  - Password (password input, required, min 6 ký tự)
  - Confirm Password (password input, required, phải khớp với Password)
  - Role (Select dropdown: Researcher / Lecturer / Student)
- Gọi API `POST /api/auth/register`.
- Thành công → hiện thông báo "Đăng ký thành công!" → redirect đến trang Login.
- Lỗi trùng username/email → hiển thị message tương ứng.
- Có link "Đã có tài khoản? Đăng nhập".

### Acceptance Criteria
- [ ] Form hiển thị đầy đủ 6 fields theo mô tả.
- [ ] Confirm Password không khớp → hiện lỗi "Mật khẩu không khớp".
- [ ] Đăng ký thành công → redirect về trang Login.
- [ ] Username hoặc email đã tồn tại → hiện thông báo lỗi tương ứng.
- [ ] Dropdown Role có đúng 3 lựa chọn (RESEARCHER, LECTURER, STUDENT).
- [ ] Giao diện đồng bộ với trang Login (cùng style, cùng background).

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 5 (FE Core) |
| **Epic** | EPIC-2: Authentication & User Management |
| **Sprint** | Sprint 2 |
| **Priority** | 🔴 Highest |
| **Story Points** | 2 |

---

## JP-16: Frontend - Auth Context & Protected Route

### Summary
`[JP-16] Tạo AuthContext, useAuth hook, Axios interceptor và ProtectedRoute component`

### Description
**User Story:**
Là một **Frontend Developer**, tôi muốn **có một hệ thống quản lý xác thực tập trung** để **mọi component trong app đều biết user đang đăng nhập là ai, role gì, và các API call tự động đính kèm JWT token**.

**Technical Details:**
- Tạo `src/context/AuthContext.jsx`:
  - State: `user` (thông tin user), `token` (JWT), `isAuthenticated` (boolean).
  - Methods: `login(token, userData)`, `logout()`.
  - Khi app khởi động → đọc token từ `localStorage` → nếu có và còn hạn → set `isAuthenticated = true`.
- Tạo `src/hooks/useAuth.js`:
  - Custom hook trả về `{ user, token, isAuthenticated, login, logout }` từ AuthContext.
- Tạo `src/components/ProtectedRoute.jsx`:
  - Nếu `isAuthenticated === false` → redirect đến `/login`.
  - Nếu route yêu cầu role ADMIN mà user không phải ADMIN → hiện trang 403.
- Cập nhật `src/api/axiosConfig.js`:
  - Request interceptor: tự động thêm `Authorization: Bearer <token>` vào mọi request.
  - Response interceptor: nếu nhận 401 → gọi `logout()` → redirect về `/login`.

### Acceptance Criteria
- [ ] User chưa đăng nhập truy cập `/dashboard` → tự động redirect về `/login`.
- [ ] User đã đăng nhập → tất cả API call tự động có header `Authorization: Bearer <token>`.
- [ ] User nhấn Logout → token bị xóa khỏi localStorage, redirect về `/login`.
- [ ] Refresh trang sau khi đăng nhập → vẫn giữ trạng thái đăng nhập.
- [ ] API trả về 401 (token hết hạn) → tự động logout và redirect về `/login`.
- [ ] User role STUDENT truy cập trang Admin → hiện trang "Bạn không có quyền truy cập".

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 5 (FE Core) |
| **Epic** | EPIC-2: Authentication & User Management |
| **Sprint** | Sprint 2 |
| **Priority** | 🔴 Highest |
| **Story Points** | 3 |

---
---

# 🔍 EPIC-3: Paper, Journal & Search

---

## JP-17: Paper, Journal, Author, Keyword Entities

### Summary
`[JP-17] Tạo Entity classes cho ResearchPaper, Journal, Author, Keyword và các bảng trung gian`

### Description
**User Story:**
Là một **Backend Developer**, tôi muốn **có các Entity class ánh xạ đúng với bảng database** để **tôi có thể dùng JPA thao tác dữ liệu bài báo, journal, tác giả và keyword**.

**Technical Details:**
- Tạo `ResearchPaper.java`:
  - Fields: id, doi (unique), title, abstractText (`@Column(columnDefinition = "TEXT")`), publicationYear, sourceUrl, sourceApi, journal (`@ManyToOne`), fetchedAt, createdAt.
  - Relationships:
    - `@ManyToOne` → Journal
    - `@ManyToMany` → Authors (bảng trung gian `paper_authors`)
    - `@ManyToMany` → Keywords (bảng trung gian `paper_keywords`)
  - Sử dụng Lombok.
- Tạo `Journal.java`:
  - Fields: id, name, issn, publisher, field, paperCount.
  - `@OneToMany(mappedBy = "journal")` → List<ResearchPaper>
- Tạo `Author.java`:
  - Fields: id, name, externalId, affiliation.
  - `@ManyToMany(mappedBy = "authors")` → List<ResearchPaper>
- Tạo `Keyword.java`:
  - Fields: id, name (unique), usageCount.
  - `@ManyToMany(mappedBy = "keywords")` → List<ResearchPaper>
- Tạo Repository cho mỗi entity:
  - `PaperRepository extends JpaRepository<ResearchPaper, Long>`
    - `Page<ResearchPaper> findByTitleContainingIgnoreCase(String keyword, Pageable pageable);`
    - `Optional<ResearchPaper> findByDoi(String doi);`
    - `boolean existsByDoi(String doi);`
  - `JournalRepository extends JpaRepository<Journal, Long>`
    - `Optional<Journal> findByName(String name);`
  - `AuthorRepository extends JpaRepository<Author, Long>`
    - `Optional<Author> findByExternalId(String externalId);`
  - `KeywordRepository extends JpaRepository<Keyword, Long>`
    - `Optional<Keyword> findByNameIgnoreCase(String name);`
    - `List<Keyword> findTop20ByOrderByUsageCountDesc();`
- Tạo DTOs:
  - `PaperResponse.java`, `PaperSummaryResponse.java` (không chứa abstract), `JournalResponse.java`, `AuthorResponse.java`, `KeywordResponse.java`.
- Tạo MapStruct mapper: `PaperMapper.java`, `JournalMapper.java`.

### Acceptance Criteria
- [ ] Chạy project → Hibernate validate schema thành công (không có lỗi mapping).
- [ ] JPA có thể đọc sample data từ database (query `PaperRepository.findAll()` trả về papers).
- [ ] Relationship ManyToMany hoạt động: query paper → lấy được danh sách authors và keywords.
- [ ] Relationship ManyToOne hoạt động: query paper → lấy được thông tin journal.
- [ ] `findTop20ByOrderByUsageCountDesc()` trả về keywords sắp xếp theo usage_count giảm dần.
- [ ] MapStruct mapper chuyển đổi Entity → DTO không bị lỗi.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 3 (BE Paper) |
| **Epic** | EPIC-3: Paper, Journal & Search |
| **Sprint** | Sprint 1 |
| **Priority** | 🔴 Highest |
| **Story Points** | 5 |

---

## JP-18: API Tìm kiếm bài báo

### Summary
`[JP-18] Thiết kế API tìm kiếm bài báo theo keyword, author, journal với phân trang`

### Description
**User Story:**
Là một **Researcher/Lecturer/Student**, tôi muốn **tìm kiếm bài báo khoa học theo từ khóa, tên tác giả, hoặc tên journal** để **tôi nhanh chóng tìm được các bài báo liên quan đến chủ đề nghiên cứu của mình**.

**Technical Details:**
- Tạo `PaperSearchRequest.java`:
  ```java
  {
    "keyword": "machine learning",    // tìm trong title + abstract
    "author": "John Smith",           // tìm theo tên tác giả
    "journal": "IEEE",                // tìm theo tên journal
    "yearFrom": 2020,                 // lọc năm từ
    "yearTo": 2026,                   // lọc năm đến
    "page": 0,                        // trang hiện tại
    "size": 10,                       // số kết quả/trang
    "sortBy": "publicationYear",      // sắp xếp theo
    "sortDir": "desc"                 // thứ tự sắp xếp
  }
  ```
- Tạo `PaperService.java` interface + `PaperServiceImpl.java`:
  - Method `searchPapers(PaperSearchRequest request)` → trả về `Page<PaperSummaryResponse>`.
  - Sử dụng `Specification<ResearchPaper>` (JPA Specification) để build dynamic query.
  - Tìm kiếm keyword: `title LIKE %keyword% OR abstractText LIKE %keyword%`.
  - Tìm kiếm author: JOIN bảng `paper_authors` + `authors` WHERE `name LIKE %author%`.
  - Tìm kiếm journal: JOIN bảng `journals` WHERE `name LIKE %journal%`.
  - Kết hợp nhiều điều kiện bằng AND.
- Tạo `PaperController.java`:
  - `GET /api/papers/search` (PUBLIC - không cần JWT):
    - Query params: `keyword`, `author`, `journal`, `yearFrom`, `yearTo`, `page`, `size`, `sortBy`, `sortDir`.
    - Trả về `ApiResponse<Page<PaperSummaryResponse>>`.
- `PaperSummaryResponse`:
  ```java
  {
    "id": 1,
    "title": "Deep Learning for NLP",
    "publicationYear": 2024,
    "journalName": "IEEE Transactions",
    "authors": ["John Smith", "Jane Doe"],
    "keywords": ["deep learning", "NLP", "transformer"]
  }
  ```

### Acceptance Criteria
- [ ] GET `/api/papers/search?keyword=machine learning` → trả về papers có "machine learning" trong title hoặc abstract.
- [ ] GET `/api/papers/search?author=John` → trả về papers có tác giả tên chứa "John".
- [ ] GET `/api/papers/search?journal=IEEE` → trả về papers thuộc journals có tên chứa "IEEE".
- [ ] GET `/api/papers/search?keyword=AI&yearFrom=2023&yearTo=2025` → trả về papers về AI trong khoảng 2023-2025.
- [ ] Kết quả phân trang đúng: `page=0, size=10` → trả về tối đa 10 kết quả, kèm `totalElements`, `totalPages`.
- [ ] Không truyền tham số nào → trả về toàn bộ papers (phân trang mặc định).
- [ ] API này KHÔNG yêu cầu JWT (public).
- [ ] Tìm kiếm không phân biệt hoa thường (case-insensitive).

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 3 (BE Paper) |
| **Epic** | EPIC-3: Paper, Journal & Search |
| **Sprint** | Sprint 2 |
| **Priority** | 🔴 Highest |
| **Story Points** | 5 |

---

## JP-19: API Xem chi tiết bài báo

### Summary
`[JP-19] Thiết kế API xem chi tiết bài báo và thông tin liên quan`

### Description
**User Story:**
Là một **Researcher**, tôi muốn **xem đầy đủ thông tin của một bài báo** bao gồm **tiêu đề, abstract, tác giả, keywords, journal, và năm xuất bản** để **đánh giá bài báo có phù hợp với nghiên cứu của mình không**.

**Technical Details:**
- Tạo `PaperDetailResponse.java`:
  ```java
  {
    "id": 1,
    "doi": "10.1234/example.2024.001",
    "title": "Deep Learning for Natural Language Processing: A Survey",
    "abstractText": "This paper provides a comprehensive survey...",
    "publicationYear": 2024,
    "sourceUrl": "https://doi.org/10.1234/example.2024.001",
    "sourceApi": "OpenAlex",
    "journal": {
      "id": 1,
      "name": "IEEE Transactions on Neural Networks",
      "issn": "2162-237X",
      "publisher": "IEEE",
      "field": "Computer Science"
    },
    "authors": [
      { "id": 1, "name": "John Smith", "affiliation": "MIT" },
      { "id": 2, "name": "Jane Doe", "affiliation": "Stanford" }
    ],
    "keywords": [
      { "id": 1, "name": "deep learning" },
      { "id": 2, "name": "NLP" },
      { "id": 3, "name": "transformer" }
    ],
    "isBookmarked": true,    // nếu user đã đăng nhập
    "fetchedAt": "2026-05-20T10:00:00",
    "createdAt": "2026-05-20T10:00:00"
  }
  ```
- Trong `PaperService.java`:
  - `getPaperById(Long id, String currentUsername)` → trả về `PaperDetailResponse`.
  - Nếu `currentUsername != null` → kiểm tra bảng `bookmarks` để set `isBookmarked`.
  - Nếu paper không tồn tại → throw `ResourceNotFoundException`.
- Trong `PaperController.java`:
  - `GET /api/papers/{id}` (PUBLIC nhưng nếu có JWT thì hiển thị thêm `isBookmarked`).

### Acceptance Criteria
- [ ] GET `/api/papers/1` → HTTP 200, trả về đầy đủ thông tin paper bao gồm journal, authors, keywords.
- [ ] GET `/api/papers/999999` → HTTP 404, message: "Paper not found with id: 999999".
- [ ] Khi đăng nhập và đã bookmark paper → field `isBookmarked = true`.
- [ ] Khi chưa đăng nhập → field `isBookmarked = false` (hoặc không có trường này).
- [ ] Abstract text hiển thị đầy đủ nội dung (không bị cắt).

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 3 (BE Paper) |
| **Epic** | EPIC-3: Paper, Journal & Search |
| **Sprint** | Sprint 3 |
| **Priority** | 🟠 High |
| **Story Points** | 3 |

---

## JP-20: Journal API

### Summary
`[JP-20] Thiết kế API danh sách Journals và papers theo Journal`

### Description
**User Story:**
Là một **Researcher**, tôi muốn **xem danh sách các journals học thuật trong hệ thống** và **xem tất cả bài báo của một journal cụ thể** để **tôi có thể theo dõi các journal uy tín trong lĩnh vực của mình**.

**Technical Details:**
- Tạo `JournalService.java` + `JournalServiceImpl.java`:
  - `getAllJournals(Pageable pageable)` → `Page<JournalResponse>`
  - `getJournalById(Long id)` → `JournalDetailResponse`
  - `getPapersByJournal(Long journalId, Pageable pageable)` → `Page<PaperSummaryResponse>`
- `JournalDetailResponse.java`:
  ```java
  {
    "id": 1,
    "name": "IEEE Transactions on Neural Networks",
    "issn": "2162-237X",
    "publisher": "IEEE",
    "field": "Computer Science",
    "paperCount": 1250,
    "isFollowed": true      // nếu user đã follow journal này
  }
  ```
- `JournalController.java`:
  - `GET /api/journals` → danh sách journals phân trang. Query params: `search`, `field`, `page`, `size`.
  - `GET /api/journals/{id}` → chi tiết journal.
  - `GET /api/journals/{id}/papers` → papers thuộc journal, phân trang.

### Acceptance Criteria
- [ ] GET `/api/journals` → HTTP 200, trả về danh sách journals phân trang.
- [ ] GET `/api/journals?search=IEEE` → trả về journals có tên chứa "IEEE".
- [ ] GET `/api/journals?field=Computer Science` → trả về journals thuộc lĩnh vực CS.
- [ ] GET `/api/journals/1` → HTTP 200, trả về chi tiết journal kèm `paperCount`.
- [ ] GET `/api/journals/1/papers` → HTTP 200, trả về danh sách papers thuộc journal đó.
- [ ] GET `/api/journals/999` → HTTP 404.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 3 (BE Paper) |
| **Epic** | EPIC-3: Paper, Journal & Search |
| **Sprint** | Sprint 3 |
| **Priority** | 🟠 High |
| **Story Points** | 3 |

---

## JP-21: Author & Keyword API

### Summary
`[JP-21] Thiết kế API xem papers theo tác giả và top keywords`

### Description
**User Story:**
Là một **Researcher**, tôi muốn **xem tất cả bài báo của một tác giả cụ thể** và **xem danh sách keywords phổ biến nhất** để **tìm được các tác giả hàng đầu và các chủ đề đang hot trong lĩnh vực nghiên cứu**.

**Technical Details:**
- Tạo `AuthorService.java` + `AuthorServiceImpl.java`:
  - `getAuthorById(Long id)` → `AuthorDetailResponse`
  - `getPapersByAuthor(Long authorId, Pageable pageable)` → `Page<PaperSummaryResponse>`
- Tạo `KeywordService.java` + `KeywordServiceImpl.java`:
  - `getTopKeywords(int limit)` → `List<KeywordResponse>` (sắp xếp theo usageCount giảm dần)
  - `getPapersByKeyword(String keywordName, Pageable pageable)` → `Page<PaperSummaryResponse>`
- `AuthorDetailResponse.java`:
  ```java
  {
    "id": 1,
    "name": "John Smith",
    "affiliation": "MIT",
    "paperCount": 42
  }
  ```
- Endpoints:
  - `GET /api/authors/{id}` → thông tin tác giả + số lượng bài báo.
  - `GET /api/authors/{id}/papers` → danh sách papers của tác giả, phân trang.
  - `GET /api/keywords/top?limit=20` → top 20 keywords phổ biến nhất.
  - `GET /api/keywords/{name}/papers` → papers chứa keyword cụ thể, phân trang.

### Acceptance Criteria
- [ ] GET `/api/authors/1` → HTTP 200, trả về thông tin tác giả kèm `paperCount`.
- [ ] GET `/api/authors/1/papers` → HTTP 200, trả về danh sách papers của tác giả.
- [ ] GET `/api/keywords/top?limit=10` → trả về 10 keywords có `usageCount` cao nhất, sắp xếp giảm dần.
- [ ] GET `/api/keywords/machine%20learning/papers` → trả về papers chứa keyword "machine learning".
- [ ] GET `/api/authors/999` → HTTP 404.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 3 (BE Paper) |
| **Epic** | EPIC-3: Paper, Journal & Search |
| **Sprint** | Sprint 3 |
| **Priority** | 🟡 Medium |
| **Story Points** | 3 |

---

## JP-22: Frontend - Search Page

### Summary
`[JP-22] Thiết kế giao diện trang Tìm kiếm bài báo`

### Description
**User Story:**
Là một **User**, tôi muốn **có một trang tìm kiếm trực quan** với **ô tìm kiếm, bộ lọc (filter), và danh sách kết quả** để **tôi dễ dàng tìm được bài báo theo keyword, tác giả hoặc journal**.

**Technical Details:**
- Tạo file `src/pages/SearchPapers.jsx`.
- Layout:
  - **Search Bar**: Ô input lớn ở đầu trang, có icon kính lúp, placeholder: "Tìm kiếm bài báo theo từ khóa...".
  - **Filter Section**: Dưới search bar, gồm các filter nằm ngang:
    - Input: Author name
    - Select dropdown: Journal (load từ API `/api/journals`)
    - RangePicker hoặc 2 input: Year From - Year To
    - Button: "Tìm kiếm" (primary) + "Xóa bộ lọc" (default)
  - **Results Section**:
    - Hiển thị tổng số kết quả: "Tìm thấy 156 bài báo".
    - Danh sách papers dạng card hoặc list. Mỗi item hiển thị:
      - Title (link đến trang chi tiết)
      - Authors (danh sách tên, phân cách bằng dấu phẩy)
      - Journal name + Publication Year
      - Keywords (hiển thị dạng tag)
      - Nút Bookmark (icon trái tim hoặc ngôi sao)
    - Pagination ở cuối danh sách.
  - **Empty State**: Khi không có kết quả → hiển thị illustration "Không tìm thấy bài báo nào".
- Gọi API: `GET /api/papers/search` với query params tương ứng.
- Tạo `src/api/paperApi.js`:
  ```javascript
  export const searchPapers = (params) => axios.get('/papers/search', { params });
  export const getPaperById = (id) => axios.get(`/papers/${id}`);
  ```
- Sử dụng Ant Design: `Input.Search`, `Select`, `DatePicker`, `Card`, `Tag`, `Pagination`, `Empty`, `Spin`.

### Acceptance Criteria
- [ ] Trang hiển thị search bar + filter section + results section.
- [ ] Nhập keyword → nhấn Tìm kiếm → danh sách papers cập nhật.
- [ ] Sử dụng filter (author, journal, year) → kết quả lọc đúng.
- [ ] Nhấn "Xóa bộ lọc" → tất cả filter reset về trống.
- [ ] Pagination hoạt động: chuyển trang → load dữ liệu trang mới.
- [ ] Khi đang tải dữ liệu → hiển thị spinner loading.
- [ ] Không có kết quả → hiển thị empty state.
- [ ] Click vào title paper → navigate đến `/papers/{id}`.
- [ ] Mỗi paper card hiển thị đúng: title, authors, journal, year, keywords.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 5 (FE Core) |
| **Epic** | EPIC-3: Paper, Journal & Search |
| **Sprint** | Sprint 3 |
| **Priority** | 🟠 High |
| **Story Points** | 5 |

---

## JP-23: Frontend - Paper Detail Page

### Summary
`[JP-23] Thiết kế giao diện trang Chi tiết bài báo`

### Description
**User Story:**
Là một **User**, tôi muốn **xem đầy đủ thông tin của một bài báo trên một trang riêng** bao gồm **abstract, danh sách tác giả, keywords, và journal** để **đọc tóm tắt và quyết định có bookmark bài báo không**.

**Technical Details:**
- Tạo file `src/pages/PaperDetail.jsx`.
- Route: `/papers/:id`.
- Layout:
  - **Header Section**:
    - Title (h1, font lớn)
    - Danh sách Authors (tên + affiliation, click vào → navigate `/authors/{id}`)
    - Journal name (link → `/journals/{id}`) + Publication Year
    - DOI link (link mở tab mới đến sourceUrl)
    - Nút Bookmark (toggle bookmark, đổi icon khi đã bookmark)
  - **Abstract Section**:
    - Tiêu đề "Abstract"
    - Nội dung abstract text (font dễ đọc, line-height thoáng)
  - **Keywords Section**:
    - Danh sách keywords hiển thị dạng Tag (click → navigate search page với keyword đó)
  - **Meta Section**:
    - Source API (OpenAlex/Crossref/Semantic Scholar)
    - Fetched at (ngày hệ thống thu thập)
  - **Related Papers** (Optional nếu có thời gian):
    - Gợi ý 5 papers cùng keywords.
- Gọi API: `GET /api/papers/{id}`.
- Gọi API bookmark: `POST /api/bookmarks` hoặc `DELETE /api/bookmarks/{paperId}`.
- Sử dụng Ant Design: `Typography`, `Tag`, `Button`, `Descriptions`, `Divider`, `Skeleton`.

### Acceptance Criteria
- [ ] Truy cập `/papers/1` → hiển thị đầy đủ thông tin paper (title, abstract, authors, keywords, journal).
- [ ] Truy cập `/papers/999999` → hiển thị trang "Bài báo không tồn tại" (404).
- [ ] Nhấn nút Bookmark khi đã đăng nhập → bookmark được lưu, icon đổi trạng thái.
- [ ] Nhấn nút Bookmark khi chưa đăng nhập → redirect đến trang Login.
- [ ] Click vào keyword tag → navigate về Search page với keyword đã điền sẵn.
- [ ] Click vào DOI link → mở tab mới đến trang bài báo gốc.
- [ ] Khi đang tải → hiển thị Skeleton loading placeholder.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 5 (FE Core) |
| **Epic** | EPIC-3: Paper, Journal & Search |
| **Sprint** | Sprint 3 |
| **Priority** | 🟠 High |
| **Story Points** | 3 |
