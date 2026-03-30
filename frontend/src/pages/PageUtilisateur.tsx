import { useState, useEffect } from 'react';
import type {
  ticketsListeUtilisateurResponse,
  ticketDetailUtilisateurResponse,
  ticketResumeUtilisateur,
  ticketDetailUtilisateur,
  creerTicketBody,
  creerTicketResponse,
  ajouterCommentaireUtilisateurBody
} from '@shared/types/api/utilisateurApi';
import type { baseResponse } from '@shared/types/api/baseApi';
import { LIBELLE_STATUT, type StatutTicket } from '@shared/types/statutsTicket';
import { api } from '../api/apiHelper';

type Vue = 'liste' | 'detail' | 'creer';

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
    setTimeout(() => setVue('liste'), 1000);
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
                        #{t.id} — {t.sujet}
                      </span>
                      <BadgeStatut statut={t.statut} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(t.date_creation).toLocaleDateString('fr-FR')}
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
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div>
            <div className="flex justify-between items-start gap-2 mb-1">
              <h3 className="font-semibold text-gray-800">{ticketOuvert.sujet}</h3>
              <BadgeStatut statut={ticketOuvert.statut} />
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Créé le {new Date(ticketOuvert.date_creation).toLocaleDateString('fr-FR')}
            </p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4">
              {ticketOuvert.contenu}
            </p>
          </div>

          {/* Commentaires */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Historique ({ticketOuvert.commentaires.length} message{ticketOuvert.commentaires.length !== 1 ? 's' : ''})
            </h4>
            {ticketOuvert.commentaires.length === 0 ? (
              <p className="text-xs text-gray-400">Aucun message pour l'instant.</p>
            ) : (
              <ul className="space-y-3">
                {ticketOuvert.commentaires.map(c => (
                  <li
                    key={c.id}
                    className={`rounded-lg p-3 text-sm ${
                      c.role_auteur === 'technicien'
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
                      <span>{new Date(c.date_envoi).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <p className="text-gray-700">{c.contenu}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Répondre */}
          <form onSubmit={handleCommenter} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Ajouter un message</label>
            <textarea
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
              placeholder="Votre message..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              required
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Envoyer
            </button>
            {messageCommentaire && (
              <p className={`text-xs ${messageCommentaire.includes('ajouté') ? 'text-green-700' : 'text-red-600'}`}>
                {messageCommentaire}
              </p>
            )}
          </form>
        </section>
      )}
    </div>
  );
}

export default PageUtilisateur;
