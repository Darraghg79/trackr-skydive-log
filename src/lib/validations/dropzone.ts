import { z } from 'zod'

// Helper to transform empty strings to undefined for optional fields
const emptyStringToUndefined = z.string().transform((val) => val === '' ? undefined : val)

// NOTE: Only 'name' is required for dropzone creation to allow quick logbook entries.
// Currency validation is enforced at invoice creation time when a dropzone is selected.
// This allows users to add dropzones for simple jump logging without requiring all business details upfront.
export const DropzoneCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  city: emptyStringToUndefined.pipe(z.string().max(100, 'City must be less than 100 characters').optional()),
  address: emptyStringToUndefined.pipe(z.string().max(500, 'Address must be less than 500 characters').optional()),
  country: emptyStringToUndefined.pipe(z.string().max(100, 'Country must be less than 100 characters').optional()),
  contactName: emptyStringToUndefined.pipe(z.string().max(100, 'Contact name must be less than 100 characters').optional()),
  contactEmail: emptyStringToUndefined.pipe(z.string().email('Invalid email format').optional()),
  currency: emptyStringToUndefined.pipe(z.string().length(3, 'Currency must be exactly 3 characters (e.g., USD, EUR)').optional()),
  rateAFF: z.number().min(0, 'Rate must be 0 or greater').optional(),
  rateTandem: z.number().min(0, 'Rate must be 0 or greater').optional(),
  rateCamera: z.number().min(0, 'Rate must be 0 or greater').optional(),
  rateCoach: z.number().min(0, 'Rate must be 0 or greater').optional(),
  rateHandcam: z.number().min(0, 'Rate must be 0 or greater').optional(),
  taxRate: z.number().min(0, 'Tax rate must be 0 or greater').max(100, 'Tax rate cannot exceed 100%').optional(),
  isActive: z.boolean().default(true),
})

// For updates, all fields remain optional (only name has .min validation if provided)
export const DropzoneUpdateSchema = z.object({
  name: emptyStringToUndefined.pipe(z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional()),
  city: emptyStringToUndefined.pipe(z.string().max(100, 'City must be less than 100 characters').optional()),
  address: emptyStringToUndefined.pipe(z.string().max(500, 'Address must be less than 500 characters').optional()),
  country: emptyStringToUndefined.pipe(z.string().max(100, 'Country must be less than 100 characters').optional()),
  contactName: emptyStringToUndefined.pipe(z.string().max(100, 'Contact name must be less than 100 characters').optional()),
  contactEmail: emptyStringToUndefined.pipe(z.string().email('Invalid email format').optional()),
  currency: emptyStringToUndefined.pipe(z.string().length(3, 'Currency must be exactly 3 characters (e.g., USD, EUR)').optional()),
  rateAFF: z.number().min(0, 'Rate must be 0 or greater').optional(),
  rateTandem: z.number().min(0, 'Rate must be 0 or greater').optional(),
  rateCamera: z.number().min(0, 'Rate must be 0 or greater').optional(),
  rateCoach: z.number().min(0, 'Rate must be 0 or greater').optional(),
  rateHandcam: z.number().min(0, 'Rate must be 0 or greater').optional(),
  taxRate: z.number().min(0, 'Tax rate must be 0 or greater').max(100, 'Tax rate cannot exceed 100%').optional(),
  isActive: z.boolean().optional(),
})

export type DropzoneCreateInput = z.infer<typeof DropzoneCreateSchema>
export type DropzoneUpdateInput = z.infer<typeof DropzoneUpdateSchema>
