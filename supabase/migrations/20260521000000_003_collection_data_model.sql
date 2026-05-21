-- Create public.categories table
CREATE TABLE public.categories (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL CHECK (char_length(name_en) > 0),
  name_ar TEXT CHECK (name_ar IS NULL OR char_length(name_ar) > 0),
  parent_uuid UUID REFERENCES public.categories(uuid) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Prevent immediate self-referential parent assignment
  CONSTRAINT chk_no_self_parent CHECK (parent_uuid <> uuid)
);

-- Indexing for fast parent-child lookups
CREATE INDEX idx_categories_parent_uuid ON public.categories(parent_uuid);

-- Create public.items table
CREATE TABLE public.items (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id TEXT UNIQUE NOT NULL, -- Format: [CountryCode]-[SequentialNumber] (e.g. US-0001)
  type TEXT NOT NULL CONSTRAINT chk_item_type CHECK (type IN ('Coin', 'Banknote')),
  title_en TEXT NOT NULL CHECK (char_length(title_en) > 0),
  title_ar TEXT CHECK (title_ar IS NULL OR char_length(title_ar) > 0),
  description_en TEXT,
  description_ar TEXT,
  country_code VARCHAR(2) NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'), -- ISO 3166-1 alpha-2 (2 capital letters)
  denomination TEXT NOT NULL CHECK (char_length(denomination) > 0),
  year INT NOT NULL CHECK (year >= 0),
  acquisition_year INT CHECK (acquisition_year IS NULL OR acquisition_year >= 0),
  amount INT DEFAULT 1 NOT NULL CHECK (amount >= 0),
  visibility TEXT DEFAULT 'Public' NOT NULL CONSTRAINT chk_item_visibility CHECK (visibility IN ('Public', 'Private')),
  tags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  front_image TEXT,
  back_image TEXT,
  additional_images TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Indexing country code and visibility for filtering and gallery listings
CREATE INDEX idx_items_country_code ON public.items(country_code);
CREATE INDEX idx_items_visibility ON public.items(visibility);
CREATE INDEX idx_items_collection_id ON public.items(collection_id);

-- Create public.item_categories join table
CREATE TABLE public.item_categories (
  item_uuid UUID NOT NULL REFERENCES public.items(uuid) ON DELETE CASCADE,
  category_uuid UUID NOT NULL REFERENCES public.categories(uuid) ON DELETE CASCADE,
  PRIMARY KEY (item_uuid, category_uuid)
);

-- Indexing join mappings
CREATE INDEX idx_item_categories_item_uuid ON public.item_categories(item_uuid);
CREATE INDEX idx_item_categories_category_uuid ON public.item_categories(category_uuid);

-- 3-Level Category Nesting & Loop Prevention Function
CREATE OR REPLACE FUNCTION check_category_depth()
RETURNS TRIGGER AS $$
DECLARE
  current_depth INT := 1;
  temp_parent_uuid UUID := NEW.parent_uuid;
BEGIN
  -- Prevent direct self-reference
  IF NEW.uuid = NEW.parent_uuid THEN
    RAISE EXCEPTION 'Category cannot reference itself as parent.';
  END IF;

  -- Traverse hierarchy upward
  WHILE temp_parent_uuid IS NOT NULL LOOP
    -- If the parent is the category itself, a loop is detected
    IF temp_parent_uuid = NEW.uuid THEN
      RAISE EXCEPTION 'Circular reference detected in category hierarchy.';
    END IF;

    current_depth := current_depth + 1;
    IF current_depth > 3 THEN
      RAISE EXCEPTION 'Category hierarchy depth cannot exceed 3 levels.';
    END IF;
    SELECT parent_uuid INTO temp_parent_uuid FROM public.categories WHERE uuid = temp_parent_uuid;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_category_depth
BEFORE INSERT OR UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION check_category_depth();

-- Concurrent Sequential Collection ID Generation Function
CREATE OR REPLACE FUNCTION generate_collection_id()
RETURNS TRIGGER AS $$
DECLARE
  next_seq INT;
BEGIN
  -- Obtain transaction-level advisory lock on the country code hash to serialize same-country writes
  PERFORM pg_advisory_xact_lock(hashtext(NEW.country_code));

  -- Calculate the next sequence number for this country code
  -- Substrings after character 3 (skips [CC]- prefix) and casts to integer
  SELECT COALESCE(MAX(CAST(SUBSTRING(collection_id FROM 4) AS INT)), 0) + 1
  INTO next_seq
  FROM public.items
  WHERE country_code = NEW.country_code;

  -- Format collection_id (e.g. US-0001)
  NEW.collection_id := NEW.country_code || '-' || LPAD(next_seq::TEXT, 4, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_collection_id
BEFORE INSERT ON public.items
FOR EACH ROW EXECUTE FUNCTION generate_collection_id();

-- Automated updated_at Timestamps Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_items_updated_at
BEFORE UPDATE ON public.items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_categories ENABLE ROW LEVEL SECURITY;

-- Categories RLS Policies
-- Public read access to all categories
CREATE POLICY select_categories ON public.categories
  FOR SELECT TO public, anon
  USING (true);

-- Admin full access
CREATE POLICY admin_categories ON public.categories
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Items RLS Policies
-- Public read access to Public items only
CREATE POLICY select_public_items ON public.items
  FOR SELECT TO public, anon
  USING (visibility = 'Public');

-- Admin full access
CREATE POLICY admin_items ON public.items
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Item Categories RLS Policies
-- Public read access only for mappings referencing Public items
CREATE POLICY select_public_item_categories ON public.item_categories
  FOR SELECT TO public, anon
  USING (item_uuid IN (SELECT uuid FROM public.items WHERE visibility = 'Public'));

-- Admin full access
CREATE POLICY admin_item_categories ON public.item_categories
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
