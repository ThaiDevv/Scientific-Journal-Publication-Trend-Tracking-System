# 🌐 Sơ đồ Hoạt động: OpenAlexClient

> Tài liệu mô tả chi tiết luồng hoạt động của [OpenAlexClient.java](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/external/OpenAlexClient.java) — **cầu nối duy nhất** giữa hệ thống và API bên ngoài OpenAlex.

---

## 1. Vị trí của OpenAlexClient trong Kiến trúc Tổng thể

`OpenAlexClient` nằm ở **rìa ngoài cùng** (boundary) của hệ thống, đóng vai trò như một **"người phiên dịch"** — nhận dữ liệu JSON thô từ OpenAlex API, chuyển đổi thành `RawPaperData` mà phần còn lại của hệ thống có thể hiểu được.

```mermaid
graph LR
    subgraph External ["☁️ Thế giới bên ngoài"]
        OA_API["OpenAlex API\n(api.openalex.org)"]
    end

    subgraph Boundary ["🔌 Tầng Client (Boundary)"]
        OAC["OpenAlexClient\n implements ExternalApiClient"]
    end

    subgraph Service ["⚙️ Tầng Service"]
        DSS["DataSyncServiceImpl"]
        TAS["TrendAnalysisServiceImpl"]
    end

    subgraph Repository ["📦 Tầng Repository"]
        PR["PaperRepository"]
        AR["AuthorRepository"]
        JR["JournalRepository"]
        KR["KeywordRepository"]
        PTR["PublicationTrendRepository"]
    end

    subgraph Database ["🗄️ MySQL"]
        DB["research_papers\nauthors, keywords\njournals, publication_trends"]
    end

    subgraph Frontend ["🖥️ React"]
        FE["Dashboard\nBiểu đồ xu hướng"]
    end

    OA_API -.->|"HTTP GET\nJSON Response"| OAC
    OAC -->|"List﹤RawPaperData﹥"| DSS
    DSS -->|"Lưu bài báo\nvào Database"| PR
    DSS -->|"Lưu tác giả"| AR
    DSS -->|"Lưu journal"| JR
    DSS -->|"Lưu từ khóa"| KR
    DSS -->|"recalculateTrends()"| TAS
    TAS -->|"Tính xu hướng"| PTR
    PR --> DB
    AR --> DB
    JR --> DB
    KR --> DB
    PTR --> DB
    DB -.->|"Dữ liệu xu hướng"| FE

    style OAC fill:#e74c3c,color:#fff,stroke-width:3px
    style DSS fill:#3498db,color:#fff
    style TAS fill:#f39c12,color:#fff
```

> [!IMPORTANT]
> **OpenAlexClient là mắt xích ĐẦU TIÊN** trong toàn bộ pipeline xử lý dữ liệu. Không có nó, hệ thống không có dữ liệu → `DataSyncService` không có gì để lưu → `TrendAnalysisService` không có gì để phân tích → Dashboard hiển thị trắng.

---

## 2. Luồng End-to-End: Từ OpenAlex API đến Dashboard

```mermaid
sequenceDiagram
    autonumber
    participant OA as ☁️ OpenAlex API
    participant Client as 🔌 OpenAlexClient
    participant Sync as ⚙️ DataSyncServiceImpl
    participant DB as 🗄️ MySQL Database
    participant Trend as 📊 TrendAnalysisServiceImpl
    participant FE as 🖥️ React Frontend

    Note over OA, FE: ===== LUỒNG CHÍNH: Thu thập → Lưu → Phân tích → Hiển thị =====

    rect rgb(255, 240, 240)
        Note over OA, Client: Giai đoạn 1: THU THẬP (OpenAlexClient)
        Sync->>Client: fetchPapers("machine learning", 1, 10)
        Client->>OA: GET /works?search=machine+learning&per_page=10&page=1
        OA-->>Client: JSON Response (kèm abstract_inverted_index)
        Client->>Client: Chuyển đổi JSON → RawPaperData<br/>+ convert abstract inverted index → plain text<br/>+ lọc bỏ paper thiếu thông tin
        Client-->>Sync: List﹤RawPaperData﹥ (10 papers)
    end

    rect rgb(240, 248, 255)
        Note over Sync, DB: Giai đoạn 2: LƯU TRỮ (DataSyncService)
        loop Với mỗi RawPaperData
            Sync->>Sync: isDuplicate() → Kiểm tra DOI/title trùng
            alt Không trùng
                Sync->>DB: Tìm/tạo Journal, Author, Keyword
                Sync->>DB: INSERT research_paper + liên kết
            else Trùng
                Sync->>Sync: Bỏ qua, tăng bộ đếm duplicates
            end
        end
    end

    rect rgb(255, 255, 240)
        Note over Trend, DB: Giai đoạn 3: PHÂN TÍCH (TrendAnalysisService)
        Sync->>Trend: recalculateTrends()
        Trend->>DB: Tính toán growth rate cho tất cả keywords
        Trend->>DB: Cập nhật is_trending cho ResearchTopics
    end

    rect rgb(240, 255, 240)
        Note over DB, FE: Giai đoạn 4: HIỂN THỊ
        FE->>DB: Lấy dữ liệu xu hướng qua API
        DB-->>FE: JSON → Vẽ biểu đồ trên Dashboard
    end
```

---

## 3. Cấu trúc bên trong OpenAlexClient

### 3.1. Interface và Implementation

```mermaid
classDiagram
    class ExternalApiClient {
        <<interface>>
        +getSourceName() String
        +fetchPapers(query, page, size) List~RawPaperData~
        +fetchRecentPapers(fromDate, page, size) List~RawPaperData~
        +isAvailable() boolean
    }

    class OpenAlexClient {
        -SOURCE_NAME = "OpenAlex"
        -COMPUTER_SCIENCE_CONCEPT_ID = "C41008148"
        -REQUEST_TIMEOUT = 10 giây
        -MAX_PAGE_ATTEMPTS = 5
        -webClient: WebClient
        -properties: OpenAlexProperties
        -objectMapper: ObjectMapper
        +fetchPapers(query, page, size)
        +fetchRecentPapers(fromDate, page, size)
        +getSourceName()
        +isAvailable()
        -executeWorksRequest(requestSpec, limit)
        -rateLimitRetry()
        -toRawPaperData(jsonNode)
        -convertAbstractInvertedIndex(jsonNode)
        -isCompletePaper(paper)
    }

    class DataSyncServiceImpl {
        -clientList: List~ExternalApiClient~
        +syncFromSource(sourceName, query)
        +syncRecentPapers(sourceName, fromDate)
        +syncAllSources(query)
    }

    ExternalApiClient <|.. OpenAlexClient
    DataSyncServiceImpl --> ExternalApiClient : sử dụng
```

> [!NOTE]
> `OpenAlexClient` implement interface `ExternalApiClient`. Nhờ đó, `DataSyncServiceImpl` không biết và **không cần biết** nó đang gọi OpenAlex hay Crossref — nó chỉ cần gọi `fetchPapers()` là đủ. Đây là nguyên tắc **Dependency Inversion** (chữ D trong SOLID).

---

## 4. Sơ đồ Hoạt động Chi tiết Từng Method

### 4.1. `fetchPapers(query, page, size)` — Tìm kiếm bài báo theo từ khóa

> **Tác dụng**: Gọi OpenAlex API để tìm bài báo theo từ khóa trong lĩnh vực Computer Science. Có cơ chế **phân trang tự động** nếu một trang không đủ dữ liệu.

```mermaid
flowchart TD
    A["🟢 Bắt đầu: fetchPapers(query, page, size)"] --> B["normalizeSize(size) → requestedSize\nnormalizePage(page) → startPage\nTạo List rỗng: papers"]
    B --> C{"Vòng lặp phân trang\npapers.size() ﹤ requestedSize\nVÀ currentPage ﹤ startPage + 5?"}

    C -->|"Còn cần lấy thêm"| D["Xây dựng URL:\nGET /works?search={query}\n&filter=concepts.id:C41008148\n&per_page={requestedSize}\n&page={currentPage}"]
    D --> E["Gọi executeWorksRequest()\n→ xem chi tiết ở mục 4.4"]
    E --> F{"batch trả về\ncó rỗng không?"}
    F -->|"Rỗng\n(hết dữ liệu trên API)"| G["break — thoát vòng lặp"]
    F -->|"Có papers"| H["papers.addAll(batch)\ncurrentPage++"]
    H --> C

    C -->|"Đã đủ hoặc hết trang"| I["Trả về papers"]
    G --> I
    I --> J["🔴 Kết thúc"]

    style A fill:#2ecc71,color:#fff
    style J fill:#e74c3c,color:#fff
    style C fill:#f39c12,color:#fff
```

> [!TIP]
> **`MAX_PAGE_ATTEMPTS = 5`** là cơ chế bảo vệ — nếu API luôn trả về papers nhưng không bao giờ đủ `requestedSize` (vì filter `isCompletePaper` loại bỏ quá nhiều), vòng lặp sẽ dừng lại sau 5 lần gọi API để tránh treo vô hạn.

---

### 4.2. `fetchRecentPapers(fromDate, page, size)` — Lấy bài báo gần đây

> **Tác dụng**: Giống `fetchPapers`, nhưng thay vì tìm theo từ khóa, nó lọc theo **ngày xuất bản** (`from_publication_date`). Dùng cho việc sync bài báo mới hàng ngày/tuần.

```mermaid
flowchart TD
    A["🟢 Bắt đầu: fetchRecentPapers(fromDate, page, size)"] --> B["Tạo filter string:\nfrom_publication_date:{fromDate},concepts.id:C41008148"]
    B --> C["Gọi lặp executeWorksRequest()\nvới URL:\nGET /works?filter={filter}&per_page={size}&page={page}"]
    C --> D["Logic phân trang giống hệt fetchPapers()\n→ xem mục 4.1"]
    D --> E["Trả về List﹤RawPaperData﹥"]
    E --> F["🔴 Kết thúc"]

    style A fill:#2ecc71,color:#fff
    style F fill:#e74c3c,color:#fff
```

**So sánh `fetchPapers` vs `fetchRecentPapers`:**

| Tiêu chí | `fetchPapers` | `fetchRecentPapers` |
|:---------|:-------------|:-------------------|
| Filter chính | `search={query}` | `from_publication_date:{fromDate}` |
| Filter phụ | `concepts.id:C41008148` | `concepts.id:C41008148` |
| Mục đích | Tìm bài theo chủ đề | Lấy bài mới nhất |
| Khi nào gọi | `syncFromSource()` | `syncRecentPapers()` |

---

### 4.3. `isAvailable()` — Health Check API

> **Tác dụng**: Kiểm tra xem OpenAlex API có đang hoạt động không. Được gọi bởi `DataSyncServiceImpl.syncAllSources()` trước khi bắt đầu sync từ một nguồn.

```mermaid
flowchart TD
    A["🟢 Bắt đầu: isAvailable()"] --> B["Gọi: GET /works?per_page=1\ntimeout: 10 giây\nretry: 1 lần nếu 429"]
    B --> C{"API phản hồi\nthành công?"}
    C -->|"✅ HTTP 200"| D["return true"]
    C -->|"❌ Exception\n(timeout, network, 5xx...)"| E["log.warn('OpenAlex health check failed')\nreturn false"]

    D --> F["🔴 Kết thúc"]
    E --> F

    style A fill:#2ecc71,color:#fff
    style F fill:#e74c3c,color:#fff
    style D fill:#27ae60,color:#fff
    style E fill:#e67e22,color:#fff
```

**Cách `isAvailable()` được dùng trong luồng chính:**

```java
// Trong DataSyncServiceImpl.syncAllSources()
for (ExternalApiClient client : clientList) {
    if (!client.isAvailable()) {           // ← Gọi isAvailable() ở đây
        log.warn("Nguồn '{}' không khả dụng, bỏ qua.", client.getSourceName());
        continue;                          // ← Bỏ qua nguồn bị lỗi
    }
    SyncResult r = syncFromSource(client.getSourceName(), query);
}
```

---

### 4.4. `executeWorksRequest()` — Trung tâm xử lý mọi HTTP request

> **Tác dụng**: Đây là **method TRUNG TÂM** — tất cả `fetchPapers`, `fetchRecentPapers`, `isAvailable` đều gọi đến nó. Nó chịu trách nhiệm: gửi HTTP request, xử lý lỗi, parse JSON, chuyển đổi sang `RawPaperData`.

```mermaid
flowchart TD
    A["🟢 Bắt đầu: executeWorksRequest(requestSpec, limit)"] --> B["Gửi HTTP GET request\ntimeout: 10 giây\nretry: 1 lần nếu gặp 429"]

    B --> C{"Phản hồi từ API?"}

    C -->|"✅ Thành công\nHTTP 200"| D["Parse JSON body\nobjectMapper.readTree(body)"]
    D --> E{"response có\ntrường 'results'?"}
    E -->|"Không"| F["return List rỗng []"]
    E -->|"Có"| G["Duyệt từng item trong results[]"]
    G --> H["toRawPaperData(item)\n→ Chuyển JSON → RawPaperData"]
    H --> I{"isCompletePaper(paper)?\nVÀ chưa đủ limit?"}
    I -->|"Đủ thông tin"| J["Thêm vào danh sách kết quả"]
    I -->|"Thiếu title/doi/year/\nauthors/keywords"| K["Bỏ qua paper này"]
    J --> G
    K --> G
    G -->|"Hết items"| L["return danh sách kết quả"]

    C -->|"❌ Timeout\n(TimeoutException)"| M["log.warn('OpenAlex request timed out')\nreturn List rỗng []"]
    C -->|"❌ Lỗi khác\n(network, 5xx...)"| N["log.warn('request failed: ...')\nreturn List rỗng []"]

    F --> O["🔴 Kết thúc"]
    L --> O
    M --> O
    N --> O

    style A fill:#2ecc71,color:#fff
    style O fill:#e74c3c,color:#fff
    style C fill:#f39c12,color:#fff
    style I fill:#f39c12,color:#fff
    style M fill:#e67e22,color:#fff
    style N fill:#e67e22,color:#fff
```

> [!WARNING]
> Method này **KHÔNG BAO GIỜ throw exception** ra ngoài. Mọi lỗi đều được catch và trả về `List.of()` (danh sách rỗng). Đây là thiết kế có chủ đích — vì nếu API lỗi mà throw exception, toàn bộ quá trình sync sẽ bị dừng lại thay vì tiếp tục với các trang tiếp theo.

---

### 4.5. `convertAbstractInvertedIndex()` — Giải mã Abstract

> **Tác dụng**: OpenAlex lưu abstract dưới dạng "inverted index" (đảo ngược) chứ không phải plain text. Method này chuyển đổi ngược lại.

```mermaid
flowchart TD
    A["🟢 Bắt đầu: convertAbstractInvertedIndex(invertedIndex)"] --> B{"invertedIndex\nlà null / empty?"}
    B -->|"Có"| C["return null"]
    B -->|"Không"| D["Tạo List﹤WordPosition﹥ rỗng"]
    D --> E["Duyệt từng cặp key-value\ntrong JSON object"]
    E --> F["key = từ (word)\nvalue = mảng vị trí [0, 3, 7...]"]
    F --> G["Với mỗi vị trí,\ntạo WordPosition(word, position)"]
    G --> E
    E -->|"Hết cặp"| H["Sắp xếp theo position tăng dần"]
    H --> I["Nối các từ lại thành câu\nString.join(' ', words)"]
    I --> J["return plain text"]

    C --> K["🔴 Kết thúc"]
    J --> K

    style A fill:#2ecc71,color:#fff
    style K fill:#e74c3c,color:#fff
```

**Ví dụ minh họa cụ thể:**

```
📥 Input (JSON từ OpenAlex):
{
  "Machine": [0],
  "learning": [1, 5],
  "is": [2],
  "a": [3],
  "branch": [4],
  "of": [6],
  "AI": [7]
}

🔄 Bước 1 — Tạo danh sách WordPosition:
(Machine, 0), (learning, 1), (is, 2), (a, 3), (branch, 4), (learning, 5), (of, 6), (AI, 7)

🔄 Bước 2 — Sắp xếp theo position:
(Machine, 0), (learning, 1), (is, 2), (a, 3), (branch, 4), (learning, 5), (of, 6), (AI, 7)

📤 Output (plain text):
"Machine learning is a branch learning of AI"
```

---

### 4.6. Cơ chế xử lý lỗi 3 tầng — `rateLimitRetry()`

> **Tác dụng**: Đây là bộ lọc lỗi tự động, xử lý 3 loại lỗi khác nhau với 3 chiến lược khác nhau.

```mermaid
flowchart TD
    A["📡 HTTP Request gửi đi"] --> B{"Kết quả?"}

    B -->|"✅ HTTP 200"| C["Xử lý bình thường\n→ parse JSON, trả RawPaperData"]

    B -->|"⚠️ HTTP 429\nRate Limit"| D["rateLimitRetry() kích hoạt"]
    D --> E["log.warn('Rate limit hit')\nĐợi 1 giây..."]
    E --> F["Gửi lại request lần 2"]
    F --> G{"Lần 2 thành công?"}
    G -->|"Có"| C
    G -->|"Không"| H["Trả về List rỗng []\n+ log warning"]

    B -->|"⏰ Timeout\n(> 10 giây)"| I["isTimeout() = true"]
    I --> J["log.warn('request timed out')\nreturn List rỗng []"]

    B -->|"💥 Lỗi khác\n(network, DNS, 5xx)"| K["log.warn('request failed')\nreturn List rỗng []"]

    style A fill:#3498db,color:#fff
    style C fill:#2ecc71,color:#fff
    style D fill:#f39c12,color:#fff
    style H fill:#e67e22,color:#fff
    style J fill:#e67e22,color:#fff
    style K fill:#e67e22,color:#fff
```

**Bảng tóm tắt cơ chế xử lý lỗi:**

| Loại lỗi | Nguyên nhân | Hành xử | Retry? | Exception? |
|:---------|:-----------|:--------|:-------|:-----------|
| **HTTP 429** | Gọi API quá nhiều | Đợi 1 giây → thử lại 1 lần | ✅ 1 lần | ❌ Không |
| **Timeout** | API phản hồi quá 10 giây | Trả về `[]` + log warning | ❌ Không | ❌ Không |
| **Network Error** | Mất mạng, DNS fail, 5xx | Trả về `[]` + log warning | ❌ Không | ❌ Không |

> [!IMPORTANT]
> Thiết kế **"fail gracefully"** (lỗi nhẹ nhàng) — không bao giờ throw exception ra ngoài. Điều này đảm bảo:
> - Nếu trang 3 timeout → hệ thống vẫn giữ được papers từ trang 1 & 2
> - Nếu OpenAlex sập → `syncAllSources()` vẫn tiếp tục sync từ các nguồn khác (Crossref, Semantic Scholar...)

---

## 5. Ví dụ Minh họa End-to-End

### Kịch bản: Admin gọi `syncFromSource("OpenAlex", "machine learning")`

**Bước 1 — `DataSyncServiceImpl.syncFromSource()` gọi `OpenAlexClient.fetchPapers()`:**

```
📡 Request: GET https://api.openalex.org/works
     ?search=machine+learning
     &filter=concepts.id:C41008148
     &per_page=10
     &page=1
```

**Bước 2 — OpenAlex API trả về JSON:**

```json
{
  "results": [
    {
      "doi": "https://doi.org/10.1000/ml-paper-01",
      "title": "Deep Learning for Natural Language Processing",
      "abstract_inverted_index": {
        "This": [0], "paper": [1], "explores": [2], "deep": [3], "learning": [4]
      },
      "publication_year": 2025,
      "primary_location": {
        "source": { "display_name": "Journal of AI Research" }
      },
      "authorships": [
        { "author": { "display_name": "Ada Lovelace" } },
        { "author": { "display_name": "Alan Turing" } }
      ],
      "concepts": [
        { "display_name": "Deep Learning" },
        { "display_name": "Natural Language Processing" },
        { "display_name": "Artificial Intelligence" }
      ]
    }
  ]
}
```

**Bước 3 — `OpenAlexClient` chuyển đổi thành `RawPaperData`:**

| Trường | Giá trị |
|:-------|:--------|
| `doi` | `https://doi.org/10.1000/ml-paper-01` |
| `title` | `Deep Learning for Natural Language Processing` |
| `abstractText` | `This paper explores deep learning` ← *đã convert từ inverted index* |
| `publicationYear` | `2025` |
| `journalName` | `Journal of AI Research` |
| `authorNames` | `["Ada Lovelace", "Alan Turing"]` |
| `keywords` | `["Deep Learning", "Natural Language Processing", "Artificial Intelligence"]` |

**Bước 4 — `isCompletePaper()` kiểm tra:**
- ✅ `title` có giá trị → OK
- ✅ `doi` có giá trị → OK
- ✅ `publicationYear` có giá trị → OK
- ✅ `authorNames` không rỗng → OK
- ✅ `keywords` không rỗng → OK
- **→ Paper này PASS, được thêm vào kết quả trả về**

**Bước 5 — `DataSyncServiceImpl` nhận và xử lý:**
- Kiểm tra DOI trùng → không trùng
- Tìm/tạo Journal "Journal of AI Research"
- Tìm/tạo Author "Ada Lovelace", "Alan Turing"
- Tìm/tạo Keyword "Deep Learning", "NLP", "AI"
- Lưu `ResearchPaper` vào database

---

## 6. Tóm tắt: Vai trò của OpenAlexClient trong Pipeline

```mermaid
graph LR
    A["☁️ OpenAlex API"] -->|"JSON thô"| B["🔌 OpenAlexClient\n(Phiên dịch + Bảo vệ lỗi)"]
    B -->|"List﹤RawPaperData﹥"| C["⚙️ DataSyncService\n(Lưu vào DB)"]
    C -->|"recalculateTrends()"| D["📊 TrendAnalysisService\n(Phân tích xu hướng)"]
    D -->|"Dữ liệu xu hướng"| E["🖥️ React Dashboard\n(Hiển thị biểu đồ)"]

    style B fill:#e74c3c,color:#fff,stroke-width:3px
```

| Method | Loại | Ai gọi? | Tác dụng | Output |
|:-------|:-----|:--------|:---------|:-------|
| `fetchPapers()` | READ API | `DataSyncService.syncFromSource()` | Tìm bài báo theo từ khóa | `List﹤RawPaperData﹥` |
| `fetchRecentPapers()` | READ API | `DataSyncService.syncRecentPapers()` | Lấy bài báo từ một ngày nhất định | `List﹤RawPaperData﹥` |
| `isAvailable()` | HEALTH CHECK | `DataSyncService.syncAllSources()` | Kiểm tra API có hoạt động không | `boolean` |
| `getSourceName()` | METADATA | `DataSyncService.findExternalApiClient()` | Trả về tên nguồn `"OpenAlex"` | `String` |

> [!TIP]
> **Mối liên hệ giữa 3 Service lớn trong hệ thống:**
>
> `OpenAlexClient` → **THU THẬP** dữ liệu thô từ API bên ngoài
>
> `DataSyncService` → **LƯU TRỮ** dữ liệu vào Database + orchestrate toàn bộ pipeline
>
> `TrendAnalysisService` → **PHÂN TÍCH** dữ liệu đã lưu và tính xu hướng
>
> Ba module này hoạt động tuần tự như một **dây chuyền nhà máy**: nguyên liệu thô (OpenAlex JSON) → chế biến (DataSync lưu DB) → thành phẩm (TrendAnalysis tính xu hướng) → giao hàng (Dashboard hiển thị).
