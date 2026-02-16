document.addEventListener('DOMContentLoaded', () => {
    const playerBoard = document.getElementById('player-board');
    const computerBoard = document.getElementById('computer-board');
    const playBtn = document.getElementById('play-btn');
    const rotateBtn = document.getElementById('rotate-btn');
    const startBattleBtn = document.getElementById('start-battle');
    const statusText = document.getElementById('status');
    const music = document.getElementById('bg-music');

    let isHorizontal = true;
    let shipsPlaced = 0;
    const shipSizes = [4, 3, 3, 2, 2, 1, 1]; // Zestaw statków
    let playerShips = [];
    let computerShips = [];
    let gameActive = false;

    // Inicjalizacja menu
    playBtn.addEventListener('click', () => {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        music.play().catch(e => console.log("Cisza na pokładzie (wymagana interakcja)"));
    });

    // Tworzenie pól
    function createGrid(container, isPlayer) {
        for (let i = 0; i < 100; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            if (isPlayer) {
                cell.addEventListener('click', () => placeShip(i));
            } else {
                cell.addEventListener('click', () => playerAttack(i));
            }
            container.appendChild(cell);
        }
    }

    rotateBtn.addEventListener('click', () => {
        isHorizontal = !isHorizontal;
        rotateBtn.innerText = `Zmień orientację (${isHorizontal ? 'Poziom' : 'Pion'})`;
    });

    function placeShip(idx) {
        if (shipsPlaced >= shipSizes.length) return;
        
        const size = shipSizes[shipsPlaced];
        const coords = [];
        const row = Math.floor(idx / 10);
        const col = idx % 10;

        for (let i = 0; i < size; i++) {
            let nextIdx = isHorizontal ? idx + i : idx + (i * 10);
            let nextRow = Math.floor(nextIdx / 10);
            
            if (nextIdx >= 100 || (isHorizontal && nextRow !== row) || playerShips.includes(nextIdx)) {
                alert("Nie zmieścisz tu statku!");
                return;
            }
            coords.push(nextIdx);
        }

        coords.forEach(c => {
            playerShips.push(c);
            playerBoard.children[c].classList.add('ship');
        });

        shipsPlaced++;
        if (shipsPlaced === shipSizes.length) {
            rotateBtn.classList.add('hidden');
            startBattleBtn.classList.remove('hidden');
            statusText.innerText = "Flota gotowa! Kliknij OGNIA!";
        }
    }

    startBattleBtn.addEventListener('click', () => {
        gameActive = true;
        startBattleBtn.classList.add('hidden');
        statusText.innerText = "BITWA! Atakuj wody wroga!";
        setupComputer();
    });

    function setupComputer() {
        while (computerShips.length < playerShips.length) {
            let rand = Math.floor(Math.random() * 100);
            if (!computerShips.includes(rand)) {
                computerShips.push(rand);
                computerBoard.children[rand].classList.add('ship');
            }
        }
    }

    function playerAttack(idx) {
        if (!gameActive || computerBoard.children[idx].classList.contains('hit') || computerBoard.children[idx].classList.contains('miss')) return;

        if (computerShips.includes(idx)) {
            computerBoard.children[idx].classList.add('hit');
            if (checkWin(computerBoard, computerShips.length)) {
                alert("ZWYCIĘSTWO! Skarby są Twoje!");
                location.reload();
            }
        } else {
            computerBoard.children[idx].classList.add('miss');
            gameActive = false; // Blokada tury gracza
            setTimeout(computerTurn, 600);
        }
    }

    function computerTurn() {
        let rand;
        do {
            rand = Math.floor(Math.random() * 100);
        } while (playerBoard.children[rand].classList.contains('hit') || playerBoard.children[rand].classList.contains('miss'));

        if (playerShips.includes(rand)) {
            playerBoard.children[rand].classList.add('hit');
            if (checkWin(playerBoard, playerShips.length)) {
                alert("KLĘSKA! Twój okręt zatonął...");
                location.reload();
            }
            setTimeout(computerTurn, 600);
        } else {
            playerBoard.children[rand].classList.add('miss');
            gameActive = true;
        }
    }

    function checkWin(board, totalShips) {
        const hits = board.querySelectorAll('.hit').length;
        return hits === totalShips;
    }

    createGrid(playerBoard, true);
    createGrid(computerBoard, false);
});
