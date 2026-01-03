// Game Configuration Constants
const CONFIG = {
    // Canvas
    CANVAS_WIDTH: window.innerWidth,
    CANVAS_HEIGHT: window.innerHeight,

    // Physics
    GRAVITY: { x: 0, y: 1 },
    RESTITUTION: 0.5,
    FRICTION: 0.6,
    AIR_RESISTANCE: 0.015,

    // Power Meter
    POWER_MIN: 15,
    POWER_MAX: 30,
    POWER_SPEED: 4,

    // Angle Meter
    ANGLE_MIN: 20,  // degrees
    ANGLE_MAX: 60,
    ANGLE_SPEED: 3,

    // Animation Timing
    SLAP_DURATION: 800,   // ms - golem walk + attack
    IMPACT_TIME: 650,     // ms - impact at end of attack anim

    // End Condition
    STOP_THRESHOLD: 0.3,
    STOP_DURATION: 2000,  // ms

    // Camera
    CAMERA_SMOOTHING: 0.08,

    // World
    GROUND_HEIGHT: 120,
    SLAPPER_X: 150,          // Golem start position (left side)
    RAGDOLL_START_X: 500,    // Thug position (more center)
    RAGDOLL_START_Y: 400,

    // Character scales
    THUG_SCALE: 0.4,
    GOLEM_SCALE: 0.5,

    // Parallax speeds (0 = static, 1 = same as camera)
    PARALLAX: {
        sky: 0,
        clouds1: 0.05,
        clouds2: 0.1,
        clouds3: 0.15,
        clouds4: 0.2,
        rocks1: 0.4,
        rocks2: 0.7
    },

    // Colors (fallback if assets not loaded)
    COLORS: {
        BACKGROUND: '#1a1a2e',
        GROUND: '#3d2817',
        GROUND_TOP: '#5d4037',
        POWER_BAR_BG: '#2d3436',
        POWER_BAR_FILL: '#00cec9',
        POWER_BAR_OPTIMAL: '#fdcb6e',
        ANGLE_GAUGE_BG: '#2d3436',
        ANGLE_NEEDLE: '#e17055',
        RAGDOLL_HEAD: '#ffeaa7',
        RAGDOLL_TORSO: '#74b9ff',
        UI_TEXT: '#dfe6e9',
        UI_ACCENT: '#00cec9'
    },

    // Game States
    STATES: {
        LOADING: 'LOADING',
        IDLE: 'IDLE',
        POWER_SELECT: 'POWER_SELECT',
        ANGLE_SELECT: 'ANGLE_SELECT',
        SLAP_ANIMATION: 'SLAP_ANIMATION',
        FLYING: 'FLYING',
        END: 'END'
    }
};

export default CONFIG;
