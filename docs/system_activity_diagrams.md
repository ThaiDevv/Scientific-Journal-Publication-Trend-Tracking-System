# 📊 Sơ đồ hoạt động hệ thống — Scientific Journal Trend Tracker

> Tổng hợp từ tài liệu: [implementation_plan.md](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/docs/implementation_plan.md), [database_schema.md](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/docs/database_schema.md), [security_flow_analysis.md](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/docs/security_flow_analysis.md)

---

## 1. 🏗️ Sơ đồ kiến trúc tổng quan hệ thống

```mermaid
graph TB
    subgraph "👤 Client Layer"
        BROWSER["🌐 Web Browser"]
    end

    subgraph "🖥️ Frontend — React 18 + Vite"
        SPA["React SPA"]
        AUTH_UI["Auth Pages<br/>Login / Register"]
        SEARCH_UI["Search & Paper Detail"]
        DASH_UI["Dashboard & Charts<br/>Recharts / Chart.js"]
        NOTIFY_UI["Notifications & Bookmarks"]
        ADMIN_UI["Admin Panel"]
    end

    subgraph "⚙️ Backend — Spring Boot 3.2.x"
        direction TB
        SEC["🔐 Spring Security<br/>+ JWT Filter"]
        CTRL["📡 REST Controllers<br/>Auth, Paper, Trend,<br/>Dashboard, Admin"]
        SVC["🧠 Service Layer<br/>Auth, Paper, Trend,<br/>Sync, Notification"]
        REPO["💾 Repository Layer<br/>Spring Data JPA"]
        SCHED["⏰ Spring Scheduler<br/>@Scheduled"]
        SYNC["🔄 Data Sync Service"]
        CLIENT["🌍 API Clients<br/>OpenAlex, Crossref,<br/>Semantic Scholar"]
    end

    subgraph "🗄️ Database"
        DB[("MySQL 8.x<br/>14 tables")]
    end

    subgraph "🌐 External APIs"
        OA["OpenAlex API"]
        CR["Crossref API"]
        SS["Semantic Scholar API"]
    end

    BROWSER --> SPA
    SPA --> AUTH_UI
    SPA --> SEARCH_UI
    SPA --> DASH_UI
    SPA --> NOTIFY_UI
    SPA --> ADMIN_UI

    AUTH_UI -->|"Axios + JWT"| SEC
    SEARCH_UI -->|"Axios + JWT"| SEC
    DASH_UI -->|"Axios + JWT"| SEC
    NOTIFY_UI -->|"Axios + JWT"| SEC
    ADMIN_UI -->|"Axios + JWT"| SEC

    SEC --> CTRL
    CTRL --> SVC
    SVC --> REPO
    REPO --> DB

    SCHED -->|"Cron trigger"| SYNC
    SYNC --> CLIENT
    CLIENT --> OA
    CLIENT --> CR
    CLIENT --> SS
    SYNC --> SVC

    style BROWSER fill:#3498db,stroke:#2980b9,color:#fff
    style SEC fill:#e74c3c,stroke:#c0392b,color:#fff
    style DB fill:#f39c12,stroke:#e67e22,color:#fff
    style SCHED fill:#9b59b6,stroke:#8e44ad,color:#fff
```

---

## 2. 🔐 Sơ đồ hoạt động — Luồng Xác thực (Authentication Flow)

### 2.1 Đăng ký tài khoản (Register)

```mermaid
flowchart TD
    START(["🟢 Bắt đầu"]) --> A["👤 User mở trang Đăng ký"]
    A --> B["Nhập thông tin:<br/>username, email, password,<br/>fullName, role"]
    B --> C["Frontend gửi POST<br/>/api/auth/register"]
    C --> D{"Backend Validation<br/>@Valid"}
    
    D -->|"❌ Thiếu field /<br/>email sai format"| E["HTTP 400<br/>Trả danh sách<br/>validation errors"]
    E --> B

    D -->|"✅ Hợp lệ"| F{"Kiểm tra<br/>username/email<br/>đã tồn tại?"}
    
    F -->|"❌ Trùng"| G["HTTP 409 Conflict<br/>Username/Email<br/>already exists"]
    G --> B

    F -->|"✅ Chưa có"| H["Mã hóa password<br/>BCrypt"]
    H --> I["Lưu User<br/>vào MySQL"]
    I --> J["JwtTokenProvider<br/>generateToken()"]
    J --> K["Trả về AuthResponse<br/>{token, username, role}"]
    K --> L["Frontend lưu JWT<br/>vào localStorage"]
    L --> M["Chuyển đến<br/>Dashboard"]
    M --> END(["🔴 Kết thúc"])

    style START fill:#27ae60,stroke:#1e8449,color:#fff
    style END fill:#c0392b,stroke:#922b21,color:#fff
    style E fill:#e74c3c,stroke:#c0392b,color:#fff
    style G fill:#e74c3c,stroke:#c0392b,color:#fff
    style H fill:#8e44ad,stroke:#6c3483,color:#fff
    style J fill:#2980b9,stroke:#1a5276,color:#fff
```

### 2.2 Đăng nhập (Login)

```mermaid
flowchart TD
    START(["🟢 Bắt đầu"]) --> A["👤 User mở trang Login"]
    A --> B["Nhập username + password"]
    B --> C["Frontend gửi POST<br/>/api/auth/login"]
    C --> D["AuthController<br/>nhận LoginRequest"]
    D --> E["AuthenticationManager<br/>.authenticate()"]
    E --> F["CustomUserDetailsService<br/>loadUserByUsername()"]
    F --> G["UserRepository<br/>findByUsername()"]
    G --> H[("MySQL<br/>Bảng users")]
    
    H --> I{"User<br/>tồn tại?"}
    I -->|"❌ Không"| J["HTTP 401<br/>Invalid username<br/>or password"]
    J --> B

    I -->|"✅ Có"| K["BCryptPasswordEncoder<br/>matches(password, hash)"]
    K --> L{"Password<br/>đúng?"}
    L -->|"❌ Sai"| J

    L -->|"✅ Đúng"| M{"User<br/>isActive?"}
    M -->|"❌ Bị khóa"| N["HTTP 401<br/>Account disabled"]
    N --> END2(["🔴 Kết thúc"])

    M -->|"✅ Active"| O["JwtTokenProvider<br/>generateToken()"]
    O --> P["Tạo JWT:<br/>sub=username<br/>roles=[ROLE_xxx]<br/>exp=24h<br/>sign=HS512"]
    P --> Q["Trả AuthResponse<br/>{token, tokenType,<br/>username, role}"]
    Q --> R["Frontend lưu JWT<br/>Axios interceptor<br/>gắn Authorization header"]
    R --> S["Chuyển đến Dashboard"]
    S --> END(["🔴 Kết thúc"])

    style START fill:#27ae60,stroke:#1e8449,color:#fff
    style END fill:#c0392b,stroke:#922b21,color:#fff
    style END2 fill:#c0392b,stroke:#922b21,color:#fff
    style J fill:#e74c3c,stroke:#c0392b,color:#fff
    style N fill:#e74c3c,stroke:#c0392b,color:#fff
    style O fill:#2980b9,stroke:#1a5276,color:#fff
    style P fill:#8e44ad,stroke:#6c3483,color:#fff
```

### 2.3 Xác thực mỗi Request (JWT Filter)

```mermaid
flowchart TD
    START(["🟢 Client gửi<br/>HTTP Request"]) --> A["SecurityFilterChain<br/>nhận request"]
    A --> B{"URL trong<br/>permitAll()?<br/>/api/auth/**<br/>/swagger-ui/**<br/>/api/papers/search"}

    B -->|"✅ YES"| C["Cho phép truy cập<br/>KHÔNG cần token"]
    C --> CTRL["Controller xử lý<br/>→ Trả response"]
    CTRL --> END(["🔴 Response<br/>trả về Client"])

    B -->|"❌ NO"| D["JwtAuthenticationFilter<br/>doFilterInternal()"]
    D --> E{"Header có<br/>Authorization:<br/>Bearer xxx ?"}

    E -->|"❌ Không"| F["HTTP 401<br/>Unauthorized"]
    F --> END

    E -->|"✅ Có"| G["Cắt lấy token<br/>substring(7)"]
    G --> H["JwtTokenProvider<br/>validateToken()"]
    H --> I{"Token<br/>hợp lệ?"}

    I -->|"❌ Hết hạn /<br/>sai chữ ký"| J["HTTP 401<br/>Token invalid"]
    J --> END

    I -->|"✅ Hợp lệ"| K["getUsernameFromToken()"]
    K --> L["CustomUserDetailsService<br/>loadUserByUsername()"]
    L --> M[("MySQL<br/>Load User")]
    M --> N["Tạo Authentication<br/>UsernamePasswordAuthenticationToken"]
    N --> O["Set vào<br/>SecurityContextHolder"]
    O --> P["filterChain.doFilter()<br/>→ Controller xử lý"]
    P --> END

    style START fill:#3498db,stroke:#2980b9,color:#fff
    style END fill:#2c3e50,stroke:#1a252f,color:#fff
    style F fill:#e74c3c,stroke:#c0392b,color:#fff
    style J fill:#e74c3c,stroke:#c0392b,color:#fff
    style C fill:#27ae60,stroke:#1e8449,color:#fff
    style H fill:#8e44ad,stroke:#6c3483,color:#fff
```

---

## 3. 🔍 Sơ đồ hoạt động — Luồng Tìm kiếm & Quản lý bài báo

### 3.1 Tìm kiếm bài báo (Search Papers)

```mermaid
flowchart TD
    START(["🟢 Bắt đầu"]) --> A["👤 User mở trang<br/>Search Papers"]
    A --> B["Nhập từ khóa tìm kiếm<br/>+ chọn filter:<br/>keyword / author / journal"]
    B --> C["Frontend gửi GET<br/>/api/papers/search<br/>?keyword=AI&author=...&page=0"]
    C --> D["PaperController<br/>nhận request (public API)"]
    D --> E["PaperService<br/>search()"]
    E --> F["PaperRepository<br/>JPA Query + Pageable"]
    F --> G[("MySQL<br/>JOIN papers,<br/>authors, keywords,<br/>journals")]
    G --> H["Trả về Page&lt;PaperResponse&gt;<br/>với metadata phân trang"]
    H --> I["Frontend render<br/>danh sách PaperCard"]
    I --> J{"User muốn<br/>xem chi tiết?"}

    J -->|"✅ Click bài báo"| K["GET /api/papers/{id}<br/>(cần JWT)"]
    K --> L["Trả về PaperDetail:<br/>title, abstract, authors,<br/>keywords, journal info"]
    L --> M["Hiển thị trang<br/>Paper Detail"]

    J -->|"❌ Tiếp tục tìm"| B

    M --> N{"User muốn<br/>bookmark?"}
    N -->|"✅ Click Bookmark"| O["POST /api/bookmarks<br/>{paperId}"]
    O --> P["Lưu vào bảng<br/>bookmarks"]
    P --> Q["✅ Thông báo<br/>Bookmark thành công"]

    N -->|"❌ Không"| END(["🔴 Kết thúc"])
    Q --> END

    style START fill:#27ae60,stroke:#1e8449,color:#fff
    style END fill:#c0392b,stroke:#922b21,color:#fff
    style G fill:#f39c12,stroke:#e67e22,color:#fff
```

### 3.2 Quản lý Bookmark & Follow

```mermaid
flowchart TD
    START(["🟢 Bắt đầu"]) --> A{"User chọn<br/>hành động?"}

    A -->|"📌 Bookmark"| B1["Xem Bookmarks Page<br/>GET /api/bookmarks/me"]
    B1 --> B2["Danh sách papers<br/>đã bookmark"]
    B2 --> B3{"Xóa bookmark?"}
    B3 -->|"✅"| B4["DELETE /api/bookmarks/{id}"]
    B4 --> B2
    B3 -->|"❌"| END

    A -->|"👁️ Follow"| C1{"Follow loại gì?"}
    C1 -->|"Journal"| C2["POST /api/follows<br/>{type: JOURNAL, targetId}"]
    C1 -->|"Topic"| C3["POST /api/follows<br/>{type: TOPIC, targetId}"]
    C1 -->|"Keyword"| C4["POST /api/follows<br/>{type: KEYWORD, targetId}"]
    
    C2 --> C5["Lưu vào bảng follows<br/>UNIQUE(user, type, target)"]
    C3 --> C5
    C4 --> C5
    C5 --> C6["Khi có paper mới<br/>liên quan → tạo<br/>Notification"]
    C6 --> END

    A -->|"🔔 Notifications"| D1["GET /api/notifications<br/>Danh sách thông báo"]
    D1 --> D2["Hiển thị badge count<br/>+ dropdown list"]
    D2 --> D3["PUT /api/notifications/{id}/read<br/>Đánh dấu đã đọc"]
    D3 --> END(["🔴 Kết thúc"])

    style START fill:#27ae60,stroke:#1e8449,color:#fff
    style END fill:#c0392b,stroke:#922b21,color:#fff
    style C5 fill:#f39c12,stroke:#e67e22,color:#fff
    style C6 fill:#9b59b6,stroke:#8e44ad,color:#fff
```

---

## 4. 🔄 Sơ đồ hoạt động — Luồng Đồng bộ dữ liệu (Data Sync)

```mermaid
flowchart TD
    START(["🟢 Trigger"]) --> A{"Trigger<br/>từ đâu?"}

    A -->|"⏰ Scheduler<br/>@Scheduled<br/>Daily/Weekly"| B["DataSyncScheduler<br/>triggerSync()"]
    A -->|"👨‍💼 Admin<br/>Manual Trigger"| C["POST /api/admin/sync/trigger<br/>(role ADMIN)"]
    
    B --> D["DataSyncService<br/>syncAll()"]
    C --> D

    D --> E["Đọc danh sách<br/>ApiDataSource<br/>(is_active = true)"]
    E --> F["Lặp qua từng<br/>API Source"]

    F --> G1["OpenAlexClient<br/>fetchPapers()"]
    F --> G2["CrossrefClient<br/>fetchPapers()"]
    F --> G3["SemanticScholarClient<br/>fetchPapers()"]

    G1 --> H["Parse & Normalize<br/>metadata thành<br/>ResearchPaper entity"]
    G2 --> H
    G3 --> H

    H --> I{"Deduplication<br/>Check DOI/Title<br/>đã tồn tại?"}

    I -->|"✅ Đã có"| J["Skip hoặc<br/>Update metadata"]
    I -->|"❌ Mới"| K["Lưu Paper<br/>+ Authors<br/>+ Keywords<br/>vào MySQL"]

    J --> L["Cập nhật<br/>last_sync_at"]
    K --> L

    L --> M["Cập nhật<br/>keyword.usage_count"]
    M --> N["Cập nhật<br/>journal.paper_count"]
    N --> O["Tính lại<br/>PublicationTrend<br/>paper_count + growth_rate"]
    O --> P{"Có followers<br/>liên quan?"}

    P -->|"✅ Có"| Q["NotificationService<br/>tạo Notification<br/>cho mỗi follower"]
    P -->|"❌ Không"| R["✅ Hoàn tất<br/>sync cycle"]
    Q --> R
    R --> END(["🔴 Kết thúc"])

    style START fill:#27ae60,stroke:#1e8449,color:#fff
    style END fill:#c0392b,stroke:#922b21,color:#fff
    style I fill:#f1c40f,stroke:#d4ac0f,color:#333
    style O fill:#9b59b6,stroke:#8e44ad,color:#fff
    style Q fill:#3498db,stroke:#2980b9,color:#fff
```

---

## 5. 📈 Sơ đồ hoạt động — Luồng Phân tích xu hướng (Trend Analysis)

```mermaid
flowchart TD
    START(["🟢 Bắt đầu"]) --> A["👤 User mở<br/>Trend Analysis Page"]
    A --> B["Nhập keyword(s)<br/>+ chọn khoảng năm"]
    B --> C{"Chế độ<br/>phân tích?"}

    C -->|"📊 Single Keyword"| D1["GET /api/trends/keyword/{kw}<br/>?fromYear=2020&toYear=2026"]
    C -->|"🔀 Compare Keywords"| D2["GET /api/trends/compare<br/>?keywords=AI,ML,DL"]
    C -->|"🔥 Trending Topics"| D3["GET /api/trends/topics/trending"]

    D1 --> E["TrendAnalysisService"]
    D2 --> E
    D3 --> E

    E --> F["Aggregation Query:<br/>SELECT keyword, year,<br/>COUNT(*) as paper_count<br/>FROM papers<br/>JOIN paper_keywords<br/>GROUP BY keyword, year"]
    F --> G[("MySQL<br/>publication_trends<br/>+ research_papers")]
    
    G --> H["Tính toán metrics"]
    H --> I1["📈 Số papers/năm<br/>cho mỗi keyword"]
    H --> I2["📊 Tốc độ tăng trưởng<br/>growth_rate (%)"]
    H --> I3["🔥 Top keywords<br/>mới nổi"]
    H --> I4["🏆 Top journals<br/>theo lĩnh vực"]

    I1 --> J["Trả về<br/>TrendResponse"]
    I2 --> J
    I3 --> J
    I4 --> J

    J --> K["Frontend render<br/>biểu đồ"]
    K --> L1["📈 Line Chart<br/>Trend theo thời gian"]
    K --> L2["📊 Bar Chart<br/>So sánh topics"]
    K --> L3["🥧 Pie Chart<br/>Phân bố journals"]
    K --> L4["☁️ Word Cloud<br/>Hot keywords"]
    
    L1 --> END(["🔴 Kết thúc"])
    L2 --> END
    L3 --> END
    L4 --> END

    style START fill:#27ae60,stroke:#1e8449,color:#fff
    style END fill:#c0392b,stroke:#922b21,color:#fff
    style G fill:#f39c12,stroke:#e67e22,color:#fff
    style H fill:#9b59b6,stroke:#8e44ad,color:#fff
```

---

## 6. 🖥️ Sơ đồ hoạt động — Dashboard tổng quan

```mermaid
flowchart TD
    START(["🟢 User vào Dashboard"]) --> A["Frontend gọi<br/>nhiều API đồng thời"]
    
    A --> B1["GET /api/dashboard/stats<br/>→ Tổng papers, journals,<br/>authors, users"]
    A --> B2["GET /api/dashboard/trending-topics<br/>→ Top 10 trending topics"]
    A --> B3["GET /api/dashboard/recent-papers<br/>→ 10 bài báo mới nhất"]
    A --> B4["GET /api/trends/topics/trending<br/>→ Biểu đồ trending"]

    B1 --> C["DashboardService"]
    B2 --> C
    B3 --> C
    B4 --> D["TrendAnalysisService"]

    C --> E[("MySQL<br/>COUNT queries<br/>trên nhiều bảng")]
    D --> E

    E --> F["Trả về JSON responses"]
    F --> G["Frontend render Dashboard"]
    
    G --> H1["🔢 Stat Cards<br/>Total Papers: 1,234<br/>Total Journals: 56<br/>Total Authors: 789"]
    G --> H2["🔥 Trending Topics<br/>Widget"]
    G --> H3["📄 Recent Papers<br/>List"]
    G --> H4["📈 Trend Chart<br/>Overview"]
    
    H1 --> END(["🔴 Dashboard<br/>hiển thị hoàn chỉnh"])
    H2 --> END
    H3 --> END
    H4 --> END

    style START fill:#27ae60,stroke:#1e8449,color:#fff
    style END fill:#2c3e50,stroke:#1a252f,color:#fff
    style E fill:#f39c12,stroke:#e67e22,color:#fff
```

---

## 7. ⚙️ Sơ đồ hoạt động — Quản trị hệ thống (Admin)

```mermaid
flowchart TD
    START(["🟢 Admin đăng nhập"]) --> A{"Chức năng<br/>quản trị?"}

    A -->|"👥 Quản lý User"| B["GET /api/admin/users<br/>Danh sách + phân trang<br/>+ search + filter role"]
    B --> B1{"Hành động?"}
    B1 -->|"🔒 Khóa tài khoản"| B2["PUT /api/admin/users/{id}/status<br/>{isActive: false}"]
    B1 -->|"🔑 Đổi role"| B3["PUT /api/admin/users/{id}/role<br/>{role: LECTURER}"]
    B1 -->|"👁️ Xem chi tiết"| B4["GET /api/admin/users/{id}"]
    
    B2 --> B5["User bị khóa<br/>không thể đăng nhập"]
    B3 --> B6["Quyền hạn<br/>thay đổi ngay"]

    A -->|"🌐 Quản lý API Source"| C["GET /api/admin/datasources<br/>Danh sách API sources"]
    C --> C1{"Hành động?"}
    C1 -->|"➕ Thêm source"| C2["POST /api/admin/datasources<br/>{name, baseUrl, apiKey}"]
    C1 -->|"✏️ Sửa"| C3["PUT /api/admin/datasources/{id}"]
    C1 -->|"🔄 Bật/Tắt"| C4["Toggle is_active"]

    A -->|"🔄 Trigger Sync"| D["POST /api/admin/sync/trigger"]
    D --> D1["DataSyncService<br/>chạy sync ngay lập tức"]
    D1 --> D2["Hiển thị progress<br/>+ kết quả sync"]

    A -->|"📊 Xem Report"| E["GET /api/reports/trend-summary"]
    E --> E1["Hiển thị báo cáo<br/>phân tích tổng hợp"]
    E1 --> E2["Export JSON / PDF"]

    B5 --> END(["🔴 Kết thúc"])
    B6 --> END
    B4 --> END
    C2 --> END
    C3 --> END
    C4 --> END
    D2 --> END
    E2 --> END

    style START fill:#e74c3c,stroke:#c0392b,color:#fff
    style END fill:#2c3e50,stroke:#1a252f,color:#fff
    style D1 fill:#9b59b6,stroke:#8e44ad,color:#fff
```

---

## 8. 🔁 Sơ đồ tổng hợp — Vòng đời dữ liệu trong hệ thống

> Sơ đồ này mô tả toàn bộ hành trình dữ liệu từ khi thu thập đến khi hiển thị cho user.

```mermaid
flowchart LR
    subgraph "1️⃣ Thu thập"
        EXT["🌐 External APIs<br/>OpenAlex / Crossref /<br/>Semantic Scholar"]
        SCHED["⏰ Scheduler<br/>hoặc Admin trigger"]
    end

    subgraph "2️⃣ Xử lý"
        SYNC["🔄 Data Sync Service"]
        PARSE["📝 Parse &<br/>Normalize"]
        DEDUP["🔍 Deduplication<br/>(DOI / Title)"]
    end

    subgraph "3️⃣ Lưu trữ"
        DB[("🗄️ MySQL 8.x<br/>14 bảng")]
    end

    subgraph "4️⃣ Phân tích"
        AGG["📊 Aggregation<br/>GROUP BY keyword, year"]
        TREND["📈 Trend Calculation<br/>growth_rate, trending"]
        NOTIFY["🔔 Notification<br/>Engine"]
    end

    subgraph "5️⃣ Hiển thị"
        API["📡 REST API<br/>Spring Boot"]
        FE["🖥️ React Frontend"]
        CHARTS["📊 Charts<br/>Line / Bar / Pie /<br/>Word Cloud"]
    end

    SCHED --> SYNC
    EXT --> SYNC
    SYNC --> PARSE
    PARSE --> DEDUP
    DEDUP --> DB
    DB --> AGG
    AGG --> TREND
    TREND --> DB
    DB --> NOTIFY
    NOTIFY -->|"Push notification"| FE
    DB --> API
    API --> FE
    FE --> CHARTS

    style EXT fill:#3498db,stroke:#2980b9,color:#fff
    style DB fill:#f39c12,stroke:#e67e22,color:#fff
    style TREND fill:#9b59b6,stroke:#8e44ad,color:#fff
    style FE fill:#27ae60,stroke:#1e8449,color:#fff
```

---

## 9. 🗃️ Sơ đồ quan hệ giữa các Entity (ERD tóm tắt)

```mermaid
erDiagram
    users ||--o{ bookmarks : "saves"
    users ||--o{ notifications : "receives"
    users ||--o{ follows : "follows"
    
    research_papers ||--o{ bookmarks : "bookmarked_by"
    research_papers }o--|| journals : "published_in"
    research_papers }o--o{ authors : "written_by (paper_authors)"
    research_papers }o--o{ keywords : "tagged_with (paper_keywords)"
    
    keywords ||--o{ publication_trends : "has_trend"
    research_topics }o--o{ keywords : "contains (topic_keywords)"
```

---

## 10. 🔀 Sơ đồ Sequence — Luồng hoạt động End-to-End điển hình

> User đăng nhập → tìm bài báo → bookmark → xem trend

```mermaid
sequenceDiagram
    actor User
    participant FE as React Frontend
    participant SEC as JWT Filter
    participant Auth as AuthController
    participant Paper as PaperController
    participant BM as BookmarkController
    participant Trend as TrendController
    participant DB as MySQL

    Note over User,DB: 1️⃣ ĐĂNG NHẬP
    User->>FE: Nhập username/password
    FE->>Auth: POST /api/auth/login
    Auth->>DB: Verify credentials
    DB-->>Auth: User entity
    Auth-->>FE: {token: "eyJ...", role: "RESEARCHER"}
    FE->>FE: Lưu JWT vào localStorage

    Note over User,DB: 2️⃣ TÌM KIẾM BÀI BÁO
    User->>FE: Nhập keyword "Machine Learning"
    FE->>Paper: GET /api/papers/search?keyword=ML
    Note over SEC: Public API → permitAll()
    Paper->>DB: SELECT papers WHERE keyword LIKE '%ML%'
    DB-->>Paper: List<Paper>
    Paper-->>FE: Page<PaperResponse>
    FE->>User: Hiển thị danh sách kết quả

    Note over User,DB: 3️⃣ XEM CHI TIẾT & BOOKMARK
    User->>FE: Click vào bài báo
    FE->>SEC: GET /api/papers/123 + Bearer token
    SEC->>SEC: Validate JWT ✅
    SEC->>Paper: Forward request
    Paper->>DB: SELECT paper + authors + keywords
    DB-->>Paper: PaperDetail
    Paper-->>FE: PaperDetailResponse
    
    User->>FE: Click "Bookmark"
    FE->>SEC: POST /api/bookmarks {paperId: 123}
    SEC->>BM: Forward (authenticated)
    BM->>DB: INSERT INTO bookmarks
    BM-->>FE: ✅ Bookmark saved

    Note over User,DB: 4️⃣ XEM XU HƯỚNG
    User->>FE: Mở Trend Analysis
    FE->>SEC: GET /api/trends/keyword/ML + Bearer token
    SEC->>Trend: Forward
    Trend->>DB: Aggregate papers by year
    DB-->>Trend: TrendData[]
    Trend-->>FE: TrendResponse
    FE->>User: Render Line Chart 📈
```

---

## 11. 📋 Tóm tắt các luồng hoạt động chính

| # | Luồng | Mô tả | API chính |
|---|-------|-------|-----------|
| 1 | **Đăng ký** | User tạo tài khoản mới → nhận JWT | `POST /api/auth/register` |
| 2 | **Đăng nhập** | Xác thực credentials → nhận JWT | `POST /api/auth/login` |
| 3 | **JWT Filter** | Mỗi request kèm token → xác thực | Mọi protected API |
| 4 | **Tìm kiếm** | Tìm bài báo theo keyword/author/journal | `GET /api/papers/search` |
| 5 | **Xem chi tiết** | Xem đầy đủ thông tin bài báo | `GET /api/papers/{id}` |
| 6 | **Bookmark** | Lưu/xóa bài báo yêu thích | `POST/DELETE /api/bookmarks` |
| 7 | **Follow** | Theo dõi journal/topic/keyword | `POST/DELETE /api/follows` |
| 8 | **Notification** | Nhận thông báo bài mới | `GET /api/notifications` |
| 9 | **Data Sync** | Thu thập dữ liệu từ API ngoài | Internal scheduler |
| 10 | **Trend Analysis** | Phân tích xu hướng nghiên cứu | `GET /api/trends/*` |
| 11 | **Dashboard** | Thống kê tổng quan hệ thống | `GET /api/dashboard/*` |
| 12 | **Admin** | Quản lý user, API source, sync | `GET/PUT /api/admin/*` |
| 13 | **Report** | Xuất báo cáo phân tích | `GET /api/reports/*` |
