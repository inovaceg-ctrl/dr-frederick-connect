-- Allow doctors to view all profiles
CREATE POLICY "Doctors can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'doctor'::app_role));

-- Allow doctors to update all profiles
CREATE POLICY "Doctors can update all profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'doctor'::app_role));

-- Allow doctors to insert profiles (for new patients)
CREATE POLICY "Doctors can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'doctor'::app_role));