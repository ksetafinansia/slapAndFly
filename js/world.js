// World Objects & Obstacles
import CONFIG from './config.js';

class World {
    constructor(Matter) {
        this.Matter = Matter;
        this.Bodies = Matter.Bodies;
        this.Composite = Matter.Composite;
        this.objects = [];
        this.ground = null;
    }

    createGround() {
        const groundY = CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_HEIGHT / 2;

        // Create a very long ground
        this.ground = this.Bodies.rectangle(
            5000, // Center X (very far right)
            groundY,
            12000, // Width
            CONFIG.GROUND_HEIGHT,
            {
                isStatic: true,
                label: 'ground',
                render: {
                    fillStyle: CONFIG.COLORS.GROUND
                }
            }
        );

        return this.ground;
    }

    createObstacles() {
        const groundY = CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_HEIGHT;
        const objects = [];

        // Object configurations with positions
        const obstacleConfigs = [
            // Bicycles (boost) - moving right
            { type: 'bicycle', x: 600, boost: { x: 0.005, y: -0.002 } },
            { type: 'bicycle', x: 1500, boost: { x: 0.006, y: -0.001 } },
            { type: 'bicycle', x: 2800, boost: { x: 0.005, y: -0.002 } },

            // People (angle changers)
            { type: 'person', x: 900, boost: { x: 0.001, y: -0.004 } },
            { type: 'person', x: 2000, boost: { x: -0.001, y: -0.003 } },
            { type: 'person', x: 3500, boost: { x: 0.002, y: -0.005 } },

            // Barrels (speed loss) - penalty
            { type: 'barrel', x: 1200, boost: { x: -0.004, y: 0 } },
            { type: 'barrel', x: 2400, boost: { x: -0.003, y: 0 } },
            { type: 'barrel', x: 3200, boost: { x: -0.005, y: 0 } },

            // Walls (hard bounce)
            { type: 'wall', x: 1800, boost: null },
            { type: 'wall', x: 4000, boost: null }
        ];

        obstacleConfigs.forEach(config => {
            const obj = this.createObstacle(config.type, config.x, groundY, config.boost);
            if (obj) {
                objects.push(obj);
            }
        });

        this.objects = objects;
        return objects;
    }

    createObstacle(type, x, groundY, boost) {
        let body;
        const commonOptions = {
            isStatic: true,
            label: type,
            boost: boost
        };

        switch (type) {
            case 'bicycle':
                body = this.Bodies.rectangle(x, groundY - 30, 60, 40, {
                    ...commonOptions,
                    chamfer: { radius: 10 },
                    render: {
                        fillStyle: '#55efc4',
                        strokeStyle: '#00b894',
                        lineWidth: 2
                    }
                });
                break;

            case 'person':
                body = this.Bodies.rectangle(x, groundY - 40, 25, 60, {
                    ...commonOptions,
                    chamfer: { radius: 5 },
                    render: {
                        fillStyle: '#fd79a8',
                        strokeStyle: '#e84393',
                        lineWidth: 2
                    }
                });
                break;

            case 'barrel':
                body = this.Bodies.circle(x, groundY - 25, 25, {
                    ...commonOptions,
                    render: {
                        fillStyle: '#e17055',
                        strokeStyle: '#d63031',
                        lineWidth: 2
                    }
                });
                break;

            case 'wall':
                body = this.Bodies.rectangle(x, groundY - 60, 30, 120, {
                    ...commonOptions,
                    restitution: 0.8,
                    render: {
                        fillStyle: '#636e72',
                        strokeStyle: '#2d3436',
                        lineWidth: 2
                    }
                });
                break;
        }

        return body;
    }

    handleCollision(ragdollBody, objectBody) {
        const boost = objectBody.boost;
        if (boost && ragdollBody.label === 'torso') {
            this.Matter.Body.applyForce(ragdollBody, ragdollBody.position, boost);
        }
    }

    getAll() {
        return [this.ground, ...this.objects];
    }
}

export default World;
