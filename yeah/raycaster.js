//sdfsfdsfdsdfds


document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const controls = document.querySelector(".controls");

  // Get slider elements
  const scaleSlider = document.getElementById("scale");
  const circleSizeSlider = document.getElementById("circleSize");
  const rayThicknessSlider = document.getElementById("rayThickness");
  const fadeSpeedSlider = document.getElementById("fadeSpeed");
  const stepSpeedSlider = document.getElementById("stepSpeed");
  const rayLengthSlider = document.getElementById("rayLength");
  const pushForceSlider = document.getElementById("pushForce");
  const outwardForceSlider = document.getElementById("outwardForce");
  const tickFrequencySlider = document.getElementById("tickFrequency");

  // Touch tracking for pinch gesture
  let initialPinchDistance = 0;
  let initialCircleSize = 0;
  let initialStepSpeed = 0;
  let isPinching = false;

  // Calculate distance between two touch points
  function getTouchDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Handle touch events for pinch gesture

  canvas.addEventListener('touchmove', (e) => {
    if (isPinching && e.touches.length === 2) {
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialPinchDistance;
      
      // Calculate new circle size based on pinch scale
      let newSize = initialCircleSize * scale;
      
      // Clamp the size between the slider's min and max values
      newSize = Math.max(parseFloat(circleSizeSlider.min), 
                        Math.min(parseFloat(circleSizeSlider.max), newSize));
      
      // Update the circle size slider and its display value
      circleSizeSlider.value = newSize;
      circleSizeValue.textContent = Math.round(newSize);

      // Calculate new step speed based on pinch scale (inverse relationship)
      let newStepSpeed = initialStepSpeed / scale;
      
      // Clamp the step speed between the slider's min and max values
      newStepSpeed = Math.max(parseFloat(stepSpeedSlider.min),
                            Math.min(parseFloat(stepSpeedSlider.max), newStepSpeed));
      
      // Update the step speed slider and its display value
      stepSpeedSlider.value = newStepSpeed;
      stepSpeedValue.textContent = Math.round(newStepSpeed);
      
      e.preventDefault(); // Prevent default touch behavior
    }
  });

  canvas.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
      isPinching = false;
    }
  });

  canvas.addEventListener('touchcancel', (e) => {
    isPinching = false;
  });

  // Get value display elements
  const scaleValue = document.getElementById("scaleValue");
  const circleSizeValue = document.getElementById("circleSizeValue");
  const rayThicknessValue = document.getElementById("rayThicknessValue");
  const fadeSpeedValue = document.getElementById("fadeSpeedValue");
  const stepSpeedValue = document.getElementById("stepSpeedValue");
  const rayLengthValue = document.getElementById("rayLengthValue");
  const pushForceValue = document.getElementById("pushForceValue");
  const outwardForceValue = document.getElementById("outwardForceValue");
  const tickFrequencyValue = document.getElementById("tickFrequencyValue");

  // Show controls
  controls.style.display = "block";

  // Audio setup
  let audioContext = null;
  let audioBuffer = null;
  let tickBuffer = null;  // Add buffer for tick sound
  let doorbellBuffer = null; // Add buffer for doorbell sound
  let marimbaBuffer = null; // Add buffer for marimba sound
  let isAudioInitialized = false;
  let playingSounds = new Set();  // Track playing sounds by ball ID
  let dragOscillator = null;  // Add oscillator for drag sound
  let dragGainNode = null;    // Add gain node for drag sound

  // Pentatonic scale ratios (relative to base frequency)
  const PENTATONIC_SCALE = [1, 1.25, 1.5, 1.67, 2]; // C, D, E, G, A
  const BASE_FREQUENCY = 0.75; // Base playback rate

  // Initialize audio on first user interaction
  async function initializeAudio() {
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      // Resume the audio context if it's suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Load the kalimba sound
      const response = await fetch('handpan.wav');
      const arrayBuffer = await response.arrayBuffer();
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Load the doorbell sound
      const doorbellResponse = await fetch('doorbell.wav');
      const doorbellArrayBuffer = await doorbellResponse.arrayBuffer();
      doorbellBuffer = await audioContext.decodeAudioData(doorbellArrayBuffer);

      // Load the marimba sound
      const marimbaResponse = await fetch('marimba.wav');
      const marimbaArrayBuffer = await marimbaResponse.arrayBuffer();
      marimbaBuffer = await audioContext.decodeAudioData(marimbaArrayBuffer);

      // Create tick sound
      const tickDuration = 0.1; // 100ms
      tickBuffer = audioContext.createBuffer(1, audioContext.sampleRate * tickDuration, audioContext.sampleRate);
      const tickData = tickBuffer.getChannelData(0);
      for (let i = 0; i < tickBuffer.length; i++) {
        // Create a simple sine wave that fades out
        const t = i / tickBuffer.length;
        tickData[i] = Math.sin(2 * Math.PI * 110 * t) * (1 - t) * 0.05; // Lower volume (0.05)
      }

      // Create oscillator and gain node for drag sound
      dragOscillator = audioContext.createOscillator();
      dragGainNode = audioContext.createGain();
      dragGainNode.gain.value = 0; // Start silent
      dragOscillator.connect(dragGainNode);
      dragGainNode.connect(audioContext.destination);
      dragOscillator.start();

      isAudioInitialized = true;
      console.log("Audio initialized and loaded");
    } catch (error) {
      console.error("Error initializing audio:", error);
    }
  }

  function updateDragSound(x, y) {
    if (!isAudioInitialized || !dragOscillator || !dragGainNode) return;

    const c = center();
    const dx = x - c.x;
    const dy = y - c.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate max possible distance (diagonal of screen)
    const maxDistance = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    
    // Map distance to frequency (220Hz to 880Hz)
    const frequency = 220 + (normalizedDistance * 660);
    dragOscillator.frequency.value = frequency;
    
    // Fade in the sound
    dragGainNode.gain.value = 0.1; // 10% volume
  }

  function stopDragSound() {
    if (!isAudioInitialized || !dragGainNode) return;
    dragGainNode.gain.value = 0;
  }

  function playHitSound(obstacle) {
    if (!isAudioInitialized || !audioContext || !audioBuffer) {
      return;
    }

    // Resume the context if it's suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    // Calculate distance from center
    const c = center();
    const dx = obstacle.x - c.x;
    const dy = obstacle.y - c.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate max possible distance (diagonal of screen)
    const maxDistance = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    
    // Map distance to pentatonic scale
    const scaleIndex = Math.floor(normalizedDistance * PENTATONIC_SCALE.length);
    const playbackRate = BASE_FREQUENCY * PENTATONIC_SCALE[scaleIndex];

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = playbackRate;
    
    // Create gain node for volume control
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.5; // Reduce volume to 50%
    
    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    source.start();
  }

  function playTickSound() {
    if (!isAudioInitialized || !audioContext || !tickBuffer) {
      return;
    }

    // Resume the context if it's suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const source = audioContext.createBufferSource();
    source.buffer = tickBuffer;
    
    // Create gain node for volume control
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.08; // Reduce volume to 8%
    
    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    source.start();
  }

  // Initialize audio on first user interaction
  async function handleFirstInteraction() {
    if (!isAudioInitialized) {
      await initializeAudio();
    }
  }

  // Handle both touch and click events for audio initialization
  canvas.addEventListener('click', handleFirstInteraction);
  canvas.addEventListener('touchstart', handleFirstInteraction);
  document.addEventListener('keydown', handleFirstInteraction);

  // Add a visual indicator for audio initialization
  const audioStatus = document.createElement('div');
  audioStatus.style.position = 'fixed';
  audioStatus.style.top = '10px';
  audioStatus.style.left = '10px';
  audioStatus.style.color = 'white';
  audioStatus.style.padding = '10px';
  audioStatus.style.backgroundColor = 'rgba(0,0,0,0.5)';
  audioStatus.style.borderRadius = '5px';
  audioStatus.style.cursor = 'pointer';
  audioStatus.style.userSelect = 'none';
  audioStatus.style.fontFamily = 'Arial, sans-serif';
  audioStatus.style.fontSize = '16px';
  audioStatus.textContent = 'begin sound toy';
  document.body.appendChild(audioStatus);

  // Update status text when audio is initialized
  const updateAudioStatus = () => {
    if (isAudioInitialized) {
      audioStatus.remove();
    }
  };

  // Modify initializeAudio to update status
  const originalInitializeAudio = initializeAudio;
  initializeAudio = async () => {
    await originalInitializeAudio();
    updateAudioStatus();
  };

  // Store which obstacles have been hit in the current frame
  let hitObstacles = new Set();
  let lastScheduledTime = 0;
  let currentRayIndex = 0;
  let lastStepTime = performance.now() / 1000;
  let lastHitTimes = new Map();  // Track last hit time for each circle

  // Store obstacle circles
  let obstacles = [];
  const obstacleRadius = 30;
  const friction = 0.95; // Friction to slow down movement
  const SPAWN_ANIMATION_DURATION = 0.5; // Duration of spawn animation in seconds
  const DRAG_ANIMATION_DURATION = 0.3; // Duration of drag animation in seconds
  const CENTER_GROW_DURATION = 0.5; // Duration of growth animation in center (seconds)
  const CENTER_MAX_SCALE = 1.0; // Maximum scale when in center (100% of final size)

  // Add variables for touch handling
  let touchStartTime = 0;
  let isLongPress = false;
  let shadowCircle = null;
  const LONG_PRESS_DURATION = 100; // 100ms for long press
  const SHADOW_RAY_COUNT = 60; // Half of the main ray count (120/2)
  let dragStartedInCenter = false;
  const CENTER_MARGIN = 10; // px margin for 'close enough'
  const DRAG_SMOOTHING = 0.2; // Lower = smoother but slower (0-1)
  const GROW_DURATION = 1.0; // Duration of growth animation in seconds
  let lastTouchX = 0; // Track last touch position
  let lastTouchY = 0;
  let lastTouchTime = 0; // Track last touch time for velocity calculation
  const VELOCITY_MULTIPLIER = 0.1; // Reduced from 0.5 to 0.1 for more controlled throwing

  // Add trail system
  let trail = [];
  const TRAIL_POINTS = 20; // Number of points in the trail
  const TRAIL_FADE_DURATION = 1.0; // How long the trail takes to fade (seconds)
  const TRAIL_RADIUS = obstacleRadius; // Radius of trail points

  let isTimeFreeze = false;
  let frozenVelocities = new Map(); // Store original velocities during freeze

  // Add touch event handlers
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault(); // Prevent scrolling
    
    // Only start time freeze if 3 or more fingers are touching
    if (e.touches.length >= 3) {
      isTimeFreeze = true;
      frozenVelocities.clear();
      
      // Store current velocities of all obstacles
      obstacles.forEach((obstacle, index) => {
        frozenVelocities.set(index, {
          vx: obstacle.vx,
          vy: obstacle.vy
        });
      });
      return; // Skip other touch handling when freezing time
    }
    
    // Handle pinch gesture setup
    if (e.touches.length === 2) {
      isPinching = true;
      initialPinchDistance = getTouchDistance(e.touches[0], e.touches[1]);
      initialCircleSize = parseFloat(circleSizeSlider.value);
      initialStepSpeed = parseFloat(stepSpeedSlider.value);
      // Clear any existing shadow circle when pinching starts
      shadowCircle = null;
      return;
    }
    
    // Handle single touch
    if (e.touches.length === 1) {
      touchStartTime = Date.now();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // Initialize touch tracking
      lastTouchX = x;
      lastTouchY = y;
      lastTouchTime = performance.now();
      
      // Check if touch is inside or close to the center circle
      const c = center();
      const scale = parseFloat(scaleSlider.value);
      const centerRadius = parseFloat(circleSizeSlider.value) * scale;
      const distToCenter = Math.sqrt((x - c.x) ** 2 + (y - c.y) ** 2);
      dragStartedInCenter = distToCenter <= centerRadius + CENTER_MARGIN;

      // Only create shadow circle if touch started in center
      if (dragStartedInCenter) {
        shadowCircle = {
          x,
          y,
          radius: obstacleRadius,
          alpha: 0,
          isShadow: true,
          scale: 0,
          spawnTime: performance.now() / 1000,
          isDragging: false,
          dragStartTime: performance.now() / 1000,
          dragStartX: x,
          dragStartY: y,
          centerGrowStartTime: performance.now() / 1000
        };

        // Only add first trail point if starting in center
        trail.push({
          x,
          y,
          radius: TRAIL_RADIUS,
          spawnTime: performance.now() / 1000
        });
      }
    }
  });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault(); // Prevent scrolling
    if (e.touches.length === 1 && shadowCircle) {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const newX = touch.clientX - rect.left;
      const newY = touch.clientY - rect.top;
      
      // Calculate velocity
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTouchTime) / 1000; // Convert to seconds
      if (deltaTime > 0) {
        const vx = (newX - lastTouchX) / deltaTime;
        const vy = (newY - lastTouchY) / deltaTime;
        shadowCircle.vx = vx;
        shadowCircle.vy = vy;
      }
      
      // Update last touch position and time
      lastTouchX = newX;
      lastTouchY = newY;
      lastTouchTime = currentTime;
      
      // If we haven't started dragging yet and we've moved from the start position
      if (!shadowCircle.isDragging && 
          (Math.abs(newX - shadowCircle.dragStartX) > 5 || 
           Math.abs(newY - shadowCircle.dragStartY) > 5)) {
        shadowCircle.isDragging = true;
        shadowCircle.dragStartTime = performance.now() / 1000;
        
        // Check if this is an outward movement from center
        const c = center();
        const startDx = shadowCircle.dragStartX - c.x;
        const startDy = shadowCircle.dragStartY - c.y;
        const startDistance = Math.sqrt(startDx * startDx + startDy * startDy);
        const currentDx = newX - c.x;
        const currentDy = newY - c.y;
        const currentDistance = Math.sqrt(currentDx * currentDx + currentDy * currentDy);
        
        // Make shadow circle visible if moving outward from center or if started in center
        if (currentDistance > startDistance || dragStartedInCenter) {
          shadowCircle.alpha = 0.5;
        }
      }
      
      // Smooth movement for shadow circle
      if (shadowCircle.isDragging && dragStartedInCenter) {
        // Calculate target position
        const targetX = newX;
        const targetY = newY;
        
        // Smoothly interpolate current position to target
        shadowCircle.x += (targetX - shadowCircle.x) * DRAG_SMOOTHING;
        shadowCircle.y += (targetY - shadowCircle.y) * DRAG_SMOOTHING;
      } else {
        // Direct movement for non-center drags
        shadowCircle.x = newX;
        shadowCircle.y = newY;
      }
      
      // Only add trail points if we didn't start in center
      if (!dragStartedInCenter) {
        // Add new trail point if we've moved far enough from last point
        if (trail.length === 0 || 
            Math.sqrt((newX - trail[trail.length - 1].x) ** 2 + 
                     (newY - trail[trail.length - 1].y) ** 2) > TRAIL_RADIUS) {
          trail.push({
            x: newX,
            y: newY,
            radius: TRAIL_RADIUS,
            spawnTime: performance.now() / 1000,
            isTrail: true  // Mark as trail point
          });
          
          // Keep trail at fixed length
          if (trail.length > TRAIL_POINTS) {
            trail.shift();
          }
        }
      }
      
      // Check if we've reached long press duration
      if (!isLongPress && Date.now() - touchStartTime >= LONG_PRESS_DURATION) {
        isLongPress = true;
      }
    }
  });

  canvas.addEventListener("touchend", (e) => {
    e.preventDefault(); // Prevent scrolling

    // End time freeze if fewer than 3 fingers remain
    if (isTimeFreeze && e.touches.length < 3) {
      obstacles.forEach((obstacle, index) => {
        const frozenVel = frozenVelocities.get(index);
        if (frozenVel) {
          obstacle.vx = frozenVel.vx;
          obstacle.vy = frozenVel.vy;
        }
      });
      isTimeFreeze = false;
      frozenVelocities.clear();
    }

    if (shadowCircle) {
      // Stop drag sound
      stopDragSound();
      
      const c = center();
      const dx = shadowCircle.x - c.x;
      const dy = shadowCircle.y - c.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      // Check if this is a flick from center towards outside
      const startDx = shadowCircle.dragStartX - c.x;
      const startDy = shadowCircle.dragStartY - c.y;
      const startDistance = Math.sqrt(startDx * startDx + startDy * startDy);
      const endDistance = length;
      
      // Determine if gesture moves from center towards outside
      const isOutwardFlick = endDistance > startDistance && shadowCircle.isDragging;
      
      // Check if this was a quick tap (not much movement and short duration)
      const tapDuration = Date.now() - touchStartTime;
      const dragDistance = Math.sqrt(
        (shadowCircle.x - shadowCircle.dragStartX) ** 2 + 
        (shadowCircle.y - shadowCircle.dragStartY) ** 2
      );
      const isQuickTap = tapDuration < 300 && dragDistance < 10; // Quick tap with minimal movement
      
      // Add a permanent circle if:
      // 1. It's a long press that started in center (original behavior), OR
      // 2. It's any flick gesture moving from center towards outside
      if ((isLongPress && dragStartedInCenter) || isOutwardFlick) {
        const normalizedDx = length > 0 ? dx / length : 0;
        const normalizedDy = length > 0 ? dy / length : 0;
        const outwardForce = parseFloat(outwardForceSlider.value);

        // Calculate final velocity based on touch movement
        const finalVx = (shadowCircle.vx || 0) * VELOCITY_MULTIPLIER;
        const finalVy = (shadowCircle.vy || 0) * VELOCITY_MULTIPLIER;

        // For outward flicks that didn't start in center, make the circle spawn from center
        let spawnX, spawnY;
        if (isOutwardFlick && !dragStartedInCenter) {
          // Start from center and animate to final position
          spawnX = c.x;
          spawnY = c.y;
        } else {
          // Original behavior for center-started drags
          spawnX = shadowCircle.x;
          spawnY = shadowCircle.y;
        }

        // Play marimba sound when creating new circle
        if (isAudioInitialized && marimbaBuffer) {
          const gainNode = audioContext.createGain();
          gainNode.gain.value = 0.4;
          const source = audioContext.createBufferSource();
          source.buffer = marimbaBuffer;
          
          // Calculate pitch based on distance from center
          const maxDistance = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) / 2;
          const normalizedDistance = length / maxDistance;
          // Map distance to pentatonic scale (C4 to C5)
          const pitches = [1.0, 1.122, 1.260, 1.498, 1.682, 2.0]; // C, D, E, G, A, C
          const pitchIndex = Math.floor(normalizedDistance * (pitches.length - 1));
          source.playbackRate.value = pitches[pitchIndex];
          
          source.connect(gainNode);
          gainNode.connect(audioContext.destination);
          source.start();
        }

        obstacles.push({
          x: spawnX,
          y: spawnY,
          targetX: shadowCircle.x, // Final position to animate to
          targetY: shadowCircle.y,
          radius: obstacleRadius,
          vx: finalVx + normalizedDx * outwardForce,
          vy: finalVy + normalizedDy * outwardForce,
          spawnTime: performance.now() / 1000,
          scale: 0,
          isDragging: false,
          dragStartTime: performance.now() / 1000,
          dragStartX: spawnX,
          dragStartY: spawnY,
          isLaunching: isOutwardFlick && !dragStartedInCenter, // Flag for launch animation
          launchProgress: 0, // Progress of launch animation (0 to 1)
          damping: 0.98
        });
      } else if (isQuickTap) {
        // Handle quick taps for boosting circles
        console.log(`Quick tap detected at ${shadowCircle.x}, ${shadowCircle.y}`); // Debug
        handleClickOrTap(shadowCircle.x, shadowCircle.y);
      }
      
      // Clear the shadow circle
      shadowCircle = null;
      isLongPress = false;
      dragStartedInCenter = false;
    } else if (e.changedTouches && e.changedTouches.length === 1) {
      // Handle simple taps when there's no shadowCircle (no drag)
      const touch = e.changedTouches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // Check if this was a quick tap (not a long interaction)
      const tapDuration = Date.now() - touchStartTime;
      if (tapDuration < 300) { // Quick tap under 300ms
        console.log(`Tap detected at ${x}, ${y}`); // Debug
        handleClickOrTap(x, y);
      }
    }
  });

  // Add touchcancel handler
  canvas.addEventListener("touchcancel", (e) => {
    e.preventDefault(); // Prevent scrolling
    // Also end time freeze on touch cancel
    if (isTimeFreeze) {
      obstacles.forEach((obstacle, index) => {
        const frozenVel = frozenVelocities.get(index);
        if (frozenVel) {
          obstacle.vx = frozenVel.vx;
          obstacle.vy = frozenVel.vy;
        }
      });
      isTimeFreeze = false;
      frozenVelocities.clear();
    }
    if (shadowCircle) {
      stopDragSound();
      shadowCircle = null;
      isLongPress = false;
    }
  });

  // Add click/tap handler for boosting circles and creating new ones
  function handleClickOrTap(x, y) {
    console.log(`Click at ${x}, ${y}`); // Debug
    console.log(`Number of obstacles: ${obstacles.length}`); // Debug
    
    // Check if we clicked on any existing circle
    const clickedObstacle = obstacles.find(obstacle => {
      const dx = x - obstacle.x;
      const dy = y - obstacle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const hitRadius = obstacle.radius * obstacle.scale + 20; // Add 20px buffer to hitbox
      console.log(`Checking obstacle at ${obstacle.x}, ${obstacle.y}, distance: ${distance}, hitRadius: ${hitRadius}`); // Debug
      return distance <= hitRadius;
    });

    if (clickedObstacle) {
      console.log('Hit a circle!'); // Debug
      // Apply a strong outward boost
      const c = center();
      const dx = clickedObstacle.x - c.x;
      const dy = clickedObstacle.y - c.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length > 0) {
        // Increment boost count for this circle
        clickedObstacle.boostCount = (clickedObstacle.boostCount || 0) + 1;
        
        const normalizedDx = dx / length;
        const normalizedDy = dy / length;
        // Exponential boost force based on boost count
        const baseBoostForce = parseFloat(outwardForceSlider.value) * 3;
        const exponentialMultiplier = Math.pow(1.5, clickedObstacle.boostCount - 1); // 1.5x stronger each boost
        const boostForce = baseBoostForce * exponentialMultiplier;
        
        console.log(`Circle boosted ${clickedObstacle.boostCount} times, force multiplier: ${exponentialMultiplier}`);
        
        // Add velocity boost
        clickedObstacle.vx += normalizedDx * boostForce;
        clickedObstacle.vy += normalizedDy * boostForce;
        
        // Add boost animation
        clickedObstacle.isBoostAnimating = true;
        clickedObstacle.boostStartTime = performance.now() / 1000;
        
        // Play hit sound for feedback
        playHitSound(clickedObstacle);
      }
    } else {
      console.log('Creating new circle'); // Debug
      // If we didn't click a circle, create a new one that emerges from center
      const c = center();
      const dx = x - c.x;
      const dy = y - c.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      // Check if click was outside center circle
      const scale = parseFloat(scaleSlider.value);
      const centerRadius = parseFloat(circleSizeSlider.value) * scale;
      const isOutsideCenter = length > centerRadius + CENTER_MARGIN;

      if (isOutsideCenter) {
        // Normalize direction and apply initial outward velocity
        const normalizedDx = dx / length;
        const normalizedDy = dy / length;
        const outwardForce = parseFloat(outwardForceSlider.value);

        // Calculate initial velocity based on distance
        const launchSpeed = Math.min(length * 2, 800); // Cap the maximum speed
        const initialVx = normalizedDx * launchSpeed;
        const initialVy = normalizedDy * launchSpeed;

        // Play marimba sound when creating new circle
        if (isAudioInitialized && marimbaBuffer) {
          const gainNode = audioContext.createGain();
          gainNode.gain.value = 0.4;
          const source = audioContext.createBufferSource();
          source.buffer = marimbaBuffer;
          
          // Calculate pitch based on distance from center
          const maxDistance = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) / 2;
          const normalizedDistance = length / maxDistance;
          const pitches = [1.0, 1.122, 1.260, 1.498, 1.682, 2.0];
          const pitchIndex = Math.floor(normalizedDistance * (pitches.length - 1));
          source.playbackRate.value = pitches[pitchIndex];
          
          source.connect(gainNode);
          gainNode.connect(audioContext.destination);
          source.start();
        }

        obstacles.push({
          x: c.x, // Start at center
          y: c.y,
          radius: obstacleRadius,
          vx: initialVx,
          vy: initialVy,
          spawnTime: performance.now() / 1000,
          scale: 0,
          isBoostAnimating: false,
          boostCount: 0,
          // Remove launch animation properties and just use physics
          isLaunching: false,
          // Add damping for smooth deceleration
          damping: 0.98
        });
      }
    }
  }

  canvas.addEventListener("click", (e) => {
    // Only handle clicks if we're not in a touch interaction
    if (!shadowCircle) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      handleClickOrTap(x, y);
    }
  });

  // Resize canvas to fit window
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  // Raycaster parameters
  const center = () => ({
    x: canvas.width / 2,
    y: canvas.height / 2,
  });
  const rayCount = 120;
  const minRayThickness = 0.5;

  // Calculate intersection with a circle
  function rayCircleIntersection(cx, cy, r, x0, y0, dx, dy) {
    // Ray: (x0, y0) + t*(dx, dy), t >= 0
    // Circle: (x-cx)^2 + (y-cy)^2 = r^2
    // Solve for t
    const a = dx * dx + dy * dy;
    const b = 2 * (dx * (x0 - cx) + dy * (y0 - cy));
    const c = (x0 - cx) * (x0 - cx) + (y0 - cy) * (y0 - cy) - r * r;
    const disc = b * b - 4 * a * c;
    if (disc < 0) return null;
    const sqrtDisc = Math.sqrt(disc);
    const t1 = (-b - sqrtDisc) / (2 * a);
    const t2 = (-b + sqrtDisc) / (2 * a);
    if (t2 < 0) return null;
    if (t1 >= 0) return t1;
    return t2;
  }

  // Calculate ray length to screen border or obstacle
  function calculateRayLengthToBorder(rayOriginX, rayOriginY, dx, dy) {
    // Calculate intersection with screen borders
    let t = Infinity;
    let hitObstacle = null;

    // Check horizontal borders (y = 0 and y = height)
    if (dy !== 0) {
      const t1 = -rayOriginY / dy; // intersection with top border
      const t2 = (canvas.height - rayOriginY) / dy; // intersection with bottom border
      if (t1 > 0) t = Math.min(t, t1);
      if (t2 > 0) t = Math.min(t, t2);
    }

    // Check vertical borders (x = 0 and x = width)
    if (dx !== 0) {
      const t3 = -rayOriginX / dx; // intersection with left border
      const t4 = (canvas.width - rayOriginX) / dx; // intersection with right border
      if (t3 > 0) t = Math.min(t, t3);
      if (t4 > 0) t = Math.min(t, t4);
    }

    // Check intersections with obstacles
    for (const obstacle of obstacles) {
      const tObstacle = rayCircleIntersection(
        obstacle.x,
        obstacle.y,
        obstacle.radius * obstacle.scale,
        rayOriginX,
        rayOriginY,
        dx,
        dy
      );
      if (tObstacle !== null && tObstacle > 0 && tObstacle < t) {
        t = tObstacle;
        hitObstacle = obstacle;
      }
    }

    // Check intersection with trail points
    for (const point of trail) {
      const tTrail = rayCircleIntersection(
        point.x,
        point.y,
        point.radius,
        rayOriginX,
        rayOriginY,
        dx,
        dy
      );
      if (tTrail !== null && tTrail > 0 && tTrail < t) {
        t = tTrail;
        hitObstacle = point;
      }
    }

    // Check intersection with shadow circle if it exists
    if (shadowCircle) {
      const tShadow = rayCircleIntersection(
        shadowCircle.x,
        shadowCircle.y,
        shadowCircle.radius * shadowCircle.scale,
        rayOriginX,
        rayOriginY,
        dx,
        dy
      );
      if (tShadow !== null && tShadow > 0 && tShadow < t) {
        t = tShadow;
        hitObstacle = shadowCircle;
      }
    }

    return { distance: t, hitObstacle };
  }

  // Store ray states
  let rays = Array(rayCount)
    .fill()
    .map(() => ({
      opacity: 0,
      active: false,
    }));

  // Update display values when sliders change
  scaleSlider.addEventListener("input", (e) => {
    scaleValue.textContent = e.target.value;
  });

  circleSizeSlider.addEventListener("input", (e) => {
    circleSizeValue.textContent = e.target.value;
  });

  rayThicknessSlider.addEventListener("input", (e) => {
    rayThicknessValue.textContent = e.target.value;
  });

  fadeSpeedSlider.addEventListener("input", (e) => {
    fadeSpeedValue.textContent = e.target.value;
  });

  stepSpeedSlider.addEventListener("input", (e) => {
    stepSpeedValue.textContent = e.target.value;
  });

  rayLengthSlider.addEventListener("input", (e) => {
    rayLengthValue.textContent = e.target.value;
  });

  pushForceSlider.addEventListener("input", (e) => {
    pushForceValue.textContent = e.target.value;
  });

  outwardForceSlider.addEventListener("input", (e) => {
    outwardForceValue.textContent = e.target.value;
  });

  tickFrequencySlider.addEventListener("input", (e) => {
    tickFrequencyValue.textContent = e.target.value;
  });

  function updateObstacles(deltaTime) {
    // Create a new array to store obstacles that are still in bounds
    const activeObstacles = [];
    const c = center();
    const outwardForce = parseFloat(outwardForceSlider.value);
    const currentTime = performance.now() / 1000;

    // Handle collisions and merging
    if (!isTimeFreeze) {  // Only check collisions when not time-frozen
      for (let i = 0; i < obstacles.length; i++) {
        // Skip if this obstacle is already being merged
        if (obstacles[i].isMerging) continue;
        
        for (let j = i + 1; j < obstacles.length; j++) {
          // Skip if either obstacle is already being merged
          if (obstacles[j].isMerging) continue;
          
          const obstacleA = obstacles[i];
          const obstacleB = obstacles[j];
          
          // Calculate distance between centers
          const dx = obstacleB.x - obstacleA.x;
          const dy = obstacleB.y - obstacleA.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = (obstacleA.radius * obstacleA.scale) + (obstacleB.radius * obstacleB.scale);
          
          // Check if circles are touching or overlapping
          if (distance <= minDistance && distance > 0) {
            // If either circle is launching, we need to handle the transition
            const isEitherLaunching = obstacleA.isLaunching || obstacleB.isLaunching;
            
            // Calculate the weighted average position based on circle sizes
            const totalRadius = (obstacleA.radius * obstacleA.scale) + (obstacleB.radius * obstacleB.scale);
            const weightA = (obstacleA.radius * obstacleA.scale) / totalRadius;
            const weightB = (obstacleB.radius * obstacleB.scale) / totalRadius;
            
            // If a circle is launching, use its target position instead of current position
            const posAX = obstacleA.isLaunching ? obstacleA.targetX : obstacleA.x;
            const posAY = obstacleA.isLaunching ? obstacleA.targetY : obstacleA.y;
            const posBX = obstacleB.isLaunching ? obstacleB.targetX : obstacleB.x;
            const posBY = obstacleB.isLaunching ? obstacleB.targetY : obstacleB.y;
            
            // Calculate merged position
            const mergedX = posAX * weightA + posBX * weightB;
            const mergedY = posAY * weightA + posBY * weightB;
            
            // Calculate merged velocity (weighted average)
            const mergedVx = obstacleA.vx * weightA + obstacleB.vx * weightB;
            const mergedVy = obstacleA.vy * weightA + obstacleB.vy * weightB;
            
            // Calculate merged radius (based on combined area)
            const areaA = Math.PI * Math.pow(obstacleA.radius * obstacleA.scale, 2);
            const areaB = Math.PI * Math.pow(obstacleB.radius * obstacleB.scale, 2);
            const mergedRadius = Math.sqrt((areaA + areaB) / Math.PI);
            
            // Mark both circles as merging
            obstacleA.isMerging = true;
            obstacleB.isMerging = true;
            
            // Create the merged circle with special handling for launching circles
            obstacles.push({
              x: mergedX,
              y: mergedY,
              radius: mergedRadius,
              vx: mergedVx,
              vy: mergedVy,
              spawnTime: currentTime,
              scale: isEitherLaunching ? Math.max(obstacleA.scale, obstacleB.scale) : 0, // Start at larger scale if launching
              mergeStartTime: currentTime,
              isMergingNew: true,
              sourceCircles: [obstacleA, obstacleB],
              boostCount: (obstacleA.boostCount || 0) + (obstacleB.boostCount || 0),
              mergeAnimationProgress: 0,
              // If either circle was launching, continue the launch animation
              isLaunching: isEitherLaunching,
              launchStartTime: isEitherLaunching ? currentTime : null,
              launchProgress: isEitherLaunching ? Math.max(
                obstacleA.isLaunching ? obstacleA.launchProgress : 0,
                obstacleB.isLaunching ? obstacleB.launchProgress : 0
              ) : 0,
              // Store target position if launching
              targetX: isEitherLaunching ? mergedX : null,
              targetY: isEitherLaunching ? mergedY : null,
              damping: 0.98
            });
            
            // Play merge sound with modified pitch based on interruption
            if (isAudioInitialized && doorbellBuffer) {
              const gainNode = audioContext.createGain();
              gainNode.gain.value = 0.4; // Adjust volume as needed
              const source = audioContext.createBufferSource();
              source.buffer = doorbellBuffer;
              source.playbackRate.value = 1.0; // Normal playback rate
              source.connect(gainNode);
              gainNode.connect(audioContext.destination);
              source.start();
            }
            
            // Skip checking other collisions for these circles
            break;
          }
        }
      }
    }

    // Update and filter obstacles
    for (const obstacle of obstacles) {
      // Handle merge animation for source circles
      if (obstacle.isMerging && !obstacle.isMergingNew) {
        const mergeAge = currentTime - obstacle.mergeStartTime;
        const MERGE_DURATION = 1.2; // Increased from 0.3 to 1.2 seconds
        
        if (mergeAge < MERGE_DURATION) {
          // Smoother fade out using cubic easing
          const progress = mergeAge / MERGE_DURATION;
          const easeOutCubic = 1 - Math.pow(1 - progress, 3);
          obstacle.scale *= (1 - easeOutCubic);
          continue;
        } else {
          continue;
        }
      }
      
      // Handle merge animation for new merged circle
      if (obstacle.isMergingNew) {
        const mergeAge = currentTime - obstacle.mergeStartTime;
        const MERGE_DURATION = 1.2; // Increased from 0.3 to 1.2 seconds
        
        if (mergeAge < MERGE_DURATION) {
          // Smooth growth using cubic easing
          const progress = mergeAge / MERGE_DURATION;
          const easeOutCubic = 1 - Math.pow(1 - progress, 3);
          obstacle.scale = easeOutCubic;
          obstacle.mergeAnimationProgress = easeOutCubic;
        } else {
          obstacle.scale = 1;
          obstacle.isMergingNew = false;
        }
      }

      // Update spawn animation
      const timeSinceSpawn = currentTime - obstacle.spawnTime;
      if (timeSinceSpawn < SPAWN_ANIMATION_DURATION && !obstacle.isMergingNew) {
        // Ease out cubic function for smooth animation
        const t = timeSinceSpawn / SPAWN_ANIMATION_DURATION;
        obstacle.scale = 1 - Math.pow(1 - t, 3);
      } else if (!obstacle.isMergingNew) {
        obstacle.scale = 1;
      }

      // Calculate direction from center to obstacle
      const dx = obstacle.x - c.x;
      const dy = obstacle.y - c.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      // Add constant outward force
      if (length > 0) {
        const normalizedDx = dx / length;
        const normalizedDy = dy / length;
        obstacle.vx += normalizedDx * outwardForce * deltaTime;
        obstacle.vy += normalizedDy * outwardForce * deltaTime;
      }

      // Update position based on velocity
      if (isTimeFreeze) {
        // During time freeze, slowly move towards center
        const centerX = c.x;
        const centerY = c.y;
        const dx = centerX - obstacle.x;
        const dy = centerY - obstacle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
          const DRIFT_SPEED = 50; // pixels per second
          const normalizedDx = dx / dist;
          const normalizedDy = dy / dist;
          
          obstacle.x += normalizedDx * DRIFT_SPEED * deltaTime;
          obstacle.y += normalizedDy * DRIFT_SPEED * deltaTime;
          
          // Add subtle pulsing effect during freeze
          const pulseScale = 1 + Math.sin(currentTime * 2) * 0.03;
          obstacle.scale = obstacle.scale * pulseScale;
        }
      } else {
        obstacle.x += obstacle.vx * deltaTime;
        obstacle.y += obstacle.vy * deltaTime;

        // Apply damping for smooth deceleration
        if (obstacle.damping) {
          obstacle.vx *= Math.pow(obstacle.damping, deltaTime * 60);
          obstacle.vy *= Math.pow(obstacle.damping, deltaTime * 60);
        } else {
          obstacle.vx *= friction;
          obstacle.vy *= friction;
        }

        // Stop very slow movement
        if (Math.abs(obstacle.vx) < 0.1) obstacle.vx = 0;
        if (Math.abs(obstacle.vy) < 0.1) obstacle.vy = 0;
      }

      // Check if the obstacle is completely offscreen
      const isOffscreen =
        obstacle.x + obstacle.radius < 0 || // Left of screen
        obstacle.x - obstacle.radius > canvas.width || // Right of screen
        obstacle.y + obstacle.radius < 0 || // Above screen
        obstacle.y - obstacle.radius > canvas.height; // Below screen

      // Only keep obstacles that are still on screen and not finished merging
      if (!isOffscreen && (!obstacle.isMerging || obstacle.isMergingNew)) {
        activeObstacles.push(obstacle);
      } else if (isOffscreen) {
        // Remove from frozen velocities if it goes offscreen
        frozenVelocities.delete(obstacles.indexOf(obstacle));
      }
    }

    // Update the obstacles array with only the active ones
    obstacles = activeObstacles;
  }

  function draw() {
    // Add time freeze visual effects
    if (isTimeFreeze) {
      // Add a subtle overlay to indicate time freeze
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      
      // Add a pulsing glow to the center
      const c = center();
      ctx.save();
      const pulseIntensity = 0.2 + Math.sin(performance.now() / 1000 * 2) * 0.1;
      const gradient = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 200);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${pulseIntensity})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const c = center();
    const currentTime = performance.now() / 1000;

    // Update and draw trail
    trail = trail.filter(point => {
      const age = currentTime - point.spawnTime;
      return age < TRAIL_FADE_DURATION;
    });

    // Draw trail points
    trail.forEach(point => {
      const age = currentTime - point.spawnTime;
      const alpha = 1 - (age / TRAIL_FADE_DURATION);
      
      // Draw trail point
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.3})`; // Semi-transparent
      ctx.fill();
    });

    // Clear hit obstacles at the start of each frame
    hitObstacles.clear();

    // Get current values
    const scale = parseFloat(scaleSlider.value);
    const circleRadius = parseFloat(circleSizeSlider.value) * scale;
    const maxRayThickness = parseFloat(rayThicknessSlider.value) * scale;
    const pushForce = parseFloat(pushForceSlider.value);

    // Draw central circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(c.x, c.y, circleRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#000000";
    ctx.fill();
    ctx.restore();

    // Draw shadow circle if it exists
    if (shadowCircle) {
      const timeSinceSpawn = currentTime - shadowCircle.spawnTime;
      
      // Calculate scale based on whether we're dragging or not
      if (shadowCircle.isDragging) {
        const dragTime = currentTime - shadowCircle.dragStartTime;
        if (dragTime < GROW_DURATION) {
          // Slower growth animation during drag
          const t = dragTime / GROW_DURATION;
          const startScale = shadowCircle.scale;
          shadowCircle.scale = startScale + ((1 - startScale) * (1 - Math.pow(1 - t, 2)));
        } else {
          shadowCircle.scale = 1;
        }
      } else {
        // Growth animation in center
        const centerGrowTime = currentTime - shadowCircle.centerGrowStartTime;
        if (centerGrowTime < CENTER_GROW_DURATION) {
          // Smooth growth from 0 to CENTER_MAX_SCALE
          const t = centerGrowTime / CENTER_GROW_DURATION;
          shadowCircle.scale = CENTER_MAX_SCALE * (1 - Math.pow(1 - t, 3));
        } else {
          shadowCircle.scale = CENTER_MAX_SCALE;
        }
      }

      // Draw the shadow circle fill with a different color when in center
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
      ctx.beginPath();
      ctx.arc(shadowCircle.x, shadowCircle.y, shadowCircle.radius * shadowCircle.scale, 0, Math.PI * 2);
      if (!shadowCircle.isDragging) {
        // When in center, use a more visible color
        ctx.fillStyle = `rgba(255, 255, 255, ${shadowCircle.alpha * 0.8})`;
      } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${shadowCircle.alpha})`;
      }
      ctx.fill();
      ctx.restore();

      // Draw the shadow circle outline with a thicker line when in center
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
      ctx.beginPath();
      ctx.arc(shadowCircle.x, shadowCircle.y, shadowCircle.radius * shadowCircle.scale, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = shadowCircle.isDragging ? 1 : 2;
      ctx.stroke();
      ctx.restore();

      // Only draw connection rays during long press, and only if dragging from center
      if (isLongPress && dragStartedInCenter) {
        const c = center();
        // Draw a subtle connecting line
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(shadowCircle.x, shadowCircle.y);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // Only cast rays if this is NOT a center drag (either during or after starting from center)
      if (!dragStartedInCenter && !shadowCircle.isDragging) {
        // Cast rays from shadow circle
        const shadowRayCount = rayCount;
        for (let i = 0; i < shadowRayCount; ++i) {
          const angle = (2 * Math.PI * i) / shadowRayCount;
          const dx = Math.cos(angle);
          const dy = Math.sin(angle);

          // Calculate ray length to screen border or obstacle
          const { distance: maxLength } = calculateRayLengthToBorder(
            shadowCircle.x,
            shadowCircle.y,
            dx,
            dy
          );
          const currentRayLength = maxLength * parseFloat(rayLengthSlider.value) * parseFloat(scaleSlider.value);

          // Ray start/end
          const startX = shadowCircle.x + dx * shadowCircle.radius * shadowCircle.scale;
          const startY = shadowCircle.y + dy * shadowCircle.radius * shadowCircle.scale;
          const endX = shadowCircle.x + dx * currentRayLength;
          const endY = shadowCircle.y + dy * currentRayLength;

          // Draw shadow ray
          ctx.save();
          ctx.shadowBlur = 10;
          ctx.shadowColor = `rgba(255, 255, 255, ${shadowCircle.alpha * 0.4})`;
          ctx.strokeStyle = `rgba(255,255,255,${shadowCircle.alpha * 0.5})`;
          ctx.lineWidth = parseFloat(rayThicknessSlider.value) * parseFloat(scaleSlider.value);
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // Draw obstacles
    obstacles.forEach((obstacle) => {
      const BOOST_DURATION = 0.3; // Duration of boost animation in seconds
      const BOOST_SCALE = 1.5; // Maximum scale during boost
      
      // Calculate boost animation if active
      let currentScale = obstacle.scale;
      if (obstacle.isBoostAnimating) {
        const boostAge = currentTime - obstacle.boostStartTime;
        if (boostAge < BOOST_DURATION) {
          // Create a quick expand and contract animation
          const t = boostAge / BOOST_DURATION;
          const boostScale = 1 + (BOOST_SCALE - 1) * Math.sin(t * Math.PI); // Sine wave for smooth in/out
          currentScale *= boostScale;
        } else {
          obstacle.isBoostAnimating = false;
        }
      }

      // Add merge animation effects
      if (obstacle.isMergingNew) {
        const mergeAge = currentTime - obstacle.mergeStartTime;
        const MERGE_DURATION = 1.2; // Match the new longer duration
        
        if (mergeAge < MERGE_DURATION) {
          // Add gentler glow during merge
          ctx.save();
          ctx.shadowBlur = 20; // Reduced from 30
          
          // Smoother fade using cubic easing
          const progress = mergeAge / MERGE_DURATION;
          const easeOutCubic = 1 - Math.pow(1 - progress, 3);
          const fadeOpacity = 1 - easeOutCubic;
          
          ctx.shadowColor = `rgba(255, 255, 255, ${fadeOpacity * 0.6})`; // Reduced opacity
          
          // Draw gentler shockwave
          const shockwaveProgress = easeOutCubic;
          const shockwaveRadius = obstacle.radius * (1 + shockwaveProgress * 1.5); // Reduced expansion
          ctx.beginPath();
          ctx.arc(obstacle.x, obstacle.y, shockwaveRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * fadeOpacity})`; // Reduced opacity
          ctx.lineWidth = 1.5; // Thinner line
          ctx.stroke();
          ctx.restore();
        }
      }

      // Add launch animation effects
      if (obstacle.isLaunching) {
        const launchAge = currentTime - obstacle.launchStartTime;
        const LAUNCH_DURATION = 2.5; // Match the new duration
        
        if (launchAge < LAUNCH_DURATION) {
          // Add gentler launch trail effect
          ctx.save();
          ctx.shadowBlur = 10; // Reduced blur
          ctx.shadowColor = `rgba(255, 255, 255, ${0.3 * (1 - obstacle.launchProgress)})`; // More subtle shadow
          
          // Draw energy trail from center
          const c = center();
          const dx = obstacle.x - c.x;
          const dy = obstacle.y - c.y;
          const angle = Math.atan2(dy, dx);
          
          // Draw curved trail with gentler curve
          ctx.beginPath();
          ctx.moveTo(c.x, c.y);
          
          // Control points for curved path - reduced curve intensity
          const midX = c.x + dx * 0.5;
          const midY = c.y + dy * 0.5;
          const perpX = -dy * 0.1; // Reduced perpendicular offset for gentler curve
          const perpY = dx * 0.1;
          
          // Draw multiple fading trails for ethereal effect
          for (let i = 0; i < 3; i++) {
            const offset = (i - 1) * 0.1; // Spread trails slightly
            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.quadraticCurveTo(
              midX + perpX * (1 - obstacle.launchProgress + offset),
              midY + perpY * (1 - obstacle.launchProgress + offset),
              obstacle.x,
              obstacle.y
            );
            
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - obstacle.launchProgress)})`; // Much more subtle
            ctx.lineWidth = 1 * (1 - obstacle.launchProgress); // Thinner lines
            ctx.stroke();
          }
          
          // Draw subtle expanding ring at launch point
          const ringProgress = Math.min(launchAge / (LAUNCH_DURATION * 0.5), 1);
          const ringRadius = obstacle.radius * (1 + ringProgress * 1.5); // Reduced expansion
          ctx.beginPath();
          ctx.arc(c.x, c.y, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - ringProgress)})`; // More subtle
          ctx.lineWidth = 0.5; // Thinner line
          ctx.stroke();
          
          // Add subtle pulsing glow at center
          const pulseIntensity = 0.2 + 0.1 * Math.sin(currentTime * 2);
          ctx.beginPath();
          ctx.arc(c.x, c.y, obstacle.radius * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${pulseIntensity * (1 - obstacle.launchProgress)})`;
          ctx.fill();
          
          ctx.restore();
        }
      }

      // Calculate direction from center for shadow
      const c = center();
      const dx = obstacle.x - c.x;
      const dy = obstacle.y - c.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const normalizedDx = length > 0 ? dx / length : 0;
      const normalizedDy = length > 0 ? dy / length : 0;

      // Draw rim lighting with increased intensity for merging circles
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        obstacle.x,
        obstacle.y,
        obstacle.radius * currentScale,
        0,
        Math.PI * 2
      );
      
      // Create a radial gradient for rim lighting
      const rimGradient = ctx.createRadialGradient(
        obstacle.x - normalizedDx * obstacle.radius * currentScale * 0.3,
        obstacle.y - normalizedDy * obstacle.radius * currentScale * 0.3,
        0,
        obstacle.x,
        obstacle.y,
        obstacle.radius * currentScale
      );
      
      // Enhance glow for merging circles
      if (obstacle.isMergingNew) {
        rimGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)'); // Slightly dimmer center
        rimGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)'); // Gentler mid glow
        rimGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      } else {
        rimGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        rimGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
        rimGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      
      ctx.fillStyle = rimGradient;
      ctx.fill();
      ctx.restore();

      // Draw the circle fill (background color)
      ctx.beginPath();
      ctx.arc(
        obstacle.x,
        obstacle.y,
        obstacle.radius * currentScale,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "#FFFFFF"; // Background color
      ctx.fill();

      // Draw the circle outline
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
      ctx.beginPath();
      ctx.arc(
        obstacle.x,
        obstacle.y,
        obstacle.radius * currentScale,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Add a glow effect when boosting
      if (obstacle.isBoostAnimating) {
        const boostAge = currentTime - obstacle.boostStartTime;
        if (boostAge < BOOST_DURATION) {
          // Increase the glow intensity based on boost count
          const baseGlow = 15;
          const boostMultiplier = obstacle.boostCount ? Math.min(obstacle.boostCount * 1.5, 5) : 1;
          const glowIntensity = baseGlow * boostMultiplier;
          
          // Create an extra glow layer
          ctx.save();
          ctx.shadowBlur = glowIntensity;
          ctx.shadowColor = `rgba(255, 255, 255, ${1 - (boostAge / BOOST_DURATION)})`;
          ctx.beginPath();
          ctx.arc(
            obstacle.x,
            obstacle.y,
            obstacle.radius * obstacle.scale,
            0,
            Math.PI * 2
          );
          ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();
        }
      }
    });

    const now = performance.now() / 1000;
    const deltaTime = now - lastStepTime;

    // Update ray states
    if (deltaTime >= 1 / parseFloat(stepSpeedSlider.value)) {
      // Move to next ray
      currentRayIndex = (currentRayIndex + 1) % rayCount;
      // Activate new ray
      rays[currentRayIndex].active = true;
      rays[currentRayIndex].opacity = 1;

      // If we've completed a full circle, clear the hit obstacles
      if (currentRayIndex === 0) {
        hitObstacles.clear();
      }

      lastStepTime = now;
    }

    // Update opacities
    rays.forEach((ray) => {
      if (ray.active) {
        ray.opacity = Math.max(
          0,
          ray.opacity - parseFloat(fadeSpeedSlider.value) * deltaTime
        );
        if (ray.opacity === 0) {
          ray.active = false;
        }
      }
    });

    // Draw rays
    for (let i = 0; i < rayCount; ++i) {
      const ray = rays[i];
      if (!ray.active) continue;

      // Ray angle (clockwise)
      const angle = (2 * Math.PI * i) / rayCount;
      // Ray direction
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);

      // Get current values
      const scale = parseFloat(scaleSlider.value);
      const circleRadius = parseFloat(circleSizeSlider.value) * scale;

      // Ray start at edge of main circle
      const startX = c.x + dx * circleRadius;
      const startY = c.y + dy * circleRadius;

      // Calculate ray length to screen border or obstacle, starting from edge
      const { distance: maxLength, hitObstacle } = calculateRayLengthToBorder(
        startX,
        startY,
        dx,
        dy
      );
      const currentRayLength = maxLength * parseFloat(rayLengthSlider.value) * scale;

      // If this is the active ray and it hit an obstacle, push the obstacle
      if (i === currentRayIndex && hitObstacle) {
        hitObstacles.add(hitObstacle);
        hitObstacle.vx += dx * pushForce;
        hitObstacle.vy += dy * pushForce;
        
        // Only play sound if it's a permanent obstacle (not a trail point or shadow circle)
        if (!hitObstacle.isShadow && !hitObstacle.isTrail) {
          // Get the last hit time for this obstacle
          const lastHitTime = lastHitTimes.get(hitObstacle) || 0;
          
          // Only play sound if enough time has passed since this obstacle was last hit
          if ((now - lastHitTime) > 3) {
            lastHitTimes.set(hitObstacle, now);
            playHitSound(hitObstacle);
          }
        }
      }

      // Ray end - adjust length to account for obstacle scale
      let endX, endY;
      if (hitObstacle) {
        // If we hit an obstacle, calculate the exact intersection point
        const t = rayCircleIntersection(
          hitObstacle.x,
          hitObstacle.y,
          hitObstacle.radius * hitObstacle.scale,
          startX,
          startY,
          dx,
          dy
        );
        if (t !== null) {
          endX = startX + dx * t;
          endY = startY + dy * t;
        } else {
          endX = startX + dx * currentRayLength;
          endY = startY + dy * currentRayLength;
        }
      } else {
        endX = startX + dx * currentRayLength;
        endY = startY + dy * currentRayLength;
      }

      // Calculate thickness based on opacity and scale
      const thickness =
        minRayThickness + (maxRayThickness - minRayThickness) * ray.opacity;

      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = `rgba(255, 255, 255, ${ray.opacity * 0.8})`;
      ctx.strokeStyle = `rgba(255,255,240,${ray.opacity})`;
      ctx.lineWidth = thickness;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.restore();
    }

    // Update and draw obstacles
    updateObstacles(deltaTime);
    ctx.save();
    for (const obstacle of obstacles) {
      // Draw the circle fill
      ctx.beginPath();
      ctx.arc(
        obstacle.x,
        obstacle.y,
        obstacle.radius * obstacle.scale,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "#000000";
      ctx.fill();

      // Draw the circle outline
      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
      ctx.beginPath();
      ctx.arc(
        obstacle.x,
        obstacle.y,
        obstacle.radius * obstacle.scale,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = "rgba(255,255,240,0.8)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function loop() {
    draw();
    requestAnimationFrame(loop);
  }
  loop();
});
