document.addEventListener('DOMContentLoaded', function() {
    const secouristeSelect = document.getElementById('secouristeSelect');
    const articleSelect = document.getElementById('articleSelect');
    const panierCount = document.getElementById('panierCount');
    const totalAmount = document.getElementById('totalAmount');
    const remainingAmount = document.getElementById('remainingAmount');
    const commandeRecap = document.getElementById('commandeRecap');
    const panierModal = document.getElementById('panierModal');
    const panierContent = document.getElementById('panierContent');
    const validerPanier = document.getElementById('validerPanier');

    const SPREADSHEET_ID = '11xIyQeUcBxNqM3jIBcEJzIqxWaq58eKHc2Yruxejiu0'; // Remplace par l'ID de ton Google Sheet
    const API_KEY = 'AIzaSyAqh7LmkWxSAjCJ51A5rvDVqhn3ut5Lyl8'; // Ta clé API

    let panier = [];

    // Charger les secouristes depuis Google Sheets
    function chargerSecouristes() {
        const range = 'Attribution budget secouristes!B10:C36'; // Plage des secouristes
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const secouristes = data.values;
                secouristes.forEach(secouriste => {
                    const option = document.createElement('option');
                    option.value = secouriste[0]; // Nom du secouriste
                    option.textContent = `${secouriste[0]} (${secouriste[1]}€)`;
                    secouristeSelect.appendChild(option);
                });
            })
            .catch(error => console.error('Erreur lors du chargement des secouristes:', error));
    }

    // Charger les articles depuis Google Sheets
function chargerArticles() {
    const range = 'Catalogue (lecture seule)!A4:I1000'; // Plage des articles
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('Réponse de l\'API:', data); // Affiche la réponse complète
            if (data.values) {
                const articles = data.values;
                articles.forEach(article => {
                    const option = document.createElement('option');
                    option.value = article[0]; // Nom de l'article
                    option.textContent = `${article[0]} - ${article[1]}€`; // Nom + Prix
                    articleSelect.appendChild(option);
                });
            } else {
                console.error('Aucune donnée trouvée dans la plage spécifiée.');
            }
        })
        .catch(error => console.error('Erreur lors du chargement des articles:', error));
}

    // Gérer la sélection d'un secouriste
    secouristeSelect.addEventListener('change', function() {
        const secouriste = this.value;
        if (secouriste) {
            // Charger les commandes existantes pour ce secouriste
            chargerCommandes(secouriste);
        }
    });

    // Gérer l'ajout d'un article au panier
    document.getElementById('ajouterAuPanier').addEventListener('click', function() {
        const article = articleSelect.value;
        const taille = document.getElementById('tailleInput').value;
        const couleur = document.getElementById('couleurInput').value;
        const quantite = document.getElementById('quantiteInput').value;
        if (article && taille && couleur && quantite) {
            // Ajouter l'article au panier
            panier.push({ article, taille, couleur, quantite });
            panierCount.textContent = panier.length;
            // Mettre à jour le panier dans Google Sheets
            ajouterCommande(secouristeSelect.value, article, taille, couleur, quantite);
        }
    });

    // Ouvrir/fermer le modal du panier
    panierModal.querySelector('.close').addEventListener('click', function() {
        panierModal.style.display = 'none';
    });

    // Valider le panier
    validerPanier.addEventListener('click', function() {
        if (confirm('Êtes-vous sûr de vouloir valider votre commande ? Il sera possible de la modifier ultérieurement.')) {
            alert('Commande validée !');
            window.location.href = 'https://sites.google.com/view/commande-materiel/briancon?authuser=0';
        }
    });

    // Fonction pour charger les commandes existantes
    function chargerCommandes(secouriste) {
        const range = 'Commande!A2:G'; // Plage des commandes
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const commandes = data.values.filter(commande => commande[0] === secouriste);
                commandeRecap.innerHTML = commandes.map(commande => `
                    <div>
                        ${commande[1]} - ${commande[2]}€ - Taille: ${commande[3]} - Couleur: ${commande[4]} - Quantité: ${commande[5]} - Sous-total: ${commande[6]}€
                    </div>
                `).join('');
            })
            .catch(error => console.error('Erreur lors du chargement des commandes:', error));
    }

    // Fonction pour ajouter une commande dans Google Sheets
    function ajouterCommande(secouriste, article, taille, couleur, quantite) {
        const range = 'Commande!A2:G'; // Plage des commandes
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&key=${API_KEY}`;

        const values = [[secouriste, article, taille, couleur, quantite]];
        const body = { values };

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        .then(response => response.json())
        .then(data => console.log('Commande ajoutée:', data))
        .catch(error => console.error('Erreur lors de l\'ajout de la commande:', error));
    }

    chargerSecouristes();
    chargerArticles();
});