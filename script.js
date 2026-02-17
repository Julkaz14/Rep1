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
    let playerShipsAfloat = [...shipTypes];
    
    let draggedShip = null;
    let gameActive = false;
    let isPlayerTurn = true;

    // --- LOGIKA AI: APEX PREDATOR ---
    let availableCPUShots = Array.from({length: 100}, (_, i) => i);
    let cpuHuntQueue = [];
    let shipOrigin = null;  // Pierwsze trafienie w serii
    let lastHit = null;     // Ostatnie trafienie w serii
    let lockedAxis = null;  // 'hor' lub 'ver'
    let currentDir = null;  // Kierunek aktualnego ataku: -1, 1, -10, 10

    function playSound(audioElement) {
        if(!audioElement) return;
        audioElement.volume = 0.4;
        audioElement.currentTime = 0;
        audioElement.play().catch(() => {});
    }

    // --- START I UI ---
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

    // --- LOGIKA AI: ABSOLUTNIE BEZLITOSNA ---
    function cpuAttack() {
        if (!gameActive) return;

        let shotId;

        // Jeśli mamy namierzony cel, nie strzelamy nigdzie indziej
        if (cpuHuntQueue.length > 0) {
            shotId = cpuHuntQueue.shift();
        } else {
            // Brak celów w kolejce, a shipOrigin nie jest nullem? 
            // To znaczy, że spudłowaliśmy na jednym końcu, wracamy do początku
            if (shipOrigin !== null) {
                generateRescueQueue();
                if (cpuHuntQueue.length > 0) shotId = cpuHuntQueue.shift();
                else shotId = calculateBestMove();
            } else {
                shotId = calculateBestMove();
            }
        }

        // Zabezpieczenie przed strzałem w to samo miejsce
        if (!availableCPUShots.includes(shotId)) {
            if (gameActive) cpuAttack();
            return;
        }

        availableCPUShots = availableCPUShots.filter(id => id !== shotId);
        const cell = playerBoard.querySelectorAll('.cell')[shotId];
        let ship = playerShips.find(s => s.coords.includes(shotId));

        if (ship) {
            cell.classList.add('hit');
            playerHealth--;

            if (++ship.hits === ship.len) {
                // ZATOPIONY - Pełny reset, powrót do mapy prawdopodobieństwa
                playSound(sndSink);
                ship.coords.forEach(c => playerBoard.querySelectorAll('.cell')[c].classList.add('sunk'));
                const idx = playerShipsAfloat.indexOf(ship.len);
                if (idx > -1) playerShipsAfloat.splice(idx, 1);
                
                shipOrigin = null; lastHit = null; lockedAxis = null; currentDir = null;
                cpuHuntQueue = [];
            } else {
                // TRAFIONY - Kontynuacja egzekucji
                playSound(sndHit);
                if (shipOrigin === null) {
                    // Pierwsze trafienie: badaj boki
                    shipOrigin = shotId;
                    lastHit = shotId;
                    cpuHuntQueue = [shotId-10, shotId+10, shotId-1, shotId+1].filter(n => isValidMove(n));
                } else {
                    // Kolejne trafienie: BLOKADA OSI
                    if (!lockedAxis) {
                        lockedAxis = Math.abs(shotId - shipOrigin) < 10 ? 'hor' : 'ver';
                    }
                    
                    // Ustal kierunek i czyść błędy (strzały w boki)
                    currentDir = shotId - lastHit;
                    
                    // Usuń z kolejki wszystko co nie leży na tej osi
                    cpuHuntQueue = cpuHuntQueue.filter(id => {
                        if (lockedAxis === 'hor') return Math.floor(id/10) === Math.floor(shipOrigin/10);
                        return id % 10 === shipOrigin % 10;
                    });

                    // Dodaj następne pole w TYM SAMYM kierunku na początek kolejki
                    let nextLine = shotId + currentDir;
                    if (isValidMove(nextLine)) {
                        cpuHuntQueue.unshift(nextLine);
                    }
                    
                    // Dodaj pole w przeciwną stronę od origin na koniec kolejki (bezpiecznik)
                    let oppDir = (shipOrigin - shotId) > 0 ? (lockedAxis === 'hor' ? 1 : 10) : (lockedAxis === 'hor' ? -1 : -10);
                    let otherEnd = shipOrigin + oppDir;
                    if (isValidMove(otherEnd)) {
                        cpuHuntQueue.push(otherEnd);
                    }
                    lastHit = shotId;
                }
            }
            if (playerHealth <= 0) endGame(false);
            else setTimeout(cpuAttack, 600);
        } else {
            cell.classList.add('miss');
            playSound(sndMiss);
            isPlayerTurn = true;
            updateStatus();

            // Jeśli spudłowaliśmy podczas dobijania, następny strzał musi być z drugiej strony origin
            if (shipOrigin !== null && lockedAxis !== null) {
                generateRescueQueue();
            }
        }
    }

    function generateRescueQueue() {
        if (shipOrigin === null) return;
        let steps = lockedAxis === 'hor' ? [1, -1] : [10, -10];
        cpuHuntQueue = [];
        steps.forEach(s => {
            let n = shipOrigin + s;
            while(n >= 0 && n < 100 && playerBoard.querySelectorAll('.cell')[n].classList.contains('hit')) {
                n += s;
            }
            if (isValidMove(n)) cpuHuntQueue.push(n);
        });
    }

    function isValidMove(n) {
        if (n < 0 || n > 99) return false;
        const cell = playerBoard.querySelectorAll('.cell')[n];
        if (cell.classList.contains('hit') || cell.classList.contains('miss') || cell.classList.contains('sunk')) return false;
        
        // Jeśli mamy oś, sprawdzaj czy pole do niej należy
        if (lockedAxis === 'hor' && shipOrigin !== null) {
            if (Math.floor(n/10) !== Math.floor(shipOrigin/10)) return false;
        }
        if (lockedAxis === 'ver' && shipOrigin !== null) {
            if (n % 10 !== shipOrigin % 10) return false;
        }
        return true;
    }

    function calculateBestMove() {
        let weights = new Array(100).fill(0);
        const cells = playerBoard.querySelectorAll('.cell');

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

        let maxWeight = -1;
        let bestMoves = [];
        availableCPUShots.forEach(i => {
            if (weights[i] > maxWeight) {
                maxWeight = weights[i];
                bestMoves = [i];
            } else if (weights[i] === maxWeight) {
                bestMoves.push(i);
            }
        });
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    function endGame(isWin) {
        gameActive = false;
        statusText.innerText = isWin ? "ZWYCIĘSTWO!" : "PRZEGRANA!";
        statusText.style.color = isWin ? "#2e7d32" : "#d32f2f";
        setTimeout(() => { alert(isWin ? "ZWYCIĘSTWO!" : "PRZEGRANA!"); location.reload(); }, 500);
    }
});
