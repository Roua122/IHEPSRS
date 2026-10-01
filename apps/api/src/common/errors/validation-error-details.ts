import type { ValidationError } from "class-validator";

export interface ValidationIssue {
  field: string;
  constraints: string[];
}

export function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = "",
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const error of errors) {
    const field = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    const constraints = error.constraints
      ? Object.values(error.constraints)
      : [];

    if (constraints.length > 0) {
      issues.push({
        field,
        constraints,
      });
    }

    if (error.children?.length) {
      issues.push(...flattenValidationErrors(error.children, field));
    }
  }

  return issues;
}
