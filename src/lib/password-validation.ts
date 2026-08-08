export interface PasswordChecks {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export interface PasswordValidation {
  checks: PasswordChecks;
  isValid: boolean;
  score: number; // 0-5
  label: 'Too weak' | 'Weak' | 'Fair' | 'Good' | 'Strong' | '';
}

export const PASSWORD_REQUIREMENTS = [
  { key: 'minLength' as const, label: 'At least 8 characters' },
  { key: 'hasUppercase' as const, label: 'One uppercase letter' },
  { key: 'hasLowercase' as const, label: 'One lowercase letter' },
  { key: 'hasNumber' as const, label: 'One number' },
  { key: 'hasSpecial' as const, label: 'One special character (!@#$%^&* etc.)' },
];

export function getPasswordValidation(password: string): PasswordValidation {
  const checks: PasswordChecks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const isValid = score === 5;

  let label: PasswordValidation['label'] = '';
  if (!password) label = '';
  else if (score <= 1) label = 'Too weak';
  else if (score === 2) label = 'Weak';
  else if (score === 3) label = 'Fair';
  else if (score === 4) label = 'Good';
  else label = 'Strong';

  return { checks, isValid, score, label };
}
