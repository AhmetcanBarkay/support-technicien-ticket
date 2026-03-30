import type { commentaireItem } from '@shared/types/api/technicienApi';
import { formatDateHeure } from '../utils/formatDateHeure';

interface Props {
    commentaires: commentaireItem[];
    mode?: 'utilisateur' | 'technicien';
    messageVide?: string;
}

function ListeCommentairesTicket({
    commentaires,
    mode = 'technicien',
    messageVide = 'Aucun commentaire.'
}: Props) {
    if (commentaires.length === 0) {
        return <p className="text-xs text-gray-400">{messageVide}</p>;
    }

    if (mode === 'utilisateur') {
        return (
            <ul className="space-y-3">
                {commentaires.map(c => (
                    <li
                        key={c.id}
                        className={`rounded-lg p-3 text-sm ${c.role_auteur === 'technicien'
                            ? 'bg-blue-50 border border-blue-100'
                            : 'bg-gray-50 border border-gray-100'
                            }`}
                    >
                        <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                            <span className="font-medium text-gray-600">
                                {c.username_auteur}
                                {c.role_auteur === 'technicien' && (
                                    <span className="ml-1 text-blue-500">(technicien)</span>
                                )}
                            </span>
                            <span>{formatDateHeure(c.date_envoi)}</span>
                        </div>
                        <p className="text-gray-700">{c.contenu}</p>
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <ul className="space-y-2 max-h-48 overflow-y-auto">
            {commentaires.map(c => (
                <li key={c.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                    <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                        <span className="font-medium text-gray-600">{c.username_auteur}</span>
                        <span>{formatDateHeure(c.date_envoi)}</span>
                    </div>
                    <p className="text-gray-700">{c.contenu}</p>
                </li>
            ))}
        </ul>
    );
}

export default ListeCommentairesTicket;