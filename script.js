let player = {
    name: "Kapitan",
    level: 1,
    xp: 0,
    gold: 0,
    skills: { per: 0, luc: 0, rep: 0 },
    availablePts: 5,
    visuals: { hair: "#4b2c20", cloth: "#7b1113" }
};

// Nawigacja
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    updateUI();
}

// System RPG
function addSkill(skill) {
    if (player.availablePts > 0) {
        player.skills[skill]++;
        player.availablePts--;
        updateUI();
    }
}

function updateUI() {
    document.getElementById('stat-name').innerText = player.name;
    document.getElementById('stat-lvl').innerText = player.level;
    document.getElementById('stat-gold').innerText = player.gold;
    document.getElementById('skill-pts').innerText = player.availablePts;
    document.getElementById('val-per').innerText = player.skills.per;
    document.getElementById('val-luc').innerText = player.skills.luc;
    document.getElementById('val-rep').innerText = player.skills.rep;
    
    // Podgląd awatara
    document.getElementById('hair-part').style.backgroundColor = player.visuals.hair;
    document.getElementById('clothes-part').style.backgroundColor = player.visuals.cloth;
}

// Zapis i Wczytanie
function saveGame() {
    localStorage.setItem('pirateRPG_save', JSON.stringify(player));
}

function loadGame() {
    const save = localStorage.getItem('pirateRPG_save');
    if (save) {
        player = JSON.parse(save);
        showScreen('stats-screen');
    } else {
        alert("Brak zapisu!");
    }
}

// Start fabuły
function startStory() {
    player.name = document.getElementById('player-name-input').value || "Kapitan";
    player.visuals.hair = document.getElementById('hair-color').value;
    player.visuals.cloth = document.getElementById('cloth-color').value;
    
    const text = `Witaj, Kapitanie ${player.name}. Twoja flota została zmieciona przez sztorm stulecia. Obudziłeś się na brzegach Tortugi – bez załogi, bez statku i bez złota. Musisz zacząć od zera, walcząc z bandytami o dominację na morzu.`;
    document.getElementById('prologue-text').innerText = text;
    showScreen('prologue-screen');
}

// Audio
let music = document.getElementById('bg-music');
function toggleMusic() {
    music.paused ? music.play() : music.pause();
}

// Logika Statków (uproszczona pod RPG)
function startBattle() {
    // Tutaj wchodzą Twoje poprzednie funkcje Battleship, 
    // ale zmodyfikowane o bonusy z umiejętności:
    // np. if (player.skills.luc > 2) { szansa na unik gracza }
    showScreen('battle-screen');
    initBattleLogic();
}

// Inicjalizacja przy starcie
updateUI();
