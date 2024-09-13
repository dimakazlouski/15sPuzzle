const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const GRID_SIZE = 4;
const TILE_SIZE = canvas.width / GRID_SIZE;

let image = new Image();
image.src = 'your_image.jpg'; // Replace with your image path

let tiles = [];
let emptyTile = { x: GRID_SIZE - 1, y: GRID_SIZE - 1 };
let moveCount = 0;
let touchStartX = 0;
let touchStartY = 0;

let gameCompleted = false;

image.onload = function() {
    initTiles();
    shuffleTiles();
    drawTiles();
};

function initTiles() {
    tiles = []; // Reset tiles array
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (x === GRID_SIZE - 1 && y === GRID_SIZE - 1) continue; // Skip last tile
            tiles.push({ x: x, y: y, correctX: x, correctY: y });
        }
    }
}

function shuffleTiles() {
    do {
        // Shuffle the tiles array
        for (let i = tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
        }

        // Assign shuffled positions
        let index = 0;
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (x === GRID_SIZE - 1 && y === GRID_SIZE - 1) continue; // Skip empty tile
                tiles[index].x = x;
                tiles[index].y = y;
                index++;
            }
        }
    } while (!isSolvable());
}

function isSolvable() {
    // Create a one-dimensional array of tile numbers
    const inversionArray = tiles
        .map(tile => tile.correctY * GRID_SIZE + tile.correctX + 1);

    let inversions = 0;
    for (let i = 0; i < inversionArray.length - 1; i++) {
        for (let j = i + 1; j < inversionArray.length; j++) {
            if (inversionArray[i] > inversionArray[j]) inversions++;
        }
    }

    if (GRID_SIZE % 2 === 0) {
        inversions += emptyTile.y; // Adjust for grid parity
    }

    return inversions % 2 === 0;
}

function drawTiles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    tiles.forEach(tile => {
        ctx.drawImage(
            image,
            tile.correctX * TILE_SIZE,
            tile.correctY * TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE,
            tile.x * TILE_SIZE,
            tile.y * TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE
        );
    });
}

document.addEventListener('keydown', function(event) {
    if (gameCompleted) return;
    let moved = false;
    if (event.key === 'ArrowUp') {
        moved = moveTile(emptyTile.x, emptyTile.y + 1);
    } else if (event.key === 'ArrowDown') {
        moved = moveTile(emptyTile.x, emptyTile.y - 1);
    } else if (event.key === 'ArrowLeft') {
        moved = moveTile(emptyTile.x + 1, emptyTile.y);
    } else if (event.key === 'ArrowRight') {
        moved = moveTile(emptyTile.x - 1, emptyTile.y);
    }
    if (moved) {
        moveCount++;
        document.getElementById('moveCounter').innerText = `Moves: ${moveCount}`;
        drawTiles();
        if (isCompleted()) {
            setTimeout(showCompletionMessage, 100);
        }
    }
});

// Touch input for mobile devices
canvas.addEventListener('touchstart', function(event) {
    if (gameCompleted) return;
    event.preventDefault();
    const touch = event.touches[0];
    touchStartX = touch.clientX - canvas.offsetLeft;
    touchStartY = touch.clientY - canvas.offsetTop;
}, { passive: false });

canvas.addEventListener('touchend', function(event) {
    if (gameCompleted) return;
    event.preventDefault();
    const touch = event.changedTouches[0];
    const touchEndX = touch.clientX - canvas.offsetLeft;
    const touchEndY = touch.clientY - canvas.offsetTop;

    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    let moved = false;

    // Determine swipe direction
    if (Math.max(absDx, absDy) > 30) { // Adjust the minimum swipe distance as needed
        if (absDx > absDy) {
            if (dx > 0) {
                // Swipe Right
                moved = moveTile(emptyTile.x - 1, emptyTile.y);
            } else {
                // Swipe Left
                moved = moveTile(emptyTile.x + 1, emptyTile.y);
            }
        } else {
            if (dy > 0) {
                // Swipe Down
                moved = moveTile(emptyTile.x, emptyTile.y - 1);
            } else {
                // Swipe Up
                moved = moveTile(emptyTile.x, emptyTile.y + 1);
            }
        }
    }

    if (moved) {
        moveCount++;
        document.getElementById('moveCounter').innerText = `Moves: ${moveCount}`;
        drawTiles();
        if (isCompleted()) {
            setTimeout(showCompletionMessage, 100);
        }
    }
}, { passive: false });

function moveTile(x, y) {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
    if (Math.abs(emptyTile.x - x) + Math.abs(emptyTile.y - y) === 1) {
        let tile = tiles.find(t => t.x === x && t.y === y);
        if (tile) {
            [tile.x, emptyTile.x] = [emptyTile.x, tile.x];
            [tile.y, emptyTile.y] = [emptyTile.y, tile.y];
            return true;
        }
    }
    return false;
}

function isCompleted() {
    return tiles.every(tile => tile.x === tile.correctX && tile.y === tile.correctY);
}

function showCompletionMessage() {
    gameCompleted = true;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFD700';
    ctx.font = '72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Nice Job!', canvas.width / 2, canvas.height / 2 - 50);

    // Draw buttons
    drawButton('Again', canvas.width / 2 - 100, canvas.height / 2 + 20, 80, 40, restartGame);
    drawButton('Exit', canvas.width / 2 + 20, canvas.height / 2 + 20, 80, 40, exitGame);
}

function drawButton(text, x, y, width, height, callback) {
    ctx.fillStyle = '#4682B4';
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + width / 2, y + height / 2);

    function onClick(event) {
        if (!gameCompleted) return;
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        if (clickX >= x && clickX <= x + width && clickY >= y && clickY <= y + height) {
            callback();
            canvas.removeEventListener('click', onClick);
        }
    }

    function onTouch(event) {
        if (!gameCompleted) return;
        event.preventDefault();
        const touch = event.touches[0];
        const rect = canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        if (touchX >= x && touchX <= x + width && touchY >= y && touchY <= y + height) {
            callback();
            canvas.removeEventListener('touchstart', onTouch);
        }
    }

    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchstart', onTouch, { passive: false });
}

function restartGame() {
    moveCount = 0;
    document.getElementById('moveCounter').innerText = `Moves: ${moveCount}`;
    emptyTile = { x: GRID_SIZE - 1, y: GRID_SIZE - 1 };
    gameCompleted = false;
    initTiles();
    shuffleTiles();
    drawTiles();
}

function exitGame() {
    alert('Thank you for playing!');
}
