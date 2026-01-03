// World Objects & Obstacles
import CONFIG from './config.js';

class World {
    constructor(Matter) {
        this.Matter = Matter;
        this.Bodies = Matter.Bodies;
        this.Composite = Matter.Composite;
        this.objects = [];
        this.ground = null;
        this.generatedUpTo = 0;
    }

    createGround() {
        const groundY = CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_HEIGHT / 2;

        this.ground = this.Bodies.rectangle(
            50000,
            groundY,
            100000,
            CONFIG.GROUND_HEIGHT,
            {
                isStatic: true,
                label: 'ground',
                friction: 0.3,
                restitution: 0.7,
                render: {
                    fillStyle: CONFIG.COLORS.GROUND
                }
            }
        );

        return this.ground;
    }

    createObstacles() {
        this.objects = [];
        this.generatedUpTo = 0; // Start generating from the beginning

        // Pre-generate a bunch of obstacles so the world isn't empty at start
        this.generateObstaclesAhead(CONFIG.RAGDOLL_START_X + 1000);

        return this.objects;
    }

    generateObstaclesAhead(currentX) {
        const generateDistance = CONFIG.OBSTACLE_GENERATE_AHEAD || 4000;
        const maxDistance = CONFIG.WORLD_MAX_DISTANCE || 10000;
        const targetX = Math.min(currentX + generateDistance, maxDistance + CONFIG.RAGDOLL_START_X);

        if (targetX <= this.generatedUpTo) return [];

        const newObstacles = [];
        const groundY = CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_HEIGHT;

        let x = this.generatedUpTo;
        while (x < targetX) {
            // DYNAMIC SPACING LOGIC
            // Use overlapping sine waves to create "crowded" (low spacing) and "empty" (high spacing) zones
            // x/2000 creates large scale patterns, x/400 creates local clusters
            const density = Math.sin(x / 1800) * 0.5 + Math.sin(x / 450) * 0.3 + 0.2;

            // Map density to spacing: 
            // - low spacing (~30px) when density is low (crowded zones)
            // - higher spacing (~400px) when density is high (empty zones)
            // We flip the logic: density > 0 means sparse, density < 0 means crowded
            const baseSpacing = 40;
            const variance = Math.max(0, (density + 0.8) * 350);
            const spacing = baseSpacing + variance * (Math.random() * 0.5 + 0.75);

            x += spacing;

            if (x >= targetX) break;

            const types = ['bicycle', 'person', 'barrel', 'ramp', 'cloud', 'bird'];

            // Decide how many objects to spawn at this X (1 to 3 depending on density)
            const intensity = (1.5 - density) * 1.5; // Higher when density is low (crowded)
            const numToSpawn = Math.max(1, Math.min(3, Math.floor(intensity + Math.random())));

            for (let i = 0; i < numToSpawn; i++) {
                const type = types[Math.floor(Math.random() * types.length)];

                let yOffset = 0;
                if (type === 'cloud' || type === 'bird') {
                    yOffset = Math.random() * 400 + 150;
                } else {
                    // Ground objects can sometimes be stacked or floating slightly
                    yOffset = (i > 0) ? (i * 80 + Math.random() * 50) : 0;
                }

                // Add some X jitter for multiple spawns
                const spawnX = x + (Math.random() - 0.5) * 50;
                const obstacle = this.createObstacle(type, spawnX, groundY - yOffset);

                if (obstacle) {
                    newObstacles.push(obstacle);
                    this.objects.push(obstacle);
                }
            }
        }

        this.generatedUpTo = targetX;
        return newObstacles;
    }

    createObstacle(type, x, y) {
        let body;

        // Common options for DYNAMIC obstacles (not static!)
        const dynamicOptions = {
            isStatic: false, // Can be pushed/moved!
            frictionAir: 0.02,
            density: 0.0005, // Light so they fly when hit
        };

        switch (type) {
            case 'bicycle':
                body = this.Bodies.rectangle(x, y, 60, 35, {
                    ...dynamicOptions,
                    label: 'bicycle',
                    boost: { x: 0.008, y: -0.006 },
                    restitution: 0.7,
                    render: { sprite: 'bicycle' }
                });
                break;

            case 'person':
                body = this.Bodies.rectangle(x, y, 40, 70, {
                    ...dynamicOptions,
                    label: 'person',
                    boost: { x: 0.003, y: -0.008 },
                    restitution: 0.5,
                    render: { sprite: 'person' }
                });
                break;

            case 'barrel':
                body = this.Bodies.circle(x, y, 22, {
                    ...dynamicOptions,
                    label: 'barrel',
                    boost: { x: -0.002, y: -0.004 },
                    restitution: 0.8,
                    render: { sprite: 'barrel' }
                });
                break;

            case 'ramp':
                body = this.Bodies.rectangle(x, y, 80, 35, {
                    ...dynamicOptions,
                    label: 'ramp',
                    boost: { x: 0.006, y: -0.015 },
                    restitution: 0.9,
                    angle: -0.3, // Tilted
                    render: { sprite: 'ramp' }
                });
                break;

            case 'cloud':
                // Cloud stays floating in the air (static)
                body = this.Bodies.rectangle(x, y, 90, 45, {
                    isStatic: true, // Floats in air!
                    label: 'cloud',
                    boost: { x: 0.004, y: -0.018 },
                    restitution: 0.95,
                    chamfer: { radius: 20 },
                    render: { sprite: 'cloud' }
                });
                break;

            case 'bird':
                // Bird stays floating in the air (static)
                body = this.Bodies.circle(x, y, 18, {
                    isStatic: true, // Floats in air!
                    label: 'bird',
                    boost: { x: 0.008, y: -0.005 },
                    restitution: 0.6,
                    render: { sprite: 'bird' }
                });
                break;
        }

        return body;
    }

    handleCollision(ragdollBody, objectBody) {
        const boost = objectBody.boost;
        if (boost && !objectBody.hasHit) {
            // Apply boost to ragdoll
            this.Matter.Body.applyForce(ragdollBody, ragdollBody.position, boost);

            // Mark as hit and make it a "ghost" (no more collisions)
            objectBody.hasHit = true;
            objectBody.collisionFilter = {
                category: 0x0002,  // Different category
                mask: 0x0000       // Collides with nothing now
            };

            // Fade out effect - make it semi-transparent
            if (objectBody.render) {
                objectBody.render.opacity = 0.3;
            }
        }
    }

    addToWorld(world, obstacles) {
        obstacles.forEach(obstacle => {
            this.Matter.Composite.add(world, obstacle);
        });
    }

    cleanup(world, currentX) {
        const cleanupDistance = 2000;
        const removeThreshold = currentX - cleanupDistance;

        // Filter objects to keep those still in range
        this.objects = this.objects.filter(obj => {
            if (obj.position.x < removeThreshold) {
                this.Matter.Composite.remove(world, obj);
                return false;
            }
            return true;
        });
    }

    getAll() {
        return [this.ground, ...this.objects];
    }

    reset(world) {
        // Remove all current objects from Matter world
        this.objects.forEach(obj => {
            this.Matter.Composite.remove(world, obj);
        });

        this.createObstacles();

        // Add new initial obstacles to world
        this.addToWorld(world, this.objects);
    }
}

export default World;
