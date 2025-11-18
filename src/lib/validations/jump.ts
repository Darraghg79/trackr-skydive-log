import { z } from 'zod'

export const JumpCreateSchema = z.object({
  jumpNumber: z.number().int().min(1),
  date: z.coerce.date(),
  dropzoneId: z.string().uuid(),
  aircraftId: z.string().uuid().optional(),
  jumpTypeId: z.string().uuid().optional(),
  rigId: z.string().uuid().optional(),
  exitAltitude: z.number().int().min(0).optional(),
  deploymentAltitude: z.number().int().min(0).optional(),
  freefallTime: z.number().int().min(0).optional(),
  isCutaway: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
  photoUrl: z.string().url().optional(),
  isWorkJump: z.boolean().default(false),
  workJumpType: z.enum(['AFF', 'TANDEM', 'CAMERA', 'COACH']).optional(),
  customerName: z.string().max(100).optional(),
  hasHandcam: z.boolean().default(false),
  gearComponentIds: z.array(z.string().uuid()).optional(),
})

export const JumpUpdateSchema = JumpCreateSchema.partial()

export const JumpSignatureSchema = z.object({
  signerLicenseNumber: z.string().min(1).max(50),
  signatureImage: z.string().min(1),
})

export type JumpCreateInput = z.infer<typeof JumpCreateSchema>
export type JumpUpdateInput = z.infer<typeof JumpUpdateSchema>
export type JumpSignatureInput = z.infer<typeof JumpSignatureSchema>
