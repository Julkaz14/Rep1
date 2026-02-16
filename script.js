// Dane gracza zapisywane w przeglądarce
let playerStats = JSON.parse(localStorage.getItem('battleship_stats')) || {
    level: 1,
    xp: 0,
    coins: 100
};

// Funkcja aktualizująca UI profilu
function updateProfileUI() {
    document.getElementById('level-val').innerText = playerStats.level;
    document.getElementById('coins-val').innerText = playerStats.coins;
    let xpToNextLevel = playerStats.level * 100;
    let progress = (playerStats.xp / xpToNextLevel) * 100;
    document.getElementById('xp-fill').style.width = progress + "%";
}

// Dodawanie punktów po wygranej/trafieniu
function addXP(amount) {
    playerStats.xp += amount;
    let xpToNextLevel = playerStats.level * 100;
    
    if (playerStats.xp >= xpToNextLevel) {
        playerStats.level++;
        playerStats.xp = 0;
        playerStats.coins += 50;
        alert("AWANS! Poziom " + playerStats.level);
    }
    saveStats();
    updateProfileUI();
}

function saveStats() {
    localStorage.setItem('battleship_stats', JSON.stringify(playerStats));
}

// Obsługa dźwięków
function playSound(id) {
    const sound = document.getElementById(id);
    sound.currentTime = 0;
    sound.play().catch(e => console.log("Audio waiting for user interaction"));
}

let musicPlaying = false;
function toggleAudio() {
    const music = document.getElementById('bg-music');
    if (musicPlaying) {
        music.pause();
    } else {
        music.play();
    }
    musicPlaying = !musicPlaying;
}

// Funkcja startu (przejście z menu do gry)
function startSetup(mode) {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    updateProfileUI();
}

// Wywołaj przy każdym trafieniu w przeciwnika:
// playSound('sfx-hit');
// addXP(10);
