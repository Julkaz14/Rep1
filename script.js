const playerBoard = document.getElementById('player-board');
const computerBoard = document.getElementById('computer-board');
const rotateBtn = document.getElementById('rotate-btn');
const startBattleBtn = document.getElementById('start-battle');
const statusText = document.getElementById('game-status');
const music = document.getElementById('bg-music');

let isHorizontal = true;
let currentShipIndex = 0;
const shipSizes = [4, 3, 3, 2, 2, 1, 1]; // Rozmiary statków do ustawienia
let playerShipsCoords = [];
let computerShipsCoords = [];

// Inicjalizacja gry
function startGame() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    if (document.getElementById('music-toggle').checked) music.play();
    initBoards();
}

function initBoards() {
    for (let i = 0; i < 100; i++) {
        const pCell = document.createElement('div');
        pCell.classList.add('cell');
        pCell.dataset.index = i;
        pCell.addEventListener('click', () => handlePlacement(i));
        playerBoard.appendChild(pCell);

        const cCell = document.createElement('div');
        cCell.classList.add('cell');
        cCell.dataset.index = i;
        cCell.addEventListener('click', () => playerAttack(i));
        computerBoard.appendChild(cCell);
    }
}

rotateBtn.addEventListener('click', () => isHorizontal = !isHorizontal);

// Logika rozmieszczania
function handlePlacement(startIndex) {
    if (currentShipIndex >= shipSizes.length) return;

    const size = shipSizes[currentShipIndex];
    const coords = [];
    const row = Math.floor(startIndex / 10);
    const col = startIndex % 10;

    // Sprawdzanie czy statek mieści się na planszy
    for (let i = 0; i < size; i++) {
        let nextIndex = isHorizontal ? startIndex + i : startIndex + i * 10;
        let nextRow = Math.floor(nextIndex / 10);
        let nextCol = nextIndex % 10;

        if (nextIndex >= 100 || (isHorizontal && nextRow !== row) || playerShipsCoords.flat().includes(nextIndex)) {
            alert("Nie możesz tu postawić statku!");
            return;
        }
        coords.push(nextIndex);
    }

    coords.forEach(idx => {
        playerBoard.children[idx].classList.add('ship');
    });
    playerShipsCoords.push(coords);
    currentShipIndex++;

    if (currentShipIndex === shipSizes.length) {
        rotateBtn.classList.add('hidden');
        startBattleBtn.classList.remove('hidden');
        statusText.innerText = "Flota gotowa! Ruszaj do walki!";
    }
}

// Start bitwy
startBattleBtn.addEventListener('click', () => {
    startBattleBtn.classList.add('hidden');
    computerBoard.parentElement.classList.remove('hidden-ships'); // Pokazuje planszę wroga (ale nie statki)
    statusText.innerText = "Twój ruch! Zaatakuj Wody Wroga.";
    setupComputerShips();
});

function setupComputerShips() {
    // Proste losowanie dla komputera
    shipSizes.forEach(size => {
        let placed = false;
        while (!placed) {
            let rand = Math.floor(Math.random() * 100);
            let horiz = Math.random() > 0.5;
            let tempCoords = [];
            // Tu powinna być logika sprawdzająca kolizje (uproszczona dla czytelności)
            if (!computerShipsCoords.flat().includes(rand)) {
                computerShipsCoords.push([rand]); // Uproszczenie: tylko 1-masztowce dla AI w demo
                computerBoard.children[rand].classList.add('ship');
                placed = true;
            }
        }
    });
}

function playerAttack(index) {
    if (computerBoard.children[index].classList.contains('hit') || computerBoard.children[index].classList.contains('miss')) return;

    if (computerShipsCoords.flat().includes(index)) {
        computerBoard.children[index].classList.add('hit');
        statusText.innerText = "Trafiony! Strzelaj ponownie.";
    } else {
        computerBoard.children[index].classList.add('miss');
        statusText.innerText = "Pudło! Komputer strzela...";
        setTimeout(computerAttack, 800);
    }
}

function computerAttack() {
    let rand = Math.floor(Math.random() * 100);
    while(playerBoard.children[rand].classList.contains('hit') || playerBoard.children[rand].classList.contains('miss')) {
        rand = Math.floor(Math.random() * 100);
    }

    if (playerShipsCoords.flat().includes(rand)) {
        playerBoard.children[rand].classList.add('hit');
        setTimeout(computerAttack, 800);
    } else {
        playerBoard.children[rand].classList.add('miss');
    }
}
