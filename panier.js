document.addEventListener('DOMContentLoaded', function() {
    const paniersSecouristes = document.getElementById('paniersSecouristes');
    const telechargerRécap = document.getElementById('telechargerRécap');
    const SPREADSHEET_ID = '11xIyQeUcBxNqM3jIBcEJzIqxWaq58eKHc2Yruxejiu0';
    const API_KEY = 'AIzaSyBI53kKrn_o6Yd5oo4zRlOC7j36OnW1ZX0';

    function chargerPaniers() {
        const range = 'Commande!A2:F';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.values) {
                    const commandes = data.values;
                    const secouristesPaniers = {};

                    commandes.forEach(commande => {
                        const [secouriste, article, taille, couleur, prix, quantite] = commande;
                        const sousTotal = parseFloat(prix) * parseInt(quantite);

                        if (!secouristesPaniers[secouriste]) {
                            secouristesPaniers[secouriste] = [];
                        }

                        secouristesPaniers[secouriste].push({ article, taille, couleur, prix, quantite, sousTotal });
                    });

                    afficherPaniers(secouristesPaniers);
                }
            })
            .catch(error => console.error('Erreur lors du chargement des paniers:', error));
    }

    function afficherPaniers(secouristesPaniers) {
        paniersSecouristes.innerHTML = '';

        for (const secouriste in secouristesPaniers) {
            const panier = secouristesPaniers[secouriste];
            const total = panier.reduce((acc, item) => acc + item.sousTotal, 0);

            const secouristeDiv = document.createElement('div');
            secouristeDiv.innerHTML = `
                <h2 style="font-weight: bold; text-decoration: underline;">${secouriste}</h2>
                ${panier.map(item => `
                    <div>
                        ${item.article} - ${item.taille || 'N/A'} - ${item.couleur || 'N/A'} - ${item.prix}€ - ${item.quantite} - ${item.sousTotal.toFixed(2)}€
                        <button onclick="supprimerArticle('${secouriste}', '${item.article}')">🗑️</button>
                    </div>
                `).join('')}
                <div style="font-weight: bold; text-align: right;">Total: ${total.toFixed(2)}€</div>
            `;

            paniersSecouristes.appendChild(secouristeDiv);
        }
    }

    window.supprimerArticle = function(secouriste, article) {
        const range = 'Commande!A2:F';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.values) {
                    const commandes = data.values.filter(commande => !(commande[0] === secouriste && commande[1] === article));
                    const body = { values: commandes };

                    fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    })
                    .then(response => response.json())
                    .then(() => chargerPaniers())
                    .catch(error => console.error('Erreur lors de la suppression de l\'article:', error));
                }
            })
            .catch(error => console.error('Erreur lors de la récupération des commandes:', error));
    };

    telechargerRécap.addEventListener('click', function() {
        const range = 'Commande!A2:F';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.values) {
                    const csvContent = "data:text/csv;charset=utf-8,"
                        + data.values.map(e => e.join(",")).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "panier_secouristes.csv");
                    document.body.appendChild(link);
                    link.click();
                }
            })
            .catch(error => console.error('Erreur lors du téléchargement du récapitulatif:', error));
    });

    chargerPaniers();
});