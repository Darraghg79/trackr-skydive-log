import { z } from 'zod'

export const GearComponentCreateSchema = z.object({
  type: z.enum(['MAIN', 'RESERVE', 'AAD', 'CONTAINER', 'OTHER']),
  name: z.string().min(1).max(100),
  manufacturer: z.string().min(1).max(100),
  model: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  previousJumpCount: z.number().int().min(0).default(0),
  serviceDate: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
})

export const GearComponentUpdateSchema = GearComponentCreateSchema.partial()

export type GearComponentCreateInput = z.infer<typeof GearComponentCreateSchema>
export type GearComponentUpdateInput = z.infer<typeof GearComponentUpdateSchema>
