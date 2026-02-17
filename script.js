document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTY INTERFEJSU ---
    const playerBoard = document.getElementById('player-board');
    const computerBoard = document.getElementById('computer-board');
    const shipyard = document.getElementById('shipyard');
    const startBattleBtn = document.getElementById('start-battle');
    const statusText = document.getElementById('status');
    const playBtn = document.getElementById('play-btn');

    // --- AUDIO ---
    const music = document.getElementById('bg-music');
    const sndHit = document.getElementById('snd-hit');
    const sndSink = document.getElementById('snd-sink');
    const sndMiss = document.getElementById('snd-miss');

    // --- KONFIGURACJA I STAN GRY ---
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

    // AI - Dostępne strzały
    let availableCPUShots = Array.from({length: 100}, (_, i) => i);

    // --- FUNKCJE POMOCNICZE ---
    function playSound(audioElement) {
        if(!audioElement) return;
        audioElement.volume = 0.4;
        audioElement.currentTime = 0;
        audioElement.play().catch(() => {});
    }

    // --- START GRY I INICJALIZACJA ---
    playBtn.addEventListener('click', () => {
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
        // Tworzenie siatki 10x10
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
    }

    // --- STOCZNIA I ROZMIESZCZANIE ---
    function renderShipyard() {
        shipyard.innerHTML = '';
        shipTypes.forEach((len, idx) => {
            const slot = document.createElement('div');
            slot.classList.add('ship-slot');
            slot.dataset.slotIdx = idx;

            const ship = document.createElement('div');
            ship.classList.add('ship-drag');
            ship.id = `ship-${idx}`;
            ship.dataset.len = len; 
            ship.dataset.vert = "false";
            
            // Ustawienie wymiarów (naprawia "cienkie linie")
            ship.style.width = `${len * 40}px`; 
            ship.style.height = `40px`;
            
            ship.draggable = true;
            ship.addEventListener('dragstart', () => { draggedShip = ship; });
            // Kliknięcie obraca statek
            ship.addEventListener('click', (e) => { 
                e.stopPropagation(); 
                handleShipClick(ship); 
            });

            slot.appendChild(ship);
            shipyard.appendChild(slot);
        });
    }

    function handleShipClick(ship) {
        if(gameActive) return;
        
        const shipIdx = ship.id.split('-')[1];
        const originalSlot = shipyard.querySelector(`[data-slot-idx="${shipIdx}"]`);
        
        // Jeśli statek jest już na planszy, kliknięcie go cofa do stoczni
        if(ship.parentElement !== originalSlot) {
            ship.style.position = "relative";
            ship.style.left = "0"; 
            ship.style.top = "0";
            playerShips = playerShips.filter(s => s.id !== ship.id);
            originalSlot.appendChild(ship);
            startBattleBtn.classList.add('hidden');
        } else {
            // Obracanie statku w stoczni
            const isVert = ship.dataset.vert === "true";
            const len = parseInt(ship.dataset.len);
            const nextVert = !isVert;
            ship.dataset.vert = nextVert;
            ship.style.width = nextVert ? "40px" : `${len * 40}px`;
            ship.style.height = nextVert ? `${len * 40}px` : "40px";
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
            for (let i = 0; i < len; i++) {
                coords.push(vert ? startId + i * 10 : startId + i);
            }
            // Aktualizacja pozycji statku
            playerShips = playerShips.filter(s => s.id !== draggedShip.id);
            playerShips.push({ id: draggedShip.id, coords: coords, hits: 0, len: len });
            
            draggedShip.style.position = "absolute";
            draggedShip.style.left = `${cellX * 40}px`;
            draggedShip.style.top = `${cellY * 40}px`;
            playerBoard.appendChild(draggedShip);
            
            // Pokaż przycisk startu, gdy wszystkie statki są na mapie
            if (playerShips.length === shipTypes.length) {
                startBattleBtn.classList.remove('hidden');
            }
        }
    });

    function canPlace(id, len, vert, sId, ships) {
        for (let i = 0; i < len; i++) {
            let curr = vert ? id + i * 10 : id + i;
            // Sprawdzenie granic planszy
            if (curr < 0 || curr > 99) return false;
            if (!vert && Math.floor(curr / 10) !== Math.floor(id / 10)) return false;
            // Sprawdzenie kolizji z innymi statkami
            if (ships.some(s => s.id !== sId && s.coords.includes(curr))) return false;
        }
        return true;
    }

    // --- LOGIKA BITWY ---
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
            cell.classList.add('hit'); 
            cpuHealth--;
            if (++ship.hits === ship.len) {
                playSound(sndSink);
                ship.coords.forEach(c => {
                    let targetCell = computerBoard.children[c];
                    targetCell.classList.add('sunk');
                });
            } else playSound(sndHit);
            
            if (cpuHealth <= 0) endGame(true);
        } else {
            cell.classList.add('miss'); 
            playSound(sndMiss);
            isPlayerTurn = false; 
            updateStatus();
            setTimeout(cpuAttack, 700);
        }
    }

    // --- ZAAWANSOWANE AI KOMPUTERA ---
    function cpuAttack() {
        if (!gameActive) return;

        // 1. Próbuj polować (Hunt), jeśli są trafione niezatopione pola
        let shotId = getDynamicHuntShot();
        // 2. Jeśli nie ma celu, użyj mapy prawdopodobieństwa
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
                });
                const idx = playerShipsAfloat.indexOf(ship.len);
                if (idx > -1) playerShipsAfloat.splice(idx, 1);
            } else {
                playSound(sndHit);
            }

            if (playerHealth <= 0) endGame(false);
            else setTimeout(cpuAttack, 600);
        } else {
            cell.classList.add('miss'); 
            playSound(sndMiss);
            isPlayerTurn = true; 
            updateStatus();
        }
    }

    // Algorytm polowania (szukanie wokół trafień)
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
                if(n >= 0 && n < 100 && unsunkHits.includes(n) && !cluster.includes(n)) {
                    if (Math.abs(curr - n) === 1 && Math.floor(curr/10) !== Math.floor(n/10)) return;
                    cluster.push(n); queue.push(n);
                }
            });
        }
        
        let possibleMoves = [];
        cluster.forEach(c => {
            [c-1, c+1, c-10, c+10].forEach(n => {
                if (n >= 0 && n < 100 && availableCPUShots.includes(n)) {
                    if (Math.abs(c - n) === 1 && Math.floor(c/10) !== Math.floor(n/10)) return;
                    possibleMoves.push(n);
                }
            });
        });
        return possibleMoves.length > 0 ? possibleMoves[Math.floor(Math.random() * possibleMoves.length)] : null;
    }

    // Algorytm prawdopodobieństwa (gdzie statystycznie może być statek)
    function calculateBestMove() {
        let weights = new Array(100).fill(0);
        const cells = playerBoard.querySelectorAll('.cell');
        playerShipsAfloat.forEach(shipLen => {
            for (let i = 0; i < 100; i++) {
                // Poziomo
                if (i % 10 <= 10 - shipLen) {
                    let fit = true;
                    for (let j = 0; j < shipLen; j++) if (cells[i+j].classList.contains('miss') || cells[i+j].classList.contains('sunk')) fit = false;
                    if (fit) for (let j = 0; j < shipLen; j++) weights[i+j]++;
                }
                // Pionowo
                if (Math.floor(i / 10) <= 10 - shipLen) {
                    let fit = true;
                    for (let j = 0; j < shipLen; j++) if (cells[i+j*10].classList.contains('miss') || cells[i+j*10].classList.contains('sunk')) fit = false;
                    if (fit) for (let j = 0; j < shipLen; j++) weights[i+j*10]++;
                }
            }
        });
        let maxW = -1; 
        let moves = [];
        availableCPUShots.forEach(i => {
            if (weights[i] > maxW) { maxW = weights[i]; moves = [i]; }
            else if (weights[i] === maxW) moves.push(i);
        });
        return moves[Math.floor(Math.random() * moves.length)];
    }

    // --- ZAKOŃCZENIE GRY (EKRAN KOŃCOWY) ---
    function endGame(isWin) {
        gameActive = false;
        statusText.innerText = "KONIEC BITWY";

        // Pokazanie ukrytych statków komputera
        computerShips.forEach(ship => {
            ship.coords.forEach(c => {
                const cell = computerBoard.children[c];
                if (!cell.classList.contains('hit')) {
                    cell.style.backgroundColor = 'rgba(149, 165, 166, 0.4)';
                    cell.style.border = '1px dashed #fff';
                }
            });
        });

        // Nakładka końcowa
        const screen = document.createElement('div');
        screen.id = "end-screen-overlay";
        Object.assign(screen.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', zIndex: '10000',
            fontFamily: 'Special Elite, sans-serif', color: isWin ? '#4CAF50' : '#F44336'
        });

        const bigText = document.createElement('h1');
        bigText.innerText = isWin ? "ZWYCIĘSTWO!" : "PRZEGRANA!";
        bigText.style.fontSize = '5rem';
        bigText.style.margin = '0';

        const buttons = document.createElement('div');
        buttons.style.marginTop = '40px';
        buttons.style.display = 'flex';
        buttons.style.gap = '20px';

        const btnView = document.createElement('button');
        btnView.innerText = "ZOBACZ PLANSZĘ";
        styleBtn(btnView, '#3498db');
        btnView.onclick = () => {
            screen.remove();
            createMiniReset();
        };

        const btnAgain = document.createElement('button');
        btnAgain.innerText = "ZAGRAJ PONOWNIE";
        styleBtn(btnAgain, '#e67e22');
        btnAgain.onclick = () => location.reload();

        buttons.appendChild(btnView);
        buttons.appendChild(btnAgain);
        screen.appendChild(bigText);
        screen.appendChild(buttons);
        document.body.appendChild(screen);
    }

    function styleBtn(btn, color) {
        Object.assign(btn.style, {
            padding: '15px 30px', fontSize: '1.2rem', cursor: 'pointer',
            border: 'none', borderRadius: '5px', backgroundColor: color, color: 'white'
        });
    }

    function createMiniReset() {
        const mini = document.createElement('button');
        mini.innerText = "ZAGRAJ PONOWNIE";
        styleBtn(mini, '#e67e22');
        Object.assign(mini.style, {
            position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
            zIndex: '9999'
        });
        mini.onclick = () => location.reload();
        document.body.appendChild(mini);
    }
});
