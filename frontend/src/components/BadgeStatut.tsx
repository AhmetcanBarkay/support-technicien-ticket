import { LIBELLE_STATUT, type StatutTicket } from "@shared/types/statutsTicket";

interface Props {
    statut: StatutTicket;
}

const classesParStatut: Record<StatutTicket, string> = {
    en_attente: "bg-yellow-100 text-yellow-800",
    en_cours: "bg-blue-100 text-blue-800",
    resolu: "bg-green-100 text-green-800",
    non_resolu: "bg-red-100 text-red-800"
};

function BadgeStatut({ statut }: Props) {
    return (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${classesParStatut[statut]}`}>
            {LIBELLE_STATUT[statut]}
        </span>
    );
}

export default BadgeStatut;