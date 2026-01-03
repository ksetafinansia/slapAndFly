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

    // Draw power meter bar with bonus zone
    drawPowerMeter(ratio, locked = false, isPowerBonus = false) {
        const ctx = this.ctx;
        const x = 50;
        const y = CONFIG.CANVAS_HEIGHT - 120;
        const width = 350;
        const height = 35;

        // Background
        ctx.fillStyle = CONFIG.COLORS.POWER_BAR_BG;
        ctx.fillRect(x, y, width, height);

        // Bonus zone (90-100%) - red
        ctx.fillStyle = '#e74c3c40';
        ctx.fillRect(x + width * 0.9, y, width * 0.1, height);

        // Fill bar - red if in bonus zone
        if (ratio >= 0.9) {
            ctx.fillStyle = CONFIG.COLORS.POWER_BAR_FULL;
        } else {
            ctx.fillStyle = CONFIG.COLORS.POWER_BAR_FILL;
        }
        ctx.fillRect(x, y, width * ratio, height);

        // Border
        ctx.strokeStyle = CONFIG.COLORS.UI_TEXT;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Bonus zone marker
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + width * 0.9, y);
        ctx.lineTo(x + width * 0.9, y + height);
        ctx.stroke();

        // Moving indicator (if not locked)
        if (!locked) {
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 5;
            ctx.fillRect(x + width * ratio - 3, y - 8, 6, height + 16);
            ctx.shadowBlur = 0;
        }

        // Labels
        ctx.fillStyle = CONFIG.COLORS.UI_TEXT;
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('POWER', x, y - 12);

        // Percentage
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.floor(ratio * 100)}%`, x + width, y - 12);

        // Bonus indicator
        if (isPowerBonus && locked) {
            ctx.fillStyle = '#e74c3c';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('💪 2x POWER!', x + width / 2, y + height + 25);
        }
    }

    // Draw angle meter gauge - positioned above power meter, 0-90 degrees
    drawAngleMeter(ratio, locked = false, sweetSpot = null) {
        const ctx = this.ctx;

        // Position above power meter (bottom-left area)
        const centerX = 225;
        const centerY = CONFIG.CANVAS_HEIGHT - 220;
        const radius = 70;

        // Arc from right (0°) to up (90°) - quarter circle
        const startAngle = 0;              // 0° = pointing right (ground)
        const endAngle = -Math.PI / 2;     // 90° = pointing up
        const angleRange = Math.PI / 2;    // 90 degree sweep

        // Background arc (thick)
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle, true);
        ctx.strokeStyle = CONFIG.COLORS.ANGLE_GAUGE_BG;
        ctx.lineWidth = 25;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Draw sweet spots (green=1x, yellow=3x, red=5x)
        const spots = CONFIG.SWEET_SPOTS;
        const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;

        for (const spot of spots) {
            const spotStart = startAngle - (spot.center - spot.width / 2) * angleRange;
            const spotEnd = startAngle - (spot.center + spot.width / 2) * angleRange;

            ctx.save();
            ctx.shadowColor = spot.color;
            ctx.shadowBlur = 12 * pulse;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, spotStart, spotEnd, true);
            ctx.strokeStyle = spot.color;
            ctx.lineWidth = 28;
            ctx.lineCap = 'butt';
            ctx.stroke();
            ctx.restore();
        }

        // Degree labels
        ctx.fillStyle = CONFIG.COLORS.UI_TEXT;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('0°', centerX + radius + 20, centerY + 5);
        ctx.fillText('90°', centerX, centerY - radius - 15);
        ctx.fillText('45°', centerX + radius * 0.7 + 15, centerY - radius * 0.7 - 10);

        // Needle (bold)
        const needleAngle = startAngle - ratio * angleRange;
        const needleLength = radius + 5;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + Math.cos(needleAngle) * needleLength,
            centerY + Math.sin(needleAngle) * needleLength
        );

        // Needle color based on sweet spot
        let needleColor = '#fff';
        if (sweetSpot) {
            needleColor = sweetSpot.color;
            ctx.shadowColor = sweetSpot.color;
            ctx.shadowBlur = 15;
        } else if (locked) {
            needleColor = '#aaa';
        }
        ctx.strokeStyle = needleColor;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();

        // Center dot
        ctx.beginPath();
        ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
        ctx.fillStyle = sweetSpot ? sweetSpot.color : '#fff';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Current angle display
        const currentAngle = Math.floor(CONFIG.ANGLE_MIN + ratio * (CONFIG.ANGLE_MAX - CONFIG.ANGLE_MIN));
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${currentAngle}°`, centerX, centerY + radius + 40);

        // Label
        ctx.fillStyle = CONFIG.COLORS.UI_TEXT;
        ctx.font = 'bold 18px Arial';
        ctx.fillText('ANGLE', centerX, centerY + radius + 65);

        // Sweet spot hit indicator
        if (sweetSpot && locked) {
            ctx.save();
            ctx.fillStyle = sweetSpot.color;
            ctx.font = 'bold 24px Arial';
            ctx.shadowColor = sweetSpot.color;
            ctx.shadowBlur = 10;
            ctx.fillText(`${sweetSpot.name}! ${sweetSpot.multiplier}x`, centerX, centerY - radius - 30);
            ctx.restore();
        }
    }

    // Draw stats panel at top-left
    drawStatsPanel(power, angle, multiplier, isPowerBonus, sweetSpot) {
        const ctx = this.ctx;
        const x = 30;
        const y = 30;

        ctx.save();

        // Background panel
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.roundRect(x, y, 200, 100, 10);
        ctx.fill();

        // Power info
        ctx.fillStyle = isPowerBonus ? '#e74c3c' : '#00cec9';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`POWER: ${Math.floor(power)}%`, x + 15, y + 30);
        if (isPowerBonus) {
            ctx.fillStyle = '#e74c3c';
            ctx.fillText('(2x)', x + 140, y + 30);
        }

        // Angle info
        ctx.fillStyle = sweetSpot ? sweetSpot.color : '#dfe6e9';
        ctx.fillText(`ANGLE: ${Math.floor(angle)}°`, x + 15, y + 55);
        if (sweetSpot) {
            ctx.fillText(`(${sweetSpot.multiplier}x)`, x + 130, y + 55);
        }

        // Total multiplier
        if (multiplier > 1) {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 22px Arial';
            ctx.fillText(`TOTAL: ${multiplier}x`, x + 15, y + 85);
        }

        ctx.restore();
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

    // Draw end screen with leaderboard
    drawEndScreen(lastDistance, bestDistance, leaderboardData = [], playerName = '', showNameInput = false) {
        const ctx = this.ctx;

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        const centerX = CONFIG.CANVAS_WIDTH / 2;
        const centerY = CONFIG.CANVAS_HEIGHT / 2 - 40;

        // Your score
        ctx.textAlign = 'center';
        ctx.fillStyle = CONFIG.COLORS.UI_ACCENT;
        ctx.font = 'bold 72px Arial';
        ctx.fillText(`${Math.floor(lastDistance)}m`, centerX, centerY - 40);

        ctx.fillStyle = CONFIG.COLORS.UI_TEXT;
        ctx.font = '28px Arial';
        ctx.fillText(`Best: ${Math.floor(bestDistance)}m`, centerX, centerY + 10);

        if (playerName) {
            ctx.fillStyle = '#aaa';
            ctx.font = '18px Arial';
            ctx.fillText(`Playing as: ${playerName}`, centerX, centerY + 40);
        }

        // Leaderboard
        if (leaderboardData && leaderboardData.length > 0) {
            const lbX = centerX;
            const lbY = centerY + 80;

            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 24px Arial';
            ctx.fillText('🏆 TOP 3 SCORES 🏆', lbX, lbY);

            const medals = ['🥇', '🥈', '🥉'];
            leaderboardData.forEach((entry, i) => {
                const y = lbY + 35 + (i * 30);
                ctx.fillStyle = i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : '#cd7f32';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${medals[i]} ${entry.name}: ${entry.distance}m`, lbX, y);
            });
        } else {
            ctx.fillStyle = '#666';
            ctx.font = '18px Arial';
            ctx.fillText('No scores yet - be the first!', centerX, centerY + 100);
        }

        // Tap to play again
        ctx.font = '24px Arial';
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
        ctx.fillText('TAP TO PLAY AGAIN', centerX, CONFIG.CANVAS_HEIGHT - 60);
        ctx.globalAlpha = 1;

        ctx.restore();
    }
}

export default Renderer;
