-- ローカル環境のみ：本番環境のdefault_itemsデータを同期（サンプル）
-- 本番環境への影響は一切ありません

INSERT INTO default_items (id, main_purpose_id, name, display_order) VALUES
('1f55c357-0d4e-49cd-ab74-83e69d80b23f', '7431b624-26e2-46c1-a83e-e8a38ff7f62a', 'SUP/カヤック本体', 1),
('937400f2-53e7-469d-8500-44b4cf0688c2', '7431b624-26e2-46c1-a83e-e8a38ff7f62a', 'パドル', 2),
('0cc38f42-efa7-45a5-bbe9-067239376ebe', '7431b624-26e2-46c1-a83e-e8a38ff7f62a', 'ライフジャケット', 3),
('1d65536c-ccd7-4516-aa95-80922a82c5f5', '7431b624-26e2-46c1-a83e-e8a38ff7f62a', 'リーシュコード', 4),
('1c45e0f6-d3ed-46d0-a947-e9b81b334b4e', '7431b624-26e2-46c1-a83e-e8a38ff7f62a', '防水バッグ', 5);