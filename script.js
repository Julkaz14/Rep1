// --- DANE GRACZA ---
let gData = {
    name: "Kapitan",
    gender: "M",
    lvl: 1,
    xp: 0,
    gold: 0,
    pts: 5,
    skills: { per: 0, luc: 0, rep: 0 },
    visuals: { hair: "#4b2c20", cloth: "#7b1113" },
    playerShips: []
};

// --- SYSTEM NAWIGACJI ---
function goToScreen(screenId) {
    console.log("Zmieniam ekran na: " + screenId); // Debug w konsoli
    const allScreens = document.querySelectorAll('.screen');
    allScreens.forEach(s => s.classList.remove('active'));
    
    const target = document.getElementById(screenId);
    if(target) {
        target.classList.add('active');
        if(screenId === 'stats-screen') updateStatUI();
    } else {
        console.error("Błąd: Nie znaleziono ekranu: " + screenId);
    }
}

// --- KREATOR I PROLOG ---
function liveUpdateVisuals() {
    gData.visuals.hair = document.getElementById('p-hair-color').value;
    gData.visuals.cloth = document.getElementById('p-cloth-color').value;
    
    document.getElementById('hair-layer').style.backgroundColor = gData.visuals.hair;
    document.getElementById('clothes-layer').style.backgroundColor = gData.visuals.cloth;
}

function startAdventure() {
    gData.name = document.getElementById('p-name').value || "Kapitan";
    gData.gender = document.getElementById('p-gender').value;
    
    const story = `Kapitanie ${gData.name}... Sztorm stulecia pochłonął Twoją flotę. Obudziłeś się na piaskach wyspy Tortuga. Twoi towarzysze nie żyją, a jedyne co Ci zostało, to wola walki. W mieście pełnym rzezimieszków musisz odzyskać swój honor i statek. Przygotuj się, bo morze nie wybacza słabości.`;
    
    goToScreen('prologue-screen');
    const textTarget = document.getElementById('story-text');
    textTarget.innerHTML = "";
    let i = 0;
    
    function typeEffect() {
        if (i < story.length) {
            textTarget.innerHTML += story.charAt(i);
            i++;
            setTimeout(typeEffect, 30);
        }
    }
    typeEffect();
}

// --- STATYSTYKI ---
function upgradeSkill(type) {
    if (gData.pts > 0) {
        gData.skills[type]++;
        gData.pts--;
        updateStatUI();
    }
}

function updateStatUI() {
    document.getElementById('disp-name').innerText = gData.name;
    document.getElementById('disp-lvl').innerText = gData.lvl;
    document.getElementById('disp-gold').innerText = gData.gold;
    document.getElementById('disp-pts').innerText = gData.pts;
    document.getElementById('v-per').innerText = gData.skills.per;
    document.getElementById('v-luc').innerText = gData.skills.luc;
    document.getElementById('v-rep').innerText = gData.skills.rep;
}

// --- BITWA SILNIK ---
let enemyShips = [];
let shipSizes = [5, 4, 3, 3, 2];
let currentShipToPlace = 0;
let isHoriz = true;

function prepareBattle() {
    goToScreen('setup-screen');
    initSetup();
}

function initSetup() {
    const board = document.getElementById('setup-board');
    board.innerHTML = "";
    gData.playerShips = [];
    currentShipToPlace = 0;
    
    for (let i = 0; i < 100; i++) {
        const c = document.createElement('div');
        c.classList.add('cell');
        c.dataset.id = i;
        c.onclick = () => tryPlaceShip(i);
        board.appendChild(c);
    }
}

document.getElementById('rotate-btn').onclick = () => {
    isHoriz = !isHoriz;
    document.getElementById('rotate-btn').innerText = isHoriz ? "OBRÓĆ: POZIOM" : "OBRÓĆ: PION";
};

function tryPlaceShip(start) {
    if (currentShipToPlace >= shipSizes.length) return;
    const size = shipSizes[currentShipToPlace];
    let cells = [];
    
    for (let i = 0; i < size; i++) {
        let idx = isHoriz ? start + i : start + (i * 10);
        if (isHoriz && Math.floor(start / 10) !== Math.floor(idx / 10)) return;
        if (idx >= 100 || gData.playerShips.includes(idx)) return;
        cells.push(idx);
    }

    cells.forEach(id => {
        gData.playerShips.push(id);
        document.querySelector(`#setup-board .cell[data-id="${id}"]`).classList.add('ship');
    });

    currentShipToPlace++;
    if(currentShipToPlace === shipSizes.length) {
        document.getElementById('battle-start-btn').style.display = 'block';
    }
}

function launchBattle() {
    goToScreen('battle-screen');
    setupBattleBoards();
    genEnemy();
}

function setupBattleBoards() {
    const pF = document.getElementById('p-field');
    const eF = document.getElementById('e-field');
    pF.innerHTML = ""; eF.innerHTML = "";

    for (let i = 0; i < 100; i++) {
        const pc = document.createElement('div');
        pc.classList.add('cell');
        if(gData.playerShips.includes(i)) pc.classList.add('ship');
        pF.appendChild(pc);

        const ec = document.createElement('div');
        ec.classList.add('cell');
        ec.dataset.id = i;
        ec.onclick = () => shootEnemy(i);
        eF.appendChild(ec);
    }
}

function genEnemy() {
    enemyShips = [];
    shipSizes.forEach(s => {
        let ok = false;
        while(!ok) {
            let start = Math.floor(Math.random()*100);
            let h = Math.random() > 0.5;
            let temp = [];
            let valid = true;
            for(let i=0; i<s; i++) {
                let id = h ? start + i : start + (i*10);
                if(id >= 100 || enemyShips.includes(id) || (h && Math.floor(start/10) !== Math.floor(id/10))) valid = false;
                temp.push(id);
            }
            if(valid) { enemyShips.push(...temp); ok = true; }
        }
    });
}

function shootEnemy(id) {
    const c = document.querySelector(`#e-field .cell[data-id="${id}"]`);
    if(c.classList.contains('hit') || c.classList.contains('miss')) return;

    if(enemyShips.includes(id)) {
        c.classList.add('hit');
        // Bonus percepcji
        if(Math.random() * 10 < gData.skills.per) revealSurrounding(id);
        checkVictory();
    } else {
        c.classList.add('miss');
        setTimeout(enemyAttack, 600);
    }
}

function enemyAttack() {
    let id = Math.floor(Math.random()*100);
    const c = document.querySelector(`#p-field .cell:nth-child(${id+1})`);
    if(c.classList.contains('hit') || c.classList.contains('miss')) return enemyAttack();

    if(gData.playerShips.includes(id)) {
        if(Math.random()*10 >= gData.skills.luc) c.classList.add('hit');
        else document.getElementById('battle-msg').innerText = "SZCZĘŚLIWY UNIK!";
    } else {
        c.classList.add('miss');
    }
}

// --- SYSTEMY ZAPISU ---
function saveGame() {
    localStorage.setItem('CaptainSeaSave', JSON.stringify(gData));
    alert("Gra zapisana pomyślnie!");
}

function loadGame() {
    const saved = localStorage.getItem('CaptainSeaSave');
    if(saved) {
        gData = JSON.parse(saved);
        goToScreen('stats-screen');
    } else {
        alert("Brak zapisu!");
    }
}

// Inicjalizacja przy ładowaniu strony
window.onload = () => {
    console.log("Gra załadowana.");
    liveUpdateVisuals();
};
