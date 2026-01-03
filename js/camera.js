// Camera Follow System
import CONFIG from './config.js';

class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
    }

    follow(target) {
        this.targetX = target.x - CONFIG.CANVAS_WIDTH / 3;

        // Only follow Y if ragdoll is significantly off screen
        const screenCenterY = CONFIG.CANVAS_HEIGHT / 2;
        if (Math.abs(target.y - screenCenterY) > CONFIG.CANVAS_HEIGHT / 3) {
            this.targetY = target.y - screenCenterY;
        }
    }

    update() {
        // Smooth follow
        this.x += (this.targetX - this.x) * CONFIG.CAMERA_SMOOTHING;
        this.y += (this.targetY - this.y) * CONFIG.CAMERA_SMOOTHING;

        // Clamp to prevent going too far left
        this.x = Math.max(0, this.x);
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
    }

    applyTransform(ctx) {
        ctx.translate(-this.x, -this.y);
    }

    getOffset() {
        return { x: this.x, y: this.y };
    }
}

export default Camera;
