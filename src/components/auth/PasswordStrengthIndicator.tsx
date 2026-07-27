import React from 'react';
import { Check, X } from 'lucide-react';
import { getPasswordValidation, PASSWORD_REQUIREMENTS } from '@/lib/password-validation';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const strengthColors = [
  'bg-gray-200',
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-green-600',
];

const strengthTextColors = [
  'text-gray-500',
  'text-red-600',
  'text-orange-600',
  'text-yellow-600',
  'text-lime-600',
  'text-green-700',
];

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
}) => {
  const { checks, score, label } = getPasswordValidation(password);

  if (!password) return null;

  return (
    <div className="space-y-2 pt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              score >= level ? strengthColors[score] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${strengthTextColors[score]}`}>
        Strength: {label}
      </p>
      <ul className="space-y-1">
        {PASSWORD_REQUIREMENTS.map(({ key, label: reqLabel }) => {
          const passed = checks[key];
          return (
            <li
              key={key}
              className={`flex items-center gap-1.5 text-xs ${
                passed ? 'text-green-700' : 'text-gray-500'
              }`}
            >
              {passed ? (
                <Check className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <X className="h-3.5 w-3.5 shrink-0" />
              )}
              {reqLabel}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
