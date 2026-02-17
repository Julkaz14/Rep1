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

    // --- ZAAWANSOWANA PAMIĘĆ AI ---
    let availableCPUShots = Array.from({length: 100}, (_, i) => i);
    let cpuHuntQueue = [];
    let shipOrigin = null; // Pierwsze trafienie w dany statek
    let lastHit = null;    // Ostatnie trafienie
    let lockedAxis = null; // 'hor' lub 'ver'
    let currentDirection = null; // kierunek (-1, 1, -10, 10)

    function playSound(audioElement) {
        if(!audioElement) return;
        audioElement.volume = 0.4;
        audioElement.currentTime = 0;
        audioElement.play().catch(() => {});
    }

    // --- INICJALIZACJA I MENU ---
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

    // --- LOGIKA AI: "COLD-BLOODED SNIPER" ---
    function cpuAttack() {
        if (!gameActive) return;
        
        let shotId;

        // PRIORYTET 1: Jeśli mamy konkretną kolejkę polowania (hit w statek)
        if (cpuHuntQueue.length > 0) {
            shotId = cpuHuntQueue.shift();
        } else {
            // PRIORYTET 2: Jeśli nic nie polujemy, użyj mapy prawdopodobieństwa
            shotId = calculateBestMove();
        }

        // Zabezpieczenie przed powtórnym strzałem w to samo miejsce
        if (!availableCPUShots.includes(shotId)) {
            cpuAttack(); // Jeśli wybrane pole jest zajęte, losuj/licz jeszcze raz
            return;
        }

        availableCPUShots = availableCPUShots.filter(id => id !== shotId);
        const cells = playerBoard.querySelectorAll('.cell');
        const cell = cells[shotId];
        let ship = playerShips.find(s => s.coords.includes(shotId));

        if (ship) {
            cell.classList.add('hit');
            playerHealth--;
            
            if (++ship.hits === ship.len) {
                // ZATOPIONY: Całkowity reset pamięci polowania
                playSound(sndSink);
                ship.coords.forEach(c => cells[c].classList.add('sunk'));
                const idx = playerShipsAfloat.indexOf(ship.len);
                if (idx > -1) playerShipsAfloat.splice(idx, 1);
                
                // Resetujemy wszystkie zmienne stanu
                cpuHuntQueue = []; shipOrigin = null; lastHit = null; lockedAxis = null; currentDirection = null;
            } else {
                // TRAFIONY: Planowanie profesjonalnego dobijania
                playSound(sndHit);
                
                if (shipOrigin === null) {
                    // Pierwsze trafienie: szukaj we wszystkich 4 kierunkach
                    shipOrigin = shotId;
                    cpuHuntQueue = []; // Czyścimy na wszelki wypadek
                    [shotId-10, shotId+10, shotId-1, shotId+1].forEach(n => addIfPotential(n));
                } else {
                    // Drugie trafienie: BLOKUJEMY OŚ!
                    if (!lockedAxis) {
                        lockedAxis = Math.abs(shotId - shipOrigin) < 10 ? 'hor' : 'ver';
                        // Usuń z kolejki wszystko, co nie pasuje do osi
                        cpuHuntQueue = cpuHuntQueue.filter(id => {
                            if (lockedAxis === 'hor') return Math.floor(id/10) === Math.floor(shipOrigin/10);
                            return id % 10 === shipOrigin % 10;
                        });
                    }
                    
                    // Kontynuujemy w tym samym kierunku
                    currentDirection = shotId - lastHit;
                    let nextShot = shotId + currentDirection;
                    if (isPotential(nextShot)) {
                        cpuHuntQueue.unshift(nextShot); // Dodaj na sam początek kolejki
                    }
                    
                    // Dodaj drugą stronę osi do kolejki (na koniec) jako plan awaryjny
                    let oppositeDirection = shipOrigin - (shotId - shipOrigin);
                    let diff = shipOrigin - shotId;
                    let farEnd = shipOrigin + (diff > 0 ? -1 : 1) * (lockedAxis === 'hor' ? 1 : 10);
                    if (isPotential(farEnd)) cpuHuntQueue.push(farEnd);
                }
                lastHit = shotId;
            }
            if (playerHealth <= 0) endGame(false);
            else setTimeout(cpuAttack, 500);
        } else {
            cell.classList.add('miss'); playSound(sndMiss);
            isPlayerTurn = true; updateStatus();
            
            // Jeśli spudłowaliśmy w trybie polowania, zmień kierunek na przeciwny
            if (shipOrigin !== null && lockedAxis !== null) {
                // Jeśli płynęliśmy w jedną stronę i pudło, następnym strzałem ma być druga strona
                let reverseDirection = shipOrigin > lastHit ? 1 : -1;
                let step = lockedAxis === 'hor' ? 1 : 10;
                let nextSearch = shipOrigin + (reverseDirection * step);
                if (isPotential(nextSearch)) cpuHuntQueue.unshift(nextSearch);
            }
        }
    }

    function isPotential(n) {
        if (n < 0 || n > 99) return false;
        const cells = playerBoard.querySelectorAll('.cell');
        if (cells[n].classList.contains('hit') || cells[n].classList.contains('miss') || cells[n].classList.contains('sunk')) return false;
        // Dodatkowe sprawdzenie zawijania w poziomie
        if (lockedAxis === 'hor' && Math.floor(n/10) !== Math.floor(shipOrigin/10)) return false;
        return true;
    }

    function addIfPotential(n) {
        if (isPotential(n)) cpuHuntQueue.push(n);
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
                        for (let j = 0; j < shipLen; j++) weights[i + j]++;
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
                        for (let j = 0; j < shipLen; j++) weights[i + j * 10]++;
                    }
                }
            }
        });

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

    function endGame(isWin) {
        gameActive = false;
        statusText.innerText = isWin ? "ZWYCIĘSTWO!" : "PRZEGRANA!";
        statusText.style.color = isWin ? "#2e7d32" : "#d32f2f";
        setTimeout(() => { alert(isWin ? "Wspaniałe zwycięstwo!" : "Przegrałeś. Wróg był zbyt silny."); location.reload(); }, 500);
    }
});
