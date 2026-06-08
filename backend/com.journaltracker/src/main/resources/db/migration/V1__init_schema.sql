CREATE TABLE users
(
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    username      VARCHAR(255) not null UNIQUE,
    email         varchar(255) not null UNIQUE,
    password_hash varchar(255) not null,
    full_name     varchar(255),
    role          ENUM('RESEARCHER', 'ADMIN', 'LECTURER', 'STUDENT') not null,
    is_active     boolean      not null default TRUE,
    created_at    TIMESTAMP             DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP             DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE journals
(
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    name        varchar(1000) NOT NULL,
    issn        VARCHAR(255),
    publisher   VARCHAR(255),
    field       VARCHAR(100),
    paper_count INT default 0
);
CREATE TABLE research_papers
(
    id               BIGINT primary key AUTO_INCREMENT,
    doi              VARCHAR(255) UNIQUE,
    title            VARCHAR(1000) NOT NULL,
    abstract_text    TEXT,
    publication_year INT,
    source_url       VARCHAR(2000),
    source_api       varchar(50),
    journal_id       BIGINT,
    fetched_at       DATETIME,
    created_at       DATETIME      not null,
    INDEX            idx_paper_year (publication_year),
    INDEX            idx_paper_journal (journal_id),
    CONSTRAINT fk_research_journals FOREIGN KEY (journal_id) REFERENCES journals (id)
);
CREATE TABLE authors
(
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(255) NOT NULL,
    affiliation VARCHAR(500)
);
CREATE TABLE keywords
(
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(255) NOT NULL UNIQUE,
    usage_count INT DEFAULT 0
);
CREATE TABLE research_topics
(
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    is_trending BOOLEAN DEFAULT FALSE
);
CREATE TABLE publication_trends
(
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    keyword_id  BIGINT,
    year        INT NOT NULL,
    paper_count INT DEFAULT 0,
    growth_rate DECIMAL(5, 2),
    UNIQUE (keyword_id, year),
    CONSTRAINT fk_trends_keywords FOREIGN KEY (keyword_id) REFERENCES keywords (id)
);
CREATE TABLE bookmarks
(
    id         BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id    BIGINT,
    paper_id   BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, paper_id),
    INDEX      idx_bookmark_user (user_id),
    CONSTRAINT fk_bookmarks_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_bookmarks_papers FOREIGN KEY (paper_id) REFERENCES research_papers (id) ON DELETE CASCADE
);
CREATE TABLE notifications
(
    id         BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id    BIGINT,
    title      VARCHAR(255) NOT NULL,
    message    TEXT         NOT NULL,
    is_read    BOOLEAN DEFAULT FALSE,
    created_at DATETIME     NOT NULL,
    INDEX      idx_notification_user (user_id),
    CONSTRAINT fk_notifi_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE TABLE follows
(
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT,
    follow_type VARCHAR(20) NOT NULL,
    target_id   BIGINT      NOT NULL,
    created_at  DATETIME    NOT NULL,
    UNIQUE (user_id, follow_type, target_id),
    CONSTRAINT fk_follows_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE TABLE api_data_sources
(
    id           BIGINT PRIMARY KEY AUTO_INCREMENT,
    name         VARCHAR(100) NOT NULL,
    base_url     VARCHAR(500) NOT NULL,
    api_key      VARCHAR(500),
    is_active    BOOLEAN DEFAULT TRUE,
    last_sync_at DATETIME
);
CREATE TABLE paper_authors
(
    paper_id  BIGINT,
    author_id BIGINT,
    PRIMARY KEY (paper_id, author_id),
    CONSTRAINT fk_paper_author_paper
        FOREIGN KEY (paper_id)
            REFERENCES research_papers (id),
    CONSTRAINT fk_paper_author_author FOREIGN KEY (author_id) REFERENCES authors (id)
);
CREATE TABLE paper_keywords
(
    paper_id   BIGINT,
    keyword_id BIGINT,
    CONSTRAINT fk_paper_keywords FOREIGN KEY (paper_id) REFERENCES research_papers (id),
    CONSTRAINT fk_keywords_paper FOREIGN KEY (keyword_id) REFERENCES keywords (id)
);
CREATE TABLE topic_keywords
(
    topic_id   BIGINT,
    keyword_id BIGINT,
    CONSTRAINT fk_topic_keywords FOREIGN KEY (topic_id) REFERENCES research_topics (id),
    CONSTRAINT fk_keywords_topic FOREIGN KEY (keyword_id) REFERENCES keywords (id)
);
