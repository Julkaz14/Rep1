// --- STAN GRY (OBIEKT GRACZA) ---
let player = {
    name: "Kapitan",
    gender: "M",
    level: 1,
    xp: 0,
    gold: 0,
    skills: { per: 0, luc: 0, rep: 0 },
    availablePts: 5,
    visuals: { hair: "#4b2c20", cloth: "#7b1113" },
    shipsPlaced: []
};

let gameActive = false;
let isHorizontal = true;
let selectedShipSize = 0;
let playerHealth = 17;
let enemyHealth = 17;
let currentPlayer = 'user';
let audioEnabled = true;

// --- NAWIGACJA ---
function showScreen(screenId) {
    // Ukryj wszystkie ekrany
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));
    
    // Pokaż wybrany
    const target = document.getElementById(screenId);
    if(target) target.classList.add('active');
    
    // Odśwież UI przy wejściu do statystyk
    if(screenId === 'stats-screen') updateUI();
    if(screenId === 'setup-screen') initSetupBoard();
}

// --- KREATOR POSTACI ---
function setGender(g) {
    player.gender = g;
    const btns = document.querySelectorAll('.choice-btn');
    btns.forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
}

function updateVisuals() {
    player.visuals.hair = document.getElementById('hair-color-picker').value;
    player.visuals.cloth = document.getElementById('cloth-color-picker').value;
    
    document.getElementById('hair-part').style.backgroundColor = player.visuals.hair;
    document.getElementById('clothes-part').style.backgroundColor = player.visuals.cloth;
}

function startStory() {
    player.name = document.getElementById('player-name-input').value || "Kapitan";
    
    const text = `Kapitanie ${player.name}... Twój statek został roztrzaskany o skaliste wybrzeże Tortugi. Twoja załoga zginęła w głębinach, a Ty zostałeś z niczym. W mieście pełnym piratów i bandytów, jedyną walutą jest szacunek i stal. Musisz odbudować swoją flotę i zemścić się na morzu. Zacznij od nauki podstaw przetrwania.`;
    
    showScreen('prologue-screen');
    typeWriter('prologue-text', text);
}

function typeWriter(id, text) {
    let i = 0;
    const element = document.getElementById(id);
    element.innerHTML = "";
    function walk() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(walk, 30);
        }
    }
    walk();
}

// --- SYSTEM RPG ---
function addSkill(type) {
    if (player.availablePts > 0) {
        player.skills[type]++;
        player.availablePts--;
        updateUI();
    }
}

function updateUI() {
    document.getElementById('stat-name-display').innerText = player.name;
    document.getElementById('stat-lvl').innerText = player.level;
    document.getElementById('stat-gold').innerText = player.gold;
    document.getElementById('skill-pts').innerText = player.availablePts;
    document.getElementById('val-per').innerText = player.skills.per;
    document.getElementById('val-luc').innerText = player.skills.luc;
    document.getElementById('val-rep').innerText = player.skills.rep;
}

// --- LOGIKA ROZSTAWIANIA STATKÓW ---
const shipSizes = [5, 4, 3, 3, 2];
let currentShipIndex = 0;

function initSetupBoard() {
    const board = document.getElementById('player-setup-board');
    board.innerHTML = "";
    player.shipsPlaced = [];
    currentShipIndex = 0;
    
    for (let i = 0; i < 100; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.id = i;
        cell.onclick = () => placeShip(i);
        board.appendChild(cell);
    }
    updateDock();
}

function updateDock() {
    const dock = document.getElementById('ship-dock');
    if (currentShipIndex < shipSizes.length) {
        dock.innerHTML = `Następny statek: ${shipSizes[currentShipIndex]} kratek`;
    } else {
        dock.innerHTML = "Wszystkie statki gotowe!";
        document.getElementById('start-battle-btn').style.display = "block";
    }
}

function placeShip(startIdx) {
    const size = shipSizes[currentShipIndex];
    const cells = [];
    
    for (let i = 0; i < size; i++) {
        let idx = isHorizontal ? startIdx + i : startIdx + (i * 10);
        
        // Sprawdzanie granic
        if (isHorizontal && Math.floor(startIdx / 10) !== Math.floor(idx / 10)) return;
        if (!isHorizontal && idx >= 100) return;
        if (document.querySelector(`#player-setup-board .cell[data-id="${idx}"]`).classList.contains('ship')) return;
        
        cells.push(idx);
    }

    cells.forEach(idx => {
        const cell = document.querySelector(`#player-setup-board .cell[data-id="${idx}"]`);
        cell.classList.add('ship');
        player.shipsPlaced.push(idx);
    });

    currentShipIndex++;
    updateDock();
}

document.getElementById('rotate-btn').onclick = () => {
    isHorizontal = !isHorizontal;
    document.getElementById('rotate-btn').innerText = isHorizontal ? "OBRÓĆ (POZIOM)" : "OBRÓĆ (PION)";
};

// --- SYSTEM BITWY ---
let enemyShips = [];

function initiateBattle() {
    showScreen('battle-screen');
    createBattleBoards();
    generateEnemyShips();
    playerHealth = 17;
    enemyHealth = 17;
}

function createBattleBoards() {
    const pBoard = document.getElementById('p-battle-board');
    const eBoard = document.getElementById('e-battle-board');
    pBoard.innerHTML = ""; eBoard.innerHTML = "";

    for (let i = 0; i < 100; i++) {
        const pCell = document.createElement('div');
        pCell.classList.add('cell');
        if(player.shipsPlaced.includes(i)) pCell.classList.add('ship');
        pBoard.appendChild(pCell);

        const eCell = document.createElement('div');
        eCell.classList.add('cell');
        eCell.dataset.id = i;
        eCell.onclick = () => playerShoot(i);
        eBoard.appendChild(eCell);
    }
}

function generateEnemyShips() {
    enemyShips = [];
    shipSizes.forEach(size => {
        let placed = false;
        while (!placed) {
            let start = Math.floor(Math.random() * 100);
            let dir = Math.random() > 0.5;
            let temp = [];
            let valid = true;

            for (let i = 0; i < size; i++) {
                let idx = dir ? start + i : start + (i * 10);
                if (dir && Math.floor(start / 10) !== Math.floor(idx / 10)) valid = false;
                if (!dir && idx >= 100) valid = false;
                if (enemyShips.includes(idx)) valid = false;
                temp.push(idx);
            }

            if (valid) {
                enemyShips.push(...temp);
                temp.forEach(idx => {
                    document.querySelector(`#e-battle-board .cell[data-id="${idx}"]`).classList.add('ship');
                });
                placed = true;
            }
        }
    });
}

function playerShoot(idx) {
    if (currentPlayer !== 'user') return;
    const cell = document.querySelector(`#e-battle-board .cell[data-id="${idx}"]`);
    if (cell.classList.contains('hit') || cell.classList.contains('miss')) return;

    if (enemyShips.includes(idx)) {
        cell.classList.add('hit');
        playSound('sfx-hit');
        enemyHealth--;
        
        // BONUS: PERCEPCJA (Szansa na odkrycie pól obok)
        if (Math.random() * 10 < player.skills.per) {
            revealArea(idx);
        }

        checkWin();
    } else {
        cell.classList.add('miss');
        playSound('sfx-miss');
        currentPlayer = 'computer';
        setTimeout(enemyTurn, 800);
    }
    updateHealthUI();
}

function revealArea(idx) {
    const neighbors = [idx-1, idx+1, idx-10, idx+10];
    neighbors.forEach(n => {
        if (n >= 0 && n < 100) {
            const c = document.querySelector(`#e-battle-board .cell[data-id="${n}"]`);
            if (enemyShips.includes(n)) c.classList.add('hit');
            else c.classList.add('miss');
        }
    });
}

function enemyTurn() {
    let idx = Math.floor(Math.random() * 100);
    const cell = document.querySelector(`#p-battle-board .cell:nth-child(${idx+1})`);
    
    if (cell.classList.contains('hit') || cell.classList.contains('miss')) return enemyTurn();

    // BONUS: SZCZĘŚCIE (Szansa, że bot spudłuje nawet jak trafi)
    let isHit = player.shipsPlaced.includes(idx);
    if (isHit && (Math.random() * 10 < player.skills.luc)) {
        isHit = false; // "Szczęśliwy unik"
    }

    if (isHit) {
        cell.classList.add('hit');
        // BONUS: NAPRAWA (Mniejsze obrażenia HP)
        playerHealth -= (1 - (player.skills.rep * 0.05)); 
        setTimeout(enemyTurn, 800);
    } else {
        cell.classList.add('miss');
        currentPlayer = 'user';
    }
    updateHealthUI();
    checkWin();
}

function updateHealthUI() {
    document.getElementById('p-hp').innerText = Math.max(0, Math.round((playerHealth/17)*100)) + "%";
    document.getElementById('e-hp').innerText = Math.max(0, Math.round((enemyHealth/17)*100)) + "%";
}

function checkWin() {
    if (enemyHealth <= 0) {
        alert("ZWYCIĘSTWO! Zdobywasz 100 XP i 50 złota.");
        player.xp += 100;
        player.gold += 50;
        if(player.xp >= player.level * 100) {
            player.level++;
            player.xp = 0;
            player.availablePts += 3;
            alert("AWANS NA POZIOM " + player.level);
        }
        showScreen('stats-screen');
    } else if (playerHealth <= 0) {
        alert("PORAŻKA! Piraci Cię ograbili.");
        showScreen('stats-screen');
    }
}

// --- ZAPIS GRY ---
function saveGame() {
    localStorage.setItem('pirateSandalsSave', JSON.stringify(player));
    alert("Gra zapisana!");
}

function loadGame() {
    const data = localStorage.getItem('pirateSandalsSave');
    if (data) {
        player = JSON.parse(data);
        showScreen('stats-screen');
        alert("Wczytano postać: " + player.name);
    } else {
        alert("Brak zapisu!");
    }
}

function toggleAudio() {
    audioEnabled = !audioEnabled;
    const btn = document.getElementById('audio-toggle');
    btn.innerText = audioEnabled ? "WŁĄCZONE" : "WYŁĄCZONE";
    if(!audioEnabled) document.getElementById('bg-music').pause();
}

function playSound(id) {
    if(audioEnabled) document.getElementById(id).play();
}

// Start
updateVisuals();
