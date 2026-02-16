document.addEventListener('DOMContentLoaded', () => {
    const playerBoard = document.getElementById('player-board');
    const computerBoard = document.getElementById('computer-board');
    const shipyard = document.getElementById('shipyard');
    const startBattleBtn = document.getElementById('start-battle');
    const statusText = document.getElementById('status');
    const music = document.getElementById('bg-music');
    const playBtn = document.getElementById('play-btn');

    const shipTypes = [5, 4, 3, 3, 2, 2];
    let playerShips = [];
    let computerShips = [];
    let draggedShip = null;
    let gameActive = false;
    let isPlayerTurn = true;

    let availableCPUShots = Array.from({length: 100}, (_, i) => i);
    let cpuHuntQueue = [];

    playBtn.addEventListener('click', () => {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        music.volume = 0.1;
        music.play().catch(() => {});
        initGame();
    });

    function initGame() {
        playerBoard.innerHTML = ''; computerBoard.innerHTML = '';
        for (let i = 0; i < 100; i++) {
            const pCell = document.createElement('div');
            pCell.classList.add('cell'); pCell.dataset.id = i;
            playerBoard.appendChild(pCell);
            const cCell = document.createElement('div');
            cCell.classList.add('cell'); cCell.dataset.id = i;
            cCell.addEventListener('click', () => playerAttack(i, cCell));
            computerBoard.appendChild(cCell);
        }
        renderShipyard();
    }

    function renderShipyard() {
        shipyard.innerHTML = '';
        shipTypes.forEach((len, idx) => {
            const slot = document.createElement('div');
            slot.classList.add('ship-slot');
            
            const ship = document.createElement('div');
            ship.classList.add('ship-drag');
            ship.id = `ship-${idx}`;
            ship.dataset.len = len; ship.dataset.vert = "false";
            ship.style.width = `${len * 40}px`; ship.style.height = `40px`;
            ship.draggable = true;

            ship.addEventListener('dragstart', () => { draggedShip = ship; });
            ship.addEventListener('click', () => rotateShip(ship));
            
            slot.appendChild(ship);
            shipyard.appendChild(slot);
        });
    }

    function rotateShip(ship) {
        if(gameActive) return;
        if(ship.parentElement === playerBoard) {
            renderShipyard(); // Reset do stoczni przy rotacji
            playerShips = playerShips.filter(s => s.id !== ship.id);
            startBattleBtn.classList.add('hidden');
            return;
        }
        const isVert = ship.dataset.vert === "true";
        const len = parseInt(ship.dataset.len);
        ship.dataset.vert = !isVert;
        ship.style.width = !isVert ? "40px" : `${len * 40}px`;
        ship.style.height = !isVert ? `${len * 40}px` : "40px";
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
            if (curr > 99 || (!vert && Math.floor(curr / 10) !== Math.floor(id / 10))) return false;
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

    // --- KLUCZOWA POPRAWKA NAPISU ---
    function updateStatus() {
        if (!gameActive) return;
        if (isPlayerTurn) {
            statusText.innerText = "TWOJA TURA";
            statusText.style.color = "#2e5a88";
        } else {
            statusText.innerText = "TURA PRZECIWNIKA...";
            statusText.style.color = "#d32f2f";
        }
    }

    function playerAttack(id, cell) {
        if (!gameActive || !isPlayerTurn || cell.classList.contains('hit') || cell.classList.contains('miss')) return;
        
        let ship = computerShips.find(s => s.coords.includes(id));
        if (ship) {
            cell.classList.add('hit');
            ship.hits++;
            if (ship.hits === ship.len) ship.coords.forEach(c => computerBoard.children[c].classList.add('sunk'));
            checkGameOver();
        } else {
            cell.classList.add('miss');
            isPlayerTurn = false;
            updateStatus(); // Zmiana na "Tura Przeciwnika"
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
            [shotId-10, shotId+10, shotId-1, shotId+1].forEach(n => {
                if (n >= 0 && n < 100 && !cells[n].classList.contains('hit') && !cells[n].classList.contains('miss')) {
                    if (Math.abs((n % 10) - (shotId % 10)) <= 1 && !cpuHuntQueue.includes(n)) cpuHuntQueue.push(n);
                }
            });
            if (ship.hits === ship.len) {
                ship.coords.forEach(c => cells[c].classList.add('sunk'));
                cpuHuntQueue = [];
            }
            checkGameOver();
            if (gameActive) setTimeout(cpuAttack, 800);
        } else {
            cell.classList.add('miss');
            isPlayerTurn = true;
            updateStatus(); // Zmiana na "Twoja Tura"
        }
    }

    function checkGameOver() {
        const pWin = computerShips.every(s => s.hits === s.len);
        const cWin = playerShips.every(s => s.hits === s.len);
        if (pWin || cWin) {
            gameActive = false;
            statusText.innerText = pWin ? "ZWYCIĘSTWO!" : "PRZEGRANA!";
            setTimeout(() => { alert(pWin ? "ZWYCIĘSTWO!" : "PRZEGRANA!"); location.reload(); }, 1000);
        }
    }
});
