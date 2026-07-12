-- 1. Xóa toàn bộ thông báo cũ
DELETE FROM notifications;

-- 2. Xóa một số bài báo gần đây để khi Sync lại sẽ có bài "mới"
--    (Xóa các liên kết trước, rồi xóa bài báo)
DELETE pk FROM paper_keywords pk
  INNER JOIN research_papers rp ON pk.paper_id = rp.id
  WHERE rp.source_api = 'OpenAlex'
  ORDER BY rp.id DESC LIMIT 30;

DELETE pa FROM paper_authors pa
  INNER JOIN research_papers rp ON pa.paper_id = rp.id
  WHERE rp.source_api = 'OpenAlex'
  ORDER BY rp.id DESC LIMIT 30;

DELETE b FROM bookmarks b
  INNER JOIN research_papers rp ON b.paper_id = rp.id
  WHERE rp.source_api = 'OpenAlex'
  ORDER BY rp.id DESC LIMIT 30;

DELETE FROM research_papers
WHERE source_api = 'OpenAlex'
    ORDER BY id DESC LIMIT 30;
