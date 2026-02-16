document.addEventListener('DOMContentLoaded', () => {
    const playerBoard = document.getElementById('player-board');
    const computerBoard = document.getElementById('computer-board');
    const shipyard = document.getElementById('shipyard');
    const startBattleBtn = document.getElementById('start-battle');
    const statusText = document.getElementById('status');
    const music = document.getElementById('bg-music');

    const shipsToPlace = [
        { id: 's5', len: 5 }, { id: 's4', len: 4 },
        { id: 's3a', len: 3 }, { id: 's3b', len: 3 },
        { id: 's2a', len: 2 }, { id: 's2b', len: 2 }
    ];

    let draggedShip = null;
    let playerShipsCoords = [];
    let computerShipsCoords = [];
    let gameActive = false;
    let availableCPUShots = Array.from({length: 100}, (_, i) => i);

    document.getElementById('play-btn').addEventListener('click', () => {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        music.volume = 0.2;
        music.play();
        init();
    });

    function init() {
        for (let i = 0; i < 100; i++) {
            const pCell = document.createElement('div');
            pCell.classList.add('cell');
            pCell.dataset.id = i;
            playerBoard.appendChild(pCell);

            const cCell = document.createElement('div');
            cCell.classList.add('cell');
            cCell.dataset.id = i;
            cCell.addEventListener('click', () => playerShoot(i, cCell));
            computerBoard.appendChild(cCell);
        }
        genShipyard();
    }

    function genShipyard() {
        shipsToPlace.forEach(s => {
            const ship = document.createElement('div');
            ship.classList.add('ship-drag');
            ship.id = s.id;
            ship.draggable = true;
            ship.dataset.len = s.len;
            ship.dataset.vert = "false";
            // Rozmiar fizyczny statku
            ship.style.width = `${s.len * 40}px`;
            ship.style.height = `40px`;

            ship.addEventListener('dragstart', (e) => {
                draggedShip = ship;
                setTimeout(() => ship.style.opacity = "0.5", 0);
            });
            ship.addEventListener('dragend', () => {
                draggedShip.style.opacity = "1";
                draggedShip = null;
            });
            ship.addEventListener('click', () => rotateShip(ship));
            shipyard.appendChild(ship);
        });
    }

    function rotateShip(ship) {
        if(gameActive) return;
        const isVert = ship.dataset.vert === "true";
        const len = parseInt(ship.dataset.len);
        
        ship.dataset.vert = !isVert;
        ship.classList.toggle('vertical');
        
        if (!isVert) { // Zmieniamy na pion
            ship.style.width = `40px`;
            ship.style.height = `${len * 40}px`;
        } else { // Zmieniamy na poziom
            ship.style.width = `${len * 40}px`;
            ship.style.height = `40px`;
        }

        // Jeśli statek był na planszy, sprawdź czy po obrocie nie wystaje
        if(ship.parentNode === playerBoard) {
            const startId = parseInt(playerShipsCoords.find(x => x.id === ship.id).coords[0]);
            if(!canPlace(startId, len, !isVert, ship.id)) {
                ship.style.position = "static";
                ship.style.width = !isVert ? `${len * 40}px` : `40px`; // Cofnij wizualnie
                ship.style.height = !isVert ? `40px` : `${len * 40}px`;
                ship.dataset.vert = isVert;
                ship.classList.toggle('vertical');
                shipyard.appendChild(ship);
                playerShipsCoords = playerShipsCoords.filter(x => x.id !== ship.id);
            } else {
                updateCoords(ship, startId);
            }
        }
        checkReady();
    }

    playerBoard.addEventListener('dragover', e => e.preventDefault());
    playerBoard.addEventListener('drop', e => {
        const startId = parseInt(e.target.dataset.id);
        const len = parseInt(draggedShip.dataset.len);
        const vert = draggedShip.dataset.vert === "true";

        if(canPlace(startId, len, vert, draggedShip.id)) {
            draggedShip.style.position = "absolute";
            draggedShip.style.left = `${(startId % 10) * 40}px`;
            draggedShip.style.top = `${Math.floor(startId / 10) * 40}px`;
            playerBoard.appendChild(draggedShip);
            updateCoords(draggedShip, startId);
            checkReady();
        }
    });

    function canPlace(id, len, vert, sId) {
        const row = Math.floor(id / 10);
        for(let i=0; i<len; i++) {
            let curr = vert ? id + (i*10) : id + i;
            if(curr > 99 || (!vert && Math.floor(curr/10) !== row)) return false;
            if(playerShipsCoords.some(s => s.id !== sId && s.coords.includes(curr))) return false;
        }
        return true;
    }

    function updateCoords(ship, startId) {
        const len = parseInt(ship.dataset.len);
        const vert = ship.dataset.vert === "true";
        let newC = [];
        for(let i=0; i<len; i++) newC.push(vert ? startId + (i*10) : startId + i);
        playerShipsCoords = playerShipsCoords.filter(x => x.id !== ship.id);
        playerShipsCoords.push({id: ship.id, coords: newC});
    }

    function checkReady() {
        if(playerShipsCoords.length === 6) startBattleBtn.classList.remove('hidden');
        else startBattleBtn.classList.add('hidden');
    }

    startBattleBtn.addEventListener('click', () => {
        gameActive = true;
        document.getElementById('shipyard-section').classList.add('hidden');
        document.getElementById('enemy-section').classList.remove('hidden');
        startBattleBtn.classList.add('hidden');
        statusText.innerText = "TWOJA TURA! Celuj w wody wroga.";
        setupCPU();
    });

    function setupCPU() {
        shipsToPlace.forEach(s => {
            let ok = false;
            while(!ok) {
                let start = Math.floor(Math.random() * 100);
                let vert = Math.random() > 0.5;
                let tempC = [];
                let row = Math.floor(start/10);
                let fit = true;
                for(let i=0; i<s.len; i++) {
                    let curr = vert ? start + (i*10) : start + i;
                    if(curr > 99 || (!vert && Math.floor(curr/10) !== row) || computerShipsCoords.some(x => x.coords.includes(curr))) {
                        fit = false; break;
                    }
                    tempC.push(curr);
                }
                if(fit) {
                    computerShipsCoords.push({coords: tempC});
                    ok = true;
                }
            }
        });
    }

    function playerShoot(id, cell) {
        if(!gameActive || cell.classList.contains('hit') || cell.classList.contains('miss')) return;
        let hit = computerShipsCoords.find(s => s.coords.includes(id));
        if(hit) {
            cell.classList.add('hit');
            if(document.querySelectorAll('.computer-grid .hit').length === 19) { alert("WYGRAŁEŚ!"); location.reload(); }
        } else {
            cell.classList.add('miss');
            gameActive = false;
            statusText.innerText = "WRÓG CELUJE...";
            setTimeout(cpuShoot, 800);
        }
    }

    // NAPRAWIONA LOGIKA WROGA - NIE ZAWIESZA SIĘ
    function cpuShoot() {
        if(availableCPUShots.length === 0) return;
        
        const randomIndex = Math.floor(Math.random() * availableCPUShots.length);
        const shotId = availableCPUShots.splice(randomIndex, 1)[0];
        const cell = playerBoard.children[shotId];

        let hit = playerShipsCoords.find(s => s.coords.includes(shotId));
        if(hit) {
            cell.classList.add('hit');
            if(document.querySelectorAll('.player-grid .hit').length === 19) { alert("PRZEGRAŁEŚ!"); location.reload(); }
            setTimeout(cpuShoot, 800);
        } else {
            cell.classList.add('miss');
            statusText.innerText = "TWOJA TURA!";
            gameActive = true;
        }
    }
});
