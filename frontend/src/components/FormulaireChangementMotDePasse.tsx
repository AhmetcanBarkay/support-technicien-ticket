import { useState } from 'react';
import type { changePasswordBody, changePasswordResponse } from '@shared/types/api/authApi';
import { getPasswordRuleChecks, getPasswordRulesErrors } from '@shared/utils/passwordRules';
import { api } from '../services/apiService';
import IndicateurReglesMotDePasse from './IndicateurReglesMotDePasse';

interface Props {
    onSucces?: () => void;
}

function FormulaireChangementMotDePasse({ onSucces }: Props) {
    const [motDePasseActuel, setMotDePasseActuel] = useState('');
    const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [messageErreur, setMessageErreur] = useState('');
    const [messageSucces, setMessageSucces] = useState('');
    const [chargement, setChargement] = useState(false);
    const reglesMotDePasse = getPasswordRuleChecks(nouveauMotDePasse);
    const motDePasseValide = reglesMotDePasse.every(regle => regle.valid);
    const confirmationValide = confirmation === nouveauMotDePasse;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMessageErreur('');
        setMessageSucces('');

        const erreursRegles = getPasswordRulesErrors(nouveauMotDePasse);
        if (erreursRegles.length > 0) {
            setMessageErreur(`Mot de passe invalide :\n- ${erreursRegles.join('\n- ')}`);
            return;
        }

        if (!confirmationValide) {
            setMessageErreur('La confirmation doit être identique au nouveau mot de passe');
            return;
        }

        setChargement(true);

        const res = await api.post<changePasswordBody, changePasswordResponse>(
            '/auth/changerMotDePasse',
            {
                currentPassword: motDePasseActuel,
                newPassword: nouveauMotDePasse,
                confirmPassword: confirmation
            }
        );

        setChargement(false);

        if (!res.donnees?.success || !res.donnees.token) {
            setMessageErreur(res.donnees?.reason ?? res.erreur ?? 'Erreur lors du changement de mot de passe');
            return;
        }

        localStorage.setItem('token', res.donnees.token);
        setMotDePasseActuel('');
        setNouveauMotDePasse('');
        setConfirmation('');
        setMessageSucces('Mot de passe modifié avec succès.');
        onSucces?.();
    }

    return (
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Changer mon mot de passe</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
                    <input
                        type="password"
                        value={motDePasseActuel}
                        onChange={e => setMotDePasseActuel(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={100}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                    <input
                        type="password"
                        value={nouveauMotDePasse}
                        onChange={e => setNouveauMotDePasse(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="10 caractères min., 1 maj., 1 chiffre, 1 spécial"
                        maxLength={100}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le nouveau mot de passe</label>
                    <input
                        type="password"
                        value={confirmation}
                        onChange={e => setConfirmation(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={100}
                        required
                    />
                </div>

                <IndicateurReglesMotDePasse
                    motDePasse={nouveauMotDePasse}
                    confirmation={confirmation}
                />

                {messageErreur && (
                    <p className="text-sm text-red-600 whitespace-pre-line">{messageErreur}</p>
                )}
                {messageSucces && (
                    <p className="text-sm text-green-700">{messageSucces}</p>
                )}

                <button
                    type="submit"
                    disabled={chargement || !motDePasseValide || !confirmationValide}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                    {chargement ? 'Enregistrement...' : 'Mettre à jour le mot de passe'}
                </button>
            </form>
        </section>
    );
}

export default FormulaireChangementMotDePasse;