document.addEventListener('DOMContentLoaded', () => {
    // UI ELEMENTS
    const playerBoard = document.getElementById('player-board');
    const computerBoard = document.getElementById('computer-board');
    const shipyard = document.getElementById('shipyard');
    const startBattleBtn = document.getElementById('start-battle');
    const statusText = document.getElementById('status');
    const playBtn = document.getElementById('play-btn');

    // AUDIO
    const music = document.getElementById('bg-music');
    const sndHit = document.getElementById('snd-hit');
    const sndSink = document.getElementById('snd-sink');
    const sndMiss = document.getElementById('snd-miss');

    // CONFIG
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

    // AI
    let availableCPUShots = Array.from({length: 100}, (_, i) => i);

    function playSound(audioElement) {
        if(!audioElement) return;
        audioElement.volume = 0.4;
        audioElement.currentTime = 0;
        audioElement.play().catch(() => {});
    }

    playBtn.addEventListener('click', () => {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        music.volume = 0.1;
        music.play().catch(() => {});
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
                playSound(sndSink);
                ship.coords.forEach(c => {
                    let targetCell = computerBoard.children[c];
                    targetCell.classList.add('sunk');
                    targetCell.style.backgroundColor = '#2c3e50'; 
                });
            } else playSound(sndHit);
            if (cpuHealth <= 0) endGame(true);
        } else {
            cell.classList.add('miss'); playSound(sndMiss);
            isPlayerTurn = false; updateStatus();
            setTimeout(cpuAttack, 700);
        }
    }

    function cpuAttack() {
        if (!gameActive) return;

        let shotId = getDynamicHuntShot();
        if (shotId === null) {
            shotId = calculateBestMove();
        }

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
                playSound(sndSink);
                ship.coords.forEach(c => {
                    let targetCell = playerBoard.querySelectorAll('.cell')[c];
                    targetCell.classList.add('sunk');
                    targetCell.style.backgroundColor = '#2c3e50'; 
                });
                const idx = playerShipsAfloat.indexOf(ship.len);
                if (idx > -1) playerShipsAfloat.splice(idx, 1);
            } else {
                playSound(sndHit);
            }

            if (playerHealth <= 0) endGame(false);
            else setTimeout(cpuAttack, 600);
        } else {
            cell.classList.add('miss'); playSound(sndMiss);
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
        let cluster = [target];
        let queue = [target];
        while(queue.length > 0) {
            let curr = queue.shift();
            [curr-1, curr+1, curr-10, curr+10].forEach(n => {
                if(unsunkHits.includes(n) && !cluster.includes(n)) {
                    if (Math.abs(curr - n) === 1 && Math.floor(curr/10) !== Math.floor(n/10)) return;
                    cluster.push(n); queue.push(n);
                }
            });
        }
        let possibleMoves = [];
        let isHorLine = cluster.length > 1 && cluster.every(c => Math.floor(c/10) === Math.floor(cluster[0]/10));
        let isVerLine = cluster.length > 1 && cluster.every(c => c % 10 === cluster[0] % 10);
        if (isHorLine) {
            let min = Math.min(...cluster); let max = Math.max(...cluster);
            if (min % 10 > 0) possibleMoves.push(min - 1);
            if (max % 10 < 9) possibleMoves.push(max + 1);
        } else if (isVerLine) {
            let min = Math.min(...cluster); let max = Math.max(...cluster);
            if (min >= 10) possibleMoves.push(min - 10);
            if (max <= 89) possibleMoves.push(max + 10);
        }
        possibleMoves = possibleMoves.filter(m => availableCPUShots.includes(m));
        if (possibleMoves.length === 0) {
            cluster.forEach(c => {
                if (c >= 10) possibleMoves.push(c - 10);
                if (c <= 89) possibleMoves.push(c + 10);
                if (c % 10 > 0) possibleMoves.push(c - 1);
                if (c % 10 < 9) possibleMoves.push(c + 1);
            });
            possibleMoves = [...new Set(possibleMoves)].filter(m => availableCPUShots.includes(m));
        }
        return possibleMoves.length > 0 ? possibleMoves[Math.floor(Math.random() * possibleMoves.length)] : null;
    }

    function calculateBestMove() {
        let weights = new Array(100).fill(0);
        const cells = playerBoard.querySelectorAll('.cell');
        playerShipsAfloat.forEach(shipLen => {
            for (let i = 0; i < 100; i++) {
                if (i % 10 <= 10 - shipLen) {
                    let fit = true;
                    for (let j = 0; j < shipLen; j++) if (cells[i+j].classList.contains('miss') || cells[i+j].classList.contains('sunk')) fit = false;
                    if (fit) for (let j = 0; j < shipLen; j++) weights[i+j]++;
                }
                if (Math.floor(i / 10) <= 10 - shipLen) {
                    let fit = true;
                    for (let j = 0; j < shipLen; j++) if (cells[i+j*10].classList.contains('miss') || cells[i+j*10].classList.contains('sunk')) fit = false;
                    if (fit) for (let j = 0; j < shipLen; j++) weights[i+j*10]++;
                }
            }
        });
        let maxW = -1; let moves = [];
        availableCPUShots.forEach(i => {
            if (weights[i] > maxW) { maxW = weights[i]; moves = [i]; }
            else if (weights[i] === maxW) moves.push(i);
        });
        return moves[Math.floor(Math.random() * moves.length)];
    }

    // --- REWOLUCJA W ZAKOŃCZENIU GRY ---
    function endGame(isWin) {
        gameActive = false;
        statusText.innerText = "KONIEC BITWY";

        // 1. Natychmiastowe pokazanie statków wroga (szare duchy)
        computerShips.forEach(ship => {
            ship.coords.forEach(c => {
                const cell = computerBoard.children[c];
                if (!cell.classList.contains('hit') && !cell.classList.contains('sunk')) {
                    cell.style.backgroundColor = 'rgba(149, 165, 166, 0.6)';
                    cell.style.border = '2px dashed #ecf0f1';
                    cell.style.boxShadow = 'inset 0 0 10px rgba(0,0,0,0.5)';
                }
            });
        });

        // 2. Tworzenie Dużego Napisu na środku (bez ALERT)
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
        bigText.style.margin = '0';
        bigText.style.textShadow = '0 0 30px ' + (isWin ? '#4CAF50' : '#F44336');

        const subText = document.createElement('p');
        subText.innerText = isWin ? "Ocean należy do Ciebie." : "Twoja flota zatonęła.";
        subText.style.color = 'white';
        subText.style.fontSize = '1.5rem';
        subText.style.fontFamily = 'Arial';

        const buttons = document.createElement('div');
        buttons.style.marginTop = '40px';
        buttons.style.display = 'flex';
        buttons.style.gap = '20px';

        const btnView = document.createElement('button');
        btnView.innerText = "ZOBACZ PLANSZĘ WROGA";
        styleBtn(btnView, '#3498db');
        btnView.onclick = () => {
            screen.remove(); // Zdejmuje zasłonę
            createMiniReset(); // Dodaje mały przycisk na dole
        };

        const btnAgain = document.createElement('button');
        btnAgain.innerText = "ZAGRAJ PONOWNIE";
        styleBtn(btnAgain, '#e67e22');
        btnAgain.onclick = () => location.reload();

        buttons.appendChild(btnView);
        buttons.appendChild(btnAgain);
        screen.appendChild(bigText);
        screen.appendChild(subText);
        screen.appendChild(buttons);
        document.body.appendChild(screen);
    }

    function styleBtn(btn, color) {
        Object.assign(btn.style, {
            padding: '15px 30px', fontSize: '1.2rem', fontWeight: 'bold',
            cursor: 'pointer', border: 'none', borderRadius: '50px',
            backgroundColor: color, color: 'white', transition: '0.3s'
        });
        btn.onmouseover = () => btn.style.transform = 'scale(1.1)';
        btn.onmouseout = () => btn.style.transform = 'scale(1)';
    }

    function createMiniReset() {
        const mini = document.createElement('button');
        mini.innerText = "ZAGRAJ PONOWNIE";
        styleBtn(mini, '#e67e22');
        Object.assign(mini.style, {
            position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
            zIndex: '9999', boxShadow: '0 0 20px rgba(0,0,0,0.5)'
        });
        mini.onclick = () => location.reload();
        document.body.appendChild(mini);
    }
});
