-- Ad-hoc invoice lines (F-INVOICE-ADHOC-LINE)
-- Adds support for manual/free-text invoice lines not tied to a jump.

-- AlterEnum: new line item type for ad-hoc charges
ALTER TYPE "InvoiceLineItemType" ADD VALUE IF NOT EXISTS 'ADHOC';

-- AlterTable: allow jump-less lines and add a free-text description
ALTER TABLE "invoice_line_items" ALTER COLUMN "jumpId" DROP NOT NULL;
ALTER TABLE "invoice_line_items" ALTER COLUMN "workJumpType" DROP NOT NULL;
ALTER TABLE "invoice_line_items" ADD COLUMN IF NOT EXISTS "description" TEXT;
