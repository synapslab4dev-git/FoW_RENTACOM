document.addEventListener('DOMContentLoaded', () => {

    // --- SÉLECTION DES ÉLÉMENTS (ÉCRAN D'ACCUEIL) ---
    const welcomeScreen = document.getElementById('welcome-screen');
    const calculatorScreen = document.getElementById('calculator-screen');
    const showExampleBtn = document.getElementById('show-example-btn');
    const startSimBtn = document.getElementById('start-sim-btn');
    const exampleContainer = document.getElementById('example-container');

    // --- LOGIQUE DE L'ÉCRAN D'ACCUEIL ---
    showExampleBtn.addEventListener('click', () => {
        // Affiche ou masque l'exemple au clic
        const isHidden = exampleContainer.style.display === 'none';
        exampleContainer.style.display = isHidden ? 'block' : 'none';
    });

    startSimBtn.addEventListener('click', () => {
        // Masque l'accueil et affiche le calculateur
        welcomeScreen.style.display = 'none';
        calculatorScreen.style.display = 'block';
    });


    // --- LOGIQUE DU CALCULATEUR (Code précédent, inchangé) ---
    
    // --- SÉLECTION DES ÉLÉMENTS (CALCULATEUR) ---
    const coutCampagneInput = document.getElementById('cout-campagne');
    const produitsContainer = document.getElementById('produits-container');
    const seuilPrincipalValeurSpan = document.getElementById('seuil-principal-valeur');
    const repartitionVentesUl = document.getElementById('repartition-ventes');
    const calculateBtn = document.getElementById('calculate-btn');
    const addProductBtn = document.getElementById('add-product-btn');
    const outputsSection = document.getElementById('outputs-section');

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

    function calculerRentabilite(data) {
        const { coutCampagne, produits } = data;
        if (coutCampagne <= 0 || produits.length === 0) return null;

        let margeTotalePonderee = 0;
        let caTotalPondere = 0;
        let totalMix = 0;
        
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
        const seuilChiffreAffaires = seuilTotalVentes * caMoyenParVente;

        const repartition = produits.map(p => ({
            nom: p.nom,
            quantite: Math.round(seuilTotalVentes * (p.mixVentes / totalMix))
        }));

        return { seuilCA: Math.round(seuilChiffreAffaires), repartition: repartition };
    }

    function mettreAJourCalculs() {
        const coutCampagne = parseFloat(coutCampagneInput.value) || 0;
        const produitItems = document.querySelectorAll('.produit-item');
        const produits = [];
        const isMultiProductMode = produitItems.length > 1;

        produitItems.forEach(item => {
            const nom = item.querySelector('.nom-produit').value || "Produit non nommé";
            const prixVente = parseFloat(item.querySelector('.prix-vente').value) || 0;
            const coutRevient = parseFloat(item.querySelector('.cout-revient').value) || 0;
            const mixVentes = isMultiProductMode ? (parseFloat(item.querySelector('.mix-ventes').value) || 0) : 10;
            if (prixVente > 0) { produits.push({ nom, prixVente, coutRevient, mixVentes }); }
        });
        
        const data = { coutCampagne, produits };
        const resultat = calculerRentabilite(data);
        outputsSection.style.display = "block";

        if (resultat) {
            if (resultat.seuilCA === Infinity) {
                seuilPrincipalValeurSpan.textContent = "∞";
                repartitionVentesUl.innerHTML = "<li>Vos coûts sont supérieurs à vos prix de vente. Rentabilité impossible.</li>";
            } else {
                seuilPrincipalValeurSpan.textContent = `${resultat.seuilCA.toLocaleString('fr-FR')} FCFA`;
                repartitionVentesUl.innerHTML = resultat.repartition
                    .filter(p => p.quantite > 0)
                    .map(p => `<li><strong>${p.quantite}</strong> x ${p.nom}</li>`)
                    .join('');
            }
        } else {
            seuilPrincipalValeurSpan.textContent = "0 FCFA";
            repartitionVentesUl.innerHTML = "<li>Veuillez remplir tous les champs requis.</li>";
        }
    }

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

    function supprimerLigneProduit(event) {
        if (event.target.classList.contains('delete-btn')) {
            const produitItems = document.querySelectorAll('.produit-item');
            if (produitItems.length > 1) {
                event.target.parentElement.remove();
                updateUIMode();
            }
        }
    }

    calculateBtn.addEventListener('click', mettreAJourCalculs);
    addProductBtn.addEventListener('click', ajouterLigneProduit);
    produitsContainer.addEventListener('click', supprimerLigneProduit);

    updateUIMode();
});
