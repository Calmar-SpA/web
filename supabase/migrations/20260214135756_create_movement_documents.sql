-- Create movement_documents table
CREATE TABLE movement_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movement_id UUID NOT NULL REFERENCES product_movements(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('factura', 'boleta', 'guia_despacho', 'nota_credito', 'nota_debito')),
    document_url TEXT NOT NULL,
    document_number TEXT,
    document_date DATE DEFAULT CURRENT_DATE,
    is_current BOOLEAN DEFAULT TRUE,
    email_sent_at TIMESTAMPTZ,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_movement_documents_movement_id ON movement_documents(movement_id);
CREATE INDEX idx_movement_documents_type_current ON movement_documents(movement_id, document_type, is_current);

-- Enable RLS
ALTER TABLE movement_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can do everything
CREATE POLICY "Admins can do everything on movement_documents"
    ON movement_documents
    FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Users can view documents for movements they have access to (via prospect or direct assignment)
CREATE POLICY "Users can view documents for their movements"
    ON movement_documents
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM product_movements pm
            LEFT JOIN prospects p ON pm.prospect_id = p.id
            WHERE pm.id = movement_documents.movement_id
            AND (
                -- User is the customer
                pm.customer_user_id = auth.uid()
                OR
                -- User is associated with the prospect
                p.user_id = auth.uid()
            )
        )
    );

-- Function to handle is_current logic
CREATE OR REPLACE FUNCTION handle_movement_document_current()
RETURNS TRIGGER AS $$
BEGIN
    -- If the new document is marked as current
    IF NEW.is_current THEN
        -- Set all other documents of the same type for this movement to not current
        UPDATE movement_documents
        SET is_current = FALSE
        WHERE movement_id = NEW.movement_id
        AND document_type = NEW.document_type
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain single current document per type
CREATE TRIGGER trigger_movement_document_current
    AFTER INSERT OR UPDATE OF is_current ON movement_documents
    FOR EACH ROW
    WHEN (NEW.is_current = TRUE)
    EXECUTE FUNCTION handle_movement_document_current();

-- Migrate existing data
DO $$
DECLARE
    movement RECORD;
BEGIN
    FOR movement IN 
        SELECT id, movement_type, invoice_url, invoice_date, invoice_email_sent_at, 
               dispatch_order_url, dispatch_order_date, dispatch_order_email_sent_at, created_by
        FROM product_movements
        WHERE invoice_url IS NOT NULL OR dispatch_order_url IS NOT NULL
    LOOP
        -- Migrate Invoice/Boleta
        IF movement.invoice_url IS NOT NULL THEN
            INSERT INTO movement_documents (
                movement_id,
                document_type,
                document_url,
                document_date,
                email_sent_at,
                created_by,
                is_current
            ) VALUES (
                movement.id,
                CASE 
                    WHEN movement.movement_type = 'sale_boleta' THEN 'boleta'
                    ELSE 'factura'
                END,
                movement.invoice_url,
                COALESCE(movement.invoice_date, CURRENT_DATE),
                movement.invoice_email_sent_at,
                movement.created_by,
                TRUE
            );
        END IF;

        -- Migrate Dispatch Order
        IF movement.dispatch_order_url IS NOT NULL THEN
            INSERT INTO movement_documents (
                movement_id,
                document_type,
                document_url,
                document_date,
                email_sent_at,
                created_by,
                is_current
            ) VALUES (
                movement.id,
                'guia_despacho',
                movement.dispatch_order_url,
                COALESCE(movement.dispatch_order_date, CURRENT_DATE),
                movement.dispatch_order_email_sent_at,
                movement.created_by,
                TRUE
            );
        END IF;
    END LOOP;
END;
$$;
