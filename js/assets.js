// Asset loader and sprite manager
import CONFIG from './config.js';

class Assets {
    constructor() {
        this.images = {};
        this.loaded = false;
        this.onLoadCallback = null;
    }

    async loadAll() {
        const promises = [];

        // Background layers (parallax)
        const bgLayers = ['sky', 'clouds_1', 'clouds_2', 'clouds_3', 'clouds_4', 'rocks_1', 'rocks_2'];
        bgLayers.forEach(layer => {
            promises.push(this.loadImage(layer, `asset/game_background_1/layers/${layer}.png`));
        });

        // Thug head for spinning (Right view)
        promises.push(this.loadImage('thugHead', 'asset/Thug/PNG/Vector Parts/Head - R View.png'));

        // Golem Idle (12 frames)
        for (let i = 0; i <= 11; i++) {
            const idx = i.toString().padStart(3, '0');
            promises.push(this.loadSequenceImage('golemIdle', i, `asset/Golem_03/PNG Sequences/Idle/Golem_03_Idle_${idx}.png`));
        }

        // Golem Walking (18 frames)
        for (let i = 0; i <= 17; i++) {
            const idx = i.toString().padStart(3, '0');
            promises.push(this.loadSequenceImage('golemWalk', i, `asset/Golem_03/PNG Sequences/Walking/Golem_03_Walking_${idx}.png`));
        }

        // Golem Attacking (12 frames)
        for (let i = 0; i <= 11; i++) {
            const idx = i.toString().padStart(3, '0');
            promises.push(this.loadSequenceImage('golemAttack', i, `asset/Golem_03/PNG Sequences/Attacking/Golem_03_Attacking_${idx}.png`));
        }

        // Thug idle sequence (Right - Idle, 16 frames)
        for (let i = 0; i <= 15; i++) {
            const idx = i.toString().padStart(3, '0');
            promises.push(this.loadSequenceImage('thugIdle', i, `asset/Thug/PNG/PNG Sequences/Right - Idle/Right - Idle_${idx}.png`));
        }

        // Thug hurt sequence (Right - Hurt, 10 frames)
        for (let i = 0; i <= 9; i++) {
            const idx = i.toString().padStart(3, '0');
            promises.push(this.loadSequenceImage('thugHurt', i, `asset/Thug/PNG/PNG Sequences/Right - Hurt/Right - Hurt_${idx}.png`));
        }

        // Obstacle SVG icons
        const obstacles = ['bicycle', 'person', 'barrel', 'ramp', 'cloud', 'bird'];
        obstacles.forEach(name => {
            promises.push(this.loadImage(name, `asset/${name}.svg`));
        });

        await Promise.all(promises);
        this.loaded = true;
        console.log('All assets loaded!');

        if (this.onLoadCallback) {
            this.onLoadCallback();
        }
    }

    loadImage(key, path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images[key] = img;
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`Failed to load: ${path}`);
                resolve(null);
            };
            img.src = path;
        });
    }

    loadSequenceImage(key, index, path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                if (!this.images[key]) {
                    this.images[key] = [];
                }
                this.images[key][index] = img;
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`Failed to load sequence: ${path}`);
                resolve(null);
            };
            img.src = path;
        });
    }

    get(key) {
        return this.images[key];
    }

    getFrame(key, frameIndex) {
        const sequence = this.images[key];
        if (sequence && sequence.length > 0) {
            return sequence[frameIndex % sequence.length];
        }
        return null;
    }

    getFrameCount(key) {
        const sequence = this.images[key];
        return sequence ? sequence.length : 0;
    }

    onLoad(callback) {
        if (this.loaded) {
            callback();
        } else {
            this.onLoadCallback = callback;
        }
    }
}

// Singleton
const assets = new Assets();
export default assets;
