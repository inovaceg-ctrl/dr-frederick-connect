-- Add RLS policy for users to update their own video sessions
CREATE POLICY "Users can update their own video sessions"
ON public.video_sessions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);