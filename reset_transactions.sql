-- ==============================================================================
-- BROWNS CAFE - RESET ALL TRANSACTIONS AND BALANCES
-- Execute this SQL in your Supabase SQL Editor.
-- ==============================================================================

-- 1. Clear all transaction logs across the project
TRUNCATE TABLE public.grn_log;
TRUNCATE TABLE public.issue_log;
TRUNCATE TABLE public.adj_log;
TRUNCATE TABLE public.usage_log;

-- 2. Clear opening balances (to start completely fresh with 0 everywhere)
TRUNCATE TABLE public.opening_balances;

-- 3. Ensure the March 2026 period is still open for testing
INSERT INTO public.accounting_periods (label, month, year, status)
VALUES ('MAR 2026', 'MAR', 2026, 'open')
ON CONFLICT (month, year) 
DO UPDATE SET status = 'open', closed_at = NULL;

-- 4. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
