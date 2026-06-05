# 📊 Sơ Đồ Hoạt Động (Workflow) & ERD — Scientific Journal Trend Tracker

> Tất cả sơ đồ được tạo dựa trên phân tích trực tiếp source code hiện tại của hệ thống.

---

## 1. 🔄 Sơ Đồ Hoạt Động Tổng Quan Hệ Thống

```mermaid
flowchart TD
    START(("🚀 Start")) --> A["👤 User truy cập hệ thống"]
    A --> B{"Đã đăng nhập?"}

    B -- "Chưa" --> C["Đăng ký / Đăng nhập"]
    C --> D{"Thành công?"}
    D -- "Không" --> C
    D -- "Có" --> E["🔑 JWT Token được cấp"]
    E --> F["Vào hệ thống chính"]

    B -- "Rồi (có JWT)" --> FILTER["🛡️ JwtAuthenticationFilter\nxác thực token"]
    FILTER --> FCHECK{"Token hợp lệ?"}
    FCHECK -- "Không" --> C
    FCHECK -- "Có" --> F

    F --> G["📋 Dashboard"]
    F --> H["🔍 Tìm kiếm bài báo"]
    F --> I["📈 Phân tích xu hướng"]
    F --> J["⚙️ Quản trị (Admin only)"]

    G --> G1["Xem top trending topics"]
    G --> G2["Xem thống kê tổng quan"]

    H --> H1["Tìm theo keyword / title"]
    H1 --> H2["Xem danh sách kết quả (phân trang)"]
    H2 --> H3["Xem chi tiết bài báo"]

    I --> I1["Xem trend theo keyword"]
    I --> I2["So sánh nhiều keywords"]
    I --> I3["Xem top trending topics"]

    J --> J1["Trigger đồng bộ dữ liệu"]
    J --> J2["Quản lý người dùng"]

    J1 --> SYNC["🔄 Data Sync Flow"]
    SYNC --> TREND["📊 Recalculate Trends"]

    FINISH(("🏁 End"))
    G1 --> FINISH
    G2 --> FINISH
    H3 --> FINISH
    I1 --> FINISH
    I2 --> FINISH
    I3 --> FINISH
    J2 --> FINISH
    TREND --> FINISH
```

---

## 2. 🔐 Sơ Đồ Hoạt Động — Đăng Ký & Đăng Nhập (Authentication Flow)

### 2.1 Đăng Ký Tài Khoản

```mermaid
flowchart TD
    START(("Start")) --> A["👤 User nhập thông tin đăng ký:\nusername, email, password, fullName, role"]
    A --> B["📡 POST /api/auth/register"]
    B --> C{"Username đã tồn tại?"}

    C -- "Có" --> D["❌ Trả về DuplicateResourceException"]
    D --> END1(("End"))

    C -- "Không" --> E{"Email đã tồn tại?"}
    E -- "Có" --> D

    E -- "Không" --> F["🔒 Hash password bằng BCryptPasswordEncoder"]
    F --> G["💾 Tạo User entity"]
    G --> H["💾 userRepository.save(user)"]
    H --> I["@PrePersist: set createdAt, updatedAt, isActive=true"]
    I --> J["✅ Trả về ApiResponse.success()"]
    J --> END2(("End"))
```

### 2.2 Đăng Nhập & JWT

```mermaid
flowchart TD
    START(("Start")) --> A["👤 User nhập username + password"]
    A --> B["📡 POST /api/auth/login"]
    B --> C["CustomUserDetailsService\n.loadUserByUsername(username)"]
    C --> D{"User tồn tại\ntrong DB?"}

    D -- "Không" --> E["❌ UsernameNotFoundException"]
    E --> END1(("End"))

    D -- "Có" --> F["Lấy User entity từ UserRepository"]
    F --> G["Tạo UserDetails với:\n- username\n- passwordHash\n- role → SimpleGrantedAuthority"]
    G --> H{"Password khớp?\n(BCrypt verify)"}

    H -- "Không" --> I["❌ BadCredentialsException"]
    I --> END2(("End"))

    H -- "Có" --> J["JwtTokenProvider.generateToken(userDetails)"]
    J --> K["Tạo claims: roles = authorities"]
    K --> L["Build JWT:\n- subject = username\n- issuedAt = now\n- expiration = now + jwtExpiration\n- sign with HS512"]
    L --> M["✅ Trả về JWT Token"]
    M --> END3(("End"))
```

---

## 3. 🛡️ Sơ Đồ Hoạt Động — JWT Authentication Filter (Request Pipeline)

```mermaid
flowchart TD
    START(("HTTP Request")) --> A["JwtAuthenticationFilter\n.doFilterInternal()"]
    A --> B["Đọc header: Authorization"]
    B --> C{"Header bắt đầu\nbằng 'Bearer '?"}

    C -- "Không" --> PASS["filterChain.doFilter()\n→ Tiếp tục không xác thực"]
    PASS --> END1(("Response"))

    C -- "Có" --> D["Trích xuất token:\nauthHeader.substring(7)"]
    D --> E["jwtTokenProvider.validateToken(token)"]
    E --> F{"Token hợp lệ?"}

    F -- "Không" --> G["Log: Invalid JWT"]
    G --> PASS2["filterChain.doFilter()\n→ Request không xác thực"]
    PASS2 --> END2(("Response"))

    F -- "Có" --> H["jwtTokenProvider\n.getUsernameFromToken(token)"]
    H --> I["customUserDetailsService\n.loadUserByUsername(username)"]
    I --> J["Tạo UsernamePasswordAuthenticationToken\nvới userDetails + authorities"]
    J --> K["Set authentication details\nfrom request"]
    K --> L["SecurityContextHolder\n.getContext()\n.setAuthentication(auth)"]
    L --> M["filterChain.doFilter()\n→ Request đã xác thực ✅"]
    M --> END3(("Response"))
```

---

## 4. 🔄 Sơ Đồ Hoạt Động — Đồng Bộ Dữ Liệu (Data Sync Flow)

### 4.1 syncFromSource — Đồng bộ từ 1 nguồn

```mermaid
flowchart TD
    START(("Start")) --> A["Nhận: sourceName, query"]
    A --> B["findExternalApiClient(sourceName)\nTìm client trong clientList"]
    B --> BCHECK{"Tìm thấy client?"}

    BCHECK -- "Không" --> BERR["❌ IllegalArgumentException\n'Source not found'"]
    BERR --> ENDX(("End"))

    BCHECK -- "Có" --> C["Khởi tạo SyncResult\npage=1, pageSize=10"]
    C --> D["📡 client.fetchPapers(query, page, pageSize)\nGọi External API"]

    D --> E{"batch null\nhoặc rỗng?"}
    E -- "Có" --> H["Kết thúc vòng lặp"]

    E -- "Không" --> F["🔄 Duyệt từng paper trong batch"]
    F --> G["processSinglePapper(paper, result, sourceName)\n→ Xem sơ đồ 4.2"]
    G --> I["totalFetched += batch.size()"]
    I --> J{"batch.size() < pageSize?"}
    J -- "Có" --> H
    J -- "Không" --> K["page++"]
    K --> D

    H --> L["result.setTotalFetched(totalFetched)\nresult.setSynceAt(now)"]
    L --> M["✅ Trả về SyncResult"]
    M --> END(("End"))
```

### 4.2 processSinglePapper — Xử lý từng bài báo

```mermaid
flowchart TD
    START(("Nhận RawPaperData")) --> A{"isDuplicate?\n(check DOI hoặc Title)"}

    A -- "Có trùng" --> B["📋 Log: Bỏ qua bài báo trùng\nresult.duplicates++"]
    B --> END1(("Return"))

    A -- "Không trùng" --> C["findJournal(paperData)"]
    C --> C1{"journalName\nnull/blank?"}
    C1 -- "Có" --> C2["journal = null"]
    C1 -- "Không" --> C3{"Tìm trong DB\njournalRepository\n.findByName()?"}
    C3 -- "Tìm thấy" --> C4["Dùng journal có sẵn"]
    C3 -- "Không tìm thấy" --> C5["Tạo mới Journal\n(name, issn, paperCount=0)\njournalRepository.save()"]

    C2 --> D["findAuthors(paperData)"]
    C4 --> D
    C5 --> D

    D --> D1["🔄 Duyệt từng authorName"]
    D1 --> D2{"authorRepository\n.findByName()?"}
    D2 -- "Tìm thấy" --> D3["Dùng author có sẵn"]
    D2 -- "Không tìm thấy" --> D4["Tạo mới Author\nauthorRepository.save()"]
    D3 --> D5["Thêm vào Set authors"]
    D4 --> D5

    D5 --> E["findKeywords(paperData)"]
    E --> E1["🔄 Duyệt từng keyword"]
    E1 --> E2{"keywordRepository\n.findByNameIgnoreCase()?"}
    E2 -- "Tìm thấy" --> E3["usageCount++\nkeywordRepository.save()"]
    E2 -- "Không tìm thấy" --> E4["Tạo mới Keyword\n(usageCount=1)\nkeywordRepository.save()"]
    E3 --> E5["Thêm vào Set keywords"]
    E4 --> E5

    E5 --> F["🏗️ Build ResearchPaper entity:\n- title, doi, abstractText\n- publicationYear, sourceUrl, sourceApi\n- journal, authors, keywords"]
    F --> G["💾 paperRepository.save(newPaper)\n@PrePersist: createdAt, fetchedAt = now"]
    G --> H["result.newPapers++\n📋 Log: Đã lưu bài báo"]
    H --> END2(("Return"))

    G -- "Exception" --> I["❌ result.errors++\n📋 Log error"]
    I --> END3(("Return"))
```

### 4.3 syncAllSources — Đồng bộ tất cả nguồn

```mermaid
flowchart TD
    START(("Start")) --> A["Nhận: query"]
    A --> B["Tạo SyncResult tổng\nsourceName = 'ALL'"]
    B --> C["🔄 Duyệt từng client\ntrong clientList"]

    C --> D{"client.isAvailable()\n(health check)?"}
    D -- "Không" --> E["⚠️ Log: Nguồn không khả dụng, bỏ qua"]
    E --> C

    D -- "Có" --> F["syncFromSource(client.getSourceName(), query)"]
    F --> G{"Thành công?"}
    G -- "Có" --> H["Thêm kết quả vào danh sách"]
    G -- "Không (Exception)" --> I["❌ Log lỗi, tiếp tục nguồn tiếp theo"]
    H --> C
    I --> C

    C -- "Hết client" --> J["📊 Tổng hợp kết quả:\ntotalFetched, newPapers,\nduplicates, errors"]
    J --> K["📋 Log tổng kết"]
    K --> L["✅ Trả về SyncResult tổng"]
    L --> END(("End"))
```

---

## 5. 📈 Sơ Đồ Hoạt Động — Phân Tích Xu Hướng (Trend Analysis)

### 5.1 recalculateTrends — Tính toán lại xu hướng

```mermaid
flowchart TD
    START(("Start")) --> A["🗑️ publicationTrendRepository\n.deleteAllInBatch()\nXóa tất cả trends cũ"]

    A --> B["📊 paperRepository\n.getKeywordCountsGroupByYear()\nLấy số paper theo keyword + năm"]

    B --> C["🗺️ Xây dựng Map:\nkeywordId → Map(year → paperCount)"]

    C --> D["🔄 Duyệt từng keywordId"]
    D --> E["🔄 Duyệt từng year"]

    E --> F["Lấy currentCount = yearMap.get(year)\nLấy prevCount = yearMap.get(year - 1)"]

    F --> G{"prevCount == null\nhoặc == 0?"}

    G -- "Có" --> H{"currentCount > 0?"}
    H -- "Có" --> I["growthRate = 100.0%"]
    H -- "Không" --> J["growthRate = 0.0%"]

    G -- "Không" --> K["growthRate = \n((current - prev) / prev) × 100%"]

    I --> L["Làm tròn: BigDecimal\n.setScale(2, HALF_UP)"]
    J --> L
    K --> L

    L --> M["🏗️ Build PublicationTrend:\n(keywordId, year, paperCount, growthRate)"]
    M --> N["Thêm vào trendList"]
    N --> E

    E -- "Hết year" --> D
    D -- "Hết keyword" --> O["💾 publicationTrendRepository\n.saveAll(trendList)"]

    O --> P["Tìm maxYear =\npublicationTrendRepository.findMaxYear()"]
    P --> Q{"maxYear != null?"}

    Q -- "Không" --> END1(("End"))

    Q -- "Có" --> R["researchTopicRepository\n.resetAllTrendingTopics()\nĐặt tất cả isTrending = false"]
    R --> S["researchTopicRepository\n.updateTrendingTopics(maxYear)\nĐánh dấu isTrending = true\ncho topics có growthRate > 50%"]
    S --> END2(("End ✅"))
```

### 5.2 getTrendByKeyword — Xem trend theo keyword

```mermaid
flowchart TD
    START(("Start")) --> A["Nhận: keyword, yearFrom, yearTo"]
    A --> B["📡 GET /api/trends/keyword/{keyword}\n?yearFrom=&yearTo="]
    B --> C["TrendAnalysisServiceImpl\n.getTrendByKeyword()"]
    C --> D["paperRepository.getTrendByKeyword()\n\nJPQL Query:\nSELECT year, COUNT(paper)\nFROM ResearchPaper p\nJOIN p.keywords k\nWHERE k.name = keyword\nAND year BETWEEN yearFrom AND yearTo\nGROUP BY year\nORDER BY year"]
    D --> E["✅ Trả về List TrendDataPoint\n(year, paperCount)"]
    E --> END(("End"))
```

### 5.3 compareTrends — So sánh xu hướng nhiều keywords

```mermaid
flowchart TD
    START(("Start")) --> A["Nhận: List keywords,\nyearFrom, yearTo"]
    A --> B["📡 GET /api/trends/compare\n?keywords=AI,ML&yearFrom=&yearTo="]
    B --> C["TrendAnalysisServiceImpl\n.compareTrends()"]
    C --> D["🔄 Duyệt từng keyword"]
    D --> E["getTrendByKeyword(keyword, yearFrom, yearTo)"]
    E --> F["Build TrendComparison:\n(keyword, dataPoints)"]
    F --> D
    D -- "Hết keyword" --> G["✅ Trả về List TrendComparison"]
    G --> END(("End"))
```

### 5.4 getTopTrendingTopics — Lấy top xu hướng

```mermaid
flowchart TD
    START(("Start")) --> A["Nhận: limit"]
    A --> B["📡 GET /api/trends/topics/trending\n?limit="]
    B --> C["publicationTrendRepository\n.findMaxYear()"]
    C --> D{"maxYear == null?"}
    D -- "Có" --> E["✅ Trả về List rỗng"]
    E --> END1(("End"))
    D -- "Không" --> F["publicationTrendRepository\n.findTopTrending(maxYear, PageRequest.of(0, limit))\n\nJPQL: SELECT keyword.name, paperCount,\npreviousYearCount, growthRate\nORDER BY growthRate DESC"]
    F --> G["✅ Trả về List TrendingTopic\n(keyword, currentYearCount,\npreviousYearCount, growthRate)"]
    G --> END2(("End"))
```

---

## 6. 🔍 Sơ Đồ Hoạt Động — Tìm Kiếm Bài Báo

```mermaid
flowchart TD
    START(("Start")) --> A["👤 User nhập từ khóa tìm kiếm"]
    A --> B["📡 GET /api/papers/search\n?keyword=...&page=0&size=10\n(permitAll - không cần JWT)"]
    B --> C["PaperRepository\n.findByTitleContainingIgnoreCase(\nkeyword, Pageable)"]
    C --> D["📄 Trả về Page ResearchPaper"]
    D --> E["PaperMapper.toSummary()\nChuyển Entity → PaperSummaryResponse:\n(id, doi, title, publicationYear)"]
    E --> F["✅ Trả về danh sách kết quả\n+ thông tin phân trang"]
    F --> G{"User muốn xem\nchi tiết?"}
    G -- "Có" --> H["📡 GET /api/papers/{id}\n(cần JWT)"]
    H --> I["PaperMapper.toResponse()\n→ PaperResponse bao gồm:\njournal, authors, keywords"]
    I --> J["✅ Hiển thị chi tiết bài báo"]
    J --> END1(("End"))
    G -- "Không" --> END2(("End"))
```

---

## 7. 🌐 Sơ Đồ Hoạt Động — OpenAlex Client (Fetch Papers)

```mermaid
flowchart TD
    START(("fetchPapers\n(query, page, size)")) --> A["normalizeSize(size)\nnormalizePage(page)"]
    A --> B["papers = new ArrayList"]
    B --> C["currentPage = startPage"]

    C --> D{"papers.size() < requestedSize\nAND currentPage < startPage + 5?"}

    D -- "Không" --> RETURN["✅ return papers"]
    RETURN --> END(("End"))

    D -- "Có" --> E["📡 GET /works\n?search=query\n&filter=concepts.id:C41008148\n&per_page=size\n&page=currentPage"]

    E --> F["executeWorksRequest()"]
    F --> F1["WebClient GET → bodyToMono(String)\n.timeout(10s)\n.retryWhen(rateLimitRetry)"]

    F1 --> F2{"Response OK?"}
    F2 -- "Timeout" --> F3["⚠️ Log: request timed out\nreturn empty list"]
    F2 -- "Error" --> F4["⚠️ Log: request failed\nreturn empty list"]

    F2 -- "OK" --> F5["Parse JSON → results array"]
    F5 --> F6["🔄 Duyệt từng result"]
    F6 --> F7["toRawPaperData(result):\n- doi, title\n- convertAbstractInvertedIndex()\n- journalName from primary_location.source\n- authorNames from authorships\n- keywords from concepts (max 5)"]
    F7 --> F8{"isCompletePaper?\n(title, doi, year,\nauthors, keywords\nđều có giá trị?)"}
    F8 -- "Không" --> F6
    F8 -- "Có & under limit" --> F9["Thêm vào batch"]
    F9 --> F6

    F6 -- "Hết results" --> G{"batch rỗng?"}
    G -- "Có" --> RETURN
    G -- "Không" --> H["papers.addAll(batch)"]
    H --> I["currentPage++"]
    I --> D

    F3 --> G2["batch = empty"]
    F4 --> G2
    G2 --> G
```

---

## 8. 📊 Sơ Đồ Hoạt Động Tổng Hợp — Luồng Dữ Liệu End-to-End

```mermaid
flowchart LR
    subgraph Trigger["🎯 Trigger"]
        ADMIN["👨‍💼 Admin\nManual Trigger"]
        SCHED["⏰ Scheduler\n@Scheduled"]
    end

    subgraph Sync["🔄 Data Sync"]
        direction TB
        S1["DataSyncServiceImpl\n.syncAllSources(query)"]
        S2["Kiểm tra isAvailable()"]
        S3["fetchPapers() từ API"]
        S4["processSinglePapper()"]
        S5["isDuplicate(DOI/Title)?"]
        S6["findJournal / findAuthors\nfindKeywords"]
        S7["paperRepository.save()"]
    end

    subgraph Analysis["📈 Trend Analysis"]
        direction TB
        T1["TrendAnalysisServiceImpl\n.recalculateTrends()"]
        T2["Xóa trends cũ"]
        T3["Aggregate:\nkeyword × year → count"]
        T4["Tính growthRate\ncho mỗi keyword/year"]
        T5["Lưu PublicationTrend"]
        T6["Update isTrending\ncho ResearchTopic"]
    end

    subgraph Display["📊 Display"]
        direction TB
        D1["GET /api/trends/keyword"]
        D2["GET /api/trends/compare"]
        D3["GET /api/trends/topics/trending"]
        D4["Frontend Charts:\nLine / Bar / Pie"]
    end

    ADMIN --> S1
    SCHED --> S1
    S1 --> S2 --> S3 --> S4 --> S5
    S5 --> S6 --> S7

    S7 --> T1
    T1 --> T2 --> T3 --> T4 --> T5 --> T6

    T6 --> D1
    T6 --> D2
    T6 --> D3
    D1 --> D4
    D2 --> D4
    D3 --> D4
```

---

## 9. 📐 ERD — Entity Relationship Diagram

### 9.1 ERD Đầy Đủ (phản ánh chính xác source code)

```mermaid
erDiagram
    users {
        BIGINT id PK "AUTO_INCREMENT"
        VARCHAR_50 username UK "NOT NULL"
        VARCHAR_100 email UK "NOT NULL"
        VARCHAR_255 password_hash "NOT NULL"
        VARCHAR_100 full_name "NULLABLE"
        ENUM role "RESEARCHER | LECTURER | STUDENT | ADMIN"
        BOOLEAN is_active "DEFAULT TRUE, NOT NULL"
        DATETIME created_at "AUTO @PrePersist"
        DATETIME updated_at "AUTO @PreUpdate"
    }

    research_papers {
        BIGINT id PK "AUTO_INCREMENT"
        VARCHAR_255 doi UK "NULLABLE"
        VARCHAR_1000 title "NOT NULL"
        TEXT abstract_text "NULLABLE"
        INT publication_year "NULLABLE"
        VARCHAR_2000 source_url "NULLABLE"
        VARCHAR_50 source_api "NULLABLE"
        BIGINT journal_id FK "NULLABLE → journals.id"
        DATETIME fetched_at "AUTO"
        DATETIME created_at "NOT NULL, AUTO @PrePersist"
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
        BIGINT keyword_id FK "NOT NULL → keywords.id"
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
        BIGINT paper_id FK "PK → research_papers.id"
        BIGINT author_id FK "PK → authors.id"
    }

    paper_keywords {
        BIGINT paper_id FK "PK → research_papers.id"
        BIGINT keyword_id FK "PK → keywords.id"
    }

    topic_keywords {
        BIGINT topic_id FK "PK → research_topics.id"
        BIGINT keyword_id FK "PK → keywords.id"
    }

    research_papers }o--|| journals : "published_in (journal_id)"
    research_papers ||--o{ paper_authors : "paper_id"
    authors ||--o{ paper_authors : "author_id"
    research_papers ||--o{ paper_keywords : "paper_id"
    keywords ||--o{ paper_keywords : "keyword_id"
    keywords ||--o{ publication_trends : "keyword_id"
    research_topics ||--o{ topic_keywords : "topic_id"
    keywords ||--o{ topic_keywords : "keyword_id"
```

### 9.2 Bảng Tóm Tắt Quan Hệ (Cardinality)

| Quan hệ | Loại | Cơ chế | Mô tả |
|---------|------|--------|-------|
| `journals` → `research_papers` | **1 : N** | FK `journal_id` trong `research_papers` | 1 tạp chí chứa nhiều bài báo |
| `research_papers` ↔ `authors` | **N : N** | Bảng nối `paper_authors` | 1 bài báo có nhiều tác giả, 1 tác giả có nhiều bài báo |
| `research_papers` ↔ `keywords` | **N : N** | Bảng nối `paper_keywords` | 1 bài báo gắn nhiều từ khóa, 1 từ khóa thuộc nhiều bài báo |
| `keywords` → `publication_trends` | **1 : N** | FK `keyword_id` trong `publication_trends` | 1 từ khóa có nhiều bản ghi trend theo từng năm |
| `research_topics` ↔ `keywords` | **N : N** | Bảng nối `topic_keywords` | 1 chủ đề gồm nhiều từ khóa, 1 từ khóa thuộc nhiều chủ đề |
| `users` | **Độc lập** | Không FK | Quản lý riêng, liên kết qua JWT token |

### 9.3 JPA Mapping — Entity ↔ Table

| Entity | Table | Quan hệ JPA | Annotation |
|--------|-------|-------------|-----------|
| [ResearchPaper](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/entity/ResearchPaper.java) → Journal | N:1 | `@ManyToOne(fetch=LAZY)` | `@JoinColumn(name="journal_id", insertable=false, updatable=false)` |
| [ResearchPaper](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/entity/ResearchPaper.java) ↔ Author | N:N | `@ManyToMany` + `@JoinTable` | Bảng nối `paper_authors(paper_id, author_id)` |
| [ResearchPaper](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/entity/ResearchPaper.java) ↔ Keyword | N:N | `@ManyToMany` + `@JoinTable` | Bảng nối `paper_keywords(paper_id, keyword_id)` |
| [Journal](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/entity/Journal.java) → ResearchPaper | 1:N | `@OneToMany(mappedBy="journal", fetch=LAZY)` | Owning side ở ResearchPaper |
| [Author](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/entity/Author.java) ↔ ResearchPaper | N:N | `@ManyToMany(mappedBy="authors")` | Inverse side |
| [Keyword](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/entity/Keyword.java) ↔ ResearchPaper | N:N | `@ManyToMany(mappedBy="keywords")` | Inverse side |
| [PublicationTrend](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/entity/PublicationTrend.java) → Keyword | N:1 | `@ManyToOne(fetch=LAZY)` | `@JoinColumn(name="keyword_id", insertable=false, updatable=false)` |
| [ResearchTopic](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/entity/ResearchTopic.java) ↔ Keyword | N:N | `@ManyToMany(fetch=LAZY)` + `@JoinTable` | Bảng nối `topic_keywords(topic_id, keyword_id)` |
