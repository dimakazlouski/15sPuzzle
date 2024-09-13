// main.js

// Variables for the start screen
const images = [
    'images/dog.jpg',
    'images/duck.jpg',
    //'images/image3.jpg',
    //'images/image4.jpg',
    // Add more image paths as needed
];

let selectedImage = null;
let selectedGridSize = 4; // Default grid size

// Elements from the DOM
const startScreen = document.getElementById('startScreen');
const imageSelectionDiv = document.getElementById('imageSelection');
const gridSizeSelect = document.getElementById('gridSize');
const startButton = document.getElementById('startButton');
const gameCanvas = document.getElementById('gameCanvas');
const moveCounterDiv = document.getElementById('moveCounter');
const backButton = document.getElementById('backButton'); // New Back button element

// Set up the image selection
function setupImageSelection() {
    images.forEach((imagePath, index) => {
        const imgDiv = document.createElement('div');
        imgDiv.classList.add('imageOption');
        imgDiv.dataset.imagePath = imagePath;

        const imgElement = document.createElement('img');
        imgElement.src = imagePath;
        imgElement.alt = `Image ${index + 1}`;

        imgDiv.appendChild(imgElement);
        imageSelectionDiv.appendChild(imgDiv);

        // Add click event listener to select the image
        imgDiv.addEventListener('click', function() {
            // Remove 'selected' class from all image options
            document.querySelectorAll('.imageOption').forEach(option => {
                option.classList.remove('selected');
            });
            // Add 'selected' class to the clicked image
            this.classList.add('selected');
            // Set the selected image path
            selectedImage = this.dataset.imagePath;
        });
    });
}

// Handle grid size selection
gridSizeSelect.addEventListener('change', function() {
    selectedGridSize = parseInt(this.value);
});

// Handle start button click
startButton.addEventListener('click', function() {
    if (!selectedImage) {
        alert('Please select an image.');
        return;
    }
    // Hide start screen
    startScreen.style.display = 'none';
    // Show canvas, move counter, and back button
    gameCanvas.style.display = 'block';
    moveCounterDiv.style.display = 'block';
    backButton.style.display = 'block'; // Show the back button

    // Start the game with the selected options
    startGame(selectedImage, selectedGridSize);
});

// Handle back button click
backButton.addEventListener('click', function() {
    exitGame();
});

// Call the setup function
setupImageSelection();

// Game variables
let canvas, ctx;
let SCREEN_SIZE = 600; // assuming square canvas
let GRID_SIZE = 4;
let TILE_SIZE;
let tiles = []; // Array to hold tile objects
let emptyTilePosition; // Position of the empty tile
let moveCount = 0; // Move counter
let gameCompleted = false; // Game state flag
let image;
let scaledImage; // Variable to hold the scaled image

function startGame(imagePath, gridSize) {
    // Initialize variables
    canvas = gameCanvas;
    ctx = canvas.getContext('2d');
    GRID_SIZE = gridSize;
    TILE_SIZE = SCREEN_SIZE / GRID_SIZE;
    tiles = [];
    moveCount = 0;
    gameCompleted = false;

    // Load the image
    image = new Image();
    image.src = imagePath;
    image.onload = function() {
        // Scale the image to the canvas size
        const offCanvas = document.createElement('canvas');
        offCanvas.width = canvas.width;
        offCanvas.height = canvas.height;
        const offCtx = offCanvas.getContext('2d');
        offCtx.drawImage(image, 0, 0, canvas.width, canvas.height);
        scaledImage = offCanvas;

        // Initialize the game after the image is loaded
        createTiles();
        shuffleTiles();
        drawTiles();
        updateMoveCounter();
    };

    // Adjust canvas size if necessary
    canvas.width = SCREEN_SIZE;
    canvas.height = SCREEN_SIZE;

    // Attach event listeners
    attachEventListeners();
}

function attachEventListeners() {
    // Remove existing event listeners
    document.removeEventListener('keydown', handleKeyDown);
    canvas.removeEventListener('click', handleInput);
    canvas.removeEventListener('touchstart', handleInput);

    // Add new event listeners
    document.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('click', handleInput);
    canvas.addEventListener('touchstart', handleInput, { passive: false });
}

// Function to create tiles
function createTiles() {
    tiles = []; // Reset tiles array
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            let position = { x: col, y: row };
            let tile = {
                imageX: col * TILE_SIZE,
                imageY: row * TILE_SIZE,
                position: position,
                currentPosition: { x: col, y: row }
            };
            tiles.push(tile);
        }
    }
    // Remove the last tile to create the empty space
    let emptyTile = tiles.pop();
    emptyTilePosition = emptyTile.position;
}

// Function to shuffle tiles
function shuffleTiles() {
    // Generate a solvable shuffle
    let positions = tiles.map(tile => ({ x: tile.position.x, y: tile.position.y }));
    do {
        positions = shuffleArray(positions);
    } while (!isSolvable(positions));

    // Assign shuffled positions to tiles
    for (let i = 0; i < tiles.length; i++) {
        tiles[i].currentPosition = positions[i];
    }
}

// Function to shuffle an array
function shuffleArray(array) {
    let newArray = array.slice(); // Copy the array
    for (let i = newArray.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Function to check if the puzzle is solvable
function isSolvable(positions) {
    let inversions = 0;
    for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
            let posI = positions[i].y * GRID_SIZE + positions[i].x;
            let posJ = positions[j].y * GRID_SIZE + positions[j].x;
            if (posI > posJ) {
                inversions++;
            }
        }
    }

    // If grid size is odd, puzzle is solvable if inversions count is even
    if (GRID_SIZE % 2 !== 0) {
        return inversions % 2 === 0;
    } else {
        // If grid size is even, need to consider the row of the empty tile
        let emptyRowFromBottom = GRID_SIZE - emptyTilePosition.y;
        if (emptyRowFromBottom % 2 === 0) {
            return inversions % 2 !== 0;
        } else {
            return inversions % 2 === 0;
        }
    }
}

// Function to draw tiles
function drawTiles() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each tile
    tiles.forEach(tile => {
        let destX = tile.currentPosition.x * TILE_SIZE;
        let destY = tile.currentPosition.y * TILE_SIZE;
        ctx.drawImage(
            scaledImage, // Use the scaled image
            tile.imageX,
            tile.imageY,
            TILE_SIZE,
            TILE_SIZE,
            destX,
            destY,
            TILE_SIZE,
            TILE_SIZE
        );
    });

    // Draw move counter
    updateMoveCounter();

    // If game is completed, draw the completion message and buttons
    if (gameCompleted) {
        drawCompletionMessage();
    }
}

// Function to update move counter
function updateMoveCounter() {
    const moveCounterDiv = document.getElementById('moveCounter');
    moveCounterDiv.innerText = `Moves: ${moveCount}`;
}

// Function to check for win condition
function checkWinCondition() {
    for (let tile of tiles) {
        if (tile.position.x !== tile.currentPosition.x || tile.position.y !== tile.currentPosition.y) {
            return false;
        }
    }
    return true;
}

function handleKeyDown(event) {
    if (gameCompleted) return;
    let dx = 0;
    let dy = 0;
    if (event.key === 'ArrowLeft') {
        dx = 1;
    } else if (event.key === 'ArrowRight') {
        dx = -1;
    } else if (event.key === 'ArrowUp') {
        dy = 1;
    } else if (event.key === 'ArrowDown') {
        dy = -1;
    } else {
        return; // Ignore other keys
    }
    // Calculate the position of the tile to move
    let tileX = emptyTilePosition.x + dx;
    let tileY = emptyTilePosition.y + dy;
    attemptMove(tileX, tileY);
}

// Function to attempt to move a tile at (tileX, tileY)
function attemptMove(tileX, tileY) {
    if (tileX >= 0 && tileX < GRID_SIZE && tileY >= 0 && tileY < GRID_SIZE) {
        // Check if the tile is adjacent to the empty tile
        let dx = tileX - emptyTilePosition.x;
        let dy = tileY - emptyTilePosition.y;
        if ((Math.abs(dx) === 1 && dy === 0) || (dx === 0 && Math.abs(dy) === 1)) {
            // Find the tile at that position
            let tile = tiles.find(t => t.currentPosition.x === tileX && t.currentPosition.y === tileY);
            if (tile) {
                // Swap the tile with the empty space
                [tile.currentPosition, emptyTilePosition] = [emptyTilePosition, tile.currentPosition];
                moveCount++;
                drawTiles();
                if (checkWinCondition()) {
                    gameCompleted = true;
                    drawTiles();
                }
                return true;
            }
        }
    }
    return false;
}

// Event listener for mouse clicks and touch inputs
function handleInput(event) {
    if (gameCompleted) return;

    event.preventDefault();

    let clientX, clientY;

    if (event.type === 'touchstart') {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else if (event.type === 'click') {
        clientX = event.clientX;
        clientY = event.clientY;
    } else {
        return;
    }

    let rect = canvas.getBoundingClientRect();
    let x = clientX - rect.left;
    let y = clientY - rect.top;

    let tileX = Math.floor(x / TILE_SIZE);
    let tileY = Math.floor(y / TILE_SIZE);

    attemptMove(tileX, tileY);
}

// Function to draw completion message and buttons
function drawCompletionMessage() {
    // Draw overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw "Nice Job!" message
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '100px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Nice Job!', canvas.width / 2, canvas.height / 2 - 50);

    // Draw buttons
    drawButton('Again', canvas.width / 2 - 175, canvas.height / 2 + 20, 150, 50, restartGame);
    drawButton('Exit', canvas.width / 2 + 25, canvas.height / 2 + 20, 150, 50, exitGame);
}

// Function to draw a button
function drawButton(text, x, y, width, height, action) {
    ctx.fillStyle = '#4682B4'; // Button color
    ctx.fillRect(x, y, width, height);

    ctx.fillStyle = '#FFFFFF'; // Text color
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + width / 2, y + height / 2);

    // Add event listener for clicks and touches
    function onClick(event) {
        if (!gameCompleted) return;

        event.preventDefault();

        let clientX, clientY;

        if (event.type === 'touchstart') {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else if (event.type === 'click') {
            clientX = event.clientX;
            clientY = event.clientY;
        } else {
            return;
        }

        let rect = canvas.getBoundingClientRect();
        let clickX = clientX - rect.left;
        let clickY = clientY - rect.top;

        if (clickX >= x && clickX <= x + width && clickY >= y && clickY <= y + height) {
            action();
            canvas.removeEventListener('click', onClick);
            canvas.removeEventListener('touchstart', onClick);
        }
    }

    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchstart', onClick, { passive: false });
}

// Function to restart the game
function restartGame() {
    moveCount = 0;
    gameCompleted = false;
    createTiles();
    shuffleTiles();
    drawTiles();
    updateMoveCounter();
}

// Function to exit the game (modified to handle 'Back' button)
function exitGame() {
    // Reset to start screen
    gameCanvas.style.display = 'none';
    moveCounterDiv.style.display = 'none';
    backButton.style.display = 'none'; // Hide the back button
    startScreen.style.display = 'flex';
    // Clear canvas
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    // Reset selected image and grid size
    selectedImage = null;
    selectedGridSize = 4;
    gridSizeSelect.value = '4'; // Reset to default grid size
    document.querySelectorAll('.imageOption').forEach(option => {
        option.classList.remove('selected');
    });
    // Remove event listeners
    document.removeEventListener('keydown', handleKeyDown);
    if (canvas) {
        canvas.removeEventListener('click', handleInput);
        canvas.removeEventListener('touchstart', handleInput);
    }
}

// Adjust canvas size
canvas.width = SCREEN_SIZE;
canvas.height = SCREEN_SIZE;
