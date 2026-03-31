import { useState, useEffect } from 'react';
import type {
  createTechnicienBody,
  createTechnicienResponse,
  deleteTechnicienBody,
  technicienListResponse,
  technicienItem
} from '@shared/types/api/adminApi';
import { api } from '../services/apiService';

function PageAdmin() {
  const [techniciens, setTechniciens] = useState<technicienItem[]>([]);
  const [chargement, setChargement] = useState(true);

  // Formulaire création
  const [nouvelIdentifiant, setNouvelIdentifiant] = useState('');
  const [identifiantCree, setIdentifiantCree] = useState('');
  const [messageCreation, setMessageCreation] = useState('');
  const [motDePasseGenere, setMotDePasseGenere] = useState('');
  const [messageCopie, setMessageCopie] = useState('');

  const [messageSuppression, setMessageSuppression] = useState('');
  const [technicienEnSuppression, setTechnicienEnSuppression] = useState<string | null>(null);

  async function chargerTechniciens() {
    setChargement(true);
    const res = await api.get<technicienListResponse>('/admin/techniciens');
    setTechniciens(res.donnees?.techniciens ?? []);
    setChargement(false);
  }

  useEffect(() => {
    chargerTechniciens();
  }, []);

  async function handleCreer(e: React.FormEvent) {
    e.preventDefault();
    setMessageCreation('');
    setMotDePasseGenere('');
    setIdentifiantCree('');
    setMessageCopie('');

    const identifiantSoumis = nouvelIdentifiant.trim();

    const res = await api.post<createTechnicienBody, createTechnicienResponse>(
      '/admin/technicien/creer',
      { username: identifiantSoumis }
    );

    if (!res.donnees?.success) {
      setMessageCreation(res.donnees?.reason ?? res.erreur ?? 'Erreur');
      return;
    }

    setIdentifiantCree(identifiantSoumis);
    setMotDePasseGenere(res.donnees.generatedPassword ?? '');
    setNouvelIdentifiant('');
    chargerTechniciens();
  }

  async function copierTexte(texte: string, type: 'identifiant' | 'mot de passe' | 'identifiant et mot de passe') {
    try {
      await navigator.clipboard.writeText(texte);
      setMessageCopie(`${type} copié.`);
    } catch {
      setMessageCopie(`Impossible de copier le ${type}.`);
    }
  }

  async function handleSupprimer(username: string) {
    const confirmation = window.confirm(`Confirmer la suppression du compte technicien "${username}" ?`);
    if (!confirmation) {
      return;
    }

    setMessageSuppression('');
    setTechnicienEnSuppression(username);

    const res = await api.post<deleteTechnicienBody, { success: boolean; reason?: string }>(
      '/admin/technicien/supprimer',
      { username }
    );

    setTechnicienEnSuppression(null);

    if (!res.donnees?.success) {
      setMessageSuppression(res.donnees?.reason ?? res.erreur ?? 'Erreur');
      return;
    }

    setMessageSuppression('Technicien supprimé avec succès.');
    chargerTechniciens();
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-gray-800">Administration des Techniciens</h2>

      {/* Liste des techniciens */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-700 mb-4">
          Techniciens ({techniciens.length})
        </h3>

        {chargement ? (
          <p className="text-gray-400 text-sm">Chargement...</p>
        ) : techniciens.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucun technicien enregistré.</p>
        ) : (
          <ul className="divide-y divide-gray-300 divide-dashed">
            {techniciens.map(t => (
              <li key={t.id} className="py-2 flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700">{t.username}</span>
                <button
                  type="button"
                  onClick={() => handleSupprimer(t.username)}
                  disabled={technicienEnSuppression === t.username}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {technicienEnSuppression === t.username ? 'Suppression...' : 'Supprimer'}
                </button>
              </li>
            ))}
          </ul>
        )}
        {messageSuppression && (
          <p className={`mt-3 text-sm ${messageSuppression.includes('succès') ? 'text-green-700' : 'text-red-600'}`}>
            {messageSuppression}
          </p>
        )}
      </section>

      {/* Créer un technicien */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Ajouter un technicien</h3>
        <form onSubmit={handleCreer} className="flex flex-row gap-2">
          <input
            type="text"
            value={nouvelIdentifiant}
            onChange={e => setNouvelIdentifiant(e.target.value)}
            placeholder="Identifiant du technicien"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={30}
            required
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            Créer le compte
          </button>
        </form>
        {messageCreation && (
          <p className="mt-3 text-sm text-red-600 whitespace-pre-line">{messageCreation}</p>
        )}
        {motDePasseGenere && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
            <p className="font-medium">Compte créé avec succès !</p>
            <div className="mt-2 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p>Identifiant : <strong>{identifiantCree}</strong></p>
                <button
                  type="button"
                  onClick={() => copierTexte(identifiantCree, 'identifiant')}
                  className="bg-white border border-green-300 text-green-800 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                >
                  Copier identifiant
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p>Mot de passe généré : <strong>{motDePasseGenere}</strong></p>
                <button
                  type="button"
                  onClick={() => copierTexte(motDePasseGenere, 'mot de passe')}
                  className="bg-white border border-green-300 text-green-800 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                >
                  Copier mot de passe
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => copierTexte(`Identifiant: ${identifiantCree}\nMot de passe: ${motDePasseGenere}`, 'identifiant et mot de passe')}
              className="mt-3 bg-green-700 hover:bg-green-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              Copier les deux
            </button>

            {messageCopie && (
              <p className="text-xs text-green-700 mt-2">{messageCopie}</p>
            )}
          </div>
        )}
      </section>

    </div>
  );
}

export default PageAdmin;
