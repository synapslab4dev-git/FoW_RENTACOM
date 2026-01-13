// --- 1. ATTENDRE QUE LE DOM SOIT CHARGÉ ---
document.addEventListener('DOMContentLoaded', () => {

    // --- 2. SÉLECTION DES ÉLÉMENTS DU DOM ---
    const coutCampagneInput = document.getElementById('cout-campagne');
    const produitsContainer = document.getElementById('produits-container');
    const seuilTotalVentesSpan = document.getElementById('seuil-total-ventes');
    const repartitionVentesUl = document.getElementById('repartition-ventes');

    // --- 3. LE MOTEUR DE CALCUL (Logique pure) ---
    // Prend les données en entrée, retourne les résultats.
    function calculerRentabilite(data) {
        const { coutCampagne, produits } = data;

        if (coutCampagne <= 0 || produits.length === 0) {
            return null; // Pas de calcul si les données de base manquent
        }

        // Étape 1 & 2 : Calculer la marge moyenne pondérée
        let margeTotalePonderee = 0;
        let totalMix = 0;
        produits.forEach(p => {
            const margeUnitaire = p.prixVente - p.coutRevient;
            margeTotalePonderee += margeUnitaire * p.mixVentes;
            totalMix += p.mixVentes;
        });

        if (totalMix === 0) return null;
        const margeMoyennePonderee = margeTotalePonderee / totalMix;

        // Étape 3 : Calculer le seuil de rentabilité global
        if (margeMoyennePonderee <= 0) return { seuilTotal: Infinity, repartition: [] };
        const seuilTotal = coutCampagne / margeMoyennePonderee;

        // Étape 4 : Calculer la répartition par produit
        const repartition = produits.map(p => ({
            nom: p.nom,
            quantite: Math.round(seuilTotal * (p.mixVentes / totalMix))
        }));

        return {
            seuilTotal: Math.ceil(seuilTotal),
            repartition: repartition
        };
    }

    // --- 4. GESTION DE L'INTERFACE (UI) ---
    
    // Fonction principale qui orchestre tout
    function mettreAJourCalculs() {
        // a. Récupérer les données depuis les champs input
        const coutCampagne = parseFloat(coutCampagneInput.value) || 0;
        const produitItems = document.querySelectorAll('.produit-item');
        
        const produits = [];
        produitItems.forEach(item => {
            const nom = item.querySelector('.nom-produit').value || "Produit non nommé";
            const prixVente = parseFloat(item.querySelector('.prix-vente').value) || 0;
            const coutRevient = parseFloat(item.querySelector('.cout-revient').value) || 0;
            const mixVentes = parseFloat(item.querySelector('.mix-ventes').value) || 0;

            if (prixVente > 0) { // On ajoute le produit seulement s'il a un prix
                 produits.push({ nom, prixVente, coutRevient, mixVentes });
            }
        });
        
        // b. Appeler le moteur de calcul avec ces données
        const data = { coutCampagne, produits };
        const resultat = calculerRentabilite(data);

        // c. Afficher les résultats dans le DOM
        if (resultat) {
            if (resultat.seuilTotal === Infinity) {
                seuilTotalVentesSpan.textContent = "∞";
                repartitionVentesUl.innerHTML = "<li>Vos coûts sont supérieurs à vos prix de vente. Rentabilité impossible.</li>";
            } else {
                seuilTotalVentesSpan.textContent = resultat.seuilTotal;
                repartitionVentesUl.innerHTML = resultat.repartition
                    .map(p => `<li><strong>${p.quantite}</strong> x ${p.nom}</li>`)
                    .join('');
            }
        } else {
            seuilTotalVentesSpan.textContent = "0";
            repartitionVentesUl.innerHTML = "";
        }
    }

    // --- 5. ÉCOUTEURS D'ÉVÉNEMENTS ---
    // On relance le calcul à chaque fois qu'une valeur change
    const allInputs = document.querySelectorAll('input');
    allInputs.forEach(input => {
        input.addEventListener('keyup', mettreAJourCalculs);
        input.addEventListener('change', mettreAJourCalculs);
    });
});
