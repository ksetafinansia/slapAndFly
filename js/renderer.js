// Custom Renderer - Golem, parallax background, UI
import CONFIG from './config.js';
import assets from './assets.js';

class Renderer {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;

        // Golem animation state
        this.golemState = 'idle'; // idle, walk, attack
        this.golemX = CONFIG.SLAPPER_X;
        this.golemFrame = 0;
        this.golemFrameTimer = 0;
        this.golemFrameDelay = 60; // ms per frame
    }

    clear() {
        this.ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Draw parallax background layers
    drawParallaxBackground(cameraX) {
        const ctx = this.ctx;
        const layers = [
            { key: 'sky', speed: CONFIG.PARALLAX.sky, y: 0, scale: 1 },
            { key: 'clouds_4', speed: CONFIG.PARALLAX.clouds4, y: 30, scale: 1 },
            { key: 'clouds_3', speed: CONFIG.PARALLAX.clouds3, y: 60, scale: 1 },
            { key: 'clouds_2', speed: CONFIG.PARALLAX.clouds2, y: 40, scale: 1 },
            { key: 'clouds_1', speed: CONFIG.PARALLAX.clouds1, y: 20, scale: 1 },
            { key: 'rocks_1', speed: CONFIG.PARALLAX.rocks1, y: CONFIG.CANVAS_HEIGHT - 300, scale: 1 },
            { key: 'rocks_2', speed: CONFIG.PARALLAX.rocks2, y: CONFIG.CANVAS_HEIGHT - 200, scale: 1 }
        ];

        layers.forEach(layer => {
            const img = assets.get(layer.key);
            if (img) {
                const parallaxOffset = cameraX * layer.speed;
                const imgWidth = img.width * layer.scale;

                // Tile the image horizontally
                const startX = -(parallaxOffset % imgWidth);
                for (let x = startX - imgWidth; x < CONFIG.CANVAS_WIDTH + imgWidth; x += imgWidth) {
                    ctx.drawImage(img, x, layer.y, imgWidth, img.height * layer.scale);
                }
            }
        });
    }

    // Draw ground
    drawGround(cameraX) {
        const ctx = this.ctx;
        const groundY = CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_HEIGHT;

        // Ground fill
        ctx.fillStyle = CONFIG.COLORS.GROUND;
        ctx.fillRect(0, groundY, CONFIG.CANVAS_WIDTH, CONFIG.GROUND_HEIGHT);

        // Ground top line
        ctx.fillStyle = CONFIG.COLORS.GROUND_TOP;
        ctx.fillRect(0, groundY, CONFIG.CANVAS_WIDTH, 8);

        // Distance markers every 100m
        ctx.fillStyle = CONFIG.COLORS.UI_TEXT + '60';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';

        const startMarker = Math.floor(cameraX / 100) * 100;
        for (let x = startMarker; x < cameraX + CONFIG.CANVAS_WIDTH + 200; x += 100) {
            const distance = x - CONFIG.RAGDOLL_START_X;
            if (distance >= 0) {
                const screenX = x - cameraX;
                ctx.fillText(`${distance}m`, screenX, groundY + 30);
                ctx.fillRect(screenX - 1, groundY + 5, 2, 10);
            }
        }
    }

    // Update golem animation based on game state
    updateGolem(gameState, slapProgress, deltaTime) {
        // Determine golem state based on game state
        if (gameState === CONFIG.STATES.SLAP_ANIMATION) {
            if (slapProgress < 0.5) {
                this.golemState = 'walk';
            } else {
                this.golemState = 'attack';
            }
        } else if (gameState === CONFIG.STATES.FLYING || gameState === CONFIG.STATES.END) {
            this.golemState = 'idle';
            this.golemX = CONFIG.SLAPPER_X; // Reset position
        } else {
            this.golemState = 'idle';
            this.golemX = CONFIG.SLAPPER_X;
        }

        // Animate golem position during slap
        if (gameState === CONFIG.STATES.SLAP_ANIMATION) {
            const startX = CONFIG.SLAPPER_X - 100;
            const endX = CONFIG.RAGDOLL_START_X - 120;
            this.golemX = startX + (endX - startX) * this.easeInOut(slapProgress);
        }

        // Update frame
        this.golemFrameTimer += deltaTime * 1000;
        if (this.golemFrameTimer >= this.golemFrameDelay) {
            this.golemFrameTimer = 0;
            this.golemFrame++;
        }
    }

    easeInOut(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    // Draw golem character
    drawGolem(cameraX) {
        const ctx = this.ctx;
        const groundY = CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_HEIGHT;

        let assetKey, maxFrames;
        switch (this.golemState) {
            case 'walk':
                assetKey = 'golemWalk';
                maxFrames = 18;
                break;
            case 'attack':
                assetKey = 'golemAttack';
                maxFrames = 12;
                break;
            default:
                assetKey = 'golemIdle';
                maxFrames = 12;
        }

        const frame = assets.getFrame(assetKey, this.golemFrame % maxFrames);
        const screenX = this.golemX - cameraX;

        if (frame) {
            const scale = CONFIG.GOLEM_SCALE;
            const width = frame.width * scale;
            const height = frame.height * scale;
            const y = groundY - height + 20; // Feet on ground

            ctx.drawImage(frame, screenX - width / 2, y, width, height);
        } else {
            // Fallback: simple golem shape
            ctx.fillStyle = '#5d6d7e';
            ctx.fillRect(screenX - 40, groundY - 120, 80, 120);
            ctx.beginPath();
            ctx.arc(screenX, groundY - 140, 35, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Draw power meter bar
    drawPowerMeter(ratio, locked = false) {
        const ctx = this.ctx;
        const x = 50;
        const y = CONFIG.CANVAS_HEIGHT - 150;
        const width = 300;
        const height = 30;

        ctx.fillStyle = CONFIG.COLORS.POWER_BAR_BG;
        ctx.fillRect(x, y, width, height);

        ctx.fillStyle = CONFIG.COLORS.POWER_BAR_OPTIMAL + '40';
        ctx.fillRect(x + width * 0.4, y, width * 0.2, height);

        ctx.fillStyle = locked ? '#fdcb6e' : CONFIG.COLORS.POWER_BAR_FILL;
        ctx.fillRect(x, y, width * ratio, height);

        ctx.strokeStyle = CONFIG.COLORS.UI_TEXT;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        if (!locked) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + width * ratio - 3, y - 5, 6, height + 10);
        }

        ctx.fillStyle = CONFIG.COLORS.UI_TEXT;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('POWER', x, y - 10);
    }

    // Draw angle meter gauge
    drawAngleMeter(ratio, locked = false) {
        const ctx = this.ctx;
        const centerX = 200;
        const centerY = CONFIG.CANVAS_HEIGHT - 250;
        const radius = 80;
        const startAngle = Math.PI * 0.7;
        const endAngle = Math.PI * 0.3;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, Math.PI * 2 + endAngle);
        ctx.strokeStyle = CONFIG.COLORS.ANGLE_GAUGE_BG;
        ctx.lineWidth = 15;
        ctx.stroke();

        ctx.fillStyle = CONFIG.COLORS.UI_TEXT;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${CONFIG.ANGLE_MIN}°`, centerX - 70, centerY - 40);
        ctx.fillText(`${CONFIG.ANGLE_MAX}°`, centerX + 70, centerY - 40);

        const angleRange = Math.PI * 2 - startAngle + endAngle;
        const needleAngle = startAngle + ratio * angleRange;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        const needleLength = radius - 10;
        ctx.lineTo(
            centerX + Math.cos(needleAngle) * needleLength,
            centerY + Math.sin(needleAngle) * needleLength
        );
        ctx.strokeStyle = locked ? '#fdcb6e' : CONFIG.COLORS.ANGLE_NEEDLE;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.COLORS.ANGLE_NEEDLE;
        ctx.fill();

        ctx.fillStyle = CONFIG.COLORS.UI_TEXT;
        ctx.font = 'bold 16px Arial';
        ctx.fillText('ANGLE', centerX, centerY + radius + 30);
    }

    // Draw distance UI
    drawDistance(lastDistance, bestDistance) {
        const ctx = this.ctx;

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const x = CONFIG.CANVAS_WIDTH - 30;
        const y = 40;

        ctx.textAlign = 'right';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 5;

        ctx.fillStyle = CONFIG.COLORS.UI_TEXT;
        ctx.font = 'bold 36px Arial';
        ctx.fillText(`${Math.floor(lastDistance)}m`, x, y);

        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = CONFIG.COLORS.UI_ACCENT;
        ctx.fillText(`BEST: ${Math.floor(bestDistance)}m`, x, y + 30);

        ctx.restore();
    }

    // Draw tap instruction
    drawInstruction(text) {
        const ctx = this.ctx;

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        ctx.textAlign = 'center';
        ctx.fillStyle = CONFIG.COLORS.UI_TEXT;
        ctx.font = 'bold 28px Arial';
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 10;

        const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 0.8;
        ctx.globalAlpha = pulse;
        ctx.fillText(text, CONFIG.CANVAS_WIDTH / 2, 60);
        ctx.globalAlpha = 1;

        ctx.restore();
    }

    // Draw loading screen
    drawLoadingScreen() {
        const ctx = this.ctx;

        ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        ctx.textAlign = 'center';
        ctx.fillStyle = CONFIG.COLORS.UI_TEXT;
        ctx.font = 'bold 32px Arial';
        ctx.fillText('Loading...', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
    }

    // Draw end screen
    drawEndScreen(lastDistance, bestDistance) {
        const ctx = this.ctx;

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        const centerX = CONFIG.CANVAS_WIDTH / 2;
        const centerY = CONFIG.CANVAS_HEIGHT / 2;

        ctx.textAlign = 'center';
        ctx.fillStyle = CONFIG.COLORS.UI_ACCENT;
        ctx.font = 'bold 72px Arial';
        ctx.fillText(`${Math.floor(lastDistance)}m`, centerX, centerY - 20);

        ctx.fillStyle = CONFIG.COLORS.UI_TEXT;
        ctx.font = '32px Arial';
        ctx.fillText(`Best: ${Math.floor(bestDistance)}m`, centerX, centerY + 40);

        ctx.font = '24px Arial';
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
        ctx.fillText('TAP TO PLAY AGAIN', centerX, centerY + 110);
        ctx.globalAlpha = 1;

        ctx.restore();
    }
}

export default Renderer;
