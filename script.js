document.addEventListener('DOMContentLoaded', () => {

    // --- SÉLECTION DES ÉLÉMENTS DU DOM ---
    const coutCampagneInput = document.getElementById('cout-campagne');
    const produitsContainer = document.getElementById('produits-container');
    const seuilPrincipalValeurSpan = document.getElementById('seuil-principal-valeur');
    const repartitionVentesUl = document.getElementById('repartition-ventes');
    const calculateBtn = document.getElementById('calculate-btn');
    const addProductBtn = document.getElementById('add-product-btn');

    // --- MOTEUR DE CALCUL MIS À JOUR ---
    function calculerRentabilite(data) {
        const { coutCampagne, produits } = data;
        if (coutCampagne <= 0 || produits.length === 0) return null;

        let margeTotalePonderee = 0;
        let caTotalPondere = 0; // NOUVEAU : On calcule aussi le CA moyen pondéré
        let totalMix = 0;
        
        produits.forEach(p => {
            const margeUnitaire = p.prixVente - p.coutRevient;
            margeTotalePonderee += margeUnitaire * p.mixVentes;
            caTotalPondere += p.prixVente * p.mixVentes; // Ajout du calcul du CA pondéré
            totalMix += p.mixVentes;
        });

        if (totalMix === 0) return null;
        const margeMoyennePonderee = margeTotalePonderee / totalMix;

        if (margeMoyennePonderee <= 0) return { seuilCA: Infinity, repartition: [] };
        
        const seuilTotalVentes = coutCampagne / margeMoyennePonderee;
        
        // NOUVEAU CALCUL : Chiffre d'Affaires Cible
        const caMoyenParVente = caTotalPondere / totalMix;
        const seuilChiffreAffaires = seuilTotalVentes * caMoyenParVente;

        const repartition = produits.map(p => ({
            nom: p.nom,
            quantite: Math.round(seuilTotalVentes * (p.mixVentes / totalMix))
        }));

        return {
            seuilCA: Math.round(seuilChiffreAffaires),
            repartition: repartition
        };
    }

    // --- GESTION DE L'INTERFACE MIS À JOUR ---
    function mettreAJourCalculs() {
        // ... (la partie récupération des données reste identique) ...
        const coutCampagne = parseFloat(coutCampagneInput.value) || 0;
        const produitItems = document.querySelectorAll('.produit-item');
        const produits = [];
        produitItems.forEach(item => {
            const nom = item.querySelector('.nom-produit').value || "Produit non nommé";
            const prixVente = parseFloat(item.querySelector('.prix-vente').value) || 0;
            const coutRevient = parseFloat(item.querySelector('.cout-revient').value) || 0;
            const mixVentes = parseFloat(item.querySelector('.mix-ventes').value) || 0;
            if (prixVente > 0) { produits.push({ nom, prixVente, coutRevient, mixVentes }); }
        });
        
        const data = { coutCampagne, produits };
        const resultat = calculerRentabilite(data);

        // MISE À JOUR DE L'AFFICHAGE
        if (resultat) {
            if (resultat.seuilCA === Infinity) {
                seuilPrincipalValeurSpan.textContent = "∞";
                repartitionVentesUl.innerHTML = "<li>Vos coûts sont supérieurs à vos prix de vente. Rentabilité impossible.</li>";
            } else {
                // Formatter le nombre pour la lisibilité
                seuilPrincipalValeurSpan.textContent = `${resultat.seuilCA.toLocaleString('fr-FR')} FCFA`;
                repartitionVentesUl.innerHTML = resultat.repartition
                    .map(p => `<li><strong>${p.quantite}</strong> x ${p.nom}</li>`)
                    .join('');
            }
        } else {
            seuilPrincipalValeurSpan.textContent = "0 FCFA";
            repartitionVentesUl.innerHTML = "";
        }
    }

    // --- FONCTIONS D'AJOUT/SUPPRESSION (identiques) ---
    function ajouterLigneProduit() {
        const newProductLine = document.createElement('div');
        newProductLine.classList.add('produit-item');
        newProductLine.innerHTML = `
            <input type="text" class="nom-produit" placeholder="Nom du produit">
            <input type="number" class="prix-vente" placeholder="Prix de vente">
            <input type="number" class="cout-revient" placeholder="Coût de revient">
            <input type="number" class="mix-ventes" placeholder="Ventes sur 10">
            <button class="delete-btn">X</button>
        `;
        produitsContainer.appendChild(newProductLine);
    }

    function supprimerLigneProduit(event) {
        if (event.target.classList.contains('delete-btn')) {
            const produitItems = document.querySelectorAll('.produit-item');
            if (produitItems.length > 1) {
                event.target.parentElement.remove();
            }
        }
    }

    // --- ÉCOUTEURS D'ÉVÉNEMENTS (identiques) ---
    calculateBtn.addEventListener('click', mettreAJourCalculs);
    addProductBtn.addEventListener('click', ajouterLigneProduit);
    produitsContainer.addEventListener('click', supprimerLigneProduit);
});
