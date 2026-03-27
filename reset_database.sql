-- ==============================================================================
-- BROWNS CAFE - COMPLETE DATABASE RESET FOR NEW ITEMS
-- Execute this SQL in your Supabase SQL Editor.
-- ==============================================================================

-- 1. Clear all items. 
-- IMPORTANT: The CASCADE keyword will automatically delete ALL related 
-- GRN logs, Issue logs, Adjustments, Usage logs, and Opening Balances!
TRUNCATE TABLE public.items CASCADE;

-- 2. Clear all accounting periods to restart fresh.
TRUNCATE TABLE public.accounting_periods CASCADE;

-- 3. Set up the starting period for March 2026
INSERT INTO public.accounting_periods (label, month, year, status)
VALUES ('MAR 2026', 'MAR', 2026, 'open');

-- 4. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
