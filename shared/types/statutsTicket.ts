export type StatutTicket = "en_attente" | "en_cours" | "resolu" | "non_resolu";

export const STATUTS_TICKET: StatutTicket[] = [
    "en_attente",
    "en_cours",
    "resolu",
    "non_resolu"
];

export const LIBELLE_STATUT: Record<StatutTicket, string> = {
    en_attente: "En attente d'un technicien",
    en_cours: "En cours de traitement",
    resolu: "Résolu",
    non_resolu: "Non résolu"
};
