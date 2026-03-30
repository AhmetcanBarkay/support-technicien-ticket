import { useState } from 'react';
import type { Role } from '@shared/types/roles';
import PageAdmin from '../pages/PageAdmin';
import PageTechnicien, { type OngletTechnicien } from '../pages/PageTechnicien';
import PageUtilisateur from '../pages/PageUtilisateur';
import FormulaireChangementMotDePasse from './FormulaireChangementMotDePasse';
import BarreNavigationSecondaire from './BarreNavigationSecondaire';

interface Props {
  role: Role | null;
  username: string | null;
  onDeconnexion: () => void;
}

function EspaceAuthentifie({ role, username, onDeconnexion }: Props) {
  const [afficherChangementMotDePasse, setAfficherChangementMotDePasse] = useState(false);
  const [ongletTechnicien, setOngletTechnicien] = useState<OngletTechnicien>('tickets_en_cours');
  const peutChangerMotDePasse = role === 'utilisateur' || role === 'technicien';
  const libelleRole: Record<Role, string> = {
    admin: 'Administrateur',
    technicien: 'Technicien',
    utilisateur: 'Utilisateur'
  };
  const ongletsTechnicien = [
    { key: 'tickets_en_cours', label: 'Tickets sur lesquels je travaille' },
    { key: 'tickets_a_traiter', label: 'Tickets à traiter' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Connecté en tant que <span className="text-blue-600">{username}</span>
          {role && (
            <span className="ml-2 text-xs text-gray-400">({libelleRole[role]})</span>
          )}
        </span>

        <div className="flex items-center gap-3">
          {peutChangerMotDePasse && (
            <button
              onClick={() => setAfficherChangementMotDePasse(!afficherChangementMotDePasse)}
              className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              {afficherChangementMotDePasse ? 'Fermer le formulaire' : 'Changer mon mot de passe'}
            </button>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={onDeconnexion}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {role === 'technicien' && (
        <BarreNavigationSecondaire
          onglets={ongletsTechnicien}
          ongletActif={ongletTechnicien}
          onChangerOnglet={(key) => setOngletTechnicien(key as OngletTechnicien)}
        />
      )}

      {/* Contenu selon le rôle */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {peutChangerMotDePasse && afficherChangementMotDePasse && (
          <FormulaireChangementMotDePasse onSucces={() => setAfficherChangementMotDePasse(false)} />
        )}
        {role === 'admin' && <PageAdmin />}
        {role === 'technicien' && (
          <PageTechnicien username={username} ongletActif={ongletTechnicien} />
        )}
        {role === 'utilisateur' && <PageUtilisateur />}
        {!role && (
          <p className="text-gray-500 text-center mt-10">Rôle non reconnu.</p>
        )}
      </main>
    </div>
  );
}

export default EspaceAuthentifie;
