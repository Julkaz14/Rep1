document.addEventListener('DOMContentLoaded', () => {
    const playerBoard = document.getElementById('player-board');
    const computerBoard = document.getElementById('computer-board');
    const shipyard = document.getElementById('shipyard');
    const startBattleBtn = document.getElementById('start-battle');
    const statusText = document.getElementById('status');

    const shipTypes = [5, 4, 3, 3, 2, 2];
    let playerShips = [];
    let computerShips = [];
    let draggedShip = null;
    let gameActive = false;
    let isPlayerTurn = true;
    let availableCPUShots = Array.from({length: 100}, (_, i) => i);

    // Rozpoczęcie gry z menu
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            document.getElementById('main-menu').classList.add('hidden');
            document.getElementById('game-ui').classList.remove('hidden');
            initGame();
        });
    }

    function initGame() {
        playerBoard.innerHTML = '';
        computerBoard.innerHTML = '';
        // Tworzenie siatki 10x10
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
        genShipyard();
    }

    function genShipyard() {
        shipyard.innerHTML = '';
        shipTypes.forEach((len, idx) => {
            const ship = document.createElement('div');
            ship.classList.add('ship-drag');
            ship.id = `pship-${idx}`;
            ship.dataset.len = len;
            ship.dataset.vert = "false";
            ship.style.width = `${len * 40}px`;
            ship.style.height = `40px`;
            ship.draggable = true;
            
            ship.addEventListener('click', () => rotateShip(ship));
            ship.addEventListener('dragstart', () => { draggedShip = ship; });
            shipyard.appendChild(ship);
        });
    }

    function rotateShip(ship) {
        if (gameActive) return;
        const isVert = ship.dataset.vert === "true";
        const len = parseInt(ship.dataset.len);
        
        if (ship.parentElement === shipyard) {
            ship.dataset.vert = !isVert;
            ship.style.width = !isVert ? "40px" : `${len * 40}px`;
            ship.style.height = !isVert ? `${len * 40}px` : "40px";
        }
    }

    playerBoard.addEventListener('dragover', e => e.preventDefault());

    playerBoard.addEventListener('drop', e => {
        e.preventDefault();
        const startId = parseInt(e.target.dataset.id);
        if (isNaN(startId)) return;

        const len = parseInt(draggedShip.dataset.len);
        const vert = draggedShip.dataset.vert === "true";

        if (canPlace(startId, len, vert, draggedShip.id, playerShips)) {
            const coords = [];
            for (let i = 0; i < len; i++) {
                coords.push(vert ? startId + i * 10 : startId + i);
            }

            // Usuń starą pozycję jeśli statek był już na planszy
            playerShips = playerShips.filter(s => s.id !== draggedShip.id);
            playerShips.push({ id: draggedShip.id, coords: coords, hits: 0, len: len });

            // Idealne pozycjonowanie w kratkach (Naprawa lewitowania)
            draggedShip.style.position = "absolute";
            draggedShip.style.margin = "0";
            const col = startId % 10;
            const row = Math.floor(startId / 10);
            draggedShip.style.left = `${col * 40}px`;
            draggedShip.style.top = `${row * 40}px`;

            playerBoard.appendChild(draggedShip);

            if (playerShips.length === shipTypes.length) {
                startBattleBtn.classList.remove('hidden');
            }
        }
    });

    function canPlace(id, len, vert, sId, currentShips) {
        for (let i = 0; i < len; i++) {
            let curr = vert ? id + i * 10 : id + i;
            const row = Math.floor(id / 10);
            const currRow = Math.floor(curr / 10);

            if (curr > 99 || (!vert && row !== currRow)) return false;
            if (currentShips.some(s => s.id !== sId && s.coords.includes(curr))) return false;
        }
        return true;
    }

    startBattleBtn.addEventListener('click', () => {
        gameActive = true;
        isPlayerTurn = true;
        document.getElementById('shipyard-section').classList.add('hidden');
        document.getElementById('enemy-section').classList.remove('hidden');
        startBattleBtn.classList.add('hidden');
        statusText.innerText = "TWOJA TURA! ATAKUJ WROGA";
        setupCPU();
    });

    function setupCPU() {
        shipTypes.forEach((len, idx) => {
            let placed = false;
            while (!placed) {
                let start = Math.floor(Math.random() * 100);
                let vert = Math.random() > 0.5;
                if (canPlace(start, len, vert, `cship-${idx}`, computerShips)) {
                    let coords = [];
                    for(let i=0; i<len; i++) coords.push(vert ? start + i*10 : start + i);
                    computerShips.push({ id: `cship-${idx}`, coords: coords, hits: 0, len: len });
                    placed = true;
                }
            }
        });
    }

    function playerAttack(id, cell) {
        if (!gameActive || !isPlayerTurn || cell.classList.contains('hit') || cell.classList.contains('miss')) return;

        let targetShip = computerShips.find(s => s.coords.includes(id));
        if (targetShip) {
            cell.classList.add('hit');
            targetShip.hits++;
            if (targetShip.hits === targetShip.len) {
                targetShip.coords.forEach(c => computerBoard.children[c].classList.add('sunk'));
                statusText.innerText = "STATEK WROGA ZATOPIONY!";
            } else {
                statusText.innerText = "TRAFIONY!";
            }
            checkGameOver();
        } else {
            cell.classList.add('miss');
            isPlayerTurn = false;
            statusText.innerText = "PUDŁO! RUCH WROGA...";
            setTimeout(cpuAttack, 700);
        }
    }

    function cpuAttack() {
        if (!gameActive) return;
        const index = Math.floor(Math.random() * availableCPUShots.length);
        const shotId = availableCPUShots.splice(index, 1)[0];
        const cell = playerBoard.children[shotId];
        let targetShip = playerShips.find(s => s.coords.includes(shotId));

        if (targetShip) {
            cell.classList.add('hit');
            targetShip.hits++;
            if (targetShip.hits === targetShip.len) {
                targetShip.coords.forEach(c => playerBoard.children[c].classList.add('sunk'));
            }
            checkGameOver();
            if (gameActive) setTimeout(cpuAttack, 700);
        } else {
            cell.classList.add('miss');
            isPlayerTurn = true;
            statusText.innerText = "TWOJA TURA!";
        }
    }

    function checkGameOver() {
        const pWin = computerShips.every(s => s.hits === s.len);
        const cWin = playerShips.every(s => s.hits === s.len);
        if (pWin || cWin) {
            gameActive = false;
            setTimeout(() => {
                alert(pWin ? "ZWYCIĘSTWO! Zatopiliśmi całą flotę!" : "PORAŻKA! Twoja flota poszła na dno...");
                location.reload();
            }, 500);
        }
    }
});
