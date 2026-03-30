const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const AUTH_INVALID_EVENT = 'app:auth-invalide';

type MethodeHttp = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface OptionsRequete<T = unknown> {
    methode?: MethodeHttp;
    headers?: Record<string, string>;
    corps?: T;
}

interface RetourRequete<R = unknown> {
    statut: number | undefined;
    donnees?: R;
    erreur?: string;
}

function extraireRaison(data: unknown): string {
    if (!data || typeof data !== 'object') return '';
    const raison = (data as { reason?: unknown }).reason;
    return typeof raison === 'string' ? raison : '';
}

function devraitDeconnecter(statut: number | undefined, data: unknown, avaitToken: boolean): boolean {
    if (!avaitToken) return false;
    const raison = extraireRaison(data).toLowerCase();
    return statut === 401 ||
        raison.includes('token invalide') ||
        raison.includes('authentification requise') ||
        raison.includes('non authentifié');
}

function deconnecterForce() {
    localStorage.removeItem('token');
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(AUTH_INVALID_EVENT));
    }
}

async function requete<R, T = unknown>(
    endpoint: string,
    options: OptionsRequete<T> = {}
): Promise<RetourRequete<R>> {
    const { methode = 'GET', headers = {}, corps } = options;

    const token = localStorage.getItem('token');
    const avaitToken = Boolean(token);
    const headersAuth: Record<string, string> = token
        ? { 'Authorization': `Bearer ${token}` }
        : {};

    const config: RequestInit = {
        method: methode,
        headers: {
            'Content-Type': 'application/json',
            ...headersAuth,
            ...headers
        }
    };

    if (corps !== undefined) {
        config.body = JSON.stringify(corps);
    }

    let donnees: R | undefined;
    let statut: number | undefined;
    let erreur: string | undefined;

    try {
        const reponse = await fetch(`${API_BASE_URL}${endpoint}`, config);
        statut = reponse.status;

        const texte = await reponse.text();
        if (texte.length > 0) {
            try {
                donnees = JSON.parse(texte) as R;
            } catch {
                erreur = 'Réponse invalide du serveur';
            }
        }

        if (devraitDeconnecter(statut, donnees, avaitToken)) {
            deconnecterForce();
        }
    } catch (err: unknown) {
        erreur = err instanceof Error ? err.message : 'Erreur réseau';
    }

    return { statut, donnees, erreur };
}

export const api = {
    get: <R>(endpoint: string, headers?: Record<string, string>) =>
        requete<R>(endpoint, { methode: 'GET', headers }),

    post: <T, R>(endpoint: string, corps: T, headers?: Record<string, string>) =>
        requete<R, T>(endpoint, { methode: 'POST', corps, headers }),

    put: <T, R>(endpoint: string, corps: T, headers?: Record<string, string>) =>
        requete<R, T>(endpoint, { methode: 'PUT', corps, headers }),

    delete: <R>(endpoint: string, headers?: Record<string, string>) =>
        requete<R>(endpoint, { methode: 'DELETE', headers })
};
