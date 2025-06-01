/**
 * Game Engine - Core functionality for the Shadow Echo prototype
 */

class Engine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.lastTime = 0;
        this.accumulator = 0;
        this.timestep = 1000/60; // 60 fps
        
        this.entities = [];
        this.lights = [];
        this.shadows = [];
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Calculate game scale based on screen size
        this.scale = Math.min(
            this.canvas.width / 1280,
            this.canvas.height / 720
        );
        
        // Update entities if they exist
        if (this.entities.length > 0) {
            this.entities.forEach(entity => {
                if (entity.onResize) {
                    entity.onResize(this.scale);
                }
            });
        }
    }
    
    start() {
        this.running = true;
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
    
    stop() {
        this.running = false;
    }
    
    gameLoop(timestamp) {
        if (!this.running) return;
        
        // Calculate delta time
        let deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // Avoid spiral of death with large delta times
        if (deltaTime > 200) deltaTime = 200;
        
        // Accumulate time
        this.accumulator += deltaTime;
        
        // Update with fixed timestep
        while (this.accumulator >= this.timestep) {
            this.update(this.timestep / 1000); // Convert to seconds
            this.accumulator -= this.timestep;
        }
        
        // Render
        this.render();
        
        // Next frame
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
    
    update(deltaTime) {
        // Update all entities
        this.entities.forEach(entity => {
            if (entity.update) {
                entity.update(deltaTime);
            }
        });
        
        // Update lights
        this.lights.forEach(light => {
            if (light.update) {
                light.update(deltaTime);
            }
        });
        
        // Calculate shadows
        this.calculateShadows();
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0A1921';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context for camera transformations
        this.ctx.save();
        
        // Apply camera transformations if camera exists
        if (this.camera) {
            this.ctx.translate(
                -this.camera.x + this.canvas.width / 2,
                -this.camera.y + this.canvas.height / 2
            );
        }
        
        // Draw background layers
        this.entities.forEach(entity => {
            if (entity.layer === 'background' && entity.render) {
                entity.render(this.ctx);
            }
        });
        
        // Draw shadow areas
        this.renderShadows();
        
        // Draw midground entities
        this.entities.forEach(entity => {
            if (entity.layer === 'midground' && entity.render) {
                entity.render(this.ctx);
            }
        });
        
        // Draw foreground entities
        this.entities.forEach(entity => {
            if (entity.layer === 'foreground' && entity.render) {
                entity.render(this.ctx);
            }
        });
        
        // Draw lights
        this.renderLights();
        
        // Draw UI elements that should move with the camera
        this.entities.forEach(entity => {
            if (entity.layer === 'ui-world' && entity.render) {
                entity.render(this.ctx);
            }
        });
        
        // Restore context
        this.ctx.restore();
        
        // Draw screen-space UI elements
        this.entities.forEach(entity => {
            if (entity.layer === 'ui' && entity.render) {
                entity.render(this.ctx);
            }
        });
    }
    
    addEntity(entity) {
        this.entities.push(entity);
        return entity;
    }
    
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
    }
    
    addLight(light) {
        this.lights.push(light);
        return light;
    }
    
    removeLight(light) {
        const index = this.lights.indexOf(light);
        if (index !== -1) {
            this.lights.splice(index, 1);
        }
    }
    
    setCamera(camera) {
        this.camera = camera;
    }
    
    calculateShadows() {
        // Clear shadows
        this.shadows = [];
        
        // Get all shadow casters
        const shadowCasters = this.entities.filter(entity => entity.castsShadow);
        
        // For each light, calculate shadows
        this.lights.forEach(light => {
            shadowCasters.forEach(caster => {
                if (caster.calculateShadow) {
                    const shadow = caster.calculateShadow(light);
                    if (shadow) {
                        this.shadows.push(shadow);
                    }
                }
            });
        });
    }
    
    renderShadows() {
        // Draw shadow areas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        
        this.shadows.forEach(shadow => {
            this.ctx.beginPath();
            this.ctx.moveTo(shadow.points[0].x, shadow.points[0].y);
            
            for (let i = 1; i < shadow.points.length; i++) {
                this.ctx.lineTo(shadow.points[i].x, shadow.points[i].y);
            }
            
            this.ctx.closePath();
            this.ctx.fill();
        });
    }
    
    renderLights() {
        // Draw lights with gradients
        this.lights.forEach(light => {
            const gradient = this.ctx.createRadialGradient(
                light.x, light.y, 0,
                light.x, light.y, light.radius
            );
            
            gradient.addColorStop(0, `rgba(${light.color.r}, ${light.color.g}, ${light.color.b}, ${light.intensity})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    // Collision detection utilities
    checkCollision(entity1, entity2) {
        // Simple AABB collision
        return (
            entity1.x < entity2.x + entity2.width &&
            entity1.x + entity1.width > entity2.x &&
            entity1.y < entity2.y + entity2.height &&
            entity1.y + entity1.height > entity2.y
        );
    }
    
    checkPointInShadow(x, y) {
        // Check if a point is in any shadow
        for (const shadow of this.shadows) {
            if (this.pointInPolygon(x, y, shadow.points)) {
                return true;
            }
        }
        return false;
    }
    
    pointInPolygon(x, y, points) {
        // Ray casting algorithm to determine if point is in polygon
        let inside = false;
        
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i].x;
            const yi = points[i].y;
            const xj = points[j].x;
            const yj = points[j].y;
            
            const intersect = ((yi > y) !== (yj > y)) && 
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                
            if (intersect) inside = !inside;
        }
        
        return inside;
    }
}

// Camera class for following the player
class Camera {
    constructor(target, width, height) {
        this.target = target;
        this.width = width;
        this.height = height;
        this.x = target ? target.x : 0;
        this.y = target ? target.y : 0;
        this.smoothing = 0.1; // Lower = smoother
    }
    
    update() {
        if (!this.target) return;
        
        // Smooth follow
        this.x += (this.target.x - this.x) * this.smoothing;
        this.y += (this.target.y - this.y) * this.smoothing;
    }
}

// Light class
class Light {
    constructor(x, y, radius, color, intensity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color || { r: 255, g: 255, b: 255 };
        this.intensity = intensity || 0.8;
    }
    
    update(deltaTime) {
        // Can be extended for moving lights
    }
}

// Basic entity class
class Entity {
    constructor(x, y, width, height, layer) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.layer = layer || 'midground';
        this.castsShadow = false;
    }
    
    update(deltaTime) {
        // Override in subclasses
    }
    
    render(ctx) {
        // Default rendering - can be overridden
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    }
    
    calculateShadow(light) {
        // Only implement if castsShadow is true
        return null;
    }
}

// Platform class
class Platform extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height, 'midground');
        this.castsShadow = true;
        this.color = '#2C3539';
    }
    
    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    }
    
    calculateShadow(light) {
        // Calculate corners
        const corners = [
            { x: this.x - this.width/2, y: this.y - this.height/2 }, // Top-left
            { x: this.x + this.width/2, y: this.y - this.height/2 }, // Top-right
            { x: this.x + this.width/2, y: this.y + this.height/2 }, // Bottom-right
            { x: this.x - this.width/2, y: this.y + this.height/2 }  // Bottom-left
        ];
        
        // Calculate shadow points
        const shadowPoints = [];
        
        corners.forEach(corner => {
            // Vector from light to corner
            const dx = corner.x - light.x;
            const dy = corner.y - light.y;
            
            // Normalize and extend
            const length = Math.sqrt(dx * dx + dy * dy);
            const nx = dx / length;
            const ny = dy / length;
            
            // Add corner and extended point
            shadowPoints.push(corner);
            shadowPoints.push({
                x: corner.x + nx * light.radius * 2,
                y: corner.y + ny * light.radius * 2
            });
        });
        
        // Sort points to form a proper polygon
        // This is a simplified approach and might need improvement for complex shapes
        const center = { x: this.x, y: this.y };
        shadowPoints.sort((a, b) => {
            const angleA = Math.atan2(a.y - center.y, a.x - center.x);
            const angleB = Math.atan2(b.y - center.y, b.x - center.x);
            return angleA - angleB;
        });
        
        return { points: shadowPoints };
    }
}

// Export classes
window.Engine = Engine;
window.Camera = Camera;
window.Light = Light;
window.Entity = Entity;
window.Platform = Platform;
