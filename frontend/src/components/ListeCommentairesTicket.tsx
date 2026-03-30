import type { commentaireItem } from '@shared/types/api/technicienApi';
import { formatDateHeure } from '../utils/formatDateHeure';

interface Props {
    commentaires: commentaireItem[];
    mode?: 'utilisateur' | 'technicien';
    messageVide?: string;
}

function getLibelleRole(role: string): string {
    if (role === 'technicien') return 'Technicien';
    if (role === 'utilisateur') return 'Utilisateur';
    return role;
}

function getClassesRole(role: string): string {
    if (role === 'technicien') return 'bg-blue-100 text-blue-700';
    if (role === 'utilisateur') return 'bg-gray-200 text-gray-700';
    return 'bg-gray-200 text-gray-700';
}

function ListeCommentairesTicket({
    commentaires,
    mode = 'technicien',
    messageVide = 'Aucun commentaire.'
}: Props) {
    if (commentaires.length === 0) {
        return <p className="text-xs text-gray-400">{messageVide}</p>;
    }

    return (
        <ul className={`space-y-3 ${mode === 'technicien' ? 'max-h-96 overflow-y-auto' : ''}`}>
            {commentaires.map(c => (
                <li
                    key={c.id}
                    className={`rounded-lg p-3 text-sm ${c.role_auteur === 'technicien'
                        ? 'bg-blue-50 border border-blue-100'
                        : 'bg-gray-50 border border-gray-100'
                        }`}
                >
                    <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                        <span className="font-medium text-gray-600 inline-flex items-center gap-2">
                            {c.username_auteur}
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getClassesRole(c.role_auteur)}`}>
                                {getLibelleRole(c.role_auteur)}
                            </span>
                        </span>
                        <span>{formatDateHeure(c.date_envoi)}</span>
                    </div>
                    <p className="text-gray-700">{c.contenu}</p>
                </li>
            ))}
        </ul>
    );
}

export default ListeCommentairesTicket;