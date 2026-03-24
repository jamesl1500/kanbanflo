import { z } from "zod"

export const UsernameFormSchema = z.object({
  userName: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Username can only contain lowercase letters, numbers, and underscores"
    ),
})

export type UsernameFormData = z.infer<typeof UsernameFormSchema>
