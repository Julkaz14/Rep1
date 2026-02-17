document.addEventListener('DOMContentLoaded', () => {
    const playerBoard = document.getElementById('player-board');
    const computerBoard = document.getElementById('computer-board');
    const shipyard = document.getElementById('shipyard');
    const startBattleBtn = document.getElementById('start-battle');
    const statusText = document.getElementById('status');
    const playBtn = document.getElementById('play-btn');

    // Audio
    const sndHit = document.getElementById('snd-hit');
    const sndSink = document.getElementById('snd-sink');
    const sndMiss = document.getElementById('snd-miss');

    const shipTypes = [5, 4, 3, 3, 2, 2];
    let playerShips = [], computerShips = [], playerHealth = 19, cpuHealth = 19;
    let draggedShip = null, gameActive = false, isPlayerTurn = true;
    let availableCPUShots = Array.from({length: 100}, (_, i) => i);

    playBtn.addEventListener('click', () => {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        initGame();
    });

    function initGame() {
        playerBoard.innerHTML = ''; 
        computerBoard.innerHTML = '';
        renderShipyard();
        for (let i = 0; i < 100; i++) {
            const pCell = document.createElement('div');
            pCell.classList.add('cell'); 
            playerBoard.appendChild(pCell);
            
            const cCell = document.createElement('div');
            cCell.classList.add('cell');
            cCell.addEventListener('click', () => playerAttack(i, cCell));
            computerBoard.appendChild(cCell);
        }
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
            ship.onclick = () => {
                const isVert = ship.dataset.vert === "true";
                ship.dataset.vert = !isVert;
                ship.style.width = !isVert ? "40px" : `${len * 40}px`;
                ship.style.height = !isVert ? `${len * 40}px` : "40px";
            };
            ship.addEventListener('dragstart', () => { draggedShip = ship; });
            slot.appendChild(ship);
            shipyard.appendChild(slot);
        });
    }

    playerBoard.addEventListener('dragover', e => e.preventDefault());
    playerBoard.addEventListener('drop', e => {
        const rect = playerBoard.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / 40);
        const y = Math.floor((e.clientY - rect.top) / 40);
        const id = y * 10 + x;
        const len = parseInt(draggedShip.dataset.len);
        const vert = draggedShip.dataset.vert === "true";

        if (canPlace(id, len, vert, draggedShip.id, playerShips)) {
            let coords = [];
            for (let i = 0; i < len; i++) coords.push(vert ? id + i * 10 : id + i);
            playerShips.push({ id: draggedShip.id, coords });
            draggedShip.style.position = "absolute";
            draggedShip.style.left = `${x * 40}px`;
            draggedShip.style.top = `${y * 40}px`;
            playerBoard.appendChild(draggedShip);
            if (playerShips.length === shipTypes.length) startBattleBtn.classList.remove('hidden');
        }
    });

    function canPlace(id, len, vert, sId, ships) {
        for (let i = 0; i < len; i++) {
            let curr = vert ? id + i * 10 : id + i;
            if (curr < 0 || curr > 99 || (!vert && Math.floor(curr / 10) !== Math.floor(id / 10))) return false;
            if (ships.some(s => s.coords.includes(curr))) return false;
        }
        return true;
    }

    startBattleBtn.addEventListener('click', () => {
        gameActive = true;
        document.getElementById('shipyard-section').classList.add('hidden');
        document.getElementById('enemy-section').classList.remove('hidden');
        startBattleBtn.classList.add('hidden');
        setupCPU();
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
                    computerShips.push({ coords, hits: 0, len });
                    placed = true;
                }
            }
        });
    }

    function playerAttack(id, cell) {
        if (!gameActive || !isPlayerTurn || cell.innerHTML !== "") return;
        let ship = computerShips.find(s => s.coords.includes(id));
        if (ship) {
            cell.classList.add('hit-enemy');
            cell.innerHTML = "💥";
            sndHit.play();
            cpuHealth--;
            if (cpuHealth <= 0) endGame(true);
        } else {
            cell.innerHTML = "🌊";
            sndMiss.play();
            isPlayerTurn = false;
            setTimeout(cpuAttack, 700);
        }
    }

    function cpuAttack() {
        let shot = availableCPUShots.splice(Math.floor(Math.random() * availableCPUShots.length), 1)[0];
        const cell = playerBoard.querySelectorAll('.cell')[shot];
        let ship = playerShips.find(s => s.coords.includes(shot));
        if (ship) {
            cell.classList.add('hit-player');
            cell.innerHTML = "💀";
            sndHit.play();
            playerHealth--;
            if (playerHealth <= 0) endGame(false);
            else setTimeout(cpuAttack, 700);
        } else {
            cell.innerHTML = "🌊";
            sndMiss.play();
            isPlayerTurn = true;
        }
    }

    function endGame(isWin) {
        gameActive = false;
        alert(isWin ? "ZWYCIĘSTWO! Kapitan pokonał flotę wroga!" : "PRZEGRANA! Twoja flota spoczywa na dnie...");
        location.reload();
    }
});
