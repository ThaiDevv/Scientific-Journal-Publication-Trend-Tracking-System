# Scientific Journal Publication Trend Tracking System

A full-stack web application for tracking and analyzing scientific publication trends across major academic databases.

*Powered by OpenAlex · Crossref · Semantic Scholar*

---

## Overview

The **Scientific Journal Publication Trend Tracking System** is a web-based application designed to help researchers, lecturers, and students monitor and analyze research trends in real-time. It aggregates publication data from multiple international APIs, performs analytics, and presents them in an interactive dashboard.

### Key Features
- **Multi-source Aggregation**: Syncs with OpenAlex, Crossref, and Semantic Scholar.
- **Trend Analytics**: Growth rate calculations, emerging topic detection, and comparisons.
- **Role-based Access Control**: Roles for `STUDENT`, `LECTURER`, `RESEARCHER`, and `ADMIN`.
- **Automated Sync**: Configurable cron-based background data synchronization.
- **Follow & Notify**: Real-time notifications for followed journals, topics, or keywords.
- **Rich Dashboard**: Word clouds, trend line charts, bar/pie charts for visual insights.

---

## Tech Stack

### Backend
- **Core**: Java 17, Spring Boot 4.0.6, Spring Security + JWT
- **Database & Migration**: MySQL 8.x, Flyway
- **APIs & Sync**: Spring WebClient (WebFlux), `@Scheduled` tasks
- **Build Tool**: Maven

### Frontend
- **Framework**: React 18 (Vite)
- **UI Library**: Ant Design
- **Charts**: Recharts
- **State Management**: Zustand
- **HTTP Client**: Axios

---

## Quick Start

### 1. Database Setup
Create a MySQL database and user:
```sql
CREATE DATABASE journal_tracker_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'jtracker'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON journal_tracker_db.* TO 'jtracker'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Backend Setup
Create your configuration file: `backend/com.journaltracker/src/main/resources/application-dev.yml`
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/journal_tracker_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: jtracker
    password: your_password
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: validate
  flyway:
    enabled: true
jwt:
  secret: your-256-bit-secret-key-goes-here-make-it-long
  expiration: 86400000
```
Run the backend:
```bash
cd backend/com.journaltracker
mvn clean install -DskipTests
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### 3. Frontend Setup
Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=Journal Trend Tracker
```
Run the frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## Task Assignment & Progress Checklist

Project tasks and assignments grouped by team members:

### Trần Văn Thái
- [x] **JP-1**: Khởi tạo Spring Boot Project
- [x] **JP-2**: Thiết kế Database & Flyway Migration
- [x] **JP-3**: Cấu hình Spring Security + JWT
- [x] **JP-4**: Setup Global Exception Handler
- [x] **JP-5**: Cấu hình Swagger & CORS
- [x] **JP-7**: Setup Git Repository & Branching Strategy
- [x] **JP-24**: Core Data Sync Service Interface
- [x] **JP-28**: Data Sync Scheduler
- [x] **JP-29**: Core Trend Analysis Logic
- [x] **JP-33**: Deduplication Logic
- [x] **JP-50**: Integration Testing (End-to-End)
- [x] **JP-52**: Bug Fixing & UI/UX Polish
- [x] **JP-53**: Documentation
- [x] **JP-54**: Demo Preparation

### Khoa Phan Ngọc
- [x] **JP-6**: Setup React + Vite Project
- [x] **JP-14**: Frontend - Login Page
- [x] **JP-15**: Frontend - Register Page
- [x] **JP-16**: Frontend - Auth Context & Protected Route
- [x] **JP-22**: Frontend - Search Page
- [x] **JP-23**: Frontend - Paper Detail Page
- [x] **JP-27**: Semantic Scholar API Client
- [x] **JP-42**: Follow API
- [x] **JP-44**: Frontend - Bookmarks Page
- [x] **JP-45**: Frontend - Notifications Page/Popup
- [x] **JP-48**: Frontend - Admin Panel
- [x] **JP-51**: Unit Tests cho Service Layer

### Hiệu
- [x] **JP-8**: User Entity & Repository
- [x] **JP-9**: API Đăng ký tài khoản
- [x] **JP-10**: API Đăng nhập & JWT
- [x] **JP-11**: Refresh Token
- [x] **JP-12**: User Profile CRUD
- [x] **JP-32**: API Data Source Management
- [x] **JP-34**: Dashboard API
- [x] **JP-39**: Frontend - Word Cloud
- [x] **JP-40**: Frontend - Topic Explorer
- [x] **JP-43**: Notification Service & API

### Trãi Nguyễn Anh
- [x] **JP-13**: Admin - Quản lý Users
- [x] **JP-21**: Author & Keyword API
- [x] **JP-25**: OpenAlex API Client
- [x] **JP-31**: Research Topic CRUD
- [x] **JP-35**: Frontend - Dashboard Page
- [x] **JP-38**: Frontend - Trend Analysis Page
- [x] **JP-46**: Frontend - Following Page
- [x] **JP-49**: Frontend - Reports Page

### Trần Toàn
- [x] **JP-17**: Paper, Journal, Author, Keyword Entities
- [x] **JP-18**: API Tìm kiếm bài báo
- [x] **JP-19**: API Xem chi tiết bài báo
- [x] **JP-20**: Journal API
- [x] **JP-36**: Frontend - Trend Line Chart Component
- [x] **JP-37**: Frontend - Bar Chart & Pie Chart
- [x] **JP-41**: Bookmark API

### Trương Lâm Hưng
- [x] **JP-26**: Crossref API Client
- [x] **JP-30**: Trend API Endpoints
- [x] **JP-47**: Report Generation API
