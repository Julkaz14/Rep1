document.addEventListener('DOMContentLoaded', () => {
    // UI ELEMENTS
    const playerBoard = document.getElementById('player-board');
    const computerBoard = document.getElementById('computer-board');
    const shipyard = document.getElementById('shipyard');
    const startBattleBtn = document.getElementById('start-battle');
    const statusText = document.getElementById('status');
    const playBtn = document.getElementById('play-btn');

    // AUDIO
    const music = document.getElementById('bg-music');
    const sndHit = document.getElementById('snd-hit');
    const sndSink = document.getElementById('snd-sink');
    const sndMiss = document.getElementById('snd-miss');

    // CONFIG
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

    // AI
    let availableCPUShots = Array.from({length: 100}, (_, i) => i);

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
        if (!gameActive || !isPlayerTurn || cell.classList.contains('hit') || cell.classList.contains('miss') || cell.classList.contains('sunk')) return;
        let ship = computerShips.find(s => s.coords.includes(id));
        if (ship) {
            cell.classList.add('hit'); cpuHealth--;
            if (++ship.hits === ship.len) {
                playSound(sndSink);
                ship.coords.forEach(c => {
                    let targetCell = computerBoard.children[c];
                    targetCell.classList.add('sunk');
                    targetCell.style.backgroundColor = '#2c3e50'; 
                });
            } else playSound(sndHit);
            if (cpuHealth <= 0) endGame(true);
        } else {
            cell.classList.add('miss'); playSound(sndMiss);
            isPlayerTurn = false; updateStatus();
            setTimeout(cpuAttack, 700);
        }
    }

    // --- CZYSTA INTELIGENCJA AI ---
    function cpuAttack() {
        if (!gameActive) return;

        // Krok 1: Decyzja, gdzie strzelać na podstawie tego, co widać na planszy
        let shotId = getDynamicHuntShot();
        if (shotId === null) {
            shotId = calculateBestMove(); // PDM jeśli nie ma żadnych niezakończonych trafień
        }

        // Zabezpieczenie pętli
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
                // EFEKT ZATOPIENIA: statek zostaje oznaczony ostatecznie
                playSound(sndSink);
                ship.coords.forEach(c => {
                    let targetCell = playerBoard.querySelectorAll('.cell')[c];
                    targetCell.classList.add('sunk');
                    targetCell.style.backgroundColor = '#2c3e50'; // Zdecydowana wizualna zmiana
                });
                const idx = playerShipsAfloat.indexOf(ship.len);
                if (idx > -1) playerShipsAfloat.splice(idx, 1);
            } else {
                playSound(sndHit);
            }

            if (playerHealth <= 0) endGame(false);
            else setTimeout(cpuAttack, 600);
        } else {
            cell.classList.add('miss'); playSound(sndMiss);
            isPlayerTurn = true; updateStatus();
        }
    }

    // --- FUNKCJA WIDZENIA AI (Analiza Klastrów) ---
    function getDynamicHuntShot() {
        const cells = playerBoard.querySelectorAll('.cell');
        let unsunkHits = [];
        
        // AI szuka czerwonych krzyżyków, które jeszcze nie są zablokowane na stałe (sunk)
        for(let i=0; i<100; i++) {
            if(cells[i].classList.contains('hit') && !cells[i].classList.contains('sunk')) {
                unsunkHits.push(i);
            }
        }

        if(unsunkHits.length === 0) return null; // Brak rannych statków

        // Wybieramy pierwszy uszkodzony maszt i badamy jego całe zgrupowanie
        let target = unsunkHits[0];
        let cluster = [target];
        let queue = [target];

        while(queue.length > 0) {
            let curr = queue.shift();
            [curr-1, curr+1, curr-10, curr+10].forEach(n => {
                if(unsunkHits.includes(n) && !cluster.includes(n)) {
                    // Weryfikacja przeskoku przez boki planszy
                    if (Math.abs(curr - n) === 1 && Math.floor(curr/10) !== Math.floor(n/10)) return;
                    cluster.push(n); queue.push(n);
                }
            });
        }

        let possibleMoves = [];
        let isHorLine = cluster.length > 1 && cluster.every(c => Math.floor(c/10) === Math.floor(cluster[0]/10));
        let isVerLine = cluster.length > 1 && cluster.every(c => c % 10 === cluster[0] % 10);

        // Jeśli to jest wyraźna linia, atakujemy WYŁĄCZNIE końcówki tej linii
        if (isHorLine) {
            let min = Math.min(...cluster);
            let max = Math.max(...cluster);
            if (min % 10 > 0) possibleMoves.push(min - 1);
            if (max % 10 < 9) possibleMoves.push(max + 1);
        } else if (isVerLine) {
            let min = Math.min(...cluster);
            let max = Math.max(...cluster);
            if (min >= 10) possibleMoves.push(min - 10);
            if (max <= 89) possibleMoves.push(max + 10);
        }

        possibleMoves = possibleMoves.filter(m => availableCPUShots.includes(m));

        // Plan zapasowy: Jeśli końce są zablokowane (np. stykające się statki)
        if (possibleMoves.length === 0) {
            cluster.forEach(c => {
                if (c >= 10) possibleMoves.push(c - 10);
                if (c <= 89) possibleMoves.push(c + 10);
                if (c % 10 > 0) possibleMoves.push(c - 1);
                if (c % 10 < 9) possibleMoves.push(c + 1);
            });
            possibleMoves = [...new Set(possibleMoves)].filter(m => availableCPUShots.includes(m));
        }

        if (possibleMoves.length > 0) {
            return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        }
        return null;
    }

    // --- MAPA PRAWDOPODOBIEŃSTWA ---
    function calculateBestMove() {
        let weights = new Array(100).fill(0);
        const cells = playerBoard.querySelectorAll('.cell');

        playerShipsAfloat.forEach(shipLen => {
            for (let i = 0; i < 100; i++) {
                if (i % 10 <= 10 - shipLen) {
                    let canFit = true;
                    for (let j = 0; j < shipLen; j++) {
                        if (cells[i + j].classList.contains('miss') || cells[i + j].classList.contains('sunk')) { canFit = false; break; }
                    }
                    if (canFit) for (let j = 0; j < shipLen; j++) weights[i + j]++;
                }
                if (Math.floor(i / 10) <= 10 - shipLen) {
                    let canFit = true;
                    for (let j = 0; j < shipLen; j++) {
                        if (cells[i + j * 10].classList.contains('miss') || cells[i + j * 10].classList.contains('sunk')) { canFit = false; break; }
                    }
                    if (canFit) for (let j = 0; j < shipLen; j++) weights[i + j * 10]++;
                }
            }
        });

        let maxWeight = -1;
        let bestMoves = [];
        availableCPUShots.forEach(i => {
            if (weights[i] > maxWeight) { maxWeight = weights[i]; bestMoves = [i]; }
            else if (weights[i] === maxWeight) { bestMoves.push(i); }
        });
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    function endGame(isWin) {
        gameActive = false;
        statusText.innerText = isWin ? "ZWYCIĘSTWO!" : "PRZEGRANA!";
        statusText.style.color = isWin ? "#2e7d32" : "#d32f2f";
        setTimeout(() => { alert(isWin ? "ZWYCIĘSTWO! Opanowałeś morza!" : "Twoja flota spoczywa na dnie oceanu."); location.reload(); }, 500);
    }
});
