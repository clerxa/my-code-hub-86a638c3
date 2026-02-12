-- Add new columns to modules table for enhanced guide/formation modules
ALTER TABLE modules 
ADD COLUMN IF NOT EXISTS content_type TEXT CHECK (content_type IN ('video', 'slides', 'text', 'resources', 'mixed')),
ADD COLUMN IF NOT EXISTS embed_code TEXT,
ADD COLUMN IF NOT EXISTS content_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS pedagogical_objectives TEXT[],
ADD COLUMN IF NOT EXISTS estimated_time INTEGER, -- in minutes
ADD COLUMN IF NOT EXISTS difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 3),
ADD COLUMN IF NOT EXISTS completion_threshold INTEGER DEFAULT 100, -- percentage for automatic validation
ADD COLUMN IF NOT EXISTS auto_validate BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS key_takeaways TEXT[];

-- Update existing guide modules to have default values
UPDATE modules 
SET content_type = 'mixed',
    difficulty_level = 1,
    estimated_time = 15
WHERE type = 'guide' AND content_type IS NULL;

COMMENT ON COLUMN modules.content_type IS 'Type of content: video, slides, text, resources, or mixed';
COMMENT ON COLUMN modules.embed_code IS 'HTML embed code for videos or slides';
COMMENT ON COLUMN modules.content_data IS 'JSON data for structured content (text paragraphs, resources list, etc.)';
COMMENT ON COLUMN modules.pedagogical_objectives IS 'Array of learning objectives for this module';
COMMENT ON COLUMN modules.estimated_time IS 'Estimated completion time in minutes';
COMMENT ON COLUMN modules.difficulty_level IS 'Difficulty level: 1 (beginner), 2 (intermediate), 3 (advanced)';
COMMENT ON COLUMN modules.completion_threshold IS 'Percentage threshold for automatic validation (e.g., 80% video watched)';
COMMENT ON COLUMN modules.auto_validate IS 'Whether to automatically validate based on completion threshold';
COMMENT ON COLUMN modules.key_takeaways IS 'Array of key takeaways/summary points';