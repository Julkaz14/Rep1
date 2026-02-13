document.addEventListener('DOMContentLoaded', () => {
    const playerBoardElement = document.getElementById('player-board');
    const computerBoardElement = document.getElementById('computer-board');
    const startGameBtn = document.getElementById('start-game-btn');
    const messageDisplay = document.getElementById('message');

    const BOARD_SIZE = 10;
    const SHIPS = [
        { name: 'carrier', size: 5 },
        { name: 'battleship', size: 4 },
        { name: 'destroyer', size: 3 },
        { name: 'submarine', size: 3 },
        { name: 'patrol boat', size: 2 }
    ];

    let playerBoard = [];
    let computerBoard = [];
    let playerShipsPlaced = 0; // Licznik zatopionych statków komputera
    let computerShipsPlaced = 0; // Licznik zatopionych statków gracza

    let isGameOver = false;
    let currentPlayer = 'player'; // Kto strzela

    // --- Inicjalizacja Plansz ---
    function createBoard(boardElement, boardArray, isPlayerBoard) {
        for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.id = i;
            boardElement.appendChild(cell);
            boardArray.push({
                isShip: false,
                isHit: false,
                isMiss: false
            });

            if (!isPlayerBoard) { // Komputer strzela w planszę gracza, gracz w planszę komputera
                cell.addEventListener('click', () => playerShoot(i));
            }
        }
    }

    createBoard(playerBoardElement, playerBoard, true);
    createBoard(computerBoardElement, computerBoard, false);

    // --- Rozmieszczanie Statków ---
    function placeShip(board, ship) {
        let placed = false;
        while (!placed) {
            let orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
            let startPos;
            if (orientation === 'horizontal') {
                startPos = Math.floor(Math.random() * BOARD_SIZE * BOARD_SIZE - ship.size);
            } else {
                startPos = Math.floor(Math.random() * (BOARD_SIZE * BOARD_SIZE - BOARD_SIZE * ship.size));
            }

            let valid = true;
            let shipCoords = [];

            for (let i = 0; i < ship.size; i++) {
                let coord;
                if (orientation === 'horizontal') {
                    coord = startPos + i;
                    // Sprawdzenie czy statek nie wychodzi poza wiersz
                    if (Math.floor(startPos / BOARD_SIZE) !== Math.floor(coord / BOARD_SIZE)) {
                        valid = false;
                        break;
                    }
                } else {
                    coord = startPos + (i * BOARD_SIZE);
                }

                // Sprawdzenie czy nie wychodzi poza planszę i nie koliduje z innym statkiem
                if (coord < 0 || coord >= BOARD_SIZE * BOARD_SIZE || board[coord].isShip) {
                    valid = false;
                    break;
                }
                // Sprawdzenie otoczenia (na razie uproszczone, bez sprawdzania po przekątnych)
                if (checkSurroundings(board, coord, orientation)) {
                    valid = false;
                    break;
                }
                shipCoords.push(coord);
            }

            if (valid) {
                shipCoords.forEach(coord => {
                    board[coord].isShip = true;
                });
                placed = true;
            }
        }
    }

    // Uproszczone sprawdzanie otoczenia statku
    function checkSurroundings(board, coord, orientation) {
        // Na potrzeby demo, bardzo uproszczone. W pełnej grze to byłoby bardziej złożone.
        const adjacent = [coord - 1, coord + 1, coord - BOARD_SIZE, coord + BOARD_SIZE];
        for (let adj of adjacent) {
            if (adj >= 0 && adj < BOARD_SIZE * BOARD_SIZE && board[adj].isShip) {
                return true;
            }
        }
        return false;
    }


    // --- Wyświetlanie statków gracza ---
    function showPlayerShips() {
        playerBoard.forEach((cell, index) => {
            if (cell.isShip) {
                playerBoardElement.children[index].classList.add('ship');
            }
        });
    }

    // --- Rozstawianie wszystkich statków ---
    function setupGame() {
        SHIPS.forEach(ship => {
            placeShip(playerBoard, ship);
            placeShip(computerBoard, ship);
        });
        showPlayerShips();
        messageDisplay.textContent = 'Rozmieściłeś statki. Kliknij "Rozpocznij Grę"!';
    }

    // --- Logika strzału gracza ---
    function playerShoot(index) {
        if (isGameOver || currentPlayer !== 'player' || computerBoard[index].isHit || computerBoard[index].isMiss) {
            return;
        }

        if (computerBoard[index].isShip) {
            computerBoardElement.children[index].classList.add('hit');
            computerBoard[index].isHit = true;
            messageDisplay.textContent = 'Trafiony!';
            playerShipsPlaced++;
        } else {
            computerBoardElement.children[index].classList.add('miss');
            computerBoard[index].isMiss = true;
            messageDisplay.textContent = 'Pudło!';
        }

        checkWinCondition();
        if (!isGameOver) {
            currentPlayer = 'computer';
            setTimeout(computerShoot, 1000); // Komputer strzela po 1 sekundzie
        }
    }

    // --- Logika strzału komputera (bardzo proste AI) ---
    function computerShoot() {
        let shotIndex;
        let validShot = false;

        while (!validShot) {
            shotIndex = Math.floor(Math.random() * BOARD_SIZE * BOARD_SIZE);
            if (!playerBoard[shotIndex].isHit && !playerBoard[shotIndex].isMiss) {
                validShot = true;
            }
        }

        if (playerBoard[shotIndex].isShip) {
            playerBoardElement.children[shotIndex].classList.add('hit');
            playerBoard[shotIndex].isHit = true;
            messageDisplay.textContent = 'Komputer trafił twój statek!';
            computerShipsPlaced++;
        } else {
            playerBoardElement.children[shotIndex].classList.add('miss');
            playerBoard[shotIndex].isMiss = true;
            messageDisplay.textContent = 'Komputer spudłował!';
        }

        checkWinCondition();
        if (!isGameOver) {
            currentPlayer = 'player';
        }
    }

    // --- Sprawdzanie warunku zwycięstwa ---
    function checkWinCondition() {
        const totalPlayerShipCells = SHIPS.reduce((sum, ship) => sum + ship.size, 0);

        if (playerShipsPlaced >= totalPlayerShipCells) {
            messageDisplay.textContent = 'Zwycięstwo! Zatopiles wszystkie statki komputera!';
            isGameOver = true;
        } else if (computerShipsPlaced >= totalPlayerShipCells) {
            messageDisplay.textContent = 'Porażka! Komputer zatopil wszystkie Twoje statki!';
            isGameOver = true;
        }
    }

    // --- Obsługa przycisku Start Gry ---
    startGameBtn.addEventListener('click', () => {
        if (isGameOver) {
            // Resetuj grę, jeśli była zakończona
            location.reload();
        } else if (playerShipsPlaced === 0 && computerShipsPlaced === 0) { // Upewnij się, że statki są rozmieszczone
             messageDisplay.textContent = 'Gra rozpoczęta! Twój ruch.';
             startGameBtn.textContent = 'Resetuj Grę';
             // Możesz tu wyłączyć klikanie na swoją planszę, aby nie przestawiać statków
        }
    });

    // --- Inicjalizacja na start ---
    setupGame();
    messageDisplay.textContent = 'Rozmieść statki (losowo). Kliknij "Rozpocznij Grę".'; // Initial message
});
