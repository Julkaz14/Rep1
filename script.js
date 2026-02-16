/* =========================================
   CAPTAIN OF THE SEA - CORE GAME LOGIC
   100% Complete File. Do not shorten.
========================================= */

// Global Game State (The RPG System)
let playerData = {
    name: "Captain",
    gender: "MALE",
    colors: { hair: "#8b4513", coat: "#800000" },
    level: 1,
    xp: 0,
    gold: 0,
    skillPoints: 5,
    skills: {
        per: 0, // Perception
        luc: 0, // Luck
        rep: 0  // Repair
    },
    savedShips: []
};

// Combat Variables
const shipSizes = [5, 4, 3, 3, 2];
let isHorizontal = true;
let currentShipIndex = 0;
let enemyShips = [];
let playerHpMax = 17;
let enemyHpMax = 17;
let currentPlayerHp = 17;
let currentEnemyHp = 17;
let isPlayerTurn = true;
let battleActive = false;

// -----------------------------------------
// 1. NAVIGATION SYSTEM (Bulletproof Method)
// -----------------------------------------
function navigate(targetScreenId) {
    try {
        console.log("Navigating to: " + targetScreenId); // For debugging
        
        // Find all elements with class 'screen'
        let allScreens = document.getElementsByClassName('screen');
        
        // Force hide everything
        for (let i = 0; i < allScreens.length; i++) {
            allScreens[i].style.display = 'none';
        }
        
        // Force show target
        let target = document.getElementById(targetScreenId);
        if (target) {
            target.style.display = 'flex';
        } else {
            console.error("Screen ID not found: " + targetScreenId);
        }

        // Trigger updates if entering specific screens
        if (targetScreenId === 'stats-screen') {
            updateTavernUI();
        }
        
    } catch (error) {
        console.error("Navigation error: ", error);
        alert("System error. Try refreshing the page (Ctrl+F5).");
    }
}

// -----------------------------------------
// 2. CREATOR LOGIC (Anime Portrait)
// -----------------------------------------
function updatePortraitColors() {
    let hairVal = document.getElementById('color-hair').value;
    let coatVal = document.getElementById('color-coat').value;
    
    document.getElementById('avatar-hair').style.backgroundColor = hairVal;
    document.getElementById('avatar-clothes').style.backgroundColor = coatVal;
    
    // Save to temp data
    playerData.colors.hair = hairVal;
    playerData.colors.coat = coatVal;
}

function confirmCreation() {
    let inputName = document.getElementById('captain-name').value;
    if (inputName.trim() === "") {
        inputName = "Captain Blackbeard";
    }
    
    playerData.name = inputName;
    playerData.gender = document.getElementById('captain-gender').value;
    
    // Reset stats for new game
    playerData.level = 1;
    playerData.xp = 0;
    playerData.gold = 0;
    playerData.skillPoints = 5;
    playerData.skills = { per: 0, luc: 0, rep: 0 };
    playerData.savedShips = [];
    
    // Go to story
    navigate('story-screen');
}

// -----------------------------------------
// 3. TAVERN & RPG PROGRESSION
// -----------------------------------------
function updateTavernUI() {
    document.getElementById('ui-name').innerText = playerData.name;
    document.getElementById('ui-lvl').innerText = playerData.level;
    document.getElementById('ui-gold').innerText = playerData.gold;
    document.getElementById('ui-xp').innerText = playerData.xp;
    document.getElementById('ui-nextxp').innerText = playerData.level * 100;
    
    document.getElementById('ui-pts').innerText = playerData.skillPoints;
    
    document.getElementById('val-per').innerText = playerData.skills.per;
    document.getElementById('val-luc').innerText = playerData.skills.luc;
    document.getElementById('val-rep').innerText = playerData.skills.rep;
}

function levelUpSkill(skillType) {
    if (playerData.skillPoints > 0) {
        playerData.skills[skillType]++;
        playerData.skillPoints--;
        updateTavernUI();
    } else {
        alert("Not enough skill points!");
    }
}

function checkLevelUp() {
    let xpNeeded = playerData.level * 100;
    if (playerData.xp >= xpNeeded) {
        playerData.level++;
        playerData.xp -= xpNeeded;
        playerData.skillPoints += 3;
        alert("LEVEL UP! You reached level " + playerData.level + " and gained 3 Skill Points!");
    }
}

// -----------------------------------------
// 4. SAVE / LOAD SYSTEM
// -----------------------------------------
function saveGameData() {
    let dataString = JSON.stringify(playerData);
    localStorage.setItem("CaptainSea_SaveData", dataString);
    alert("Game Saved Successfully!");
}

function loadGameData() {
    let saved = localStorage.getItem("CaptainSea_SaveData");
    if (saved) {
        playerData = JSON.parse(saved);
        alert("Welcome back, Captain " + playerData.name + "!");
        navigate('stats-screen');
    } else {
        alert("No save game found. Start a New Captain!");
    }
}

// -----------------------------------------
// 5. SHIP DEPLOYMENT (SETUP)
// -----------------------------------------
function startShipSetup() {
    navigate('setup-screen');
    
    // Reset Setup Variables
    playerData.savedShips = [];
    currentShipIndex = 0;
    isHorizontal = true;
    document.getElementById('rotate-btn').innerText = "ORIENTATION: HORIZONTAL";
    document.getElementById('ready-btn').style.display = 'none';
    
    updateDockyardStatus();
    buildGrid('setup-grid', handleSetupClick);
}

function buildGrid(elementId, clickCallback) {
    const gridEl = document.getElementById(elementId);
    gridEl.innerHTML = "";
    for (let i = 0; i < 100; i++) {
        let cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.onclick = () => clickCallback(i);
        gridEl.appendChild(cell);
    }
}

function updateDockyardStatus() {
    let statusEl = document.getElementById('setup-status');
    if (currentShipIndex < shipSizes.length) {
        statusEl.innerText = "Place Ship Size: " + shipSizes[currentShipIndex];
    } else {
        statusEl.innerText = "All ships deployed! Ready for battle.";
        document.getElementById('ready-btn').style.display = 'block';
    }
}

function toggleRotation() {
    isHorizontal = !isHorizontal;
    document.getElementById('rotate-btn').innerText = isHorizontal ? "ORIENTATION: HORIZONTAL" : "ORIENTATION: VERTICAL";
}

function handleSetupClick(index) {
    if (currentShipIndex >= shipSizes.length) return;
    
    let size = shipSizes[currentShipIndex];
    let proposedCells = [];
    
    // Calculate cells based on orientation
    for (let i = 0; i < size; i++) {
        let targetIndex = isHorizontal ? index + i : index + (i * 10);
        
        // Validate boundary
        if (isHorizontal && Math.floor(index / 10) !== Math.floor(targetIndex / 10)) {
            return; // Goes off right edge
        }
        if (!isHorizontal && targetIndex >= 100) {
            return; // Goes off bottom edge
        }
        
        // Validate collision
        if (playerData.savedShips.includes(targetIndex)) {
            return; // Ship already here
        }
        
        proposedCells.push(targetIndex);
    }
    
    // Place ship visually and in array
    let gridElement = document.getElementById('setup-grid');
    for (let i = 0; i < proposedCells.length; i++) {
        let cid = proposedCells[i];
        playerData.savedShips.push(cid);
        gridElement.children[cid].classList.add('ship');
    }
    
    currentShipIndex++;
    updateDockyardStatus();
}

// -----------------------------------------
// 6. COMBAT ENGINE
// -----------------------------------------
function enterBattle() {
    navigate('battle-screen');
    battleActive = true;
    isPlayerTurn = true;
    currentPlayerHp = playerHpMax;
    currentEnemyHp = enemyHpMax;
    
    updateHealthHUD();
    document.getElementById('combat-log').innerText = "Battle Start! Fire at enemy waters!";
    document.getElementById('turn-announcer').innerText = "YOUR TURN";
    document.getElementById('turn-announcer').style.color = "#4caf50";
    
    buildGrid('player-battle-grid', () => {}); // Do nothing on clicking own grid
    buildGrid('enemy-battle-grid', handlePlayerAttack);
    
    // Draw player ships on combat radar
    let pGrid = document.getElementById('player-battle-grid');
    playerData.savedShips.forEach(idx => {
        pGrid.children[idx].classList.add('ship');
    });
    
    generateEnemyFleet();
}

function generateEnemyFleet() {
    enemyShips = [];
    let eGrid = document.getElementById('enemy-battle-grid');
    
    for (let i = 0; i < shipSizes.length; i++) {
        let size = shipSizes[i];
        let placed = false;
        
        while (!placed) {
            let start = Math.floor(Math.random() * 100);
            let h = Math.random() > 0.5;
            let temp = [];
            let valid = true;
            
            for (let j = 0; j < size; j++) {
                let idx = h ? start + j : start + (j * 10);
                
                if (h && Math.floor(start / 10) !== Math.floor(idx / 10)) valid = false;
                if (!h && idx >= 100) valid = false;
                if (enemyShips.includes(idx)) valid = false;
                
                if (valid) temp.push(idx);
            }
            
            if (valid) {
                for (let k = 0; k < temp.length; k++) {
                    enemyShips.push(temp[k]);
                    eGrid.children[temp[k]].classList.add('ship'); // Hidden by CSS
                }
                placed = true;
            }
        }
    }
}

function handlePlayerAttack(index) {
    if (!battleActive || !isPlayerTurn) return;
    
    let cell = document.getElementById('enemy-battle-grid').children[index];
    if (cell.classList.contains('hit') || cell.classList.contains('miss')) return;
    
    if (enemyShips.includes(index)) {
        // HIT
        cell.classList.add('hit');
        playAudio('sfx-hit');
        currentEnemyHp--;
        document.getElementById('combat-log').innerText = "DIRECT HIT!";
        
        // PERCEPTION SKILL CHECK
        if (Math.random() * 10 < playerData.skills.per) {
            document.getElementById('combat-log').innerText += " (Perception triggered!)";
            revealAdjacent(index);
        }
        
    } else {
        // MISS
        cell.classList.add('miss');
        playAudio('sfx-miss');
        document.getElementById('combat-log').innerText = "Missed. Enemy turn.";
        
        // Switch turn
        isPlayerTurn = false;
        document.getElementById('turn-announcer').innerText = "ENEMY TURN";
        document.getElementById('turn-announcer').style.color = "#f44336";
        setTimeout(executeEnemyTurn, 1000);
    }
    
    updateHealthHUD();
    checkWinCondition();
}

function revealAdjacent(centerIdx) {
    let eGrid = document.getElementById('enemy-battle-grid');
    let toCheck = [centerIdx - 1, centerIdx + 1, centerIdx - 10, centerIdx + 10];
    
    for (let i = 0; i < toCheck.length; i++) {
        let idx = toCheck[i];
        if (idx >= 0 && idx < 100) {
            // Check row wrap for horizontal
            if (Math.abs((centerIdx % 10) - (idx % 10)) > 1) continue; 
            
            let cell = eGrid.children[idx];
            if (!cell.classList.contains('hit') && !cell.classList.contains('miss')) {
                if (enemyShips.includes(idx)) {
                    cell.classList.add('hit');
                    currentEnemyHp--;
                } else {
                    cell.classList.add('miss');
                }
            }
        }
    }
}

function executeEnemyTurn() {
    if (!battleActive) return;
    
    let targetIdx = Math.floor(Math.random() * 100);
    let pGrid = document.getElementById('player-battle-grid');
    let cell = pGrid.children[targetIdx];
    
    // Prevent hitting same spot
    if (cell.classList.contains('hit') || cell.classList.contains('miss')) {
        executeEnemyTurn();
        return;
    }
    
    let isHit = playerData.savedShips.includes(targetIdx);
    
    // LUCK SKILL CHECK
    if (isHit && (Math.random() * 10 < playerData.skills.luc)) {
        isHit = false; // Forced miss
        document.getElementById('combat-log').innerText = "Enemy missed thanks to your Luck!";
    }
    
    if (isHit) {
        cell.classList.add('hit');
        playAudio('sfx-hit');
        
        // REPAIR SKILL CHECK (Reduces damage)
        let damage = 1 - (playerData.skills.rep * 0.08); // Each repair point reduces dmg by 8%
        currentPlayerHp -= damage; 
        
        document.getElementById('combat-log').innerText = "Enemy hit your ship!";
        
        updateHealthHUD();
        checkWinCondition();
        
        if (battleActive) {
            setTimeout(executeEnemyTurn, 1000); // AI shoots again on hit
        }
    } else {
        cell.classList.add('miss');
        playAudio('sfx-miss');
        document.getElementById('combat-log').innerText = "Enemy missed. Your turn!";
        
        isPlayerTurn = true;
        document.getElementById('turn-announcer').innerText = "YOUR TURN";
        document.getElementById('turn-announcer').style.color = "#4caf50";
    }
    
    updateHealthHUD();
}

function updateHealthHUD() {
    let php = Math.max(0, Math.round((currentPlayerHp / playerHpMax) * 100));
    let ehp = Math.max(0, Math.round((currentEnemyHp / enemyHpMax) * 100));
    
    document.getElementById('hp-player').innerText = php + "%";
    document.getElementById('hp-enemy').innerText = ehp + "%";
}

function checkWinCondition() {
    if (currentEnemyHp <= 0) {
        battleActive = false;
        alert("VICTORY! You sunk the pirate fleet! +100 XP, +50 Gold.");
        playerData.xp += 100;
        playerData.gold += 50;
        checkLevelUp();
        navigate('stats-screen');
    } else if (currentPlayerHp <= 0) {
        battleActive = false;
        alert("DEFEAT! Your ships are resting at the bottom of the sea.");
        navigate('stats-screen');
    }
}

// -----------------------------------------
// 7. UTILITIES
// -----------------------------------------
function playAudio(id) {
    let audio = document.getElementById(id);
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log("Audio play prevented by browser."));
    }
}

// Ensure menu is shown on first load completely safely
window.onload = function() {
    console.log("System initialized. Version 2.");
    navigate('menu-screen'); // Force setup the display:none properly
};
