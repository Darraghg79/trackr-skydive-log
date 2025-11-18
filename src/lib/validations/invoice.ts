import { z } from 'zod'

export const InvoiceLineItemInputSchema = z.object({
  jumpId: z.string().uuid(),
  itemType: z.enum(['BASE_JUMP', 'HANDCAM_ADDON']),
  workJumpType: z.enum(['AFF', 'TANDEM', 'CAMERA', 'COACH']),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  lineTotal: z.number().min(0),
})

export const InvoiceCreateSchema = z.object({
  dropzoneId: z.string().uuid(),
  invoiceNumber: z.string().min(1).max(50),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
  subtotal: z.number().min(0),
  taxRate: z.number().min(0).max(100).optional(),
  taxAmount: z.number().min(0).optional(),
  total: z.number().min(0),
  currency: z.string().min(3).max(3),
  status: z.enum(['OPEN', 'SENT', 'PAID']).default('OPEN'),
  notes: z.string().max(2000).optional(),
  pdfUrl: z.string().url().optional(),
  lineItems: z.array(InvoiceLineItemInputSchema).min(1),
})

export const InvoiceUpdateSchema = z.object({
  invoiceDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  status: z.enum(['OPEN', 'SENT', 'PAID']).optional(),
  notes: z.string().max(2000).optional(),
  pdfUrl: z.string().url().optional(),
})

export type InvoiceLineItemInput = z.infer<typeof InvoiceLineItemInputSchema>
export type InvoiceCreateInput = z.infer<typeof InvoiceCreateSchema>
export type InvoiceUpdateInput = z.infer<typeof InvoiceUpdateSchema>
