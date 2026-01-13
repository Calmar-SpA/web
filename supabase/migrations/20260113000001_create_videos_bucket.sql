-- Create a new public bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up access control for the videos bucket
-- Allow public read access to objects in the videos bucket
CREATE POLICY "Videos Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'videos' );

-- Allow authenticated users to upload to the videos bucket
CREATE POLICY "Videos Admin Upload Access"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'videos' AND auth.role() = 'authenticated' );

-- Allow authenticated users to update objects in videos bucket
CREATE POLICY "Videos Admin Update Access" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'videos' AND auth.role() = 'authenticated' );

-- Allow authenticated users to delete objects in videos bucket
CREATE POLICY "Videos Admin Delete Access" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'videos' AND auth.role() = 'authenticated' );

-- Create table for managing site media (videos, banners, etc.)
CREATE TABLE IF NOT EXISTS site_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'hero_video', 'banner', etc.
  url TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups by type and active status
CREATE INDEX idx_site_media_type_active ON site_media(type, is_active);

-- RLS policies for site_media
ALTER TABLE site_media ENABLE ROW LEVEL SECURITY;

-- Allow public read access to site_media
CREATE POLICY "Site media public read access"
ON site_media FOR SELECT
USING (true);

-- Allow authenticated users to insert site_media
CREATE POLICY "Site media admin insert access"
ON site_media FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update site_media
CREATE POLICY "Site media admin update access"
ON site_media FOR UPDATE
USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete site_media
CREATE POLICY "Site media admin delete access"
ON site_media FOR DELETE
USING (auth.role() = 'authenticated');

-- Function to ensure only one active hero video at a time
CREATE OR REPLACE FUNCTION ensure_single_active_hero_video()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true AND NEW.type = 'hero_video' THEN
    UPDATE site_media 
    SET is_active = false, updated_at = NOW()
    WHERE type = 'hero_video' AND id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically deactivate other hero videos when one is activated
CREATE TRIGGER trigger_single_active_hero_video
BEFORE INSERT OR UPDATE ON site_media
FOR EACH ROW
EXECUTE FUNCTION ensure_single_active_hero_video();
