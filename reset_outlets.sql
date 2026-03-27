-- ==============================================================================
-- BROWNS CAFE - RESET AND IMPORT NEW OUTLETS
-- Execute this SQL in your Supabase SQL Editor.
-- ==============================================================================

-- 1. Clear all existing outlets
-- IMPORTANT: The CASCADE keyword will automatically delete ALL transaction 
-- logs and opening balances associated with the old outlets!
TRUNCATE TABLE public.outlets CASCADE;

-- 2. Insert the new master list of outlets
INSERT INTO public.outlets (name) VALUES
('RED CROSS'),
('TECNO'),
('6TH FLOOR'),
('EY'),
('PARKLAND'),
('AKBAR'),
('BRITISH HIGH COMMIS'),
('BRITISH COUNCIL'),
('MUSEE'),
('WSO 2'),
('MUSEE 2'),
('BAKERY'),
('CAKE');

-- 3. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
