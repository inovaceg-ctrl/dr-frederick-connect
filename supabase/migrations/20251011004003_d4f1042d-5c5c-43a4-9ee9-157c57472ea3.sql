-- Adicionar campos para WebRTC signaling na tabela video_sessions
ALTER TABLE public.video_sessions 
ADD COLUMN IF NOT EXISTS offer jsonb,
ADD COLUMN IF NOT EXISTS answer jsonb,
ADD COLUMN IF NOT EXISTS ice_candidates jsonb DEFAULT '[]'::jsonb;

-- Habilitar realtime para video_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_sessions;