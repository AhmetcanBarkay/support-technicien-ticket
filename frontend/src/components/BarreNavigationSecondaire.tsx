interface Onglet {
    key: string;
    label: string;
}

interface Props {
    onglets: Onglet[];
    ongletActif: string;
    onChangerOnglet: (key: string) => void;
}

function BarreNavigationSecondaire({ onglets, ongletActif, onChangerOnglet }: Props) {
    if (onglets.length === 0) {
        return null;
    }

    return (
        <nav className="bg-white border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-center gap-2 flex-wrap">
                {onglets.map((onglet) => (
                    <button
                        key={onglet.key}
                        type="button"
                        onClick={() => onChangerOnglet(onglet.key)}
                        className={`text-sm px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${ongletActif === onglet.key
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        {onglet.label}
                    </button>
                ))}
            </div>
        </nav>
    );
}

export default BarreNavigationSecondaire;