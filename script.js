document.addEventListener('DOMContentLoaded', () => {

    // --- ÉLÉMENTS UI ---
    const welcomeScreen = document.getElementById('welcome-screen');
    const startSimBtn = document.getElementById('start-sim-btn');
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
    const predictionSection = document.getElementById('date-prediction-section');
    const predictionInputsContainer = document.getElementById('prediction-inputs-container');

    let baseRepartition = []; // Stocke les quantités nécessaires par produit
    let baseMargeMoyennePourcentage = 0;
    let baseSeuilCA = 0;

    // --- NAVIGATION ---
    startSimBtn.addEventListener('click', () => {
        welcomeScreen.style.display = 'none';
        calculatorScreen.style.display = 'block';
    });

    backToWelcomeBtn.addEventListener('click', () => {
        calculatorScreen.style.display = 'none';
        welcomeScreen.style.display = 'block';
        outputsSection.style.display = 'none';
    });

    document.getElementById('show-example-btn').addEventListener('click', () => {
        const ex = document.getElementById('example-container');
        ex.style.display = ex.style.display === 'none' ? 'block' : 'none';
    });

    // --- GESTION PRODUITS ---
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
            <input type="number" class="mix-ventes" placeholder="Ventes/10">
            <button class="delete-btn no-print">X</button>`;
        produitsContainer.appendChild(div);
        updateUIMode();
    });

    produitsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            if (document.querySelectorAll('.produit-item').length > 1) {
                e.target.parentElement.remove();
                updateUIMode();
            }
        }
    });

    // --- CALCULS ---
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

        if (cout <= 0 || produits.length === 0) return alert("Remplissez les champs !");

        let margeT = 0, caT = 0, totalMix = 0;
        produits.forEach(p => {
            margeT += (p.prix - p.coutR) * p.mix;
            caT += p.prix * p.mix;
            totalMix += p.mix;
        });

        const margeMoyenne = margeT / totalMix;
        const caMoyen = caT / totalMix;
        baseMargeMoyennePourcentage = caMoyen > 0 ? margeMoyenne / caMoyen : 0;
        
        const qteTotale = cout / margeMoyenne;
        baseSeuilCA = qteTotale * caMoyen;

        baseRepartition = produits.map(p => ({
            nom: p.nom,
            quantite: Math.ceil(qteTotale * (p.mix / totalMix))
        }));

        seuilPrincipalValeurSpan.textContent = `${Math.round(baseSeuilCA).toLocaleString('fr-FR')} FCFA`;
        repartitionVentesUl.innerHTML = baseRepartition.map(p => `<li><strong>${p.quantite}</strong> ${p.nom}</li>`).join('');
        
        outputsSection.style.display = 'block';
        advancedOptionsSection.style.display = 'block';
        predictionSection.style.display = 'block';
        
        genererChampsPrediction();
    });

    // --- PRÉDICTION DE DATE ---
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
        document.getElementById('start-date-input').valueAsDate = new Date();
    }

    document.getElementById('predict-date-btn').addEventListener('click', () => {
        const rows = document.querySelectorAll('.prediction-row');
        let maxJours = 0;
        const startDate = new Date(document.getElementById('start-date-input').value);

        rows.forEach((row, i) => {
            const v = parseFloat(row.querySelector('.vitesse-valeur').value) || 0;
            const unite = parseFloat(row.querySelector('.vitesse-unite').value);
            if (v > 0) {
                const ventesParJour = v / unite;
                const jours = baseRepartition[i].quantite / ventesParJour;
                if (jours > maxJours) maxJours = jours;
            }
        });

        if (maxJours > 0) {
            const cible = new Date(startDate);
            cible.setDate(cible.getDate() + Math.ceil(maxJours));
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const resultDiv = document.getElementById('prediction-result');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `🏁 Objectif atteint le : <br><strong>${cible.toLocaleDateString('fr-FR', options)}</strong><br><small>(Basé sur votre vitesse de vente la plus lente)</small>`;
        }
    });

    // --- EXPORT PDF ---
    document.getElementById('download-pdf-btn').addEventListener('click', () => {
        const element = document.getElementById('pdf-content');
        const opt = {
            margin: 10,
            filename: 'Rentacom_Simulation.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    });

    // Optionnel : Recalculer (Avancé)
    document.getElementById('apply-advanced-btn').addEventListener('click', () => {
        const benef = parseFloat(document.getElementById('benefice-souhaite').value) || 0;
        const coussin = parseFloat(document.getElementById('coussin-securite').value) || 0;
        let caFinal = baseSeuilCA + (benef / baseMargeMoyennePourcentage);
        if (coussin > 0) caFinal /= (1 - (coussin / 100));
        
        seuilPrincipalValeurSpan.textContent = `${Math.round(caFinal).toLocaleString('fr-FR')} FCFA`;
        const ratio = caFinal / baseSeuilCA;
        repartitionVentesUl.innerHTML = baseRepartition.map(p => `<li><strong>${Math.round(p.quantite * ratio)}</strong> ${p.nom}</li>`).join('');
    });
});
