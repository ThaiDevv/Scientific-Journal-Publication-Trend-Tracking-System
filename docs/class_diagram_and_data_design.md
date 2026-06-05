# 📐 Class Diagram & Data Design — Scientific Journal Trend Tracker

> Tài liệu này được tạo dựa trên phân tích toàn bộ source code hiện tại của hệ thống.
> Mỗi class, attribute, method đều phản ánh chính xác code đang có trong project.

---

## 1. 🏛️ Class Diagram Tổng Quan — Kiến Trúc Phân Tầng (Layered Architecture)

```mermaid
classDiagram
    direction TB

    class Application {
        +main(String[] args)
    }

    namespace Controller_Layer {
        class AuthController {
            -OpenAlexClient alexClient
            +login() String
            +register() String
            +test() List~RawPaperData~
        }
    }

    namespace Service_Layer {
        class DataSyncService {
            <<interface>>
            +syncFromSource(String, String) SyncResult
            +syncRecentPapers(String, LocalDate) SyncResult
            +syncAllSources(String) SyncResult
        }

        class TrendAnalysisService {
            <<interface>>
            +getTrendByKeyword(String, int, int) List~TrendDataPoint~
            +compareTrends(List~String~, int, int) List~TrendComparison~
            +getTopTrendingTopics(int) List~TrendingTopic~
            +recalculateTrends() void
        }

        class DataSyncServiceImpl {
            -List~ExternalApiClient~ clientList
            -PaperRepository paperRepository
            -JournalRepository journalRepository
            -AuthorRepository authorRepository
            -KeywordRepository keywordRepository
            +syncFromSource(String, String) SyncResult
            +syncRecentPapers(String, LocalDate) SyncResult
            +syncAllSources(String) SyncResult
            +processSinglePapper(RawPaperData, SyncResult, String) void
            +findKeywords(RawPaperData) Set~Keyword~
            +findAuthors(RawPaperData) Set~Author~
            +findJournal(RawPaperData) Journal
            +isDuplicate(RawPaperData) boolean
            +findExternalApiClient(String) ExternalApiClient
        }

        class TrendAnalysisServiceImpl {
            -PaperRepository paperRepository
            -KeywordRepository keywordRepository
            -PublicationTrendRepository publicationTrendRepository
            -ResearchTopicRepository researchTopicRepository
            +getTrendByKeyword(String, int, int) List~TrendDataPoint~
            +compareTrends(List~String~, int, int) List~TrendComparison~
            +getTopTrendingTopics(int) List~TrendingTopic~
            +recalculateTrends() void
        }
    }

    namespace Repository_Layer {
        class UserRepository {
            <<interface>>
            +findByUsername(String) Optional~User~
            +findByEmail(String) Optional~User~
            +existsByUsername(String) boolean
            +existsByEmail(String) boolean
        }

        class PaperRepository {
            <<interface>>
            +findByTitleContainingIgnoreCase(String, Pageable) Page~ResearchPaper~
            +findByDoi(String) Optional~ResearchPaper~
            +existsByDoi(String) boolean
            +existsByTitle(String) boolean
            +getTrendByKeyword(String, int, int) List~TrendDataPoint~
            +getKeywordCountsGroupByYear() List~KeywordYearCount~
        }

        class JournalRepository {
            <<interface>>
            +findByName(String) Optional~Journal~
        }

        class AuthorRepository {
            <<interface>>
            +findByExternalId(String) Optional~Author~
            +findByName(String) Optional~Author~
        }

        class KeywordRepository {
            <<interface>>
            +findByNameIgnoreCase(String) Optional~Keyword~
            +findTop20ByOrderByUsageCountDesc() List~Keyword~
        }

        class PublicationTrendRepository {
            <<interface>>
            +findMaxYear() Integer
            +findTopTrending(int, Pageable) List~TrendingTopic~
        }

        class ResearchTopicRepository {
            <<interface>>
            +resetAllTrendingTopics() void
            +updateTrendingTopics(int) void
        }
    }

    DataSyncServiceImpl ..|> DataSyncService
    TrendAnalysisServiceImpl ..|> TrendAnalysisService
    AuthController --> DataSyncService
    DataSyncServiceImpl --> PaperRepository
    DataSyncServiceImpl --> JournalRepository
    DataSyncServiceImpl --> AuthorRepository
    DataSyncServiceImpl --> KeywordRepository
    TrendAnalysisServiceImpl --> PaperRepository
    TrendAnalysisServiceImpl --> KeywordRepository
    TrendAnalysisServiceImpl --> PublicationTrendRepository
    TrendAnalysisServiceImpl --> ResearchTopicRepository
```

---

## 2. 📦 Class Diagram — Entity Layer (Domain Model)

```mermaid
classDiagram
    direction LR

    class Role {
        <<enumeration>>
        RESEARCHER
        LECTURER
        STUDENT
        ADMIN
    }

    class User {
        -Long id
        -String username
        -String email
        -String passwordHash
        -String fullName
        -Role role
        -Boolean isActive
        -LocalDateTime createdAt
        -LocalDateTime updatedAt
        +prePersist() void
        +preUpdate() void
    }

    class ResearchPaper {
        -Long id
        -String doi
        -String title
        -String abstractText
        -Integer publicationYear
        -String sourceUrl
        -String sourceApi
        -Long journalId
        -Journal journal
        -Set~Author~ authors
        -Set~Keyword~ keywords
        -LocalDateTime fetchedAt
        -LocalDateTime createdAt
        +onCreate() void
    }

    class Journal {
        -Long id
        -String name
        -String issn
        -String publisher
        -String field
        -Integer paperCount
        -Set~ResearchPaper~ papers
    }

    class Author {
        -Long id
        -String name
        -String externalId
        -String affiliation
        -Set~ResearchPaper~ papers
    }

    class Keyword {
        -Long id
        -String name
        -Integer usageCount
        -Set~ResearchPaper~ papers
    }

    class PublicationTrend {
        -Long id
        -Long keywordId
        -Keyword keyword
        -Integer year
        -Integer paperCount
        -BigDecimal growthRate
    }

    class ResearchTopic {
        -Long id
        -String name
        -String description
        -boolean isTrending
        -Set~Keyword~ keywords
    }

    User --> Role : has
    ResearchPaper "N" --> "1" Journal : published_in
    ResearchPaper "N" <--> "N" Author : paper_authors
    ResearchPaper "N" <--> "N" Keyword : paper_keywords
    PublicationTrend "N" --> "1" Keyword : tracks
    ResearchTopic "N" <--> "N" Keyword : topic_keywords
    Journal "1" --> "N" ResearchPaper : contains
```

---

## 3. 🔐 Class Diagram — Security Layer

```mermaid
classDiagram
    direction TB

    class SecurityConfig {
        -JwtAuthenticationFilter jwtAuthenticationFilter
        +securityFilterChain(HttpSecurity) SecurityFilterChain
        +passwordEncoder() PasswordEncoder
    }

    class JwtAuthenticationFilter {
        -CustomUserDetailsService customUserDetailsService
        -JwtTokenProvider jwtTokenProvider
        +doFilterInternal(HttpServletRequest, HttpServletResponse, FilterChain) void
    }

    class JwtTokenProvider {
        -String secret
        -long jwtExpiration
        -getSigningKey() SecretKey
        +generateToken(UserDetails) String
        +validateToken(String) boolean
        +getUsernameFromToken(String) String
        -getClaimsUser(UserDetails) Map
    }

    class CustomUserDetailsService {
        -UserRepository userRepository
        +loadUserByUsername(String) UserDetails
    }

    class OncePerRequestFilter {
        <<abstract>>
    }

    class UserDetailsService {
        <<interface>>
        +loadUserByUsername(String) UserDetails
    }

    JwtAuthenticationFilter --|> OncePerRequestFilter
    CustomUserDetailsService ..|> UserDetailsService
    SecurityConfig --> JwtAuthenticationFilter : configures
    JwtAuthenticationFilter --> JwtTokenProvider : validates token
    JwtAuthenticationFilter --> CustomUserDetailsService : loads user
    CustomUserDetailsService --> UserRepository : queries
```

---

## 4. 🌐 Class Diagram — External API Client Layer

```mermaid
classDiagram
    direction TB

    class ExternalApiClient {
        <<interface>>
        +getSourceName() String
        +fetchPapers(String, int, int) List~RawPaperData~
        +fetchRecentPapers(LocalDate, int, int) List~RawPaperData~
        +isAvailable() boolean
    }

    class OpenAlexClient {
        -String SOURCE_NAME$
        -String COMPUTER_SCIENCE_CONCEPT_ID$
        -Duration REQUEST_TIMEOUT$
        -int MAX_PAGE_ATTEMPTS$
        -WebClient webClient
        -OpenAlexProperties properties
        -ObjectMapper objectMapper
        +fetchPapers(String, int, int) List~RawPaperData~
        +fetchRecentPapers(LocalDate, int, int) List~RawPaperData~
        +getSourceName() String
        +isAvailable() boolean
        +convertAbstractInvertedIndex(JsonNode) String
        -executeWorksRequest(RequestHeadersSpec, int) List~RawPaperData~
        -rateLimitRetry() Retry
        -isRateLimitException(Throwable) boolean
        -isTimeout(Throwable) boolean
        -toRawPaperData(JsonNode) RawPaperData
        -journalName(JsonNode) String
        -authorNames(JsonNode) List~String~
        -keywords(JsonNode) List~String~
        -textOrNull(JsonNode, String) String
        -integerOrNull(JsonNode, String) Integer
        -isCompletePaper(RawPaperData) boolean
        -normalizePage(int) int
        -normalizeSize(int) int
    }

    class WordPosition {
        <<record>>
        -String word
        -int position
    }

    class OpenAlexProperties {
        -String baseUrl
        -String email
        -int perPage
    }

    OpenAlexClient ..|> ExternalApiClient
    OpenAlexClient --> OpenAlexProperties : uses config
    OpenAlexClient *-- WordPosition : inner class
    DataSyncServiceImpl --> ExternalApiClient : uses
```

---

## 5. 📨 Class Diagram — DTO Layer

```mermaid
classDiagram
    direction TB

    namespace Request_DTOs {
        class RawPaperData {
            -String externalId
            -String doi
            -String title
            -String abstractText
            -Integer publicationYear
            -String sourceUrl
            -String journalName
            -String journalIssn
            -List~String~ authorNames
            -List~String~ keywords
        }

        class SyncResult {
            -String sourceName
            -int totalFetched
            -int newPapers
            -int duplpicates
            -int errors
            -LocalDate synceAt
        }
    }

    namespace Trend_DTOs {
        class TrendDataPoint {
            -int year
            -int paperCount
        }

        class TrendComparison {
            -String keyword
            -List~TrendDataPoint~ dataPoints
        }

        class TrendingTopic {
            -String keyword
            -int currentYearCount
            -int previousYearCount
            -double growthRate
        }

        class KeywordYearCount {
            -Long keywordId
            -Integer year
            -Long paperCount
        }
    }

    namespace Response_DTOs {
        class ApiResponse~T~ {
            -boolean success
            -String message
            -T body
            +success(String, T) ApiResponse~T~$
            +success(T) ApiResponse~T~$
            +error(String, T) ApiResponse~T~$
            +error(String) ApiResponse~T~$
        }

        class PaperResponse {
            -Long id
            -String doi
            -String title
            -String abstractText
            -Integer publicationYear
            -String sourceUrl
            -String sourceApi
            -JournalResponse journal
            -Set~AuthorResponse~ authors
            -Set~KeywordResponse~ keywords
        }

        class PaperSummaryResponse {
            -Long id
            -String doi
            -String title
            -Integer publicationYear
        }

        class JournalResponse {
            -Long id
            -String name
            -String issn
            -String publisher
            -String field
            -Integer paperCount
        }

        class AuthorResponse {
            -Long id
            -String name
            -String affilliation
        }

        class KeywordResponse {
            -Long id
            -String name
            -Integer usageCount
        }
    }

    PaperResponse --> JournalResponse
    PaperResponse --> AuthorResponse
    PaperResponse --> KeywordResponse
    TrendComparison --> TrendDataPoint
```

---

## 6. 🗺️ Class Diagram — Mapper & Exception Layer

```mermaid
classDiagram
    direction TB

    namespace Mappers {
        class PaperMapper {
            <<interface>>
            +toResponse(ResearchPaper) PaperResponse
            +toSummary(ResearchPaper) PaperSummaryResponse
        }

        class JournalMapper {
            <<interface>>
            +toResponse(Journal) JournalResponse
        }
    }

    namespace Exceptions {
        class GlobalExceptionHandler {
            +handleAccessDeniedException(AccessDeniedException) ResponseEntity
            +handleBadRequestException(BadRequestException) ResponseEntity
            +handleDuplicateResourceException(DuplicateResourceException) ResponseEntity
            +handleResourceNotFoundException(ResourceNotFoundException) ResponseEntity
            +handleUnauthorizedException(UnauthorizedException) ResponseEntity
            +handleMethodArgumentNotValidException(MethodArgumentNotValidException) ResponseEntity
            +handleMethodNotSupported(HttpRequestMethodNotSupportedException) ResponseEntity
            +handleException(Exception) ResponseEntity
        }

        class AccessDeniedException {
        }
        class BadRequestException {
        }
        class DuplicateResourceException {
        }
        class ResourceNotFoundException {
        }
        class UnauthorizedException {
        }
    }

    class RuntimeException

    AccessDeniedException --|> RuntimeException
    BadRequestException --|> RuntimeException
    DuplicateResourceException --|> RuntimeException
    ResourceNotFoundException --|> RuntimeException
    UnauthorizedException --|> RuntimeException
    GlobalExceptionHandler ..> AccessDeniedException : handles
    GlobalExceptionHandler ..> BadRequestException : handles
    GlobalExceptionHandler ..> DuplicateResourceException : handles
    GlobalExceptionHandler ..> ResourceNotFoundException : handles
    GlobalExceptionHandler ..> UnauthorizedException : handles

    PaperMapper ..> PaperResponse : creates
    PaperMapper ..> PaperSummaryResponse : creates
    JournalMapper ..> JournalResponse : creates
```

---

## 7. ⚙️ Class Diagram — Configuration Layer

```mermaid
classDiagram
    direction TB

    class SecurityConfig {
        -JwtAuthenticationFilter jwtAuthenticationFilter
        +securityFilterChain(HttpSecurity) SecurityFilterChain
        +passwordEncoder() PasswordEncoder
    }

    class WebConfig {
        <<WebMvcConfigurer>>
        +addCorsMappings(CorsRegistry) void
    }

    class SwaggerConfig {
        +customOpenAPI() OpenAPI
    }

    class ExternalApiConfig {
        +webClientBuilder() WebClient.Builder
        +objectMapper() ObjectMapper
    }

    class OpenAlexProperties {
        -String baseUrl
        -String email
        -int perPage
    }
```

---

## 8. 📊 Class Diagram Tổng Hợp — Quan Hệ Giữa Các Tầng

```mermaid
classDiagram
    direction TB

    %% Controller Layer
    class AuthController {
        +login()
        +register()
        +test()
    }

    %% Service Layer
    class DataSyncService {
        <<interface>>
    }
    class TrendAnalysisService {
        <<interface>>
    }
    class DataSyncServiceImpl
    class TrendAnalysisServiceImpl

    %% Repository Layer
    class PaperRepository {
        <<interface>>
    }
    class UserRepository {
        <<interface>>
    }
    class JournalRepository {
        <<interface>>
    }
    class AuthorRepository {
        <<interface>>
    }
    class KeywordRepository {
        <<interface>>
    }
    class PublicationTrendRepository {
        <<interface>>
    }
    class ResearchTopicRepository {
        <<interface>>
    }

    %% Entity Layer
    class User
    class ResearchPaper
    class Journal
    class Author
    class Keyword
    class PublicationTrend
    class ResearchTopic

    %% External
    class ExternalApiClient {
        <<interface>>
    }
    class OpenAlexClient

    %% Security
    class JwtAuthenticationFilter
    class JwtTokenProvider
    class CustomUserDetailsService

    %% Mapper
    class PaperMapper {
        <<interface>>
    }
    class JournalMapper {
        <<interface>>
    }

    %% === RELATIONSHIPS ===
    %% Controller -> Service
    AuthController --> OpenAlexClient

    %% Service Impl -> Interface
    DataSyncServiceImpl ..|> DataSyncService
    TrendAnalysisServiceImpl ..|> TrendAnalysisService
    OpenAlexClient ..|> ExternalApiClient

    %% Service -> Repository
    DataSyncServiceImpl --> PaperRepository
    DataSyncServiceImpl --> JournalRepository
    DataSyncServiceImpl --> AuthorRepository
    DataSyncServiceImpl --> KeywordRepository
    DataSyncServiceImpl --> ExternalApiClient

    TrendAnalysisServiceImpl --> PaperRepository
    TrendAnalysisServiceImpl --> KeywordRepository
    TrendAnalysisServiceImpl --> PublicationTrendRepository
    TrendAnalysisServiceImpl --> ResearchTopicRepository

    %% Repository -> Entity
    UserRepository --> User
    PaperRepository --> ResearchPaper
    JournalRepository --> Journal
    AuthorRepository --> Author
    KeywordRepository --> Keyword
    PublicationTrendRepository --> PublicationTrend
    ResearchTopicRepository --> ResearchTopic

    %% Security chain
    JwtAuthenticationFilter --> JwtTokenProvider
    JwtAuthenticationFilter --> CustomUserDetailsService
    CustomUserDetailsService --> UserRepository
```

---

## 9. 💾 Data Design — Thiết Kế Cơ Sở Dữ Liệu

### 9.1 ERD (Entity Relationship Diagram)

```mermaid
erDiagram
    users {
        BIGINT id PK "AUTO_INCREMENT"
        VARCHAR_50 username UK "NOT NULL"
        VARCHAR_100 email UK "NOT NULL"
        VARCHAR_255 password_hash "NOT NULL"
        VARCHAR_100 full_name "NULLABLE"
        ENUM role "RESEARCHER | LECTURER | STUDENT | ADMIN"
        BOOLEAN is_active "DEFAULT TRUE"
        DATETIME created_at "AUTO"
        DATETIME updated_at "AUTO"
    }

    research_papers {
        BIGINT id PK "AUTO_INCREMENT"
        VARCHAR_255 doi UK "NULLABLE"
        VARCHAR_1000 title "NOT NULL"
        TEXT abstract_text "NULLABLE"
        INT publication_year "NULLABLE"
        VARCHAR_2000 source_url "NULLABLE"
        VARCHAR_50 source_api "NULLABLE"
        BIGINT journal_id FK "NULLABLE"
        DATETIME fetched_at "AUTO"
        DATETIME created_at "NOT NULL, AUTO"
    }

    journals {
        BIGINT id PK "AUTO_INCREMENT"
        VARCHAR_255 name "NOT NULL"
        VARCHAR_20 issn "NULLABLE"
        VARCHAR_255 publisher "NULLABLE"
        VARCHAR_100 field "NULLABLE"
        INT paper_count "NULLABLE"
    }

    authors {
        BIGINT id PK "AUTO_INCREMENT"
        VARCHAR_255 name "NOT NULL"
        VARCHAR_100 external_id "NULLABLE"
        VARCHAR_255 affiliation "NULLABLE"
    }

    keywords {
        BIGINT id PK "AUTO_INCREMENT"
        VARCHAR_255 name UK "NOT NULL"
        INT usage_count "NULLABLE"
    }

    publication_trends {
        BIGINT id PK "AUTO_INCREMENT"
        BIGINT keyword_id FK "NOT NULL"
        INT year "NOT NULL"
        INT paper_count "NOT NULL"
        DECIMAL_5_2 growth_rate "NULLABLE"
    }

    research_topics {
        BIGINT id PK "AUTO_INCREMENT"
        VARCHAR_255 name "NOT NULL"
        TEXT description "NULLABLE"
        BOOLEAN is_trending "NOT NULL"
    }

    paper_authors {
        BIGINT paper_id FK "PK, NOT NULL"
        BIGINT author_id FK "PK, NOT NULL"
    }

    paper_keywords {
        BIGINT paper_id FK "PK, NOT NULL"
        BIGINT keyword_id FK "PK, NOT NULL"
    }

    topic_keywords {
        BIGINT topic_id FK "PK, NOT NULL"
        BIGINT keyword_id FK "PK, NOT NULL"
    }

    research_papers }o--|| journals : "journal_id"
    research_papers ||--o{ paper_authors : "paper_id"
    authors ||--o{ paper_authors : "author_id"
    research_papers ||--o{ paper_keywords : "paper_id"
    keywords ||--o{ paper_keywords : "keyword_id"
    keywords ||--o{ publication_trends : "keyword_id"
    research_topics ||--o{ topic_keywords : "topic_id"
    keywords ||--o{ topic_keywords : "keyword_id"
```

### 9.2 Mô Tả Chi Tiết Các Bảng

#### 📋 Bảng `users` — Quản lý người dùng

| Cột           | Kiểu dữ liệu | Ràng buộc           | Mô tả                                     |
|---------------|---------------|---------------------|--------------------------------------------|
| `id`          | BIGINT        | PK, AUTO_INCREMENT  | Khóa chính                                 |
| `username`    | VARCHAR(50)   | UNIQUE, NOT NULL    | Tên đăng nhập                              |
| `email`       | VARCHAR(100)  | UNIQUE, NOT NULL    | Email                                      |
| `password_hash` | VARCHAR(255) | NOT NULL           | Mật khẩu đã hash (BCrypt)                  |
| `full_name`   | VARCHAR(100)  | NULLABLE            | Họ tên đầy đủ                              |
| `role`        | ENUM          | NOT NULL            | Vai trò: RESEARCHER, LECTURER, STUDENT, ADMIN |
| `is_active`   | BOOLEAN       | NOT NULL, DEFAULT 1 | Trạng thái hoạt động                       |
| `created_at`  | DATETIME      | AUTO @PrePersist    | Thời điểm tạo                              |
| `updated_at`  | DATETIME      | AUTO @PreUpdate     | Thời điểm cập nhật                         |

#### 📋 Bảng `research_papers` — Bài báo khoa học

| Cột               | Kiểu dữ liệu  | Ràng buộc          | Mô tả                          |
|--------------------|----------------|--------------------|---------------------------------|
| `id`               | BIGINT         | PK, AUTO_INCREMENT | Khóa chính                      |
| `doi`              | VARCHAR(255)   | UNIQUE, NULLABLE   | Digital Object Identifier       |
| `title`            | VARCHAR(1000)  | NOT NULL           | Tiêu đề bài báo                |
| `abstract_text`    | TEXT           | NULLABLE           | Tóm tắt                        |
| `publication_year` | INT            | NULLABLE           | Năm xuất bản                    |
| `source_url`       | VARCHAR(2000)  | NULLABLE           | URL nguồn                       |
| `source_api`       | VARCHAR(50)    | NULLABLE           | Nguồn API (OpenAlex, Crossref…) |
| `journal_id`       | BIGINT         | FK → journals.id   | Journal đã đăng                 |
| `fetched_at`       | DATETIME       | AUTO               | Thời điểm lấy dữ liệu          |
| `created_at`       | DATETIME       | NOT NULL, AUTO     | Thời điểm tạo record           |

#### 📋 Bảng `journals` — Tạp chí khoa học

| Cột           | Kiểu dữ liệu | Ràng buộc          | Mô tả              |
|---------------|---------------|--------------------|--------------------|
| `id`          | BIGINT        | PK, AUTO_INCREMENT | Khóa chính          |
| `name`        | VARCHAR(255)  | NOT NULL           | Tên tạp chí         |
| `issn`        | VARCHAR(20)   | NULLABLE           | Mã ISSN             |
| `publisher`   | VARCHAR(255)  | NULLABLE           | Nhà xuất bản        |
| `field`       | VARCHAR(100)  | NULLABLE           | Lĩnh vực            |
| `paper_count` | INT           | NULLABLE           | Tổng số bài báo     |

#### 📋 Bảng `authors` — Tác giả

| Cột           | Kiểu dữ liệu | Ràng buộc          | Mô tả                   |
|---------------|---------------|--------------------|--------------------------| 
| `id`          | BIGINT        | PK, AUTO_INCREMENT | Khóa chính                |
| `name`        | VARCHAR(255)  | NOT NULL           | Tên tác giả              |
| `external_id` | VARCHAR(100)  | NULLABLE           | ID từ nguồn bên ngoài     |
| `affiliation` | VARCHAR(255)  | NULLABLE           | Tổ chức / trường đại học  |

#### 📋 Bảng `keywords` — Từ khóa

| Cột           | Kiểu dữ liệu | Ràng buộc          | Mô tả                |
|---------------|---------------|--------------------|-----------------------|
| `id`          | BIGINT        | PK, AUTO_INCREMENT | Khóa chính             |
| `name`        | VARCHAR(255)  | UNIQUE, NOT NULL   | Tên từ khóa            |
| `usage_count` | INT           | NULLABLE           | Số lần xuất hiện       |

#### 📋 Bảng `publication_trends` — Xu hướng xuất bản

| Cột           | Kiểu dữ liệu | Ràng buộc            | Mô tả                      |
|---------------|---------------|----------------------|-----------------------------|
| `id`          | BIGINT        | PK, AUTO_INCREMENT   | Khóa chính                   |
| `keyword_id`  | BIGINT        | FK → keywords.id, NN | Từ khóa được theo dõi        |
| `year`        | INT           | NOT NULL             | Năm                          |
| `paper_count` | INT           | NOT NULL             | Số bài báo trong năm         |
| `growth_rate` | DECIMAL(5,2)  | NULLABLE             | Tỷ lệ tăng trưởng (%)       |

#### 📋 Bảng `research_topics` — Chủ đề nghiên cứu

| Cột           | Kiểu dữ liệu | Ràng buộc          | Mô tả                 |
|---------------|---------------|--------------------|-----------------------|
| `id`          | BIGINT        | PK, AUTO_INCREMENT | Khóa chính              |
| `name`        | VARCHAR(255)  | NOT NULL           | Tên chủ đề             |
| `description` | TEXT          | NULLABLE           | Mô tả chủ đề           |
| `is_trending` | BOOLEAN       | NOT NULL           | Đang là xu hướng?       |

#### 📋 Bảng nối `paper_authors` — N-N giữa Paper và Author

| Cột         | Kiểu dữ liệu | Ràng buộc                   | Mô tả       |
|-------------|---------------|-----------------------------|--------------|
| `paper_id`  | BIGINT        | PK, FK → research_papers.id | Bài báo      |
| `author_id` | BIGINT        | PK, FK → authors.id         | Tác giả      |

#### 📋 Bảng nối `paper_keywords` — N-N giữa Paper và Keyword

| Cột          | Kiểu dữ liệu | Ràng buộc                   | Mô tả       |
|--------------|---------------|-----------------------------|--------------|
| `paper_id`   | BIGINT        | PK, FK → research_papers.id | Bài báo      |
| `keyword_id` | BIGINT        | PK, FK → keywords.id        | Từ khóa      |

#### 📋 Bảng nối `topic_keywords` — N-N giữa Topic và Keyword

| Cột          | Kiểu dữ liệu | Ràng buộc                   | Mô tả       |
|--------------|---------------|-----------------------------|--------------|
| `topic_id`   | BIGINT        | PK, FK → research_topics.id | Chủ đề       |
| `keyword_id` | BIGINT        | PK, FK → keywords.id        | Từ khóa      |

---

### 9.3 SQL Schema — DDL Script

```sql
-- =============================================
-- Scientific Journal Trend Tracker — DDL Script
-- Database: MySQL 8.x
-- =============================================

-- 1. Users
CREATE TABLE users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(100),
    role          ENUM('RESEARCHER','ADMIN','LECTURER','STUDENT') NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    DATETIME,
    updated_at    DATETIME
);

-- 2. Journals
CREATE TABLE journals (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    issn        VARCHAR(20),
    publisher   VARCHAR(255),
    field       VARCHAR(100),
    paper_count INT
);

-- 3. Authors
CREATE TABLE authors (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    external_id VARCHAR(100),
    affiliation VARCHAR(255)
);

-- 4. Keywords
CREATE TABLE keywords (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL UNIQUE,
    usage_count INT
);

-- 5. Research Papers
CREATE TABLE research_papers (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    doi              VARCHAR(255) UNIQUE,
    title            VARCHAR(1000) NOT NULL,
    abstract_text    TEXT,
    publication_year INT,
    source_url       VARCHAR(2000),
    source_api       VARCHAR(50),
    journal_id       BIGINT,
    fetched_at       DATETIME,
    created_at       DATETIME NOT NULL,
    CONSTRAINT fk_paper_journal FOREIGN KEY (journal_id)
        REFERENCES journals(id) ON DELETE SET NULL
);

-- 6. Paper-Author (Many-to-Many)
CREATE TABLE paper_authors (
    paper_id  BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    PRIMARY KEY (paper_id, author_id),
    CONSTRAINT fk_pa_paper  FOREIGN KEY (paper_id)  REFERENCES research_papers(id) ON DELETE CASCADE,
    CONSTRAINT fk_pa_author FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
);

-- 7. Paper-Keyword (Many-to-Many)
CREATE TABLE paper_keywords (
    paper_id   BIGINT NOT NULL,
    keyword_id BIGINT NOT NULL,
    PRIMARY KEY (paper_id, keyword_id),
    CONSTRAINT fk_pk_paper   FOREIGN KEY (paper_id)   REFERENCES research_papers(id) ON DELETE CASCADE,
    CONSTRAINT fk_pk_keyword FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE CASCADE
);

-- 8. Publication Trends
CREATE TABLE publication_trends (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    keyword_id  BIGINT NOT NULL,
    year        INT    NOT NULL,
    paper_count INT    NOT NULL,
    growth_rate DECIMAL(5,2),
    CONSTRAINT fk_trend_keyword FOREIGN KEY (keyword_id)
        REFERENCES keywords(id) ON DELETE CASCADE
);

-- 9. Research Topics
CREATE TABLE research_topics (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    is_trending BOOLEAN NOT NULL DEFAULT FALSE
);

-- 10. Topic-Keyword (Many-to-Many)
CREATE TABLE topic_keywords (
    topic_id   BIGINT NOT NULL,
    keyword_id BIGINT NOT NULL,
    PRIMARY KEY (topic_id, keyword_id),
    CONSTRAINT fk_tk_topic   FOREIGN KEY (topic_id)   REFERENCES research_topics(id) ON DELETE CASCADE,
    CONSTRAINT fk_tk_keyword FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE CASCADE
);

-- =============================================
-- INDEXES for Performance
-- =============================================

CREATE INDEX idx_paper_year      ON research_papers(publication_year);
CREATE INDEX idx_paper_journal   ON research_papers(journal_id);
CREATE INDEX idx_paper_doi       ON research_papers(doi);
CREATE INDEX idx_paper_source    ON research_papers(source_api);
CREATE INDEX idx_trend_keyword   ON publication_trends(keyword_id);
CREATE INDEX idx_trend_year      ON publication_trends(year);
CREATE INDEX idx_keyword_usage   ON keywords(usage_count DESC);
CREATE INDEX idx_user_role       ON users(role);
CREATE INDEX idx_user_active     ON users(is_active);
CREATE INDEX idx_author_ext_id   ON authors(external_id);
```

---

### 9.4 Sơ Đồ Quan Hệ Tổng Hợp (Cardinality)

| Quan hệ                         | Loại      | Bảng nối          | Mô tả                                    |
|----------------------------------|-----------|--------------------|-------------------------------------------|
| Journal → ResearchPaper          | 1 : N     | *(FK journal_id)*  | 1 journal chứa nhiều papers               |
| ResearchPaper ↔ Author           | N : N     | `paper_authors`    | 1 paper có nhiều authors và ngược lại      |
| ResearchPaper ↔ Keyword          | N : N     | `paper_keywords`   | 1 paper có nhiều keywords và ngược lại     |
| Keyword → PublicationTrend       | 1 : N     | *(FK keyword_id)*  | 1 keyword có nhiều trend records theo năm  |
| ResearchTopic ↔ Keyword          | N : N     | `topic_keywords`   | 1 topic gồm nhiều keywords và ngược lại   |

---

### 9.5 Data Flow — Luồng Dữ Liệu Trong Hệ Thống

```mermaid
flowchart LR
    subgraph External["🌐 External APIs"]
        OA["OpenAlex API"]
    end

    subgraph Client_Layer["📡 Client Layer"]
        OAC["OpenAlexClient"]
    end

    subgraph Service_Layer["⚙️ Service Layer"]
        DSS["DataSyncServiceImpl"]
        TAS["TrendAnalysisServiceImpl"]
    end

    subgraph Repository_Layer["💾 Repository Layer"]
        PR["PaperRepository"]
        JR["JournalRepository"]
        AR["AuthorRepository"]
        KR["KeywordRepository"]
        PTR["PublicationTrendRepository"]
        RTR["ResearchTopicRepository"]
    end

    subgraph Database["🗄️ MySQL Database"]
        RP_T["research_papers"]
        J_T["journals"]
        A_T["authors"]
        K_T["keywords"]
        PT_T["publication_trends"]
        RT_T["research_topics"]
        PA_T["paper_authors"]
        PK_T["paper_keywords"]
        TK_T["topic_keywords"]
    end

    OA -->|"JSON Response"| OAC
    OAC -->|"List RawPaperData"| DSS
    DSS -->|"findJournal()"| JR
    DSS -->|"findAuthors()"| AR
    DSS -->|"findKeywords()"| KR
    DSS -->|"save(paper)"| PR
    TAS -->|"getTrendByKeyword()"| PR
    TAS -->|"getKeywordCountsGroupByYear()"| PR
    TAS -->|"saveAll(trends)"| PTR
    TAS -->|"updateTrendingTopics()"| RTR

    PR --> RP_T
    JR --> J_T
    AR --> A_T
    KR --> K_T
    PTR --> PT_T
    RTR --> RT_T
```
