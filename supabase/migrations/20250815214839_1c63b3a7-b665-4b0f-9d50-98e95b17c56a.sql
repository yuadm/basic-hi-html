
-- 1) Versioning and lifecycle on questionnaires
ALTER TABLE public.compliance_questionnaires
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS effective_from date DEFAULT (now())::date,
  ADD COLUMN IF NOT EXISTS effective_to date,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Backfill effective_from for existing rows
UPDATE public.compliance_questionnaires
SET effective_from = COALESCE(effective_from, (now())::date)
WHERE effective_from IS NULL;

-- 2) Enforce only one active questionnaire per (type, branch)
-- When branch_id is not null
CREATE UNIQUE INDEX IF NOT EXISTS uq_cq_active_per_type_branch
ON public.compliance_questionnaires (compliance_type_id, branch_id)
WHERE is_active = true AND deleted_at IS NULL AND effective_to IS NULL AND branch_id IS NOT NULL;

-- When branch_id is null (global)
CREATE UNIQUE INDEX IF NOT EXISTS uq_cq_active_per_type_global
ON public.compliance_questionnaires (compliance_type_id)
WHERE is_active = true AND deleted_at IS NULL AND effective_to IS NULL AND branch_id IS NULL;

-- 3) Version uniqueness
-- When branch_id is not null
CREATE UNIQUE INDEX IF NOT EXISTS uq_cq_version_per_type_branch
ON public.compliance_questionnaires (compliance_type_id, branch_id, version)
WHERE branch_id IS NOT NULL;

-- When branch_id is null (global)
CREATE UNIQUE INDEX IF NOT EXISTS uq_cq_version_per_type_global
ON public.compliance_questionnaires (compliance_type_id, version)
WHERE branch_id IS NULL;

-- 4) Richer question metadata + soft delete
ALTER TABLE public.compliance_questions
  ADD COLUMN IF NOT EXISTS section text,
  ADD COLUMN IF NOT EXISTS help_text text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
