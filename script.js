document.addEventListener('DOMContentLoaded', () => {

    // --- SÉLECTION DES ÉLÉMENTS (ÉCRAN D'ACCUEIL) ---
    const welcomeScreen = document.getElementById('welcome-screen');
    const startSimBtn = document.getElementById('start-sim-btn');

    // --- SÉLECTION DES ÉLÉMENTS (ÉCRAN CALCULATEUR) ---
    const calculatorScreen = document.getElementById('calculator-screen');
    const backToWelcomeBtn = document.getElementById('back-to-welcome-btn');
    const coutCampagneInput = document.getElementById('cout-campagne');
    const produitsContainer = document.getElementById('produits-container');
    const addProductBtn = document.getElementById('add-product-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const outputsSection = document.getElementById('outputs-section');
    const seuilPrincipalValeurSpan = document.getElementById('seuil-principal-valeur');
    const repartitionVentesUl = document.getElementById('repartition-ventes');
    const advancedOptionsSection = document.getElementById('advanced-options-section');
    const beneficeSouhaiteInput = document.getElementById('benefice-souhaite');
    const coussinSecuriteInput = document.getElementById('coussin-securite');

    // --- VARIABLES D'ÉTAT POUR LE CALCUL AVANCÉ ---
    let baseSeuilCA = 0;
    let baseRepartition = [];

    // --- NAVIGATION ENTRE ÉCRANS ---
    startSimBtn.addEventListener('click', () => {
        welcomeScreen.style.display = 'none';
        calculatorScreen.style.display = 'block';
    });

    backToWelcomeBtn.addEventListener('click', () => {
        calculatorScreen.style.display = 'none';
        welcomeScreen.style.display = 'block';
        // Réinitialiser le formulaire en revenant
        outputsSection.style.display = 'none';
        advancedOptionsSection.style.display = 'none';
        beneficeSouhaiteInput.value = '';
        coussinSecuriteInput.value = '';
    });

    // --- LOGIQUE DU CALCULATEUR ---

    // Met à jour l'UI pour mono vs multi-produits
    function updateUIMode() {
        const produitItems = document.querySelectorAll('.produit-item');
        if (produitItems.length > 1) {
            produitsContainer.classList.remove('mono-produit');
            produitsContainer.classList.add('multi-produits');
        } else {
            produitsContainer.classList.remove('multi-produits');
            produitsContainer.classList.add('mono-produit');
        }
    }

    // Ajoute une nouvelle ligne de produit
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
        updateUIMode();
    }

    // Supprime une ligne de produit
    function supprimerLigneProduit(event) {
        if (event.target.classList.contains('delete-btn')) {
            const produitItems = document.querySelectorAll('.produit-item');
            if (produitItems.length > 1) {
                event.target.parentElement.remove();
                updateUIMode();
            }
        }
    }
    
    // Calcule le seuil de rentabilité initial
    function calculerSeuilInitial() {
        const coutCampagne = parseFloat(coutCampagneInput.value) || 0;
        const produitItems = document.querySelectorAll('.produit-item');
        const produits = [];
        const isMultiProductMode = produitItems.length > 1;

        produitItems.forEach(item => {
            const nom = item.querySelector('.nom-produit').value || "Produit";
            const prixVente = parseFloat(item.querySelector('.prix-vente').value) || 0;
            const coutRevient = parseFloat(item.querySelector('.cout-revient').value) || 0;
            const mixVentes = isMultiProductMode ? (parseFloat(item.querySelector('.mix-ventes').value) || 0) : 10;
            if (prixVente > 0) produits.push({ nom, prixVente, coutRevient, mixVentes });
        });

        if (coutCampagne <= 0 || produits.length === 0) {
             alert("Veuillez renseigner le coût de la campagne et au moins un produit.");
             return;
        }

        let margeTotalePonderee = 0, caTotalPondere = 0, totalMix = 0;
        produits.forEach(p => {
            const margeUnitaire = p.prixVente - p.coutRevient;
            if(p.mixVentes > 0) {
                margeTotalePonderee += margeUnitaire * p.mixVentes;
                caTotalPondere += p.prixVente * p.mixVentes;
                totalMix += p.mixVentes;
            }
        });

        if (totalMix === 0) return;
        const margeMoyennePonderee = margeTotalePonderee / totalMix;
        if (margeMoyennePonderee <= 0) {
            baseSeuilCA = Infinity;
            baseRepartition = [];
            seuilPrincipalValeurSpan.textContent = "∞";
            repartitionVentesUl.innerHTML = "<li>Vos coûts sont supérieurs à vos prix de vente. Rentabilité impossible.</li>";
            outputsSection.style.display = "block";
            advancedOptionsSection.style.display = "none";
            return;
        }
        
        const seuilTotalVentes = coutCampagne / margeMoyennePonderee;
        const caMoyenParVente = caTotalPondere / totalMix;
        
        baseSeuilCA = seuilTotalVentes * caMoyenParVente;
        baseRepartition = produits.map(p => ({
            nom: p.nom,
            quantite: seuilTotalVentes * (p.mixVentes / totalMix)
        }));

        // Réinitialiser les champs avancés avant d'afficher les résultats
        beneficeSouhaiteInput.value = '';
        coussinSecuriteInput.value = '';

        seuilPrincipalValeurSpan.textContent = `${Math.round(baseSeuilCA).toLocaleString('fr-FR')} FCFA`;
        repartitionVentesUl.innerHTML = baseRepartition
            .filter(p => p.quantite > 0)
            .map(p => `<li><strong>${Math.round(p.quantite)}</strong> x ${p.nom}</li>`)
            .join('');

        outputsSection.style.display = "block";
        advancedOptionsSection.style.display = "block";
    }

    // Recalcule le CA final avec les options de bénéfice et de coussin
    function recalculateWithAdvancedOptions() {
        if (baseSeuilCA === 0 || baseSeuilCA === Infinity) return;

        const beneficeSouhaite = parseFloat(beneficeSouhaiteInput.value) || 0;
        const coussinSecurite = parseFloat(coussinSecuriteInput.value) || 0;

        let caAvecBenefice = baseSeuilCA + beneficeSouhaite;
        let caFinal = caAvecBenefice;

        if (coussinSecurite > 0 && coussinSecurite < 100) {
            caFinal = caAvecBenefice / (1 - (coussinSecurite / 100));
        }

        const ratio = (baseSeuilCA > 0) ? (caFinal / baseSeuilCA) : 0;

        seuilPrincipalValeurSpan.textContent = `${Math.round(caFinal).toLocaleString('fr-FR')} FCFA`;
        repartitionVentesUl.innerHTML = baseRepartition
            .filter(p => p.quantite > 0)
            .map(p => `<li><strong>${Math.round(p.quantite * ratio)}</strong> x ${p.nom}</li>`)
            .join('');
    }

    // --- ÉCOUTEURS D'ÉVÉNEMENTS ---
    calculateBtn.addEventListener('click', calculerSeuilInitial);
    beneficeSouhaiteInput.addEventListener('keyup', recalculateWithAdvancedOptions);
    coussinSecuriteInput.addEventListener('keyup', recalculateWithAdvancedOptions);
    addProductBtn.addEventListener('click', ajouterLigneProduit);
    produitsContainer.addEventListener('click', supprimerLigneProduit);

    // Initialisation de l'interface au chargement
    updateUIMode();
});
