document.addEventListener('DOMContentLoaded', () => {
    const playerBoardContainer = document.querySelector('#player-board');
    const computerBoardContainer = document.querySelector('#computer-board');
    const messageDisplay = document.querySelector('#message');
    const startBtn = document.querySelector('#start-game-btn');

    const width = 10;
    const playerCells = [];
    const computerCells = [];
    let isGameOver = false;
    let currentPlayer = 'user';

    // Konfiguracja statków (nazwa i długość)
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

    // 2. Losowe rozmieszczanie statków
    function generate(boardCells, ship) {
        let randomDirection = Math.floor(Math.random() * 2); // 0 - poziomo, 1 - pionowo
        let current = boardCells;
        let direction = (randomDirection === 0) ? 1 : width;
        let randomStart = Math.abs(Math.floor(Math.random() * boardCells.length - (ship.size * direction)));

        const isTaken = Array.from({length: ship.size}, (_, i) => randomStart + i * direction)
                            .some(index => boardCells[index].classList.contains('ship'));
        
        const isAtRightEdge = randomDirection === 0 && Array.from({length: ship.size}, (_, i) => randomStart + i)
                                                        .some(index => index % width === width - 1);
        const isAtLeftEdge = randomDirection === 0 && Array.from({length: ship.size}, (_, i) => randomStart + i)
                                                        .some(index => index % width === 0);

        if (!isTaken && !isAtRightEdge && !isAtLeftEdge) {
            for (let i = 0; i < ship.size; i++) {
                boardCells[randomStart + i * direction].classList.add('ship');
            }
        } else {
            generate(boardCells, ship); // Próbuj ponownie, jeśli miejsce zajęte
        }
    }

    // Rozmieść statki dla obu stron
    shipArray.forEach(ship => generate(playerCells, ship));
    shipArray.forEach(ship => generate(computerCells, ship));

    // 3. Logika strzału gracza
    function handlePlayerClick(e) {
        if (isGameOver || currentPlayer !== 'user') return;
        const cell = e.target;
        if (cell.classList.contains('hit') || cell.classList.contains('miss')) return;

        if (cell.classList.contains('ship')) {
            cell.classList.add('hit');
            messageDisplay.innerText = "TRAFIONY! Strzelaj dalej!";
        } else {
            cell.classList.add('miss');
            messageDisplay.innerText = "Pudło! Kolej komputera.";
            currentPlayer = 'computer';
            setTimeout(computerTurn, 800);
        }
        checkGameOver();
    }

    // 4. Logika strzału komputera (Proste AI)
    function computerTurn() {
        if (isGameOver) return;
        let random = Math.floor(Math.random() * playerCells.length);
        
        if (!playerCells[random].classList.contains('hit') && !playerCells[random].classList.contains('miss')) {
            if (playerCells[random].classList.contains('ship')) {
                playerCells[random].classList.add('hit');
                messageDisplay.innerText = "Komputer trafił! Strzela znowu.";
                setTimeout(computerTurn, 800);
            } else {
                playerCells[random].classList.add('miss');
                messageDisplay.innerText = "Twoja kolej!";
                currentPlayer = 'user';
            }
        } else {
            computerTurn();
        }
        checkGameOver();
    }

    // 5. Sprawdzanie końca gry
    function checkGameOver() {
        const playerHits = playerCells.filter(cell => cell.classList.contains('hit')).length;
        const computerHits = computerCells.filter(cell => cell.classList.contains('hit')).length;
        const totalShipCells = shipArray.reduce((acc, ship) => acc + ship.size, 0);

        if (playerHits === totalShipCells) {
            messageDisplay.innerText = "GRATULACJE! WYGRAŁEŚ!";
            isGameOver = true;
        }
        if (computerHits === totalShipCells) {
            messageDisplay.innerText = "PRZEGRAŁEŚ! Komputer zatopił Twoją flotę.";
            isGameOver = true;
        }
    }

    // Event Listeners
    computerCells.forEach(cell => cell.addEventListener('click', handlePlayerClick));
    startBtn.addEventListener('click', () => location.reload());
});
