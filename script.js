document.addEventListener('DOMContentLoaded', () => {
    // 1. ŁĄCZENIE Z ELEMENTAMI HTML
    const elements = {
        playBtn: document.getElementById('play-btn'),
        music: document.getElementById('bg-music'),
        playerBoard: document.getElementById('player-board'),
        computerBoard: document.getElementById('computer-board'),
        shipyard: document.getElementById('shipyard'),
        startBattleBtn: document.getElementById('start-battle'),
        statusText: document.getElementById('status'),
        mainMenu: document.getElementById('main-menu'),
        gameUi: document.getElementById('game-ui')
    };

    // Sprawdzenie czy wszystko jest w HTML - jeśli czegoś brakuje, wypisze to w konsoli
    for (let key in elements) {
        if (!elements[key]) console.error(`Błąd: Brakuje elementu o ID: ${key} w Twoim HTML!`);
    }

    // 2. SYNTEZATOR DŹWIĘKU (Efekty bez plików mp3)
    let audioCtx;
    function initAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    function playSfx(freq, type, dur, vol) {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start();
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
        osc.stop(audioCtx.currentTime + dur);
    }

    const sndMiss = () => playSfx(200, 'sine', 0.2, 0.2);
    const sndHit = () => playSfx(100, 'square', 0.3, 0.3);
    const sndSink = () => playSfx(50, 'sawtooth', 0.8, 0.5);

    // 3. LOGIKA GRY
    const shipTypes = [5, 4, 3, 3, 2, 2];
    let playerShips = [], computerShips = [], playerHealth = 19, cpuHealth = 19;
    let draggedShip = null, gameActive = false, isPlayerTurn = true;
    let availableCPUShots = Array.from({length: 100}, (_, i) => i);

    // PRZYCISK START
    elements.playBtn.addEventListener('click', () => {
        initAudio(); // Budzimy dźwięk
        elements.mainMenu.classList.add('hidden');
        elements.gameUi.classList.remove('hidden');
        if (elements.music) {
            elements.music.volume = 0.2;
            elements.music.play().catch(() => {});
        }
        initGame();
    });

    function initGame() {
        elements.playerBoard.innerHTML = '';
        elements.computerBoard.innerHTML = '';
        renderShipyard();
        for (let i = 0; i < 100; i++) {
            const pCell = document.createElement('div');
            pCell.className = 'cell';
            elements.playerBoard.appendChild(pCell);
            
            const cCell = document.createElement('div');
            cCell.className = 'cell';
            cCell.addEventListener('click', () => playerAttack(i, cCell));
            elements.computerBoard.appendChild(cCell);
        }
    }

    function renderShipyard() {
        elements.shipyard.innerHTML = '';
        shipTypes.forEach((len, idx) => {
            const ship = document.createElement('div');
            ship.className = 'ship-drag';
            ship.style.width = `${len * 40}px`;
            ship.draggable = true;
            ship.dataset.len = len;
            ship.id = `s-${idx}`;
            ship.addEventListener('dragstart', () => { draggedShip = ship; });
            elements.shipyard.appendChild(ship);
        });
    }

    // [Uproszczone kładzenie statków dla testu]
    elements.playerBoard.addEventListener('dragover', e => e.preventDefault());
    elements.playerBoard.addEventListener('drop', e => {
        const rect = elements.playerBoard.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / 40);
        const y = Math.floor((e.clientY - rect.top) / 40);
        const id = y * 10 + x;
        
        const len = parseInt(draggedShip.dataset.len);
        let coords = [];
        for(let i=0; i<len; i++) coords.push(id + i);

        playerShips.push({coords, hits: 0, len});
        draggedShip.style.position = "absolute";
        draggedShip.style.left = `${x * 40}px`;
        draggedShip.style.top = `${y * 40}px`;
        elements.playerBoard.appendChild(draggedShip);
        
        if(playerShips.length === shipTypes.length) elements.startBattleBtn.classList.remove('hidden');
    });

    elements.startBattleBtn.addEventListener('click', () => {
        gameActive = true;
        document.getElementById('enemy-section').classList.remove('hidden');
        elements.startBattleBtn.classList.add('hidden');
        setupCPU();
    });

    function setupCPU() {
        shipTypes.forEach(len => {
            let start = Math.floor(Math.random() * 80);
            let coords = [];
            for(let i=0; i<len; i++) coords.push(start + i);
            computerShips.push({coords, hits: 0, len});
        });
    }

    function playerAttack(id, cell) {
        if (!gameActive || !isPlayerTurn || cell.classList.contains('hit')) return;
        let ship = computerShips.find(s => s.coords.includes(id));
        if (ship) {
            cell.classList.add('hit');
            cpuHealth--;
            sndHit();
            if (++ship.hits === ship.len) sndSink();
            if (cpuHealth <= 0) alert("WYGRANA!");
        } else {
            cell.classList.add('miss');
            sndMiss();
            isPlayerTurn = false;
            setTimeout(cpuAttack, 600);
        }
    }

    function cpuAttack() {
        let shot = availableCPUShots.pop();
        const cell = elements.playerBoard.children[shot];
        let ship = playerShips.find(s => s.coords.includes(shot));
        if (ship) {
            playerHealth--;
            sndHit();
            if (playerHealth <= 0) alert("PRZEGRANA");
            else setTimeout(cpuAttack, 600);
        } else {
            sndMiss();
            isPlayerTurn = true;
        }
    }
});
