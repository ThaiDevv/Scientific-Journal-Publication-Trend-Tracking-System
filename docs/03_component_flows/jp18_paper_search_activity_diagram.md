# Sơ Đồ Hoạt Động Chi Tiết — JP-18: API Tìm Kiếm Bài Báo

> Tất cả sơ đồ được vẽ dựa trên phân tích trực tiếp source code hiện tại của hệ thống.

**Source code tham chiếu:**
- [PaperController.java](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/controller/PaperController.java)
- [PaperServiceImpl.java](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/service/impl/PaperServiceImpl.java)
- [PaperSpecification.java](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/specification/PaperSpecification.java)
- [PaperMapper.java](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/mapper/PaperMapper.java)
- [PaperSearchRequest.java](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/dto/request/PaperSearchRequest.java)
- [PaperSummaryResponse.java](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/dto/response/PaperSummaryResponse.java)
- [SecurityConfig.java](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/config/SecurityConfig.java)

---

## 1. Sơ đồ tổng quan — Kiến trúc Paper Search Module

```mermaid
%%{init: { 'sequence': {'useMaxWidth': false}, 'flowchart': {'useMaxWidth': false} }}%%
graph TB
    subgraph "Client (Browser / Postman)"
        C1["GET /api/papers/search<br>?keyword=...&author=...&journal=...<br>&yearFrom=...&yearTo=...<br>&page=0&size=10&sortBy=...&sortDir=..."]
    end

    subgraph "Spring Security Filter Chain"
        SF["SecurityFilterChain"]
        SF -->|"permitAll: /api/papers/search"| PC
    end

    subgraph "Controller Layer"
        PC["PaperController"]
    end

    subgraph "Service Layer"
        PS["PaperServiceImpl"]
    end

    subgraph "Specification Layer"
        SPEC["PaperSpecification"]
        SPEC_K["hasKeyword()"]
        SPEC_A["hasAuthor()"]
        SPEC_J["hasJournal()"]
        SPEC_YF["yearGreaterThanOrEqual()"]
        SPEC_YT["yearLessThanOrEqual()"]
    end

    subgraph "Mapper Layer"
        PM["PaperMapper<br>(MapStruct)"]
    end

    subgraph "Data Layer"
        PR["PaperRepository<br>(JpaSpecificationExecutor)"]
        DB[("MySQL<br>research_papers<br>+ paper_authors<br>+ paper_keywords<br>+ authors<br>+ keywords<br>+ journals")]
    end

    C1 --> SF
    PC -->|"searchPapers(request)"| PS
    PS --> SPEC
    SPEC --> SPEC_K
    SPEC --> SPEC_A
    SPEC --> SPEC_J
    SPEC --> SPEC_YF
    SPEC --> SPEC_YT
    PS -->|"findAll(spec, pageable)"| PR
    PR --> DB
    PS -->|"map(paperMapper::toSummaryResponse)"| PM

    style PC fill:#4fc3f7,stroke:#0288d1,stroke-width:2px
    style PS fill:#81c784,stroke:#388e3c,stroke-width:2px
    style SPEC fill:#fff9c4,stroke:#f9a825,stroke-width:2px
    style PM fill:#ffcc80,stroke:#ef6c00,stroke-width:2px
    style DB fill:#e0e0e0,stroke:#616161,stroke-width:2px
```

---

## 2. Activity Diagram — Luồng chính

```mermaid
%%{init: { 'sequence': {'useMaxWidth': false}, 'flowchart': {'useMaxWidth': false} }}%%
flowchart TD
    START(("Start")) --> A["Client gửi<br>GET /api/papers/search<br>với query params"]

    A --> SEC{"SecurityFilterChain<br>kiểm tra endpoint"}
    SEC -->|"permitAll:<br>/api/papers/search"| B["Cho phép KHÔNG cần JWT<br>(API Public)"]

    B --> C["PaperController.searchPapers()<br>nhận @RequestParam"]

    C --> D["Đọc query params:<br>keyword, author, journal,<br>yearFrom, yearTo,<br>page (default=0), size (default=10),<br>sortBy (default=publicationYear),<br>sortDir (default=desc)"]

    D --> E["Tạo PaperSearchRequest<br>từ query params"]

    E --> F["PaperServiceImpl<br>.searchPapers(request)"]

    F --> G{"Validate sortBy<br>có nằm trong<br>ALLOWED_SORT_FIELDS?"}

    G -- "sortBy hợp lệ<br>(publicationYear, title,<br>createdAt, id)" --> H["Dùng sortBy từ request"]
    G -- "sortBy KHÔNG hợp lệ<br>hoặc null" --> I["Fallback: sortBy = publicationYear"]

    H --> J["Tạo Sort object"]
    I --> J

    J --> K{"sortDir = 'asc'?"}
    K -- "Có" --> L["Sort.by(sortBy).ascending()"]
    K -- "Không (default: desc)" --> M["Sort.by(sortBy).descending()"]

    L --> N["Tạo Pageable<br>PageRequest.of(page, size, sort)"]
    M --> N

    N --> O["Build JPA Specification<br>bằng PaperSpecification"]

    O --> P{"keyword != null<br>&& !blank?"}
    P -- "Có" --> P1["hasKeyword(keyword):<br>title LIKE %keyword%<br>OR abstractText LIKE %keyword%<br>(case-insensitive: cb.lower())"]
    P -- "Không" --> P2["Bỏ qua điều kiện keyword"]

    P1 --> Q{"author != null<br>&& !blank?"}
    P2 --> Q

    Q -- "Có" --> Q1["hasAuthor(author):<br>JOIN paper_authors + authors<br>WHERE name LIKE %author%<br>(case-insensitive)<br>+ query.distinct(true)"]
    Q -- "Không" --> Q2["Bỏ qua điều kiện author"]

    Q1 --> R{"journal != null<br>&& !blank?"}
    Q2 --> R

    R -- "Có" --> R1["hasJournal(journal):<br>JOIN journals<br>WHERE name LIKE %journal%<br>(case-insensitive)<br>+ query.distinct(true)"]
    R -- "Không" --> R2["Bỏ qua điều kiện journal"]

    R1 --> S{"yearFrom != null?"}
    R2 --> S

    S -- "Có" --> S1["yearGreaterThanOrEqual:<br>publicationYear >= yearFrom"]
    S -- "Không" --> S2["Bỏ qua điều kiện yearFrom"]

    S1 --> T{"yearTo != null?"}
    S2 --> T

    T -- "Có" --> T1["yearLessThanOrEqual:<br>publicationYear <= yearTo"]
    T -- "Không" --> T2["Bỏ qua điều kiện yearTo"]

    T1 --> U["Kết hợp tất cả Specifications<br>bằng AND"]
    T2 --> U

    U --> V["paperRepository.findAll<br>(specification, pageable)"]

    V --> W["Hibernate sinh SQL query<br>SELECT DISTINCT rp.* FROM research_papers rp<br>LEFT JOIN paper_authors pa ...<br>LEFT JOIN authors a ...<br>LEFT JOIN journals j ...<br>WHERE (conditions)<br>ORDER BY ... LIMIT ... OFFSET ..."]

    W --> X["DB trả về Page of ResearchPaper"]

    X --> Y["paperPage.map(<br>paperMapper::toSummaryResponse)"]

    Y --> Z["PaperMapper (MapStruct):<br>- id, title, publicationYear<br>- journalName ← journal.name<br>- authors ← Set of Author → List of String<br>- keywords ← Set of Keyword → List of String"]

    Z --> AA["Trả về Page of PaperSummaryResponse"]

    AA --> AB["PaperController wrap kết quả:<br>ApiResponse(true,<br>'Search papers successfully',<br>Page result)"]

    AB --> AC["HTTP 200 OK<br>ApiResponse with pagination"]

    AC --> END(("End"))

    style SEC fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style G fill:#fff9c4,stroke:#f9a825,stroke-width:2px
    style K fill:#fff9c4,stroke:#f9a825,stroke-width:2px
    style P fill:#fff9c4,stroke:#f9a825,stroke-width:2px
    style Q fill:#fff9c4,stroke:#f9a825,stroke-width:2px
    style R fill:#fff9c4,stroke:#f9a825,stroke-width:2px
    style S fill:#fff9c4,stroke:#f9a825,stroke-width:2px
    style T fill:#fff9c4,stroke:#f9a825,stroke-width:2px
    style AC fill:#a5d6a7,stroke:#2e7d32,stroke-width:2px
    style V fill:#bbdefb,stroke:#1565c0,stroke-width:2px
    style Y fill:#ffcc80,stroke:#ef6c00,stroke-width:2px
```

---

## 3. Sequence Diagram — Tương tác giữa các component

```mermaid
%%{init: { 'sequence': {'useMaxWidth': false}, 'flowchart': {'useMaxWidth': false} }}%%
sequenceDiagram
    autonumber
    participant Client
    participant SF as SecurityFilterChain
    participant PC as PaperController
    participant PS as PaperServiceImpl
    participant SPEC as PaperSpecification
    participant PR as PaperRepository
    participant DB as MySQL
    participant PM as PaperMapper

    Client->>SF: GET /api/papers/search<br>?keyword=machine learning<br>&author=John&yearFrom=2023<br>&page=0&size=10&sortBy=publicationYear&sortDir=desc

    SF->>PC: permitAll — cho phép không cần JWT

    PC->>PC: Đọc @RequestParam:<br>keyword="machine learning"<br>author="John", yearFrom=2023<br>page=0, size=10

    PC->>PC: Tạo PaperSearchRequest<br>từ query params

    PC->>PS: searchPapers(request)

    PS->>PS: Validate sortBy ∈ ALLOWED_SORT_FIELDS<br>{"publicationYear","title","createdAt","id"}<br>"publicationYear" ✓ → dùng giá trị từ request

    PS->>PS: Tạo Sort = Sort.by("publicationYear").descending()

    PS->>PS: Tạo Pageable = PageRequest.of(0, 10, sort)

    PS->>SPEC: hasKeyword("machine learning")
    SPEC-->>PS: Specification: title LIKE '%machine learning%'<br>OR abstractText LIKE '%machine learning%'<br>(cb.lower → case-insensitive)

    PS->>SPEC: hasAuthor("John")
    SPEC-->>PS: Specification: JOIN authors<br>WHERE name LIKE '%john%'<br>+ query.distinct(true)

    PS->>SPEC: hasJournal(null)
    SPEC-->>PS: null (bỏ qua)

    PS->>SPEC: yearGreaterThanOrEqual(2023)
    SPEC-->>PS: Specification: publicationYear >= 2023

    PS->>SPEC: yearLessThanOrEqual(null)
    SPEC-->>PS: null (bỏ qua)

    PS->>PS: Kết hợp Specifications bằng AND:<br>WHERE (title LIKE ... OR abstract LIKE ...)<br>AND (author.name LIKE ...)<br>AND (publicationYear >= 2023)

    PS->>PR: findAll(specification, pageable)

    PR->>DB: SELECT DISTINCT rp.* FROM research_papers rp<br>LEFT JOIN paper_authors pa ON rp.id = pa.paper_id<br>LEFT JOIN authors a ON pa.author_id = a.id<br>WHERE (LOWER(rp.title) LIKE '%machine learning%'<br>OR LOWER(rp.abstract_text) LIKE '%machine learning%')<br>AND LOWER(a.name) LIKE '%john%'<br>AND rp.publication_year >= 2023<br>ORDER BY rp.publication_year DESC<br>LIMIT 10 OFFSET 0

    DB->>DB: Count query cho totalElements:<br>SELECT COUNT(DISTINCT rp.id) ...

    DB-->>PR: Page of ResearchPaper entities

    PR-->>PS: Page<ResearchPaper><br>(content: [paper1, paper2, ...],<br>totalElements: 42, totalPages: 5)

    PS->>PM: toSummaryResponse(paper) — cho mỗi paper

    PM->>PM: Map entity → DTO:<br>id, title, publicationYear<br>journalName ← journal.name<br>authors ← Set<Author> → List<String><br>keywords ← Set<Keyword> → List<String>

    PM-->>PS: PaperSummaryResponse

    PS-->>PC: Page<PaperSummaryResponse>

    PC-->>Client: HTTP 200<br>{success: true,<br>message: "Search papers successfully",<br>body: {content: [...], totalElements: 42,<br>totalPages: 5, number: 0, size: 10}}

    Note over Client: Client hiển thị danh sách papers<br>+ pagination controls
```

---

## 4. Activity Diagram — Các scenario đặc biệt

### 4.1 Scenario: Không truyền tham số nào (Default search)

```mermaid
%%{init: { 'sequence': {'useMaxWidth': false}, 'flowchart': {'useMaxWidth': false} }}%%
flowchart TD
    START(("Start")) --> A["Client gửi<br>GET /api/papers/search<br>(không có query params)"]

    A --> B["PaperController nhận:<br>keyword=null, author=null,<br>journal=null, yearFrom=null, yearTo=null<br>page=0, size=10,<br>sortBy='publicationYear', sortDir='desc'"]

    B --> C["PaperServiceImpl.searchPapers()"]

    C --> D["Build Specification:<br>hasKeyword(null) → null<br>hasAuthor(null) → null<br>hasJournal(null) → null<br>yearGTE(null) → null<br>yearLTE(null) → null"]

    D --> E["Specification kết hợp = null<br>(không có điều kiện WHERE)"]

    E --> F["paperRepository.findAll(null, pageable)"]

    F --> G["SQL: SELECT * FROM research_papers<br>ORDER BY publication_year DESC<br>LIMIT 10 OFFSET 0"]

    G --> H["Trả về toàn bộ papers<br>(phân trang mặc định page=0, size=10)"]

    H --> I["HTTP 200 OK<br>Page(content=[...], totalElements=N,<br>totalPages=ceil(N/10))"]

    I --> END(("End"))

    style E fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style I fill:#a5d6a7,stroke:#2e7d32,stroke-width:2px
```

### 4.2 Scenario: Kết hợp nhiều điều kiện lọc

```mermaid
%%{init: { 'sequence': {'useMaxWidth': false}, 'flowchart': {'useMaxWidth': false} }}%%
flowchart TD
    START(("Start")) --> A["GET /api/papers/search<br>?keyword=AI<br>&author=Smith<br>&journal=IEEE<br>&yearFrom=2023&yearTo=2025<br>&page=1&size=5<br>&sortBy=title&sortDir=asc"]

    A --> B["Build Specification (AND kết hợp)"]

    B --> C["hasKeyword('AI'):<br>LOWER(title) LIKE '%ai%'<br>OR LOWER(abstractText) LIKE '%ai%'"]

    C --> D["AND hasAuthor('Smith'):<br>JOIN authors WHERE<br>LOWER(name) LIKE '%smith%'<br>+ DISTINCT"]

    D --> E["AND hasJournal('IEEE'):<br>JOIN journals WHERE<br>LOWER(name) LIKE '%ieee%'<br>+ DISTINCT"]

    E --> F["AND yearGTE(2023):<br>publicationYear >= 2023"]

    F --> G["AND yearLTE(2025):<br>publicationYear <= 2025"]

    G --> H["Pageable: page=1, size=5<br>Sort: title ASC"]

    H --> I["SQL query với tất cả<br>điều kiện kết hợp<br>LIMIT 5 OFFSET 5"]

    I --> J["HTTP 200 OK<br>Trang 2 với tối đa 5 kết quả"]

    J --> END(("End"))

    style B fill:#fff9c4,stroke:#f9a825,stroke-width:2px
    style J fill:#a5d6a7,stroke:#2e7d32,stroke-width:2px
```

### 4.3 Scenario: sortBy không hợp lệ (Fallback validation)

```mermaid
%%{init: { 'sequence': {'useMaxWidth': false}, 'flowchart': {'useMaxWidth': false} }}%%
flowchart TD
    START(("Start")) --> A["GET /api/papers/search<br>?sortBy=nonExistentField"]

    A --> B["PaperServiceImpl nhận:<br>sortBy = 'nonExistentField'"]

    B --> C{"sortBy ∈ ALLOWED_SORT_FIELDS?<br>{publicationYear, title,<br>createdAt, id}"}

    C -- "'nonExistentField'<br>KHÔNG nằm trong whitelist" --> D["Fallback: sortBy = 'publicationYear'<br>(giá trị mặc định an toàn)"]

    D --> E["Tiếp tục xử lý bình thường<br>với sortBy = publicationYear"]

    E --> F["HTTP 200 OK<br>(kết quả sắp xếp theo<br>publicationYear thay vì lỗi 500)"]

    F --> END(("End"))

    style C fill:#fff9c4,stroke:#f9a825,stroke-width:2px
    style D fill:#ffcc80,stroke:#ef6c00,stroke-width:2px
    style F fill:#a5d6a7,stroke:#2e7d32,stroke-width:2px
```

---

## 5. Chi tiết các Query Params

| Param | Bắt buộc | Default | Mô tả | Ví dụ |
|-------|----------|---------|-------|-------|
| `keyword` | Không | `null` | Tìm trong title + abstractText (case-insensitive) | `machine learning` |
| `author` | Không | `null` | Tìm theo tên tác giả (case-insensitive, LIKE) | `John` |
| `journal` | Không | `null` | Tìm theo tên journal (case-insensitive, LIKE) | `IEEE` |
| `yearFrom` | Không | `null` | Lọc papers từ năm (>=) | `2023` |
| `yearTo` | Không | `null` | Lọc papers đến năm (<=) | `2025` |
| `page` | Không | `0` | Trang hiện tại (0-indexed) | `0` |
| `size` | Không | `10` | Số kết quả mỗi trang | `10` |
| `sortBy` | Không | `publicationYear` | Trường sắp xếp (whitelist validated) | `publicationYear` |
| `sortDir` | Không | `desc` | Thứ tự: `asc` hoặc `desc` | `desc` |

---

## 6. Chi tiết PaperSummaryResponse (DTO trả về)

```json
{
  "id": 1,
  "title": "Deep Learning for NLP: A Comprehensive Survey",
  "publicationYear": 2024,
  "journalName": "IEEE Transactions on Neural Networks",
  "authors": ["John Smith", "Jane Doe"],
  "keywords": ["deep learning", "NLP", "transformer"]
}
```

**Mapping (PaperMapper — MapStruct):**

| Response Field | Entity Field | Logic |
|---------------|-------------|-------|
| `id` | `ResearchPaper.id` | Trực tiếp |
| `title` | `ResearchPaper.title` | Trực tiếp |
| `publicationYear` | `ResearchPaper.publicationYear` | Trực tiếp |
| `journalName` | `ResearchPaper.journal.name` | `@Mapping(source = "journal.name")` |
| `authors` | `ResearchPaper.authors` | `Set<Author>` → `stream().map(Author::getName)` → `List<String>` |
| `keywords` | `ResearchPaper.keywords` | `Set<Keyword>` → `stream().map(Keyword::getName)` → `List<String>` |

---

## 7. Chi tiết Pagination Response

API trả về `Page<PaperSummaryResponse>` bọc trong `ApiResponse`:

```json
{
  "success": true,
  "message": "Search papers successfully",
  "body": {
    "content": [
      { "id": 1, "title": "...", "publicationYear": 2024, "journalName": "...", "authors": [...], "keywords": [...] },
      { "id": 2, "title": "...", "publicationYear": 2023, "journalName": "...", "authors": [...], "keywords": [...] }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "sort": { "sorted": true, "direction": "DESC", "property": "publicationYear" }
    },
    "totalElements": 42,
    "totalPages": 5,
    "number": 0,
    "size": 10,
    "first": true,
    "last": false,
    "numberOfElements": 10,
    "empty": false
  }
}
```

---

## 8. Sơ đồ SQL — Các bảng tham gia JOIN

```mermaid
%%{init: { 'sequence': {'useMaxWidth': false}, 'flowchart': {'useMaxWidth': false} }}%%
erDiagram
    research_papers {
        BIGINT id PK
        VARCHAR doi UK
        VARCHAR title
        TEXT abstract_text
        INT publication_year
        VARCHAR source_url
        VARCHAR source_api
        BIGINT journal_id FK
        DATETIME fetched_at
        DATETIME created_at
    }

    journals {
        BIGINT id PK
        VARCHAR name
        VARCHAR issn
        VARCHAR publisher
        VARCHAR field
        INT paper_count
    }

    authors {
        BIGINT id PK
        VARCHAR name
        VARCHAR external_id
        VARCHAR affiliation
    }

    keywords {
        BIGINT id PK
        VARCHAR name UK
        INT usage_count
    }

    paper_authors {
        BIGINT paper_id FK
        BIGINT author_id FK
    }

    paper_keywords {
        BIGINT paper_id FK
        BIGINT keyword_id FK
    }

    research_papers ||--o{ paper_authors : "has"
    paper_authors }o--|| authors : "belongs to"
    research_papers ||--o{ paper_keywords : "has"
    paper_keywords }o--|| keywords : "belongs to"
    research_papers }o--|| journals : "published in"
```

---

## 9. Acceptance Criteria — Traceability Matrix

| # | Acceptance Criteria | Code xử lý | Kết quả |
|---|-----|------|---------|
| 1 | `?keyword=machine learning` → tìm trong title OR abstract | [PaperSpecification.hasKeyword()](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/specification/PaperSpecification.java#L15-L28) — `cb.or(cb.like(title), cb.like(abstractText))` | ✅ |
| 2 | `?author=John` → tìm papers có author tên chứa "John" | [PaperSpecification.hasAuthor()](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/specification/PaperSpecification.java#L34-L51) — `JOIN authors WHERE name LIKE %author%` | ✅ |
| 3 | `?journal=IEEE` → tìm papers thuộc journal chứa "IEEE" | [PaperSpecification.hasJournal()](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/specification/PaperSpecification.java#L57-L74) — `JOIN journals WHERE name LIKE %journal%` | ✅ |
| 4 | `?keyword=AI&yearFrom=2023&yearTo=2025` → lọc khoảng năm | [yearGreaterThanOrEqual](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/specification/PaperSpecification.java#L79-L90) + [yearLessThanOrEqual](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/specification/PaperSpecification.java#L95-L106) | ✅ |
| 5 | Phân trang đúng (totalElements, totalPages) | `PaperRepository extends JpaSpecificationExecutor` → `findAll(spec, pageable)` trả `Page<>` | ✅ |
| 6 | Không truyền param → trả toàn bộ (phân trang default) | Tất cả `@RequestParam(required = false)` + Specification trả `null` khi param trống | ✅ |
| 7 | API KHÔNG yêu cầu JWT (public) | [SecurityConfig](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/config/SecurityConfig.java#L36) — `"/api/papers/search"` trong `permitAll()` | ✅ |
| 8 | Case-insensitive search | `cb.lower(root.get(...))` + `keyword.toLowerCase()` trong tất cả Specifications | ✅ |

---

## 10. Tổng hợp — Các file liên quan đến JP-18

| Layer | File | Vai trò |
|-------|------|---------|
| **Controller** | `PaperController.java` | Nhận HTTP request, đọc query params, gọi service |
| **DTO Request** | `PaperSearchRequest.java` | Đóng gói tham số tìm kiếm |
| **DTO Response** | `PaperSummaryResponse.java` | Đóng gói kết quả trả về (không có abstract) |
| **Service** | `PaperService.java` (interface) | Contract |
| **Service Impl** | `PaperServiceImpl.java` | Xử lý logic: validate sort, build spec, query, map |
| **Specification** | `PaperSpecification.java` | Build dynamic JPA query conditions |
| **Mapper** | `PaperMapper.java` | MapStruct: Entity → DTO mapping |
| **Repository** | `PaperRepository.java` | `JpaSpecificationExecutor` — execute spec queries |
| **Entity** | `ResearchPaper.java` | JPA Entity mapping database |
| **Security** | `SecurityConfig.java` | Cấu hình `/api/papers/search` là public |
| **Response Wrapper** | `ApiResponse.java` | Wrapper chung cho tất cả API responses |
