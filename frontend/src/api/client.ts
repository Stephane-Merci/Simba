import axios from 'axios';
import { useAuth } from '../store/useAuth';

/**
 * URL de l'API. Par défaut « /api » (même origine : proxy Vite en dev, nginx ou
 * backend en prod). VITE_API_URL permet de pointer vers un backend séparé.
 */
export const API_URL: string = import.meta.env.VITE_API_URL || '/api';

/** Origine du serveur Socket.IO, déduite de l'URL de l'API. */
export const SOCKET_URL: string | undefined = /^https?:\/\//.test(API_URL)
    ? new URL(API_URL).origin
    : undefined;

const apiClient = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

// Jeton de session joint à chaque appel ; une session expirée renvoie à l'écran de connexion.
apiClient.interceptors.request.use((cfg) => {
    const jeton = useAuth.getState().jeton;
    if (jeton) cfg.headers.Authorization = `Bearer ${jeton}`;
    return cfg;
});

apiClient.interceptors.response.use(undefined, (e) => {
    if (axios.isAxiosError(e) && e.response?.status === 401 && !e.config?.url?.endsWith('/auth/connexion')) {
        useAuth.getState().fermer();
    }
    return Promise.reject(e);
});

/** Message lisible (en français) à partir d'une erreur d'appel API. */
export function messageErreur(e: unknown): string {
    if (axios.isAxiosError(e)) {
        const msg = (e.response?.data as { error?: unknown } | undefined)?.error;
        if (typeof msg === 'string') return msg;
        if (!e.response) return 'Serveur injoignable. Vérifiez la connexion.';
    }
    return 'Une erreur inattendue est survenue.';
}

export default apiClient;
