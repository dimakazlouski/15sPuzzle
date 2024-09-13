// main.js

// Image options available for selection
const images = [
    'images/dog.jpg',
    'images/duck.jpg',
    // Add more image paths as needed
];

// Variables to store selected options
let selectedImage = null;
let selectedGridSize = 4; // Default grid size

// DOM Elements
const startScreen = document.getElementById('startScreen');
const imageSelectionDiv = document.getElementById('imageSelection');
const gridSizeSelect = document.getElementById('gridSize');
const startButton = document.getElementById('startButton');
const gameContainer = document.getElementById('gameContainer');
const gameCanvas = document.getElementById('gameCanvas');
const moveCounterDiv = document.getElementById('moveCounter');
const backButton = document.getElementById('backButton');
const referenceImage = document.getElementById('referenceImage');
const timerDiv = document.getElementById('timer');
const completionOverlay = document.getElementById('completionOverlay');
const againButton = document.getElementById('againButton');
const exitButton = document.getElementById('exitButton');

// Timer variables
let timerInterval;
let elapsedTime = 0;

// Game variables
let ctx;
let SCREEN_SIZE = 600; // Initial canvas size
let GRID_SIZE = 4;
let TILE_SIZE;
let tiles = []; // Array to hold tile objects
let emptyTilePosition; // Position of the empty tile
let moveCount = 0; // Move counter
let gameCompleted = false; // Game state flag
let image;
let scaledImage; // Variable to hold the scaled image

// Initialize the game by setting up image selections
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
    // Hide start screen and show game container
    startScreen.style.display = 'none';
    gameContainer.style.display = 'flex';

    // Set the reference image source
    referenceImage.src = selectedImage;

    // Start the game with the selected options
    startGame(selectedImage, selectedGridSize);
});

// Handle back button click
backButton.addEventListener('click', function() {
    exitGame();
});

// Handle "Again" button click
againButton.addEventListener('click', function() {
    restartGame();
    // Hide completion overlay
    completionOverlay.style.display = 'none';
});

// Handle "Exit" button click
exitButton.addEventListener('click', function() {
    exitGame();
    // Hide completion overlay
    completionOverlay.style.display = 'none';
});

// Start the game
function startGame(imagePath, gridSize) {
    // Initialize variables
    GRID_SIZE = gridSize;
    TILE_SIZE = SCREEN_SIZE / GRID_SIZE;
    tiles = [];
    moveCount = 0;
    gameCompleted = false;
    elapsedTime = 0;
    timerDiv.innerText = `Time: ${elapsedTime}s`;
    moveCounterDiv.innerText = `Moves: ${moveCount}`;

    // Show timer and move counter
    timerDiv.style.display = 'block';
    moveCounterDiv.style.display = 'block';

    // Initialize canvas size
    adjustCanvasSize();

    // Load and scale the image
    image = new Image();
    image.src = imagePath;
    image.onload = function() {
        // Scale the image to the canvas size
        const offCanvas = document.createElement('canvas');
        offCanvas.width = SCREEN_SIZE;
        offCanvas.height = SCREEN_SIZE;
        const offCtx = offCanvas.getContext('2d');
        offCtx.drawImage(image, 0, 0, SCREEN_SIZE, SCREEN_SIZE);
        scaledImage = offCanvas;

        // Create and shuffle tiles
        createTiles();
        shuffleTiles();
        drawTiles();
        updateMoveCounter();
        startTimer(); // Start the timer
    };

    image.onerror = function() {
        alert('Failed to load the selected image. Please choose a different image.');
        exitGame();
    };

    // Attach event listeners
    attachEventListeners();
}

// Adjust canvas and layout size based on screen size for responsiveness
function adjustCanvasSize() {
    // Calculate the new size
    const containerWidth = gameContainer.clientWidth;
    SCREEN_SIZE = Math.min(600, containerWidth * 0.9); // Adjust as needed
    gameCanvas.width = SCREEN_SIZE;
    gameCanvas.height = SCREEN_SIZE;
    TILE_SIZE = SCREEN_SIZE / GRID_SIZE;

    // Adjust reference image size
    referenceImage.style.width = `${SCREEN_SIZE / 4}px`; // Original/4 as per user's update
}

// Attach necessary event listeners for game interactions
function attachEventListeners() {
    // Remove existing event listeners to prevent duplicates
    document.removeEventListener('keydown', handleKeyDown);
    gameCanvas.removeEventListener('click', handleInput);
    gameCanvas.removeEventListener('touchstart', handleInput);

    // Add new event listeners
    document.addEventListener('keydown', handleKeyDown);
    gameCanvas.addEventListener('click', handleInput);
    gameCanvas.addEventListener('touchstart', handleInput, { passive: false });
}

// Create tiles based on the selected grid size
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

// Shuffle tiles ensuring the puzzle is solvable
function shuffleTiles() {
    let positions = tiles.map(tile => ({ x: tile.position.x, y: tile.position.y }));
    do {
        positions = shuffleArray(positions);
    } while (!isSolvable(positions));

    // Assign shuffled positions to tiles
    for (let i = 0; i < tiles.length; i++) {
        tiles[i].currentPosition = positions[i];
    }
}

// Fisher-Yates Shuffle Algorithm
function shuffleArray(array) {
    let newArray = array.slice(); // Clone the array
    for (let i = newArray.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Check if the shuffled puzzle is solvable
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

    if (GRID_SIZE % 2 !== 0) {
        return inversions % 2 === 0;
    } else {
        let emptyRowFromBottom = GRID_SIZE - emptyTilePosition.y;
        if (emptyRowFromBottom % 2 === 0) {
            return inversions % 2 !== 0;
        } else {
            return inversions % 2 === 0;
        }
    }
}

// Draw tiles on the canvas
function drawTiles() {
    if (!ctx) return; // Ensure context is available

    // Clear the canvas
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

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

    // Draw move counter (already updated separately)
    // If game is completed, display the completion message
    if (gameCompleted) {
        stopTimer();
        drawCompletionMessage();
    }
}

// Update the move counter display
function updateMoveCounter() {
    moveCounterDiv.innerText = `Moves: ${moveCount}`;
}

// Check if the puzzle is solved
function checkWinCondition() {
    for (let tile of tiles) {
        if (tile.position.x !== tile.currentPosition.x || tile.position.y !== tile.currentPosition.y) {
            return false;
        }
    }
    return true;
}

// Handle keyboard inputs for moving tiles
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

// Handle mouse clicks and touch inputs on the canvas
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

    let rect = gameCanvas.getBoundingClientRect();
    let x = clientX - rect.left;
    let y = clientY - rect.top;

    let tileX = Math.floor(x / TILE_SIZE);
    let tileY = Math.floor(y / TILE_SIZE);

    attemptMove(tileX, tileY);
}

// Attempt to move a tile at (tileX, tileY)
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
                updateMoveCounter();
                drawTiles();

                // Check if the puzzle is completed after the move
                if (checkWinCondition()) {
                    gameCompleted = true;
                    stopTimer(); // Stop the timer
                    drawCompletionMessage(); // Show the completion message
                }
                return true;
            }
        }
    }
    return false;
}


// Start the timer
function startTimer() {
    timerInterval = setInterval(() => {
        elapsedTime++;
        timerDiv.innerText = `Time: ${elapsedTime}s`;
    }, 1000);
}

// Stop the timer
function stopTimer() {
    clearInterval(timerInterval);
}

// Draw the completion message and buttons
function drawCompletionMessage() {
    // Show the completion overlay
    completionOverlay.style.display = 'flex';
}

// Restart the game with the same settings
function restartGame() {
    moveCount = 0;
    elapsedTime = 0;
    gameCompleted = false;
    moveCounterDiv.innerText = `Moves: ${moveCount}`;
    timerDiv.innerText = `Time: ${elapsedTime}s`;

    // Reset the timer
    stopTimer();
    startTimer();

    // Shuffle and redraw tiles
    shuffleTiles();
    drawTiles();
}

// Exit the game and return to the start screen
function exitGame() {
    // Hide game container and show start screen
    gameContainer.style.display = 'none';
    startScreen.style.display = 'flex';

    // Reset variables
    selectedImage = null;
    selectedGridSize = 4;
    gridSizeSelect.value = '4'; // Reset to default grid size

    // Clear selections
    document.querySelectorAll('.imageOption').forEach(option => {
        option.classList.remove('selected');
    });

    // Reset reference image
    referenceImage.src = '';

    // Hide timer and move counter
    timerDiv.style.display = 'none';
    moveCounterDiv.style.display = 'none';

    // Stop the timer if running
    stopTimer();

    // Clear canvas
    if (ctx) {
        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    }

    // Hide completion overlay if visible
    completionOverlay.style.display = 'none';

    // Remove event listeners to prevent memory leaks
    document.removeEventListener('keydown', handleKeyDown);
    gameCanvas.removeEventListener('click', handleInput);
    gameCanvas.removeEventListener('touchstart', handleInput);
}

// Initialize the game by setting up image selections
setupImageSelection();

// Initialize canvas context
gameCanvas.width = SCREEN_SIZE;
gameCanvas.height = SCREEN_SIZE;
ctx = gameCanvas.getContext('2d');
