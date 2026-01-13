// --- 1. ATTENDRE QUE LE DOM SOIT CHARGÉ ---
document.addEventListener('DOMContentLoaded', () => {

    // --- 2. SÉLECTION DES ÉLÉMENTS DU DOM ---
    const coutCampagneInput = document.getElementById('cout-campagne');
    const produitsContainer = document.getElementById('produits-container');
    const seuilTotalVentesSpan = document.getElementById('seuil-total-ventes');
    const repartitionVentesUl = document.getElementById('repartition-ventes');
    
    // NOUVEAU : On sélectionne notre bouton "Calculer"
    const calculateBtn = document.getElementById('calculate-btn');

    // --- 3. LE MOTEUR DE CALCUL (Logique pure) ---
    // Cette partie ne change pas. C'est notre moteur, il est parfait.
    function calculerRentabilite(data) {
        const { coutCampagne, produits } = data;

        if (coutCampagne <= 0 || produits.length === 0) {
            return null;
        }

        let margeTotalePonderee = 0;
        let totalMix = 0;
        produits.forEach(p => {
            const margeUnitaire = p.prixVente - p.coutRevient;
            margeTotalePonderee += margeUnitaire * p.mixVentes;
            totalMix += p.mixVentes;
        });

        if (totalMix === 0) return null;
        const margeMoyennePonderee = margeTotalePonderee / totalMix;

        if (margeMoyennePonderee <= 0) return { seuilTotal: Infinity, repartition: [] };
        const seuilTotal = coutCampagne / margeMoyennePonderee;

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
    // Cette fonction est maintenant appelée UNIQUEMENT par le bouton
    function mettreAJourCalculs() {
        const coutCampagne = parseFloat(coutCampagneInput.value) || 0;
        const produitItems = document.querySelectorAll('.produit-item');
        
        const produits = [];
        produitItems.forEach(item => {
            const nom = item.querySelector('.nom-produit').value || "Produit non nommé";
            const prixVente = parseFloat(item.querySelector('.prix-vente').value) || 0;
            const coutRevient = parseFloat(item.querySelector('.cout-revient').value) || 0;
            const mixVentes = parseFloat(item.querySelector('.mix-ventes').value) || 0;

            if (prixVente > 0) {
                 produits.push({ nom, prixVente, coutRevient, mixVentes });
            }
        });
        
        const data = { coutCampagne, produits };
        const resultat = calculerRentabilite(data);

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

    // --- 5. ÉCOUTEURS D'ÉVÉNEMENTS (LA PARTIE MODIFIÉE) ---
    
    // SUPPRIMÉ : L'ancienne logique qui écoutait tous les inputs.
    
    // NOUVEAU : On ajoute un seul écouteur d'événement sur le clic du bouton.
    // C'est lui, et seulement lui, qui déclenche le calcul.
    calculateBtn.addEventListener('click', mettreAJourCalculs);
});
