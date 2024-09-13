const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const GRID_SIZE = 4;
const TILE_SIZE = canvas.width / GRID_SIZE;

let image = new Image();
image.src = 'duck.jpg'; 

image.onload = function() {
    initTiles();
    shuffleTiles();
    drawTiles();
};

let tiles = [];
let emptyTile = { x: GRID_SIZE - 1, y: GRID_SIZE - 1 };
let moveCount = 0;

function initTiles() {
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (x === GRID_SIZE - 1 && y === GRID_SIZE - 1) continue; // Skip last tile
            tiles.push({ x: x, y: y, correctX: x, correctY: y });
        }
    }
}

function shuffleTiles() {
    // Implement a shuffle that ensures the puzzle is solvable
    do {
        tiles.sort(() => Math.random() - 0.5);
    } while (!isSolvable());
}

function isSolvable() {
    // Calculate inversions to determine if the puzzle is solvable
    let inversions = 0;
    for (let i = 0; i < tiles.length; i++) {
        for (let j = i + 1; j < tiles.length; j++) {
            if (tiles[i].y * GRID_SIZE + tiles[i].x > tiles[j].y * GRID_SIZE + tiles[j].x) {
                inversions++;
            }
        }
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

function moveTile(x, y) {
    let tile = tiles.find(t => t.x === x && t.y === y);
    if (tile) {
        [tile.x, emptyTile.x] = [emptyTile.x, tile.x];
        [tile.y, emptyTile.y] = [emptyTile.y, tile.y];
        return true;
    }
    return false;
}

function isCompleted() {
    return tiles.every(tile => tile.x === tile.correctX && tile.y === tile.correctY);
}

function showCompletionMessage() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFD700';
    ctx.font = '72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Nice Job!', canvas.width / 2, canvas.height / 2 - 50);

    // Draw buttons (simple rectangles with text)
    drawButton('Again', canvas.width / 2 - 100, canvas.height / 2 + 20, 80, 40, restartGame);
    drawButton('Exit', canvas.width / 2 + 20, canvas.height / 2 + 20, 80, 40, exitGame);
}

function drawButton(text, x, y, width, height, callback) {
    ctx.fillStyle = '#4682B4';
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.fillText(text, x + width / 2, y + height / 2 + 8);

    canvas.addEventListener('click', function onClick(event) {
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        if (clickX >= x && clickX <= x + width && clickY >= y && clickY <= y + height) {
            callback();
            canvas.removeEventListener('click', onClick);
        }
    });
}

function restartGame() {
    moveCount = 0;
    document.getElementById('moveCounter').innerText = `Moves: ${moveCount}`;
    emptyTile = { x: GRID_SIZE - 1, y: GRID_SIZE - 1 };
    initTiles();
    shuffleTiles();
    drawTiles();
}

function exitGame() {
    // Since it's a browser game, you might redirect to another page or close the tab
    window.close();
}
