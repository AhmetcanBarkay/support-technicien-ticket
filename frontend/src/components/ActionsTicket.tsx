import type { FormEvent } from 'react';
import { LIBELLE_STATUT, STATUTS_TICKET, type StatutTicket } from '@shared/types/statutsTicket';

interface Props {
    mode: 'utilisateur' | 'technicien';
    ferme: boolean;
    commentaire: string;
    onCommentaireChange: (value: string) => void;
    onCommenter: (e: FormEvent) => void;
    onFermerTicket: () => void;
    messageCommentaire?: string;
    messageFermeture?: string;
    statutChoisi?: StatutTicket;
    onStatutChange?: (statut: StatutTicket) => void;
    onChangerStatut?: (e: FormEvent) => void;
    messageStatut?: string;
}

function ActionsTicket({
    mode,
    ferme,
    commentaire,
    onCommentaireChange,
    onCommenter,
    onFermerTicket,
    messageCommentaire,
    messageFermeture,
    statutChoisi,
    onStatutChange,
    onChangerStatut,
    messageStatut
}: Props) {
    const estTechnicien = mode === 'technicien';

    return (
        <div className="space-y-3">
            {ferme ? (
                <p className="text-sm text-gray-500">Ticket fermé.</p>
            ) : (
                <>
                    {!estTechnicien && (<button
                        type="button"
                        onClick={onFermerTicket}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                        Fermer le ticket
                    </button>)}

                    {estTechnicien && statutChoisi && onStatutChange && onChangerStatut && (
                        <form onSubmit={onChangerStatut} className="flex gap-2 items-center">
                            <select
                                value={statutChoisi}
                                onChange={e => onStatutChange(e.target.value as StatutTicket)}
                                className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-20"
                            >
                                {STATUTS_TICKET.map(statut => (
                                    <option key={statut} value={statut}>{LIBELLE_STATUT[statut]}</option>
                                ))}
                            </select>
                            <button
                                type="submit"
                                className="bg-gray-700 hover:bg-gray-800 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
                            >
                                Mettre à jour
                            </button>
                            <button
                                type="button"
                                onClick={onFermerTicket}
                                className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                            >
                                Fermer le ticket
                            </button>
                        </form>
                    )}

                    <form onSubmit={onCommenter} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            {estTechnicien ? 'Ajouter un commentaire' : 'Ajouter un message'}
                        </label>
                        <textarea
                            value={commentaire}
                            onChange={e => onCommentaireChange(e.target.value)}
                            placeholder={estTechnicien ? 'Votre réponse...' : 'Votre message...'}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={3}
                            required
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                            {estTechnicien ? 'Répondre' : 'Envoyer'}
                        </button>
                    </form>
                </>
            )}

            {messageFermeture && (
                <p className={`text-xs ${messageFermeture.includes('fermé') ? 'text-green-700' : 'text-red-600'}`}>
                    {messageFermeture}
                </p>
            )}
            {messageStatut && (
                <p className={`text-xs ${messageStatut.includes('jour') ? 'text-green-700' : 'text-red-600'}`}>
                    {messageStatut}
                </p>
            )}
            {messageCommentaire && (
                <p className={`text-xs ${messageCommentaire.includes('ajouté') ? 'text-green-700' : 'text-red-600'}`}>
                    {messageCommentaire}
                </p>
            )}
        </div>
    );
}

export default ActionsTicket;