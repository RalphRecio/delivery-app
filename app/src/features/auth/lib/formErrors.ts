import type { z } from 'zod';

/** Field path → first message, the shape the forms render from. */
export type FieldErrors = Record<string, string>;

export function flattenIssues(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.');

    if (!(path in errors)) {
      errors[path] = issue.message;
    }
  }

  return errors;
}
