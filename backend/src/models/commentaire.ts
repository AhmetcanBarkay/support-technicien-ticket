// Représente un commentaire sur un ticket
interface Commentaire {
    id: number;
    contenu: string;
    date_envoi: Date;
    id_ticket: number;
    id_personne: number;
}

export default Commentaire;
