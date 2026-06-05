# 📊 Sơ đồ Hoạt động: TrendAnalysisServiceImpl

> Tài liệu mô tả chi tiết luồng hoạt động của từng phương thức trong [TrendAnalysisServiceImpl.java](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/service/impl/TrendAnalysisServiceImpl.java) và vai trò của nó trong luồng chính của hệ thống.

---

## 1. Vị trí của TrendAnalysisService trong Kiến trúc Tổng thể

`TrendAnalysisServiceImpl` là **bộ não phân tích xu hướng** của toàn bộ hệ thống. Nó nằm ở tầng Service (Business Logic Layer), kết nối giữa tầng Controller (nhận request từ người dùng) và tầng Repository (truy vấn database).

```mermaid
graph TD
    subgraph Frontend ["🖥️ Frontend (React)"]
        FE_Chart["Biểu đồ Line/Bar Chart"]
        FE_Dashboard["Dashboard Trending Topics"]
    end

    subgraph Controller ["🌐 Tầng Controller"]
        TC["TrendController"]
    end

    subgraph Service ["⚙️ Tầng Service - BỘ NÃO PHÂN TÍCH"]
        TAS["TrendAnalysisServiceImpl"]
        DSS["DataSyncServiceImpl"]
    end

    subgraph Repository ["📦 Tầng Repository"]
        PR["PaperRepository"]
        PTR["PublicationTrendRepository"]
        RTR["ResearchTopicRepository"]
    end

    subgraph Database ["🗄️ MySQL Database"]
        DB_Papers["research_papers + paper_keywords"]
        DB_Trends["publication_trends"]
        DB_Topics["research_topics + topic_keywords"]
    end

    FE_Chart -->|"GET /api/trends/keyword"| TC
    FE_Dashboard -->|"GET /api/trends/topics/trending"| TC

    TC -->|"gọi hàm"| TAS
    DSS -->|"sau khi sync xong, gọi recalculateTrends()"| TAS

    TAS -->|"đọc dữ liệu thô"| PR
    TAS -->|"đọc/ghi dữ liệu xu hướng"| PTR
    TAS -->|"cập nhật cờ trending"| RTR

    PR -->|"query"| DB_Papers
    PTR -->|"query"| DB_Trends
    RTR -->|"query"| DB_Topics

    style TAS fill:#ff9,stroke:#333,stroke-width:3px
    style DSS fill:#bfb,stroke:#333,stroke-width:1px
```

> [!IMPORTANT]
> `TrendAnalysisServiceImpl` phục vụ **2 luồng hoạt động hoàn toàn khác nhau**:
> - **Luồng WRITE (Ghi)**: Được gọi bởi `DataSyncService` sau khi đồng bộ dữ liệu → chạy `recalculateTrends()` để tính toán và lưu xu hướng.
> - **Luồng READ (Đọc)**: Được gọi bởi `TrendController` khi người dùng xem biểu đồ → chạy `getTrendByKeyword()`, `compareTrends()`, `getTopTrendingTopics()`.

---

## 2. Luồng End-to-End: Từ Thu thập Dữ liệu đến Hiển thị Biểu đồ

```mermaid
sequenceDiagram
    autonumber
    participant API as API Bên ngoài<br>(OpenAlex, Crossref)
    participant Sync as DataSyncServiceImpl
    participant Trend as TrendAnalysisServiceImpl
    participant DB as MySQL Database
    participant Ctrl as TrendController
    participant FE as React Frontend

    Note over API, FE: ===== LUỒNG 1: GHI DỮ LIỆU (Background Job) =====

    API->>Sync: Trả về danh sách bài báo mới
    Sync->>DB: Lưu bài báo vào research_papers, paper_keywords, authors, keywords
    Sync->>Trend: recalculateTrends()
    Trend->>DB: DELETE tất cả dòng cũ trong publication_trends
    Trend->>DB: SELECT GROUP BY keyword, year → đếm số bài theo từ khóa và năm
    DB-->>Trend: List<KeywordYearCount> (dữ liệu thô)
    Trend->>Trend: Tính Growth Rate cho từng keyword theo năm
    Trend->>DB: INSERT hàng loạt PublicationTrend mới
    Trend->>DB: UPDATE research_topics SET is_trending = false (reset)
    Trend->>DB: UPDATE research_topics SET is_trending = true (nếu growth > 50%)

    Note over API, FE: ===== LUỒNG 2: ĐỌC DỮ LIỆU (User Request) =====

    FE->>Ctrl: GET /api/trends/keyword?keyword=AI&yearFrom=2020&yearTo=2025
    Ctrl->>Trend: getTrendByKeyword("AI", 2020, 2025)
    Trend->>DB: SELECT year, COUNT(*) FROM research_papers JOIN keywords WHERE...
    DB-->>Trend: List<TrendDataPoint>
    Trend-->>Ctrl: Trả về danh sách điểm dữ liệu
    Ctrl-->>FE: JSON Response → Vẽ biểu đồ Line Chart
```

---

## 3. Sơ đồ Hoạt động Chi tiết Từng Phương thức

### 3.1. `getTrendByKeyword(keyword, yearFrom, yearTo)`

> **Tác dụng**: Trả về số lượng bài báo của một từ khóa cụ thể qua từng năm trong khoảng thời gian chỉ định. Dùng để vẽ **biểu đồ đường (Line Chart)** trên Dashboard.

```mermaid
flowchart TD
    A["🟢 Bắt đầu: getTrendByKeyword(keyword, yearFrom, yearTo)"] --> B["Gọi paperRepository.getTrendByKeyword()"]
    B --> C["JPQL Query chạy trên Database:<br>SELECT year, COUNT(p) FROM ResearchPaper p<br>JOIN p.keywords k<br>WHERE k.name = keyword<br>AND year BETWEEN yearFrom AND yearTo<br>GROUP BY year ORDER BY year"]
    C --> D["Database trả về List danh sách kết quả"]
    D --> E{"Danh sách có rỗng không?"}
    E -->|"Rỗng (keyword không tồn tại)"| F["Trả về List rỗng []"]
    E -->|"Có dữ liệu"| G["Trả về List<TrendDataPoint><br>VD: [{2020, 50}, {2021, 75}, {2022, 120}]"]

    F --> H["🔴 Kết thúc"]
    G --> H

    style A fill:#2ecc71,color:#fff
    style H fill:#e74c3c,color:#fff
```

> **Ví dụ đầu vào/đầu ra:**
> - Input: `getTrendByKeyword("machine learning", 2020, 2025)`
> - Output: `[{2020, 45}, {2021, 67}, {2022, 89}, {2023, 112}, {2024, 150}, {2025, 198}]`

---

### 3.2. `compareTrends(keywords, yearFrom, yearTo)`

> **Tác dụng**: So sánh xu hướng của nhiều từ khóa cùng lúc. Dùng để vẽ **biểu đồ đường nhiều series (Multi-series Line Chart)**, mỗi từ khóa là một đường riêng.

```mermaid
flowchart TD
    A["🟢 Bắt đầu: compareTrends(keywords, yearFrom, yearTo)"] --> B["Tạo List rỗng trendComparisons"]
    B --> C{"Duyệt từng keyword<br>trong danh sách keywords"}
    C -->|"Lấy keyword tiếp theo"| D["Gọi getTrendByKeyword(keyword, yearFrom, yearTo)<br>→ tái sử dụng hàm ở mục 3.1"]
    D --> E["Tạo TrendComparison:<br>{ keyword: tên, dataPoints: kết quả }"]
    E --> F["Thêm vào trendComparisons"]
    F --> C
    C -->|"Đã duyệt hết"| G["Trả về List<TrendComparison>"]
    G --> H["🔴 Kết thúc"]

    style A fill:#2ecc71,color:#fff
    style H fill:#e74c3c,color:#fff
```

> **Ví dụ đầu vào/đầu ra:**
> - Input: `compareTrends(["AI", "blockchain"], 2022, 2025)`
> - Output:
>   ```
>   [
>     { keyword: "AI",         dataPoints: [{2022, 100}, {2023, 130}, {2024, 160}, {2025, 200}] },
>     { keyword: "blockchain", dataPoints: [{2022, 80},  {2023, 60},  {2024, 45},  {2025, 30}] }
>   ]
>   ```

---

### 3.3. `getTopTrendingTopics(limit)`

> **Tác dụng**: Trả về danh sách N từ khóa có tốc độ tăng trưởng cao nhất. Dùng để hiển thị **bảng xếp hạng Trending Keywords** hoặc **biểu đồ cột (Bar Chart)** trên Dashboard.

```mermaid
flowchart TD
    A["🟢 Bắt đầu: getTopTrendingTopics(limit)"] --> B["Gọi publicationTrendRepository.findMaxYear()"]
    B --> C{"maxYear có tồn tại?<br>(Bảng publication_trends có dữ liệu không?)"}
    C -->|"maxYear == null<br>(Bảng rỗng / chưa chạy recalculate)"| D["Trả về List rỗng []"]
    C -->|"maxYear = 2025"| E["Gọi publicationTrendRepository.findTopTrending(2025, PageRequest(0, limit))"]
    E --> F["JPQL chạy trên Database:<br>1. Lọc bảng publication_trends ở năm 2025<br>2. LEFT JOIN với chính nó ở năm 2024<br>3. Sắp xếp theo growthRate giảm dần<br>4. Lấy N dòng đầu tiên"]
    F --> G["Trả về List<TrendingTopic><br>VD: [{Quantum Computing, 30, 0, 100%},<br>{AI, 150, 100, 50%}]"]

    D --> H["🔴 Kết thúc"]
    G --> H

    style A fill:#2ecc71,color:#fff
    style H fill:#e74c3c,color:#fff
    style C fill:#f39c12,color:#fff
```

---

### 3.4. `recalculateTrends()` — Phương thức QUAN TRỌNG NHẤT

> **Tác dụng**: Tính toán lại TOÀN BỘ dữ liệu xu hướng và lưu vào bảng cache `publication_trends`. Đây là phương thức **"máy bơm dữ liệu"** — không có nó, 3 phương thức đọc ở trên sẽ không có dữ liệu để trả về.

```mermaid
flowchart TD
    A["🟢 Bắt đầu: recalculateTrends()"] --> B["<b>Bước 1:</b> Xóa toàn bộ dữ liệu cũ<br>publicationTrendRepository.deleteAllInBatch()"]

    B --> C["<b>Bước 2:</b> Lấy dữ liệu đếm thô<br>paperRepository.getKeywordCountsGroupByYear()"]
    C --> C_Note["Database trả về List dạng phẳng:<br>(keywordId=101, year=2024, count=100)<br>(keywordId=101, year=2025, count=150)<br>(keywordId=102, year=2025, count=60)<br>..."]

    C_Note --> D["<b>Bước 3:</b> Gom nhóm vào Map lồng nhau<br>Map< KeywordId, Map< Năm, Số_bài > >"]
    D --> D_Note["Kết quả Map:<br>101 → {2024: 100, 2025: 150}<br>102 → {2025: 60}<br>103 → {2024: 15, 2025: 30}"]

    D_Note --> E["<b>Bước 4:</b> Lặp qua Map tính Growth Rate"]
    E --> F{"Duyệt từng keyword"}
    F -->|"Lấy keyword tiếp theo"| G{"Duyệt từng năm<br>của keyword đó"}
    G -->|"Lấy năm tiếp theo"| H["Lấy currentCount = map.get(year)<br>Lấy prevCount = map.get(year - 1)"]

    H --> I{"prevCount có tồn tại<br>và > 0 ?"}
    I -->|"prevCount == null hoặc 0"| J{"currentCount > 0 ?"}
    J -->|"Có"| K["growthRate = 100.0%<br>(Mới xuất hiện)"]
    J -->|"Không"| L["growthRate = 0.0%"]
    I -->|"prevCount > 0"| M["growthRate = (current - prev) / prev × 100"]

    K --> N["Tạo PublicationTrend<br>và thêm vào trendList"]
    L --> N
    M --> N
    N --> G
    G -->|"Hết năm"| F
    F -->|"Hết keyword"| O["<b>Bước 5:</b> Lưu hàng loạt<br>publicationTrendRepository.saveAll(trendList)"]

    O --> P["<b>Bước 6:</b> Tìm maxYear trong bảng vừa lưu"]
    P --> Q{"maxYear != null ?"}
    Q -->|"Có"| R["researchTopicRepository.resetAllTrendingTopics()<br>→ Đặt tất cả is_trending = false"]
    R --> S["researchTopicRepository.updateTrendingTopics(maxYear)<br>→ Đặt is_trending = true cho Topic có keyword tăng > 50%"]
    Q -->|"Không"| T["Bỏ qua bước cập nhật Topic"]

    S --> U["🔴 Kết thúc recalculateTrends()"]
    T --> U

    style A fill:#2ecc71,color:#fff
    style U fill:#e74c3c,color:#fff
    style I fill:#f39c12,color:#fff
    style Q fill:#f39c12,color:#fff
    style B fill:#3498db,color:#fff
    style C fill:#3498db,color:#fff
    style D fill:#3498db,color:#fff
    style E fill:#3498db,color:#fff
    style O fill:#3498db,color:#fff
    style R fill:#9b59b6,color:#fff
    style S fill:#9b59b6,color:#fff
```

---

## 4. Ví dụ Minh họa Cụ thể: recalculateTrends() với Dữ liệu Thật

### Dữ liệu đầu vào (từ bảng `research_papers` + `paper_keywords`):

| Bài báo | Năm | Từ khóa |
|:--------|:----|:--------|
| Paper A | 2024 | AI |
| Paper B | 2024 | AI |
| Paper C | 2025 | AI |
| Paper D | 2025 | AI |
| Paper E | 2025 | AI |
| Paper F | 2025 | Blockchain |

### Bước 2 — Kết quả `getKeywordCountsGroupByYear()`:

| keywordId | year | paperCount |
|:----------|:-----|:-----------|
| 101 (AI) | 2024 | 2 |
| 101 (AI) | 2025 | 3 |
| 102 (Blockchain) | 2025 | 1 |

### Bước 3 — Map lồng nhau:

```
101 (AI)         → {2024: 2, 2025: 3}
102 (Blockchain) → {2025: 1}
```

### Bước 4 — Tính Growth Rate:

| Keyword | Năm | currentCount | prevCount | Công thức | growthRate |
|:--------|:----|:-------------|:----------|:----------|:-----------|
| AI | 2024 | 2 | null (2023 không tồn tại) | Mới xuất hiện → 100% | **100.00%** |
| AI | 2025 | 3 | 2 | (3-2)/2 × 100 | **50.00%** |
| Blockchain | 2025 | 1 | null (2024 không tồn tại) | Mới xuất hiện → 100% | **100.00%** |

### Bước 5 — Dữ liệu được lưu vào bảng `publication_trends`:

| id | keyword_id | year | paper_count | growth_rate |
|:---|:-----------|:-----|:------------|:------------|
| 1 | 101 | 2024 | 2 | 100.00 |
| 2 | 101 | 2025 | 3 | 50.00 |
| 3 | 102 | 2025 | 1 | 100.00 |

### Bước 6 — Cập nhật `research_topics`:
- `maxYear = 2025`
- Reset tất cả `is_trending = false`
- Tìm các Topic có keyword với `growth_rate > 50%` ở năm 2025:
  - AI (50%) → **Không đạt** (phải > 50%, không phải >=)
  - Blockchain (100%) → **Đạt** ✅
- Kết quả: Topic nào chứa từ khóa "Blockchain" sẽ được `is_trending = true`

---

## 5. Tóm tắt Vai trò của Từng Phương thức

| Phương thức | Loại | Ai gọi? | Tác dụng | Output |
|:-----------|:-----|:--------|:---------|:-------|
| `getTrendByKeyword()` | READ | TrendController | Lấy xu hướng 1 từ khóa qua các năm | `List<TrendDataPoint>` |
| `compareTrends()` | READ | TrendController | So sánh nhiều từ khóa cùng lúc | `List<TrendComparison>` |
| `getTopTrendingTopics()` | READ | TrendController | Lấy top N từ khóa hot nhất | `List<TrendingTopic>` |
| `recalculateTrends()` | WRITE | DataSyncService / Scheduler | **Máy bơm dữ liệu**: tính toán và lưu xu hướng | `void` |

> [!TIP]
> `recalculateTrends()` là **nền tảng** cho `getTopTrendingTopics()`. Nếu không chạy `recalculateTrends()`, bảng `publication_trends` sẽ rỗng → `getTopTrendingTopics()` luôn trả về danh sách rỗng.
> Ngược lại, `getTrendByKeyword()` và `compareTrends()` **không phụ thuộc** vào `recalculateTrends()` vì chúng truy vấn trực tiếp từ bảng dữ liệu thô `research_papers`.
