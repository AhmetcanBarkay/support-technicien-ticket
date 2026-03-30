import type { baseResponse } from "./baseApi.js";

// --- Types des items ---

export interface technicienItem {
    id: number;
    username: string;
    date_creation: string;
}

// --- Corps des requêtes ---

export interface createTechnicienBody {
    username: string;
}

export interface deleteTechnicienBody {
    username: string;
}

// --- Réponses ---

export interface technicienListResponse extends baseResponse {
    techniciens?: technicienItem[];
}

export interface createTechnicienResponse extends baseResponse {
    id?: number;
    generatedPassword?: string;
}
