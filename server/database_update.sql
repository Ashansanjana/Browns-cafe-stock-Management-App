-- ==============================================================================
-- BROWNS CAFE - LOG-BASED INVENTORY SYSTEM EXPORT (V2: USING FOREIGN KEYS)
-- Execute this SQL in your Supabase SQL Editor.
-- ==============================================================================

-- Ensure the existing Items table has the new fields our UI needs
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS item_code VARCHAR(50);
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 5;

-- 1. GRN LOG (Goods Received into Main Store)
CREATE TABLE IF NOT EXISTS public.grn_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    qty NUMERIC NOT NULL CHECK (qty > 0),
    supplier VARCHAR(255),
    ref_invoice VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ISSUE LOG (Main Store to Outlets)
CREATE TABLE IF NOT EXISTS public.issue_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    week_no INTEGER NOT NULL,
    month VARCHAR(20) NOT NULL,
    year INTEGER NOT NULL,
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE,
    qty NUMERIC NOT NULL CHECK (qty > 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ADJ LOG (Stock Adjustments via Physical Count)
CREATE TABLE IF NOT EXISTS public.adj_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    system_count NUMERIC NOT NULL,
    physical_count NUMERIC NOT NULL,
    adjustment NUMERIC NOT NULL, -- (physical_count - system_count)
    counted_by VARCHAR(100),
    verified_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. OPENING BALANCES (Initial stock before the new logs)
DROP TABLE IF EXISTS public.opening_balances CASCADE;

CREATE TABLE public.opening_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    qty NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(outlet_id, item_id)
);

-- 5. USAGE LOG (Daily/Weekly internal usage by outlet)
CREATE TABLE IF NOT EXISTS public.usage_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    qty NUMERIC NOT NULL CHECK (qty > 0),
    logged_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Force PostgREST API to refresh its schema cache (Supabase specific)
NOTIFY pgrst, 'reload schema';
