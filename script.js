document.addEventListener('DOMContentLoaded', () => {
    const playerBoard = document.getElementById('player-board');
    const computerBoard = document.getElementById('computer-board');
    const playBtn = document.getElementById('play-btn');
    const rotateBtn = document.getElementById('rotate-btn');
    const startBattleBtn = document.getElementById('start-battle');
    const enemySection = document.getElementById('enemy-section');
    const statusText = document.getElementById('status');
    const music = document.getElementById('bg-music');

    let isHorizontal = true;
    let shipsPlaced = 0;
    const shipSizes = [4, 3, 3, 2, 2, 1, 1];
    let playerShips = [];
    let computerShips = [];
    let gameActive = false;

    // Start gry i muzyki
    playBtn.addEventListener('click', () => {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        music.volume = 0.2;
        music.play();
        initGrids();
    });

    function initGrids() {
        for (let i = 0; i < 100; i++) {
            const pCell = document.createElement('div');
            pCell.classList.add('cell');
            pCell.addEventListener('click', () => placeShip(i));
            playerBoard.appendChild(pCell);

            const cCell = document.createElement('div');
            cCell.classList.add('cell');
            cCell.addEventListener('click', () => playerAttack(i));
            computerBoard.appendChild(cCell);
        }
    }

    rotateBtn.addEventListener('click', () => {
        isHorizontal = !isHorizontal;
        rotateBtn.innerText = `Obróć (${isHorizontal ? 'Poziom' : 'Pion'})`;
    });

    function placeShip(idx) {
        if (shipsPlaced >= shipSizes.length) return;
        const size = shipSizes[shipsPlaced];
        const coords = [];
        const row = Math.floor(idx / 10);

        for (let i = 0; i < size; i++) {
            let nextIdx = isHorizontal ? idx + i : idx + (i * 10);
            if (nextIdx >= 100 || (isHorizontal && Math.floor(nextIdx / 10) !== row) || playerShips.includes(nextIdx)) {
                return; // Nieprawidłowe miejsce
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
            statusText.innerText = "Flota gotowa! Otwórz ogień!";
        }
    }

    startBattleBtn.addEventListener('click', () => {
        gameActive = true;
        startBattleBtn.classList.add('hidden');
        enemySection.classList.remove('hidden'); // POKAZUJE MAPĘ WROGA
        statusText.innerText = "Atakuj wody przeciwnika!";
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
            if (document.querySelectorAll('#computer-board .hit').length === computerShips.length) {
                alert("ZWYCIĘSTWO! Zatopiliśmy ich!");
                location.reload();
            }
        } else {
            computerBoard.children[idx].classList.add('miss');
            gameActive = false;
            setTimeout(computerAttack, 600);
        }
    }

    function computerAttack() {
        let rand;
        do { rand = Math.floor(Math.random() * 100); } 
        while (playerBoard.children[rand].classList.contains('hit') || playerBoard.children[rand].classList.contains('miss'));

        if (playerShips.includes(rand)) {
            playerBoard.children[rand].classList.add('hit');
            if (document.querySelectorAll('#player-board .hit').length === playerShips.length) {
                alert("KLĘSKA! Nasza flota zatonęła...");
                location.reload();
            }
            setTimeout(computerAttack, 600);
        } else {
            playerBoard.children[rand].classList.add('miss');
            gameActive = true;
        }
    }
});
