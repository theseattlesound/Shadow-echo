/**
 * Game - Main game logic for Shadow Echo
 */

class Game {
    constructor() {
        // Get canvas
        this.canvas = document.getElementById('game-canvas');
        
        // Create engine
        this.engine = new Engine(this.canvas);
        
        // Game state
        this.currentLevel = 0;
        this.levels = [];
        this.player = null;
        this.entities = [];
        this.lights = [];
        this.worldBounds = {
            left: -1000,
            right: 1000,
            top: -1000,
            bottom: 1000
        };
        this.backgroundColor = '#0A1921';
        
        // UI elements
        this.startScreen = document.getElementById('start-screen');
        this.levelCompleteScreen = document.getElementById('level-complete');
        this.gameOverScreen = document.getElementById('game-over');
        
        // Initialize game
        this.init();
    }
    
    init() {
        // Load levels
        this.levels = createLevels();
        
        // Set up event listeners
        document.getElementById('start-button').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('next-level-button').addEventListener('click', () => {
            this.nextLevel();
        });
        
        document.getElementById('retry-button').addEventListener('click', () => {
            this.restartLevel();
        });
        
        // Set engine entities reference
        this.engine.entities = this.entities;
        this.engine.lights = this.lights;
    }
    
    startGame() {
        // Hide start screen
        this.startScreen.classList.add('hidden');
        
        // Load first level
        this.loadLevel(0);
        
        // Start engine
        this.engine.start();
    }
    
    loadLevel(levelIndex) {
        if (levelIndex >= this.levels.length) {
            // Game complete
            this.gameComplete();
            return;
        }
        
        // Get level
        const level = this.levels[levelIndex];
        this.currentLevel = levelIndex;
        
        // Load level
        level.load(this);
    }
    
    nextLevel() {
        // Hide level complete screen
        this.levelCompleteScreen.classList.add('hidden');
        
        // Load next level
        this.loadLevel(this.currentLevel + 1);
    }
    
    restartLevel() {
        // Hide game over screen
        this.gameOverScreen.classList.add('hidden');
        
        // Reload current level
        this.loadLevel(this.currentLevel);
    }
    
    levelComplete() {
        // Show level complete screen
        this.levelCompleteScreen.classList.remove('hidden');
    }
    
    gameOver() {
        // Show game over screen
        this.gameOverScreen.classList.remove('hidden');
    }
    
    gameComplete() {
        // Show game complete screen (reuse level complete screen)
        document.querySelector('#level-complete h2').textContent = 'Game Complete!';
        document.getElementById('next-level-button').textContent = 'Play Again';
        this.levelCompleteScreen.classList.remove('hidden');
        
        // Set up event listener for play again button
        document.getElementById('next-level-button').addEventListener('click', () => {
            // Reset game complete screen
            document.querySelector('#level-complete h2').textContent = 'Level Complete';
            document.getElementById('next-level-button').textContent = 'Next Level';
            
            // Load first level
            this.loadLevel(0);
        }, { once: true });
    }
    
    addEntity(entity) {
        this.entities.push(entity);
        this.engine.addEntity(entity);
        return entity;
    }
    
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
        this.engine.removeEntity(entity);
    }
    
    addLight(light) {
        this.lights.push(light);
        this.engine.addLight(light);
        return light;
    }
    
    removeLight(light) {
        const index = this.lights.indexOf(light);
        if (index !== -1) {
            this.lights.splice(index, 1);
        }
        this.engine.removeLight(light);
    }
    
    setCamera(camera) {
        this.engine.setCamera(camera);
    }
    
    checkCollision(entity1, entity2) {
        return this.engine.checkCollision(entity1, entity2);
    }
    
    checkPointInShadow(x, y) {
        return this.engine.checkPointInShadow(x, y);
    }
}

// Initialize game when the page loads
window.addEventListener('load', () => {
    window.game = new Game();
});
