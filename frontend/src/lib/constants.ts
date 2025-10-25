export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data'
} as const;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
