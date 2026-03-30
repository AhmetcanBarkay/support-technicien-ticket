import { useState, useEffect } from 'react';
import type {
  ticketsListeTechnicienResponse,
  ticketDetailTechnicienResponse,
  ticketResumeTechnicien,
  ticketDetailTechnicien,
  changerStatutBody,
  ajouterCommentaireTechnicienBody
} from '@shared/types/api/technicienApi';
import type { baseResponse } from '@shared/types/api/baseApi';
import { LIBELLE_STATUT, STATUTS_TICKET, type StatutTicket } from '@shared/types/statutsTicket';
import { api } from '../api/apiHelper';

function BadgeStatut({ statut }: { statut: StatutTicket }) {
  const couleurs: Record<StatutTicket, string> = {
    en_attente: 'bg-yellow-100 text-yellow-800',
    en_cours: 'bg-blue-100 text-blue-800',
    resolu: 'bg-green-100 text-green-800',
    non_resolu: 'bg-red-100 text-red-800'
  };
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${couleurs[statut]}`}>
      {LIBELLE_STATUT[statut]}
    </span>
  );
}

function PageTechnicien() {
  const [tickets, setTickets] = useState<ticketResumeTechnicien[]>([]);
  const [ticketSelectionne, setTicketSelectionne] = useState<ticketDetailTechnicien | null>(null);
  const [chargement, setChargement] = useState(true);
  const [chargementDetail, setChargementDetail] = useState(false);

  // Commentaire
  const [contenuCommentaire, setContenuCommentaire] = useState('');
  const [messageCommentaire, setMessageCommentaire] = useState('');

  // Changement statut
  const [statutChoisi, setStatutChoisi] = useState<StatutTicket>('en_attente');
  const [messageStatut, setMessageStatut] = useState('');

  async function chargerTickets() {
    setChargement(true);
    const res = await api.get<ticketsListeTechnicienResponse>('/technicien/tickets');
    setTickets(res.donnees?.tickets ?? []);
    setChargement(false);
  }

  async function ouvrirTicket(id: number) {
    setChargementDetail(true);
    setTicketSelectionne(null);
    setMessageCommentaire('');
    setMessageStatut('');
    setContenuCommentaire('');

    const res = await api.get<ticketDetailTechnicienResponse>(`/technicien/ticket/${id}`);
    if (res.donnees?.ticket) {
      setTicketSelectionne(res.donnees.ticket);
      setStatutChoisi(res.donnees.ticket.statut);
    }
    setChargementDetail(false);
  }

  async function handleCommenter(e: React.FormEvent) {
    e.preventDefault();
    setMessageCommentaire('');
    if (!ticketSelectionne) return;

    const res = await api.post<ajouterCommentaireTechnicienBody, baseResponse>(
      '/technicien/ticket/commenter',
      { ticketId: ticketSelectionne.id, contenu: contenuCommentaire }
    );

    if (!res.donnees?.success) {
      setMessageCommentaire(res.donnees?.reason ?? res.erreur ?? 'Erreur');
      return;
    }

    setContenuCommentaire('');
    setMessageCommentaire('Commentaire ajouté.');
    await ouvrirTicket(ticketSelectionne.id);
    chargerTickets();
  }

  async function handleChangerStatut(e: React.FormEvent) {
    e.preventDefault();
    setMessageStatut('');
    if (!ticketSelectionne) return;

    const res = await api.post<changerStatutBody, baseResponse>(
      '/technicien/ticket/statut',
      { ticketId: ticketSelectionne.id, statut: statutChoisi }
    );

    if (!res.donnees?.success) {
      setMessageStatut(res.donnees?.reason ?? res.erreur ?? 'Erreur');
      return;
    }

    setMessageStatut('Statut mis à jour.');
    await ouvrirTicket(ticketSelectionne.id);
    chargerTickets();
  }

  useEffect(() => {
    chargerTickets();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Espace technicien</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Liste tickets */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Tous les tickets ({tickets.length})</h3>
          {chargement ? (
            <p className="text-gray-400 text-sm">Chargement...</p>
          ) : tickets.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucun ticket.</p>
          ) : (
            <ul className="space-y-2">
              {tickets.map(t => (
                <li key={t.id}>
                  <button
                    onClick={() => ouvrirTicket(t.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      ticketSelectionne?.id === t.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-sm font-medium text-gray-800 line-clamp-1">
                        #{t.id} — {t.sujet}
                      </span>
                      <BadgeStatut statut={t.statut} />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {t.username_auteur} · {new Date(t.date_creation).toLocaleDateString('fr-FR')}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Détail ticket */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          {chargementDetail && (
            <p className="text-gray-400 text-sm">Chargement du ticket...</p>
          )}
          {!chargementDetail && !ticketSelectionne && (
            <p className="text-gray-400 text-sm">Sélectionnez un ticket pour voir le détail.</p>
          )}
          {!chargementDetail && ticketSelectionne && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="font-semibold text-gray-800">{ticketSelectionne.sujet}</h3>
                  <BadgeStatut statut={ticketSelectionne.statut} />
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  Par {ticketSelectionne.username_auteur} · {new Date(ticketSelectionne.date_creation).toLocaleDateString('fr-FR')}
                </p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                  {ticketSelectionne.contenu}
                </p>
              </div>

              {/* Changer le statut */}
              <form onSubmit={handleChangerStatut} className="flex gap-2 items-center">
                <select
                  value={statutChoisi}
                  onChange={e => setStatutChoisi(e.target.value as StatutTicket)}
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUTS_TICKET.map(s => (
                    <option key={s} value={s}>{LIBELLE_STATUT[s]}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="bg-gray-700 hover:bg-gray-800 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
                >
                  Mettre à jour
                </button>
              </form>
              {messageStatut && (
                <p className={`text-xs ${messageStatut.includes('jour') ? 'text-green-700' : 'text-red-600'}`}>
                  {messageStatut}
                </p>
              )}

              {/* Commentaires */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Commentaires ({ticketSelectionne.commentaires.length})
                </h4>
                {ticketSelectionne.commentaires.length === 0 ? (
                  <p className="text-xs text-gray-400">Aucun commentaire.</p>
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-y-auto">
                    {ticketSelectionne.commentaires.map(c => (
                      <li key={c.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                          <span className="font-medium text-gray-600">{c.username_auteur}</span>
                          <span>{new Date(c.date_envoi).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <p className="text-gray-700">{c.contenu}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Ajouter commentaire */}
              <form onSubmit={handleCommenter} className="space-y-2">
                <textarea
                  value={contenuCommentaire}
                  onChange={e => setContenuCommentaire(e.target.value)}
                  placeholder="Votre réponse..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  required
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Répondre
                </button>
                {messageCommentaire && (
                  <p className={`text-xs ${messageCommentaire.includes('ajouté') ? 'text-green-700' : 'text-red-600'}`}>
                    {messageCommentaire}
                  </p>
                )}
              </form>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default PageTechnicien;
