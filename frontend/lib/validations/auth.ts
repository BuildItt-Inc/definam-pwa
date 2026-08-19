import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .refine((val) => !/\s/.test(val), 'Username cannot contain spaces'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ── SCR-03d · Admin Login ──────────────────────────────────────────────────

export const adminLoginSchema = z.object({
  username: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

export const changePasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(1, 'New password is required')
      .min(8, 'Password must be at least 8 characters')
      .refine((val) => /[A-Z]/.test(val), {
        message: 'Password must contain at least one uppercase letter',
      })
      .refine((val) => /[0-9]/.test(val), {
        message: 'Password must contain at least one number',
      }),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

// ── SCR-02a-ii · Individual Registration ──────────────────────────────────

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(1, 'Username is required')
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username cannot exceed 20 characters')
      .refine((val) => !/\s/.test(val), {
        message: 'Username cannot contain spaces',
      })
      .refine((val) => /^[a-zA-Z0-9_]+$/.test(val), {
        message: 'Username can only contain letters, numbers, and underscores',
      }),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .refine((val) => /[A-Z]/.test(val), {
        message: 'Password must contain at least one uppercase letter',
      })
      .refine((val) => /[0-9]/.test(val), {
        message: 'Password must contain at least one number',
      }),
    confirm_password: z.string().min(1, 'Please confirm your password'),
    access_code: z
      .string()
      .min(1, 'Access code is required')
      .transform((val) => val.trim().toUpperCase())
      .refine((val) => /^[A-Z0-9]{2,5}-[A-Z0-9]{3,6}-[A-Z0-9]{2,6}$/.test(val), {
        message: 'Invalid access code format',
      }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

// ── SCR-03b · Org Student Code Entry ──────────────────────────────────────

export const orgLoginSchema = z.object({
  access_code: z
    .string()
    .min(1, 'Access code is required')
    .transform((val) => val.trim().toUpperCase())
    .refine((val) => /^[A-Z0-9]{2,5}-[A-Z0-9]{3,6}-[A-Z0-9]{2,6}$/.test(val), {
      message: 'Invalid access code format',
    }),
  student_name: z
    .string()
    .max(100, 'Name cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
});

export type OrgLoginFormValues = z.infer<typeof orgLoginSchema>;

// ── Password Reset ────────────────────────────────────────────────────────

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
