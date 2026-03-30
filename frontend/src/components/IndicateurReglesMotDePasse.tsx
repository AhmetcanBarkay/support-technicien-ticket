import { getPasswordRuleChecks } from '@shared/utils/passwordRules';

interface Props {
    motDePasse: string;
    confirmation?: string;
    afficherSeulementSiSaisi?: boolean;
}

function IndicateurReglesMotDePasse({
    motDePasse,
    confirmation,
    afficherSeulementSiSaisi = true
}: Props) {
    if (afficherSeulementSiSaisi && motDePasse.length === 0) {
        return null;
    }

    const regles = getPasswordRuleChecks(motDePasse);
    const confirmationRenseignee = typeof confirmation === 'string' && confirmation.length > 0;
    const confirmationValide = confirmationRenseignee && confirmation === motDePasse;

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-600 mb-2">Règles du mot de passe</p>
            <ul className="space-y-1">
                {regles.map(regle => (
                    <li key={regle.label} className={`text-xs ${regle.valid ? 'text-green-700' : 'text-gray-500'}`}>
                        <span className={`inline-block min-w-8 text-center rounded px-1 mr-2 font-medium ${regle.valid ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                            {regle.valid ? '✓' : '✕'}
                        </span>
                        {regle.label}
                    </li>
                ))}
                {typeof confirmation === 'string' && (
                    <li className={`text-xs ${confirmationValide ? 'text-green-700' : 'text-gray-500'}`}>
                        <span className={`inline-block min-w-8 text-center rounded px-1 mr-2 font-medium ${(confirmationValide && confirmationRenseignee) ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                            {(confirmationValide && confirmationRenseignee) ? '✓' : '✕'}
                        </span>
                        confirmation identique
                    </li>
                )}
            </ul>
        </div>
    );
}

export default IndicateurReglesMotDePasse;