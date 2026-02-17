document.addEventListener('DOMContentLoaded', () => {
    // UI ELEMENTS
    const playerBoard = document.getElementById('player-board');
    const computerBoard = document.getElementById('computer-board');
    const shipyard = document.getElementById('shipyard');
    const startBattleBtn = document.getElementById('start-battle');
    const statusText = document.getElementById('status');
    const playBtn = document.getElementById('play-btn');

    // --- SYSTEM AUDIO ---
    // Muzyka jako plik (upewnij się, że masz music.mp3 w folderze)
    const bgMusic = new Audio('music.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.2;

    let audioCtx;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        // Start muzyki z pliku
        bgMusic.play().catch(err => console.log("Czekam na interakcję dla muzyki..."));
    }

    // Generator efektów (Synthesizer)
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
        noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
        noise.start();
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    }

    function playTone(freq, type, duration, vol) {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start();
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.stop(audioCtx.currentTime + duration);
    }

    // Wywołania efektów
    const soundMiss = () => playNoise(0.3, 'highpass', 1000, 0.3);
    const soundHit = () => { playTone(150, 'square', 0.4, 0.5); playNoise(0.4, 'lowpass', 600, 0.6); };
    const soundSink = () => { playTone(80, 'sawtooth', 0.8, 0.7); playNoise(0.8, 'lowpass', 300, 0.8); };

    function soundWin() {
        const t = audioCtx.currentTime;
        const notes = [440, 554, 659, 880];
        notes.forEach((f, i) => {
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.connect(g); g.connect(audioCtx.destination);
            osc.frequency.value = f;
            osc.start(t + i*0.15);
            g.gain.setValueAtTime(0.3, t + i*0.15);
            g.gain.exponentialRampToValueAtTime(0.01, t + i*0.15 + 0.4);
            osc.stop(t + i*0.15 + 0.4);
        });
    }

    function soundLose() {
        const t = audioCtx.currentTime;
        const notes = [300, 250, 200, 150];
        notes.forEach((f, i) => {
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.connect(g); g.connect(audioCtx.destination);
            osc.frequency.value = f;
            osc.start(t + i*0.3);
            g.gain.setValueAtTime(0.3, t + i*0.3);
            g.gain.linearRampToValueAtTime(0.01, t + i*0.3 + 0.5);
            osc.stop(t + i*0.3 + 0.5);
        });
    }

    // --- LOGIKA GRY ---
    const shipTypes = [5, 4, 3, 3, 2, 2];
    const totalHealth = shipTypes.reduce((a, b) => a + b, 0); 
    let playerShips = [], computerShips = [], playerHealth = totalHealth, cpuHealth = totalHealth;
    let draggedShip = null, gameActive = false, isPlayerTurn = true;
    let playerShipsAfloat = [...shipTypes];
    let availableCPUShots = Array.from({length: 100}, (_, i) => i);

    playBtn.addEventListener('click', () => {
        initAudio(); // Budzimy muzykę i syntezator
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        initGame();
    });

    function initGame() {
        playerBoard.innerHTML = ''; computerBoard.innerHTML = '';
        renderShipyard();
        for (let i = 0; i < 100; i++) {
            const pCell = document.createElement('div'); pCell.classList.add('cell');
            playerBoard.appendChild(pCell);
            const cCell = document.createElement('div'); cCell.classList.add('cell');
            cCell.addEventListener('click', () => playerAttack(i, cCell));
            computerBoard.appendChild(cCell);
        }
    }

    function renderShipyard() {
        shipyard.innerHTML = '';
        shipTypes.forEach((len, idx) => {
            const slot = document.createElement('div'); slot.classList.add('ship-slot');
            slot.dataset.slotIdx = idx;
            const ship = document.createElement('div');
            ship.classList.add('ship-drag'); ship.id = `ship-${idx}`;
            ship.dataset.len = len; ship.dataset.vert = "false";
            ship.style.width = `${len * 40}px`; ship.style.height = `40px`;
            ship.draggable = true;
            ship.addEventListener('dragstart', () => { draggedShip = ship; });
            ship.addEventListener('click', (e) => { e.stopPropagation(); handleShipClick(ship); });
            slot.appendChild(ship); shipyard.appendChild(slot);
        });
    }

    function handleShipClick(ship) {
        if(gameActive) return;
        const shipIdx = ship.id.split('-')[1];
        const originalSlot = shipyard.querySelector(`[data-slot-idx="${shipIdx}"]`);
        if(ship.parentElement !== originalSlot) {
            ship.style.position = "relative"; ship.style.left = "0"; ship.style.top = "0";
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
            draggedShip.style.left = `${cellX * 40}px`; draggedShip.style.top = `${cellY * 40}px`;
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
        setupCPU(); updateStatus();
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
            cell.classList.add('hit'); cpuHealth--;
            if (++ship.hits === ship.len) {
                soundSink();
                ship.coords.forEach(c => computerBoard.children[c].classList.add('sunk'));
            } else soundHit();
            if (cpuHealth <= 0) endGame(true);
        } else {
            cell.classList.add('miss'); soundMiss();
            isPlayerTurn = false; updateStatus();
            setTimeout(cpuAttack, 700);
        }
    }

    function cpuAttack() {
        if (!gameActive) return;
        let shotId = availableCPUShots[Math.floor(Math.random() * availableCPUShots.length)];
        availableCPUShots = availableCPUShots.filter(id => id !== shotId);
        const cell = playerBoard.querySelectorAll('.cell')[shotId];
        let ship = playerShips.find(s => s.coords.includes(shotId));
        if (ship) {
            cell.classList.add('hit'); playerHealth--;
            if (++ship.hits === ship.len) {
                soundSink();
                ship.coords.forEach(c => playerBoard.querySelectorAll('.cell')[c].classList.add('sunk'));
            } else soundHit();
            if (playerHealth <= 0) endGame(false);
            else setTimeout(cpuAttack, 600);
        } else {
            cell.classList.add('miss'); soundMiss();
            isPlayerTurn = true; updateStatus();
        }
    }

    function endGame(isWin) {
        gameActive = false;
        bgMusic.pause(); // Stop muzyki
        isWin ? soundWin() : soundLose();

        // Odkryj statki wroga
        computerShips.forEach(ship => {
            ship.coords.forEach(c => {
                const cell = computerBoard.children[c];
                if (!cell.classList.contains('hit')) {
                    cell.style.backgroundColor = 'rgba(149, 165, 166, 0.4)';
                    cell.style.border = '1px dashed white';
                }
            });
        });

        // Ekran końcowy
        const screen = document.createElement('div');
        Object.assign(screen.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', zIndex: '10000', color: isWin ? '#4CAF50' : '#F44336'
        });
        const h1 = document.createElement('h1');
        h1.innerText = isWin ? "ZWYCIĘSTWO!" : "PRZEGRANA!";
        h1.style.fontSize = '5rem';
        const btn = document.createElement('button');
        btn.innerText = "ZAGRAJ PONOWNIE";
        Object.assign(btn.style, { padding: '15px 30px', marginTop: '20px', cursor: 'pointer', fontSize: '1.2rem' });
        btn.onclick = () => location.reload();
        
        const btnView = document.createElement('button');
        btnView.innerText = "ZOBACZ PLANSZĘ";
        Object.assign(btnView.style, { padding: '15px 30px', marginTop: '10px', cursor: 'pointer' });
        btnView.onclick = () => screen.remove();

        screen.append(h1, btn, btnView);
        document.body.appendChild(screen);
    }
});
