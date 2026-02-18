document.addEventListener('DOMContentLoaded', () => {
    // ELEMENTY UI
    const playerBoard = document.getElementById('player-board');
    const computerBoard = document.getElementById('computer-board');
    const shipyard = document.getElementById('shipyard');
    const startBattleBtn = document.getElementById('start-battle');
    const statusText = document.getElementById('status');
    const playBtn = document.getElementById('play-btn');

    // DŹWIĘKI
    const music = document.getElementById('bg-music');
    const sndHit = document.getElementById('snd-hit');
    const sndSink = document.getElementById('snd-sink');
    const sndMiss = document.getElementById('snd-miss');

    // USTAWIENIA FLOTY
    const shipTypes = [5, 4, 3, 3, 2, 2];
    let playerShips = [];
    let computerShips = [];
    let playerHealth = shipTypes.reduce((a, b) => a + b, 0);
    let cpuHealth = playerHealth;
    
    let draggedShip = null;
    let gameActive = false;
    let isPlayerTurn = true;
    let cpuAvailableShots = Array.from({length: 100}, (_, i) => i);

    // START GRY
    playBtn.addEventListener('click', () => {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        if(music) { music.volume = 0.2; music.play().catch(() => {}); }
        initBoards();
    });

    function initBoards() {
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
            cCell.addEventListener('click', () => handlePlayerShot(i, cCell));
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
            ship.dataset.len = len;
            ship.dataset.vert = "false";
            ship.draggable = true;
            
            ship.addEventListener('dragstart', () => { draggedShip = ship; });
            ship.addEventListener('click', (e) => {
                if(gameActive) return;
                const isVert = ship.dataset.vert === "true";
                ship.dataset.vert = !isVert;
            });
            
            slot.appendChild(ship);
            shipyard.appendChild(slot);
        });
    }

    // DRAG AND DROP
    playerBoard.addEventListener('dragover', e => e.preventDefault());
    playerBoard.addEventListener('drop', e => {
        e.preventDefault();
        if(gameActive) return;
        
        const rect = playerBoard.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / 40);
        const y = Math.floor((e.clientY - rect.top) / 40);
        const startId = y * 10 + x;
        const len = parseInt(draggedShip.dataset.len);
        const vert = draggedShip.dataset.vert === "true";

        if (checkPlacement(startId, len, vert, draggedShip.id)) {
            const coords = [];
            for (let i = 0; i < len; i++) coords.push(vert ? startId + i * 10 : startId + i);
            
            playerShips = playerShips.filter(s => s.id !== draggedShip.id);
            playerShips.push({ id: draggedShip.id, coords, hits: 0, len });
            
            draggedShip.style.position = "absolute";
            draggedShip.style.left = `${x * 40}px`;
            draggedShip.style.top = `${y * 40}px`;
            playerBoard.appendChild(draggedShip);
            
            if (playerShips.length === shipTypes.length) startBattleBtn.classList.remove('hidden');
        }
    });

    function checkPlacement(id, len, vert, sId) {
        for (let i = 0; i < len; i++) {
            let curr = vert ? id + i * 10 : id + i;
            if (curr < 0 || curr > 99 || (!vert && Math.floor(curr / 10) !== Math.floor(id / 10))) return false;
            if (playerShips.some(s => s.id !== sId && s.coords.includes(curr))) return false;
        }
        return true;
    }

    // RZUT MONETĄ
    startBattleBtn.addEventListener('click', () => {
        document.getElementById('coin-toss-overlay').classList.remove('hidden');
    });

    document.getElementById('btn-heads').addEventListener('click', () => startCoinToss('orzel'));
    document.getElementById('btn-tails').addEventListener('click', () => startCoinToss('reszka'));

    function startCoinToss(choice) {
        document.getElementById('coin-choices').classList.add('hidden');
        const coin = document.getElementById('coin');
        document.getElementById('coin-container').classList.remove('hidden');
        coin.classList.add('spinning');

        setTimeout(() => {
            coin.classList.remove('spinning');
            const win = Math.random() > 0.5;
            coin.style.transform = win ? "rotateY(1800deg)" : "rotateY(1980deg)";
            
            setTimeout(() => {
                isPlayerTurn = win; 
                document.getElementById('coin-result').innerText = win ? "TWOJA KOLEJ!" : "WRÓG ATAKUJE!";
                setTimeout(beginBattle, 1500);
            }, 3000);
        }, 1000);
    }

    function beginBattle() {
        document.getElementById('coin-toss-overlay').classList.add('hidden');
        document.getElementById('shipyard-section').classList.add('hidden');
        document.getElementById('enemy-section').classList.remove('hidden');
        gameActive = true;
        setupCPU();
        if(!isPlayerTurn) setTimeout(cpuTurn, 1000);
    }

    function setupCPU() {
        shipTypes.forEach((len, idx) => {
            let ok = false;
            while(!ok) {
                let start = Math.floor(Math.random() * 100);
                let vert = Math.random() > 0.5;
                if(checkPlacementCPU(start, len, vert)) {
                    let coords = [];
                    for(let i=0; i<len; i++) coords.push(vert ? start+i*10 : start+i);
                    computerShips.push({coords, hits: 0, len});
                    ok = true;
                }
            }
        });
    }

    function checkPlacementCPU(id, len, vert) {
        for (let i = 0; i < len; i++) {
            let curr = vert ? id + i * 10 : id + i;
            if (curr > 99 || (!vert && Math.floor(curr/10) !== Math.floor(id/10))) return false;
            if (computerShips.some(s => s.coords.includes(curr))) return false;
        }
        return true;
    }

    // LOGIKA WALKI
    function handlePlayerShot(id, cell) {
        if(!gameActive || !isPlayerTurn || cell.classList.contains('hit') || cell.classList.contains('miss')) return;
        
        const ship = computerShips.find(s => s.coords.includes(id));
        if(ship) {
            cell.classList.add('hit');
            if(sndHit) sndHit.play();
            cpuHealth--;
            if(++ship.hits === ship.len) {
                if(sndSink) sndSink.play();
                ship.coords.forEach(c => computerBoard.children[c].classList.add('sunk'));
            }
            if(cpuHealth === 0) endGame("ZWYCIĘSTWO!");
        } else {
            cell.classList.add('miss');
            if(sndMiss) sndMiss.play();
            isPlayerTurn = false;
            setTimeout(cpuTurn, 1000);
        }
    }

    function cpuTurn() {
        if(!gameActive) return;
        const idx = Math.floor(Math.random() * cpuAvailableShots.length);
        const shotId = cpuAvailableShots.splice(idx, 1)[0];
        const cell = playerBoard.children[shotId];
        const ship = playerShips.find(s => s.coords.includes(shotId));

        if(ship) {
            cell.classList.add('hit');
            playerHealth--;
            if(++ship.hits === ship.len) {
                ship.coords.forEach(c => playerBoard.children[c].classList.add('sunk'));
            }
            if(playerHealth === 0) endGame("PORAŻKA!");
            else setTimeout(cpuTurn, 1000);
        } else {
            cell.classList.add('miss');
            isPlayerTurn = true;
        }
    }

    function endGame(msg) {
        gameActive = false;
        alert(msg);
        location.reload();
    }
});
