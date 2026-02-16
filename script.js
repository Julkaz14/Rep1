document.addEventListener('DOMContentLoaded', () => {
    const playerBoard = document.getElementById('player-board');
    const computerBoard = document.getElementById('computer-board');
    const shipyard = document.getElementById('shipyard');
    const startBattleBtn = document.getElementById('start-battle');
    const statusText = document.getElementById('status');
    const music = document.getElementById('bg-music');

    // Wymagane statki: 1x5, 1x4, 2x3, 2x2
    const shipsToPlace = [
        { id: 'ship-5', length: 5 },
        { id: 'ship-4', length: 4 },
        { id: 'ship-3a', length: 3 },
        { id: 'ship-3b', length: 3 },
        { id: 'ship-2a', length: 2 },
        { id: 'ship-2b', length: 2 }
    ];

    let draggedShip = null;
    let draggedShipLength = 0;
    let isVertical = false;
    let playerShipsCoords = []; // Przechowuje zajęte kratki [ {id, coords: []} ]
    let computerShipsCoords = [];
    let gameActive = false;

    // START GRY (Menu)
    document.getElementById('play-btn').addEventListener('click', () => {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        music.volume = 0.2;
        music.play().catch(()=>console.log("Muzyka zablokowana przez auto-play"));
        initBoards();
        generateShipsInShipyard();
    });

    // TWORZENIE PLANSZ (10x10)
    function initBoards() {
        for (let i = 0; i < 100; i++) {
            // Komórki gracza (do upuszczania statków)
            const pCell = document.createElement('div');
            pCell.classList.add('cell');
            pCell.dataset.id = i;
            playerBoard.appendChild(pCell);

            // Komórki komputera (do strzelania)
            const cCell = document.createElement('div');
            cCell.classList.add('cell');
            cCell.dataset.id = i;
            cCell.addEventListener('click', () => attackComputer(i, cCell));
            computerBoard.appendChild(cCell);
        }
    }

    // TWORZENIE STATKÓW W STOCZNI
    function generateShipsInShipyard() {
        shipsToPlace.forEach(ship => {
            const shipDiv = document.createElement('div');
            shipDiv.classList.add('ship-drag');
            shipDiv.id = ship.id;
            shipDiv.draggable = true;
            shipDiv.dataset.length = ship.length;
            shipDiv.dataset.vertical = "false";

            // Dodanie wizualnych "kratek" do statku
            for(let i=0; i < ship.length; i++) {
                const part = document.createElement('div');
                part.classList.add('ship-part');
                shipDiv.appendChild(part);
            }

            // Obracanie po kliknięciu
            shipDiv.addEventListener('click', (e) => rotateShip(e, shipDiv));

            // Zdarzenia przeciągania
            shipDiv.addEventListener('dragstart', dragStart);
            shipDiv.addEventListener('dragend', dragEnd);

            shipyard.appendChild(shipDiv);
        });
    }

    // --- LOGIKA PRZECIĄGANIA ---
    function dragStart(e) {
        draggedShip = e.target;
        draggedShipLength = parseInt(draggedShip.dataset.length);
        isVertical = draggedShip.dataset.vertical === "true";
        setTimeout(() => draggedShip.style.display = "none", 0);
    }

    function dragEnd() {
        draggedShip.style.display = "flex";
        draggedShip = null;
    }

    // Pozwala na rzucenie statku na planszę
    playerBoard.addEventListener('dragover', e => e.preventDefault());

    // Upuszczanie statku na mapę
    playerBoard.addEventListener('drop', e => {
        e.preventDefault();
        if(!draggedShip || !e.target.classList.contains('cell')) return;

        const startId = parseInt(e.target.dataset.id);
        const row = Math.floor(startId / 10);
        let currentCoords = [];

        // Sprawdzanie czy statek się mieści i nie nakłada
        for(let i=0; i < draggedShipLength; i++) {
            let nextId = isVertical ? startId + (i * 10) : startId + i;
            let nextRow = Math.floor(nextId / 10);
            
            // Kolizja z ramką
            if(nextId > 99 || (!isVertical && nextRow !== row)) {
                return; // Nie mieści się
            }
            
            // Kolizja z innym statkiem (ignorujemy statek który właśnie przenosimy)
            const isOccupied = playerShipsCoords.some(s => s.id !== draggedShip.id && s.coords.includes(nextId));
            if(isOccupied) return;

            currentCoords.push(nextId);
        }

        // Aktualizacja danych pozycji
        playerShipsCoords = playerShipsCoords.filter(s => s.id !== draggedShip.id); // usuń stare kordy
        playerShipsCoords.push({ id: draggedShip.id, coords: currentCoords });

        // Fizyczne przeniesienie DOM (absolute na planszy)
        draggedShip.style.position = "absolute";
        draggedShip.style.left = `${(startId % 10) * 40}px`;
        draggedShip.style.top = `${Math.floor(startId / 10) * 40}px`;
        playerBoard.appendChild(draggedShip);

        checkAllShipsPlaced();
    });

    // Powrót statku do stoczni
    shipyard.addEventListener('dragover', e => e.preventDefault());
    shipyard.addEventListener('drop', e => {
        if(draggedShip) {
            draggedShip.style.position = "static";
            shipyard.appendChild(draggedShip);
            playerShipsCoords = playerShipsCoords.filter(s => s.id !== draggedShip.id);
            checkAllShipsPlaced();
        }
    });

    function rotateShip(e, shipDiv) {
        if(gameActive) return; // Zablokuj obrót w trakcie gry
        const isVert = shipDiv.dataset.vertical === "true";
        shipDiv.dataset.vertical = !isVert;
        shipDiv.classList.toggle('vertical');

        // Jeśli statek jest na planszy i po obrocie wychodzi za mapę - wróć do stoczni
        if(shipDiv.parentNode === playerBoard) {
            const startId = playerShipsCoords.find(s => s.id === shipDiv.id).coords[0];
            const length = parseInt(shipDiv.dataset.length);
            const row = Math.floor(startId / 10);
            const verticalNow = shipDiv.dataset.vertical === "true";
            let fits = true;

            for(let i=0; i<length; i++) {
                let next = verticalNow ? startId + (i*10) : startId + i;
                if(next > 99 || (!verticalNow && Math.floor(next/10) !== row)) fits = false;
            }

            if(!fits) {
                alert("Obrót niemożliwy - brak miejsca! Statek wraca do stoczni.");
                shipDiv.style.position = "static";
                shipyard.appendChild(shipDiv);
                playerShipsCoords = playerShipsCoords.filter(s => s.id !== shipDiv.id);
            } else {
                // Aktualizuj kordy po obrocie
                let newCoords = [];
                for(let i=0; i<length; i++) newCoords.push(verticalNow ? startId + (i*10) : startId + i);
                playerShipsCoords.find(s => s.id === shipDiv.id).coords = newCoords;
            }
        }
        checkAllShipsPlaced();
    }

    function checkAllShipsPlaced() {
        if(playerShipsCoords.length === shipsToPlace.length) {
            startBattleBtn.classList.remove('hidden');
        } else {
            startBattleBtn.classList.add('hidden');
        }
    }

    // --- START BITWY ---
    startBattleBtn.addEventListener('click', () => {
        gameActive = true;
        document.getElementById('shipyard-section').classList.add('hidden');
        document.getElementById('enemy-section').classList.remove('hidden');
        startBattleBtn.classList.add('hidden');
        statusText.innerText = "BITWA! Atakuj planszę wroga!";
        
        // Wyłącz przeciąganie statków gracza
        document.querySelectorAll('.ship-drag').forEach(s => s.draggable = false);
        
        setupComputerShips();
    });

    function setupComputerShips() {
        shipsToPlace.forEach(ship => {
            let placed = false;
            while(!placed) {
                let start = Math.floor(Math.random() * 100);
                let isVert = Math.random() > 0.5;
                let currentCoords = [];
                let row = Math.floor(start / 10);
                let fits = true;

                for(let i=0; i < ship.length; i++) {
                    let next = isVert ? start + (i * 10) : start + i;
                    if(next > 99 || (!isVert && Math.floor(next / 10) !== row)) fits = false;
                    const isOccupied = computerShipsCoords.some(s => s.coords.includes(next));
                    if(isOccupied) fits = false;
                    if(fits) currentCoords.push(next);
                }

                if(fits) {
                    computerShipsCoords.push({ id: `cpu-${ship.id}`, coords: currentCoords });
                    placed = true;
                }
            }
        });
    }

    // --- LOGIKA STRZAŁÓW ---
    function attackComputer(id, cellElement) {
        if(!gameActive || cellElement.classList.contains('hit') || cellElement.classList.contains('miss')) return;

        let hitShip = computerShipsCoords.find(s => s.coords.includes(id));

        if(hitShip) {
            cellElement.classList.add('hit');
            statusText.innerText = "Trafienie! Strzelaj dalej!";
            checkWin();
        } else {
            cellElement.classList.add('miss');
            statusText.innerText = "Pudło! Strzela wróg...";
            gameActive = false; // blokada na czas tury AI
            setTimeout(computerTurn, 800);
        }
    }

    function computerTurn() {
        let rand;
        let cCell;
        do {
            rand = Math.floor(Math.random() * 100);
            cCell = playerBoard.children[rand];
        } while(cCell.classList.contains('hit') || cCell.classList.contains('miss'));

        let hitShip = playerShipsCoords.find(s => s.coords.includes(rand));

        if(hitShip) {
            cCell.classList.add('hit');
            statusText.innerText = "Oberwaliśmy! Wróg celuje ponownie...";
            checkWin();
            if(gameActive) setTimeout(computerTurn, 800);
        } else {
            cCell.classList.add('miss');
            statusText.innerText = "Wróg spudłował. Twój ruch Kapitanie!";
            gameActive = true;
        }
    }

    function checkWin() {
        const totalShipCells = shipsToPlace.reduce((sum, s) => sum + s.length, 0);
        const playerHits = document.querySelectorAll('#computer-board .hit').length;
        const cpuHits = document.querySelectorAll('#player-board .hit').length;

        if(playerHits === totalShipCells) {
            alert("WYGRANA! Zatopiliśmy wrogą flotę!");
            location.reload();
        } else if(cpuHits === totalShipCells) {
            alert("PRZEGRANA! Nasze statki spoczywają na dnie...");
            location.reload();
        }
    }
});
