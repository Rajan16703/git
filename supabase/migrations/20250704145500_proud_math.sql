/*
  # Create comparison history and sharing system

  1. New Tables
    - `comparison_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, nullable for anonymous users)
      - `usernames` (text array)
      - `comparison_data` (jsonb)
      - `share_token` (text, unique)
      - `is_public` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `comparison_shares`
      - `id` (uuid, primary key)
      - `comparison_id` (uuid, references comparison_history)
      - `share_token` (text, unique)
      - `shared_by` (uuid, references auth.users, nullable)
      - `view_count` (integer)
      - `expires_at` (timestamp, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own comparisons
    - Add policies for public access to shared comparisons
    - Add policies for anonymous comparison creation
*/

CREATE TABLE IF NOT EXISTS comparison_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users DEFAULT NULL,
  usernames text[] NOT NULL,
  comparison_data jsonb DEFAULT '{}',
  share_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'base64url'),
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comparison_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comparison_id uuid REFERENCES comparison_history(id) ON DELETE CASCADE,
  share_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'base64url'),
  shared_by uuid REFERENCES auth.users DEFAULT NULL,
  view_count integer DEFAULT 0,
  expires_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE comparison_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparison_shares ENABLE ROW LEVEL SECURITY;

-- Policies for comparison_history
CREATE POLICY "Users can view their own comparisons"
  ON comparison_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own comparisons"
  ON comparison_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comparisons"
  ON comparison_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comparisons"
  ON comparison_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anonymous users can create comparisons"
  ON comparison_history
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Public comparisons are viewable by anyone"
  ON comparison_history
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

CREATE POLICY "Shared comparisons are viewable by share token"
  ON comparison_history
  FOR SELECT
  TO anon, authenticated
  USING (
    share_token IN (
      SELECT cs.share_token 
      FROM comparison_shares cs 
      WHERE cs.comparison_id = comparison_history.id
      AND (cs.expires_at IS NULL OR cs.expires_at > now())
    )
  );

-- Policies for comparison_shares
CREATE POLICY "Users can view shares for their comparisons"
  ON comparison_shares
  FOR SELECT
  TO authenticated
  USING (
    comparison_id IN (
      SELECT id FROM comparison_history 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create shares for their comparisons"
  ON comparison_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (
    comparison_id IN (
      SELECT id FROM comparison_history 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update shares for their comparisons"
  ON comparison_shares
  FOR UPDATE
  TO authenticated
  USING (
    comparison_id IN (
      SELECT id FROM comparison_history 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete shares for their comparisons"
  ON comparison_shares
  FOR DELETE
  TO authenticated
  USING (
    comparison_id IN (
      SELECT id FROM comparison_history 
      WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_comparison_history_user_id ON comparison_history(user_id);
CREATE INDEX IF NOT EXISTS idx_comparison_history_share_token ON comparison_history(share_token);
CREATE INDEX IF NOT EXISTS idx_comparison_history_created_at ON comparison_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comparison_shares_comparison_id ON comparison_shares(comparison_id);
CREATE INDEX IF NOT EXISTS idx_comparison_shares_share_token ON comparison_shares(share_token);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_comparison_history_updated_at 
    BEFORE UPDATE ON comparison_history 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();