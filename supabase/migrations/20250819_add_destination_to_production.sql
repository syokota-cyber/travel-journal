-- 本番環境のtripsテーブルにdestinationカラムを追加
-- この変更は既存データに影響を与えない安全な追加です

-- destinationカラムを追加（NULL許可）
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS destination TEXT;

-- 新しいカラムにコメントを追加
COMMENT ON COLUMN trips.destination IS '旅先方面 - 13の方面から選択（例：北海道（道北）、関東方面、など）';