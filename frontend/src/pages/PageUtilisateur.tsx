import { useState, useEffect } from 'react';
import type {
  ticketsListeUtilisateurResponse,
  ticketDetailUtilisateurResponse,
  ticketResumeUtilisateur,
  ticketDetailUtilisateur,
  creerTicketBody,
  creerTicketResponse,
  ajouterCommentaireUtilisateurBody,
  fermerTicketUtilisateurBody
} from '@shared/types/api/utilisateurApi';
import type { baseResponse } from '@shared/types/api/baseApi';
import { api } from '../services/apiService';
import BadgeStatut from '../components/BadgeStatut';
import DetailTicketComplet from '../components/DetailTicketComplet';
import ActionsTicket from '../components/ActionsTicket';
import { formatDateHeure } from '../utils/formatDateHeure';

type Vue = 'liste' | 'detail' | 'creer';

function PageUtilisateur() {
  const [vue, setVue] = useState<Vue>('liste');
  const [tickets, setTickets] = useState<ticketResumeUtilisateur[]>([]);
  const [ticketOuvert, setTicketOuvert] = useState<ticketDetailUtilisateur | null>(null);
  const [chargement, setChargement] = useState(true);

  // Créer un ticket
  const [sujet, setSujet] = useState('');
  const [contenu, setContenu] = useState('');
  const [messageCreation, setMessageCreation] = useState('');

  // Commentaire
  const [commentaire, setCommentaire] = useState('');
  const [messageCommentaire, setMessageCommentaire] = useState('');
  const [messageFermeture, setMessageFermeture] = useState('');

  async function chargerMesTickets() {
    setChargement(true);
    const res = await api.get<ticketsListeUtilisateurResponse>('/utilisateur/tickets');
    setTickets(res.donnees?.tickets ?? []);
    setChargement(false);
  }

  async function ouvrirTicket(id: number) {
    const res = await api.get<ticketDetailUtilisateurResponse>(`/utilisateur/ticket/${id}`);
    if (res.donnees?.ticket) {
      setTicketOuvert(res.donnees.ticket);
      setCommentaire('');
      setMessageCommentaire('');
      setMessageFermeture('');
      setVue('detail');
    }
  }

  async function handleCreerTicket(e: React.FormEvent) {
    e.preventDefault();
    setMessageCreation('');

    const res = await api.post<creerTicketBody, creerTicketResponse>(
      '/utilisateur/ticket/creer',
      { sujet, contenu }
    );

    if (!res.donnees?.success) {
      setMessageCreation(res.donnees?.reason ?? res.erreur ?? 'Erreur');
      return;
    }

    setSujet('');
    setContenu('');
    setMessageCreation('Ticket créé avec succès.');
    await chargerMesTickets();
    setVue('liste');
  }

  async function handleCommenter(e: React.FormEvent) {
    e.preventDefault();
    setMessageCommentaire('');
    if (!ticketOuvert) return;

    const res = await api.post<ajouterCommentaireUtilisateurBody, baseResponse>(
      '/utilisateur/ticket/commenter',
      { ticketId: ticketOuvert.id, contenu: commentaire }
    );

    if (!res.donnees?.success) {
      setMessageCommentaire(res.donnees?.reason ?? res.erreur ?? 'Erreur');
      return;
    }

    setCommentaire('');
    setMessageCommentaire('Commentaire ajouté.');
    await ouvrirTicket(ticketOuvert.id);
  }

  async function handleFermerTicket() {
    if (!ticketOuvert) return;

    const confirmation = window.confirm('Confirmer la fermeture de ce ticket ?');
    if (!confirmation) return;

    setMessageFermeture('');

    const res = await api.post<fermerTicketUtilisateurBody, baseResponse>(
      '/utilisateur/ticket/fermer',
      { ticketId: ticketOuvert.id }
    );

    if (!res.donnees?.success) {
      setMessageFermeture(res.donnees?.reason ?? res.erreur ?? 'Erreur');
      return;
    }

    setMessageFermeture('Ticket fermé.');
    await ouvrirTicket(ticketOuvert.id);
    await chargerMesTickets();
  }

  useEffect(() => {
    chargerMesTickets();
  }, []);

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex gap-3 items-center">
        <h2 className="text-xl font-bold text-gray-800 flex-1">Mes tickets</h2>
        {vue !== 'liste' && (
          <button
            onClick={() => setVue('liste')}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Retour à la liste
          </button>
        )}
        {vue === 'liste' && (
          <button
            onClick={() => { setVue('creer'); setMessageCreation(''); }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Nouveau ticket
          </button>
        )}
      </div>

      {/* Vue liste */}
      {vue === 'liste' && (
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          {chargement ? (
            <p className="text-gray-400 text-sm">Chargement...</p>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm mb-3">Vous n'avez aucun ticket.</p>
              <button
                onClick={() => setVue('creer')}
                className="text-blue-600 text-sm hover:underline"
              >
                Créer votre premier ticket
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {tickets.map(t => (
                <li key={t.id}>
                  <button
                    onClick={() => ouvrirTicket(t.id)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-sm font-medium text-gray-800">
                        {t.sujet}
                      </span>
                      <div className="flex items-center gap-2">
                        <BadgeStatut statut={t.statut} />
                        {t.ferme && (
                          <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-gray-800 text-white">
                            Fermé
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateHeure(t.date_creation)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Vue création */}
      {vue === 'creer' && (
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Créer un nouveau ticket</h3>
          <form onSubmit={handleCreerTicket} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
              <input
                type="text"
                value={sujet}
                onChange={e => setSujet(e.target.value)}
                placeholder="Résumez votre problème"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={200}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={contenu}
                onChange={e => setContenu(e.target.value)}
                placeholder="Décrivez votre problème en détail..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={5}
                required
              />
            </div>
            {messageCreation && (
              <p className={`text-sm ${messageCreation.includes('succès') ? 'text-green-700' : 'text-red-600'}`}>
                {messageCreation}
              </p>
            )}
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Envoyer le ticket
            </button>
          </form>
        </section>
      )}

      {/* Vue détail */}
      {vue === 'detail' && ticketOuvert && (
        <DetailTicketComplet
          ticket={ticketOuvert}
          modeCommentaires="utilisateur"
          titreCommentaires={`Historique (${ticketOuvert.commentaires.length} message${ticketOuvert.commentaires.length !== 1 ? 's' : ''})`}
          messageCommentairesVide="Aucun message pour l'instant."
          actions={(
            <ActionsTicket
              mode="utilisateur"
              ferme={ticketOuvert.ferme}
              commentaire={commentaire}
              onCommentaireChange={setCommentaire}
              onCommenter={handleCommenter}
              onFermerTicket={handleFermerTicket}
              messageCommentaire={messageCommentaire}
              messageFermeture={messageFermeture}
            />
          )}
        />
      )}
    </div>
  );
}

export default PageUtilisateur;
