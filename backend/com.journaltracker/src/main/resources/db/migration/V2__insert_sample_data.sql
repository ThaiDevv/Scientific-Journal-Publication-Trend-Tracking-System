
INSERT INTO api_data_sources (name,
                              base_url,
                              api_key,
                              is_active,
                              last_sync_at)
VALUES ('OpenAlex',
        'https://api.openalex.org',
        NULL,
        true,
        NOW()),
       ('Crossref',
        'https://api.crossref.org',
        NULL,
        true,
        NOW()),
       ('Semantic Scholar',
        'https://api.semanticscholar.org',
        NULL,
        true,
        NOW());

