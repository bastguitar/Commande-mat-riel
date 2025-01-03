document.addEventListener('DOMContentLoaded', function() {
    const secouristeSelect = document.getElementById('secouristeSelect');
    const articleSelect = document.getElementById('articleSelect');
    const panierCount = document.getElementById('panierCount');
    const totalAmount = document.getElementById('totalAmount');
    const remainingAmount = document.getElementById('remainingAmount');
    const montantOctroye = document.getElementById('montantOctroye');
    const commandeRecap = document.getElementById('commandeRecap');
    const quantiteInput = document.getElementById('quantiteInput');
    const sousTotal = document.getElementById('sousTotal');
    const ajouterAuPanier = document.getElementById('ajouterAuPanier');
    const validerCommande = document.getElementById('validerCommande');
    const loading = document.getElementById('loading');

    const SPREADSHEET_ID = '11xIyQeUcBxNqM3jIBcEJzIqxWaq58eKHc2Yruxejiu0';
    const API_KEY = 'AIzaSyBI53kKrn_o6Yd5oo4zRlOC7j36OnW1ZX0';

    let panier = [];
    let montantInitial = 0;

    // Afficher le logo de chargement
    function showLoading() {
        loading.style.display = 'block';
    }

    // Masquer le logo de chargement
    function hideLoading() {
        loading.style.display = 'none';
    }

    // Réinitialiser les champs de sélection d'article
    function reinitialiserChamps() {
        document.getElementById('tailleInput').value = '';
        document.getElementById('couleurInput').value = '';
        document.getElementById('quantiteInput').value = 1;
        sousTotal.textContent = 'Sous-total: 0€';
    }

    // Charger les secouristes
    function chargerSecouristes() {
        showLoading(); // Afficher le logo
        const range = 'Attribution budget secouristes!B10:C36';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const secouristes = data.values;
                secouristes.forEach(secouriste => {
                    const option = document.createElement('option');
                    option.value = secouriste[0]; // Nom du secouriste
                    option.textContent = secouriste[0]; // Nom uniquement
                    secouristeSelect.appendChild(option);
                });
                hideLoading(); // Masquer le logo une fois chargé
            })
            .catch(error => {
                console.error('Erreur lors du chargement des secouristes:', error);
                hideLoading(); // Masquer le logo en cas d'erreur
            });
    }

    // Charger les articles
    function chargerArticles() {
        showLoading(); // Afficher le logo
        const range = 'Catalogue (lecture seule)!A4:I1000';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const articles = data.values;
                articles.forEach(article => {
                    const option = document.createElement('option');
                    option.value = article[0]; // Nom de l'article
                    option.textContent = `${article[0]} - ${article[1]}€`; // Nom + Prix
                    articleSelect.appendChild(option);
                });
                hideLoading(); // Masquer le logo une fois chargé
            })
            .catch(error => {
                console.error('Erreur lors du chargement des articles:', error);
                hideLoading(); // Masquer le logo en cas d'erreur
            });
    }

    // Mettre à jour le sous-total
    function mettreAJourSousTotal() {
        const article = articleSelect.value;
        const quantite = parseInt(quantiteInput.value);
        const prix = articleSelect.options[articleSelect.selectedIndex].text.split(' - ')[1].replace('€', '');
        const sousTotalCalcul = (prix * quantite).toFixed(2);
        sousTotal.textContent = `Sous-total: ${sousTotalCalcul}€`;
    }

    // Ajouter un article au panier
    ajouterAuPanier.addEventListener('click', function() {
    const article = articleSelect.value;
    const taille = document.getElementById('tailleInput').value;
    const couleur = document.getElementById('couleurInput').value;
    const quantite = parseInt(quantiteInput.value);
    const prix = articleSelect.options[articleSelect.selectedIndex].text.split(' - ')[1].replace('€', '');
    const sousTotalCalcul = (prix * quantite).toFixed(2);

    console.log('Article:', article);
    console.log('Taille:', taille);
    console.log('Couleur:', couleur);
    console.log('Quantité:', quantite);

    if (article && taille && couleur && quantite) {
        // Ajouter l'article au panier
        panier.push({ article, taille, couleur, quantite, sousTotal: sousTotalCalcul });
        panierCount.textContent = panier.length;

        // Ajouter la commande à Google Sheets
        ajouterCommande(secouristeSelect.value, article, taille, couleur, quantite, sousTotalCalcul);

        // Mettre à jour l'affichage
        afficherPanier();
        mettreAJourMontants();

        // Réinitialiser les champs
        reinitialiserChamps();
    } else {
        console.log('Un ou plusieurs champs sont vides');
    }
});

    // Afficher le panier
    function afficherPanier() {
        commandeRecap.innerHTML = panier.map((item, index) => `
            <div>
                ${item.article} - ${item.taille} - ${item.couleur} - ${item.quantite} - ${item.sousTotal}€
                <button onclick="supprimerArticle(${index})">🗑️</button>
            </div>
        `).join('');
    }

    // Supprimer un article du panier
    window.supprimerArticle = function(index) {
        panier.splice(index, 1);
        panierCount.textContent = panier.length;
        afficherPanier();
        mettreAJourMontants();
    };

    // Mettre à jour les montants (total et montant disponible)
    function mettreAJourMontants() {
        const total = panier.reduce((acc, item) => acc + parseFloat(item.sousTotal), 0);
        totalAmount.textContent = `Total: ${total.toFixed(2)}€`;
        remainingAmount.textContent = `Montant disponible: ${(montantInitial - total).toFixed(2)}€`;
    }

    // Valider la commande
    validerCommande.addEventListener('click', function() {
        if (confirm('Êtes-vous sûr de valider votre commande ?')) {
            alert('Commande validée !');
            window.location.href = 'https://sites.google.com/view/commande-materiel/accueil?authuser=0';
        }
    });

    // Ajouter une commande à Google Sheets
    function ajouterCommande(secouriste, article, taille, couleur, quantite, sousTotal) {
        const range = 'Commande!A2:G'; // Plage des commandes
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&key=${API_KEY}`;

        const values = [[secouriste, article, taille, couleur, quantite, sousTotal]];
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

    // Charger le montant octroyé pour un secouriste
    function chargerMontantOctroye(secouriste) {
        const range = 'Attribution budget secouristes!B10:C36';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const secouristes = data.values;
                const secouristeTrouve = secouristes.find(s => s[0] === secouriste);
                if (secouristeTrouve) {
                    montantInitial = parseFloat(secouristeTrouve[1]); // Montant octroyé
                    montantOctroye.textContent = `Montant octroyé: ${montantInitial.toFixed(2)}€`;
                    mettreAJourMontants(); // Mettre à jour le montant disponible
                }
            })
            .catch(error => console.error('Erreur lors du chargement du montant octroyé:', error));
    }

    // Gérer la sélection d'un secouriste
    secouristeSelect.addEventListener('change', function() {
        const secouriste = this.value;
        if (secouriste) {
            // Charger le montant octroyé pour ce secouriste
            chargerMontantOctroye(secouriste);
            // Charger les commandes existantes pour ce secouriste
            chargerCommandes(secouriste);
        } else {
            // Réinitialiser les valeurs si aucun secouriste n'est sélectionné
            montantOctroye.textContent = '';
            panier = [];
            panierCount.textContent = 0;
            totalAmount.textContent = 'Total: 0€';
            remainingAmount.textContent = 'Montant disponible: 0€';
            commandeRecap.innerHTML = '';
        }
    });

    // Charger les commandes existantes pour un secouriste
    function chargerCommandes(secouriste) {
        const range = 'Commande!A2:G';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.values) {
                    const commandes = data.values.filter(commande => commande[0] === secouriste);
                    panier = commandes.map(commande => ({
                        article: commande[1],
                        taille: commande[2],
                        couleur: commande[3],
                        quantite: parseInt(commande[4]),
                        sousTotal: parseFloat(commande[5])
                    }));
                    panierCount.textContent = panier.length;
                    afficherPanier();
                    mettreAJourMontants();
                }
            })
            .catch(error => console.error('Erreur lors du chargement des commandes:', error));
    }

    // Charger les données initiales
    chargerSecouristes();
    chargerArticles();

    // Générer les options de quantité (1 à 50)
    for (let i = 2; i <= 50; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        quantiteInput.appendChild(option);
    }

    // Mettre à jour le sous-total lorsque la quantité change
    quantiteInput.addEventListener('change', mettreAJourSousTotal);
    articleSelect.addEventListener('change', mettreAJourSousTotal);

    // Réinitialiser les champs au chargement de la page
    reinitialiserChamps();
});