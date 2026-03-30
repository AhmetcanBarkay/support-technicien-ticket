import { useAuthentification } from './hooks/useAuthentification';
import PageConnexion from './pages/PageConnexion';
import EspaceAuthentifie from './components/EspaceAuthentifie';

function App() {
  const {
    connecte,
    verification,
    role,
    username,
    connecter,
    deconnecter
  } = useAuthentification();

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
          connecter({ role, username });
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
