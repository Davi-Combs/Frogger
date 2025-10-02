import { game, resetGameState, startGameState } from './state.js';
import { CELL_SIZE, GAME_WIDTH, GAME_HEIGHT, LANE_TYPES, DIFFICULTY_SETTINGS } from './constants.js';
import { createFrogElement, clearObstacles } from './entities.js';

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

export function setupGameArea() {
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
    createFrogElement(gameArea);
}

export function updateStatusDisplay() {
    if (scoreDisplay) scoreDisplay.textContent = game.score;
    if (livesDisplay) livesDisplay.textContent = game.lives;
    if (messageDisplay) messageDisplay.textContent = game.message;

    let buttonText = 'Start Game';
    if (game.gameRunning) {
        buttonText = 'Restart Game';
    } else if (game.lives <= 0) {
        buttonText = 'Play Again';
    } else if (game.goalFrogs.size === LANE_TYPES[0].goalPads.length) {
        buttonText = 'Next Level';
    }
    if (startButton) startButton.textContent = buttonText;
}

export function markLilyPad(xCoord) {
    const goalLaneEl = gameArea.querySelector('.lane.goal');


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
    createFrogElement(gameArea);
}

export function updateStatusDisplay() {
    if (scoreDisplay) scoreDisplay.textContent = game.score;
    if (livesDisplay) livesDisplay.textContent = game.lives;
    if (messageDisplay) messageDisplay.textContent = game.message;

    let buttonText = 'Start Game';
    if (game.gameRunning) {
        buttonText = 'Restart Game';
    } else if (game.lives <= 0) {
        buttonText = 'Play Again';
    } else if (game.goalFrogs.size === LANE_TYPES[0].goalPads.length) {
        buttonText = 'Next Level';
    }
    if (startButton) startButton.textContent = buttonText;
}

export function markLilyPad(xCoord) {
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

export function clearLilyPads() {
    document.querySelectorAll('.lily-pad.filled').forEach(el => el.classList.remove('filled'));
}
;

export function setupControls(gameStartFunction, gameResetFunction, inputHandler) {
    startButton.addEventListener('click', () => {
        if (!game.gameRunning) {
            gameStartFunction();
        } else {
            // If game is running, clicking restart stops and then restarts
            gameResetFunction();
            gameStartFunction();
        }
    })




    // Keyboard input listener
    document.addEventListener('keydown', inputHandler);
' }));


    // D-Pad button listeners
    upButton.addEventListener('click', () => inputHandler({ key: 'ArrowUp' }));
    downButton.addEventListener('click', () => inputHandler({ key: 'ArrowDown' }));
    leftButton.addEventListener('click', () => inputHandler({ key: 'ArrowLeft' }));
    rightButton.addEventListener('click', () => inputHandler({ key: 'ArrowRight
}



export function getGameArea() {
    return gameArea;
}



