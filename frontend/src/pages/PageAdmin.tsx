import { useState, useEffect } from 'react';
import type {
  createTechnicienBody,
  createTechnicienResponse,
  deleteTechnicienBody,
  technicienListResponse,
  technicienItem
} from '@shared/types/api/adminApi';
import { api } from '../api/apiHelper';

function PageAdmin() {
  const [techniciens, setTechniciens] = useState<technicienItem[]>([]);
  const [chargement, setChargement] = useState(true);

  // Formulaire création
  const [nouvelIdentifiant, setNouvelIdentifiant] = useState('');
  const [messageCreation, setMessageCreation] = useState('');
  const [motDePasseGenere, setMotDePasseGenere] = useState('');

  // Formulaire suppression
  const [identifiantASupprimer, setIdentifiantASupprimer] = useState('');
  const [messageSuppression, setMessageSuppression] = useState('');

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

    const res = await api.post<createTechnicienBody, createTechnicienResponse>(
      '/admin/technicien/creer',
      { username: nouvelIdentifiant }
    );

    if (!res.donnees?.success) {
      setMessageCreation(res.donnees?.reason ?? res.erreur ?? 'Erreur');
      return;
    }

    setMotDePasseGenere(res.donnees.generatedPassword ?? '');
    setNouvelIdentifiant('');
    chargerTechniciens();
  }

  async function handleSupprimer(e: React.FormEvent) {
    e.preventDefault();
    setMessageSuppression('');

    const res = await api.post<deleteTechnicienBody, { success: boolean; reason?: string }>(
      '/admin/technicien/supprimer',
      { username: identifiantASupprimer }
    );

    if (!res.donnees?.success) {
      setMessageSuppression(res.donnees?.reason ?? res.erreur ?? 'Erreur');
      return;
    }

    setMessageSuppression('Technicien supprimé avec succès.');
    setIdentifiantASupprimer('');
    chargerTechniciens();
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-gray-800">Administration — Techniciens</h2>

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
          <ul className="divide-y divide-gray-100">
            {techniciens.map(t => (
              <li key={t.id} className="py-2 flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700">{t.username}</span>
                <span className="text-gray-400">
                  {new Date(t.date_creation).toLocaleDateString('fr-FR')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Créer un technicien */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Ajouter un technicien</h3>
        <form onSubmit={handleCreer} className="space-y-3">
          <input
            type="text"
            value={nouvelIdentifiant}
            onChange={e => setNouvelIdentifiant(e.target.value)}
            placeholder="Identifiant du technicien"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={30}
            required
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
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
            <p>Mot de passe généré : <strong>{motDePasseGenere}</strong></p>
            <p className="text-xs text-green-600 mt-1">Communiquez ce mot de passe au technicien.</p>
          </div>
        )}
      </section>

      {/* Supprimer un technicien */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Supprimer un technicien</h3>
        <form onSubmit={handleSupprimer} className="space-y-3">
          <input
            type="text"
            value={identifiantASupprimer}
            onChange={e => setIdentifiantASupprimer(e.target.value)}
            placeholder="Identifiant du technicien à supprimer"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            maxLength={30}
            required
          />
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Supprimer
          </button>
        </form>
        {messageSuppression && (
          <p className={`mt-3 text-sm ${messageSuppression.includes('succès') ? 'text-green-700' : 'text-red-600'}`}>
            {messageSuppression}
          </p>
        )}
      </section>
    </div>
  );
}

export default PageAdmin;
