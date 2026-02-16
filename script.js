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

    // AI MEMORY
    let availableCPUShots = Array.from({length: 100}, (_, i) => i);
    let cpuHuntQueue = []; 

    // AUDIO CONTEXT (Dźwięki bez plików)
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playSound(freq, type, duration, vol) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + duration);
    }

    const startAudio = () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        music.volume = 0.15;
        music.play().catch(() => {});
    };

    playBtn.addEventListener('click', () => {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        startAudio();
        initGame();
    });

    function initGame() {
        playerBoard.innerHTML = '';
        computerBoard.innerHTML = '';
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
            ship.addEventListener('dragstart', () => draggedShip = ship);
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
        if (ship.parentElement === playerBoard) {
            shipyard.appendChild(ship);
            ship.style.position = "static";
            playerShips = playerShips.filter(s => s.id !== ship.id);
            startBattleBtn.classList.add('hidden');
        }
    }

    playerBoard.addEventListener('dragover', e => e.preventDefault());
    playerBoard.addEventListener('drop', e => {
        e.preventDefault();
        const target = e.target.classList.contains('cell') ? e.target : e.target.parentElement;
        const startId = parseInt(target.dataset.id);
        if (isNaN(startId)) return;
        
        const len = parseInt(draggedShip.dataset.len);
        const vert = draggedShip.dataset.vert === "true";
        
        if (canPlace(startId, len, vert, draggedShip.id, playerShips)) {
            const coords = [];
            for (let i = 0; i < len; i++) coords.push(vert ? startId + i * 10 : startId + i);
            playerShips = playerShips.filter(s => s.id !== draggedShip.id);
            playerShips.push({ id: draggedShip.id, coords: coords, hits: 0, len: len });
            
            draggedShip.style.left = `${(startId % 10) * 40}px`;
            draggedShip.style.top = `${Math.floor(startId / 10) * 40}px`;
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
        statusText.innerText = "TWOJA TURA!";
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
        let ship = computerShips.find(s => s.coords.includes(id));
        if (ship) {
            cell.classList.add('hit');
            playSound(120, 'sawtooth', 0.4, 0.2);
            ship.hits++;
            if (ship.hits === ship.len) {
                playSound(300, 'sine', 1.2, 0.3);
                ship.coords.forEach(c => computerBoard.children[c].classList.add('sunk'));
            }
            checkGameOver();
        } else {
            cell.classList.add('miss');
            isPlayerTurn = false;
            setTimeout(cpuAttack, 700);
        }
    }

    // AI: HUNT & TARGET LOGIC
    function cpuAttack() {
        if (!gameActive) return;
        let shotId;
        if (cpuHuntQueue.length > 0) {
            shotId = cpuHuntQueue.shift();
        } else {
            const index = Math.floor(Math.random() * availableCPUShots.length);
            shotId = availableCPUShots.splice(index, 1)[0];
        }

        availableCPUShots = availableCPUShots.filter(id => id !== shotId);
        const cells = playerBoard.querySelectorAll('.cell');
        const cell = cells[shotId];
        let ship = playerShips.find(s => s.coords.includes(shotId));

        if (ship) {
            cell.classList.add('hit');
            playSound(100, 'sawtooth', 0.5, 0.2);
            ship.hits++;
            
            // Szukaj sąsiadów
            [shotId-10, shotId+10, shotId-1, shotId+1].forEach(n => {
                if (n >= 0 && n < 100 && availableCPUShots.includes(n)) {
                    if (Math.abs((n % 10) - (shotId % 10)) <= 1 && !cpuHuntQueue.includes(n)) {
                        cpuHuntQueue.push(n);
                    }
                }
            });

            if (ship.hits === ship.len) {
                playSound(200, 'sine', 1, 0.3);
                ship.coords.forEach(c => cells[c].classList.add('sunk'));
                cpuHuntQueue = []; 
            }
            checkGameOver();
            if (gameActive) setTimeout(cpuAttack, 700);
        } else {
            cell.classList.add('miss');
            isPlayerTurn = true;
        }
    }

    function checkGameOver() {
        const pWin = computerShips.every(s => s.hits === s.len);
        const cWin = playerShips.every(s => s.hits === s.len);
        if (pWin || cWin) {
            gameActive = false;
            setTimeout(() => { alert(pWin ? "ZWYCIĘSTWO!" : "PRZEGRANA!"); location.reload(); }, 500);
        }
    }
});
