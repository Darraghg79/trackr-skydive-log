import { z } from 'zod'

export const UserAircraftCreateSchema = z.object({
  name: z.string().min(1).max(100),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

export const UserAircraftUpdateSchema = UserAircraftCreateSchema.partial()

export type UserAircraftCreateInput = z.infer<typeof UserAircraftCreateSchema>
export type UserAircraftUpdateInput = z.infer<typeof UserAircraftUpdateSchema>
