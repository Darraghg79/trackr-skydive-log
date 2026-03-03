import { z } from 'zod'

export const UserProfileUpdateSchema = z.object({
  name: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(50).optional(),
  taxRegistrationNumber: z.string().max(50).optional(),
  remittanceDetails: z.string().max(1000).optional(),
  licenseNumber: z.string().max(50).optional(),
  unitPreference: z.enum(['METRIC', 'IMPERIAL']).optional(),
  currentJumpNumber: z.number().int().min(1).optional(),
  startingFreefallTime: z.number().int().min(0).optional(),
  startingCutaways: z.number().int().min(0).optional(),
  invoiceStartingNumber: z.number().int().min(1).optional(),
  brandingLogo: z.string().url().optional(),
  brandingCompanyName: z.string().max(100).optional(),
  brandingPrimaryColor: z.string().max(20).optional(),
  brandingInvoiceFooter: z.string().max(500).optional(),
  defaultDropzoneId: z.string().uuid().nullable().optional(),
  defaultExitAltitude: z.number().int().min(0).nullable().optional(),
  defaultDeploymentAltitude: z.number().int().min(0).nullable().optional(),
  hasCompletedOnboarding: z.boolean().optional(),
  isWorkingSkydiver: z.boolean().optional(),
})

export type UserProfileUpdateInput = z.infer<typeof UserProfileUpdateSchema>
