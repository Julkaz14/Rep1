document.addEventListener('DOMContentLoaded', () => {
    // UI ELEMENTS
    const playerBoard = document.getElementById('player-board');
    const computerBoard = document.getElementById('computer-board');
    const shipyard = document.getElementById('shipyard');
    const startBattleBtn = document.getElementById('start-battle');
    const statusText = document.getElementById('status');
    const playBtn = document.getElementById('play-btn');

    // --- NOWY SYSTEM AUDIO (SYNTEZA) ---
    const music = document.getElementById('bg-music');
    let audioCtx;

    function initAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    // Generator dźwięków typu "szum" (fala, wybuch)
    function playNoise(duration, type, freq, vol) {
        if (!audioCtx) return;
        const bufferSize = audioCtx.sampleRate * duration;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = freq;
        const gain = audioCtx.createGain();
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        
        noise.start();
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    }

    // Generator dźwięków typu "ton" (strzał, melodia)
    function playTone(freq, type, duration, vol) {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.stop(audioCtx.currentTime + duration);
    }

    // Konkretne efekty
    const soundMiss = () => playNoise(0.3, 'highpass', 1000, 0.4); // Fala
    const soundHit = () => { playTone(120, 'triangle', 0.4, 0.6); playNoise(0.4, 'lowpass', 400, 0.6); }; // Armata
    const soundSink = () => { playTone(60, 'sawtooth', 0.8, 0.8); playNoise(1.0, 'lowpass', 200, 1); }; // Zatopienie

    function soundWin() {
        const t = audioCtx.currentTime;
        const notes = [440, 554, 659, 880];
        notes.forEach((f, i) => playTone(f, 'sine', 0.5, 0.3, t + i * 0.15));
    }

    function soundLose() {
        const t = audioCtx.currentTime;
        const notes = [300, 250, 200, 150];
        notes.forEach((f, i) => playTone(f, 'sawtooth', 0.6, 0.3, t + i * 0.2));
    }

    // --- RESZTA LOGIKI ---
    const shipTypes = [5, 4, 3, 3, 2, 2];
    const totalHealth = shipTypes.reduce((a, b) => a + b, 0); 
    let playerShips = [];
    let computerShips = [];
    let playerHealth = totalHealth;
    let cpuHealth = totalHealth;
    let playerShipsAfloat = [...shipTypes];
    let draggedShip = null;
    let gameActive = false;
    let isPlayerTurn = true;
    let availableCPUShots = Array.from({length: 100}, (_, i) => i);

    playBtn.addEventListener('click', () => {
        initAudioContext(); // Aktywacja dźwięku
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        if (music) {
            music.volume = 0.1;
            music.play().catch(() => {});
        }
        initGame();
    });

    function initGame() {
        playerBoard.innerHTML = ''; 
        computerBoard.innerHTML = '';
        renderShipyard();
        for (let i = 0; i < 100; i++) {
            const pCell = document.createElement('div');
            pCell.classList.add('cell'); pCell.dataset.id = i;
            playerBoard.appendChild(pCell);
            const cCell = document.createElement('div');
            cCell.classList.add('cell'); cCell.dataset.id = i;
            cCell.addEventListener('click', () => playerAttack(i, cCell));
            computerBoard.appendChild(cCell);
        }
    }

    function renderShipyard() {
        shipyard.innerHTML = '';
        shipTypes.forEach((len, idx) => {
            const slot = document.createElement('div');
            slot.classList.add('ship-slot');
            slot.dataset.slotIdx = idx;
            const ship = document.createElement('div');
            ship.classList.add('ship-drag');
            ship.id = `ship-${idx}`;
            ship.dataset.len = len; ship.dataset.vert = "false";
            ship.style.width = `${len * 40}px`; ship.style.height = `40px`;
            ship.draggable = true;
            ship.addEventListener('dragstart', () => { draggedShip = ship; });
            ship.addEventListener('click', (e) => { e.stopPropagation(); handleShipClick(ship); });
            slot.appendChild(ship);
            shipyard.appendChild(slot);
        });
    }

    function handleShipClick(ship) {
        if(gameActive) return;
        const shipIdx = ship.id.split('-')[1];
        const originalSlot = shipyard.querySelector(`[data-slot-idx="${shipIdx}"]`);
        if(ship.parentElement !== originalSlot) {
            ship.style.position = "relative";
            ship.style.left = "0"; ship.style.top = "0";
            playerShips = playerShips.filter(s => s.id !== ship.id);
            originalSlot.appendChild(ship);
            startBattleBtn.classList.add('hidden');
        } else {
            const isVert = ship.dataset.vert === "true";
            const len = parseInt(ship.dataset.len);
            ship.dataset.vert = !isVert;
            ship.style.width = !isVert ? "40px" : `${len * 40}px`;
            ship.style.height = !isVert ? `${len * 40}px` : "40px";
        }
    }

    playerBoard.addEventListener('dragover', e => e.preventDefault());
    playerBoard.addEventListener('drop', e => {
        e.preventDefault();
        const rect = playerBoard.getBoundingClientRect();
        const cellX = Math.floor((e.clientX - rect.left) / 40);
        const cellY = Math.floor((e.clientY - rect.top) / 40);
        const startId = cellY * 10 + cellX;
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

    function canPlace(id, len, vert, sId, ships) {
        for (let i = 0; i < len; i++) {
            let curr = vert ? id + i * 10 : id + i;
            if (curr < 0 || curr > 99 || (!vert && Math.floor(curr / 10) !== Math.floor(id / 10))) return false;
            if (ships.some(s => s.id !== sId && s.coords.includes(curr))) return false;
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
        if (!gameActive || !isPlayerTurn || cell.classList.contains('hit') || cell.classList.contains('miss') || cell.classList.contains('sunk')) return;
        let ship = computerShips.find(s => s.coords.includes(id));
        if (ship) {
            cell.classList.add('hit'); cpuHealth--;
            if (++ship.hits === ship.len) {
                soundSink(); // Dźwięk zatopienia
                ship.coords.forEach(c => {
                    let targetCell = computerBoard.children[c];
                    targetCell.classList.add('sunk');
                    targetCell.style.backgroundColor = '#2c3e50'; 
                });
            } else {
                soundHit(); // Dźwięk trafienia
            }
            if (cpuHealth <= 0) endGame(true);
        } else {
            cell.classList.add('miss'); 
            soundMiss(); // Dźwięk pudła
            isPlayerTurn = false; updateStatus();
            setTimeout(cpuAttack, 700);
        }
    }

    function cpuAttack() {
        if (!gameActive) return;
        let shotId = getDynamicHuntShot() || calculateBestMove();
        if (!availableCPUShots.includes(shotId)) {
            if (gameActive) cpuAttack();
            return;
        }
        availableCPUShots = availableCPUShots.filter(id => id !== shotId);
        const cell = playerBoard.querySelectorAll('.cell')[shotId];
        let ship = playerShips.find(s => s.coords.includes(shotId));

        if (ship) {
            cell.classList.add('hit');
            playerHealth--;
            if (++ship.hits === ship.len) {
                soundSink();
                ship.coords.forEach(c => {
                    let targetCell = playerBoard.querySelectorAll('.cell')[c];
                    targetCell.classList.add('sunk');
                    targetCell.style.backgroundColor = '#2c3e50'; 
                });
                const idx = playerShipsAfloat.indexOf(ship.len);
                if (idx > -1) playerShipsAfloat.splice(idx, 1);
            } else {
                soundHit();
            }
            if (playerHealth <= 0) endGame(false);
            else setTimeout(cpuAttack, 600);
        } else {
            cell.classList.add('miss'); 
            soundMiss();
            isPlayerTurn = true; updateStatus();
        }
    }

    function getDynamicHuntShot() {
        const cells = playerBoard.querySelectorAll('.cell');
        let unsunkHits = [];
        for(let i=0; i<100; i++) {
            if(cells[i].classList.contains('hit') && !cells[i].classList.contains('sunk')) unsunkHits.push(i);
        }
        if(unsunkHits.length === 0) return null;
        let target = unsunkHits[0];
        let possibleMoves = [target-1, target+1, target-10, target+10].filter(m => m >= 0 && m < 100 && availableCPUShots.includes(m));
        return possibleMoves.length > 0 ? possibleMoves[0] : null;
    }

    function calculateBestMove() {
        return availableCPUShots[Math.floor(Math.random() * availableCPUShots.length)];
    }

    function endGame(isWin) {
        gameActive = false;
        if (music) music.pause();
        isWin ? soundWin() : soundLose(); // Dźwięk końca gry

        computerShips.forEach(ship => {
            ship.coords.forEach(c => {
                const cell = computerBoard.children[c];
                if (!cell.classList.contains('hit') && !cell.classList.contains('sunk')) {
                    cell.style.backgroundColor = 'rgba(149, 165, 166, 0.6)';
                    cell.style.border = '2px dashed #ecf0f1';
                }
            });
        });

        const screen = document.createElement('div');
        screen.id = "end-screen-overlay";
        Object.assign(screen.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', zIndex: '10000',
            fontFamily: 'Impact, sans-serif', color: isWin ? '#4CAF50' : '#F44336'
        });

        const bigText = document.createElement('h1');
        bigText.innerText = isWin ? "ZWYCIĘSTWO!" : "PRZEGRANA!";
        bigText.style.fontSize = '6rem';
        const btnAgain = document.createElement('button');
        btnAgain.innerText = "ZAGRAJ PONOWNIE";
        styleBtn(btnAgain, '#e67e22');
        btnAgain.onclick = () => location.reload();

        const btnView = document.createElement('button');
        btnView.innerText = "ZOBACZ PLANSZĘ";
        styleBtn(btnView, '#3498db');
        btnView.onclick = () => screen.remove();

        screen.append(bigText, btnAgain, btnView);
        document.body.appendChild(screen);
    }

    function styleBtn(btn, color) {
        Object.assign(btn.style, {
            padding: '15px 30px', fontSize: '1.2rem', margin: '10px',
            cursor: 'pointer', border: 'none', borderRadius: '50px',
            backgroundColor: color, color: 'white'
        });
    }
});
