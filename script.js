document.addEventListener('DOMContentLoaded', () => {
    const secouristeSelect = document.getElementById('secouristeSelect');
    const articleSelect = document.getElementById('articleSelect');
    const quantiteInput = document.getElementById('quantiteInput');
    const ajouterAuPanier = document.getElementById('ajouterAuPanier');
    const commandeRecap = document.getElementById('commandeRecap');
    const validerCommande = document.getElementById('validerCommande');

    let panier = [];

    function chargerSecouristes() {
        fetch('/get-secouristes')
            .then(response => response.json())
            .then(data => {
                data.secouristes.forEach(secouriste => {
                    const option = document.createElement('option');
                    option.value = secouriste;
                    option.textContent = secouriste;
                    secouristeSelect.appendChild(option);
                });
            });
    }

    function chargerArticles() {
        fetch('/get-articles')
            .then(response => response.json())
            .then(data => {
                data.articles.forEach(article => {
                    const option = document.createElement('option');
                    option.value = article;
                    option.textContent = article;
                    articleSelect.appendChild(option);
                });
            });
    }

    function afficherPanier() {
        commandeRecap.innerHTML = panier.map((item, index) => `
            <div>
                ${item.article} - ${item.quantite}
                <button onclick="supprimerArticle(${index})">🗑️</button>
            </div>
        `).join('');
    }

    window.supprimerArticle = function(index) {
        panier.splice(index, 1);
        afficherPanier();
        mettreAJourPanier();
    };

    ajouterAuPanier.addEventListener('click', () => {
        const article = articleSelect.value;
        const quantite = parseInt(quantiteInput.value);

        if (article && quantite) {
            panier.push({ article, quantite });
            afficherPanier();
            mettreAJourPanier();
        } else {
            alert('Veuillez sélectionner un article et une quantité.');
        }
    });

    secouristeSelect.addEventListener('change', () => {
        const secouriste = secouristeSelect.value;
        if (secouriste) {
            fetch(`/get-panier?secouriste=${secouriste}`)
                .then(response => response.json())
                .then(data => {
                    panier = data.panier;
                    afficherPanier();
                });
        }
    });

    validerCommande.addEventListener('click', () => {
        if (confirm('Êtes-vous sûr de valider votre commande ?')) {
            fetch('/valider-commande', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ secouriste: secouristeSelect.value, panier })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Commande validée !');
                    panier = [];
                    afficherPanier();
                } else {
                    alert('Erreur lors de la validation de la commande.');
                }
            });
        }
    });

    function mettreAJourPanier() {
        fetch('/mettre-ajour-panier', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ secouriste: secouristeSelect.value, panier })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alert('Erreur lors de la mise à jour du panier.');
            }
        });
    }

    chargerSecouristes();
    chargerArticles();
});