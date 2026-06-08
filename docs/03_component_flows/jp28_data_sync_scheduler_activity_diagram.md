# 📑 Tài liệu Kiến trúc & Luồng hoạt động: JP-28 Data Sync Scheduler

Tài liệu này giải thích chi tiết luồng hoạt động, kiến trúc, sơ đồ tuần tự và cơ sở dữ liệu của task **JP-28: Data Sync Scheduler** tự động đồng bộ dữ liệu bài báo khoa học định kỳ từ các External APIs.

---

## 1. Vị trí và Kiến trúc của JP-28 trong Hệ thống

Phân hệ **JP-28: Data Sync Scheduler** đóng vai trò là động cơ kích hoạt tự động (Automatic Trigger Engine) của phân hệ đồng bộ dữ liệu. Nó kéo dữ liệu bài báo mới về hệ thống định kỳ mà không cần admin kích hoạt thủ công.

```mermaid
%%{init: { 'flowchart': {'useMaxWidth': false} }}%%
graph TD
    subgraph Trigger [Kích Hoạt]
        A[Scheduler - 2:00 AM mỗi ngày]
    end

    subgraph DataAccess [Truy xuất dữ liệu]
        B[(api_data_sources Table)]
        A -->|1. Lấy nguồn active| B
    end

    subgraph SyncService [Data Sync Processing]
        C[DataSyncScheduler]
        D[DataSyncService]
        C -->|2. syncRecentPapers| D
    end

    subgraph Clients [API Clients]
        E[OpenAlexClient]
        F[CrossrefClient]
        G[SemanticScholarClient]
        D -->|3. Gọi Client tương ứng| E
        D -->|3. Gọi Client tương ứng| F
        D -->|3. Gọi Client tương ứng| G
    end

    subgraph TargetServices [Hệ thống liên quan]
        H[TrendAnalysisService]
        I[NotificationService]
        D -->|4. Lưu DB & Trả về SyncResult| C
        C -->|5. recalculateTrends| H
        C -->|6. notifyFollowers| I
    end
```

---

## 2. Thiết kế Cơ sở dữ liệu (`api_data_sources`)

Bảng `api_data_sources` quản lý cấu hình và trạng thái đồng bộ gần nhất của từng nguồn API bên ngoài:

```sql
CREATE TABLE api_data_sources
(
    id           BIGINT PRIMARY KEY AUTO_INCREMENT,
    name         VARCHAR(100) NOT NULL, -- Ví dụ: "OpenAlex", "Crossref", "Semantic Scholar"
    base_url     VARCHAR(500) NOT NULL, -- URL gốc của API
    api_key      VARCHAR(500),          -- Khóa API nếu có
    is_active    BOOLEAN DEFAULT TRUE,  -- Trạng thái kích hoạt (chỉ sync khi TRUE)
    last_sync_at DATETIME               -- Mốc thời gian hoàn tất đồng bộ gần nhất
);
```

### Cách thức hoạt động:
*   Mỗi khi Scheduler chạy, nó chỉ lấy các nguồn có `is_active = true`.
*   Scheduler lấy giá trị `last_sync_at` làm mốc ngày (`fromDate`) bắt đầu lấy bài báo mới. Nếu `last_sync_at` rỗng (lần chạy đầu tiên), nó mặc định lấy từ ngày hôm trước (`LocalDate.now().minusDays(1)`).
*   Sau khi một nguồn hoàn tất đồng bộ thành công, Scheduler cập nhật `last_sync_at` của nguồn đó bằng thời điểm hiện tại (`LocalDateTime.now()`).

---

## 3. Sơ đồ hoạt động (Activity Diagram)

Quy trình hoạt động tự động khi Scheduler được kích hoạt:

```mermaid
%%{init: { 'flowchart': {'useMaxWidth': false} }}%%
flowchart TD
    Start([Bắt đầu: Đạt mốc 2:00 AM]) --> CheckEnabled{sync.enabled == true?}
    
    CheckEnabled -- No --> Stop([Kết thúc])
    CheckEnabled -- Yes --> GetSources[Lấy danh sách ApiDataSource đang active từ DB]
    
    GetSources --> LoopStart{Còn ApiDataSource chưa sync?}
    
    LoopStart -- Yes --> SelectSource[Lấy ApiDataSource tiếp theo]
    SelectSource --> FindClient{Có Client tương ứng?}
    
    FindClient -- No --> LogWarning[Ghi log cảnh báo] --> LoopStart
    FindClient -- Yes --> CheckAvailable{Client.isAvailable()?}
    
    CheckAvailable -- No --> LogError[Ghi log lỗi: Client không khả dụng] --> LoopStart
    CheckAvailable -- Yes --> CalcDate[Tính fromDate = lastSyncAt.toLocalDate hoặc Mặc định]
    
    CalcDate --> CallSync[Gọi dataSyncService.syncRecentPapers]
    CallSync --> SaveSuccess[Cập nhật lastSyncAt = LocalDateTime.now vào DB]
    SaveSuccess --> CollectResult[Thu thập SyncResult & danh sách bài báo mới]
    CollectResult --> LoopStart
    
    LoopStart -- No --> RecalcTrends[Gọi trendAnalysisService.recalculateTrends]
    RecalcTrends --> CheckNewPapers{Có bài báo mới?}
    
    CheckNewPapers -- No --> LogFinished[Ghi log hoàn thành công việc] --> Stop
    CheckNewPapers -- Yes --> Notify[Gọi notificationService.notifyFollowers] --> LogFinished
```

---

## 4. Sơ đồ tuần tự (Sequence Diagram)

Tương tác giữa các thành phần khi thực thi:

```mermaid
%%{init: { 'sequence': {'useMaxWidth': false} }}%%
sequenceDiagram
    autonumber
    participant Scheduler as DataSyncScheduler
    participant DB as ApiDataSourceRepository
    participant SyncService as DataSyncServiceImpl
    participant Client as OpenAlexClient
    participant TrendService as TrendAnalysisServiceImpl
    participant NotifyService as NotificationServiceImpl

    Note over Scheduler: 2:00 AM kích hoạt
    Scheduler->>DB: findByIsActiveTrue()
    DB-->>Scheduler: Trả về List<ApiDataSource>

    loop Với mỗi ApiDataSource active (ví dụ: OpenAlex)
        Scheduler->>Client: Check health / isAvailable()
        Client-->>Scheduler: true
        
        Scheduler->>SyncService: syncRecentPapers("OpenAlex", lastSyncAt)
        
        loop Thu thập theo Batch
            SyncService->>Client: fetchRecentPapers(lastSyncAt, page, pageSize)
            Client-->>SyncService: List<RawPaperData>
            SyncService->>SyncService: Khử trùng, lưu ResearchPaper mới vào DB
        end
        
        SyncService-->>Scheduler: Trả về SyncResult (gồm các Entity ResearchPaper đã lưu)
        Scheduler->>DB: save(source với lastSyncAt = NOW)
        DB-->>Scheduler: Thành công
    end

    Scheduler->>TrendService: recalculateTrends()
    TrendService-->>Scheduler: Thành công

    alt Có bài báo mới được thêm vào
        Scheduler->>NotifyService: notifyFollowers(allSyncedPapers)
        NotifyService-->>Scheduler: Gửi thông báo hoàn tất
    end
    
    Note over Scheduler: Hoàn tất công việc định kỳ
```

---

## 5. Traceability Matrix (Ma trận đáp ứng yêu cầu)

| Yêu cầu (Acceptance Criteria) | File và dòng xử lý | Trạng thái |
| :--- | :--- | :--- |
| **Scheduler chạy đúng thời gian cấu hình** | [DataSyncScheduler.java](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/scheduler/DataSyncScheduler.java#L28) (`@Scheduled(cron = "${sync.cron:0 0 2 * * ?}")`) | ✅ Đã đáp ứng |
| **Tắt/bật Scheduler bằng file cấu hình** | [DataSyncScheduler.java](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/scheduler/DataSyncScheduler.java#L32-L35) | ✅ Đã đáp ứng |
| **Lấy danh sách `ApiDataSource` đang active từ DB** | [DataSyncScheduler.java](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/scheduler/DataSyncScheduler.java#L39) | ✅ Đã đáp ứng |
| **Tính toán thời gian `fromDate = lastSyncAt`** | [DataSyncScheduler.java](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/scheduler/DataSyncScheduler.java#L52-L54) | ✅ Đã đáp ứng |
| **Cập nhật `lastSyncAt` của source sau khi sync** | [DataSyncScheduler.java](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/scheduler/DataSyncScheduler.java#L64-L65) | ✅ Đã đáp ứng |
| **Log kết quả sync chi tiết** | [DataSyncScheduler.java](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/scheduler/DataSyncScheduler.java#L68-L69) | ✅ Đã đáp ứng |
| **Tách biệt xử lý lỗi để không dừng toàn bộ** | [DataSyncScheduler.java](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/scheduler/DataSyncScheduler.java#L73-L76) | ✅ Đã đáp ứng |
| **Tự động chạy tính toán lại xu hướng** | [DataSyncScheduler.java](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/scheduler/DataSyncScheduler.java#L80-L85) | ✅ Đã đáp ứng |
| **Gửi thông báo tới người dùng theo dõi** | [DataSyncScheduler.java](file:///d:/Document/Java/journal-trend-tracker/Scientific-Journal-Publication-Trend-Tracking-System/backend/com.journaltracker/src/main/java/com/journaltracker/scheduler/DataSyncScheduler.java#L88-L95) | ✅ Đã đáp ứng |
