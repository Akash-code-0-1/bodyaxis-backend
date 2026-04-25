import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const signUp = z.object({
  body: z
    .object({
      fullName: z.string().min(2, 'Full name is required').max(80),
      email: z.string().email().toLowerCase(),
      password: passwordSchema,
      confirmPassword: z.string(),
      dateOfBirth: z.string().optional(),
      gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: 'Password and confirm password do not match',
      path: ['confirmPassword'],
    }),
});

const signIn = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(1, 'Password is required'),
  }),
});

const refreshToken = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const authValidation = {
  signUp,
  signIn,
  refreshToken,
};