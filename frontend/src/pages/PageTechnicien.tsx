import { useEffect, useMemo, useState } from 'react';
import type {
  ticketsListeTechnicienResponse,
  ticketDetailTechnicienResponse,
  ticketResumeTechnicien,
  ticketDetailTechnicien,
  changerStatutBody,
  ajouterCommentaireTechnicienBody,
  fermerTicketTechnicienBody
} from '@shared/types/api/technicienApi';
import type { baseResponse } from '@shared/types/api/baseApi';
import type { StatutTicket } from '@shared/types/statutsTicket';
import { api } from '../services/apiService';
import BadgeStatut from '../components/BadgeStatut';
import DetailTicketComplet from '../components/DetailTicketComplet';
import ActionsTicket from '../components/ActionsTicket';
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
  const [messageFermeture, setMessageFermeture] = useState('');

  const idsTicketsPrisEnChargeSet = useMemo(() => new Set(idsTicketsPrisEnCharge), [idsTicketsPrisEnCharge]);
  const ticketsPrisEnCharge = tickets.filter(ticket => idsTicketsPrisEnChargeSet.has(ticket.id));
  const ticketsATraiter = tickets.filter(ticket => !idsTicketsPrisEnChargeSet.has(ticket.id) && !ticket.ferme);
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
      setMessageFermeture('');
      setContenuCommentaire('');
    }

    const res = await api.get<ticketDetailTechnicienResponse>(`/technicien/ticket/${id}`);
    if (res.donnees?.ticket) {
      const ticketDetail = res.donnees.ticket;
      setTicketSelectionne(ticketDetail);
      setStatutChoisi(ticketDetail.statut);
      setTickets(prevTickets => prevTickets.map(ticket => (
        ticket.id === ticketDetail.id
          ? {
            ...ticket,
            statut: ticketDetail.statut,
            date_dernier_action: ticketDetail.date_dernier_action,
            ferme: ticketDetail.ferme
          }
          : ticket
      )));
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

  async function handleFermerTicket() {
    if (!ticketSelectionne) return;

    const confirmation = window.confirm('Confirmer la fermeture de ce ticket ?');
    if (!confirmation) return;

    setMessageFermeture('');

    const res = await api.post<fermerTicketTechnicienBody, baseResponse>(
      '/technicien/ticket/fermer',
      { ticketId: ticketSelectionne.id }
    );

    if (!res.donnees?.success) {
      setMessageFermeture(res.donnees?.reason ?? res.erreur ?? 'Erreur');
      return;
    }

    setMessageFermeture('Ticket fermé.');
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
                    <div className="flex items-center gap-2">
                      <BadgeStatut statut={ticket.statut} />
                      {ticket.ferme && (
                        <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-gray-800 text-white">
                          Fermé
                        </span>
                      )}
                    </div>
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
            onClick={async () => {
              await chargerTickets();
              setVue('liste');
              setTicketSelectionne(null);
              setMessageCommentaire('');
              setMessageStatut('');
              setMessageFermeture('');
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
            <ActionsTicket
              mode="technicien"
              ferme={ticketSelectionne.ferme}
              commentaire={contenuCommentaire}
              onCommentaireChange={setContenuCommentaire}
              onCommenter={handleCommenter}
              onFermerTicket={handleFermerTicket}
              messageCommentaire={messageCommentaire}
              messageFermeture={messageFermeture}
              statutChoisi={statutChoisi}
              onStatutChange={setStatutChoisi}
              onChangerStatut={handleChangerStatut}
              messageStatut={messageStatut}
            />
          )}
        />
      )}
    </div>
  );
}

export default PageTechnicien;
