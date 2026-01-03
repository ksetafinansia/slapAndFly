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
    POWER_BONUS_THRESHOLD: 0.9, // 90%+ = 2x power
    POWER_BONUS_MULTIPLIER: 2.0,

    // Angle Meter (0-90 degrees, ground to up)
    ANGLE_MIN: 0,   // degrees (ground level)
    ANGLE_MAX: 90,  // degrees (straight up)
    ANGLE_SPEED: 3,

    // Sweet Spots (symmetric: green 1x, yellow 3x, red 5x, yellow 3x, green 1x)
    SWEET_SPOTS: [
        { center: 0.1, width: 0.10, multiplier: 1, color: '#2ecc71', name: 'GOOD' },      // Green (left)
        { center: 0.3, width: 0.10, multiplier: 3, color: '#f1c40f', name: 'GREAT' },     // Yellow (left)
        { center: 0.5, width: 0.10, multiplier: 5, color: '#e74c3c', name: 'PERFECT' },   // Red (center)
        { center: 0.7, width: 0.10, multiplier: 3, color: '#f1c40f', name: 'GREAT' },     // Yellow (right)
        { center: 0.9, width: 0.10, multiplier: 1, color: '#2ecc71', name: 'GOOD' }       // Green (right)
    ],

    // Animation Timing
    SLAP_DURATION: 800,
    IMPACT_TIME: 650,

    // End Condition
    STOP_THRESHOLD: 0.3,
    STOP_DURATION: 2000,

    // Camera
    CAMERA_SMOOTHING: 0.08,
    CAMERA_SMOOTHING_FAST: 0.25, // For high-speed tracking
    CAMERA_SPEED_THRESHOLD: 15, // Speed above which to use fast smoothing

    // World Generation
    WORLD_MAX_DISTANCE: 10000, // 10km max world generation
    OBSTACLE_GENERATE_AHEAD: 4000, // Generate this far ahead

    // World
    GROUND_HEIGHT: 120,
    SLAPPER_X: 150,
    RAGDOLL_START_X: 500,
    RAGDOLL_START_Y: 400,

    // Character scales
    THUG_SCALE: 0.4,
    GOLEM_SCALE: 0.5,

    // Parallax speeds
    PARALLAX: {
        sky: 0,
        clouds1: 0.05,
        clouds2: 0.1,
        clouds3: 0.15,
        clouds4: 0.2,
        rocks1: 0.4,
        rocks2: 0.7
    },

    // Colors
    COLORS: {
        BACKGROUND: '#1a1a2e',
        GROUND: '#3d2817',
        GROUND_TOP: '#5d4037',
        POWER_BAR_BG: '#2d3436',
        POWER_BAR_FILL: '#00cec9',
        POWER_BAR_FULL: '#e74c3c',
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
