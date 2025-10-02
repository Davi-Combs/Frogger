// --- Game Configuration ---
export const CELL_SIZE = 40; // pixels per grid cell
export const GAME_COLS = 20; // number of columns (width)
export const GAME_ROWS = 13; // number of rows (lanes)

export const GAME_WIDTH = CELL_SIZE * GAME_COLS;
export const GAME_HEIGHT = CELL_SIZE * GAME_ROWS;

export const DIFFICULTY_SETTINGS = {
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

export const LANE_TYPES = [
    { type: 'goal', color: '#6a0dad', safe: true, objects: [], goalPads: [2, 6, 10, 14, 18] }, // Row 0
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
