export const USER_ROLES = ['ADMIN', 'OPERADOR'] as const;

export type UserRole = (typeof USER_ROLES)[number];
