-- Create operatii table for globally shared operations
CREATE TABLE public.operatii (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  denumire TEXT NOT NULL,
  valoare NUMERIC NOT NULL CHECK (valoare > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.operatii ENABLE ROW LEVEL SECURITY;

-- Everyone can read operations
CREATE POLICY "Anyone can read operatii"
  ON public.operatii FOR SELECT
  USING (true);

-- Insert/update/delete only via service role (edge functions)
CREATE POLICY "Service role can insert operatii"
  ON public.operatii FOR INSERT
  WITH CHECK (current_setting('role') = 'service_role');

CREATE POLICY "Service role can update operatii"
  ON public.operatii FOR UPDATE
  USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can delete operatii"
  ON public.operatii FOR DELETE
  USING (current_setting('role') = 'service_role');

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_operatii_updated_at
  BEFORE UPDATE ON public.operatii
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();