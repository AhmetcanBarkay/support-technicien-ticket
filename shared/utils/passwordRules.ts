export const PASSWORD_MAX_LENGTH = 100;

export interface PasswordRuleCheck {
    label: string;
    valid: boolean;
}

export function getPasswordRuleChecks(password: string): PasswordRuleCheck[] {
    return [
        {
            label: "10 caractères minimum",
            valid: password.length >= 10
        },
        {
            label: "100 caractères maximum",
            valid: password.length <= PASSWORD_MAX_LENGTH
        },
        {
            label: "1 majuscule",
            valid: /\p{Lu}/u.test(password)
        },
        {
            label: "1 chiffre",
            valid: /\p{Nd}/u.test(password)
        },
        {
            label: "1 caractère spécial",
            valid: /[^\p{L}\p{N}\s]/u.test(password)
        }
    ];
}

export function getPasswordRulesErrors(password: string): string[] {
    return getPasswordRuleChecks(password)
        .filter(rule => !rule.valid)
        .map(rule => rule.label);
}

export function isPasswordValid(password: string): boolean {
    return getPasswordRulesErrors(password).length === 0;
}
