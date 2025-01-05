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

    function showLoading() {
        loading.style.display = 'block';
    }

    function hideLoading() {
        loading.style.display = 'none';
    }

    function reinitialiserChamps() {
        document.getElementById('tailleInput').value = '';
        document.getElementById('couleurInput').value = '';
        document.getElementById('quantiteInput').value = 1;
        sousTotal.textContent = 'Sous-total: 0€';
        articleSelect.selectedIndex = 0;  // Reset article selection
    }

    function chargerSecouristes() {
        showLoading();
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
                hideLoading();
            })
            .catch(error => {
                console.error('Erreur lors du chargement des secouristes:', error);
                hideLoading();
            });
    }

    function chargerArticles() {
        showLoading();
        const range = 'Catalogue (lecture seule)!A4:I1000';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const articles = data.values;
                articles.forEach(article => {
                    const option = document.createElement('option');
                    option.value = `${article[0]} - ${article[1]}€`; // Nom + Prix
                    option.textContent = `${article[0]} - ${article[1]}€`; // Nom + Prix
                    articleSelect.appendChild(option);
                });
                hideLoading();
            })
            .catch(error => {
                console.error('Erreur lors du chargement des articles:', error);
                hideLoading();
            });
    }

    function mettreAJourSousTotal() {
        const article = articleSelect.value;
        const quantite = parseInt(quantiteInput.value);
        const prix = parseFloat(article.split(' - ')[1].replace('€', '')); // Extraire le prix et le convertir en nombre
        const sousTotalCalcul = isNaN(prix) ? 0 : (prix * quantite).toFixed(2);  // Fix NaN issue
        sousTotal.textContent = `Sous-total: ${sousTotalCalcul}€`;
    }

    ajouterAuPanier.addEventListener('click', function() {
        const article = articleSelect.value.split(' - ')[0]; // Extract article name
        const taille = document.getElementById('tailleInput').value;
        const couleur = document.getElementById('couleurInput').value;
        const quantite = parseInt(quantiteInput.value);
        const prix = parseFloat(articleSelect.value.split(' - ')[1].replace('€', '')); // Extract and parse price
        const sousTotalCalcul = isNaN(prix) ? 0 : (prix * quantite).toFixed(2);  // Fix NaN issue

        if (article && quantite) {
            panier.push({ article, taille, couleur, quantite, sousTotal: sousTotalCalcul });
            panierCount.textContent = panier.length;

            ajouterCommande(secouristeSelect.value, article, taille, couleur, quantite, sousTotalCalcul);

            afficherPanier();
            mettreAJourMontants();

            reinitialiserChamps();
        } else {
            console.log('L\'article et la quantité sont obligatoires');
        }
    });

    function afficherPanier() {
        commandeRecap.innerHTML = panier.map((item, index) => `
            <div>
                ${item.article} - ${item.taille || 'N/A'} - ${item.couleur || 'N/A'} - ${item.quantite} - ${item.sousTotal}€
                <button onclick="supprimerArticle(${index})">🗑️</button>
            </div>
        `).join('');
    }

    window.supprimerArticle = function(index) {
        panier.splice(index, 1);
        panierCount.textContent = panier.length;
        afficherPanier();
        mettreAJourMontants();
    };

    function mettreAJourMontants() {
        const total = panier.reduce((acc, item) => acc + parseFloat(item.sousTotal), 0);
        totalAmount.textContent = `Total: ${total.toFixed(2)}€`;
        const remaining = montantInitial - total;
        remainingAmount.textContent = `Montant disponible: ${remaining.toFixed(2)}€`;
        remainingAmount.className = remaining >= 0 ? 'positive' : 'negative';  // Apply class based on amount
    }

    validerCommande.addEventListener('click', function() {
        if (confirm('Êtes-vous sûr de valider votre commande ?')) {
            alert('Commande validée !');
            window.location.href = 'https://sites.google.com/view/commande-materiel/accueil?authuser=0';
        }
    });

    function ajouterCommande(secouriste, article, taille, couleur, quantite, sousTotal) {
        const range = 'Commande!A1'; // Plage de départ (peut être A1 même si la feuille est vide)
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&key=${API_KEY}`;

        const values = [[secouriste, article, taille || 'N/A', couleur || 'N/A', quantite, sousTotal]];
        const body = { values };

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => console.log('Commande ajoutée:', data))
        .catch(error => console.error('Erreur lors de l\'ajout de la commande:', error));
    }

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

    secouristeSelect.addEventListener('change', function() {
        const secouriste = this.value;
        if (secouriste) {
            chargerMontantOctroye(secouriste);
            chargerCommandes(secouriste);
        } else {
            montantOctroye.textContent = '';
            panier = [];
            panierCount.textContent = 0;
            totalAmount.textContent = 'Total: 0€';
            remainingAmount.textContent = 'Montant disponible: 0€';
            remainingAmount.className = '';  // Reset class
            commandeRecap.innerHTML = '';
        }
    });

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

    chargerSecouristes();
    chargerArticles();

    for (let i = 2; i <= 50; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        quantiteInput.appendChild(option);
    }

    quantiteInput.addEventListener('change', mettreAJourSousTotal);
    articleSelect.addEventListener('change', mettreAJourSousTotal);

    reinitialiserChamps();
});