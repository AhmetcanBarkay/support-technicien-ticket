import { useEffect, useMemo, useState } from 'react';
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
import { api } from '../services/apiService';
import BadgeStatut from '../components/BadgeStatut';
import DetailTicketComplet from '../components/DetailTicketComplet';
import { formatDateHeure } from '../utils/formatDateHeure';

interface Props {
  username: string | null;
  ongletActif: OngletTechnicien;
}

export type OngletTechnicien = 'tickets_en_cours' | 'tickets_a_traiter';

type Vue = 'liste' | 'detail';

function PageTechnicien({ username, ongletActif }: Props) {
  const [vue, setVue] = useState<Vue>('liste');
  const [tickets, setTickets] = useState<ticketResumeTechnicien[]>([]);
  const [idsTicketsPrisEnCharge, setIdsTicketsPrisEnCharge] = useState<number[]>([]);
  const [ticketSelectionne, setTicketSelectionne] = useState<ticketDetailTechnicien | null>(null);
  const [chargement, setChargement] = useState(true);
  const [chargementDetail, setChargementDetail] = useState(false);

  // Commentaire
  const [contenuCommentaire, setContenuCommentaire] = useState('');
  const [messageCommentaire, setMessageCommentaire] = useState('');

  // Changement statut
  const [statutChoisi, setStatutChoisi] = useState<StatutTicket>('en_attente');
  const [messageStatut, setMessageStatut] = useState('');

  const idsTicketsPrisEnChargeSet = useMemo(() => new Set(idsTicketsPrisEnCharge), [idsTicketsPrisEnCharge]);
  const ticketsPrisEnCharge = tickets.filter(ticket => idsTicketsPrisEnChargeSet.has(ticket.id));
  const ticketsATraiter = tickets.filter(ticket => !idsTicketsPrisEnChargeSet.has(ticket.id));
  const ticketsAffiches = ongletActif === 'tickets_en_cours' ? ticketsPrisEnCharge : ticketsATraiter;
  const titreListe = ongletActif === 'tickets_en_cours'
    ? 'Tickets sur lesquels je travaille'
    : 'Tickets à traiter';
  const messageListeVide = ongletActif === 'tickets_en_cours'
    ? 'Aucun ticket en cours de traitement pour le moment.'
    : 'Aucun ticket disponible à traiter.';

  async function identifierTicketsPrisEnCharge(ticketsCharges: ticketResumeTechnicien[]) {
    if (!username || ticketsCharges.length === 0) {
      setIdsTicketsPrisEnCharge([]);
      return;
    }

    const details = await Promise.all(
      ticketsCharges.map(ticket => api.get<ticketDetailTechnicienResponse>(`/technicien/ticket/${ticket.id}`))
    );

    const ids = details
      .map(detail => detail.donnees?.ticket)
      .filter((ticket): ticket is ticketDetailTechnicien => Boolean(ticket))
      .filter(ticket => ticket.commentaires.some(
        commentaire => commentaire.role_auteur === 'technicien' && commentaire.username_auteur === username
      ))
      .map(ticket => ticket.id);

    setIdsTicketsPrisEnCharge(ids);
  }

  async function chargerTickets() {
    setChargement(true);
    const res = await api.get<ticketsListeTechnicienResponse>('/technicien/tickets');
    const ticketsCharges = res.donnees?.tickets ?? [];
    setTickets(ticketsCharges);
    await identifierTicketsPrisEnCharge(ticketsCharges);
    setChargement(false);
  }

  async function ouvrirTicket(id: number, options?: { preserveMessages?: boolean }) {
    const preserveMessages = options?.preserveMessages ?? false;
    setChargementDetail(true);
    setTicketSelectionne(null);

    if (!preserveMessages) {
      setMessageCommentaire('');
      setMessageStatut('');
      setContenuCommentaire('');
    }

    const res = await api.get<ticketDetailTechnicienResponse>(`/technicien/ticket/${id}`);
    if (res.donnees?.ticket) {
      setTicketSelectionne(res.donnees.ticket);
      setStatutChoisi(res.donnees.ticket.statut);
      setVue('detail');
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
    await ouvrirTicket(ticketSelectionne.id, { preserveMessages: true });
    await chargerTickets();
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
    await ouvrirTicket(ticketSelectionne.id, { preserveMessages: true });
    await chargerTickets();
  }

  function renderListe() {
    return (
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-700 mb-3">{titreListe} ({ticketsAffiches.length})</h3>
        {ticketsAffiches.length === 0 ? (
          <p className="text-gray-400 text-sm">{messageListeVide}</p>
        ) : (
          <ul className="space-y-2">
            {ticketsAffiches.map(ticket => (
              <li key={ticket.id}>
                <button
                  onClick={() => ouvrirTicket(ticket.id)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-sm font-medium text-gray-800">
                      #{ticket.id} - {ticket.sujet}
                    </span>
                    <BadgeStatut statut={ticket.statut} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {ticket.username_auteur} - {formatDateHeure(ticket.date_creation)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  useEffect(() => {
    chargerTickets();
  }, [username]);

  useEffect(() => {
    setVue('liste');
    setTicketSelectionne(null);
    setMessageCommentaire('');
    setMessageStatut('');
  }, [ongletActif]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-gray-800 flex-1">Espace technicien</h2>
        {vue === 'detail' && (
          <button
            onClick={() => {
              setVue('liste');
              setTicketSelectionne(null);
              setMessageCommentaire('');
              setMessageStatut('');
            }}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Retour aux listes
          </button>
        )}
      </div>

      {chargement && <p className="text-gray-400 text-sm">Chargement...</p>}

      {!chargement && vue === 'liste' && (
        <div className="grid grid-cols-1 gap-6">{renderListe()}</div>
      )}

      {!chargement && vue === 'detail' && chargementDetail && (
        <p className="text-gray-400 text-sm">Chargement du ticket...</p>
      )}

      {!chargement && vue === 'detail' && !chargementDetail && !ticketSelectionne && (
        <p className="text-gray-400 text-sm">Sélectionnez un ticket pour voir le détail.</p>
      )}

      {!chargement && vue === 'detail' && !chargementDetail && ticketSelectionne && (
        <DetailTicketComplet
          ticket={ticketSelectionne}
          titreCommentaires={`Commentaires (${ticketSelectionne.commentaires.length})`}
          actions={(
            <>
              <form onSubmit={handleChangerStatut} className="flex gap-2 items-center">
                <select
                  value={statutChoisi}
                  onChange={e => setStatutChoisi(e.target.value as StatutTicket)}
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              </form>
              {messageStatut && (
                <p className={`text-xs ${messageStatut.includes('jour') ? 'text-green-700' : 'text-red-600'}`}>
                  {messageStatut}
                </p>
              )}

              <form onSubmit={handleCommenter} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Ajouter un commentaire</label>
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
            </>
          )}
        />
      )}
    </div>
  );
}

export default PageTechnicien;
