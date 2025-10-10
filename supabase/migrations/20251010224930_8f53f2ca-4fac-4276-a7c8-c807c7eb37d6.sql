-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('doctor', 'patient');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update messages RLS policies to allow doctors to see all messages
CREATE POLICY "Doctors can view all messages"
ON public.messages
FOR SELECT
USING (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors can insert messages"
ON public.messages
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'doctor') AND is_from_doctor = true);

-- Update appointments RLS policies to allow doctors to see all appointments
CREATE POLICY "Doctors can view all appointments"
ON public.appointments
FOR SELECT
USING (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors can update all appointments"
ON public.appointments
FOR UPDATE
USING (public.has_role(auth.uid(), 'doctor'));

-- Update video_sessions RLS policies to allow doctors to see all sessions
CREATE POLICY "Doctors can view all video sessions"
ON public.video_sessions
FOR SELECT
USING (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors can update video sessions"
ON public.video_sessions
FOR UPDATE
USING (public.has_role(auth.uid(), 'doctor'));