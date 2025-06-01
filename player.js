/**
 * Player - Main character controller for Shadow Echo
 */

class Player extends Entity {
    constructor(x, y) {
        super(x, y, 40, 80, 'midground');
        
        // Movement properties
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 300;
        this.jumpForce = 550;
        this.gravity = 1500;
        this.friction = 0.85;
        this.airFriction = 0.95;
        
        // State tracking
        this.isGrounded = false;
        this.isJumping = false;
        this.isFacingRight = true;
        this.isInShadowForm = false;
        this.isDead = false;
        
        // Shadow form properties
        this.maxShadowTime = 5; // seconds
        this.currentShadowTime = this.maxShadowTime;
        this.shadowRechargeRate = 0.5; // per second
        this.shadowDrainRate = 1; // per second
        
        // Animation properties
        this.sprites = {
            idle: { frames: 8, currentFrame: 0, frameTime: 0.1, timer: 0 },
            run: { frames: 8, currentFrame: 0, frameTime: 0.08, timer: 0 },
            jump: { frames: 4, currentFrame: 0, frameTime: 0.1, timer: 0 },
            fall: { frames: 2, currentFrame: 0, frameTime: 0.1, timer: 0 },
            shadowIdle: { frames: 8, currentFrame: 0, frameTime: 0.1, timer: 0 },
            shadowRun: { frames: 8, currentFrame: 0, frameTime: 0.08, timer: 0 }
        };
        this.currentAnimation = 'idle';
        
        // Collision properties
        this.groundCheckOffset = 42; // Distance from center to feet
        
        // Load sprites
        this.loadSprites();
        
        // Particle effects
        this.particles = [];
        this.maxParticles = 30;
    }
    
    loadSprites() {
        // In a full implementation, we would load actual sprite sheets
        // For this prototype, we'll use colored rectangles and shapes
        this.spriteLoaded = true;
    }
    
    update(deltaTime) {
        if (this.isDead) return;
        
        // Apply input from controls
        this.handleInput();
        
        // Apply physics
        this.applyPhysics(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Handle shadow form
        this.handleShadowForm(deltaTime);
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Update particles
        this.updateParticles(deltaTime);
    }
    
    handleInput() {
        // This will be connected to the Controls module
        if (window.controls) {
            // Movement
            if (controls.left) {
                this.velocityX = -this.speed;
                this.isFacingRight = false;
            } else if (controls.right) {
                this.velocityX = this.speed;
                this.isFacingRight = true;
            }
            
            // Jump
            if (controls.jump && this.isGrounded && !this.isJumping) {
                this.velocityY = -this.jumpForce;
                this.isJumping = true;
                this.isGrounded = false;
                
                // Add jump particles
                this.createJumpParticles();
            }
            
            // Shadow form toggle
            if (controls.shadowForm && !this.shadowFormCooldown) {
                this.toggleShadowForm();
                this.shadowFormCooldown = true;
                
                // Reset cooldown after a short delay
                setTimeout(() => {
                    this.shadowFormCooldown = false;
                }, 300);
            }
        }
    }
    
    applyPhysics(deltaTime) {
        // Apply gravity
        this.velocityY += this.gravity * deltaTime;
        
        // Apply friction
        if (this.isGrounded) {
            this.velocityX *= this.friction;
        } else {
            this.velocityX *= this.airFriction;
        }
        
        // Apply velocity
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // Limit falling speed
        if (this.velocityY > 1000) {
            this.velocityY = 1000;
        }
        
        // Reset horizontal velocity if very small
        if (Math.abs(this.velocityX) < 10) {
            this.velocityX = 0;
        }
    }
    
    checkCollisions() {
        // Reset grounded state
        const wasGrounded = this.isGrounded;
        this.isGrounded = false;
        
        // Get all platforms
        const platforms = window.game ? window.game.entities.filter(e => e instanceof Platform) : [];
        
        platforms.forEach(platform => {
            // Check if player is above platform and falling
            if (this.velocityY >= 0) {
                // Check feet position
                const feetY = this.y + this.groundCheckOffset;
                const prevFeetY = this.y - this.velocityY * (1/60) + this.groundCheckOffset;
                
                if (prevFeetY <= platform.y - platform.height/2 && 
                    feetY >= platform.y - platform.height/2 &&
                    this.x + this.width/4 >= platform.x - platform.width/2 &&
                    this.x - this.width/4 <= platform.x + platform.width/2) {
                    
                    // Land on platform
                    this.y = platform.y - platform.height/2 - this.groundCheckOffset;
                    this.velocityY = 0;
                    this.isGrounded = true;
                    
                    // Reset jumping state
                    if (this.isJumping) {
                        this.isJumping = false;
                        
                        // Create landing particles
                        this.createLandingParticles();
                    }
                }
            }
            
            // Check for horizontal collisions
            if (this.x + this.width/3 > platform.x - platform.width/2 &&
                this.x - this.width/3 < platform.x + platform.width/2 &&
                this.y + this.height/2 > platform.y - platform.height/2 &&
                this.y - this.height/2 < platform.y + platform.height/2) {
                
                // Don't collide if in shadow form and inside shadow
                if (this.isInShadowForm && window.game && window.game.checkPointInShadow(this.x, this.y)) {
                    return;
                }
                
                // Resolve horizontal collision
                if (this.velocityX > 0) {
                    this.x = platform.x - platform.width/2 - this.width/3;
                } else if (this.velocityX < 0) {
                    this.x = platform.x + platform.width/2 + this.width/3;
                }
                
                this.velocityX = 0;
            }
        });
        
        // Check for special objects like puzzles, hazards, etc.
        const specialObjects = window.game ? 
            window.game.entities.filter(e => e.isInteractable || e.isHazard || e.isCollectable) : [];
            
        specialObjects.forEach(obj => {
            if (window.game.checkCollision(this, obj)) {
                if (obj.onPlayerCollision) {
                    obj.onPlayerCollision(this);
                }
            }
        });
        
        // Check if player fell out of the world
        if (window.game && this.y > window.game.worldBounds.bottom) {
            this.die();
        }
    }
    
    handleShadowForm(deltaTime) {
        if (this.isInShadowForm) {
            // Drain shadow time
            this.currentShadowTime -= this.shadowDrainRate * deltaTime;
            
            // Create shadow particles
            if (Math.random() < 0.2) {
                this.createShadowParticles();
            }
            
            // Check if out of shadow time
            if (this.currentShadowTime <= 0) {
                this.exitShadowForm();
            }
            
            // Check if in shadow
            if (window.game && !window.game.checkPointInShadow(this.x, this.y)) {
                // Drain shadow time faster when not in shadow
                this.currentShadowTime -= this.shadowDrainRate * deltaTime * 2;
            }
        } else {
            // Recharge shadow time
            this.currentShadowTime = Math.min(
                this.currentShadowTime + this.shadowRechargeRate * deltaTime,
                this.maxShadowTime
            );
        }
        
        // Update shadow meter UI
        if (window.game && window.game.ui) {
            const shadowMeter = document.getElementById('shadow-meter');
            if (shadowMeter) {
                shadowMeter.style.width = `${(this.currentShadowTime / this.maxShadowTime) * 100}%`;
            }
        }
    }
    
    toggleShadowForm() {
        if (this.isInShadowForm) {
            this.exitShadowForm();
        } else if (this.currentShadowTime > 0.5) {
            this.enterShadowForm();
        }
    }
    
    enterShadowForm() {
        this.isInShadowForm = true;
        
        // Create effect particles
        for (let i = 0; i < 20; i++) {
            this.createShadowParticles();
        }
    }
    
    exitShadowForm() {
        this.isInShadowForm = false;
        
        // Create effect particles
        for (let i = 0; i < 10; i++) {
            this.createShadowExitParticles();
        }
    }
    
    updateAnimation(deltaTime) {
        // Determine current animation
        let newAnimation = 'idle';
        
        if (this.isInShadowForm) {
            if (Math.abs(this.velocityX) > 20) {
                newAnimation = 'shadowRun';
            } else {
                newAnimation = 'shadowIdle';
            }
        } else {
            if (!this.isGrounded) {
                if (this.velocityY < 0) {
                    newAnimation = 'jump';
                } else {
                    newAnimation = 'fall';
                }
            } else if (Math.abs(this.velocityX) > 20) {
                newAnimation = 'run';
            } else {
                newAnimation = 'idle';
            }
        }
        
        // Update animation if changed
        if (newAnimation !== this.currentAnimation) {
            this.currentAnimation = newAnimation;
            this.sprites[this.currentAnimation].currentFrame = 0;
            this.sprites[this.currentAnimation].timer = 0;
        }
        
        // Update animation timer
        const anim = this.sprites[this.currentAnimation];
        anim.timer += deltaTime;
        
        // Advance frame if timer exceeds frame time
        if (anim.timer >= anim.frameTime) {
            anim.currentFrame = (anim.currentFrame + 1) % anim.frames;
            anim.timer = 0;
        }
    }
    
    createJumpParticles() {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.x + (Math.random() * 20 - 10),
                y: this.y + this.groundCheckOffset,
                vx: Math.random() * 60 - 30,
                vy: Math.random() * -100 - 50,
                size: Math.random() * 6 + 2,
                life: Math.random() * 0.5 + 0.2,
                color: this.isInShadowForm ? '#2D2339' : '#5A6970'
            });
        }
    }
    
    createLandingParticles() {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: this.x + (Math.random() * 30 - 15),
                y: this.y + this.groundCheckOffset,
                vx: Math.random() * 80 - 40,
                vy: Math.random() * -80 - 20,
                size: Math.random() * 5 + 3,
                life: Math.random() * 0.6 + 0.3,
                color: this.isInShadowForm ? '#2D2339' : '#5A6970'
            });
        }
    }
    
    createShadowParticles() {
        this.particles.push({
            x: this.x + (Math.random() * 40 - 20),
            y: this.y + (Math.random() * 80 - 40),
            vx: Math.random() * 20 - 10,
            vy: Math.random() * -30 - 10,
            size: Math.random() * 8 + 4,
            life: Math.random() * 0.8 + 0.4,
            color: '#2D2339',
            alpha: 0.7
        });
    }
    
    createShadowExitParticles() {
        this.particles.push({
            x: this.x + (Math.random() * 40 - 20),
            y: this.y + (Math.random() * 80 - 40),
            vx: Math.random() * 40 - 20,
            vy: Math.random() * -40 - 20,
            size: Math.random() * 10 + 5,
            life: Math.random() * 0.6 + 0.3,
            color: '#2D2339',
            alpha: 0.5,
            fadeOut: true
        });
    }
    
    updateParticles(deltaTime) {
        // Update existing particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Update position
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            
            // Apply gravity to particles
            p.vy += 300 * deltaTime;
            
            // Reduce life
            p.life -= deltaTime;
            
            // Fade out
            if (p.fadeOut) {
                p.alpha = p.life;
            }
            
            // Remove dead particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Limit max particles
        if (this.particles.length > this.maxParticles) {
            this.particles.splice(0, this.particles.length - this.maxParticles);
        }
    }
    
    die() {
        if (this.isDead) return;
        
        this.isDead = true;
        this.velocityX = 0;
        this.velocityY = -300; // Small upward bounce
        
        // Create death particles
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: this.x + (Math.random() * 40 - 20),
                y: this.y + (Math.random() * 80 - 40),
                vx: Math.random() * 200 - 100,
                vy: Math.random() * -200 - 100,
                size: Math.random() * 10 + 5,
                life: Math.random() * 1.5 + 0.5,
                color: this.isInShadowForm ? '#2D2339' : '#5A6970',
                fadeOut: true,
                alpha: 1
            });
        }
        
        // Trigger game over after delay
        setTimeout(() => {
            if (window.game) {
                window.game.gameOver();
            }
        }, 1500);
    }
    
    render(ctx) {
        // Render particles behind player
        this.renderParticles(ctx);
        
        // Determine color based on state
        let bodyColor, headColor, limbColor;
        
        if (this.isInShadowForm) {
            bodyColor = '#1A1425';
            headColor = '#2D2339';
            limbColor = '#1A1425';
        } else {
            bodyColor = '#3D4B52';
            headColor = '#2C3539';
            limbColor = '#5A6970';
        }
        
        // Save context for transformations
        ctx.save();
        
        // Position at player center
        ctx.translate(this.x, this.y);
        
        // Flip if facing left
        if (!this.isFacingRight) {
            ctx.scale(-1, 1);
        }
        
        // Draw shadow under player
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, this.groundCheckOffset, 20, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Animation offsets
        let headBob = 0;
        let armSwing = 0;
        let legSwing = 0;
        
        // Apply animation
        const anim = this.sprites[this.currentAnimation];
        const frame = anim.currentFrame;
        
        if (this.currentAnimation === 'run' || this.currentAnimation === 'shadowRun') {
            // Running animation
            headBob = Math.sin(frame / anim.frames * Math.PI * 2) * 3;
            armSwing = Math.sin(frame / anim.frames * Math.PI * 2) * 30;
            legSwing = Math.sin(frame / anim.frames * Math.PI * 2 + Math.PI) * 30;
        } else if (this.currentAnimation === 'jump') {
            // Jump animation
            armSwing = -30;
            legSwing = 15;
        } else if (this.currentAnimation === 'fall') {
            // Fall animation
            armSwing = 20;
            legSwing = -10;
        } else {
            // Idle animation - slight breathing
            headBob = Math.sin(frame / anim.frames * Math.PI * 2) * 1;
        }
        
        // Draw legs
        ctx.fillStyle = limbColor;
        ctx.fillRect(-10, 10, 8, 30 + legSwing/2);
        ctx.fillRect(2, 10, 8, 30 - legSwing/2);
        
        // Draw body
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-15, -25, 30, 40);
        
        // Draw arms
        ctx.fillStyle = limbColor;
        ctx.save();
        ctx.translate(-15, -15);
        ctx.rotate((armSwing - 10) * Math.PI / 180);
        ctx.fillRect(-5, 0, 8, 25);
        ctx.restore();
        
        ctx.save();
        ctx.translate(15, -15);
        ctx.rotate((-armSwing + 10) * Math.PI / 180);
        ctx.fillRect(-3, 0, 8, 25);
        ctx.restore();
        
        // Draw head
        ctx.fillStyle = headColor;
        ctx.fillRect(-12, -50 + headBob, 24, 25);
        
        // Draw eyes
        if (this.isInShadowForm) {
            // Glowing eyes in shadow form
            ctx.fillStyle = '#9E3232';
            ctx.fillRect(-8, -40 + headBob, 5, 3);
            ctx.fillRect(3, -40 + headBob, 5, 3);
        } else {
            // Normal eyes
            ctx.fillStyle = '#0A1921';
            ctx.fillRect(-8, -40 + headBob, 5, 3);
            ctx.fillRect(3, -40 + headBob, 5, 3);
        }
        
        // Shadow form effects
        if (this.isInShadowForm) {
            // Draw shadow aura
            ctx.globalAlpha = 0.3;
            ctx.shadowColor = '#2D2339';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#2D2339';
            ctx.fillRect(-17, -52 + headBob, 34, 27);
            ctx.fillRect(-17, -27, 34, 42);
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        }
        
        // Restore context
        ctx.restore();
    }
    
    renderParticles(ctx) {
        this.particles.forEach(p => {
            ctx.globalAlpha = p.alpha || 1;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    }
}

// Export class
window.Player = Player;
