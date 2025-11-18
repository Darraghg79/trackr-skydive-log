import { z } from 'zod'

export const RigCreateSchema = z.object({
  name: z.string().min(1).max(100),
  isActive: z.boolean().default(true),
  componentIds: z.array(z.string().uuid()).optional(),
})

export const RigUpdateSchema = RigCreateSchema.partial()

export type RigCreateInput = z.infer<typeof RigCreateSchema>
export type RigUpdateInput = z.infer<typeof RigUpdateSchema>
