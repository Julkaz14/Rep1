document.addEventListener('DOMContentLoaded', () => {
    // ELEMENTY UI
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

    // KONFIGURACJA STATKÓW
    const shipTypes = [5, 4, 3, 3, 2, 2];
    const totalHealth = shipTypes.reduce((a, b) => a + b, 0); // 19 masztów
    
    let playerShips = [];
    let computerShips = [];
    let playerHealth = totalHealth;
    let cpuHealth = totalHealth;
    
    let draggedShip = null;
    let gameActive = false;
    let isPlayerTurn = true;

    // LOGIKA AI (INTELIGENCJA)
    let availableCPUShots = Array.from({length: 100}, (_, i) => i);
    let cpuHuntQueue = [];
    let shipFoundAt = null; 
    let lastHit = null;
    let currentTargetDirection = null; // 'horizontal', 'vertical' lub null

    function playSound(audioElement) {
        if(!audioElement) return;
        audioElement.volume = 0.4;
        audioElement.currentTime = 0;
        audioElement.play().catch(() => {});
    }

    // MENU I START
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
            pCell.classList.add('cell'); 
            pCell.dataset.id = i;
            playerBoard.appendChild(pCell);
            
            const cCell = document.createElement('div');
            cCell.classList.add('cell'); 
            cCell.dataset.id = i;
            cCell.addEventListener('click', () => playerAttack(i, cCell));
            computerBoard.appendChild(cCell);
        }
    }

    // STOCZNIA I ROTACJA
    function renderShipyard() {
        shipyard.innerHTML = '';
        shipTypes.forEach((len, idx) => {
            const slot = document.createElement('div');
            slot.classList.add('ship-slot');
            slot.dataset.slotIdx = idx;
            
            const ship = document.createElement('div');
            ship.classList.add('ship-drag');
            ship.id = `ship-${idx}`;
            ship.dataset.len = len; 
            ship.dataset.vert = "false";
            ship.style.width = `${len * 40}px`; 
            ship.style.height = `40px`;
            ship.draggable = true;

            ship.addEventListener('dragstart', () => { draggedShip = ship; });
            ship.addEventListener('click', (e) => {
                e.stopPropagation();
                handleShipClick(ship);
            });
            
            slot.appendChild(ship);
            shipyard.appendChild(slot);
        });
    }

    function handleShipClick(ship) {
        if(gameActive) return;
        
        // Jeśli kliknięty statek nie jest w swoim slocie (czyli jest na planszy)
        const shipIdx = ship.id.split('-')[1];
        const originalSlot = shipyard.querySelector(`[data-slot-idx="${shipIdx}"]`);
        
        if(ship.parentElement !== originalSlot) {
            ship.style.position = "relative";
            ship.style.left = "0"; ship.style.top = "0";
            playerShips = playerShips.filter(s => s.id !== ship.id);
            originalSlot.appendChild(ship);
            startBattleBtn.classList.add('hidden');
        } else {
            // Rotacja w stoczni
            const isVert = ship.dataset.vert === "true";
            const len = parseInt(ship.dataset.len);
            const newVert = !isVert;
            ship.dataset.vert = newVert;
            ship.style.width = newVert ? "40px" : `${len * 40}px`;
            ship.style.height = newVert ? `${len * 40}px` : "40px";
        }
    }

    // PRZECIĄGANIE
    playerBoard.addEventListener('dragover', e => e.preventDefault());
    playerBoard.addEventListener('drop', e => {
        e.preventDefault();
        const rect = playerBoard.getBoundingClientRect();
        const cellX = Math.floor((e.clientX - rect.left) / 40);
        const cellY = Math.floor((e.clientY - rect.top) / 40);
        const startId = cellY * 10 + cellX;

        if (startId < 0 || startId > 99) return;
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

    function canPlace(id, len, vert, sId, currentShips) {
        for (let i = 0; i < len; i++) {
            let curr = vert ? id + i * 10 : id + i;
            if (curr < 0 || curr > 99) return false;
            if (!vert && Math.floor(curr / 10) !== Math.floor(id / 10)) return false;
            if (currentShips.some(s => s.id !== sId && s.coords.includes(curr))) return false;
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

    // ATAK GRACZA
    function playerAttack(id, cell) {
        if (!gameActive || !isPlayerTurn || cell.classList.contains('hit') || cell.classList.contains('miss')) return;
        
        let ship = computerShips.find(s => s.coords.includes(id));
        if (ship) {
            cell.classList.add('hit');
            ship.hits++;
            cpuHealth--;
            if (ship.hits === ship.len) {
                playSound(sndSink);
                ship.coords.forEach(c => computerBoard.children[c].classList.add('sunk'));
            } else {
                playSound(sndHit);
            }
            if (cpuHealth <= 0) endGame(true);
        } else {
            cell.classList.add('miss');
            playSound(sndMiss);
            isPlayerTurn = false;
            updateStatus();
            setTimeout(cpuAttack, 800);
        }
    }

    // INTELIGENTNY ATAK CPU
    function cpuAttack() {
        if (!gameActive) return;
        
        let shotId;

        // 1. WYBÓR POLA DO STRZAŁU
        if (cpuHuntQueue.length > 0) {
            shotId = cpuHuntQueue.shift();
        } else {
            // Strategia szachownicy: (x + y) % 2 === 0
            let checkerboardMoves = availableCPUShots.filter(id => {
                let x = id % 10;
                let y = Math.floor(id / 10);
                return (x + y) % 2 === 0;
            });
            let pool = checkerboardMoves.length > 0 ? checkerboardMoves : availableCPUShots;
            shotId = pool[Math.floor(Math.random() * pool.length)];
        }

        availableCPUShots = availableCPUShots.filter(id => id !== shotId);
        const cells = playerBoard.querySelectorAll('.cell');
        const cell = cells[shotId];
        let ship = playerShips.find(s => s.coords.includes(shotId));

        if (ship) {
            cell.classList.add('hit');
            ship.hits++;
            playerHealth--;
            
            if (ship.hits === ship.len) {
                // ZATOPIONY - Reset inteligencji kierunkowej
                playSound(sndSink);
                ship.coords.forEach(c => cells[c].classList.add('sunk'));
                cpuHuntQueue = [];
                shipFoundAt = null; lastHit = null; currentTargetDirection = null;
            } else {
                playSound(sndHit);
                if (!shipFoundAt) shipFoundAt = shotId;

                // Ustalanie kierunku po drugim trafieniu
                if (lastHit !== null && !currentTargetDirection) {
                    if (Math.abs(shotId - lastHit) === 1) currentTargetDirection = 'hor';
                    if (Math.abs(shotId - lastHit) === 10) currentTargetDirection = 'ver';
                }

                // Generowanie sąsiadów do kolejki
                let neighbors = [];
                if (!currentTargetDirection) {
                    neighbors = [shotId-10, shotId+10, shotId-1, shotId+1];
                } else {
                    let diff = (currentTargetDirection === 'hor') ? 1 : 10;
                    neighbors = [shotId - diff, shotId + diff, shipFoundAt - diff, shipFoundAt + diff];
                }

                neighbors.forEach(n => {
                    if (n >= 0 && n < 100 && availableCPUShots.includes(n)) {
                        if (currentTargetDirection === 'ver' || Math.floor(n/10) === Math.floor(shotId/10) || Math.floor(n/10) === Math.floor(shipFoundAt/10)) {
                            if (!cpuHuntQueue.includes(n)) cpuHuntQueue.unshift(n);
                        }
                    }
                });
                lastHit = shotId;
            }

            if (playerHealth <= 0) {
                endGame(false);
            } else {
                setTimeout(cpuAttack, 700);
            }
        } else {
            cell.classList.add('miss');
            playSound(sndMiss);
            isPlayerTurn = true;
            updateStatus();
        }
    }

    function endGame(isWin) {
        gameActive = false;
        statusText.innerText = isWin ? "ZWYCIĘSTWO!" : "PRZEGRANA!";
        statusText.style.color = isWin ? "#2e7d32" : "#d32f2f";
        setTimeout(() => {
            alert(isWin ? "Wspaniałe zwycięstwo, Admirale!" : "Twoja flota spoczywa na dnie...");
            location.reload();
        }, 500);
    }
});
