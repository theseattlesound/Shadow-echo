/**
 * Controls - Input handling for Shadow Echo
 */

class Controls {
    constructor() {
        // Input state
        this.left = false;
        this.right = false;
        this.jump = false;
        this.shadowForm = false;
        
        // Touch state
        this.touchActive = false;
        this.joystickActive = false;
        this.joystickStartX = 0;
        this.joystickStartY = 0;
        this.joystickCurrentX = 0;
        this.joystickCurrentY = 0;
        this.joystickThreshold = 20;
        
        // DOM elements
        this.joystickBase = document.querySelector('.joystick-base');
        this.joystickThumb = document.querySelector('.joystick-thumb');
        this.jumpButton = document.getElementById('jump-button');
        this.shadowButton = document.getElementById('shadow-button');
        
        // Detect if mobile
        this.isMobile = this.detectMobile();
        
        // Initialize appropriate controls
        if (this.isMobile) {
            this.initTouchControls();
        } else {
            this.initKeyboardControls();
        }
    }
    
    detectMobile() {
        return (
            navigator.userAgent.match(/Android/i) ||
            navigator.userAgent.match(/webOS/i) ||
            navigator.userAgent.match(/iPhone/i) ||
            navigator.userAgent.match(/iPad/i) ||
            navigator.userAgent.match(/iPod/i) ||
            navigator.userAgent.match(/BlackBerry/i) ||
            navigator.userAgent.match(/Windows Phone/i)
        );
    }
    
    initKeyboardControls() {
        // Hide mobile controls
        document.getElementById('mobile-controls').style.display = 'none';
        
        // Keyboard event listeners
        window.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        window.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });
    }
    
    handleKeyDown(e) {
        switch (e.key) {
            case 'ArrowLeft':
            case 'a':
                this.left = true;
                break;
            case 'ArrowRight':
            case 'd':
                this.right = true;
                break;
            case 'ArrowUp':
            case 'w':
            case ' ':
                this.jump = true;
                break;
            case 'Shift':
            case 'q':
                this.shadowForm = true;
                break;
        }
    }
    
    handleKeyUp(e) {
        switch (e.key) {
            case 'ArrowLeft':
            case 'a':
                this.left = false;
                break;
            case 'ArrowRight':
            case 'd':
                this.right = false;
                break;
            case 'ArrowUp':
            case 'w':
            case ' ':
                this.jump = false;
                break;
            case 'Shift':
            case 'q':
                this.shadowForm = false;
                break;
        }
    }
    
    initTouchControls() {
        // Show mobile controls
        document.getElementById('mobile-controls').style.display = 'flex';
        
        // Joystick touch events
        const joystickArea = document.getElementById('left-joystick');
        
        joystickArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleJoystickStart(e.touches[0].clientX, e.touches[0].clientY);
        });
        
        joystickArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleJoystickMove(e.touches[0].clientX, e.touches[0].clientY);
        });
        
        joystickArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleJoystickEnd();
        });
        
        // Jump button events
        this.jumpButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.jump = true;
        });
        
        this.jumpButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.jump = false;
        });
        
        // Shadow form button events
        this.shadowButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.shadowForm = true;
        });
        
        this.shadowButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.shadowForm = false;
        });
    }
    
    handleJoystickStart(x, y) {
        this.joystickActive = true;
        
        // Get joystick base position
        const rect = this.joystickBase.getBoundingClientRect();
        this.joystickStartX = rect.left + rect.width / 2;
        this.joystickStartY = rect.top + rect.height / 2;
        
        // Position the joystick thumb
        this.joystickCurrentX = x;
        this.joystickCurrentY = y;
        this.updateJoystickPosition();
    }
    
    handleJoystickMove(x, y) {
        if (!this.joystickActive) return;
        
        this.joystickCurrentX = x;
        this.joystickCurrentY = y;
        this.updateJoystickPosition();
    }
    
    handleJoystickEnd() {
        this.joystickActive = false;
        
        // Reset joystick position
        this.joystickThumb.style.transform = 'translate(-50%, -50%)';
        
        // Reset movement
        this.left = false;
        this.right = false;
    }
    
    updateJoystickPosition() {
        // Calculate distance from center
        const dx = this.joystickCurrentX - this.joystickStartX;
        const dy = this.joystickCurrentY - this.joystickStartY;
        
        // Calculate distance
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Limit distance to joystick radius
        const maxDistance = 40;
        const limitedDistance = Math.min(distance, maxDistance);
        
        // Calculate normalized direction
        const angle = Math.atan2(dy, dx);
        const limitedX = Math.cos(angle) * limitedDistance;
        const limitedY = Math.sin(angle) * limitedDistance;
        
        // Update joystick thumb position
        this.joystickThumb.style.transform = `translate(calc(-50% + ${limitedX}px), calc(-50% + ${limitedY}px))`;
        
        // Update movement based on joystick position
        this.left = dx < -this.joystickThreshold;
        this.right = dx > this.joystickThreshold;
    }
    
    update() {
        // This method can be used for any continuous input processing
        // Currently not needed as we're handling events directly
    }
}

// Initialize controls when the page loads
window.addEventListener('load', () => {
    window.controls = new Controls();
});
