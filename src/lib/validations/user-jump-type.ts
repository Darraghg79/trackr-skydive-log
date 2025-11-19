import { z } from 'zod'

export const UserJumpTypeCreateSchema = z.object({
  name: z.string().min(1).max(50),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

export const UserJumpTypeUpdateSchema = UserJumpTypeCreateSchema.partial()

export type UserJumpTypeCreateInput = z.infer<typeof UserJumpTypeCreateSchema>
export type UserJumpTypeUpdateInput = z.infer<typeof UserJumpTypeUpdateSchema>
