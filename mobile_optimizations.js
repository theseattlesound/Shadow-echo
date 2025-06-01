/**
 * Mobile Optimizations - Performance and usability improvements for mobile devices
 */

class MobileOptimizer {
    constructor(game) {
        this.game = game;
        this.isMobile = this.detectMobile();
        this.performanceMode = false;
        this.lastFPSCheck = 0;
        this.frameCount = 0;
        this.currentFPS = 60;
        
        // Initialize optimizations
        if (this.isMobile) {
            this.initOptimizations();
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
    
    initOptimizations() {
        // Add performance mode toggle
        this.createPerformanceToggle();
        
        // Add touch control size adjustment
        this.optimizeTouchControls();
        
        // Add FPS monitor
        this.initFPSMonitor();
        
        // Add device orientation handling
        this.handleOrientation();
        
        // Optimize rendering for mobile
        this.optimizeRendering();
    }
    
    createPerformanceToggle() {
        // Create performance mode toggle button
        const toggle = document.createElement('button');
        toggle.id = 'performance-toggle';
        toggle.textContent = 'Performance Mode: OFF';
        toggle.style.position = 'absolute';
        toggle.style.top = '10px';
        toggle.style.right = '10px';
        toggle.style.padding = '5px 10px';
        toggle.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        toggle.style.color = 'white';
        toggle.style.border = 'none';
        toggle.style.borderRadius = '5px';
        toggle.style.fontSize = '12px';
        toggle.style.zIndex = '100';
        
        // Add click event
        toggle.addEventListener('click', () => {
            this.performanceMode = !this.performanceMode;
            toggle.textContent = `Performance Mode: ${this.performanceMode ? 'ON' : 'OFF'}`;
            this.applyPerformanceMode();
        });
        
        // Add to document
        document.body.appendChild(toggle);
    }
    
    applyPerformanceMode() {
        if (!this.game || !this.game.engine) return;
        
        if (this.performanceMode) {
            // Reduce shadow quality
            this.game.engine.shadowQuality = 0.5;
            
            // Reduce particle count
            if (this.game.player) {
                this.game.player.maxParticles = 10;
            }
            
            // Reduce light radius
            this.game.lights.forEach(light => {
                light.originalRadius = light.radius;
                light.radius *= 0.8;
            });
            
            // Disable some visual effects
            this.game.engine.disableEffects = true;
        } else {
            // Restore shadow quality
            this.game.engine.shadowQuality = 1.0;
            
            // Restore particle count
            if (this.game.player) {
                this.game.player.maxParticles = 30;
            }
            
            // Restore light radius
            this.game.lights.forEach(light => {
                if (light.originalRadius) {
                    light.radius = light.originalRadius;
                }
            });
            
            // Enable visual effects
            this.game.engine.disableEffects = false;
        }
    }
    
    optimizeTouchControls() {
        // Get device pixel ratio and screen size
        const pixelRatio = window.devicePixelRatio || 1;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Adjust joystick size based on screen size
        const joystickBase = document.querySelector('.joystick-base');
        const joystickThumb = document.querySelector('.joystick-thumb');
        
        if (joystickBase && joystickThumb) {
            // Calculate optimal sizes
            const baseSize = Math.min(120, Math.max(80, screenWidth * 0.25));
            const thumbSize = baseSize * 0.5;
            
            // Apply sizes
            joystickBase.style.width = `${baseSize}px`;
            joystickBase.style.height = `${baseSize}px`;
            joystickThumb.style.width = `${thumbSize}px`;
            joystickThumb.style.height = `${thumbSize}px`;
        }
        
        // Adjust action buttons
        const actionButtons = document.querySelectorAll('.action-button');
        
        actionButtons.forEach(button => {
            // Calculate optimal size
            const buttonSize = Math.min(100, Math.max(70, screenWidth * 0.2));
            
            // Apply size
            button.style.width = `${buttonSize}px`;
            button.style.height = `${buttonSize}px`;
            
            // Increase touch target area
            button.style.padding = '10px';
        });
        
        // Add touch feedback
        this.addTouchFeedback();
    }
    
    addTouchFeedback() {
        const buttons = document.querySelectorAll('.action-button');
        
        buttons.forEach(button => {
            button.addEventListener('touchstart', () => {
                button.style.transform = 'scale(0.95)';
                button.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
                
                // Create ripple effect
                const ripple = document.createElement('span');
                ripple.classList.add('ripple');
                ripple.style.position = 'absolute';
                ripple.style.width = '100%';
                ripple.style.height = '100%';
                ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                ripple.style.borderRadius = '50%';
                ripple.style.transform = 'scale(0)';
                ripple.style.animation = 'ripple 0.6s linear';
                ripple.style.opacity = '1';
                
                button.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 700);
            });
            
            button.addEventListener('touchend', () => {
                button.style.transform = 'scale(1)';
                button.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            });
        });
        
        // Add ripple animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    initFPSMonitor() {
        // Create FPS counter
        const fpsCounter = document.createElement('div');
        fpsCounter.id = 'fps-counter';
        fpsCounter.style.position = 'absolute';
        fpsCounter.style.top = '10px';
        fpsCounter.style.left = '10px';
        fpsCounter.style.padding = '5px';
        fpsCounter.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        fpsCounter.style.color = 'white';
        fpsCounter.style.fontSize = '12px';
        fpsCounter.style.zIndex = '100';
        fpsCounter.textContent = '60 FPS';
        
        // Add to document
        document.body.appendChild(fpsCounter);
        
        // Update FPS counter
        setInterval(() => {
            const now = performance.now();
            const elapsed = now - this.lastFPSCheck;
            
            if (elapsed >= 1000) {
                this.currentFPS = Math.round((this.frameCount * 1000) / elapsed);
                fpsCounter.textContent = `${this.currentFPS} FPS`;
                
                // Auto-enable performance mode if FPS is low
                if (this.currentFPS < 30 && !this.performanceMode) {
                    this.performanceMode = true;
                    document.getElementById('performance-toggle').textContent = 'Performance Mode: ON';
                    this.applyPerformanceMode();
                }
                
                this.lastFPSCheck = now;
                this.frameCount = 0;
            }
            
            this.frameCount++;
        }, 100);
    }
    
    handleOrientation() {
        // Check orientation and show warning if needed
        const checkOrientation = () => {
            const isLandscape = window.innerWidth > window.innerHeight;
            
            // Get or create orientation warning
            let warning = document.getElementById('orientation-warning');
            
            if (!isLandscape) {
                // Create warning if it doesn't exist
                if (!warning) {
                    warning = document.createElement('div');
                    warning.id = 'orientation-warning';
                    warning.style.position = 'fixed';
                    warning.style.top = '0';
                    warning.style.left = '0';
                    warning.style.width = '100%';
                    warning.style.height = '100%';
                    warning.style.backgroundColor = 'rgba(10, 25, 33, 0.9)';
                    warning.style.color = 'white';
                    warning.style.display = 'flex';
                    warning.style.flexDirection = 'column';
                    warning.style.justifyContent = 'center';
                    warning.style.alignItems = 'center';
                    warning.style.zIndex = '1000';
                    warning.innerHTML = `
                        <div style="text-align: center; padding: 20px;">
                            <h2>Please Rotate Your Device</h2>
                            <p>Shadow Echo works best in landscape mode.</p>
                            <div style="margin-top: 20px; font-size: 40px; transform: rotate(90deg);">⟳</div>
                        </div>
                    `;
                    
                    document.body.appendChild(warning);
                } else {
                    warning.style.display = 'flex';
                }
            } else if (warning) {
                warning.style.display = 'none';
            }
        };
        
        // Check orientation on load and resize
        window.addEventListener('load', checkOrientation);
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);
    }
    
    optimizeRendering() {
        // Add this method to the game engine's render loop
        const originalRender = this.game.engine.render;
        
        this.game.engine.render = () => {
            // Skip rendering if tab is not visible
            if (document.hidden) return;
            
            // Call original render method
            originalRender.call(this.game.engine);
        };
        
        // Add touch control hints
        this.addTouchHints();
    }
    
    addTouchHints() {
        // Create tutorial hints for mobile controls
        const createHint = (text, x, y, duration = 5000) => {
            const hint = document.createElement('div');
            hint.className = 'touch-hint';
            hint.textContent = text;
            hint.style.position = 'absolute';
            hint.style.left = `${x}px`;
            hint.style.top = `${y}px`;
            hint.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            hint.style.color = 'white';
            hint.style.padding = '10px';
            hint.style.borderRadius = '5px';
            hint.style.fontSize = '14px';
            hint.style.zIndex = '100';
            hint.style.transform = 'translate(-50%, -50%)';
            hint.style.opacity = '0';
            hint.style.transition = 'opacity 0.5s';
            
            document.body.appendChild(hint);
            
            // Fade in
            setTimeout(() => {
                hint.style.opacity = '1';
            }, 100);
            
            // Fade out and remove
            setTimeout(() => {
                hint.style.opacity = '0';
                setTimeout(() => {
                    hint.remove();
                }, 500);
            }, duration);
            
            return hint;
        };
        
        // Show hints when game starts
        const showHints = () => {
            // Get joystick position
            const joystickBase = document.querySelector('.joystick-base');
            const jumpButton = document.getElementById('jump-button');
            const shadowButton = document.getElementById('shadow-button');
            
            if (joystickBase && jumpButton && shadowButton) {
                const joystickRect = joystickBase.getBoundingClientRect();
                const jumpRect = jumpButton.getBoundingClientRect();
                const shadowRect = shadowButton.getBoundingClientRect();
                
                // Show movement hint
                setTimeout(() => {
                    createHint('Drag to move', joystickRect.left + joystickRect.width/2, joystickRect.top + joystickRect.height/2);
                }, 1000);
                
                // Show jump hint
                setTimeout(() => {
                    createHint('Tap to jump', jumpRect.left + jumpRect.width/2, jumpRect.top + jumpRect.height/2);
                }, 3000);
                
                // Show shadow form hint
                setTimeout(() => {
                    createHint('Tap to transform', shadowRect.left + shadowRect.width/2, shadowRect.top + shadowRect.height/2);
                }, 5000);
            }
        };
        
        // Show hints when game starts
        document.getElementById('start-button').addEventListener('click', () => {
            setTimeout(showHints, 500);
        });
    }
}

// Initialize mobile optimizations when the game loads
window.addEventListener('load', () => {
    // Wait for game to initialize
    setTimeout(() => {
        if (window.game) {
            window.mobileOptimizer = new MobileOptimizer(window.game);
        }
    }, 500);
});
