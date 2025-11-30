// lib/validation/categories.ts
import { z } from 'zod';

export const CategoryKind = z.enum(['income', 'expense', 'transfer']);
export type CategoryKind = z.infer<typeof CategoryKind>;

export const CategoryCreateSchema = z.object({
  name: z.string().min(1).max(60).trim(),
  kind: CategoryKind,
});

export const CategoryRenameSchema = z.object({
  name: z.string().min(1).max(60).trim(),
});

