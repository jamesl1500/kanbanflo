import { z } from "zod"

export const ProfileFormSchema = z.object({
  bio: z
    .string()
    .max(280, "Bio must be at most 280 characters")
    .optional()
    .or(z.literal("")),
})

export type ProfileFormData = z.infer<typeof ProfileFormSchema>
