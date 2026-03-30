import { useState } from 'react';
import type { loginBody, loginResponse, registerBody, registerResponse } from '@shared/types/api/authApi';
import { getPasswordRuleChecks, getPasswordRulesErrors } from '@shared/utils/passwordRules';
import type { Role } from '@shared/types/roles';
import { api } from '../services/apiService';
import IndicateurReglesMotDePasse from '../components/IndicateurReglesMotDePasse';

interface Props {
  onConnexionReussie: (info: { role: Role; username: string }) => void;
}

type Onglet = 'connexion' | 'inscription';

function PageConnexion({ onConnexionReussie }: Props) {
  const [onglet, setOnglet] = useState<Onglet>('connexion');

  // Champs connexion
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');

  // Champs inscription
  const [identifiantInscription, setIdentifiantInscription] = useState('');
  const [motDePasseInscription, setMotDePasseInscription] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const reglesMotDePasseInscription = getPasswordRuleChecks(motDePasseInscription);
  const motDePasseInscriptionValide = reglesMotDePasseInscription.every(regle => regle.valid);
  const confirmationInscriptionValide = confirmation === motDePasseInscription;

  async function handleConnexion(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');
    setChargement(true);

    const res = await api.post<loginBody, loginResponse>('/auth/connexion', {
      username: identifiant,
      password: motDePasse
    });

    setChargement(false);

    if (!res.donnees?.success || !res.donnees.token || !res.donnees.role || !res.donnees.username) {
      setErreur(res.donnees?.reason ?? res.erreur ?? 'Erreur de connexion');
      return;
    }

    localStorage.setItem('token', res.donnees.token);
    onConnexionReussie({ role: res.donnees.role, username: res.donnees.username });
  }

  async function handleInscription(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');

    const erreursRegles = getPasswordRulesErrors(motDePasseInscription);
    if (erreursRegles.length > 0) {
      setErreur(`Mot de passe invalide :\n- ${erreursRegles.join('\n- ')}`);
      return;
    }

    if (!confirmationInscriptionValide) {
      setErreur('La confirmation doit être identique au mot de passe');
      return;
    }

    setChargement(true);

    const res = await api.post<registerBody, registerResponse>('/auth/inscription', {
      username: identifiantInscription,
      password: motDePasseInscription,
      confirmPassword: confirmation
    });

    setChargement(false);

    if (!res.donnees?.success || !res.donnees.token || !res.donnees.role || !res.donnees.username) {
      setErreur(res.donnees?.reason ?? res.erreur ?? "Erreur lors de l'inscription");
      return;
    }

    localStorage.setItem('token', res.donnees.token);
    onConnexionReussie({ role: res.donnees.role, username: res.donnees.username });
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">

        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">
          Gestion des tickets
        </h1>

        {/* Onglets */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`flex-1 py-2 text-sm font-medium transition-colors ${onglet === 'connexion'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => { setOnglet('connexion'); setErreur(''); }}
          >
            Connexion
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium transition-colors ${onglet === 'inscription'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => { setOnglet('inscription'); setErreur(''); }}
          >
            Créer un compte
          </button>
        </div>

        {/* Message d'erreur */}
        {erreur && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm whitespace-pre-line">
            {erreur}
          </div>
        )}

        {/* Formulaire connexion */}
        {onglet === 'connexion' && (
          <form onSubmit={handleConnexion} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identifiant
              </label>
              <input
                type="text"
                value={identifiant}
                onChange={e => setIdentifiant(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Votre identifiant"
                maxLength={30}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={motDePasse}
                onChange={e => setMotDePasse(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Votre mot de passe"
                maxLength={100}
                required
              />
            </div>
            <button
              type="submit"
              disabled={chargement}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {chargement ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        )}

        {/* Formulaire inscription */}
        {onglet === 'inscription' && (
          <form onSubmit={handleInscription} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identifiant
              </label>
              <input
                type="text"
                value={identifiantInscription}
                onChange={e => setIdentifiantInscription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Choisissez un identifiant"
                maxLength={30}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={motDePasseInscription}
                onChange={e => setMotDePasseInscription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10 caractères min., 1 maj., 1 chiffre, 1 spécial"
                maxLength={100}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={confirmation}
                onChange={e => setConfirmation(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Répétez le mot de passe"
                maxLength={100}
                required
              />
            </div>

            <IndicateurReglesMotDePasse
              motDePasse={motDePasseInscription}
              confirmation={confirmation}
            />
            <button
              type="submit"
              disabled={chargement || !motDePasseInscriptionValide || !confirmationInscriptionValide}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {chargement ? 'Inscription...' : "Créer mon compte"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default PageConnexion;
