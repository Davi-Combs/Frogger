import { nanoid } from 'nanoid';

// --- Game Configuration ---
const CELL_SIZE = 40; // pixels per grid cell
const GAME_COLS = 20; // number of columns (width)
const GAME_ROWS = 13; // number of rows (lanes)

const GAME_WIDTH = CELL_SIZE * GAME_COLS;
const GAME_HEIGHT = CELL_SIZE * GAME_ROWS;

const DIFFICULTY_SETTINGS = {
    easy: {
        carSpeedMultiplier: 0.8, // Slower cars
        logSpeedMultiplier: 0.8, // Slower logs
        obstacleDensity: 0.5, // Less dense obstacles
        lives: 5,
        obstacleSpawnInterval: 1500 // ms, longer interval between spawns
    },
    medium: {
        carSpeedMultiplier: 1.2,
        logSpeedMultiplier: 1.2,
        obstacleDensity: 0.7,
        lives: 3,
        obstacleSpawnInterval: 1000
    },
    hard: {
        carSpeedMultiplier: 1.8,
        logSpeedMultiplier: 1.8,
        obstacleDensity: 0.9, // More dense obstacles
        lives: 1,
        obstacleSpawnInterval: 700 // ms, shorter interval between spawns
    }
};

const LANE_TYPES = [
    { type: 'goal', color: '#6a0dad', safe: true, objects: [], goalPads: [2, 6, 10, 14, 18] }, // Row 0 (adjust pad positions for 13 columns)
    { type: 'river', color: '#1e90ff', safe: false, objects: [], speed: 1.0, direction: -1 }, // Row 1: Logs moving left
    { type: 'river', color: '#1e90ff', safe: false, objects: [], speed: 0.8, direction: 1 },  // Row 2: Logs moving right
    { type: 'river', color: '#1e90ff', safe: false, objects: [], speed: 1.2, direction: -1 }, // Row 3: Logs moving left
    { type: 'river', color: '#1e90ff', safe: false, objects: [], speed: 0.9, direction: 1 },  // Row 4: Logs moving right
    { type: 'river', color: '#1e90ff', safe: false, objects: [], speed: 1.1, direction: -1 }, // Row 5: Logs moving left
    { type: 'grass', color: '#4CAF50', safe: true, objects: [] }, // Row 6 (Middle Safe Zone)
    { type: 'road', color: '#333', safe: false, objects: [], speed: 1.5, direction: 1 },  // Row 7: Cars moving right
    { type: 'road', color: '#333', safe: false, objects: [], speed: 1.0, direction: -1 }, // Row 8: Cars moving left
    { type: 'road', color: '#333', safe: false, objects: [], speed: 1.3, direction: 1 },  // Row 9: Cars moving right
    { type: 'road', color: '#333', safe: false, objects: [], speed: 0.7, direction: -1 }, // Row 10: Cars moving left
    { type: 'road', color: '#333', safe: false, objects: [], speed: 1.6, direction: 1 },  // Row 11: Cars moving right
    { type: 'grass', color: '#4CAF50', safe: true, objects: [] }  // Row 12 (Starting Safe Zone)
];

// --- Game State ---
const game = {
    frog: { x: GAME_WIDTH / 2 - CELL_SIZE / 2, y: (GAME_ROWS - 1) * CELL_SIZE, onLog: null },
    lives: 3,
    score: 0,
    currentLevel: 1,
    gameRunning: false,
    lastFrameTime: 0,
    animationFrameId: null,
    obstacles: [], // array of objects { id, type, lane, x, width, element, speed, direction }
    goalFrogs: new Set(), // Store x positions of successful frogs in the goal lane
    difficulty: 'medium', // default difficulty
    obstacleTimers: {}, // Tracks when to spawn next obstacle for each lane
    message: '',
    maxRowReached: GAME_ROWS - 1 // Tracks the highest (lowest index) row the frog has reached
};

// --- DOM Elements ---
const gameArea = document.getElementById('game-area');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const messageDisplay = document.getElementById('message');
const startButton = document.getElementById('start-button');
const difficultySelect = document.getElementById('difficulty-select');

// D-Pad buttons
const upButton = document.getElementById('up-button');
const downButton = document.getElementById('down-button');
const leftButton = document.getElementById('left-button');
const rightButton = document.getElementById('right-button');

let frogElement; // Reference to the frog's DOM element

// --- Initialization ---
function setupGameArea() {
    gameArea.style.width = `${GAME_WIDTH}px`;
    gameArea.style.height = `${GAME_HEIGHT}px`;

    // Clear existing lanes and obstacles
    gameArea.innerHTML = '';

    // Create lanes
    LANE_TYPES.forEach((lane, index) => {
        const laneEl = document.createElement('div');
        laneEl.classList.add('lane', lane.type);
        laneEl.style.height = `${CELL_SIZE}px`;
        laneEl.style.top = `${index * CELL_SIZE}px`;
        laneEl.style.backgroundColor = lane.color;

        if (lane.type === 'goal') {
            lane.goalPads.forEach(padX => {
                const padEl = document.createElement('div');
                padEl.classList.add('lily-pad');
                padEl.dataset.padX = padX; // Store original x-coordinate
                padEl.style.width = `${CELL_SIZE}px`;
                padEl.style.height = `${CELL_SIZE}px`;
                padEl.style.left = `${padX * CELL_SIZE}px`;
                laneEl.appendChild(padEl);
            });
        }
        gameArea.appendChild(laneEl);
    });

    // Create frog element
    frogElement = document.createElement('div');
    frogElement.classList.add('frog');
    frogElement.style.setProperty('--cell-size', `${CELL_SIZE}px`); // Set CSS variable for sizing
    gameArea.appendChild(frogElement);
}

function initGame() {
    setupGameArea(); // Create lanes and frog element
    resetGame();

    startButton.addEventListener('click', () => {
        if (!game.gameRunning) {
            startGame();
        } else {
            // If game is running, clicking restart stops and then restarts
            resetGame();
            startGame();
        }
    });

    difficultySelect.addEventListener('change', (event) => {
        game.difficulty = event.target.value;
        resetGame(); // Reset game with new difficulty settings
    });

    // Keyboard input listener
    document.addEventListener('keydown', handleInput);

    // D-Pad button listeners
    upButton.addEventListener('click', () => handleInput({ key: 'ArrowUp' }));
    downButton.addEventListener('click', () => handleInput({ key: 'ArrowDown' }));
    leftButton.addEventListener('click', () => handleInput({ key: 'ArrowLeft' }));
    rightButton.addEventListener('click', () => handleInput({ key: 'ArrowRight' }));

    updateStatusDisplay();
}

function resetGame() {
    if (game.animationFrameId) {
        cancelAnimationFrame(game.animationFrameId);
    }

    const selectedDifficulty = DIFFICULTY_SETTINGS[game.difficulty];
    game.lives = selectedDifficulty.lives;
    game.score = 0;
    game.currentLevel = 1;
    game.gameRunning = false;
    game.lastFrameTime = 0;
    game.animationFrameId = null;
    game.obstacles = [];
    game.goalFrogs.clear();
    game.message = 'Press Start to play!';
    game.maxRowReached = GAME_ROWS - 1; // Reset furthest row reached

    // Clear all existing obstacles from DOM
    document.querySelectorAll('.car, .log').forEach(el => el.remove());
    // Clear lily pad markers
    document.querySelectorAll('.lily-pad.filled').forEach(el => el.classList.remove('filled'));

    // Reset frog position
    game.frog.x = GAME_WIDTH / 2 - CELL_SIZE / 2;
    game.frog.y = (GAME_ROWS - 1) * CELL_SIZE;
    game.frog.onLog = null;
    frogElement.style.transform = `translate(${game.frog.x}px, ${game.frog.y}px)`;

    // Reset obstacle timers (will trigger immediate spawn on first frame if needed)
    LANE_TYPES.forEach((_, index) => {
        if (['road', 'river'].includes(LANE_TYPES[index].type)) {
            game.obstacleTimers[index] = 0;
        }
    });

    updateStatusDisplay();
}

function startGame() {
    game.gameRunning = true;
    game.message = '';
    startButton.textContent = 'Restart Game'; // Change button text
    game.animationFrameId = requestAnimationFrame(gameLoop);
    updateStatusDisplay();
}

// --- Game Loop ---
function gameLoop(timestamp) {
    if (!game.gameRunning) return;

    // Calculate delta time for frame-rate independent movement
    const deltaTime = timestamp - game.lastFrameTime;
    game.lastFrameTime = timestamp;

    update(deltaTime / 1000); // Pass delta in seconds
    render();

    game.animationFrameId = requestAnimationFrame(gameLoop);
}

// --- Update Game State ---
function update(deltaTime) {
    const selectedDifficulty = DIFFICULTY_SETTINGS[game.difficulty];

    // Move frog (if on log)
    if (game.frog.onLog) {
        const log = game.obstacles.find(o => o.id === game.frog.onLog);
        if (log) {
            game.frog.x += log.speed * deltaTime * CELL_SIZE; // Move frog with the log
        }
    }

    // Keep frog within horizontal bounds
    game.frog.x = Math.max(0, Math.min(game.frog.x, GAME_WIDTH - CELL_SIZE));

    // Update obstacle positions and handle wraparound
    game.obstacles.forEach(obstacle => {
        obstacle.x += obstacle.speed * deltaTime * CELL_SIZE; // Speed is in units per second, convert to pixels

        // Wraparound logic
        if (obstacle.direction === 1) { // Moving right
            if (obstacle.x > GAME_WIDTH) {
                // Teleport to left, off-screen. Randomize start position for less predictable patterns.
                obstacle.x = -obstacle.width * CELL_SIZE - Math.random() * GAME_WIDTH * (1 - selectedDifficulty.obstacleDensity);
            }
        } else { // Moving left
            if (obstacle.x + obstacle.width * CELL_SIZE < 0) {
                // Teleport to right, off-screen. Randomize start position.
                obstacle.x = GAME_WIDTH + Math.random() * GAME_WIDTH * (1 - selectedDifficulty.obstacleDensity);
            }
        }
    });

    // Spawn new obstacles
    LANE_TYPES.forEach((lane, index) => {
        if (['road', 'river'].includes(lane.type)) {
            game.obstacleTimers[index] = (game.obstacleTimers[index] || 0) + deltaTime * 1000;
            if (game.obstacleTimers[index] >= selectedDifficulty.obstacleSpawnInterval) {
                const existingObstaclesInLane = game.obstacles.filter(o => o.lane === index);

                let canSpawn = true;
                // Check for minimum distance from nearest obstacle at the spawn edge
                if (existingObstaclesInLane.length > 0) {
                    const sortedObstacles = [...existingObstaclesInLane].sort((a, b) => a.x - b.x);
                    const minSpacing = CELL_SIZE * (lane.type === 'road' ? 2 : 2.5); // Min spacing between obstacles

                    if (lane.direction === 1) { // Moving right, spawn on left
                        const leftmostObstacle = sortedObstacles[0];
                        if (leftmostObstacle.x < minSpacing * selectedDifficulty.obstacleDensity * (GAME_COLS / 2)) {
                            canSpawn = false; // Too close to the left edge
                        }
                    } else { // Moving left, spawn on right
                        const rightmostObstacle = sortedObstacles[sortedObstacles.length - 1];
                        if (rightmostObstacle.x + rightmostObstacle.width * CELL_SIZE > GAME_WIDTH - minSpacing * selectedDifficulty.obstacleDensity * (GAME_COLS / 2)) {
                            canSpawn = false; // Too close to the right edge
                        }
                    }
                }

                if (canSpawn) {
                    addObstacleToLane(index, lane.type, lane.speed);
                    game.obstacleTimers[index] = 0; // Reset timer after spawning
                } else {
                    // If couldn't spawn, reduce timer slightly to try again sooner
                    game.obstacleTimers[index] -= 200; // Reduce by 200ms
                }
            }
        }
    });

    // Collision detection
    checkCollisions();

    // Check win condition (all lily pads filled)
    if (game.goalFrogs.size === LANE_TYPES[0].goalPads.length) {
        winLevel();
    }
}

// --- Render Game State ---
function render() {
    frogElement.style.transform = `translate(${game.frog.x}px, ${game.frog.y}px)`;

    game.obstacles.forEach(obstacle => {
        obstacle.element.style.transform = `translate(${obstacle.x}px, ${obstacle.lane * CELL_SIZE}px)`;
    });

    updateStatusDisplay();
}

// --- Input Handling ---
function handleInput(event) {
    if (!game.gameRunning) return;

    const currentLaneIndex = Math.floor(game.frog.y / CELL_SIZE);

    let moved = false;
    if (event.key === 'ArrowUp') {
        game.frog.y = Math.max(0, game.frog.y - CELL_SIZE);
        moved = true;
    } else if (event.key === 'ArrowDown') {
        game.frog.y = Math.min((GAME_ROWS - 1) * CELL_SIZE, game.frog.y + CELL_SIZE);
        moved = true;
    } else if (event.key === 'ArrowLeft') {
        game.frog.x = Math.max(0, game.frog.x - CELL_SIZE);
        moved = true;
    } else if (event.key === 'ArrowRight') {
        game.frog.x = Math.min(GAME_WIDTH - CELL_SIZE, game.frog.x + CELL_SIZE);
        moved = true;
    }

    if (moved) {
        // If moving up, award points for reaching a new highest row
        const newLaneIndex = Math.floor(game.frog.y / CELL_SIZE);
        if (newLaneIndex < game.maxRowReached) {
            game.score += 10; // Points per row
            game.maxRowReached = newLaneIndex;
        }
        game.frog.onLog = null; // Frog is no longer on a log after jumping
    }
}

// --- Obstacle Management ---
function createObstacleElement(type, widthInCells, assetUrl) {
    const el = document.createElement('div');
    el.classList.add(type);
    el.style.width = `${widthInCells * CELL_SIZE}px`;
    el.style.backgroundImage = `url('${assetUrl}')`;
    el.style.setProperty('--cell-size', `${CELL_SIZE}px`); // Set CSS variable for height
    return el;
}

function addObstacleToLane(laneIndex, type, baseSpeed) {
    const laneInfo = LANE_TYPES[laneIndex];
    let obstacle;
    let assetUrl;
    let widthInCells;
    let xPos; // Initial x position for spawning

    if (type === 'road') {
        widthInCells = Math.random() < 0.5 ? 2 : 3; // Car length 2 or 3 cells
        assetUrl = Math.random() < 0.5 ? 'asset_car_red.png' : 'asset_car_blue.png';
        const speed = baseSpeed * laneInfo.direction * DIFFICULTY_SETTINGS[game.difficulty].carSpeedMultiplier;

        if (laneInfo.direction === 1) { // Moving right, spawn on left edge
            xPos = -widthInCells * CELL_SIZE; // Start exactly off-screen left
        } else { // Moving left, spawn on right edge
            xPos = GAME_WIDTH; // Start exactly off-screen right
        }

        obstacle = {
            id: nanoid(),
            type: 'car',
            lane: laneIndex,
            x: xPos,
            width: widthInCells,
            speed: speed,
            direction: laneInfo.direction
        };
    } else if (type === 'river') {
        widthInCells = Math.random() < 0.7 ? 3 : 4; // Log length 3 or 4 cells
        assetUrl = 'asset_log.png';
        const speed = baseSpeed * laneInfo.direction * DIFFICULTY_SETTINGS[game.difficulty].logSpeedMultiplier;

        if (laneInfo.direction === 1) { // Moving right, spawn on left edge
            xPos = -widthInCells * CELL_SIZE;
        } else { // Moving left, spawn on right edge
            xPos = GAME_WIDTH;
        }

        obstacle = {
            id: nanoid(),
            type: 'log',
            lane: laneIndex,
            x: xPos,
            width: widthInCells,
            speed: speed,
            direction: laneInfo.direction
        };
    } else {
        return; // Not a spwanable lane type
    }

    obstacle.element = createObstacleElement(obstacle.type, obstacle.width, assetUrl);
    gameArea.appendChild(obstacle.element);
    game.obstacles.push(obstacle);
}

// --- Collision Detection ---
function checkCollisions() {
    const frogRect = {
        x: game.frog.x,
        y: game.frog.y,
        width: CELL_SIZE,
        height: CELL_SIZE
    };

    const currentLaneIndex = Math.floor(game.frog.y / CELL_SIZE);
    const currentLane = LANE_TYPES[currentLaneIndex];

    if (!game.gameRunning) return; // Prevent collisions during game setup

    // Safe zones (grass) - no collisions, always safe except goal lane specific checks
    if (currentLane.safe) {
        game.frog.onLog = null;
        if (currentLane.type === 'goal') {
            // Check if frog is on a lily pad and hasn't scored for this pad yet
            const frogCellX = Math.round(game.frog.x / CELL_SIZE); // Use round for better alignment tolerance
            if (currentLane.goalPads.includes(frogCellX)) {
                if (!game.goalFrogs.has(frogCellX)) {
                    game.goalFrogs.add(frogCellX);
                    game.score += 50; // Score for reaching a pad
                    game.message = 'Goal reached!';
                    markLilyPad(frogCellX);
                    if (game.goalFrogs.size < currentLane.goalPads.length) {
                        // If not all pads filled, reset frog to start
                        resetFrogToStart();
                    }
                }
            } else {
                // In goal lane but not exactly on a lily pad -> death
                loseLife('Missed the lily pad!');
            }
        }
        return;
    }

    // Road lanes (cars)
    if (currentLane.type === 'road') {
        let hitCar = false;
        game.obstacles.filter(o => o.lane === currentLaneIndex && o.type === 'car').forEach(car => {
            const carRect = {
                x: car.x,
                y: car.lane * CELL_SIZE,
                width: car.width * CELL_SIZE,
                height: CELL_SIZE
            };
            if (
                frogRect.x < carRect.x + carRect.width &&
                frogRect.x + frogRect.width > carRect.x &&
                frogRect.y < carRect.y + carRect.height && // Should always be true if in same lane
                frogRect.y + frogRect.height > carRect.y // Should always be true if in same lane
            ) {
                hitCar = true;
            }
        });
        if (hitCar) {
            loseLife('Hit by a car!');
        }
        return;
    }

    // River lanes (logs/water)
    if (currentLane.type === 'river') {
        let onLog = false;
        game.obstacles.filter(o => o.lane === currentLaneIndex && o.type === 'log').forEach(log => {
            const logRect = {
                x: log.x,
                y: log.lane * CELL_SIZE,
                width: log.width * CELL_SIZE,
                height: CELL_SIZE
            };
            if (
                frogRect.x < logRect.x + logRect.width &&
                frogRect.x + frogRect.width > logRect.x &&
                frogRect.y < logRect.y + logRect.height &&
                frogRect.y + frogRect.height > logRect.y
            ) {
                onLog = true;
                game.frog.onLog = log.id; // Mark frog as being on this log
            }
        });

        if (!onLog) {
            loseLife('Fell in the water!');
        } else {
            // If on a log, ensure frog doesn't move off the log ends
            const activeLog = game.obstacles.find(o => o.id === game.frog.onLog);
            if (activeLog) {
                // If frog center goes beyond log boundaries
                const frogCenterX = game.frog.x + CELL_SIZE / 2;
                const logMinX = activeLog.x;
                const logMaxX = activeLog.x + activeLog.width * CELL_SIZE;

                if (frogCenterX < logMinX || frogCenterX > logMaxX) {
                    loseLife('Fell off the log!');
                }
            }
        }
        return;
    }
}

function loseLife(reason) {
    game.lives--;
    game.message = `Oh no! ${reason} Lives left: ${game.lives}`;
    if (game.lives <= 0) {
        gameOver();
    } else {
        resetFrogToStart();
    }
}

function resetFrogToStart() {
    game.frog.x = GAME_WIDTH / 2 - CELL_SIZE / 2;
    game.frog.y = (GAME_ROWS - 1) * CELL_SIZE;
    game.frog.onLog = null;
    game.maxRowReached = GAME_ROWS - 1; // Reset furthest row reached for scoring
    updateStatusDisplay();
}

function gameOver() {
    game.gameRunning = false;
    cancelAnimationFrame(game.animationFrameId);
    game.message = `GAME OVER! Final Score: ${game.score}`;
    startButton.textContent = 'Play Again';
    updateStatusDisplay();
}

function markLilyPad(xCoord) {
    const goalLaneEl = gameArea.querySelector('.lane.goal');
    if (goalLaneEl) {
        const pads = goalLaneEl.querySelectorAll('.lily-pad');
        pads.forEach(pad => {
            const padX = parseInt(pad.dataset.padX); // Retrieve original x-coordinate from dataset
            if (padX === xCoord) {
                pad.classList.add('filled');
            }
        });
    }
}

function winLevel() {
    game.gameRunning = false;
    cancelAnimationFrame(game.animationFrameId);
    game.score += game.lives * 100; // Bonus for remaining lives
    game.message = `LEVEL COMPLETE! Score: ${game.score}`;
    startButton.textContent = 'Next Level'; 
    
    // For now, after winning, automatically start a new game after a short delay
    // In a full game, you might transition to a new level or show a victory screen.
    setTimeout(() => {
        alert('You won! Starting a new game.');
        resetGame();
        startGame();
    }, 1500); // Wait 1.5 seconds before resetting
}

function updateStatusDisplay() {
    scoreDisplay.textContent = game.score;
    livesDisplay.textContent = game.lives;
    messageDisplay.textContent = game.message;
}

// Start the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initGame);