// Ragdoll - Thug with spinning head when flying
import CONFIG from './config.js';
import assets from './assets.js';

class Ragdoll {
    constructor(Matter, x, y) {
        this.Matter = Matter;
        this.Bodies = Matter.Bodies;
        this.Body = Matter.Body;
        this.Composite = Matter.Composite;

        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;

        // Animation state
        this.isFlying = false;
        this.frameIndex = 0;
        this.frameTimer = 0;
        this.frameDelay = 80; // ms per frame

        // Head spin rotation (separate from body)
        this.headRotation = 0;
        this.spinSpeed = 0;

        // Physics body (single body for sprite)
        this.body = null;
        this.composite = this.create();
    }

    create() {
        const { Bodies, Composite } = this;
        const x = this.x;
        const y = this.y;

        // Single physics body for the thug (hitbox) - starts STATIC
        // Bouncy head with friction for natural deceleration
        this.body = Bodies.circle(x, y, 35, {
            label: 'thug',
            restitution: 0.7, // Bouncy but loses energy each bounce
            friction: 0.4, // Surface friction - slows rolling
            frictionStatic: 0.6, // Static friction - helps stop
            frictionAir: 0.008, // Air resistance
            density: 0.001, // Light body for higher bounces
            isStatic: true, // Won't move until launched!
            render: { visible: false }
        });

        const composite = Composite.create({ label: 'ragdoll' });
        Composite.add(composite, this.body);

        return composite;
    }

    // Called when golem hits - makes body dynamic and applies force
    launch(force) {
        this.Matter.Body.setStatic(this.body, false);
        this.Matter.Body.applyForce(this.body, this.body.position, force);
        this.isFlying = true;
        this.frameIndex = 0;

        // Apply initial angular velocity (physics-based spin)
        // Positive angular velocity = clockwise = rolling right
        const initialSpin = force.x * 50 + 0.3;
        this.Matter.Body.setAngularVelocity(this.body, initialSpin);
    }

    applyForce(force) {
        if (!this.isFlying) {
            this.launch(force);
        } else {
            this.Matter.Body.applyForce(this.body, this.body.position, force);
            // Add more angular velocity on collision (physics-based)
            const currentAngVel = this.body.angularVelocity;
            this.Matter.Body.setAngularVelocity(this.body, currentAngVel + force.x * 20);
        }
    }

    getPosition() {
        return this.body.position;
    }

    getSpeed() {
        return this.body.speed;
    }

    getVelocity() {
        return this.body.velocity;
    }

    update(deltaTime) {
        // Update position from physics
        this.x = this.body.position.x;
        this.y = this.body.position.y;

        // Update thug animation frame (idle only when not flying)
        if (!this.isFlying) {
            this.frameTimer += deltaTime * 1000;
            if (this.frameTimer >= this.frameDelay) {
                this.frameTimer = 0;
                this.frameIndex = (this.frameIndex + 1) % 16; // 16 idle frames
            }
        } else {
            // Use the PHYSICS body's actual rotation for visual
            // Physics engine handles friction/deceleration naturally
            this.headRotation = this.body.angle;

            // Update hurt animation
            this.frameTimer += deltaTime * 1000;
            if (this.frameTimer >= this.frameDelay) {
                this.frameTimer = 0;
                this.frameIndex = (this.frameIndex + 1) % 10; // 10 hurt frames
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const scale = CONFIG.THUG_SCALE;

        if (this.isFlying) {
            // When flying: just draw the spinning head!
            const headImg = assets.get('thugHead');
            if (headImg) {
                ctx.rotate(this.headRotation);
                const width = headImg.width * scale * 1.2;
                const height = headImg.height * scale * 1.2;
                ctx.drawImage(headImg, -width / 2, -height / 2, width, height);
            } else {
                // Fallback: spinning circle
                ctx.rotate(this.headRotation);
                ctx.fillStyle = CONFIG.COLORS.RAGDOLL_HEAD;
                ctx.beginPath();
                ctx.arc(0, 0, 40, 0, Math.PI * 2);
                ctx.fill();
                // Face indicator
                ctx.fillStyle = '#333';
                ctx.fillRect(10, -5, 10, 5);
                ctx.fillRect(10, 5, 10, 5);
            }
        } else {
            // When idle: draw full thug sprite
            const frame = assets.getFrame('thugIdle', this.frameIndex);
            if (frame) {
                const width = frame.width * scale;
                const height = frame.height * scale;
                ctx.drawImage(frame, -width / 2, -height / 2, width, height);
            } else {
                // Fallback
                ctx.fillStyle = CONFIG.COLORS.RAGDOLL_TORSO;
                ctx.fillRect(-30, -50, 60, 100);
                ctx.fillStyle = CONFIG.COLORS.RAGDOLL_HEAD;
                ctx.beginPath();
                ctx.arc(0, -70, 25, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.isFlying = false;
        this.frameIndex = 0;
        this.frameTimer = 0;
        this.headRotation = 0;
        this.spinSpeed = 0;

        // Reset physics body to static
        this.Matter.Body.setStatic(this.body, true);
        this.Matter.Body.setPosition(this.body, { x, y });
        this.Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
        this.Matter.Body.setAngularVelocity(this.body, 0);
        this.Matter.Body.setAngle(this.body, 0);
    }
}

export default Ragdoll;
