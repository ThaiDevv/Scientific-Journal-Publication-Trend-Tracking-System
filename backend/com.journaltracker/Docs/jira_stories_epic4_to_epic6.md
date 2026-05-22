# 📋 Jira Stories Chi Tiết — EPIC 4 → EPIC 6

---
---

# 📈 EPIC-4: Trend Analysis & Data Sync

---

## JP-24: Core Data Sync Service Interface

### Summary
`[JP-24] Thiết kế interface DataSyncService và ExternalApiClient cho luồng đồng bộ dữ liệu`

### Description
**User Story:**
Là một **Architect (Leader)**, tôi muốn **định nghĩa interface chuẩn cho luồng đồng bộ dữ liệu từ các API bên ngoài** để **các thành viên khác có thể implement các client cụ thể (OpenAlex, Crossref) theo đúng contract mà không ảnh hưởng đến logic nghiệp vụ chính**.

**Technical Details:**
- Tạo `ExternalApiClient.java` (Interface) trong package `client/`:
  ```java
  public interface ExternalApiClient {
      String getSourceName();   // "OpenAlex", "Crossref", "SemanticScholar"
      List<RawPaperData> fetchPapers(String query, int page, int pageSize);
      List<RawPaperData> fetchRecentPapers(LocalDate fromDate, int page, int pageSize);
      boolean isAvailable();    // health check
  }
  ```
- Tạo `RawPaperData.java` (DTO trung gian):
  ```java
  {
    "externalId": "W12345",
    "doi": "10.1234/abc",
    "title": "...",
    "abstractText": "...",
    "publicationYear": 2024,
    "sourceUrl": "https://...",
    "journalName": "IEEE...",
    "journalIssn": "1234-5678",
    "authorNames": ["John Smith", "Jane Doe"],
    "keywords": ["AI", "deep learning"]
  }
  ```
- Tạo `DataSyncService.java` (Interface):
  ```java
  public interface DataSyncService {
      SyncResult syncFromSource(String sourceName, String query);
      SyncResult syncRecentPapers(String sourceName, LocalDate fromDate);
      SyncResult syncAllSources(String query);
  }
  ```
- Tạo `DataSyncServiceImpl.java`:
  - Inject `List<ExternalApiClient>` (Spring tự động inject tất cả implementations).
  - Logic:
    1. Gọi `client.fetchPapers()` → nhận `List<RawPaperData>`.
    2. Với mỗi `RawPaperData` → gọi `normalizePaper()` để chuyển thành Entity.
    3. Kiểm tra duplicate bằng DOI → nếu trùng thì skip hoặc update.
    4. Lưu vào database (Paper, Author, Keyword, Journal).
    5. Cập nhật `usage_count` của keywords.
    6. Trả về `SyncResult` (số papers mới, số duplicates, số lỗi).
- Tạo `SyncResult.java`:
  ```java
  {
    "sourceName": "OpenAlex",
    "totalFetched": 100,
    "newPapers": 85,
    "duplicates": 12,
    "errors": 3,
    "syncedAt": "2026-05-20T10:00:00"
  }
  ```

### Acceptance Criteria
- [ ] Interface `ExternalApiClient` đã được tạo với 4 method signatures.
- [ ] Interface `DataSyncService` đã được tạo với 3 method signatures.
- [ ] `DataSyncServiceImpl` đã implement logic normalize + dedup + save.
- [ ] Viết unit test: given một list `RawPaperData` giả → save vào DB thành công → trả về `SyncResult` đúng.
- [ ] Khi `RawPaperData` có DOI trùng với paper đã có trong DB → paper đó bị skip (không tạo duplicate).
- [ ] Keywords được tạo mới nếu chưa tồn tại, `usageCount` tăng thêm nếu đã tồn tại.
- [ ] Journal được tạo mới nếu chưa tồn tại (match bằng tên hoặc ISSN).

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Leader (Bạn) |
| **Epic** | EPIC-4: Trend Analysis & Data Sync |
| **Sprint** | Sprint 2 |
| **Priority** | 🔴 Highest |
| **Story Points** | 5 |

---

## JP-25: OpenAlex API Client

### Summary
`[JP-25] Implement OpenAlex API Client để thu thập metadata bài báo`

### Description
**User Story:**
Là một **hệ thống**, tôi muốn **kết nối với OpenAlex API để thu thập metadata bài báo khoa học** để **database luôn có dữ liệu cập nhật về các bài báo mới nhất trong lĩnh vực Computer Science và AI**.

**Technical Details:**
- Tạo `OpenAlexClient.java` (implements `ExternalApiClient`):
- OpenAlex API documentation: [https://docs.openalex.org](https://docs.openalex.org)
- Base URL: `https://api.openalex.org`
- Endpoints sử dụng:
  - `GET /works?search={query}&per_page={size}&page={page}` → tìm bài báo theo keyword.
  - `GET /works?filter=from_publication_date:{date}` → lấy bài báo mới.
  - `GET /works?filter=concepts.id:C41008148` → lọc theo lĩnh vực Computer Science.
- Sử dụng `WebClient` (Spring WebFlux) để gọi API.
- Parse JSON response của OpenAlex:
  - `results[].doi` → doi
  - `results[].title` → title
  - `results[].abstract_inverted_index` → cần convert inverted index sang plain text
  - `results[].publication_year` → publicationYear
  - `results[].primary_location.source.display_name` → journalName
  - `results[].authorships[].author.display_name` → authorNames
  - `results[].concepts[].display_name` → keywords (lấy top 5 concepts)
- Xử lý lỗi:
  - Rate limit (429) → retry sau 1 giây (dùng `Retry`).
  - Timeout → log warning, skip batch hiện tại.
  - Thêm header `mailto` theo khuyến nghị OpenAlex: `User-Agent: mailto:your@email.com`.
- Config trong `application.yml`:
  ```yaml
  external-api:
    openalex:
      base-url: https://api.openalex.org
      email: your_team_email@gmail.com
      per-page: 25
  ```

### Acceptance Criteria
- [ ] Gọi `openAlexClient.fetchPapers("machine learning", 1, 10)` → trả về `List<RawPaperData>` chứa 10 papers.
- [ ] Mỗi `RawPaperData` có đầy đủ: title, doi, publicationYear, authorNames, keywords.
- [ ] Abstract inverted index được convert chính xác sang plain text.
- [ ] Gọi `fetchRecentPapers(LocalDate.now().minusDays(7), 1, 10)` → trả về papers trong 7 ngày gần nhất.
- [ ] Khi API trả về lỗi 429 (rate limit) → client tự retry sau 1 giây.
- [ ] Khi API timeout → không throw exception, trả về empty list và log warning.
- [ ] `getSourceName()` trả về `"OpenAlex"`.
- [ ] `isAvailable()` gọi health check → trả về true khi API reachable.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 4 (BE Trend) |
| **Epic** | EPIC-4: Trend Analysis & Data Sync |
| **Sprint** | Sprint 2-3 |
| **Priority** | 🔴 Highest |
| **Story Points** | 5 |

---

## JP-26: Crossref API Client

### Summary
`[JP-26] Implement Crossref API Client để thu thập metadata bài báo`

### Description
**User Story:**
Là một **hệ thống**, tôi muốn **kết nối thêm với Crossref API làm nguồn dữ liệu bổ sung** để **tăng độ phủ và đa dạng nguồn metadata bài báo khoa học**.

**Technical Details:**
- Tạo `CrossrefClient.java` (implements `ExternalApiClient`).
- Crossref API: [https://api.crossref.org](https://api.crossref.org)
- Endpoints:
  - `GET /works?query={query}&rows={size}&offset={offset}` → tìm bài báo.
  - `GET /works?filter=from-pub-date:{date}&rows={size}` → bài báo mới.
- Parse JSON response:
  - `message.items[].DOI` → doi
  - `message.items[].title[0]` → title
  - `message.items[].abstract` → abstractText (có thể chứa XML tags → strip tags)
  - `message.items[].published.date-parts[0][0]` → publicationYear
  - `message.items[].container-title[0]` → journalName
  - `message.items[].author[].given + family` → authorNames
  - `message.items[].subject` → keywords
- Thêm `Polite Pool` header: `User-Agent: JournalTracker/1.0 (mailto:your@email.com)`.
- Xử lý lỗi tương tự OpenAlex.

### Acceptance Criteria
- [ ] Gọi `crossrefClient.fetchPapers("artificial intelligence", 1, 10)` → trả về `List<RawPaperData>`.
- [ ] Dữ liệu trả về đầy đủ: doi, title, publicationYear, authorNames.
- [ ] Abstract text không chứa XML tags (đã strip clean).
- [ ] `getSourceName()` trả về `"Crossref"`.
- [ ] Rate limiting được xử lý đúng.
- [ ] Config base-url nằm trong `application.yml`.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 4 (BE Trend) |
| **Epic** | EPIC-4: Trend Analysis & Data Sync |
| **Sprint** | Sprint 3 |
| **Priority** | 🟠 High |
| **Story Points** | 3 |

---

## JP-27: Semantic Scholar API Client

### Summary
`[JP-27] Implement Semantic Scholar API Client (nguồn dữ liệu bổ sung)`

### Description
**User Story:**
Là một **hệ thống**, tôi muốn **có thêm nguồn dữ liệu từ Semantic Scholar** để **tăng độ phủ dữ liệu, đặc biệt trong lĩnh vực Computer Science và AI**.

**Technical Details:**
- Tạo `SemanticScholarClient.java` (implements `ExternalApiClient`).
- API: `https://api.semanticscholar.org/graph/v1`
- Endpoint: `GET /paper/search?query={query}&limit={size}&offset={offset}&fields=title,abstract,year,authors,journal,externalIds`
- Parse response:
  - `data[].externalIds.DOI` → doi
  - `data[].title` → title
  - `data[].abstract` → abstractText
  - `data[].year` → publicationYear
  - `data[].journal.name` → journalName
  - `data[].authors[].name` → authorNames
- Rate limit: 100 requests / 5 phút cho API miễn phí.

### Acceptance Criteria
- [ ] Gọi `semanticScholarClient.fetchPapers("deep learning", 1, 10)` → trả về papers.
- [ ] Dữ liệu có đầy đủ: doi (nếu có), title, publicationYear, authorNames.
- [ ] Rate limit được xử lý đúng (không vượt quá 100 req / 5 phút).
- [ ] `getSourceName()` trả về `"SemanticScholar"`.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 4 (BE Trend) |
| **Epic** | EPIC-4: Trend Analysis & Data Sync |
| **Sprint** | Sprint 4 |
| **Priority** | 🟡 Medium |
| **Story Points** | 3 |

---

## JP-28: Data Sync Scheduler

### Summary
`[JP-28] Thiết kế Scheduler tự động đồng bộ dữ liệu từ External APIs`

### Description
**User Story:**
Là một **System Administrator**, tôi muốn **hệ thống tự động đồng bộ dữ liệu bài báo mới từ các API bên ngoài theo lịch định kỳ** để **database luôn được cập nhật mà không cần thao tác thủ công**.

**Technical Details:**
- Tạo `SchedulerConfig.java`:
  - Enable scheduling: `@EnableScheduling`.
  - Cấu hình thread pool cho scheduler: `ThreadPoolTaskScheduler` với 2 threads.
- Tạo `DataSyncScheduler.java`:
  - `@Scheduled(cron = "${sync.cron:0 0 2 * * ?}")` → chạy lúc 2:00 AM mỗi ngày.
  - Logic:
    1. Lấy danh sách `ApiDataSource` đang active từ database.
    2. Với mỗi source → gọi `dataSyncService.syncRecentPapers()` với `fromDate = lastSyncAt`.
    3. Cập nhật `lastSyncAt` của source.
    4. Log kết quả sync (số papers mới, errors).
    5. Sau khi sync xong → gọi `trendAnalysisService.recalculateTrends()`.
    6. Gọi `notificationService.notifyFollowers()` nếu có papers mới cho các topics/journals đang được follow.
  - Xử lý lỗi: nếu 1 source bị lỗi → log error, tiếp tục sync source tiếp theo (không dừng toàn bộ).
- Config trong `application.yml`:
  ```yaml
  sync:
    cron: "0 0 2 * * ?"     # 2:00 AM mỗi ngày
    enabled: true
    default-query: "computer science"
    max-pages-per-sync: 5
  ```

### Acceptance Criteria
- [ ] Scheduler chạy đúng thời gian được cấu hình (test bằng cách set cron chạy mỗi phút).
- [ ] Sau khi scheduler chạy → database có thêm papers mới.
- [ ] Log hiển thị kết quả: "Synced from OpenAlex: 50 new papers, 5 duplicates, 0 errors".
- [ ] Nếu một source bị lỗi → các source khác vẫn sync bình thường.
- [ ] `lastSyncAt` của `ApiDataSource` được cập nhật sau mỗi lần sync.
- [ ] Có thể tắt scheduler bằng config `sync.enabled: false`.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Leader (Bạn) |
| **Epic** | EPIC-4: Trend Analysis & Data Sync |
| **Sprint** | Sprint 3 |
| **Priority** | 🟠 High |
| **Story Points** | 3 |

---

## JP-29: Core Trend Analysis Logic

### Summary
`[JP-29] Thiết kế logic phân tích xu hướng nghiên cứu (Trend Analysis)`

### Description
**User Story:**
Là một **Researcher**, tôi muốn **hệ thống tự động phân tích xu hướng các chủ đề nghiên cứu theo thời gian** để **tôi biết được keyword nào đang hot, chủ đề nào đang phát triển, và lĩnh vực nào có tiềm năng**.

**Technical Details:**
- Tạo `TrendAnalysisService.java` (Interface):
  ```java
  public interface TrendAnalysisService {
      List<TrendDataPoint> getTrendByKeyword(String keyword, int yearFrom, int yearTo);
      List<TrendComparison> compareTrends(List<String> keywords, int yearFrom, int yearTo);
      List<TrendingTopic> getTopTrendingTopics(int limit);
      void recalculateTrends();
  }
  ```
- Tạo `TrendAnalysisServiceImpl.java`:
  - **`getTrendByKeyword()`:**
    - Query: `SELECT k.name, p.publication_year, COUNT(p.id) FROM papers p JOIN paper_keywords pk ON ... JOIN keywords k ON ... WHERE k.name = :keyword GROUP BY p.publication_year ORDER BY p.publication_year`.
    - Trả về danh sách `TrendDataPoint { year, paperCount }`.
  - **`compareTrends()`:**
    - Giống trên nhưng cho nhiều keywords cùng lúc.
    - Trả về `TrendComparison { keyword, dataPoints: List<TrendDataPoint> }`.
  - **`getTopTrendingTopics()`:**
    - Tính growth rate: so sánh số papers năm hiện tại vs năm trước.
    - `growthRate = (countThisYear - countLastYear) / countLastYear * 100`.
    - Sắp xếp theo growthRate giảm dần → lấy top N.
    - Trả về `TrendingTopic { keyword, currentYearCount, previousYearCount, growthRate }`.
  - **`recalculateTrends()`:**
    - Chạy sau mỗi lần sync.
    - Tính toán lại bảng `publication_trends` (keyword_id, year, paper_count, growth_rate).
    - Update trường `is_trending` trong bảng `research_topics`.
- Sử dụng **Native Query** hoặc **JPQL** cho các aggregation query phức tạp.
- Tạo `PublicationTrend.java` Entity + `PublicationTrendRepository.java`.

### Acceptance Criteria
- [ ] `getTrendByKeyword("machine learning", 2018, 2026)` → trả về danh sách `{ year, paperCount }` cho mỗi năm từ 2018-2026.
- [ ] `compareTrends(["AI", "blockchain"], 2020, 2026)` → trả về 2 series data riêng biệt.
- [ ] `getTopTrendingTopics(10)` → trả về 10 keywords có growth rate cao nhất, sắp xếp giảm dần.
- [ ] Growth rate tính đúng: nếu keyword "AI" năm 2025 có 100 papers, năm 2024 có 80 papers → growthRate = 25%.
- [ ] `recalculateTrends()` cập nhật bảng `publication_trends` thành công.
- [ ] Keywords có growth rate > 50% → `is_trending = true` trong bảng `research_topics`.
- [ ] Nếu keyword không có paper nào → trả về danh sách rỗng (không throw exception).

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Leader (Bạn) |
| **Epic** | EPIC-4: Trend Analysis & Data Sync |
| **Sprint** | Sprint 2-3 |
| **Priority** | 🔴 Highest |
| **Story Points** | 8 |

---

## JP-30: Trend API Endpoints

### Summary
`[JP-30] Thiết kế REST API Endpoints cho Trend Analysis`

### Description
**User Story:**
Là một **Frontend Developer**, tôi muốn **có các API endpoint trả về dữ liệu trend** để **tôi có thể vẽ biểu đồ xu hướng trên giao diện**.

**Technical Details:**
- Tạo `TrendController.java`:
  - `GET /api/trends/keyword/{keyword}` → trend theo 1 keyword.
    - Query params: `yearFrom` (default 2018), `yearTo` (default năm hiện tại).
    - Response: `ApiResponse<List<TrendDataPoint>>`.
  - `GET /api/trends/compare` → so sánh nhiều keywords.
    - Query params: `keywords` (comma-separated: "AI,blockchain,quantum"), `yearFrom`, `yearTo`.
    - Response: `ApiResponse<List<TrendComparison>>`.
  - `GET /api/trends/topics/trending` → top trending topics.
    - Query param: `limit` (default 10).
    - Response: `ApiResponse<List<TrendingTopic>>`.
- Tất cả endpoints: PUBLIC (không cần JWT) để user chưa đăng nhập vẫn xem được.
- DTOs:
  ```java
  TrendDataPoint { int year; int paperCount; }
  TrendComparison { String keyword; List<TrendDataPoint> dataPoints; }
  TrendingTopic { String keyword; int currentYearCount; int previousYearCount; double growthRate; }
  ```

### Acceptance Criteria
- [ ] GET `/api/trends/keyword/machine%20learning?yearFrom=2020&yearTo=2026` → trả về list data points.
- [ ] GET `/api/trends/compare?keywords=AI,deep learning,NLP&yearFrom=2020` → trả về 3 series data.
- [ ] GET `/api/trends/topics/trending?limit=5` → trả về 5 trending topics sắp theo growth rate.
- [ ] Tất cả API trả về format `ApiResponse<T>` thống nhất.
- [ ] API PUBLIC, không cần JWT token.
- [ ] Keyword không tồn tại → trả về list rỗng, HTTP 200 (không phải 404).

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 4 (BE Trend) |
| **Epic** | EPIC-4: Trend Analysis & Data Sync |
| **Sprint** | Sprint 4 |
| **Priority** | 🟠 High |
| **Story Points** | 3 |

---

## JP-31: Research Topic CRUD

### Summary
`[JP-31] Thiết kế API CRUD cho Research Topics`

### Description
**User Story:**
Là một **Admin**, tôi muốn **tạo và quản lý các Research Topics (chủ đề nghiên cứu)** và **gán keywords vào từng topic** để **hệ thống nhóm các keywords liên quan lại với nhau phục vụ phân tích xu hướng theo topic lớn**.

**Technical Details:**
- Tạo `ResearchTopicService.java` + Impl:
  - `createTopic(CreateTopicRequest)` → `TopicResponse`
  - `updateTopic(Long id, UpdateTopicRequest)` → `TopicResponse`
  - `deleteTopic(Long id)` → void
  - `getAllTopics(Pageable)` → `Page<TopicResponse>`
  - `getTopicById(Long id)` → `TopicDetailResponse` (kèm keywords + trend data)
  - `addKeywordToTopic(Long topicId, Long keywordId)` → void
  - `removeKeywordFromTopic(Long topicId, Long keywordId)` → void
- `CreateTopicRequest`: `{ name, description, keywordIds: [1, 2, 3] }`
- `TopicDetailResponse`:
  ```java
  {
    "id": 1,
    "name": "Artificial Intelligence",
    "description": "Research related to AI, ML, and deep learning",
    "isTrending": true,
    "keywords": [{ "id": 1, "name": "AI" }, { "id": 2, "name": "machine learning" }],
    "trendData": [{ "year": 2024, "paperCount": 500 }, ...]
  }
  ```
- Endpoints (yêu cầu ADMIN cho create/update/delete):
  - `POST /api/topics` (ADMIN)
  - `PUT /api/topics/{id}` (ADMIN)
  - `DELETE /api/topics/{id}` (ADMIN)
  - `GET /api/topics` (PUBLIC)
  - `GET /api/topics/{id}` (PUBLIC)
  - `POST /api/topics/{id}/keywords/{keywordId}` (ADMIN)
  - `DELETE /api/topics/{id}/keywords/{keywordId}` (ADMIN)

### Acceptance Criteria
- [ ] POST `/api/topics` với role ADMIN → tạo topic mới thành công, gán keywords.
- [ ] POST `/api/topics` với role STUDENT → HTTP 403.
- [ ] GET `/api/topics` → danh sách topics phân trang (PUBLIC).
- [ ] GET `/api/topics/1` → chi tiết topic kèm keywords và trend data.
- [ ] POST `/api/topics/1/keywords/5` → keyword id=5 được gán vào topic id=1.
- [ ] DELETE `/api/topics/1` → xóa topic (không xóa keywords liên quan).

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 4 (BE Trend) |
| **Epic** | EPIC-4: Trend Analysis & Data Sync |
| **Sprint** | Sprint 5 |
| **Priority** | 🟡 Medium |
| **Story Points** | 3 |

---

## JP-32: API Data Source Management

### Summary
`[JP-32] Thiết kế API quản lý nguồn dữ liệu và trigger sync thủ công`

### Description
**User Story:**
Là một **System Administrator**, tôi muốn **xem trạng thái các nguồn API dữ liệu, bật/tắt nguồn, và trigger đồng bộ thủ công** để **kiểm soát quá trình cập nhật dữ liệu bài báo vào hệ thống**.

**Technical Details:**
- Tạo `ApiDataSource.java` Entity (nếu chưa có).
- Endpoints (ADMIN only):
  - `GET /api/admin/datasources` → danh sách các nguồn API.
  - `PUT /api/admin/datasources/{id}` → cập nhật config (bật/tắt, đổi API key).
  - `POST /api/admin/sync/trigger` → trigger sync thủ công.
    - Request body: `{ "sourceName": "OpenAlex", "query": "computer science", "maxPages": 3 }`
    - Trả về `SyncResult`.
  - `GET /api/admin/sync/status` → trạng thái sync gần nhất.
- `DataSourceResponse`:
  ```java
  {
    "id": 1,
    "name": "OpenAlex",
    "baseUrl": "https://api.openalex.org",
    "isActive": true,
    "lastSyncAt": "2026-05-20T02:00:00",
    "lastSyncResult": { "newPapers": 50, "errors": 0 }
  }
  ```

### Acceptance Criteria
- [ ] GET `/api/admin/datasources` → hiển thị tất cả sources kèm trạng thái.
- [ ] PUT → tắt source (isActive = false) → scheduler không sync source này nữa.
- [ ] POST `/api/admin/sync/trigger` → sync chạy ngay, trả về `SyncResult`.
- [ ] GET `/api/admin/sync/status` → trả về kết quả sync gần nhất.
- [ ] Tất cả endpoints yêu cầu ADMIN role.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 4 (BE Trend) |
| **Epic** | EPIC-4: Trend Analysis & Data Sync |
| **Sprint** | Sprint 5 |
| **Priority** | 🟡 Medium |
| **Story Points** | 2 |

---

## JP-33: Deduplication Logic

### Summary
`[JP-33] Thiết kế logic kiểm tra và loại bỏ bài báo trùng lặp từ nhiều nguồn`

### Description
**User Story:**
Là một **Architect (Leader)**, tôi muốn **hệ thống tự động nhận diện và xử lý bài báo trùng lặp khi thu thập từ nhiều nguồn API khác nhau** để **database không chứa dữ liệu trùng lặp gây sai lệch thống kê**.

**Technical Details:**
- Tạo `DeduplicationService.java`:
  - **Bước 1 — Match by DOI** (chính xác nhất):
    - Nếu `RawPaperData.doi != null` → query `PaperRepository.existsByDoi(doi)`.
    - Nếu trùng → skip hoặc update metadata.
  - **Bước 2 — Match by Title** (fallback khi không có DOI):
    - Normalize title: lowercase, remove dấu câu, trim spaces.
    - Query: `PaperRepository.findByNormalizedTitle(normalizedTitle)`.
    - Nếu trùng → skip.
  - **Merge strategy:**
    - Nếu paper đã tồn tại nhưng source mới có thêm keywords hoặc abstract → cập nhật bổ sung (không ghi đè).
    - Ghi log: "Paper [DOI] already exists, merged additional data from [source]".
- Logic này được gọi từ `DataSyncServiceImpl.java` trước khi save paper mới.

### Acceptance Criteria
- [ ] Paper với DOI giống nhau từ 2 nguồn khác nhau → chỉ lưu 1 bản duy nhất trong DB.
- [ ] Paper không có DOI nhưng cùng title (case-insensitive) → được nhận diện là trùng.
- [ ] Paper trùng nhưng source mới có thêm keywords → keywords mới được merge vào paper cũ.
- [ ] Log hiển thị rõ ràng: số papers bị trùng, số papers được merge.
- [ ] Test với 2 `RawPaperData` có cùng DOI → kết quả: 1 paper trong DB + `SyncResult.duplicates = 1`.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Leader (Bạn) |
| **Epic** | EPIC-4: Trend Analysis & Data Sync |
| **Sprint** | Sprint 3 |
| **Priority** | 🟠 High |
| **Story Points** | 3 |

---
---

# 📊 EPIC-5: Dashboard & Visualization

---

## JP-34: Dashboard API

### Summary
`[JP-34] Thiết kế API Dashboard trả về thống kê tổng quan hệ thống`

### Description
**User Story:**
Là một **User**, tôi muốn **xem dashboard với các thống kê tổng quan** như **tổng số bài báo, journals, tác giả, topics trending, và papers mới nhất** để **nắm được bức tranh toàn cảnh về dữ liệu nghiên cứu trong hệ thống**.

**Technical Details:**
- Tạo `DashboardService.java` + Impl:
  - `getOverviewStats()` → `DashboardStatsResponse`
  - `getTrendingTopics(int limit)` → `List<TrendingTopic>`
  - `getRecentPapers(int limit)` → `List<PaperSummaryResponse>`
  - `getTopJournals(int limit)` → `List<JournalStatsResponse>`
  - `getPublicationsByYear()` → `List<YearlyStats>`
- DTOs:
  ```java
  DashboardStatsResponse {
    long totalPapers;
    long totalJournals;
    long totalAuthors;
    long totalKeywords;
    long papersThisMonth;
    long papersThisYear;
    LocalDateTime lastSyncAt;
  }
  
  JournalStatsResponse {
    String journalName;
    int paperCount;
    String field;
  }
  
  YearlyStats {
    int year;
    int paperCount;
  }
  ```
- Tạo `DashboardController.java`:
  - `GET /api/dashboard/stats` → thống kê tổng quan (PUBLIC).
  - `GET /api/dashboard/trending` → trending topics (PUBLIC).
  - `GET /api/dashboard/recent-papers?limit=10` → papers mới nhất (PUBLIC).
  - `GET /api/dashboard/top-journals?limit=10` → top journals (PUBLIC).
  - `GET /api/dashboard/yearly-stats` → số papers theo năm (PUBLIC).

### Acceptance Criteria
- [ ] GET `/api/dashboard/stats` → trả về đủ: totalPapers, totalJournals, totalAuthors, totalKeywords.
- [ ] GET `/api/dashboard/trending?limit=5` → 5 trending topics sắp xếp theo growth rate.
- [ ] GET `/api/dashboard/recent-papers?limit=10` → 10 papers mới nhất theo `createdAt`.
- [ ] GET `/api/dashboard/top-journals?limit=10` → 10 journals có nhiều papers nhất.
- [ ] GET `/api/dashboard/yearly-stats` → trả về `[{ year, paperCount }]` cho mỗi năm có dữ liệu.
- [ ] Tất cả API PUBLIC, không cần JWT.
- [ ] Response time < 500ms (sử dụng query tối ưu, không N+1).

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 4 (BE Trend) |
| **Epic** | EPIC-5: Dashboard & Visualization |
| **Sprint** | Sprint 4 |
| **Priority** | 🟠 High |
| **Story Points** | 3 |

---

## JP-35: Frontend - Dashboard Page

### Summary
`[JP-35] Thiết kế giao diện trang Dashboard chính`

### Description
**User Story:**
Là một **User**, tôi muốn **có một trang dashboard trực quan, đẹp mắt** hiển thị **các thống kê quan trọng, trending topics, papers mới nhất, và biểu đồ** để **nắm bắt nhanh xu hướng nghiên cứu ngay khi mở ứng dụng**.

**Technical Details:**
- Tạo file `src/pages/Dashboard.jsx`.
- Route: `/` hoặc `/dashboard` (trang chính sau đăng nhập).
- Layout (Grid 2 cột trên desktop, 1 cột trên mobile):
  - **Row 1 — Stat Cards** (4 cards ngang hàng):
    - Card 1: Tổng số bài báo (icon 📄, số lượng lớn, nhỏ bên dưới: "+XX tháng này")
    - Card 2: Tổng số Journals (icon 📚)
    - Card 3: Tổng số Tác giả (icon 👥)
    - Card 4: Tổng số Keywords (icon 🏷️)
    - Sử dụng Ant Design `Card` + `Statistic` component.
  - **Row 2 — 2 cột**:
    - Cột trái (60%): **Biểu đồ Line Chart** — Số lượng papers theo năm (từ API `/dashboard/yearly-stats`). Sử dụng Recharts `LineChart`.
    - Cột phải (40%): **Trending Topics** — Danh sách top 10 topics đang hot (từ API `/dashboard/trending`). Hiển thị: tên keyword, growth rate %, icon tăng/giảm.
  - **Row 3 — 2 cột**:
    - Cột trái (60%): **Recent Papers** — Danh sách 10 bài báo mới nhất (title, journal, year). Click → navigate `/papers/{id}`.
    - Cột phải (40%): **Top Journals** — Danh sách 10 journals nhiều papers nhất. Dạng bar chart nhỏ hoặc list.
- Gọi APIs: `/dashboard/stats`, `/dashboard/trending`, `/dashboard/recent-papers`, `/dashboard/yearly-stats`, `/dashboard/top-journals`.
- Tạo `src/api/dashboardApi.js`.
- Khi đang load → hiển thị Skeleton placeholders.

### Acceptance Criteria
- [ ] Trang Dashboard hiển thị 4 stat cards với số liệu từ API.
- [ ] Biểu đồ Line Chart hiển thị đúng dữ liệu papers theo năm.
- [ ] Danh sách Trending Topics hiển thị keyword + growth rate.
- [ ] Danh sách Recent Papers có thể click vào → navigate đến paper detail.
- [ ] Danh sách Top Journals hiển thị đúng thứ tự giảm dần theo paper count.
- [ ] Khi đang tải → hiển thị Skeleton loading.
- [ ] Giao diện responsive: desktop 2 cột, mobile 1 cột.
- [ ] Trang load thành công ngay cả khi không đăng nhập (PUBLIC data).

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 6 (FE Dashboard) |
| **Epic** | EPIC-5: Dashboard & Visualization |
| **Sprint** | Sprint 3-4 |
| **Priority** | 🔴 Highest |
| **Story Points** | 5 |

---

## JP-36: Frontend - Trend Line Chart Component

### Summary
`[JP-36] Thiết kế Line Chart component hiển thị xu hướng keyword theo thời gian`

### Description
**User Story:**
Là một **Researcher**, tôi muốn **xem biểu đồ đường (line chart) thể hiện số lượng bài báo của một keyword theo từng năm** và **có thể so sánh nhiều keywords trên cùng một biểu đồ** để **phát hiện xu hướng tăng/giảm của các chủ đề nghiên cứu**.

**Technical Details:**
- Tạo `src/components/Charts/TrendLineChart.jsx`.
- Sử dụng **Recharts** library:
  ```jsx
  <LineChart data={data}>
    <XAxis dataKey="year" />
    <YAxis />
    <CartesianGrid strokeDasharray="3 3" />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="paperCount" stroke="#8884d8" />
  </LineChart>
  ```
- Props:
  - `data`: Array of `{ year, paperCount }` hoặc multi-series data.
  - `keywords`: Array of keyword strings (cho compare mode).
  - `loading`: boolean.
- Features:
  - Single keyword mode: 1 đường line.
  - Compare mode: nhiều đường line với màu sắc khác nhau + legend.
  - Tooltip hiển thị khi hover: "Năm 2024: 150 papers".
  - Responsive width (chiếm 100% container).
  - Animation khi data thay đổi.
- Gọi APIs:
  - Single: `GET /api/trends/keyword/{keyword}`
  - Compare: `GET /api/trends/compare?keywords=AI,blockchain`
- Tạo `src/api/trendApi.js`.

### Acceptance Criteria
- [ ] Chart hiển thị đúng dữ liệu: trục X là năm, trục Y là số papers.
- [ ] Compare mode: hiển thị nhiều đường line với legend phân biệt.
- [ ] Hover vào data point → hiển thị tooltip thông tin chi tiết.
- [ ] Chart responsive — resize khi cửa sổ thay đổi kích thước.
- [ ] Khi loading → hiển thị skeleton hoặc spinner thay cho chart.
- [ ] Khi không có dữ liệu → hiển thị empty state "Không có dữ liệu cho keyword này".

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 6 (FE Dashboard) |
| **Epic** | EPIC-5: Dashboard & Visualization |
| **Sprint** | Sprint 3-4 |
| **Priority** | 🔴 Highest |
| **Story Points** | 3 |

---

## JP-37: Frontend - Bar Chart & Pie Chart

### Summary
`[JP-37] Thiết kế Bar Chart (top journals) và Pie Chart (phân bố papers theo field)`

### Description
**User Story:**
Là một **User**, tôi muốn **xem biểu đồ cột thể hiện top journals theo số lượng papers** và **biểu đồ tròn thể hiện phân bố papers theo lĩnh vực** để **hiểu rõ bối cảnh xuất bản trong lĩnh vực nghiên cứu**.

**Technical Details:**
- Tạo `src/components/Charts/JournalBarChart.jsx`:
  - Recharts `BarChart` component.
  - Data: `[{ journalName, paperCount }]` từ API `/dashboard/top-journals`.
  - Trục X: tên journal (có thể cắt ngắn nếu dài).
  - Trục Y: số lượng papers.
  - Bars có gradient màu.
  - Tooltip khi hover.
- Tạo `src/components/Charts/FieldPieChart.jsx`:
  - Recharts `PieChart` component.
  - Data: `[{ field, paperCount }]` (aggregate papers by journal.field).
  - Mỗi slice một màu khác nhau.
  - Legend bên ngoài pie.
  - Label hiển thị phần trăm %.
- Cả 2 component đều nhận props: `data`, `loading`.
- Responsive và có animation.

### Acceptance Criteria
- [ ] Bar chart hiển thị đúng top journals sắp xếp theo paper count.
- [ ] Hover vào bar → tooltip hiển thị: "IEEE Transactions: 250 papers".
- [ ] Pie chart hiển thị phân bố theo field với phần trăm đúng.
- [ ] Cả 2 chart responsive.
- [ ] Loading state hiển thị khi đang tải dữ liệu.
- [ ] Màu sắc chart hài hòa, dễ phân biệt.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 6 (FE Dashboard) |
| **Epic** | EPIC-5: Dashboard & Visualization |
| **Sprint** | Sprint 4 |
| **Priority** | 🟠 High |
| **Story Points** | 3 |

---

## JP-38: Frontend - Trend Analysis Page

### Summary
`[JP-38] Thiết kế trang phân tích xu hướng nghiên cứu`

### Description
**User Story:**
Là một **Researcher**, tôi muốn **có một trang chuyên dụng để phân tích xu hướng** nơi **tôi có thể nhập keywords, chọn khoảng thời gian, và xem biểu đồ trend chi tiết** để **đưa ra quyết định về hướng nghiên cứu tiếp theo**.

**Technical Details:**
- Tạo file `src/pages/TrendAnalysis.jsx`.
- Route: `/trends`.
- Layout:
  - **Control Section** (phía trên):
    - Input: nhập keyword (có autocomplete gợi ý từ API `/keywords/top`).
    - Button "Thêm keyword" → thêm vào danh sách so sánh (tối đa 5 keywords).
    - Danh sách keywords đã chọn (dạng Tag, có nút X để xóa).
    - Year range picker: From Year → To Year.
    - Button "Phân tích" (Primary).
  - **Chart Section** (giữa):
    - Sử dụng `TrendLineChart` component (JP-36) ở chế độ compare.
    - Chiều cao tối thiểu 400px.
  - **Statistics Section** (phía dưới, dạng bảng):
    - Table: Keyword | Total Papers | This Year | Last Year | Growth Rate | Trend ↑↓
    - Sắp xếp theo growth rate.
  - **Trending Keywords Section** (sidebar hoặc phía dưới):
    - Danh sách top 20 trending keywords.
    - Click vào keyword → tự động thêm vào compare list.
- Ant Design: `AutoComplete`, `Tag`, `InputNumber`, `Table`, `Divider`.

### Acceptance Criteria
- [ ] Nhập keyword "machine learning" + nhấn "Phân tích" → Line chart hiển thị trend.
- [ ] Thêm nhiều keywords → chart hiển thị nhiều đường line so sánh.
- [ ] Xóa keyword khỏi danh sách → chart cập nhật lại.
- [ ] Thay đổi year range → chart cập nhật.
- [ ] Bảng statistics hiển thị đúng: total papers, growth rate, trend icon.
- [ ] Trending keywords hiển thị và click được → thêm vào compare.
- [ ] Giới hạn tối đa 5 keywords compare.
- [ ] Responsive layout.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 6 (FE Dashboard) |
| **Epic** | EPIC-5: Dashboard & Visualization |
| **Sprint** | Sprint 4-5 |
| **Priority** | 🟠 High |
| **Story Points** | 5 |

---

## JP-39: Frontend - Word Cloud

### Summary
`[JP-39] Thiết kế Word Cloud component hiển thị hot keywords`

### Description
**User Story:**
Là một **User**, tôi muốn **xem một word cloud trực quan thể hiện các keywords phổ biến nhất** với **kích thước chữ tỉ lệ với mức độ phổ biến** để **nhanh chóng nhận biết chủ đề nào đang hot**.

**Technical Details:**
- Tạo `src/components/Charts/WordCloud.jsx`.
- Sử dụng thư viện `react-wordcloud` hoặc tự build bằng CSS (flexbox + random font-size).
- Data input: `[{ text: "machine learning", value: 250 }, ...]` từ API `GET /api/keywords/top?limit=50`.
- Features:
  - Font size tỉ lệ thuận với `usageCount` (min 14px, max 60px).
  - Màu sắc random từ color palette đẹp.
  - Click vào keyword → navigate đến Search page với keyword đó.
  - Hover → hiển thị tooltip: "machine learning: 250 papers".
  - Animation nhẹ khi load.
- Sử dụng trên Dashboard page và Trend Analysis page.

### Acceptance Criteria
- [ ] Word cloud hiển thị ít nhất 30 keywords.
- [ ] Keywords phổ biến hơn → chữ to hơn.
- [ ] Click vào keyword → navigate đến search page.
- [ ] Hover → tooltip hiển thị tên keyword + số papers.
- [ ] Không bị tràn container.
- [ ] Responsive trên các kích thước màn hình.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 6 (FE Dashboard) |
| **Epic** | EPIC-5: Dashboard & Visualization |
| **Sprint** | Sprint 5 |
| **Priority** | 🟡 Medium |
| **Story Points** | 2 |

---

## JP-40: Frontend - Topic Explorer

### Summary
`[JP-40] Thiết kế trang khám phá Research Topics`

### Description
**User Story:**
Là một **User**, tôi muốn **xem danh sách các chủ đề nghiên cứu (Research Topics)** với **thông tin tóm tắt, keywords liên quan, và trạng thái trending** để **tôi khám phá các lĩnh vực nghiên cứu mới**.

**Technical Details:**
- Tạo `src/pages/TopicExplorer.jsx`.
- Route: `/topics`.
- Layout:
  - **Grid dạng Card** (3 cột desktop, 2 tablet, 1 mobile):
    - Mỗi card hiển thị:
      - Tên topic (tiêu đề lớn)
      - Badge "🔥 Trending" nếu `isTrending = true`
      - Mô tả (2 dòng, cắt ellipsis)
      - Keywords dạng Tag (hiển thị tối đa 5)
      - Nút "Xem chi tiết" → navigate `/topics/{id}`
      - Nút "Follow" (toggle)
  - **Topic Detail** (khi click Xem chi tiết):
    - Có thể là trang riêng `/topics/{id}` hoặc modal.
    - Hiển thị: mô tả đầy đủ, tất cả keywords, trend chart, danh sách papers liên quan.
  - **Filter**: search by topic name, filter by trending only.
- Gọi APIs: `GET /api/topics`, `GET /api/topics/{id}`.
- Ant Design: `Card`, `Badge`, `Tag`, `Input.Search`, `Switch`.

### Acceptance Criteria
- [ ] Trang hiển thị danh sách topics dạng card grid.
- [ ] Topics có `isTrending = true` → hiển thị badge "Trending".
- [ ] Click "Xem chi tiết" → hiển thị đầy đủ thông tin topic + keywords + trend.
- [ ] Filter "Trending only" → chỉ hiển thị topics đang trending.
- [ ] Search bằng tên → filter danh sách.
- [ ] Responsive grid: 3 → 2 → 1 cột.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 6 (FE Dashboard) |
| **Epic** | EPIC-5: Dashboard & Visualization |
| **Sprint** | Sprint 5 |
| **Priority** | 🟡 Medium |
| **Story Points** | 3 |

---
---

# 🔔 EPIC-6: Notification, Bookmark & Follow

---

## JP-41: Bookmark API

### Summary
`[JP-41] Thiết kế API Bookmark để lưu/xóa/liệt kê bài báo yêu thích`

### Description
**User Story:**
Là một **User đã đăng nhập**, tôi muốn **bookmark (lưu lại) các bài báo quan tâm** để **tôi dễ dàng tìm lại sau mà không cần tìm kiếm lại từ đầu**.

**Technical Details:**
- Tạo `Bookmark.java` Entity (nếu chưa có).
- Tạo `BookmarkService.java` + Impl:
  - `addBookmark(String username, Long paperId)` → `BookmarkResponse`
  - `removeBookmark(String username, Long paperId)` → void
  - `getMyBookmarks(String username, Pageable pageable)` → `Page<PaperSummaryResponse>`
  - `isBookmarked(String username, Long paperId)` → boolean
- `BookmarkRepository.java`:
  - `Optional<Bookmark> findByUserIdAndPaperId(Long userId, Long paperId);`
  - `Page<Bookmark> findByUserId(Long userId, Pageable pageable);`
  - `boolean existsByUserIdAndPaperId(Long userId, Long paperId);`
- Tạo `BookmarkController.java`:
  - `POST /api/bookmarks` (AUTH) → body: `{ "paperId": 1 }` → lưu bookmark.
  - `DELETE /api/bookmarks/{paperId}` (AUTH) → xóa bookmark.
  - `GET /api/bookmarks/me` (AUTH) → danh sách papers đã bookmark, phân trang.
- Unique constraint: mỗi user chỉ bookmark 1 paper 1 lần.

### Acceptance Criteria
- [ ] POST `/api/bookmarks` với paperId hợp lệ → HTTP 201, bookmark tạo thành công.
- [ ] POST `/api/bookmarks` với paperId đã bookmark → HTTP 409, message: "Paper already bookmarked".
- [ ] DELETE `/api/bookmarks/1` → HTTP 200, bookmark bị xóa.
- [ ] GET `/api/bookmarks/me` → danh sách papers user đã bookmark (phân trang).
- [ ] API yêu cầu JWT token. Không có token → HTTP 401.
- [ ] User A không thể xem bookmarks của User B.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 3 (BE Paper) |
| **Epic** | EPIC-6: Notification, Bookmark & Follow |
| **Sprint** | Sprint 4 |
| **Priority** | 🟠 High |
| **Story Points** | 3 |

---

## JP-42: Follow API

### Summary
`[JP-42] Thiết kế API Follow/Unfollow Journals, Topics và Keywords`

### Description
**User Story:**
Là một **User đã đăng nhập**, tôi muốn **theo dõi (follow) các journals, topics, hoặc keywords quan tâm** để **nhận thông báo khi có bài báo mới được công bố liên quan đến những gì tôi theo dõi**.

**Technical Details:**
- Tạo `Follow.java` Entity (nếu chưa có):
  - Fields: id, userId, followType (Enum: JOURNAL, TOPIC, KEYWORD), targetId, createdAt.
  - `followType + targetId` cho phép follow linh hoạt (polymorphic).
- Tạo `FollowService.java` + Impl:
  - `follow(String username, FollowRequest request)` → `FollowResponse`
  - `unfollow(String username, Long followId)` → void
  - `getMyFollows(String username, FollowType type)` → `List<FollowResponse>`
  - `isFollowing(String username, FollowType type, Long targetId)` → boolean
- `FollowRequest.java`: `{ "followType": "JOURNAL", "targetId": 1 }`
- `FollowResponse.java`:
  ```java
  {
    "id": 1,
    "followType": "JOURNAL",
    "targetId": 1,
    "targetName": "IEEE Transactions on Neural Networks",
    "createdAt": "2026-05-20T10:00:00"
  }
  ```
- Tạo `FollowController.java`:
  - `POST /api/follows` (AUTH) → follow.
  - `DELETE /api/follows/{id}` (AUTH) → unfollow.
  - `GET /api/follows/me` (AUTH) → danh sách follows.
    - Query param: `type` (JOURNAL / TOPIC / KEYWORD / all).
- Unique constraint: user chỉ follow 1 target 1 lần (combo userId + followType + targetId).

### Acceptance Criteria
- [ ] POST `/api/follows` với `{ type: "JOURNAL", targetId: 1 }` → follow thành công.
- [ ] POST `/api/follows` trùng → HTTP 409.
- [ ] DELETE `/api/follows/1` → unfollow thành công.
- [ ] GET `/api/follows/me?type=JOURNAL` → chỉ trả về journals đang follow.
- [ ] GET `/api/follows/me` (không có type) → trả về tất cả follows.
- [ ] `targetName` được resolve đúng (query tên journal/topic/keyword theo targetId).
- [ ] API yêu cầu JWT.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 2 (BE Auth) |
| **Epic** | EPIC-6: Notification, Bookmark & Follow |
| **Sprint** | Sprint 3 |
| **Priority** | 🟠 High |
| **Story Points** | 3 |

---

## JP-43: Notification Service & API

### Summary
`[JP-43] Thiết kế Notification Service để gửi thông báo khi có bài báo mới`

### Description
**User Story:**
Là một **User đã follow journals/topics/keywords**, tôi muốn **nhận thông báo khi có bài báo mới liên quan đến những gì tôi đang theo dõi** để **tôi không bỏ lỡ các nghiên cứu quan trọng**.

**Technical Details:**
- Tạo `NotificationService.java` + Impl:
  - `notifyFollowers(List<ResearchPaper> newPapers)`:
    - Với mỗi paper mới → lấy keywords + journalId.
    - Query `Follow` table: tìm users đang follow các keywords/journal đó.
    - Tạo `Notification` cho mỗi user tìm được.
    - Title: "Bài báo mới về [keyword]" hoặc "Bài báo mới trên [journal]".
    - Message: "[Paper title] - [Authors] ([Year])".
  - `getNotifications(String username, Pageable pageable)` → `Page<NotificationResponse>`
  - `markAsRead(String username, Long notificationId)` → void
  - `markAllAsRead(String username)` → void
  - `getUnreadCount(String username)` → long
- `NotificationResponse.java`:
  ```java
  {
    "id": 1,
    "title": "Bài báo mới về machine learning",
    "message": "Deep Learning for NLP: A Survey - John Smith (2026)",
    "isRead": false,
    "createdAt": "2026-05-20T10:00:00"
  }
  ```
- Tạo `NotificationController.java`:
  - `GET /api/notifications` (AUTH) → phân trang.
  - `GET /api/notifications/unread-count` (AUTH) → số thông báo chưa đọc.
  - `PUT /api/notifications/{id}/read` (AUTH) → đánh dấu đã đọc.
  - `PUT /api/notifications/read-all` (AUTH) → đánh dấu tất cả đã đọc.
- Logic `notifyFollowers()` được gọi từ `DataSyncScheduler` sau mỗi lần sync thành công.

### Acceptance Criteria
- [ ] Sau khi sync data → users đang follow keywords/journals liên quan nhận được notification mới.
- [ ] GET `/api/notifications` → danh sách notifications phân trang, mới nhất lên trước.
- [ ] GET `/api/notifications/unread-count` → trả về số chính xác.
- [ ] PUT `/api/notifications/1/read` → `isRead` chuyển thành `true`.
- [ ] PUT `/api/notifications/read-all` → tất cả notifications chuyển thành read.
- [ ] User A không thấy notifications của User B.
- [ ] Notification không bị tạo trùng (cùng user + cùng paper → chỉ 1 notification).

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 2 (BE Auth) |
| **Epic** | EPIC-6: Notification, Bookmark & Follow |
| **Sprint** | Sprint 4 |
| **Priority** | 🟠 High |
| **Story Points** | 5 |

---

## JP-44: Frontend - Bookmarks Page

### Summary
`[JP-44] Thiết kế giao diện trang Bookmarks`

### Description
**User Story:**
Là một **User đã đăng nhập**, tôi muốn **xem danh sách tất cả bài báo đã bookmark** và **có thể bỏ bookmark** để **quản lý bộ sưu tập bài báo cá nhân của mình**.

**Technical Details:**
- Tạo file `src/pages/Bookmarks.jsx`.
- Route: `/bookmarks` (Protected Route — yêu cầu đăng nhập).
- Layout:
  - Tiêu đề: "📌 Bài báo đã lưu" + tổng số bookmarks.
  - Danh sách papers dạng Card/List (tái sử dụng PaperCard component từ Search page).
  - Mỗi item: title, authors, journal, year, keywords tags, nút "Bỏ lưu" (icon bookmark filled).
  - Click nút "Bỏ lưu" → confirm dialog → xóa bookmark → cập nhật danh sách.
  - Pagination phía dưới.
  - Empty state khi chưa bookmark gì: "Bạn chưa lưu bài báo nào. Hãy tìm kiếm và lưu bài báo quan tâm!"
- Gọi APIs: `GET /api/bookmarks/me`, `DELETE /api/bookmarks/{paperId}`.
- Tạo `src/api/bookmarkApi.js`.

### Acceptance Criteria
- [ ] Trang hiển thị danh sách papers đã bookmark.
- [ ] Nhấn "Bỏ lưu" → confirm → bookmark bị xóa → paper biến mất khỏi danh sách.
- [ ] Pagination hoạt động đúng.
- [ ] Khi chưa bookmark paper nào → hiện empty state.
- [ ] Truy cập khi chưa đăng nhập → redirect về Login.
- [ ] Click vào title paper → navigate đến paper detail.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 5 (FE Core) |
| **Epic** | EPIC-6: Notification, Bookmark & Follow |
| **Sprint** | Sprint 5 |
| **Priority** | 🟡 Medium |
| **Story Points** | 2 |

---

## JP-45: Frontend - Notifications Page/Popup

### Summary
`[JP-45] Thiết kế giao diện Notifications (bell icon + dropdown + trang)`

### Description
**User Story:**
Là một **User đã đăng nhập**, tôi muốn **thấy icon chuông thông báo trên header** với **badge đếm số thông báo chưa đọc** và **có thể xem danh sách thông báo chi tiết** để **tôi không bỏ lỡ bài báo mới liên quan**.

**Technical Details:**
- **Component 1 — NotificationBell** (`src/components/NotificationBell.jsx`):
  - Icon chuông (Ant Design `BellOutlined`) trên Header.
  - Badge hiển thị số thông báo chưa đọc (từ API `/notifications/unread-count`).
  - Click → mở Dropdown hiển thị 5 notifications gần nhất.
  - Link "Xem tất cả" → navigate `/notifications`.
  - Poll unread count mỗi 60 giây (setInterval) hoặc khi user quay lại tab.
- **Component 2 — NotificationsPage** (`src/pages/Notifications.jsx`):
  - Route: `/notifications`.
  - Danh sách notifications đầy đủ, phân trang.
  - Mỗi notification: icon (đọc/chưa đọc), title, message, thời gian (relative: "2 giờ trước").
  - Chưa đọc → background highlight nhẹ.
  - Click vào notification → đánh dấu đã đọc.
  - Button "Đánh dấu tất cả đã đọc" ở trên.
- Gọi APIs: `GET /api/notifications`, `GET /api/notifications/unread-count`, `PUT /api/notifications/{id}/read`, `PUT /api/notifications/read-all`.

### Acceptance Criteria
- [ ] Bell icon hiển thị trên Header khi đã đăng nhập.
- [ ] Badge đếm đúng số notification chưa đọc.
- [ ] Click bell → dropdown hiển thị 5 notifications gần nhất.
- [ ] Trang `/notifications` hiển thị đầy đủ danh sách, phân trang.
- [ ] Notification chưa đọc có background khác biệt.
- [ ] Click notification → mark as read → background thay đổi.
- [ ] "Đánh dấu tất cả đã đọc" → tất cả chuyển thành đã đọc, badge = 0.
- [ ] Thời gian hiển thị relative ("5 phút trước", "1 ngày trước").

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 5 (FE Core) |
| **Epic** | EPIC-6: Notification, Bookmark & Follow |
| **Sprint** | Sprint 5 |
| **Priority** | 🟡 Medium |
| **Story Points** | 3 |

---

## JP-46: Frontend - Following Page

### Summary
`[JP-46] Thiết kế giao diện trang quản lý Following (Journals/Topics/Keywords đang theo dõi)`

### Description
**User Story:**
Là một **User đã đăng nhập**, tôi muốn **xem danh sách tất cả journals, topics, và keywords tôi đang follow** và **có thể unfollow** để **quản lý nguồn thông báo của mình**.

**Technical Details:**
- Tạo file `src/pages/Following.jsx`.
- Route: `/following`.
- Layout:
  - **Tabs** (Ant Design `Tabs`): 3 tab — Journals | Topics | Keywords.
  - Mỗi tab hiển thị danh sách items đang follow:
    - Journal tab: Tên journal, publisher, field, paper count, nút "Unfollow".
    - Topic tab: Tên topic, badge trending, nút "Unfollow".
    - Keyword tab: Tên keyword, usage count, nút "Unfollow".
  - Nhấn "Unfollow" → confirm dialog → xóa follow → cập nhật list.
  - Empty state cho mỗi tab: "Bạn chưa theo dõi journal nào".
- Gọi APIs: `GET /api/follows/me?type=JOURNAL`, `DELETE /api/follows/{id}`.
- Tạo `src/api/followApi.js`.

### Acceptance Criteria
- [ ] 3 tabs hiển thị đúng theo loại: Journals, Topics, Keywords.
- [ ] Mỗi tab hiển thị danh sách items đang follow.
- [ ] Nhấn "Unfollow" → confirm → item biến mất khỏi danh sách.
- [ ] Chuyển tab → load dữ liệu tương ứng.
- [ ] Empty state khi chưa follow gì trong tab.
- [ ] Protected route — redirect login nếu chưa đăng nhập.

### Setup
| Field | Value |
|-------|-------|
| **Assignee** | Thành viên 6 (FE Dashboard) |
| **Epic** | EPIC-6: Notification, Bookmark & Follow |
| **Sprint** | Sprint 5 |
| **Priority** | 🟡 Medium |
| **Story Points** | 2 |
