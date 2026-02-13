document.addEventListener('DOMContentLoaded', () => {
    const playerBoardContainer = document.querySelector('#player-board');
    const computerBoardContainer = document.querySelector('#computer-board');
    const messageDisplay = document.querySelector('#message');
    const startBtn = document.querySelector('#start-game-btn');
    const rotateBtn = document.querySelector('#rotate-btn');
    const setupPanel = document.querySelector('#setup-panel');
    const shipsInDock = document.querySelectorAll('.ship-preview');

    const width = 10;
    const playerCells = [];
    const computerCells = [];
    let isGameOver = false;
    let currentPlayer = 'user';
    let gameStarted = false;

    // Zmienne do rozkładania statków
    let isHorizontal = true;
    let selectedShip = null;
    let shipsPlacedCount = 0;

    const shipArray = [
        { name: 'destroyer', size: 2 },
        { name: 'submarine', size: 3 },
        { name: 'cruiser', size: 3 },
        { name: 'battleship', size: 4 },
        { name: 'carrier', size: 5 }
    ];

    // 1. Tworzenie plansz
    function createBoard(container, cells) {
        for (let i = 0; i < width * width; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.id = i;
            container.appendChild(cell);
            cells.push(cell);
        }
    }
    createBoard(playerBoardContainer, playerCells);
    createBoard(computerBoardContainer, computerCells);

    // 2. Obsługa przycisku obracania
    rotateBtn.addEventListener('click', () => {
        isHorizontal = !isHorizontal;
        rotateBtn.innerText = isHorizontal ? 'Orientacja: Poziomo (Kliknij, aby zmienić)' : 'Orientacja: Pionowo (Kliknij, aby zmienić)';
        shipsInDock.forEach(ship => ship.classList.toggle('vertical', !isHorizontal));
    });

    // 3. Wybieranie statku z doku
    shipsInDock.forEach(ship => {
        ship.addEventListener('click', () => {
            if (gameStarted) return;
            // Odznacz inne statki
            shipsInDock.forEach(s => s.style.borderColor = 'transparent');
            
            selectedShip = {
                element: ship,
                size: parseInt(ship.dataset.size),
                name: ship.dataset.name
            };
            
            ship.style.borderColor = '#FFDC00'; // Podświetl na żółto
            messageDisplay.innerText = `Wybrano statek (długość: ${selectedShip.size}). Kliknij na swoją planszę!`;
        });
    });

    // 4. Stawianie statku na planszy (Kliknięcie)
    playerCells.forEach(cell => {
        cell.addEventListener('click', (e) => {
            if (gameStarted || !selectedShip) return;

            let startIndex = parseInt(e.target.dataset.id);
            let validPlacement = true;
            let cellsToColor = [];

            // Sprawdzanie czy statek się mieści i czy miejsce jest puste
            for (let i = 0; i < selectedShip.size; i++) {
                let currentIndex;
                
                if (isHorizontal) {
                    currentIndex = startIndex + i;
                    // Czy wychodzi poza prawą krawędź
                    if (Math.floor(startIndex / width) !== Math.floor(currentIndex / width)) validPlacement = false;
                } else {
                    currentIndex = startIndex + (i * width);
                    // Czy wychodzi poza dolną krawędź
                    if (currentIndex >= width * width) validPlacement = false;
                }

                if (validPlacement) {
                    // Czy miejsce nie jest już zajęte przez inny statek
                    if (playerCells[currentIndex].classList.contains('ship')) {
                        validPlacement = false;
                    } else {
                        cellsToColor.push(playerCells[currentIndex]);
                    }
                }
            }

            if (validPlacement) {
                // Rysuj statek
                cellsToColor.forEach(c => c.classList.add('ship'));
                
                // Ukryj wykorzystany statek z doku
                selectedShip.element.style.display = 'none';
                selectedShip = null;
                shipsPlacedCount++;
                messageDisplay.innerText = "Statek ustawiony! Wybierz kolejny z panelu.";

                // Jeśli postawiono wszystkie 5
                if (shipsPlacedCount === 5) {
                    messageDisplay.innerText = "Flota gotowa! Kliknij przycisk 'ROZPOCZNIJ BITWĘ'.";
                    setupPanel.style.display = 'none'; // Ukryj panel setupu
                    startBtn.style.display = 'inline-block'; // Pokaż przycisk startu
                }
            } else {
                messageDisplay.innerText = "Błąd: Statek nie mieści się w tym miejscu lub nachodzi na inny!";
            }
        });
    });

    // 5. Losowanie statków dla komputera (ukryte dzięki CSS)
    function generateComputerShips(ship) {
        let randomDirection = Math.floor(Math.random() * 2);
        let direction = (randomDirection === 0) ? 1 : width;
        let randomStart = Math.abs(Math.floor(Math.random() * computerCells.length - (ship.size * direction)));

        const isTaken = Array.from({length: ship.size}, (_, i) => randomStart + i * direction).some(index => computerCells[index].classList.contains('ship'));
        const isAtRightEdge = randomDirection === 0 && Array.from({length: ship.size}, (_, i) => randomStart + i).some(index => index % width === width - 1);
        const isAtLeftEdge = randomDirection === 0 && Array.from({length: ship.size}, (_, i) => randomStart + i).some(index => index % width === 0);

        if (!isTaken && !isAtRightEdge && !isAtLeftEdge) {
            for (let i = 0; i < ship.size; i++) {
                computerCells[randomStart + i * direction].classList.add('ship');
            }
        } else {
            generateComputerShips(ship); // Spróbuj ponownie
        }
    }

    // 6. Przycisk "Rozpocznij grę"
    startBtn.addEventListener('click', () => {
        gameStarted = true;
        shipArray.forEach(ship => generateComputerShips(ship)); // Losuj dla AI
        startBtn.style.display = 'none';
        messageDisplay.innerText = "Bitwa rozpoczęta! Wybierz pole na planszy komputera, aby strzelić.";
    });

    // 7. Logika strzelania w trakcie gry
    computerCells.forEach(cell => cell.addEventListener('click', (e) => {
        if (isGameOver || currentPlayer !== 'user' || !gameStarted) return;
        const c = e.target;
        
        // Zabezpieczenie przed strzelaniem w to samo pole
        if (c.classList.contains('hit') || c.classList.contains('miss')) return;

        if (c.classList.contains('ship')) {
            c.classList.add('hit');
            messageDisplay.innerText = "TRAFIONY! Masz kolejny ruch.";
        } else {
            c.classList.add('miss');
            messageDisplay.innerText = "Pudło! Kolej komputera...";
            currentPlayer = 'computer';
            setTimeout(computerTurn, 1000); // Komputer "myśli" 1 sekundę
        }
        checkGameOver();
    }));

    // AI komputera
    function computerTurn() {
        if (isGameOver) return;
        let random = Math.floor(Math.random() * playerCells.length);
        
        if (!playerCells[random].classList.contains('hit') && !playerCells[random].classList.contains('miss')) {
            if (playerCells[random].classList.contains('ship')) {
                playerCells[random].classList.add('hit');
                messageDisplay.innerText = "Komputer trafił Twój statek! Strzela ponownie...";
                setTimeout(computerTurn, 1000);
            } else {
                playerCells[random].classList.add('miss');
                messageDisplay.innerText = "Komputer spudłował! Twój ruch.";
                currentPlayer = 'user';
            }
        } else {
            computerTurn(); // Zlosuj pole jeszcze raz, jeśli w to już strzelał
        }
        checkGameOver();
    }

    function checkGameOver() {
        const playerHits = playerCells.filter(cell => cell.classList.contains('hit')).length;
        const computerHits = computerCells.filter(cell => cell.classList.contains('hit')).length;
        // Obliczamy łączną ilość kratek zajmowanych przez statki (17)
        const totalShipCells = shipArray.reduce((acc, ship) => acc + ship.size, 0);

        if (playerHits === totalShipCells) {
            messageDisplay.innerText = "GRATULACJE! Wygrałeś bitwę! Odśwież stronę (F5), aby zagrać ponownie.";
            isGameOver = true;
        } else if (computerHits === totalShipCells) {
            messageDisplay.innerText = "PRZEGRAŁEŚ! Komputer zatopił całą Twoją flotę. Odśwież stronę (F5), aby zagrać ponownie.";
            isGameOver = true;
        }
    }
});
