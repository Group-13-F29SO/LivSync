/**
 * Password validation utility
 * Enforces password complexity rules
 */

export const PASSWORD_RULES = {
  minLength: 8,
  upperCase: /[A-Z]/,
  lowerCase: /[a-z]/,
  number: /[0-9]/,
  specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
};

export const getPasswordValidation = (password) => {
  return {
    minLength: password.length >= PASSWORD_RULES.minLength,
    upperCase: PASSWORD_RULES.upperCase.test(password),
    lowerCase: PASSWORD_RULES.lowerCase.test(password),
    number: PASSWORD_RULES.number.test(password),
    specialChar: PASSWORD_RULES.specialChar.test(password),
  };
};

export const isPasswordValid = (password) => {
  const validation = getPasswordValidation(password);
  return (
    validation.minLength &&
    validation.upperCase &&
    validation.lowerCase &&
    validation.number &&
    validation.specialChar
  );
};

export const getPasswordRulesDisplay = () => [
  {
    rule: 'At least 8 characters',
    key: 'minLength',
  },
  {
    rule: 'One uppercase letter (A-Z)',
    key: 'upperCase',
  },
  {
    rule: 'One lowercase letter (a-z)',
    key: 'lowerCase',
  },
  {
    rule: 'One number (0-9)',
    key: 'number',
  },
  {
    rule: 'One special character (!@#$%^&*...)',
    key: 'specialChar',
  },
];
