// Global constants and configuration
const CONSTANTS = {
  // Audio constants
  PENTATONIC_SCALE: [1, 1.25, 1.5, 1.67, 2],
  BASE_FREQUENCY: 0.75,
  
  // Animation durations
  SPAWN_ANIMATION_DURATION: 0.5,
  DRAG_ANIMATION_DURATION: 0.3,
  CENTER_GROW_DURATION: 0.5,
  CENTER_MAX_SCALE: 1.0,
  GROW_DURATION: 1.0,
  BOOST_DURATION: 0.3,
  BOOST_SCALE: 1.5,
  MERGE_DURATION: 1.2,
  LAUNCH_DURATION: 2.5,
  
  // Physics
  FRICTION: 0.95,
  VELOCITY_MULTIPLIER: 0.1,
  DAMPING: 0.98,
  DRIFT_SPEED: 50,
  
  // Input
  LONG_PRESS_DURATION: 100,
  CENTER_MARGIN: 10,
  DRAG_SMOOTHING: 0.2,
  
  // Trail system
  TRAIL_POINTS: 20,
  TRAIL_FADE_DURATION: 1.0,
  TRAIL_RADIUS: 30,
  
  // Raycasting
  RAY_COUNT: 120,
  MIN_RAY_THICKNESS: 0.5,
  SHADOW_RAY_COUNT: 60,
  
  // Obstacle
  OBSTACLE_RADIUS: 30,
  
  // Audio file paths
  AUDIO_FILES: {
    HANDPAN: 'handpan.wav',
    DOORBELL: 'doorbell.wav',
    MARIMBA: 'marimba.wav'
  }
}; 