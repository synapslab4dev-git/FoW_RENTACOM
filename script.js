document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SÉLECTION DES ÉLÉMENTS UI ---
    const welcomeScreen = document.getElementById('welcome-screen');
    const calculatorScreen = document.getElementById('calculator-screen');
    const startSimBtn = document.getElementById('start-sim-btn');
    const backToWelcomeBtn = document.getElementById('back-to-welcome-btn');
    const showExampleBtn = document.getElementById('show-example-btn');
    const exampleContainer = document.getElementById('example-container');

    const coutCampagneInput = document.getElementById('cout-campagne');
    const produitsContainer = document.getElementById('produits-container');
    const addProductBtn = document.getElementById('add-product-btn');
    const calculateBtn = document.getElementById('calculate-btn');

    const outputsSection = document.getElementById('outputs-section');
    const seuilValeurSpan = document.getElementById('seuil-valeur');
    const repartitionSeuilUl = document.getElementById('repartition-seuil');

    const beneficeSouhaiteInput = document.getElementById('benefice-souhaite');
    const coussinSecuriteInput = document.getElementById('coussin-securite');
    const applyAdvancedBtn = document.getElementById('apply-advanced-btn');
    const resultatStrategiqueDiv = document.getElementById('resultat-strategique');
    const strategiqueValeurSpan = document.getElementById('strategique-valeur');
    const repartitionStrategiqueUl = document.getElementById('repartition-strategique');

    const predictionInputsContainer = document.getElementById('prediction-inputs-container');
    const startDateInput = document.getElementById('start-date-input');
    const predictDateBtn = document.getElementById('predict-date-btn');
    const predictionResultDiv = document.getElementById('prediction-result');

    const downloadPdfBtn = document.getElementById('download-pdf-btn');

    // --- 2. VARIABLES DE CALCUL ---
    let baseSeuilCA = 0;
    let currentTargetCA = 0;
    let baseRepartitionPM = []; // Quantités au Point Mort
    let currentRepartitionTarget = []; // Quantités cibles réelles (Seuil ou Stratégique)
    let margeMoyennePourcentage = 0;

    // --- 3. NAVIGATION ---
    startSimBtn.addEventListener('click', () => {
        welcomeScreen.style.display = 'none';
        calculatorScreen.style.display = 'block';
    });

    backToWelcomeBtn.addEventListener('click', () => {
        calculatorScreen.style.display = 'none';
        welcomeScreen.style.display = 'block';
        outputsSection.style.display = 'none';
    });

    showExampleBtn.addEventListener('click', () => {
        exampleContainer.style.display = exampleContainer.style.display === 'none' ? 'block' : 'none';
    });

    // --- 4. GESTION DES PRODUITS ---
    function updateUIMode() {
        const items = document.querySelectorAll('.produit-item');
        items.length > 1 ? produitsContainer.classList.remove('mono-produit') : produitsContainer.classList.add('mono-produit');
    }

    addProductBtn.addEventListener('click', () => {
        const div = document.createElement('div');
        div.classList.add('produit-item');
        div.innerHTML = `
            <input type="text" class="nom-produit" placeholder="Nom du produit">
            <input type="number" class="prix-vente" placeholder="Prix">
            <input type="number" class="cout-revient" placeholder="Coût">
            <input type="number" class="mix-ventes" placeholder="Mix/10">
            <button class="delete-btn no-print">X</button>
        `;
        produitsContainer.appendChild(div);
        updateUIMode();
    });

    produitsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const items = document.querySelectorAll('.produit-item');
            if (items.length > 1) {
                e.target.parentElement.remove();
                updateUIMode();
            }
        }
    });

    // --- 5. CALCULS DE RENTABILITÉ ---

    // Étape 1 : Calcul du Point Mort
    calculateBtn.addEventListener('click', () => {
        const cout = parseFloat(coutCampagneInput.value) || 0;
        const items = document.querySelectorAll('.produit-item');
        const produits = [];

        items.forEach(item => {
            const nom = item.querySelector('.nom-produit').value || "Produit";
            const prix = parseFloat(item.querySelector('.prix-vente').value) || 0;
            const coutR = parseFloat(item.querySelector('.cout-revient').value) || 0;
            const mix = items.length > 1 ? (parseFloat(item.querySelector('.mix-ventes').value) || 0) : 10;
            if (prix > 0) produits.push({ nom, prix, coutR, mix });
        });

        if (cout <= 0 || produits.length === 0) {
            alert("Remplissez le coût de campagne et au moins un produit.");
            return;
        }

        let margeT = 0, caT = 0, totalMix = 0;
        produits.forEach(p => {
            margeT += (p.prix - p.coutR) * p.mix;
            caT += p.prix * p.mix;
            totalMix += p.mix;
        });

        const margeMoyUnitaire = margeT / totalMix;
        const caMoyenUnitaire = caT / totalMix;
        margeMoyennePourcentage = caMoyenUnitaire > 0 ? (margeMoyUnitaire / caMoyenUnitaire) : 0;
        
        const qteTotaleSeuil = cout / margeMoyUnitaire;
        baseSeuilCA = qteTotaleSeuil * caMoyenUnitaire;
        currentTargetCA = baseSeuilCA; 

        baseRepartitionPM = produits.map(p => ({
            nom: p.nom,
            quantite: Math.ceil(qteTotaleSeuil * (p.mix / totalMix))
        }));
        currentRepartitionTarget = JSON.parse(JSON.stringify(baseRepartitionPM));

        // UI
        seuilValeurSpan.textContent = `${Math.round(baseSeuilCA).toLocaleString('fr-FR')} FCFA`;
        repartitionSeuilUl.innerHTML = baseRepartitionPM.map(p => `<li><strong>${p.quantite}</strong> ${p.nom}</li>`).join('');
        
        outputsSection.style.display = 'block';
        resultatStrategiqueDiv.style.display = 'none';
        genererChampsPrediction();
    });

    // Étape 2 : Calcul Stratégique (Bénéfice + Sécurité)
    applyAdvancedBtn.addEventListener('click', () => {
        const benef = parseFloat(beneficeSouhaiteInput.value) || 0;
        const coussin = parseFloat(coussinSecuriteInput.value) || 0;

        let caFinal = baseSeuilCA + (benef / margeMoyennePourcentage);
        if (coussin > 0 && coussin < 100) caFinal = caFinal / (1 - (coussin / 100));
        
        currentTargetCA = caFinal;
        const ratio = currentTargetCA / baseSeuilCA;

        strategiqueValeurSpan.textContent = `${Math.round(currentTargetCA).toLocaleString('fr-FR')} FCFA`;
        
        currentRepartitionTarget = baseRepartitionPM.map(p => ({
            nom: p.nom,
            quantite: Math.ceil(p.quantite * ratio)
        }));

        repartitionStrategiqueUl.innerHTML = currentRepartitionTarget.map(p => `<li><strong>${p.quantite}</strong> ${p.nom}</li>`).join('');
        resultatStrategiqueDiv.style.display = 'block';
        
        // Mise à jour visuelle des quantités sans réinitialiser les inputs de vitesse
        actualiserLibellesVitesse();
    });

    // --- 6. ESTIMATION TEMPORELLE ---

    function genererChampsPrediction() {
        predictionInputsContainer.innerHTML = currentRepartitionTarget.map((p, i) => `
            <div class="prediction-row">
                <label>Vitesse pour <span class="prod-name-label">${p.nom}</span> :</label>
                <input type="number" class="vitesse-valeur" data-index="${i}" placeholder="Quantité">
                <select class="vitesse-unite">
                    <option value="1">Par jour</option>
                    <option value="7">Par semaine</option>
                    <option value="30">Par mois</option>
                </select>
            </div>
        `).join('');
        if (!startDateInput.value) startDateInput.valueAsDate = new Date();
    }

    function actualiserLibellesVitesse() {
        // Cette fonction permet de garder le focus sur l'objectif actuel (Seuil ou Stratégique)
        // Elle ne réinitialise pas les inputs pour ne pas perdre la saisie de l'utilisateur
        if(predictionResultDiv.style.display === 'block') {
            calculerDate(); // Recalcule automatiquement si une date était déjà affichée
        }
    }

    function calculerDate() {
        const rows = document.querySelectorAll('.prediction-row');
        let maxJours = 0;
        const dateDebut = new Date(startDateInput.value);

        if (isNaN(dateDebut.getTime())) {
            alert("Veuillez choisir une date de début valide.");
            return;
        }

        rows.forEach((row, i) => {
            const v = parseFloat(row.querySelector('.vitesse-valeur').value) || 0;
            const unite = parseFloat(row.querySelector('.vitesse-unite').value);
            if (v > 0) {
                const parJour = v / unite;
                const joursCible = currentRepartitionTarget[i].quantite / parJour;
                if (joursCible > maxJours) maxJours = joursCible;
            }
        });

        if (maxJours > 0) {
            const dateFin = new Date(dateDebut);
            dateFin.setDate(dateFin.getDate() + Math.ceil(maxJours));
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            predictionResultDiv.innerHTML = `🏁 Objectif de <strong>${Math.round(currentTargetCA).toLocaleString()} FCFA</strong> atteint le :<br><strong>${dateFin.toLocaleDateString('fr-FR', options)}</strong>`;
            predictionResultDiv.style.display = 'block';
        }
    }

    predictDateBtn.addEventListener('click', calculerDate);

    // --- 7. EXPORT PDF ---
    downloadPdfBtn.addEventListener('click', () => {
        const element = document.getElementById('pdf-content');
        const opt = {
            margin: 10,
            filename: 'Rentacom_Simulation.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    });

    updateUIMode();
});
