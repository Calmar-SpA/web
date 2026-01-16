-- Discount Codes Schema

-- 1. Discount Codes
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase_amount DECIMAL(10,2),
  max_discount_amount DECIMAL(10,2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  first_purchase_only BOOLEAN DEFAULT false,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_active ON discount_codes(is_active);
CREATE INDEX idx_discount_codes_dates ON discount_codes(starts_at, expires_at);

-- 2. Discount Code Products (optional restriction)
CREATE TABLE discount_code_products (
  discount_code_id UUID REFERENCES discount_codes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (discount_code_id, product_id)
);

-- 3. Discount Code Users (optional restriction)
CREATE TABLE discount_code_users (
  discount_code_id UUID REFERENCES discount_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (discount_code_id, user_id)
);

-- 4. Discount Code Usages
CREATE TABLE discount_code_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID REFERENCES discount_codes(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  discount_applied DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discount_code_usages_code ON discount_code_usages(discount_code_id);
CREATE INDEX idx_discount_code_usages_user ON discount_code_usages(user_id);

-- 5. Orders: reference to discount code
ALTER TABLE orders
ADD COLUMN discount_code_id UUID REFERENCES discount_codes(id);
