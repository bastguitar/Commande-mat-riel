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

    function showLoading() {
        loading.style.display = 'block';
    }

    function hideLoading() {
        loading.style.display = 'none';
    }

    function reinitialiserChamps() {
        document.getElementById('tailleInput').value = '';
        document.getElementById('couleurInput').value = '';
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
                const secouristes = data.values || [];
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
                const articles = data.values || [];
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

    ajouterAuPanier.addEventListener('click', function() {
        const secouriste = secouristeSelect.value;
        const article = articleSelect.value.split(' - ')[0];
        const taille = document.getElementById('tailleInput').value;
        const couleur = document.getElementById('couleurInput').value;
        const quantite = parseInt(quantiteInput.value);
        const prix = parseFloat(articleSelect.value.split(' - ')[1].replace('€', '').replace(',', '.'));
        const sousTotal = prix * quantite;

        panier.push({ secouriste, article, taille, couleur, quantite, sousTotal });
        afficherPanier();
        reinitialiserChamps();
    });

    function afficherPanier() {
        commandeRecap.innerHTML = panier.map((item, index) => `
            <div>
                ${item.article} - ${item.taille || 'N/A'} - ${item.couleur || 'N/A'} - ${item.quantite} - ${item.sousTotal.toFixed(2)}€
                <button onclick="supprimerArticle(${index})">🗑️</button>
            </div>
        `).join('');
    }

    window.supprimerArticle = function(index) {
        panier.splice(index, 1);
        afficherPanier();
    };

    chargerSecouristes();
    chargerArticles();

    quantiteInput.addEventListener('input', mettreAJourSousTotal);
    articleSelect.addEventListener('change', mettreAJourSousTotal);
});
