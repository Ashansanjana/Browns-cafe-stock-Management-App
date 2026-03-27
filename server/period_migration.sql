-- ==============================================================================
-- BROWNS CAFE - MONTH-END CLOSE MIGRATION
-- Execute this SQL in your Supabase SQL Editor (run AFTER existing schema).
-- ==============================================================================

-- 1. Create accounting_periods table
CREATE TABLE IF NOT EXISTS public.accounting_periods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    label VARCHAR(50) NOT NULL,       -- e.g. "MAR 2026"
    month VARCHAR(20) NOT NULL,       -- e.g. "MAR"
    year INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(month, year)
);

-- 2. Add period_id to all log tables
ALTER TABLE public.grn_log   ADD COLUMN IF NOT EXISTS period_id UUID REFERENCES public.accounting_periods(id) ON DELETE SET NULL;
ALTER TABLE public.issue_log ADD COLUMN IF NOT EXISTS period_id UUID REFERENCES public.accounting_periods(id) ON DELETE SET NULL;
ALTER TABLE public.adj_log   ADD COLUMN IF NOT EXISTS period_id UUID REFERENCES public.accounting_periods(id) ON DELETE SET NULL;
ALTER TABLE public.usage_log ADD COLUMN IF NOT EXISTS period_id UUID REFERENCES public.accounting_periods(id) ON DELETE SET NULL;

-- 3. Add period_id to opening_balances and update unique constraint
ALTER TABLE public.opening_balances ADD COLUMN IF NOT EXISTS period_id UUID REFERENCES public.accounting_periods(id) ON DELETE SET NULL;
ALTER TABLE public.opening_balances DROP CONSTRAINT IF EXISTS opening_balances_outlet_id_item_id_key;
ALTER TABLE public.opening_balances ADD CONSTRAINT opening_balances_unique_per_period UNIQUE(outlet_id, item_id, period_id);

-- 4. Seed the initial "open" period for this month
INSERT INTO public.accounting_periods (label, month, year, status)
VALUES ('MAR 2026', 'MAR', 2026, 'open')
ON CONFLICT (month, year) DO NOTHING;

-- 5. Assign ALL existing logs to this initial period
UPDATE public.grn_log
SET period_id = (SELECT id FROM public.accounting_periods WHERE month = 'MAR' AND year = 2026)
WHERE period_id IS NULL;

UPDATE public.issue_log
SET period_id = (SELECT id FROM public.accounting_periods WHERE month = 'MAR' AND year = 2026)
WHERE period_id IS NULL;

UPDATE public.adj_log
SET period_id = (SELECT id FROM public.accounting_periods WHERE month = 'MAR' AND year = 2026)
WHERE period_id IS NULL;

UPDATE public.usage_log
SET period_id = (SELECT id FROM public.accounting_periods WHERE month = 'MAR' AND year = 2026)
WHERE period_id IS NULL;

UPDATE public.opening_balances
SET period_id = (SELECT id FROM public.accounting_periods WHERE month = 'MAR' AND year = 2026)
WHERE period_id IS NULL;

-- 6. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
