import type { Role } from '@shared/types/roles';
import PageAdmin from '../pages/PageAdmin';
import PageTechnicien from '../pages/PageTechnicien';
import PageUtilisateur from '../pages/PageUtilisateur';

interface Props {
  role: Role | null;
  username: string | null;
  onDeconnexion: () => void;
}

function EspaceAuthentifie({ role, username, onDeconnexion }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barre du haut */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Connecté en tant que <span className="text-blue-600">{username}</span>
          {role && (
            <span className="ml-2 text-xs text-gray-400">({role})</span>
          )}
        </span>
        <button
          onClick={onDeconnexion}
          className="text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          Déconnexion
        </button>
      </header>

      {/* Contenu selon le rôle */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {role === 'admin' && <PageAdmin />}
        {role === 'technicien' && <PageTechnicien />}
        {role === 'utilisateur' && <PageUtilisateur />}
        {!role && (
          <p className="text-gray-500 text-center mt-10">Rôle non reconnu.</p>
        )}
      </main>
    </div>
  );
}

export default EspaceAuthentifie;
