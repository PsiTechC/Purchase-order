CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    requester_name TEXT NOT NULL,
    project_name TEXT DEFAULT '',
    company_name TEXT DEFAULT '',
    product_name TEXT NOT NULL,
    product_url TEXT,
    product_description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    needed_by_date DATE,
    delivery_date DATE,
    order_address TEXT DEFAULT '',
    tracking_url TEXT DEFAULT '',
    order_status TEXT NOT NULL DEFAULT 'Pending',
    payment_status TEXT NOT NULL DEFAULT 'Unpaid',
    notes TEXT DEFAULT '',
    invoice_filename TEXT DEFAULT '',
    invoice_data TEXT DEFAULT '',
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_filename TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_data TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS project_name TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_address TEXT DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;
