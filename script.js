document.addEventListener('DOMContentLoaded', () => {
    console.log("Skrypt załadowany poprawnie!");

    const playBtn = document.getElementById('play-btn');
    const playerBoard = document.getElementById('player-board');
    const computerBoard = document.getElementById('computer-board');
    const music = document.getElementById('bg-music');

    // Funkcja tworząca planszę
    function createGrid(container) {
        for (let i = 0; i < 100; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            container.appendChild(cell);
        }
    }

    // Start gry
    if(playBtn) {
        playBtn.addEventListener('click', () => {
            console.log("Kliknięto przycisk START");
            document.getElementById('main-menu').classList.add('hidden');
            document.getElementById('game-ui').classList.remove('hidden');
            createGrid(playerBoard);
            createGrid(computerBoard);
            if(music) music.play().catch(() => console.log("Muzyka zablokowana przez przeglądarkę"));
        });
    } else {
        console.error("Nie znaleziono przycisku play-btn!");
    }
});
