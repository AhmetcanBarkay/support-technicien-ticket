import { useState, useEffect } from 'react';
import type { verifyTokenBody, verifyTokenResponse } from '@shared/types/api/authApi';
import type { Role } from '@shared/types/roles';
import { api, AUTH_INVALID_EVENT } from './api/apiHelper';
import PageConnexion from './pages/PageConnexion';
import EspaceAuthentifie from './components/EspaceAuthentifie';

function App() {
  const [connecte, setConnecte] = useState(false);
  const [verification, setVerification] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const deconnecter = () => {
    localStorage.removeItem('token');
    setConnecte(false);
    setRole(null);
    setUsername(null);
    setVerification(false);
  };

  // Écoute l'événement de token invalide (émis par apiHelper)
  useEffect(() => {
    window.addEventListener(AUTH_INVALID_EVENT, deconnecter);
    return () => window.removeEventListener(AUTH_INVALID_EVENT, deconnecter);
  }, []);

  // Vérification du token au chargement
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setVerification(false);
        return;
      }

      const res = await api.post<verifyTokenBody, verifyTokenResponse>(
        '/auth/verifierToken',
        { token }
      );

      if (res.donnees?.success) {
        setConnecte(true);
        setRole(res.donnees.role ?? null);
        setUsername(res.donnees.username ?? null);
      } else {
        deconnecter();
      }

      setVerification(false);
    })();
  }, []);

  if (verification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (!connecte) {
    return (
      <PageConnexion
        onConnexionReussie={({ role, username }) => {
          setConnecte(true);
          setRole(role);
          setUsername(username);
        }}
      />
    );
  }

  return (
    <EspaceAuthentifie
      role={role}
      username={username}
      onDeconnexion={deconnecter}
    />
  );
}

export default App;
