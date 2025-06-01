/**
 * Levels - Level design and puzzle mechanics for Shadow Echo
 */

class Level {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.entities = [];
        this.lights = [];
        this.startX = 0;
        this.startY = 0;
        this.exitX = 0;
        this.exitY = 0;
        this.width = 0;
        this.height = 0;
        this.backgroundColor = '#0A1921';
    }
    
    addEntity(entity) {
        this.entities.push(entity);
        return entity;
    }
    
    addLight(light) {
        this.lights.push(light);
        return light;
    }
    
    load(game) {
        // Clear existing entities and lights
        game.entities = game.entities.filter(e => e.isPermanent);
        game.lights = [];
        
        // Set world bounds
        game.worldBounds = {
            left: -this.width / 2,
            right: this.width / 2,
            top: -this.height / 2,
            bottom: this.height / 2
        };
        
        // Add level entities
        this.entities.forEach(entity => {
            game.addEntity(entity);
        });
        
        // Add level lights
        this.lights.forEach(light => {
            game.addLight(light);
        });
        
        // Create player at start position
        const player = new Player(this.startX, this.startY);
        game.addEntity(player);
        game.player = player;
        
        // Set up camera to follow player
        const camera = new Camera(player, game.canvas.width, game.canvas.height);
        game.setCamera(camera);
        
        // Set background color
        game.backgroundColor = this.backgroundColor;
    }
}

// Interactive objects for puzzles
class LightSwitch extends Entity {
    constructor(x, y, targetLights) {
        super(x, y, 30, 30, 'midground');
        this.isInteractable = true;
        this.isOn = false;
        this.targetLights = targetLights || [];
        this.interactionRadius = 60;
        this.color = '#3D4B52';
        this.activeColor = '#BFA97C';
    }
    
    render(ctx) {
        // Draw base
        ctx.fillStyle = '#2C3539';
        ctx.fillRect(this.x - 15, this.y - 15, 30, 30);
        
        // Draw switch
        ctx.fillStyle = this.isOn ? this.activeColor : this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw interaction hint when player is nearby
        if (window.game && window.game.player) {
            const player = window.game.player;
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.interactionRadius) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw hint text
                ctx.fillStyle = 'white';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Press', this.x, this.y - 25);
            }
        }
    }
    
    update(deltaTime) {
        // Check for player interaction
        if (window.game && window.game.player && !this.cooldown) {
            const player = window.game.player;
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.interactionRadius && window.controls && window.controls.jump) {
                this.toggle();
                
                // Set cooldown to prevent multiple toggles
                this.cooldown = true;
                setTimeout(() => {
                    this.cooldown = false;
                }, 500);
            }
        }
    }
    
    toggle() {
        this.isOn = !this.isOn;
        
        // Toggle target lights
        this.targetLights.forEach(lightId => {
            const light = window.game.lights.find(l => l.id === lightId);
            if (light) {
                if (this.isOn) {
                    light.intensity = light.maxIntensity || 1.0;
                } else {
                    light.intensity = 0;
                }
            }
        });
        
        // Create particles
        if (window.game) {
            for (let i = 0; i < 10; i++) {
                const particle = {
                    x: this.x + (Math.random() * 20 - 10),
                    y: this.y + (Math.random() * 20 - 10),
                    vx: Math.random() * 40 - 20,
                    vy: Math.random() * -40 - 10,
                    size: Math.random() * 5 + 2,
                    life: Math.random() * 0.5 + 0.2,
                    color: this.isOn ? this.activeColor : this.color,
                    alpha: 0.8,
                    fadeOut: true
                };
                
                if (window.game.player) {
                    window.game.player.particles.push(particle);
                }
            }
        }
    }
    
    onPlayerCollision(player) {
        // This is called when the player collides with this object
        // We don't need to do anything here as interaction is handled in update
    }
}

class MovableMirror extends Entity {
    constructor(x, y) {
        super(x, y, 40, 80, 'midground');
        this.isInteractable = true;
        this.isBeingMoved = false;
        this.angle = 45; // degrees
        this.reflectivity = 0.8;
        this.interactionRadius = 60;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle * Math.PI / 180);
        
        // Draw mirror frame
        ctx.fillStyle = '#3D4B52';
        ctx.fillRect(-20, -40, 40, 80);
        
        // Draw mirror surface
        ctx.fillStyle = '#D9C8A3';
        ctx.fillRect(-15, -35, 30, 70);
        
        // Draw handle
        ctx.fillStyle = '#5A6970';
        ctx.fillRect(-5, -45, 10, 10);
        
        ctx.restore();
        
        // Draw interaction hint when player is nearby
        if (window.game && window.game.player && !this.isBeingMoved) {
            const player = window.game.player;
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.interactionRadius) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, 30, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw hint text
                ctx.fillStyle = 'white';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Move', this.x, this.y - 50);
            }
        }
        
        // Draw light reflection
        this.renderLightReflection(ctx);
    }
    
    renderLightReflection(ctx) {
        if (!window.game) return;
        
        // Check for lights hitting the mirror
        window.game.lights.forEach(light => {
            if (light.intensity <= 0.1) return;
            
            // Calculate vector from light to mirror
            const dx = this.x - light.x;
            const dy = this.y - light.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Skip if light is too far
            if (distance > light.radius) return;
            
            // Calculate normalized direction
            const nx = dx / distance;
            const ny = dy / distance;
            
            // Calculate mirror normal vector (perpendicular to mirror surface)
            const mirrorAngleRad = this.angle * Math.PI / 180;
            const mirrorNormalX = Math.cos(mirrorAngleRad);
            const mirrorNormalY = Math.sin(mirrorAngleRad);
            
            // Calculate dot product
            const dot = nx * mirrorNormalX + ny * mirrorNormalY;
            
            // Skip if light is not hitting mirror front
            if (dot <= 0) return;
            
            // Calculate reflection vector
            const reflectX = nx - 2 * dot * mirrorNormalX;
            const reflectY = ny - 2 * dot * mirrorNormalY;
            
            // Draw reflection beam
            const beamLength = light.radius * this.reflectivity;
            const endX = this.x + reflectX * beamLength;
            const endY = this.y + reflectY * beamLength;
            
            // Create gradient for beam
            const gradient = ctx.createLinearGradient(this.x, this.y, endX, endY);
            gradient.addColorStop(0, `rgba(${light.color.r}, ${light.color.g}, ${light.color.b}, ${light.intensity * this.reflectivity})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 20;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.lineWidth = 1;
            
            // Create a virtual light at the end of the beam
            if (!this.virtualLight) {
                this.virtualLight = new Light(
                    endX, 
                    endY, 
                    light.radius * 0.7, 
                    light.color, 
                    light.intensity * this.reflectivity * 0.8
                );
                window.game.addLight(this.virtualLight);
            } else {
                this.virtualLight.x = endX;
                this.virtualLight.y = endY;
                this.virtualLight.intensity = light.intensity * this.reflectivity * 0.8;
            }
        });
    }
    
    update(deltaTime) {
        // Check for player interaction
        if (window.game && window.game.player && !this.cooldown) {
            const player = window.game.player;
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.interactionRadius && window.controls && window.controls.jump) {
                this.toggleMoving();
                
                // Set cooldown to prevent multiple toggles
                this.cooldown = true;
                setTimeout(() => {
                    this.cooldown = false;
                }, 500);
            }
        }
        
        // Handle movement when being moved
        if (this.isBeingMoved && window.controls) {
            if (window.controls.left) {
                this.angle -= 45 * deltaTime;
            }
            if (window.controls.right) {
                this.angle += 45 * deltaTime;
            }
            
            // Normalize angle
            this.angle = this.angle % 360;
            if (this.angle < 0) this.angle += 360;
            
            // Exit moving mode if jump is pressed again
            if (window.controls.jump && !this.cooldown) {
                this.toggleMoving();
                
                // Set cooldown
                this.cooldown = true;
                setTimeout(() => {
                    this.cooldown = false;
                }, 500);
            }
        }
    }
    
    toggleMoving() {
        this.isBeingMoved = !this.isBeingMoved;
        
        // Create particles
        if (window.game && window.game.player) {
            for (let i = 0; i < 5; i++) {
                const particle = {
                    x: this.x + (Math.random() * 40 - 20),
                    y: this.y + (Math.random() * 80 - 40),
                    vx: Math.random() * 30 - 15,
                    vy: Math.random() * -30 - 10,
                    size: Math.random() * 4 + 2,
                    life: Math.random() * 0.4 + 0.2,
                    color: '#D9C8A3',
                    alpha: 0.6,
                    fadeOut: true
                };
                
                window.game.player.particles.push(particle);
            }
        }
    }
}

class ShadowGate extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height, 'midground');
        this.isShadowGate = true;
        this.color = '#1A1425';
        this.particleTimer = 0;
    }
    
    render(ctx) {
        // Draw gate
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // Draw shadow particles
        if (Math.random() < 0.1) {
            this.createParticle();
        }
    }
    
    update(deltaTime) {
        this.particleTimer += deltaTime;
        
        // Create particles periodically
        if (this.particleTimer > 0.2) {
            this.createParticle();
            this.particleTimer = 0;
        }
        
        // Check for player collision
        if (window.game && window.game.player) {
            const player = window.game.player;
            
            if (window.game.checkCollision(this, player)) {
                // Only allow passage if player is in shadow form
                if (!player.isInShadowForm) {
                    // Block player
                    if (player.x < this.x) {
                        player.x = this.x - this.width/2 - player.width/2;
                    } else {
                        player.x = this.x + this.width/2 + player.width/2;
                    }
                    player.velocityX = 0;
                    
                    // Create blocking particles
                    for (let i = 0; i < 3; i++) {
                        this.createBlockParticle(player.x, player.y);
                    }
                }
            }
        }
    }
    
    createParticle() {
        if (!window.game || !window.game.player) return;
        
        // Random position along the gate
        const x = this.x + (Math.random() * this.width - this.width/2);
        const y = this.y + (Math.random() * this.height - this.height/2);
        
        const particle = {
            x: x,
            y: y,
            vx: Math.random() * 10 - 5,
            vy: Math.random() * -20 - 10,
            size: Math.random() * 5 + 2,
            life: Math.random() * 0.8 + 0.4,
            color: '#2D2339',
            alpha: 0.5,
            fadeOut: true
        };
        
        window.game.player.particles.push(particle);
    }
    
    createBlockParticle(x, y) {
        if (!window.game || !window.game.player) return;
        
        const particle = {
            x: x + (Math.random() * 20 - 10),
            y: y + (Math.random() * 40 - 20),
            vx: Math.random() * 40 - 20,
            vy: Math.random() * -30 - 10,
            size: Math.random() * 6 + 3,
            life: Math.random() * 0.5 + 0.3,
            color: '#2D2339',
            alpha: 0.7,
            fadeOut: true
        };
        
        window.game.player.particles.push(particle);
    }
}

class LevelExit extends Entity {
    constructor(x, y) {
        super(x, y, 60, 100, 'midground');
        this.isExit = true;
        this.particleTimer = 0;
    }
    
    render(ctx) {
        // Draw exit portal
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, 40
        );
        
        gradient.addColorStop(0, 'rgba(217, 200, 163, 0.8)');
        gradient.addColorStop(0.6, 'rgba(191, 169, 124, 0.4)');
        gradient.addColorStop(1, 'rgba(191, 169, 124, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, 30, 50, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw particles
        if (Math.random() < 0.2) {
            this.createParticle();
        }
    }
    
    update(deltaTime) {
        this.particleTimer += deltaTime;
        
        // Create particles periodically
        if (this.particleTimer > 0.1) {
            this.createParticle();
            this.particleTimer = 0;
        }
        
        // Check for player collision
        if (window.game && window.game.player) {
            const player = window.game.player;
            
            if (window.game.checkCollision(this, player)) {
                // Level complete!
                window.game.levelComplete();
            }
        }
    }
    
    createParticle() {
        if (!window.game || !window.game.player) return;
        
        // Random angle
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 30;
        
        const x = this.x + Math.cos(angle) * distance;
        const y = this.y + Math.sin(angle) * distance;
        
        const particle = {
            x: x,
            y: y,
            vx: Math.cos(angle) * (Math.random() * 10 + 5),
            vy: Math.sin(angle) * (Math.random() * 10 + 5),
            size: Math.random() * 4 + 2,
            life: Math.random() * 0.6 + 0.3,
            color: '#D9C8A3',
            alpha: 0.6,
            fadeOut: true
        };
        
        window.game.player.particles.push(particle);
    }
}

// Create levels
function createLevels() {
    const levels = [];
    
    // Tutorial Level
    const tutorialLevel = new Level(1, "The Awakening");
    tutorialLevel.width = 2000;
    tutorialLevel.height = 1000;
    tutorialLevel.startX = -900;
    tutorialLevel.startY = 300;
    tutorialLevel.exitX = 900;
    tutorialLevel.exitY = 300;
    tutorialLevel.backgroundColor = '#0A1921';
    
    // Add ground
    tutorialLevel.addEntity(new Platform(-900, 400, 200, 40));
    tutorialLevel.addEntity(new Platform(-700, 400, 200, 40));
    tutorialLevel.addEntity(new Platform(-500, 400, 200, 40));
    tutorialLevel.addEntity(new Platform(-300, 400, 200, 40));
    tutorialLevel.addEntity(new Platform(-100, 400, 200, 40));
    tutorialLevel.addEntity(new Platform(100, 400, 200, 40));
    tutorialLevel.addEntity(new Platform(300, 400, 200, 40));
    tutorialLevel.addEntity(new Platform(500, 400, 200, 40));
    tutorialLevel.addEntity(new Platform(700, 400, 200, 40));
    tutorialLevel.addEntity(new Platform(900, 400, 200, 40));
    
    // Add platforms
    tutorialLevel.addEntity(new Platform(-600, 300, 100, 20));
    tutorialLevel.addEntity(new Platform(-400, 250, 100, 20));
    tutorialLevel.addEntity(new Platform(-200, 200, 100, 20));
    tutorialLevel.addEntity(new Platform(0, 200, 100, 20));
    tutorialLevel.addEntity(new Platform(200, 250, 100, 20));
    tutorialLevel.addEntity(new Platform(400, 300, 100, 20));
    tutorialLevel.addEntity(new Platform(600, 350, 100, 20));
    
    // Add shadow gate
    tutorialLevel.addEntity(new ShadowGate(500, 350, 20, 100));
    
    // Add lights
    const light1 = tutorialLevel.addLight(new Light(-800, 200, 300, {r: 255, g: 220, b: 180}, 0.8));
    light1.id = 'light1';
    
    const light2 = tutorialLevel.addLight(new Light(-400, 100, 250, {r: 255, g: 220, b: 180}, 0.7));
    light2.id = 'light2';
    
    const light3 = tutorialLevel.addLight(new Light(0, 50, 300, {r: 255, g: 220, b: 180}, 0.0));
    light3.id = 'light3';
    
    const light4 = tutorialLevel.addLight(new Light(400, 100, 250, {r: 255, g: 220, b: 180}, 0.7));
    light4.id = 'light4';
    
    const light5 = tutorialLevel.addLight(new Light(800, 200, 300, {r: 255, g: 220, b: 180}, 0.8));
    light5.id = 'light5';
    
    // Add light switch
    tutorialLevel.addEntity(new LightSwitch(-200, 150, ['light3']));
    
    // Add movable mirror
    tutorialLevel.addEntity(new MovableMirror(300, 200));
    
    // Add level exit
    tutorialLevel.addEntity(new LevelExit(900, 300));
    
    levels.push(tutorialLevel);
    
    // Puzzle Level
    const puzzleLevel = new Level(2, "Shadow and Light");
    puzzleLevel.width = 2400;
    puzzleLevel.height = 1200;
    puzzleLevel.startX = -1100;
    puzzleLevel.startY = 300;
    puzzleLevel.exitX = 1100;
    puzzleLevel.exitY = -400;
    puzzleLevel.backgroundColor = '#0A1921';
    
    // Add ground
    puzzleLevel.addEntity(new Platform(-1100, 400, 200, 40));
    puzzleLevel.addEntity(new Platform(-900, 400, 200, 40));
    puzzleLevel.addEntity(new Platform(-700, 400, 200, 40));
    puzzleLevel.addEntity(new Platform(-500, 400, 200, 40));
    puzzleLevel.addEntity(new Platform(-300, 400, 200, 40));
    puzzleLevel.addEntity(new Platform(-100, 400, 200, 40));
    puzzleLevel.addEntity(new Platform(100, 400, 200, 40));
    puzzleLevel.addEntity(new Platform(300, 400, 200, 40));
    puzzleLevel.addEntity(new Platform(500, 400, 200, 40));
    puzzleLevel.addEntity(new Platform(700, 400, 200, 40));
    puzzleLevel.addEntity(new Platform(900, 400, 200, 40));
    puzzleLevel.addEntity(new Platform(1100, 400, 200, 40));
    
    // Add vertical platforms
    puzzleLevel.addEntity(new Platform(1100, 300, 40, 200));
    puzzleLevel.addEntity(new Platform(1100, 100, 40, 200));
    puzzleLevel.addEntity(new Platform(1100, -100, 40, 200));
    puzzleLevel.addEntity(new Platform(1100, -300, 40, 200));
    
    // Add upper platforms
    puzzleLevel.addEntity(new Platform(900, -400, 200, 40));
    puzzleLevel.addEntity(new Platform(700, -400, 200, 40));
    puzzleLevel.addEntity(new Platform(500, -400, 200, 40));
    puzzleLevel.addEntity(new Platform(300, -400, 200, 40));
    
    // Add middle platforms
    puzzleLevel.addEntity(new Platform(-800, 200, 100, 20));
    puzzleLevel.addEntity(new Platform(-600, 100, 100, 20));
    puzzleLevel.addEntity(new Platform(-400, 0, 100, 20));
    puzzleLevel.addEntity(new Platform(-200, -100, 100, 20));
    puzzleLevel.addEntity(new Platform(0, -200, 100, 20));
    puzzleLevel.addEntity(new Platform(200, -300, 100, 20));
    puzzleLevel.addEntity(new Platform(400, -400, 100, 20));
    
    // Add shadow gates
    puzzleLevel.addEntity(new ShadowGate(-300, 0, 20, 100));
    puzzleLevel.addEntity(new ShadowGate(100, -200, 20, 100));
    puzzleLevel.addEntity(new ShadowGate(500, -400, 20, 100));
    
    // Add lights
    const pl1 = puzzleLevel.addLight(new Light(-900, 200, 300, {r: 255, g: 220, b: 180}, 0.8));
    pl1.id = 'pl1';
    
    const pl2 = puzzleLevel.addLight(new Light(-500, 0, 250, {r: 255, g: 220, b: 180}, 0.0));
    pl2.id = 'pl2';
    
    const pl3 = puzzleLevel.addLight(new Light(-100, -200, 300, {r: 255, g: 220, b: 180}, 0.0));
    pl3.id = 'pl3';
    
    const pl4 = puzzleLevel.addLight(new Light(300, -300, 250, {r: 255, g: 220, b: 180}, 0.7));
    pl4.id = 'pl4';
    
    const pl5 = puzzleLevel.addLight(new Light(700, -400, 300, {r: 255, g: 220, b: 180}, 0.8));
    pl5.id = 'pl5';
    
    // Add light switches
    puzzleLevel.addEntity(new LightSwitch(-700, 50, ['pl2']));
    puzzleLevel.addEntity(new LightSwitch(-300, -50, ['pl3']));
    
    // Add movable mirrors
    puzzleLevel.addEntity(new MovableMirror(-400, -50));
    puzzleLevel.addEntity(new MovableMirror(0, -250));
    
    // Add level exit
    puzzleLevel.addEntity(new LevelExit(1100, -400));
    
    levels.push(puzzleLevel);
    
    return levels;
}

// Export levels
window.createLevels = createLevels;
