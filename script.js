document.addEventListener('DOMContentLoaded', () => {
    const playerBoard = document.getElementById('player-board');
    const computerBoard = document.getElementById('computer-board');
    const shipyard = document.getElementById('shipyard');
    const startBattleBtn = document.getElementById('start-battle');
    const statusText = document.getElementById('status');
    const playBtn = document.getElementById('play-btn');

    const music = document.getElementById('bg-music');
    const sndHit = document.getElementById('snd-hit');
    const sndSink = document.getElementById('snd-sink');
    const sndMiss = document.getElementById('snd-miss');

    const shipTypes = [5, 4, 3, 3, 2, 2];
    const totalHealth = shipTypes.reduce((a, b) => a + b, 0); 
    
    let playerShips = [];
    let computerShips = [];
    let playerHealth = totalHealth;
    let cpuHealth = totalHealth;
    let playerShipsAfloat = [...shipTypes]; // Śledzenie pozostałych statków gracza
    
    let draggedShip = null;
    let gameActive = false;
    let isPlayerTurn = true;

    // LOGIKA AI - PRO LEVEL
    let availableCPUShots = Array.from({length: 100}, (_, i) => i);
    let cpuHuntQueue = [];
    let shipOrigin = null; 
    let lastHit = null;    
    let lockedAxis = null; 

    function playSound(audioElement) {
        if(!audioElement) return;
        audioElement.volume = 0.4;
        audioElement.currentTime = 0;
        audioElement.play().catch(() => {});
    }

    playBtn.addEventListener('click', () => {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        music.volume = 0.1;
        music.play().catch(() => {});
        initGame();
    });

    function initGame() {
        playerBoard.innerHTML = ''; 
        computerBoard.innerHTML = '';
        renderShipyard();
        for (let i = 0; i < 100; i++) {
            const pCell = document.createElement('div');
            pCell.classList.add('cell'); pCell.dataset.id = i;
            playerBoard.appendChild(pCell);
            const cCell = document.createElement('div');
            cCell.classList.add('cell'); cCell.dataset.id = i;
            cCell.addEventListener('click', () => playerAttack(i, cCell));
            computerBoard.appendChild(cCell);
        }
    }

    function renderShipyard() {
        shipyard.innerHTML = '';
        shipTypes.forEach((len, idx) => {
            const slot = document.createElement('div');
            slot.classList.add('ship-slot');
            slot.dataset.slotIdx = idx;
            const ship = document.createElement('div');
            ship.classList.add('ship-drag');
            ship.id = `ship-${idx}`;
            ship.dataset.len = len; ship.dataset.vert = "false";
            ship.style.width = `${len * 40}px`; ship.style.height = `40px`;
            ship.draggable = true;
            ship.addEventListener('dragstart', () => { draggedShip = ship; });
            ship.addEventListener('click', (e) => { e.stopPropagation(); handleShipClick(ship); });
            slot.appendChild(ship);
            shipyard.appendChild(slot);
        });
    }

    function handleShipClick(ship) {
        if(gameActive) return;
        const shipIdx = ship.id.split('-')[1];
        const originalSlot = shipyard.querySelector(`[data-slot-idx="${shipIdx}"]`);
        if(ship.parentElement !== originalSlot) {
            ship.style.position = "relative";
            ship.style.left = "0"; ship.style.top = "0";
            playerShips = playerShips.filter(s => s.id !== ship.id);
            originalSlot.appendChild(ship);
            startBattleBtn.classList.add('hidden');
        } else {
            const isVert = ship.dataset.vert === "true";
            const len = parseInt(ship.dataset.len);
            ship.dataset.vert = !isVert;
            ship.style.width = !isVert ? "40px" : `${len * 40}px`;
            ship.style.height = !isVert ? `${len * 40}px` : "40px";
        }
    }

    playerBoard.addEventListener('dragover', e => e.preventDefault());
    playerBoard.addEventListener('drop', e => {
        e.preventDefault();
        const rect = playerBoard.getBoundingClientRect();
        const cellX = Math.floor((e.clientX - rect.left) / 40);
        const cellY = Math.floor((e.clientY - rect.top) / 40);
        const startId = cellY * 10 + cellX;
        const len = parseInt(draggedShip.dataset.len);
        const vert = draggedShip.dataset.vert === "true";

        if (canPlace(startId, len, vert, draggedShip.id, playerShips)) {
            const coords = [];
            for (let i = 0; i < len; i++) coords.push(vert ? startId + i * 10 : startId + i);
            playerShips = playerShips.filter(s => s.id !== draggedShip.id);
            playerShips.push({ id: draggedShip.id, coords: coords, hits: 0, len: len });
            draggedShip.style.position = "absolute";
            draggedShip.style.left = `${cellX * 40}px`;
            draggedShip.style.top = `${cellY * 40}px`;
            playerBoard.appendChild(draggedShip);
            if (playerShips.length === shipTypes.length) startBattleBtn.classList.remove('hidden');
        }
    });

    function canPlace(id, len, vert, sId, ships) {
        for (let i = 0; i < len; i++) {
            let curr = vert ? id + i * 10 : id + i;
            if (curr < 0 || curr > 99 || (!vert && Math.floor(curr / 10) !== Math.floor(id / 10))) return false;
            if (ships.some(s => s.id !== sId && s.coords.includes(curr))) return false;
        }
        return true;
    }

    startBattleBtn.addEventListener('click', () => {
        gameActive = true;
        document.getElementById('shipyard-section').classList.add('hidden');
        document.getElementById('enemy-section').classList.remove('hidden');
        startBattleBtn.classList.add('hidden');
        setupCPU();
        updateStatus();
    });

    function setupCPU() {
        shipTypes.forEach((len, idx) => {
            let placed = false;
            while (!placed) {
                let start = Math.floor(Math.random() * 100);
                let vert = Math.random() > 0.5;
                if (canPlace(start, len, vert, `c-${idx}`, computerShips)) {
                    let coords = [];
                    for(let i=0; i<len; i++) coords.push(vert ? start+i*10 : start+i);
                    computerShips.push({ id: `c-${idx}`, coords: coords, hits: 0, len: len });
                    placed = true;
                }
            }
        });
    }

    function updateStatus() {
        if (!gameActive) return;
        statusText.innerText = isPlayerTurn ? "TWOJA TURA" : "TURA PRZECIWNIKA...";
        statusText.style.color = isPlayerTurn ? "#1e4d77" : "#d32f2f";
    }

    function playerAttack(id, cell) {
        if (!gameActive || !isPlayerTurn || cell.classList.contains('hit') || cell.classList.contains('miss')) return;
        let ship = computerShips.find(s => s.coords.includes(id));
        if (ship) {
            cell.classList.add('hit'); cpuHealth--;
            if (++ship.hits === ship.len) {
                playSound(sndSink);
                ship.coords.forEach(c => computerBoard.children[c].classList.add('sunk'));
            } else playSound(sndHit);
            if (cpuHealth <= 0) endGame(true);
        } else {
            cell.classList.add('miss'); playSound(sndMiss);
            isPlayerTurn = false; updateStatus();
            setTimeout(cpuAttack, 700);
        }
    }

    // --- ARCYMISTRZOWSKA LOGIKA CPU (PDM - Probability Density Map) ---
    function cpuAttack() {
        if (!gameActive) return;
        
        let shotId;

        if (cpuHuntQueue.length > 0) {
            shotId = cpuHuntQueue.shift();
        } else {
            // TRYB POSZUKIWANIA: Oblicz mapę prawdopodobieństwa
            shotId = calculateBestMove();
        }

        availableCPUShots = availableCPUShots.filter(id => id !== shotId);
        const cells = playerBoard.querySelectorAll('.cell');
        const cell = cells[shotId];
        let ship = playerShips.find(s => s.coords.includes(shotId));

        if (ship) {
            cell.classList.add('hit');
            playerHealth--;
            if (++ship.hits === ship.len) {
                playSound(sndSink);
                ship.coords.forEach(c => cells[c].classList.add('sunk'));
                // Usuń zatopiony statek z listy celów AI
                const idx = playerShipsAfloat.indexOf(ship.len);
                if (idx > -1) playerShipsAfloat.splice(idx, 1);
                
                cpuHuntQueue = []; shipOrigin = null; lastHit = null; lockedAxis = null;
            } else {
                playSound(sndHit);
                if (!shipOrigin) {
                    shipOrigin = shotId;
                    // Dodaj sąsiadów, ale tylko jeśli statek może się tam zmieścić
                    [shotId-10, shotId+10, shotId-1, shotId+1].forEach(n => addIfValid(n));
                } else {
                    if (!lockedAxis) {
                        lockedAxis = Math.abs(shotId - shipOrigin) < 10 ? 'hor' : 'ver';
                        cpuHuntQueue = cpuHuntQueue.filter(id => 
                            lockedAxis === 'hor' ? Math.floor(id/10) === Math.floor(shipOrigin/10) : id % 10 === shipOrigin % 10
                        );
                    }
                    let diff = shotId - lastHit;
                    addIfValid(shotId + diff);
                    addIfValid(shipOrigin + (diff * -1));
                }
                lastHit = shotId;
            }
            if (playerHealth <= 0) endGame(false);
            else setTimeout(cpuAttack, 600);
        } else {
            cell.classList.add('miss'); playSound(sndMiss);
            isPlayerTurn = true; updateStatus();
        }
    }

    // OBLICZANIE NAJLEPSZEGO RUCHU (Mózg AI)
    function calculateBestMove() {
        let weights = new Array(100).fill(0);
        const cells = playerBoard.querySelectorAll('.cell');

        // Sprawdzamy każde możliwe ułożenie pozostałych statków
        playerShipsAfloat.forEach(shipLen => {
            for (let i = 0; i < 100; i++) {
                // Poziomo
                if (i % 10 <= 10 - shipLen) {
                    let canFit = true;
                    for (let j = 0; j < shipLen; j++) {
                        if (cells[i + j].classList.contains('miss') || cells[i + j].classList.contains('sunk')) {
                            canFit = false; break;
                        }
                    }
                    if (canFit) {
                        for (let j = 0; j < shipLen; j++) {
                            if (!cells[i + j].classList.contains('hit')) weights[i + j]++;
                        }
                    }
                }
                // Pionowo
                if (Math.floor(i / 10) <= 10 - shipLen) {
                    let canFit = true;
                    for (let j = 0; j < shipLen; j++) {
                        if (cells[i + j * 10].classList.contains('miss') || cells[i + j * 10].classList.contains('sunk')) {
                            canFit = false; break;
                        }
                    }
                    if (canFit) {
                        for (let j = 0; j < shipLen; j++) {
                            if (!cells[i + j * 10].classList.contains('hit')) weights[i + j * 10]++;
                        }
                    }
                }
            }
        });

        // Znajdź pole z najwyższą wagą
        let maxWeight = -1;
        let bestMoves = [];
        for (let i = 0; i < 100; i++) {
            if (availableCPUShots.includes(i)) {
                if (weights[i] > maxWeight) {
                    maxWeight = weights[i];
                    bestMoves = [i];
                } else if (weights[i] === maxWeight) {
                    bestMoves.push(i);
                }
            }
        }
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    function addIfValid(n) {
        if (n >= 0 && n < 100 && availableCPUShots.includes(n)) {
            if (lockedAxis === 'ver' || Math.abs(Math.floor(n/10) - Math.floor(shipOrigin/10)) === 0) {
                if (!cpuHuntQueue.includes(n)) cpuHuntQueue.unshift(n);
            }
        }
    }

    function endGame(isWin) {
        gameActive = false;
        statusText.innerText = isWin ? "ZWYCIĘSTWO!" : "PRZEGRANA!";
        statusText.style.color = isWin ? "#2e7d32" : "#d32f2f";
        setTimeout(() => { alert(isWin ? "Wspaniałe zwycięstwo!" : "Twoja flota zatonęła..."); location.reload(); }, 500);
    }
});
