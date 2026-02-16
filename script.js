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
    let availableCPUShots = Array.from({length: 100}, (_, i) => i);

    document.getElementById('play-btn').addEventListener('click', () => {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        initGame();
    });

    function initGame() {
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
        shipTypes.forEach((len, idx) => {
            const ship = document.createElement('div');
            ship.classList.add('ship-drag');
            ship.id = `pship-${idx}`;
            ship.dataset.len = len;
            ship.dataset.vert = "false";
            ship.style.width = `${len * 40}px`;
            ship.style.height = `40px`;
            ship.draggable = true;
            ship.addEventListener('dragstart', () => { draggedShip = ship; });
            ship.addEventListener('click', () => rotateShip(ship));
            shipyard.appendChild(ship);
        });
    }

    function rotateShip(ship) {
        if (gameActive) return;
        const isVert = ship.dataset.vert === "true";
        const len = parseInt(ship.dataset.len);
        ship.dataset.vert = !isVert;
        ship.style.width = !isVert ? "40px" : `${len * 40}px`;
        ship.style.height = !isVert ? `${len * 40}px` : "40px";
        if (ship.parentNode === playerBoard) {
            shipyard.appendChild(ship);
            ship.style.position = "static";
            playerShips = playerShips.filter(s => s.id !== ship.id);
            updateStartButton();
        }
    }

    playerBoard.addEventListener('dragover', e => e.preventDefault());
    playerBoard.addEventListener('drop', e => {
        const startId = parseInt(e.target.dataset.id);
        const len = parseInt(draggedShip.dataset.len);
        const vert = draggedShip.dataset.vert === "true";
        if (canPlace(startId, len, vert, draggedShip.id, playerShips)) {
            const coords = [];
            for(let i=0; i<len; i++) coords.push(vert ? startId + i*10 : startId + i);
            playerShips = playerShips.filter(s => s.id !== draggedShip.id);
            playerShips.push({ id: draggedShip.id, coords: coords, hits: 0, len: len });
            draggedShip.style.position = "absolute";
            draggedShip.style.left = `${(startId % 10) * 40}px`;
            draggedShip.style.top = `${Math.floor(startId / 10) * 40}px`;
            playerBoard.appendChild(draggedShip);
            updateStartButton();
        }
    });

    function canPlace(id, len, vert, sId, currentShips) {
        const row = Math.floor(id / 10);
        for (let i = 0; i < len; i++) {
            let curr = vert ? id + i * 10 : id + i;
            if (curr > 99 || (!vert && Math.floor(curr / 10) !== row)) return false;
            if (currentShips.some(s => s.id !== sId && s.coords.includes(curr))) return false;
        }
        return true;
    }

    function updateStartButton() {
        if (playerShips.length === shipTypes.length) startBattleBtn.classList.remove('hidden');
    }

    startBattleBtn.addEventListener('click', () => {
        gameActive = true;
        document.getElementById('shipyard-section').classList.add('hidden');
        document.getElementById('enemy-section').classList.remove('hidden');
        startBattleBtn.classList.add('hidden');
        statusText.innerText = "TWOJA KOLEJ";
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
        if (!gameActive || cell.classList.contains('hit') || cell.classList.contains('miss')) return;
        let targetShip = computerShips.find(s => s.coords.includes(id));
        if (targetShip) {
            cell.classList.add('hit');
            targetShip.hits++;
            if (targetShip.hits === targetShip.len) {
                targetShip.coords.forEach(c => computerBoard.children[c].classList.add('sunk'));
                statusText.innerText = "ZATOPIŁEŚ STATEK WROGA!";
            } else {
                statusText.innerText = "TRAFIONY! STRZELAJ DALEJ";
            }
            checkGameOver();
        } else {
            cell.classList.add('miss');
            gameActive = false;
            statusText.innerText = "RUCH PRZECIWNIKA";
            setTimeout(cpuAttack, 800);
        }
    }

    function cpuAttack() {
        if (availableCPUShots.length === 0) return;
        const index = Math.floor(Math.random() * availableCPUShots.length);
        const shotId = availableCPUShots.splice(index, 1)[0];
        const cell = playerBoard.children[shotId];
        let targetShip = playerShips.find(s => s.coords.includes(shotId));

        if (targetShip) {
            cell.classList.add('hit');
            targetShip.hits++;
            if (targetShip.hits === targetShip.len) {
                targetShip.coords.forEach(c => playerBoard.children[c].classList.add('sunk'));
                statusText.innerText = "WRÓG ZATOPIŁ TWÓJ STATEK!";
            }
            checkGameOver();
            if (!gameActive) return;
            setTimeout(cpuAttack, 800);
        } else {
            cell.classList.add('miss');
            gameActive = true;
            statusText.innerText = "TWOJA KOLEJ";
        }
    }

    function checkGameOver() {
        const pWin = computerShips.every(s => s.hits === s.len);
        const cWin = playerShips.every(s => s.hits === s.len);
        if (pWin || cWin) {
            gameActive = false;
            statusText.innerText = pWin ? "ZWYCIĘSTWO!" : "PORAŻKA!";
            setTimeout(() => { alert(pWin ? "Wygrałeś!" : "Przegrałeś!"); location.reload(); }, 500);
        }
    }
});
