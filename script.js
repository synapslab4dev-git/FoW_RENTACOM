document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SÉLECTION DES ÉLÉMENTS DE L'INTERFACE ---
    
    // Écrans
    const welcomeScreen = document.getElementById('welcome-screen');
    const calculatorScreen = document.getElementById('calculator-screen');
    
    // Boutons de navigation
    const startSimBtn = document.getElementById('start-sim-btn');
    const backToWelcomeBtn = document.getElementById('back-to-welcome-btn');
    const showExampleBtn = document.getElementById('show-example-btn');
    const exampleContainer = document.getElementById('example-container');

    // Éléments du calculateur
    const coutCampagneInput = document.getElementById('cout-campagne');
    const produitsContainer = document.getElementById('produits-container');
    const addProductBtn = document.getElementById('add-product-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    
    // Éléments des résultats
    const outputsSection = document.getElementById('outputs-section');
    const seuilPrincipalValeurSpan = document.getElementById('seuil-principal-valeur');
    const repartitionVentesUl = document.getElementById('repartition-ventes');
    
    // Options avancées
    const advancedOptionsSection = document.getElementById('advanced-options-section');
    const beneficeSouhaiteInput = document.getElementById('benefice-souhaite');
    const coussinSecuriteInput = document.getElementById('coussin-securite');
    const applyAdvancedBtn = document.getElementById('apply-advanced-btn');

    // Prédiction de date
    const predictionSection = document.getElementById('date-prediction-section');
    const predictionInputsContainer = document.getElementById('prediction-inputs-container');
    const startDateInput = document.getElementById('start-date-input');
    const predictDateBtn = document.getElementById('predict-date-btn');
    const predictionResultDiv = document.getElementById('prediction-result');

    // Export PDF
    const downloadPdfBtn = document.getElementById('download-pdf-btn');

    // --- 2. VARIABLES D'ÉTAT (STOCKAGE DES DONNÉES DE CALCUL) ---
    
    let baseSeuilCA = 0;
    let baseRepartition = [];
    let baseMargeMoyennePourcentage = 0;

    // --- 3. LOGIQUE DE NAVIGATION ---

    startSimBtn.addEventListener('click', () => {
        welcomeScreen.style.display = 'none';
        calculatorScreen.style.display = 'block';
    });

    backToWelcomeBtn.addEventListener('click', () => {
        calculatorScreen.style.display = 'none';
        welcomeScreen.style.display = 'block';
        // Reset partiel pour la prochaine fois
        outputsSection.style.display = 'none';
    });

    showExampleBtn.addEventListener('click', () => {
        const isHidden = exampleContainer.style.display === 'none';
        exampleContainer.style.display = isHidden ? 'block' : 'none';
    });

    // --- 4. GESTION DES PRODUITS (AJOUT / SUPPRESSION) ---

    function updateUIMode() {
        const produitItems = document.querySelectorAll('.produit-item');
        if (produitItems.length > 1) {
            produitsContainer.classList.remove('mono-produit');
        } else {
            produitsContainer.classList.add('mono-produit');
        }
    }

    addProductBtn.addEventListener('click', () => {
        const newProductLine = document.createElement('div');
        newProductLine.classList.add('produit-item');
        newProductLine.innerHTML = `
            <input type="text" class="nom-produit" placeholder="Nom du produit">
            <input type="number" class="prix-vente" placeholder="Prix de vente">
            <input type="number" class="cout-revient" placeholder="Coût de revient">
            <input type="number" class="mix-ventes" placeholder="Ventes sur 10">
            <button class="delete-btn no-print">X</button>
        `;
        produitsContainer.appendChild(newProductLine);
        updateUIMode();
    });

    produitsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const produitItems = document.querySelectorAll('.produit-item');
            if (produitItems.length > 1) {
                event.target.parentElement.remove();
                updateUIMode();
            }
        }
    });

    // --- 5. MOTEUR DE CALCUL DE RENTABILITÉ ---

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
        const caMoyenParVente = caTotalPondere / totalMix;

        baseMargeMoyennePourcentage = caMoyenParVente > 0 ? (margeMoyennePonderee / caMoyenParVente) : 0;
        
        if (margeMoyennePonderee <= 0) {
            seuilPrincipalValeurSpan.textContent = "Indéfini";
            repartitionVentesUl.innerHTML = "<li>Vos coûts sont trop élevés par rapport à vos prix.</li>";
            outputsSection.style.display = "block";
            return;
        }
        
        const seuilTotalVentes = coutCampagne / margeMoyennePonderee;
        baseSeuilCA = seuilTotalVentes * caMoyenParVente;
        
        baseRepartition = produits.map(p => ({
            nom: p.nom,
            quantite: Math.ceil(seuilTotalVentes * (p.mixVentes / totalMix))
        }));

        // Affichage des résultats
        seuilPrincipalValeurSpan.textContent = `${Math.round(baseSeuilCA).toLocaleString('fr-FR')} FCFA`;
        repartitionVentesUl.innerHTML = baseRepartition
            .filter(p => p.quantite > 0)
            .map(p => `<li><strong>${p.quantite}</strong> ${p.nom}</li>`)
            .join('');

        outputsSection.style.display = "block";
        advancedOptionsSection.style.display = "block";
        predictionSection.style.display = "block";
        
        // Préparer la section de prédiction de date
        genererChampsPrediction();
    }

    function applyAdvancedOptions() {
        if (baseSeuilCA <= 0) return;
        
        const beneficeSouhaite = parseFloat(beneficeSouhaiteInput.value) || 0;
        const coussinSecurite = parseFloat(coussinSecuriteInput.value) || 0;

        // Formule : CA = (Frais + Bénéfice) / Taux de Marge
        const caAdditionnelPourBenefice = beneficeSouhaite / baseMargeMoyennePourcentage;
        let caFinal = baseSeuilCA + caAdditionnelPourBenefice;

        // Ajout du coussin de sécurité (méthode de la marge de sécurité)
        if (coussinSecurite > 0 && coussinSecurite < 100) {
            caFinal = caFinal / (1 - (coussinSecurite / 100));
        }

        const ratio = caFinal / baseSeuilCA;

        seuilPrincipalValeurSpan.textContent = `${Math.round(caFinal).toLocaleString('fr-FR')} FCFA`;
        repartitionVentesUl.innerHTML = baseRepartition
            .filter(p => p.quantite > 0)
            .map(p => `<li><strong>${Math.round(p.quantite * ratio)}</strong> ${p.nom}</li>`)
            .join('');
    }

    // --- 6. LOGIQUE DE PRÉDICTION DE DATE ---

    function genererChampsPrediction() {
        predictionInputsContainer.innerHTML = baseRepartition.map((p, index) => `
            <div class="prediction-row">
                <label>${p.nom}</label>
                <input type="number" class="vitesse-valeur" data-index="${index}" placeholder="Nb ventes">
                <select class="vitesse-unite">
                    <option value="1">Par jour</option>
                    <option value="7">Par semaine</option>
                    <option value="30">Par mois</option>
                </select>
            </div>
        `).join('');
        // Par défaut, mettre la date d'aujourd'hui
        startDateInput.valueAsDate = new Date();
    }

    function calculerDateObjectif() {
        const rows = document.querySelectorAll('.prediction-row');
        let maxJoursNecessaires = 0;
        const dateDebut = new Date(startDateInput.value);

        if (isNaN(dateDebut.getTime())) {
            alert("Veuillez choisir une date de début valide.");
            return;
        }

        rows.forEach((row, i) => {
            const valeur = parseFloat(row.querySelector('.vitesse-valeur').value) || 0;
            const unite = parseFloat(row.querySelector('.vitesse-unite').value);
            
            if (valeur > 0) {
                const ventesParJour = valeur / unite;
                const quantiteAFaire = baseRepartition[i].quantite;
                const joursPourCeProduit = quantiteAFaire / ventesParJour;
                
                if (joursPourCeProduit > maxJoursNecessaires) {
                    maxJoursNecessaires = joursPourCeProduit;
                }
            }
        });

        if (maxJoursNecessaires === 0) {
            alert("Veuillez indiquer une vitesse de vente pour au moins un produit.");
            return;
        }

        const dateFinale = new Date(dateDebut);
        dateFinale.setDate(dateFinale.getDate() + Math.ceil(maxJoursNecessaires));

        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        predictionResultDiv.innerHTML = `
            🏁 Objectif atteint le : <br>
            <strong>${dateFinale.toLocaleDateString('fr-FR', options)}</strong><br>
            <small>(Calculé selon votre vitesse de vente la plus contraignante)</small>
        `;
        predictionResultDiv.style.display = 'block';
    }

    // --- 7. EXPORTATION PDF ---

    function genererPDF() {
        const element = document.getElementById('pdf-content');
        const opt = {
            margin:       10,
            filename:     'Rentacom_Simulation.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // On lance la génération
        html2pdf().set(opt).from(element).save();
    }

    // --- 8. ÉCOUTEURS D'ÉVÉNEMENTS FINAUX ---

    calculateBtn.addEventListener('click', calculerSeuilInitial);
    applyAdvancedBtn.addEventListener('click', applyAdvancedOptions);
    predictDateBtn.addEventListener('click', calculerDateObjectif);
    downloadPdfBtn.addEventListener('click', genererPDF);

    // Initialisation
    updateUIMode();
});
