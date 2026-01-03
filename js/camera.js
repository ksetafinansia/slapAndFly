// Camera System with Zoom
import CONFIG from './config.js';

class Camera {
    constructor() {
        this.x = 0;
        this.zoom = 1;
        this.targetX = 0;
        this.targetZoom = 1;
        this.minZoom = 0.35;
        this.maxZoom = 1;
        this.currentSpeed = 0;
    }

    follow(target, speed = 0) {
        // X follow - keep ragdoll in left third of screen
        this.targetX = target.x - CONFIG.CANVAS_WIDTH / 3;
        this.currentSpeed = speed;

        // Calculate zoom to keep both ragdoll and ground visible
        const groundY = CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_HEIGHT;
        const ragdollY = target.y;

        // How much vertical space we need to show
        const topPadding = 50;
        const bottomPadding = CONFIG.GROUND_HEIGHT + 30;
        const contentHeight = Math.max(groundY - ragdollY + 100, CONFIG.CANVAS_HEIGHT * 0.5);
        const availableHeight = CONFIG.CANVAS_HEIGHT - topPadding - bottomPadding;

        // Calculate zoom needed
        if (ragdollY < groundY - 100) {
            const requiredZoom = availableHeight / contentHeight;
            this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, requiredZoom));
        } else {
            this.targetZoom = this.maxZoom;
        }
    }

    update() {
        // Adaptive smoothing based on speed - faster objects need snappier camera
        let smoothing = CONFIG.CAMERA_SMOOTHING;
        if (this.currentSpeed > CONFIG.CAMERA_SPEED_THRESHOLD) {
            // Interpolate between normal and fast smoothing based on speed
            const speedFactor = Math.min(1, (this.currentSpeed - CONFIG.CAMERA_SPEED_THRESHOLD) / 20);
            smoothing = CONFIG.CAMERA_SMOOTHING + (CONFIG.CAMERA_SMOOTHING_FAST - CONFIG.CAMERA_SMOOTHING) * speedFactor;
        }

        // Smooth X follow
        this.x += (this.targetX - this.x) * smoothing;

        // Smooth zoom
        this.zoom += (this.targetZoom - this.zoom) * 0.06;

        // Clamp X
        this.x = Math.max(0, this.x);
    }

    reset() {
        this.x = 0;
        this.zoom = 1;
        this.targetX = 0;
        this.targetZoom = 1;
        this.currentSpeed = 0;
    }

    applyTransform(ctx) {
        // Zoom from bottom-center so ground stays at bottom
        const groundY = CONFIG.CANVAS_HEIGHT;

        // Scale around bottom of screen
        ctx.translate(CONFIG.CANVAS_WIDTH / 2, groundY);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-CONFIG.CANVAS_WIDTH / 2, -groundY);

        // Apply X offset (scaled)
        ctx.translate(-this.x * this.zoom, 0);
    }

    // For parallax - returns unzoomed offset
    getOffset() {
        return { x: this.x, y: 0, zoom: this.zoom };
    }

    getZoom() {
        return this.zoom;
    }
}

export default Camera;
