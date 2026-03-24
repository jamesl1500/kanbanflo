/**
 * SignupForm schema
 * 
 * This schema defines the structure and validation rules for the signup form data.
 * 
 * Fields:
 * - firstName: string, required, minimum length of 2 characters
 * - lastName: string, required, minimum length of 2 characters
 * - email: string, required, must be a valid email format
 * - password: string, required, minimum length of 8 characters
 * 
 * @module lib/schemas/auth/SignupForm
 */
import { z } from "zod"

export const SignupFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export type SignupFormData = z.infer<typeof SignupFormSchema>