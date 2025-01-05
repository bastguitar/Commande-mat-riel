const CLIENT_ID = '655084183168-nfgsba3c23gg9ubfdfls7s54bs7eo51e.apps.googleusercontent.com ';
const API_KEY = 'AIzaSyDSv0a9wsPN93J2EwnVVgBR7UGvr478_mI';
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";
const SPREADSHEET_ID = '11xIyQeUcBxNqM3jIBcEJzIqxWaq58eKHc2Yruxejiu0';

function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        scope: SCOPES
    }).then(function () {
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    }, function(error) {
        console.error('Error initializing GAPI client:', error);
    });
}

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        console.log('User signed in');
    } else {
        gapi.auth2.getAuthInstance().signIn();
    }
}

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
    const tailleInput = document.getElementById('tailleInput');
    const couleurInput = document.getElementById('couleurInput');

    let panier = [];
    let montantInitial = 0;

    function showLoading() {
        loading.style.display = 'block';
    }

    function hideLoading() {
        loading.style.display = 'none';
    }

    function reinitialiserChamps() {
        tailleInput.value = '';
        couleurInput.value = '';
        quantiteInput.value = 1;
        sousTotal.textContent = 'Sous-total: 0€';
        articleSelect.selectedIndex = 0;
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
                    option.value = `${article[0]} - ${article[1]}€`;
                    option.textContent = `${article[0]} - ${article[1]}€`;
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
        const prix = parseFloat(article.split(' - ')[1].replace('€', '').replace(',', '.'));
        const sousTotalCalcul = isNaN(prix) ? 0 : (prix * quantite);
        sousTotal.textContent = `Sous-total: ${sousTotalCalcul.toFixed(2)}€`;
    }

    function ajouterAuPanier() {
        const article = articleSelect.value.split(' - ')[0];
        const taille = tailleInput.value;
        const couleur = couleurInput.value;
        const quantite = parseInt(quantiteInput.value);
        const prix = parseFloat(articleSelect.value.split(' - ')[1].replace('€', '').replace(',', '.'));
        const sousTotalCalcul = isNaN(prix) ? 0 : (prix * quantite);

        if (article && quantite) {
            panier.push({ article, taille, couleur, quantite, sousTotal: sousTotalCalcul });
            panierCount.textContent = panier.length;
            savePanier(secouristeSelect.value, panier);
            ajouterCommande(secouristeSelect.value, article, taille, couleur, prix, quantite, sousTotalCalcul);
            afficherPanier();
            mettreAJourMontants();
            reinitialiserChamps();
        } else {
            console.log('L\'article et la quantité sont obligatoires');
        }
    }

    function afficherPanier() {
        commandeRecap.innerHTML = panier.map((item, index) => `
            <div>
                ${item.article} - ${item.taille || 'N/A'} - ${item.couleur || 'N/A'} - ${item.quantite} - ${item.sousTotal.toFixed(2)}€
                <button onclick="supprimerArticle(${index})">🗑️</button>
            </div>
        `).join('');
    }

    function supprimerArticle(index) {
        panier.splice(index, 1);
        panierCount.textContent = panier.length;
        afficherPanier();
        mettreAJourMontants();
    }

    function mettreAJourMontants() {
        const total = panier.reduce((acc, item) => acc + parseFloat(item.sousTotal), 0);
        totalAmount.textContent = `Total: ${total.toFixed(2)}€`;
        const remaining = montantInitial - total;
        remainingAmount.textContent = `Montant disponible: ${remaining.toFixed(2)}€`;
        remainingAmount.className = remaining >= 0 ? 'positive' : 'negative';
    }

    function validerCommande() {
        if (confirm('Êtes-vous sûr de valider votre commande ?')) {
            alert('Commande validée !');
            window.location.href = 'https://sites.google.com/view/commande-materiel/accueil?authuser=0';
        }
    }

    function ajouterCommande(secouriste, article, taille, couleur, prix, quantite, sousTotal) {
        const range = 'Commande!A1';
        const values = [[secouriste, article, taille || 'N/A', couleur || 'N/A', prix.toFixed(2), quantite]];
        const body = { values };

        gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
            valueInputOption: 'USER_ENTERED',
            resource: { values: body.values }
        }).then(function(response) {
            console.log('Commande ajoutée:', response);
        }, function(error) {
            console.error('Erreur lors de l\'ajout de la commande:', error);
        });
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
                    montantOctroye.textContent = `Montant octroyé: ${montantInitial.toFixed(2)}€`;
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
                    panierCount.textContent = panier.length;
                    afficherPanier();
                    mettreAJourMontants();
                }
            })
            .catch(error => console.error('Erreur lors du chargement des commandes:', error));
    }

    function savePanier(secouriste, panier) {
        localStorage.setItem(secouriste, JSON.stringify(panier));
    }

    function loadPanier(secouriste) {
        const panier = localStorage.getItem(secouriste);
        return panier ? JSON.parse(panier) : [];
    }

    secouristeSelect.addEventListener('change', function() {
        const secouriste = this.value;
        if (secouriste) {
            panier = loadPanier(secouriste);
            chargerMontantOctroye(secouriste);
            chargerCommandes(secouriste);
        } else {
            montantOctroye.textContent = '';
            panier = [];
            panierCount.textContent = 0;
            totalAmount.textContent = 'Total: 0€';
            remainingAmount.textContent = 'Montant disponible: 0€';
            remainingAmount.className = '';
            commandeRecap.innerHTML = '';
        }
    });

    ajouterAuPanier.addEventListener('click', ajouterAuPanier);
    validerCommande.addEventListener('click', validerCommande);

    for (let i = 2; i <= 50; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        quantiteInput.appendChild(option);
    }

    quantiteInput.addEventListener('change', mettreAJourSousTotal);
    articleSelect.addEventListener('change', mettreAJourSousTotal);

    reinitialiserChamps();
    chargerSecouristes();
    chargerArticles();
});
function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        scope: SCOPES
    }).then(function () {
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    }, function(error) {
        console.error('Error initializing GAPI client:', error);
    });
}

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        console.log('User signed in');
    } else {
        gapi.auth2.getAuthInstance().signIn();
    }
}

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
    const tailleInput = document.getElementById('tailleInput');
    const couleurInput = document.getElementById('couleurInput');

    let panier = [];
    let montantInitial = 0;

    function showLoading() {
        loading.style.display = 'block';
    }

    function hideLoading() {
        loading.style.display = 'none';
    }

    function reinitialiserChamps() {
        tailleInput.value = '';
        couleurInput.value = '';
        quantiteInput.value = 1;
        sousTotal.textContent = 'Sous-total: 0€';
        articleSelect.selectedIndex = 0;
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
                    option.value = `${article[0]} - ${article[1]}€`;
                    option.textContent = `${article[0]} - ${article[1]}€`;
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
        const prix = parseFloat(article.split(' - ')[1].replace('€', '').replace(',', '.'));
        const sousTotalCalcul = isNaN(prix) ? 0 : (prix * quantite);
        sousTotal.textContent = `Sous-total: ${sousTotalCalcul.toFixed(2)}€`;
    }

    function ajouterAuPanier() {
        const article = articleSelect.value.split(' - ')[0];
        const taille = tailleInput.value;
        const couleur = couleurInput.value;
        const quantite = parseInt(quantiteInput.value);
        const prix = parseFloat(articleSelect.value.split(' - ')[1].replace('€', '').replace(',', '.'));
        const sousTotalCalcul = isNaN(prix) ? 0 : (prix * quantite);

        if (article && quantite) {
            panier.push({ article, taille, couleur, quantite, sousTotal: sousTotalCalcul });
            panierCount.textContent = panier.length;
            savePanier(secouristeSelect.value, panier);
            ajouterCommande(secouristeSelect.value, article, taille, couleur, prix, quantite, sousTotalCalcul);
            afficherPanier();
            mettreAJourMontants();
            reinitialiserChamps();
        } else {
            console.log('L\'article et la quantité sont obligatoires');
        }
    }

    function afficherPanier() {
        commandeRecap.innerHTML = panier.map((item, index) => `
            <div>
                ${item.article} - ${item.taille || 'N/A'} - ${item.couleur || 'N/A'} - ${item.quantite} - ${item.sousTotal.toFixed(2)}€
                <button onclick="supprimerArticle(${index})">🗑️</button>
            </div>
        `).join('');
    }

    function supprimerArticle(index) {
        panier.splice(index, 1);
        panierCount.textContent = panier.length;
        afficherPanier();
        mettreAJourMontants();
    }

    function mettreAJourMontants() {
        const total = panier.reduce((acc, item) => acc + parseFloat(item.sousTotal), 0);
        totalAmount.textContent = `Total: ${total.toFixed(2)}€`;
        const remaining = montantInitial - total;
        remainingAmount.textContent = `Montant disponible: ${remaining.toFixed(2)}€`;
        remainingAmount.className = remaining >= 0 ? 'positive' : 'negative';
    }

    function validerCommande() {
        if (confirm('Êtes-vous sûr de valider votre commande ?')) {
            alert('Commande validée !');
            window.location.href = 'https://sites.google.com/view/commande-materiel/accueil?authuser=0';
        }
    }

    function ajouterCommande(secouriste, article, taille, couleur, prix, quantite, sousTotal) {
        const range = 'Commande!A1';
        const values = [[secouriste, article, taille || 'N/A', couleur || 'N/A', prix.toFixed(2), quantite]];
        const body = { values };

        gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
            valueInputOption: 'USER_ENTERED',
            resource: { values: body.values }
        }).then(function(response) {
            console.log('Commande ajoutée:', response);
        }, function(error) {
            console.error('Erreur lors de l\'ajout de la commande:', error);
        });
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
                    montantOctroye.textContent = `Montant octroyé: ${montantInitial.toFixed(2)}€`;
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
                    panierCount.textContent = panier.length;
                    afficherPanier();
                    mettreAJourMontants();
                }
            })
            .catch(error => console.error('Erreur lors du chargement des commandes:', error));
    }

    function savePanier(secouriste, panier) {
        localStorage.setItem(secouriste, JSON.stringify(panier));
    }

    function loadPanier(secouriste) {
        const panier = localStorage.getItem(secouriste);
        return panier ? JSON.parse(panier) : [];
    }

    secouristeSelect.addEventListener('change', function() {
        const secouriste = this.value;
        if (secouriste) {
            panier = loadPanier(secouriste);
            chargerMontantOctroye(secouriste);
            chargerCommandes(secouriste);
        } else {
            montantOctroye.textContent = '';
            panier = [];
            panierCount.textContent = 0;
            totalAmount.textContent = 'Total: 0€';
            remainingAmount.textContent = 'Montant disponible: 0€';
            remainingAmount.className = '';
            commandeRecap.innerHTML = '';
        }
    });

    ajouterAuPanier.addEventListener('click', ajouterAuPanier);
    validerCommande.addEventListener('click', validerCommande);

    for (let i = 2; i <= 50; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        quantiteInput.appendChild(option);
    }

    quantiteInput.addEventListener('change', mettreAJourSousTotal);
    articleSelect.addEventListener('change', mettreAJourSousTotal);

    reinitialiserChamps();
    chargerSecouristes();
    chargerArticles();
});