CREATE TABLE public.submission_properties (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  property_data JSONB NOT NULL,
  source TEXT NOT NULL DEFAULT 'email',
  source_email_id TEXT,
  source_subject TEXT,
  source_from TEXT,
  source_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT submission_properties_property_data_object CHECK (jsonb_typeof(property_data) = 'object'),
  CONSTRAINT submission_properties_source_email_unique UNIQUE (user_id, source_email_id)
);

ALTER TABLE public.submission_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own submission properties"
ON public.submission_properties
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own submission properties"
ON public.submission_properties
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submission properties"
ON public.submission_properties
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_submission_properties_updated_at
BEFORE UPDATE ON public.submission_properties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_submission_properties_user_created_at
ON public.submission_properties (user_id, created_at DESC);

CREATE INDEX idx_submission_properties_source_email
ON public.submission_properties (source_email_id)
WHERE source_email_id IS NOT NULL;