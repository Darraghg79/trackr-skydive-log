import { z } from 'zod'

export const DropzoneCreateSchema = z.object({
  name: z.string().min(1).max(100),
  city: z.string().max(100).optional(),
  address: z.string().min(1).max(500),
  country: z.string().min(1).max(100),
  contactName: z.string().max(100).optional(),
  contactEmail: z.string().email().optional(),
  currency: z.string().min(3).max(3),
  rateAFF: z.number().min(0).optional(),
  rateTandem: z.number().min(0).optional(),
  rateCamera: z.number().min(0).optional(),
  rateCoach: z.number().min(0).optional(),
  rateHandcam: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  isActive: z.boolean().default(true),
})

export const DropzoneUpdateSchema = DropzoneCreateSchema.partial()

export type DropzoneCreateInput = z.infer<typeof DropzoneCreateSchema>
export type DropzoneUpdateInput = z.infer<typeof DropzoneUpdateSchema>
