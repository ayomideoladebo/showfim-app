-- ============================================
-- PROFILES UPDATE: Progression Columns
-- ============================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1 NOT NULL,
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS movies_watched INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS badges INTEGER DEFAULT 0 NOT NULL;

-- ============================================
-- WATCH HISTORY TABLE
-- Tracks playback progression of movies/tv
-- ============================================
CREATE TABLE IF NOT EXISTS public.watch_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content_id INTEGER NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
    minutes_watched INTEGER DEFAULT 0 NOT NULL,
    is_completed BOOLEAN DEFAULT false NOT NULL,
    last_watched_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, content_id, media_type)
);

-- RLS for watch_history
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own watch history" 
    ON public.watch_history FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TASKS TABLE
-- Defines the global daily/weekly challenges
-- ============================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    points_reward INTEGER NOT NULL,
    task_type TEXT NOT NULL CHECK (task_type IN ('daily', 'weekly', 'one_time')),
    icon_name TEXT, -- e.g. for MaterialIcons
    required_action TEXT, -- e.g. 'watch_movie', 'complete_profile'
    required_count INTEGER DEFAULT 1 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS for tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read tasks
CREATE POLICY "Anyone can view active tasks" 
    ON public.tasks FOR SELECT 
    USING (is_active = true);

-- Insert some default tasks
INSERT INTO public.tasks (title, description, points_reward, task_type, icon_name, required_action, required_count)
VALUES 
    ('Complete your profile', 'Add a name to your profile', 20, 'one_time', 'person', 'complete_profile', 1),
    ('Watch a Movie', 'Watch 1 full movie today', 10, 'daily', 'movie', 'watch_movie', 1),
    ('Watch 3 movies this week', 'Binge watch 3 movies', 50, 'weekly', 'movie', 'watch_movie', 3)
ON CONFLICT DO NOTHING;

-- ============================================
-- USER TASKS TABLE
-- Tracks user's progress and claims for tasks
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    progress_count INTEGER DEFAULT 0 NOT NULL,
    is_completed BOOLEAN DEFAULT false NOT NULL,
    is_claimed BOOLEAN DEFAULT false NOT NULL,
    completed_at TIMESTAMPTZ,
    reset_at TIMESTAMPTZ, -- For daily/weekly resets
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, task_id, reset_at)
);

-- RLS for user_tasks
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own task progress" 
    ON public.user_tasks FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RPC FUNCTION: Claim Task / Add Points
-- Safely increments points on the server side
-- ============================================
CREATE OR REPLACE FUNCTION claim_task_points(p_user_id UUID, p_task_id UUID, p_points INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the task to claimed
    UPDATE public.user_tasks
    SET is_claimed = true
    WHERE user_id = p_user_id AND task_id = p_task_id AND is_completed = true AND is_claimed = false;

    -- If a row was updated (task was really unclaimed & complete), add points
    IF FOUND THEN
        UPDATE public.profiles
        SET points_earned = points_earned + p_points
        WHERE id = p_user_id;
    END IF;
END;
$$;
