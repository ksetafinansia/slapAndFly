// Game State Machine
import CONFIG from './config.js';

class Game {
    constructor() {
        this.state = CONFIG.STATES.IDLE;
        this.power = 0;
        this.angle = 0;
        this.powerRatio = 0;
        this.angleRatio = 0;
        this.slapStartTime = 0;
        this.lastDistance = 0;
        this.bestDistance = 0;
        this.slapStartX = CONFIG.RAGDOLL_START_X;
        this.stopTimer = 0;
        this.meterTime = 0;
    }

    setState(newState) {
        console.log(`State: ${this.state} → ${newState}`);
        this.state = newState;
    }

    update(deltaTime) {
        this.meterTime += deltaTime;

        switch (this.state) {
            case CONFIG.STATES.POWER_SELECT:
                // Oscillate power ratio using sine wave
                this.powerRatio = Math.sin(this.meterTime * CONFIG.POWER_SPEED) * 0.5 + 0.5;
                break;

            case CONFIG.STATES.ANGLE_SELECT:
                // Oscillate angle ratio using sine wave
                this.angleRatio = Math.sin(this.meterTime * CONFIG.ANGLE_SPEED) * 0.5 + 0.5;
                break;

            case CONFIG.STATES.SLAP_ANIMATION:
                const elapsed = Date.now() - this.slapStartTime;
                if (elapsed >= CONFIG.SLAP_DURATION) {
                    this.setState(CONFIG.STATES.FLYING);
                }
                break;
        }
    }

    handleTap() {
        switch (this.state) {
            case CONFIG.STATES.IDLE:
                this.meterTime = 0;
                this.setState(CONFIG.STATES.POWER_SELECT);
                break;

            case CONFIG.STATES.POWER_SELECT:
                // Lock power
                this.power = CONFIG.POWER_MIN + this.powerRatio * (CONFIG.POWER_MAX - CONFIG.POWER_MIN);
                this.meterTime = 0;
                this.setState(CONFIG.STATES.ANGLE_SELECT);
                break;

            case CONFIG.STATES.ANGLE_SELECT:
                // Lock angle
                this.angle = CONFIG.ANGLE_MIN + this.angleRatio * (CONFIG.ANGLE_MAX - CONFIG.ANGLE_MIN);
                this.slapStartTime = Date.now();
                this.setState(CONFIG.STATES.SLAP_ANIMATION);
                break;

            case CONFIG.STATES.END:
                // Restart
                this.reset();
                this.meterTime = 0;
                this.setState(CONFIG.STATES.POWER_SELECT);
                break;
        }
    }

    // Check if we should apply the slap force (at impact frame)
    shouldApplyForce() {
        if (this.state !== CONFIG.STATES.SLAP_ANIMATION) return false;
        const elapsed = Date.now() - this.slapStartTime;
        return elapsed >= CONFIG.IMPACT_TIME && elapsed < CONFIG.IMPACT_TIME + 50; // 50ms window
    }

    // Get force vector from power and angle
    getForceVector() {
        const angleRad = (this.angle * Math.PI) / 180;
        // Increased force multiplier for more satisfying launches
        return {
            x: this.power * Math.cos(angleRad) * 0.002,
            y: -this.power * Math.sin(angleRad) * 0.002
        };
    }

    // Update distance calculation
    updateDistance(currentX) {
        const distance = Math.max(0, currentX - this.slapStartX);
        this.lastDistance = Math.max(this.lastDistance, distance);
    }

    // Check end condition (speed below threshold for duration)
    checkEndCondition(speed, deltaTime) {
        if (this.state !== CONFIG.STATES.FLYING) return;

        if (speed < CONFIG.STOP_THRESHOLD) {
            this.stopTimer += deltaTime * 1000; // Convert to ms
            if (this.stopTimer >= CONFIG.STOP_DURATION) {
                this.endRound();
            }
        } else {
            this.stopTimer = 0;
        }
    }

    endRound() {
        this.bestDistance = Math.max(this.bestDistance, this.lastDistance);
        this.setState(CONFIG.STATES.END);
    }

    reset() {
        this.power = 0;
        this.angle = 0;
        this.powerRatio = 0;
        this.angleRatio = 0;
        this.lastDistance = 0;
        this.stopTimer = 0;
    }

    // Get slap animation progress (0-1)
    getSlapProgress() {
        if (this.state !== CONFIG.STATES.SLAP_ANIMATION) return 0;
        const elapsed = Date.now() - this.slapStartTime;
        return Math.min(1, elapsed / CONFIG.SLAP_DURATION);
    }
}

export default Game;
