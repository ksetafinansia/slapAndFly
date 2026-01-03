// Main Entry Point - Slap & Fly Game
import CONFIG from './config.js';
import Game from './game.js';
import Ragdoll from './ragdoll.js';
import World from './world.js';
import Camera from './camera.js';
import Renderer from './renderer.js';
import assets from './assets.js';

// Wait for Matter.js to load
const Matter = window.Matter;
const { Engine, Runner, Events } = Matter;

class SlapGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.setupCanvas();
        this.lastTime = 0;
        this.forceApplied = false;

        // Start loading assets
        this.game = new Game();
        this.game.setState(CONFIG.STATES.LOADING);

        this.drawLoading();

        assets.loadAll().then(() => {
            this.init();
            this.bindEvents();
            this.game.setState(CONFIG.STATES.IDLE);
            requestAnimationFrame(this.gameLoop.bind(this));
        });
    }

    drawLoading() {
        const ctx = this.ctx;
        ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.textAlign = 'center';
        ctx.fillStyle = CONFIG.COLORS.UI_TEXT;
        ctx.font = 'bold 32px Arial';
        ctx.fillText('Loading...', this.canvas.width / 2, this.canvas.height / 2);
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        CONFIG.CANVAS_WIDTH = this.canvas.width;
        CONFIG.CANVAS_HEIGHT = this.canvas.height;
    }

    init() {
        // Create Matter.js engine
        this.engine = Engine.create();
        this.engine.gravity.x = CONFIG.GRAVITY.x;
        this.engine.gravity.y = CONFIG.GRAVITY.y;

        // Create game components
        this.camera = new Camera();
        this.renderer = new Renderer(this.ctx, this.canvas);
        this.world = new World(Matter);

        // Create ragdoll (thug) - starts STATIC (won't crumble!)
        this.ragdoll = new Ragdoll(
            Matter,
            CONFIG.RAGDOLL_START_X,
            CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_HEIGHT - 80
        );

        // Add bodies to world
        const ground = this.world.createGround();
        const obstacles = this.world.createObstacles();

        Matter.Composite.add(this.engine.world, ground);
        Matter.Composite.add(this.engine.world, obstacles);
        Matter.Composite.add(this.engine.world, this.ragdoll.composite);

        // Set up collision events
        this.setupCollisions();

        // Create runner
        this.runner = Runner.create();
        Runner.run(this.runner, this.engine);
    }

    setupCollisions() {
        Events.on(this.engine, 'collisionStart', (event) => {
            event.pairs.forEach(pair => {
                const { bodyA, bodyB } = pair;
                const obstacleLabels = ['bicycle', 'person', 'barrel', 'wall'];

                let thugBody = null;
                let obstacleBody = null;

                if (bodyA.label === 'thug' && obstacleLabels.includes(bodyB.label)) {
                    thugBody = bodyA;
                    obstacleBody = bodyB;
                } else if (bodyB.label === 'thug' && obstacleLabels.includes(bodyA.label)) {
                    thugBody = bodyB;
                    obstacleBody = bodyA;
                }

                if (thugBody && obstacleBody && this.game.state === CONFIG.STATES.FLYING) {
                    this.world.handleCollision(thugBody, obstacleBody);
                    // Add spin on collision
                    this.ragdoll.spinSpeed += 5;
                }
            });
        });
    }

    bindEvents() {
        const handleTap = (e) => {
            e.preventDefault();

            if (this.game.state === CONFIG.STATES.LOADING) return;

            this.game.handleTap();

            // Reset for new round
            if (this.game.state === CONFIG.STATES.POWER_SELECT && this.forceApplied) {
                this.forceApplied = false;
                this.ragdoll.reset(
                    CONFIG.RAGDOLL_START_X,
                    CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_HEIGHT - 80
                );
                this.camera.reset();
            }
        };

        this.canvas.addEventListener('click', handleTap);
        this.canvas.addEventListener('touchstart', handleTap);

        window.addEventListener('resize', () => {
            this.setupCanvas();
        });
    }

    gameLoop(timestamp) {
        const deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        // Update game state
        this.game.update(deltaTime);

        // Update ragdoll animation
        this.ragdoll.update(deltaTime);

        // Update golem animation
        this.renderer.updateGolem(this.game.state, this.game.getSlapProgress(), deltaTime);

        // Apply slap force at impact frame (golem hits thug)
        if (this.game.shouldApplyForce() && !this.forceApplied) {
            const force = this.game.getForceVector();
            this.ragdoll.applyForce(force);
            this.forceApplied = true;
        }

        // Update camera during flight
        if (this.game.state === CONFIG.STATES.FLYING) {
            this.camera.follow(this.ragdoll.getPosition());
            this.camera.update();

            this.game.updateDistance(this.ragdoll.getPosition().x);
            this.game.checkEndCondition(this.ragdoll.getSpeed(), deltaTime);
        }

        this.render();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    render() {
        const ctx = this.ctx;
        const camera = this.camera.getOffset();

        // Clear canvas
        this.renderer.clear();

        // Draw parallax background (in screen space)
        this.renderer.drawParallaxBackground(camera.x);

        // Apply camera transform for world objects
        ctx.save();
        this.camera.applyTransform(ctx);

        // Draw ground
        this.renderer.drawGround(camera.x);

        // Draw obstacles
        this.drawObstacles();

        // Draw golem (left side, runs to attack)
        this.renderer.drawGolem(camera.x);

        // Draw thug/ragdoll (spinning head when flying)
        this.ragdoll.draw(ctx);

        ctx.restore();

        // Draw UI (fixed position, not affected by camera)
        this.drawUI();
    }

    drawObstacles() {
        const ctx = this.ctx;
        const bodies = this.world.objects;

        bodies.forEach(body => {
            if (body && body.render && body.render.visible !== false) {
                const vertices = body.vertices;

                ctx.beginPath();
                ctx.moveTo(vertices[0].x, vertices[0].y);

                for (let i = 1; i < vertices.length; i++) {
                    ctx.lineTo(vertices[i].x, vertices[i].y);
                }

                ctx.closePath();
                ctx.fillStyle = body.render.fillStyle || '#fff';
                ctx.fill();

                if (body.render.strokeStyle) {
                    ctx.strokeStyle = body.render.strokeStyle;
                    ctx.lineWidth = body.render.lineWidth || 1;
                    ctx.stroke();
                }
            }
        });
    }

    drawUI() {
        const state = this.game.state;

        if (state === CONFIG.STATES.FLYING || state === CONFIG.STATES.END) {
            this.renderer.drawDistance(this.game.lastDistance, this.game.bestDistance);
        }

        switch (state) {
            case CONFIG.STATES.LOADING:
                this.renderer.drawLoadingScreen();
                break;

            case CONFIG.STATES.IDLE:
                this.renderer.drawInstruction('TAP TO START');
                break;

            case CONFIG.STATES.POWER_SELECT:
                this.renderer.drawPowerMeter(this.game.powerRatio, false);
                this.renderer.drawInstruction('TAP TO LOCK POWER');
                break;

            case CONFIG.STATES.ANGLE_SELECT:
                this.renderer.drawPowerMeter(this.game.powerRatio, true);
                this.renderer.drawAngleMeter(this.game.angleRatio, false);
                this.renderer.drawInstruction('TAP TO LOCK ANGLE');
                break;

            case CONFIG.STATES.SLAP_ANIMATION:
                this.renderer.drawPowerMeter(this.game.powerRatio, true);
                this.renderer.drawAngleMeter(this.game.angleRatio, true);
                break;

            case CONFIG.STATES.END:
                this.renderer.drawEndScreen(this.game.lastDistance, this.game.bestDistance);
                break;
        }
    }
}

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SlapGame();
});
