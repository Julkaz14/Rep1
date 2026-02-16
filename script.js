const playerGrid = document.getElementById('player-board');
const computerGrid = document.getElementById('computer-board');
const startBtn = document.getElementById('start-btn');
const statusText = document.getElementById('status');

const GRID_SIZE = 10;
const SHIPS_TO_PLACE = 5; // Liczba statków 1-masztowych dla uproszczenia
let playerShips = [];
let computerShips = [];
let gameStarted = false;

// Tworzenie plansz
function createBoard(grid, type) {
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        if (type === 'player') {
            cell.addEventListener('click', () => placeShip(i));
        } else {
            cell.addEventListener('click', () => playerShoot(i));
        }
        grid.appendChild(cell);
    }
}

// Ustawianie statków gracza
function placeShip(index) {
    if (gameStarted || playerShips.length >= SHIPS_TO_PLACE) return;
    if (playerShips.includes(index)) return;

    playerShips.push(index);
    playerGrid.children[index].classList.add('ship');

    if (playerShips.length === SHIPS_TO_PLACE) {
        startBtn.disabled = false;
        statusText.innerText = "Gotowy? Kliknij Start!";
    }
}

// Losowanie statków komputera
function setupComputer() {
    while (computerShips.length < SHIPS_TO_PLACE) {
        let rand = Math.floor(Math.random() * 100);
        if (!computerShips.includes(rand)) computerShips.push(rand);
    }
}

// Strzał gracza
function playerShoot(index) {
    if (!gameStarted || computerGrid.children[index].classList.contains('hit') || 
        computerGrid.children[index].classList.contains('miss')) return;

    if (computerShips.includes(index)) {
        computerGrid.children[index].classList.add('hit');
        checkWin('player');
    } else {
        computerGrid.children[index].classList.add('miss');
        setTimeout(computerTurn, 500);
    }
}

// Strzał komputera (prosta AI)
function computerTurn() {
    let rand;
    do {
        rand = Math.floor(Math.random() * 100);
    } while (playerGrid.children[rand].classList.contains('hit') || 
             playerGrid.children[rand].classList.contains('miss'));

    if (playerShips.includes(rand)) {
        playerGrid.children[rand].classList.add('hit');
        checkWin('computer');
        setTimeout(computerTurn, 800); // Strzela ponownie po trafieniu
    } else {
        playerGrid.children[rand].classList.add('miss');
    }
}

function checkWin(winner) {
    const playerHits = [...playerGrid.children].filter(c => c.classList.contains('hit')).length;
    const computerHits = [...computerGrid.children].filter(c => c.classList.contains('hit')).length;

    if (computerHits === SHIPS_TO_PLACE) {
        alert("Wygrałeś! Flota wroga zniszczona.");
        location.reload();
    } else if (playerHits === SHIPS_TO_PLACE) {
        alert("Przegrałeś! Twoja flota zatonęła.");
        location.reload();
    }
}

startBtn.addEventListener('click', () => {
    gameStarted = true;
    startBtn.style.display = 'none';
    computerGrid.classList.remove('hidden');
    statusText.innerText = "Bitwa trwa! Strzelaj w pole przeciwnika.";
    setupComputer();
});

createBoard(playerGrid, 'player');
createBoard(computerGrid, 'computer');
