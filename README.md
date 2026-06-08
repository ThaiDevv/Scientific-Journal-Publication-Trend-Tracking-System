<div align="center">

<img src="https://img.shields.io/badge/Spring%20Boot-4.0.6-6DB33F?style=for-the-badge&logo=springboot&logoColor=white"/>
<img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
<img src="https://img.shields.io/badge/MySQL-8.x-4479A1?style=for-the-badge&logo=mysql&logoColor=white"/>
<img src="https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white"/>
<img src="https://img.shields.io/badge/Maven-Build-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white"/>
<img src="https://img.shields.io/badge/JWT-Authentication-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white"/>

# Scientific Journal Publication Trend Tracking System

A full-stack web application for tracking and analyzing scientific publication trends across major academic databases.

*Powered by OpenAlex · Crossref · Semantic Scholar*

---

[Overview](#overview) · [Features](#features) · [Architecture](#system-architecture) · [Tech Stack](#tech-stack) · [Installation](#installation) · [API Reference](#api-reference)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Git Workflow](#git-workflow)
- [Definition of Done](#definition-of-done)

---

## Overview

**Scientific Journal Publication Trend Tracking System** is an enterprise-grade web application that enables
researchers, lecturers, and students to monitor, analyze, and visualize research publication trends in real time.

The system automatically aggregates publication data from three major academic APIs — OpenAlex, Crossref, and Semantic
Scholar — performs trend analysis across keywords and topics, and presents the results through an interactive analytics
dashboard.

### Key Highlights

| Capability                | Description                                                                  |
|---------------------------|------------------------------------------------------------------------------|
| Multi-source Aggregation  | Simultaneous integration with three international academic APIs              |
| Trend Analytics           | Growth rate calculation, emerging topic detection, year-over-year comparison |
| Role-based Access Control | Four permission levels: RESEARCHER, LECTURER, STUDENT, ADMIN                 |
| Automated Synchronization | Scheduled data sync with configurable cron intervals                         |
| Notification System       | Automated alerts when new publications match followed topics or journals     |
| Rich Visualization        | Line charts, bar charts, pie charts, and word cloud components               |

---

## Features

<details>
<summary><b>Search and Discovery</b></summary>

- Full-text search by keyword, author name, or journal title
- Advanced filters: publication year, research field, data source
- Paginated results with configurable page size
- Detailed paper view: abstract, authors, keywords, DOI, source URL

</details>

<details>
<summary><b>Trend Analysis</b></summary>

- Time-series trend charts per keyword or research topic
- Multi-keyword comparison on a single chart
- Growth rate computation relative to the previous year
- Automated detection of emerging/trending topics
- Word cloud visualization for hot keywords

</details>

<details>
<summary><b>Analytics Dashboard</b></summary>

- System-wide statistics: total papers, journals, authors, keywords
- Top trending topics with recency weighting
- Recently collected papers feed
- Field distribution pie chart
- Top journals by publication count bar chart

</details>

<details>
<summary><b>Follow and Notifications</b></summary>

- Follow journals, research topics, or individual keywords
- Automated notifications on new matching publications
- Read/unread state management for notifications
- Notification badge with unread count indicator

</details>

<details>
<summary><b>Personal Bookmarks</b></summary>

- Save papers to a personal reading list
- Manage and remove bookmarks
- Quick access to saved papers from any session

</details>

<details>
<summary><b>Administration</b></summary>

- User account management: view, activate, deactivate, reassign roles
- External API source configuration (OpenAlex, Crossref, Semantic Scholar)
- Manual data synchronization trigger
- System-level analytics and reporting

</details>

---

## System Architecture

```
+---------------------------------------------------------------+
|                    Frontend  (React 18 + Vite)                |
|   +-----------+  +----------+  +----------+  +------------+  |
|   | Auth UI   |  | Search   |  | Dashboard|  | Admin      |  |
|   | Login/Reg |  | Papers   |  | Charts   |  | Panel      |  |
|   +-----------+  +----------+  +----------+  +------------+  |
+-------------------------------|-------------------------------+
                                | REST API (JSON)
                                | Authorization: Bearer <JWT>
+-------------------------------|-------------------------------+
|                Backend  (Spring Boot 4.x)                    |
|   +---------------+  +--------------+  +------------------+  |
|   | Spring        |  | REST         |  | Scheduler        |  |
|   | Security +JWT |  | Controllers  |  | (Daily/Weekly)   |  |
|   +---------------+  +------+-------+  +--------+---------+  |
|                             |                    |            |
|   +-------------------------+--------------------+---------+  |
|   |                    Service Layer                       |  |
|   |  AuthService  PaperService  TrendAnalysisService       |  |
|   |  DataSyncService  NotificationService  ReportService   |  |
|   +----------------------------+---------------------------+  |
|                                |                              |
|   +----------------------------+---------------------------+  |
|   |         Repository Layer  (Spring Data JPA)            |  |
|   +----------------------------+---------------------------+  |
+--------------------------------|------------------------------+
                                 |
               +-----------------+-----------------+
               |          MySQL 8.x                |
               |       journal_tracker_db          |
               +-----------------+-----------------+
                                 ^
               +-----------------+-----------------+
               |       External API Clients        |
               |  OpenAlex   Crossref   Semantic   |
               +-----------------------------------+
```

### Data Synchronization Flow

```
Scheduled Trigger (Cron) / Admin Manual Trigger
        |
        v
  DataSyncService
        |
        +---------> OpenAlex API  ----+
        +---------> Crossref API  ----|----> Parse & Normalize Metadata
        +---------> Semantic Scholar -+
                                      |
                               Deduplication
                            (by DOI / Title hash)
                                      |
                              Persist to Database
                                      |
                          Recalculate Trend Statistics
                                      |
                        Dispatch Notifications to Followers
```

---

## Tech Stack

### Backend

| Layer             | Technology                     | Version  |
|-------------------|--------------------------------|----------|
| Framework         | Spring Boot                    | 4.0.6    |
| Language          | Java                           | 17       |
| Security          | Spring Security 6 + jjwt       | 0.12.5   |
| Persistence       | Spring Data JPA + Hibernate    | Latest   |
| Database          | MySQL                          | 8.x      |
| Schema Migration  | Flyway                         | Latest   |
| External HTTP     | Spring WebClient (WebFlux)     | Latest   |
| Job Scheduling    | Spring `@Scheduled`            | Built-in |
| Validation        | Jakarta Bean Validation        | Latest   |
| Object Mapping    | MapStruct                      | 1.5.5    |
| API Documentation | SpringDoc OpenAPI (Swagger UI) | 3.0.2    |
| Logging           | SLF4J + Logback                | Built-in |
| Testing           | JUnit 5 + Mockito              | Latest   |
| Build Tool        | Apache Maven                   | Latest   |
| Utilities         | Lombok                         | Latest   |

### Frontend

| Layer            | Technology       | Version |
|------------------|------------------|---------|
| Framework        | React            | 18      |
| Build Tool       | Vite             | Latest  |
| UI Library       | Ant Design       | Latest  |
| Charting         | Recharts         | Latest  |
| HTTP Client      | Axios            | Latest  |
| Routing          | React Router DOM | Latest  |
| State Management | Zustand          | Latest  |
| Date Handling    | Day.js           | Latest  |

### External Data Sources

| API              | Purpose                           | Documentation                                              |
|------------------|-----------------------------------|------------------------------------------------------------|
| OpenAlex         | Paper metadata aggregation        | [docs.openalex.org](https://docs.openalex.org)             |
| Crossref         | DOI resolution and citation data  | [api.crossref.org](https://api.crossref.org)               |
| Semantic Scholar | Citation graph and author metrics | [api.semanticscholar.org](https://api.semanticscholar.org) |

---


---

## Prerequisites

| Requirement  | Minimum Version |
|--------------|-----------------|
| Java (JDK)   | 17              |
| Apache Maven | 3.6             |
| Node.js      | 18              |
| npm          | 8               |
| MySQL Server | 8.0             |

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/<your-org>/journal-trend-tracker.git
cd journal-trend-tracker
```

### 2. Provision the Database

```sql
CREATE DATABASE journal_tracker_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'jtracker'@'localhost' IDENTIFIED BY '<your_password>';
GRANT ALL PRIVILEGES ON journal_tracker_db.* TO 'jtracker'@'localhost';
FLUSH PRIVILEGES;
```

> Flyway will automatically apply all migrations on first startup. No manual SQL import is required.

### 3. Configure the Backend

Create `backend/com.journaltracker/src/main/resources/application-dev.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/journal_tracker_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: jtracker
    password: <your_password>
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false

  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true

jwt:
  secret: <256-bit-secret-key>
  expiration: 86400000   # 24 hours in milliseconds

server:
  port: 8080

springdoc:
  api-docs:
    path: /v3/api-docs
  swagger-ui:
    path: /swagger-ui.html
```

### 4. Start the Backend

```bash
cd backend/com.journaltracker
mvn clean install -DskipTests
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

The backend will be available at `http://localhost:8080`.  
Interactive API documentation: `http://localhost:8080/swagger-ui.html`

### 5. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### 6. Default Credentials (Seeded Data)

| Role       | Username       | Password   |
|------------|----------------|------------|
| ADMIN      | `admin`        | `admin123` |
| RESEARCHER | `researcher01` | `test123`  |
| STUDENT    | `student01`    | `test123`  |

> **Security notice:** Change all default passwords before deploying to any non-local environment.

---

## Environment Variables

### Backend

| Key                          | Description                         | Example                                          |
|------------------------------|-------------------------------------|--------------------------------------------------|
| `spring.datasource.url`      | JDBC connection string              | `jdbc:mysql://localhost:3306/journal_tracker_db` |
| `spring.datasource.username` | Database username                   | `jtracker`                                       |
| `spring.datasource.password` | Database password                   | `yourpassword`                                   |
| `jwt.secret`                 | HMAC signing key (minimum 256 bits) | `your-secret-key`                                |
| `jwt.expiration`             | Token validity in milliseconds      | `86400000`                                       |
| `server.port`                | HTTP server port                    | `8080`                                           |

### Frontend

```env
# frontend/.env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=Journal Trend Tracker
```

---

## API Reference

Full interactive documentation is available via Swagger UI at `http://localhost:8080/swagger-ui.html`.

### Endpoint Groups

| Group         | Base Path            | Description                                      | Authentication  |
|---------------|----------------------|--------------------------------------------------|-----------------|
| Auth          | `/api/auth`          | Register, login, refresh token                   | Public          |
| Users         | `/api/users`         | Profile management, password change              | Required        |
| Papers        | `/api/papers`        | Paper search and detail                          | Public (search) |
| Journals      | `/api/journals`      | Journal listing and detail                       | Public          |
| Trends        | `/api/trends`        | Keyword and topic trend data                     | Required        |
| Dashboard     | `/api/dashboard`     | Aggregated statistics and trending               | Required        |
| Bookmarks     | `/api/bookmarks`     | Personal bookmark management                     | Required        |
| Follows       | `/api/follows`       | Follow journals, topics, keywords                | Required        |
| Notifications | `/api/notifications` | Notification listing and read state              | Required        |
| Reports       | `/api/reports`       | Analytical reports and exports                   | Required        |
| Admin         | `/api/admin`         | User management, datasource config, sync trigger | ADMIN role      |

### Unified Response Envelope

All endpoints return a consistent `ApiResponse<T>` wrapper:

```json
// Success
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "timestamp": "2026-05-22T12:00:00"
}

// Error
{
  "success": false,
  "message": "Resource not found with id: 999",
  "data": null,
  "timestamp": "2026-05-22T12:00:00"
}
```

### Authentication

```bash
# Step 1 — Obtain a token
POST /api/auth/login
Content-Type: application/json

{
  "username": "researcher01",
  "password": "test123"
}

# Step 2 — Pass the token on subsequent requests
GET /api/bookmarks
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### HTTP Status Code Conventions

| Status                      | Meaning                                           |
|-----------------------------|---------------------------------------------------|
| `200 OK`                    | Request succeeded                                 |
| `201 Created`               | Resource created successfully                     |
| `400 Bad Request`           | Validation failure or malformed request           |
| `401 Unauthorized`          | Missing or invalid JWT token                      |
| `403 Forbidden`             | Authenticated but insufficient role               |
| `404 Not Found`             | Requested resource does not exist                 |
| `409 Conflict`              | Duplicate resource (e.g., username already taken) |
| `500 Internal Server Error` | Unexpected server-side error                      |

---

## Database Schema

The system uses **14 tables** managed exclusively by Flyway migrations.

```
journals
  |-- (1:N) --> research_papers
                    |-- (N:N) --> authors         [via paper_authors]
                    |-- (N:N) --> keywords        [via paper_keywords]
                    |-- (1:N) --> bookmarks
                                      |-- (N:1) --> users
                                                       |-- (1:N) --> notifications
                                                       |-- (1:N) --> follows

keywords
  |-- (1:N) --> publication_trends
  |-- (N:N) --> research_topics     [via topic_keywords]

api_data_sources   (standalone configuration table)
```

| Table                | Description                                         |
|----------------------|-----------------------------------------------------|
| `users`              | User accounts with role assignment                  |
| `research_papers`    | Scientific papers (DOI-unique)                      |
| `journals`           | Academic journals                                   |
| `authors`            | Paper authors with external API IDs                 |
| `keywords`           | Research keywords with usage counters               |
| `research_topics`    | Aggregated research topic groups                    |
| `publication_trends` | Year-over-year trend data per keyword               |
| `bookmarks`          | User-saved papers                                   |
| `notifications`      | System notifications per user                       |
| `follows`            | User subscriptions to journals, topics, or keywords |
| `api_data_sources`   | External API source configuration                   |
| `paper_authors`      | Junction: papers ↔ authors                          |
| `paper_keywords`     | Junction: papers ↔ keywords                         |
| `topic_keywords`     | Junction: topics ↔ keywords                         |

For the full schema definition including column types and constraints, see [
`docs/database_schema.md`](docs/database_schema.md).

---

## Git Workflow

### Branch Naming Convention

| Branch Type | Pattern                | Example                  |
|-------------|------------------------|--------------------------|
| Feature     | `feature/<module>`     | `feature/auth-api`       |
| Bug Fix     | `bugfix/<description>` | `bugfix/login-500-error` |
| Hot Fix     | `hotfix/<description>` | `hotfix/jwt-expiry-null` |

### Branch Strategy

```
main          <-- Production-ready. Merged from develop when stable.
  |
  +-- develop <-- Integration branch. All feature branches merge here via PR.
        |
        +-- feature/auth-api
        +-- feature/paper-search
        +-- feature/trend-analysis
        +-- feature/frontend-core
        +-- feature/dashboard-charts
```

### Workflow

```bash
# 1. Always branch from the latest develop
git checkout develop
git pull origin develop
git checkout -b feature/<module-name>

# 2. Commit with a structured message
git commit -m "[JP-XX] Short imperative description of the change"

# 3. Push and open a Pull Request targeting develop
git push origin feature/<module-name>
# Open a PR on GitHub and request a review
```

### Commit Message Format

```
[JP-XX] <imperative verb> <short description>

Examples:
  [JP-10] Implement JWT login endpoint with BCrypt password verification
  [JP-25] Add OpenAlex client with cursor-based pagination
  [JP-36] Create reusable Recharts line chart for multi-keyword comparison
```

### Merge Rules

- Every merge into `develop` or `main` requires a reviewed and approved Pull Request.
- Merging a PR without at least one approval is not permitted.
- Squash merging is preferred to keep the `develop` history clean.

---

## Definition of Done

A task is considered **Done** only when all of the following criteria are satisfied:

- [ ] Code compiles and builds successfully with no errors (`mvn clean install`)
- [ ] At least one unit test covers the core business logic of the feature
- [ ] API endpoints are verified via Postman or Swagger UI
- [ ] Code is pushed to the designated feature branch
- [ ] A Pull Request is created with a clear title and description
- [ ] The Pull Request has been reviewed and approved
- [ ] The Pull Request has been merged into `develop`
- [ ] The corresponding task has been moved to the **Done** column on the board

---

## License

This project is developed for academic purposes. All rights reserved by the respective authors.

---

## References

- [Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/)
- [Spring Security Reference](https://docs.spring.io/spring-security/reference/)
- [OpenAlex API Documentation](https://docs.openalex.org/)
- [Crossref REST API](https://api.crossref.org/swagger-ui/index.html)
- [Semantic Scholar API](https://api.semanticscholar.org/graph/v1)
- [React Documentation](https://react.dev/)
- [Ant Design Component Library](https://ant.design/components/overview/)
- [Recharts Documentation](https://recharts.org/en-US/)
- [Flyway Documentation](https://flywaydb.org/documentation/)
