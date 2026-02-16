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

    // --- LOGIKA AI ---
    let availableCPUShots = Array.from({length: 100}, (_, i) => i);
    let cpuHuntQueue = []; // Lista pól do sprawdzenia po trafieniu

    // --- SYSTEM DŹWIĘKÓW ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playExplosionSound() {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.5);
    }

    function playSunkSound() {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 1);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 1);
    }

    const startMusic = () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        music.volume = 0.1;
        music.play().catch(() => {});
    };

    window.addEventListener('click', startMusic, { once: true });

    playBtn.addEventListener('click', () => {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        startMusic();
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
        const startId = parseInt(e.target.dataset.id);
        if (isNaN(startId)) return;
        const len = parseInt(draggedShip.dataset.len);
        const vert = draggedShip.dataset.vert === "true";
        if (canPlace(startId, len, vert, draggedShip.id, playerShips)) {
            const coords = [];
            for (let i = 0; i < len; i++) coords.push(vert ? startId + i * 10 : startId + i);
            playerShips = playerShips.filter(s => s.id !== draggedShip.id);
            playerShips.push({ id: draggedShip.id, coords: coords, hits: 0, len: len });
            draggedShip.style.position = "absolute";
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
            playExplosionSound();
            ship.hits++;
            if (ship.hits === ship.len) {
                playSunkSound();
                ship.coords.forEach(c => computerBoard.children[c].classList.add('sunk'));
            }
            checkGameOver();
        } else {
            cell.classList.add('miss');
            isPlayerTurn = false;
            setTimeout(cpuAttack, 800);
        }
    }

    // --- ULEPSZONE AI: HUNT & TARGET ---
    function cpuAttack() {
        if (!gameActive) return;

        let shotId;

        // Jeśli AI ma "cele" w kolejce, strzela w nie
        if (cpuHuntQueue.length > 0) {
            shotId = cpuHuntQueue.shift();
        } else {
            // W przeciwnym razie strzela losowo z dostępnych pól
            const index = Math.floor(Math.random() * availableCPUShots.length);
            shotId = availableCPUShots.splice(index, 1)[0];
        }

        // Usuń shotId z dostępnych, jeśli przyszedł z HuntQueue
        availableCPUShots = availableCPUShots.filter(id => id !== shotId);

        const cell = playerBoard.children[shotId];
        let ship = playerShips.find(s => s.coords.includes(shotId));

        if (ship) {
            cell.classList.add('hit');
            playExplosionSound();
            ship.hits++;

            // Dodaj sąsiednie pola do kolejki polowania (góra, dół, lewo, prawo)
            const neighbors = [shotId - 10, shotId + 10, shotId - 1, shotId + 1];
            neighbors.forEach(n => {
                // Sprawdź czy pole jest na planszy, nie było strzelane i czy nie wychodzi poza krawędź boczną
                if (n >= 0 && n < 100 && availableCPUShots.includes(n)) {
                    if (Math.abs((n % 10) - (shotId % 10)) <= 1) { // zabezpieczenie krawędzi
                        if (!cpuHuntQueue.includes(n)) cpuHuntQueue.push(n);
                    }
                }
            });

            if (ship.hits === ship.len) {
                playSunkSound();
                ship.coords.forEach(c => playerBoard.children[c].classList.add('sunk'));
                cpuHuntQueue = []; // Wyczyść kolejkę po zatopieniu, wróć do polowania
            }
            
            checkGameOver();
            if (gameActive) setTimeout(cpuAttack, 800);
        } else {
            cell.classList.add('miss');
            isPlayerTurn = true;
            statusText.innerText = "TWOJA TURA, KAPITANIE!";
        }
    }

    function checkGameOver() {
        const pWin = computerShips.every(s => s.hits === s.len);
        const cWin = playerShips.every(s => s.hits === s.len);
        if (pWin || cWin) {
            gameActive = false;
            setTimeout(() => { alert(pWin ? "WYGRANA! Morze jest Twoje!" : "PORAŻKA! Ryby Cię zjedzą..."); location.reload(); }, 500);
        }
    }
});
