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
    let playerShips = [];
    let computerShips = [];
    let draggedShip = null;
    let gameActive = false;
    let isPlayerTurn = true;

    let availableCPUShots = Array.from({length: 100}, (_, i) => i);
    let cpuHuntQueue = [];

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

    function renderShipyard() {
        shipyard.innerHTML = '';
        shipTypes.forEach((len, idx) => {
            const slot = document.createElement('div');
            slot.classList.add('ship-slot');
            slot.dataset.slotIdx = idx; // Przypisujemy slot do indeksu statku
            
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
                e.stopPropagation(); // Zapobiega błędom bąbelkowania
                handleShipClick(ship);
            });
            
            slot.appendChild(ship);
            shipyard.appendChild(slot);
        });
    }

    // --- NOWA LOGIKA OBSŁUGI KLIKNIĘCIA (POWRÓT I ROTACJA) ---
    function handleShipClick(ship) {
        if(gameActive) return;

        if(ship.parentElement.classList.contains('grid')) {
            // Jeśli statek jest na planszy -> cofnij go do stoczni
            const shipIdx = ship.id.split('-')[1];
            const originalSlot = shipyard.querySelector(`[data-slot-idx="${shipIdx}"]`);
            
            // Resetuj style pozycjonowania
            ship.style.position = "relative";
            ship.style.left = "0";
            ship.style.top = "0";
            
            // Usuń z pamięci i przenieś element DOM
            playerShips = playerShips.filter(s => s.id !== ship.id);
            originalSlot.appendChild(ship);
            startBattleBtn.classList.add('hidden');
        } else {
            // Jeśli statek jest w stoczni -> po prostu go obróć
            const isVert = ship.dataset.vert === "true";
            const len = parseInt(ship.dataset.len);
            const newVert = !isVert;
            ship.dataset.vert = newVert;
            ship.style.width = newVert ? "40px" : `${len * 40}px`;
            ship.style.height = newVert ? `${len * 40}px` : "40px";
        }
    }

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
            
            // Usuń starą pozycję tego samego statku jeśli istniała
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
            // Sprawdź krawędzie i zajętość
            if (curr > 99 || (vert && curr < 0)) return false;
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

    function playerAttack(id, cell) {
        if (!gameActive || !isPlayerTurn || cell.classList.contains('hit') || cell.classList.contains('miss')) return;
        
        let ship = computerShips.find(s => s.coords.includes(id));
        if (ship) {
            cell.classList.add('hit');
            ship.hits++;
            if (ship.hits === ship.len) {
                playSound(sndSink);
                ship.coords.forEach(c => computerBoard.children[c].classList.add('sunk'));
            } else {
                playSound(sndHit);
            }
            checkGameOver();
        } else {
            cell.classList.add('miss');
            playSound(sndMiss);
            isPlayerTurn = false;
            updateStatus();
            setTimeout(cpuAttack, 1000);
        }
    }

    function cpuAttack() {
        if (!gameActive) return;
        let shotId;
        if (cpuHuntQueue.length > 0) shotId = cpuHuntQueue.shift();
        else shotId = availableCPUShots.splice(Math.floor(Math.random() * availableCPUShots.length), 1)[0];

        const cells = playerBoard.querySelectorAll('.cell');
        const cell = cells[shotId];
        let ship = playerShips.find(s => s.coords.includes(shotId));

        if (ship) {
            cell.classList.add('hit');
            ship.hits++;
            if (ship.hits === ship.len) {
                playSound(sndSink);
                ship.coords.forEach(c => cells[c].classList.add('sunk'));
                cpuHuntQueue = [];
            } else {
                playSound(sndHit);
                [shotId-10, shotId+10, shotId-1, shotId+1].forEach(n => {
                    if (n >= 0 && n < 100 && !cells[n].classList.contains('hit') && !cells[n].classList.contains('miss')) {
                        if (Math.abs((n % 10) - (shotId % 10)) <= 1 && !cpuHuntQueue.includes(n)) cpuHuntQueue.push(n);
                    }
                });
            }
            checkGameOver();
            if (gameActive) setTimeout(cpuAttack, 800);
        } else {
            cell.classList.add('miss');
            playSound(sndMiss);
            isPlayerTurn = true;
            updateStatus();
        }
    }

    function checkGameOver() {
        const pWin = computerShips.every(s => s.hits === s.len);
        const cWin = playerShips.every(s => s.hits === s.len);
        if (pWin || cWin) {
            gameActive = false;
            statusText.innerText = pWin ? "ZWYCIĘSTWO!" : "PRZEGRANA!";
            setTimeout(() => { alert(pWin ? "ZWYCIĘSTWO!" : "PRZEGRANA!"); location.reload(); }, 1500);
        }
    }
});
