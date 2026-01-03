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

        // Bonus tracking
        this.sweetSpot = null; // Which sweet spot was hit
        this.isPowerBonus = false; // 90%+ power
    }

    setState(newState) {
        console.log(`State: ${this.state} → ${newState}`);
        this.state = newState;
    }

    update(deltaTime) {
        this.meterTime += deltaTime;

        switch (this.state) {
            case CONFIG.STATES.POWER_SELECT:
                this.powerRatio = Math.sin(this.meterTime * CONFIG.POWER_SPEED) * 0.5 + 0.5;
                break;

            case CONFIG.STATES.ANGLE_SELECT:
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

                // Check power bonus (90%+)
                this.isPowerBonus = this.powerRatio >= CONFIG.POWER_BONUS_THRESHOLD;
                if (this.isPowerBonus) {
                    console.log('💪 POWER BONUS! 2x');
                }

                this.meterTime = 0;
                this.setState(CONFIG.STATES.ANGLE_SELECT);
                break;

            case CONFIG.STATES.ANGLE_SELECT:
                // Lock angle (0-90 degrees)
                this.angle = CONFIG.ANGLE_MIN + this.angleRatio * (CONFIG.ANGLE_MAX - CONFIG.ANGLE_MIN);

                // Check which sweet spot was hit (if any)
                this.sweetSpot = null;
                for (const spot of CONFIG.SWEET_SPOTS) {
                    if (Math.abs(this.angleRatio - spot.center) <= spot.width / 2) {
                        this.sweetSpot = spot;
                        console.log(`🎯 ${spot.name}! ${spot.multiplier}x`);
                        break;
                    }
                }

                this.slapStartTime = Date.now();
                this.setState(CONFIG.STATES.SLAP_ANIMATION);
                break;

            case CONFIG.STATES.END:
                this.reset();
                this.meterTime = 0;
                this.setState(CONFIG.STATES.POWER_SELECT);
                break;
        }
    }

    shouldApplyForce() {
        if (this.state !== CONFIG.STATES.SLAP_ANIMATION) return false;
        const elapsed = Date.now() - this.slapStartTime;
        return elapsed >= CONFIG.IMPACT_TIME && elapsed < CONFIG.IMPACT_TIME + 50;
    }

    getForceVector() {
        const angleRad = (this.angle * Math.PI) / 180;
        let forceMultiplier = 0.015;

        // Power bonus (90%+ = 2x)
        if (this.isPowerBonus) {
            forceMultiplier *= CONFIG.POWER_BONUS_MULTIPLIER;
        }

        // Sweet spot multiplier
        if (this.sweetSpot) {
            forceMultiplier *= this.sweetSpot.multiplier;
        }

        const force = {
            x: this.power * Math.cos(angleRad) * forceMultiplier,
            y: -this.power * Math.sin(angleRad) * forceMultiplier
        };

        const totalMultiplier = (this.isPowerBonus ? 2 : 1) * (this.sweetSpot ? this.sweetSpot.multiplier : 1);
        console.log(`Force: ${totalMultiplier}x, angle=${this.angle.toFixed(0)}°`);
        return force;
    }

    getTotalMultiplier() {
        let mult = 1;
        if (this.isPowerBonus) mult *= CONFIG.POWER_BONUS_MULTIPLIER;
        if (this.sweetSpot) mult *= this.sweetSpot.multiplier;
        return mult;
    }

    updateDistance(currentX) {
        const distance = Math.max(0, currentX - this.slapStartX);
        this.lastDistance = Math.max(this.lastDistance, distance);
    }

    checkEndCondition(speed, deltaTime) {
        if (this.state !== CONFIG.STATES.FLYING) return;

        if (speed < CONFIG.STOP_THRESHOLD) {
            this.stopTimer += deltaTime * 1000;
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
        this.sweetSpot = null;
        this.isPowerBonus = false;
    }

    getSlapProgress() {
        if (this.state !== CONFIG.STATES.SLAP_ANIMATION) return 0;
        const elapsed = Date.now() - this.slapStartTime;
        return Math.min(1, elapsed / CONFIG.SLAP_DURATION);
    }
}

export default Game;
