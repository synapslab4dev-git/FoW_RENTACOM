document.addEventListener('DOMContentLoaded', () => {
    // --- ÉCRAN D'ACCUEIL ---
    const welcomeScreen = document.getElementById('welcome-screen');
    const startSimBtn = document.getElementById('start-sim-btn');
    
    // --- ÉCRAN CALCULATEUR ---
    const calculatorScreen = document.getElementById('calculator-screen');
    const backToWelcomeBtn = document.getElementById('back-to-welcome-btn');
    const coutCampagneInput = document.getElementById('cout-campagne');
    const produitsContainer = document.getElementById('produits-container');
    const addProductBtn = document.getElementById('add-product-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const outputsSection = document.getElementById('outputs-section');
    const seuilPrincipalLabel = document.getElementById('seuil-principal-label');
    const seuilPrincipalValeurSpan = document.getElementById('seuil-principal-valeur');
    const repartitionVentesUl = document.getElementById('repartition-ventes');
    const advancedOptionsSection = document.getElementById('advanced-options-section');
    const beneficeSouhaiteInput = document.getElementById('benefice-souhaite');
    const coussinSecuriteInput = document.getElementById('coussin-securite');

    let baseSeuilCA = 0; // Stocke le seuil de rentabilité initial
    let baseRepartition = []; // Stocke la répartition initiale

    // --- NAVIGATION ENTRE ÉCRANS ---
    startSimBtn.addEventListener('click', () => {
        welcomeScreen.style.display = 'none';
        calculatorScreen.style.display = 'block';
    });

    backToWelcomeBtn.addEventListener('click', () => {
        calculatorScreen.style.display = 'none';
        welcomeScreen.style.display = 'block';
        // Optionnel : réinitialiser le formulaire en revenant
        outputsSection.style.display = 'none';
        advancedOptionsSection.style.display = 'none';
    });

    // --- LOGIQUE DU CALCULATEUR ---
    function recalculateWithAdvancedOptions() {
        const beneficeSouhaite = parseFloat(beneficeSouhaiteInput.value) || 0;
        const coussinSecurite = parseFloat(coussinSecuriteInput.value) || 0;

        let caAvecBenefice = baseSeuilCA + beneficeSouhaite;
        let caFinal = caAvecBenefice;

        if (coussinSecurite > 0 && coussinSecurite < 100) {
            caFinal = caAvecBenefice / (1 - (coussinSecurite / 100));
        }

        const ratio = caFinal / baseSeuilCA;

        seuilPrincipalValeurSpan.textContent = `${Math.round(caFinal).toLocaleString('fr-FR')} FCFA`;
        repartitionVentesUl.innerHTML = baseRepartition
            .map(p => `<li><strong>${Math.round(p.quantite * ratio)}</strong> x ${p.nom}</li>`)
            .join('');
    }

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

        if (coutCampagne <= 0 || produits.length === 0) return null;

        let margeTotalePonderee = 0, caTotalPondere = 0, totalMix = 0;
        produits.forEach(p => {
            const margeUnitaire = p.prixVente - p.coutRevient;
            if(p.mixVentes > 0) {
                margeTotalePonderee += margeUnitaire * p.mixVentes;
                caTotalPondere += p.prixVente * p.mixVentes;
                totalMix += p.mixVentes;
            }
        });

        if (totalMix === 0) return null;
        const margeMoyennePonderee = margeTotalePonderee / totalMix;
        if (margeMoyennePonderee <= 0) return { seuilCA: Infinity, repartition: [] };
        
        const seuilTotalVentes = coutCampagne / margeMoyennePonderee;
        const caMoyenParVente = caTotalPondere / totalMix;
        
        baseSeuilCA = seuilTotalVentes * caMoyenParVente;
        baseRepartition = produits.map(p => ({
            nom: p.nom,
            quantite: seuilTotalVentes * (p.mixVentes / totalMix)
        }));

        seuilPrincipalValeurSpan.textContent = `${Math.round(baseSeuilCA).toLocaleString('fr-FR')} FCFA`;
        repartitionVentesUl.innerHTML = baseRepartition
            .filter(p => p.quantite > 0)
            .map(p => `<li><strong>${Math.round(p.quantite)}</strong> x ${p.nom}</li>`)
            .join('');

        outputsSection.style.display = "block";
        advancedOptionsSection.style.display = "block";
    }

    // --- LOGIQUE D'AJOUT/SUPPRESSION/MISE À JOUR UI ---
    function updateUIMode() { /* ... (code inchangé) ... */ }
    function ajouterLigneProduit() { /* ... (code inchangé) ... */ }
    function supprimerLigneProduit(event) { /* ... (code inchangé) ... */ }

    // --- ÉCOUTEURS D'ÉVÉNEMENTS ---
    calculateBtn.addEventListener('click', calculerSeuilInitial);
    beneficeSouhaiteInput.addEventListener('keyup', recalculateWithAdvancedOptions);
    coussinSecuriteInput.addEventListener('keyup', recalculateWithAdvancedOptions);
    addProductBtn.addEventListener('click', () => { /* ... */ });
    produitsContainer.addEventListener('click', (event) => { /* ... */ });

    // --- CODES INCHANGÉS COLLÉS ICI POUR COMPLETUDE ---
    function updateUIMode() {const produitItems = document.querySelectorAll('.produit-item');if (produitItems.length > 1) {produitsContainer.classList.remove('mono-produit');produitsContainer.classList.add('multi-produits');} else {produitsContainer.classList.remove('multi-produits');produitsContainer.classList.add('mono-produit');}}
    function ajouterLigneProduit() {const newProductLine = document.createElement('div');newProductLine.classList.add('produit-item');newProductLine.innerHTML = `<input type="text" class="nom-produit" placeholder="Nom du produit"><input type="number" class="prix-vente" placeholder="Prix de vente"><input type="number" class="cout-revient" placeholder="Coût de revient"><input type="number" class="mix-ventes" placeholder="Ventes sur 10"><button class="delete-btn">X</button>`;produitsContainer.appendChild(newProductLine);updateUIMode();}
    function supprimerLigneProduit(event) {if (event.target.classList.contains('delete-btn')) {const produitItems = document.querySelectorAll('.produit-item');if (produitItems.length > 1) {event.target.parentElement.remove();updateUIMode();}}}
    addProductBtn.addEventListener('click', ajouterLigneProduit);
    produitsContainer.addEventListener('click', supprimerLigneProduit);
    updateUIMode();
});
