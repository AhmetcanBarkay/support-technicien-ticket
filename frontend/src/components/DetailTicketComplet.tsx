import type { ReactNode } from 'react';
import type { commentaireItem } from '@shared/types/api/technicienApi';
import type { StatutTicket } from '@shared/types/statutsTicket';
import BadgeStatut from './BadgeStatut';
import ListeCommentairesTicket from './ListeCommentairesTicket';
import { formatDateHeure } from '../utils/formatDateHeure';

interface TicketDetailCommun {
    id: number;
    sujet: string;
    contenu: string;
    statut: StatutTicket;
    date_creation: string;
    date_dernier_action: string;
    ferme: boolean;
    commentaires: commentaireItem[];
    username_auteur?: string;
}

interface Props {
    ticket: TicketDetailCommun;
    modeCommentaires?: 'utilisateur' | 'technicien';
    titreCommentaires?: string;
    messageCommentairesVide?: string;
    actions?: ReactNode;
}

function DetailTicketComplet({
    ticket,
    modeCommentaires = 'technicien',
    titreCommentaires,
    messageCommentairesVide = 'Aucun commentaire.',
    actions
}: Props) {
    const titre = titreCommentaires
        ?? `Commentaires (${ticket.commentaires.length})`;

    return (
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
            <div>
                <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{ticket.sujet}</h3>
                    <div className="flex items-center gap-2">
                        <BadgeStatut statut={ticket.statut} />
                        {ticket.ferme && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-800 text-white">
                                Fermé
                            </span>
                        )}
                    </div>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                    {ticket.username_auteur
                        ? `Par ${ticket.username_auteur} - Créé le ${formatDateHeure(ticket.date_creation)}`
                        : `Créé le ${formatDateHeure(ticket.date_creation)}`}
                </p>
                <p className="text-xs text-gray-400 mb-3">
                    Dernière action le {formatDateHeure(ticket.date_dernier_action)}
                </p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4">
                    {ticket.contenu}
                </p>
            </div>

            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">{titre}</h4>
                <ListeCommentairesTicket
                    commentaires={ticket.commentaires}
                    mode={modeCommentaires}
                    messageVide={messageCommentairesVide}
                />
            </div>

            {actions}
        </section>
    );
}

export default DetailTicketComplet;