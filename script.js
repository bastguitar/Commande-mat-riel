document.addEventListener('DOMContentLoaded', function() {
    const SPREADSHEET_ID = '11xIyQeUcBxNqM3jIBcEJzIqxWaq58eKHc2Yruxejiu0';
    const API_KEY = 'AIzaSyBI53kKrn_o6Yd5oo4zRlOC7j36OnW1ZX0';
    
    const DOMElements = {
        secouristeSelect: document.getElementById('secouristeSelect'),
        articleSelect: document.getElementById('articleSelect'),
        panierCount: document.getElementById('panierCount'),
        totalAmount: document.getElementById('totalAmount'),
        remainingAmount: document.getElementById('remainingAmount'),
        montantOctroye: document.getElementById('montantOctroye'),
        commandeRecap: document.getElementById('commandeRecap'),
        quantiteInput: document.getElementById('quantiteInput'),
        sousTotal: document.getElementById('sousTotal'),
        ajouterAuPanier: document.getElementById('ajouterAuPanier'),
        validerCommande: document.getElementById('validerCommande'),
        loading: document.getElementById('loading'),
        tailleInput: document.getElementById('tailleInput'),
        couleurInput: document.getElementById('couleurInput')
    };

    let panier = [];
    let montantInitial = 0;

    function showLoading() {
        DOMElements.loading.style.display = 'block';
    }

    function hideLoading() {
        DOMElements.loading.style.display = 'none';
    }

    function reinitialiserChamps() {
        DOMElements.tailleInput.value = '';
        DOMElements.couleurInput.value = '';
        DOMElements.quantiteInput.value = 1;
        DOMElements.sousTotal.textContent = 'Sous-total: 0€';
        DOMElements.articleSelect.selectedIndex = 0;
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
                    option.value = secouriste[0];
                    option.textContent = secouriste[0];
                    DOMElements.secouristeSelect.appendChild(option);
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
                    option.value = `${article[0]} - ${article[1]}€`;
                    option.textContent = `${article[0]} - ${article[1]}€`;
                    DOMElements.articleSelect.appendChild(option);
                });
                hideLoading();
            })
            .catch(error => {
                console.error('Erreur lors du chargement des articles:', error);
                hideLoading();
            });
    }

    function mettreAJourSousTotal() {
        const article = DOMElements.articleSelect.value;
        const quantite = parseInt(DOMElements.quantiteInput.value);
        const prix = parseFloat(article.split(' - ')[1].replace('€', '').replace(',', '.'));
        const sousTotalCalcul = isNaN(prix) ? 0 : (prix * quantite);
        DOMElements.sousTotal.textContent = `Sous-total: ${sousTotalCalcul.toFixed(2)}€`;
    }

    function ajouterAuPanier() {
        const article = DOMElements.articleSelect.value.split(' - ')[0];
        const taille = DOMElements.tailleInput.value;
        const couleur = DOMElements.couleurInput.value;
        const quantite = parseInt(DOMElements.quantiteInput.value);
        const prix = parseFloat(DOMElements.articleSelect.value.split(' - ')[1].replace('€', '').replace(',', '.'));
        const sousTotalCalcul = isNaN(prix) ? 0 : (prix * quantite);

        if (article && quantite) {
            panier.push({ article, taille, couleur, quantite, sousTotal: sousTotalCalcul });
            DOMElements.panierCount.textContent = panier.length;
            ajouterCommande(DOMElements.secouristeSelect.value, article, taille, couleur, prix, quantite, sousTotalCalcul);
            afficherPanier();
            mettreAJourMontants();
            reinitialiserChamps();
        } else {
            console.log('L\'article et la quantité sont obligatoires');
        }
    }

    function afficherPanier() {
        DOMElements.commandeRecap.innerHTML = panier.map((item, index) => `
            <div>
                ${item.article} - ${item.taille || 'N/A'} - ${item.couleur || 'N/A'} - ${item.quantite} - ${item.sousTotal.toFixed(2)}€
                <button onclick="supprimerArticle(${index})">🗑️</button>
            </div>
        `).join('');
    }

    function supprimerArticle(index) {
        panier.splice(index, 1);
        DOMElements.panierCount.textContent = panier.length;
        afficherPanier();
        mettreAJourMontants();
    }

    function mettreAJourMontants() {
        const total = panier.reduce((acc, item) => acc + parseFloat(item.sousTotal), 0);
        DOMElements.totalAmount.textContent = `Total: ${total.toFixed(2)}€`;
        const remaining = montantInitial - total;
        DOMElements.remainingAmount.textContent = `Montant disponible: ${remaining.toFixed(2)}€`;
        DOMElements.remainingAmount.className = remaining >= 0 ? 'positive' : 'negative';
    }

    function validerCommande() {
        if (confirm('Êtes-vous sûr de valider votre commande ?')) {
            alert('Commande validée !');
            window.location.href = 'https://sites.google.com/view/commande-materiel/accueil?authuser=0';
        }
    }

    function ajouterCommande(secouriste, article, taille, couleur, prix, quantite, sousTotal) {
        const range = 'Commande!A1';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&key=${API_KEY}`;
        const values = [[secouriste, article, taille || 'N/A', couleur || 'N/A', prix.toFixed(2), quantite]];
        const body = { values };

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ range, majorDimension: "ROWS", values })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorInfo => {
                    throw new Error(`Erreur ${response.status}: ${errorInfo.error.message}`);
                });
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
                    montantInitial = parseFloat(secouristeTrouve[1].replace(',', '.'));
                    DOMElements.montantOctroye.textContent = `Montant octroyé: ${montantInitial.toFixed(2)}€`;
                    mettreAJourMontants();
                }
            })
            .catch(error => console.error('Erreur lors du chargement du montant octroyé:', error));
    }

    function chargerCommandes(secouriste) {
        const range = 'Commande!A2:F';
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
                        quantite: parseInt(commande[5]),
                        sousTotal: parseFloat(commande[4]) * parseInt(commande[5])
                    }));
                    DOMElements.panierCount.textContent = panier.length;
                    afficherPanier();
                    mettreAJourMontants();
                }
            })
            .catch(error => console.error('Erreur lors du chargement des commandes:', error));
    }

    DOMElements.ajouterAuPanier.addEventListener('click', ajouterAuPanier);
    DOMElements.validerCommande.addEventListener('click', validerCommande);
    DOMElements.secouristeSelect.addEventListener('change', function() {
        const secouriste = this.value;
        if (secouriste) {
            chargerMontantOctroye(secouriste);
            chargerCommandes(secouriste);
        } else {
            DOMElements.montantOctroye.textContent = '';
            panier = [];
            DOMElements.panierCount.textContent = 0;
            DOMElements.totalAmount.textContent = 'Total: 0€';
            DOMElements.remainingAmount.textContent = 'Montant disponible: 0€';
            DOMElements.remainingAmount.className = '';
            DOMElements.commandeRecap.innerHTML = '';
        }
    });

    for (let i = 2; i <= 50; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        DOMElements.quantiteInput.appendChild(option);
    }

    DOMElements.quantiteInput.addEventListener('change', mettreAJourSousTotal);
    DOMElements.articleSelect.addEventListener('change', mettreAJourSousTotal);
    reinitialiserChamps();
    chargerSecouristes();
    chargerArticles();
});