class InputHandler {
  constructor(canvas, obstacleManager, audioManager) {
    this.canvas = canvas;
    this.obstacleManager = obstacleManager;
    this.audioManager = audioManager;
    
    // Touch tracking
    this.initialPinchDistance = 0;
    this.initialCircleSize = 0;
    this.initialStepSpeed = 0;
    this.isPinching = false;
    this.initialThreeFingerY = 0;
    this.isThreeFingerGesture = false;
    
    // Shadow circle and gesture tracking
    this.shadowCircle = null;
    this.touchStartTime = 0;
    this.isLongPress = false;
    this.lastTouchX = 0;
    this.lastTouchY = 0;
    this.lastTouchTime = 0;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.dragStartedInCenter = false;
    this.orbitDirection = 1;
    
    // Trail system
    this.trail = [];
    this.TRAIL_POINTS = 20;
    this.TRAIL_FADE_DURATION = 1.0;
    this.TRAIL_RADIUS = 30;
    
    // Constants
    this.LONG_PRESS_DURATION = 100; // Reduced from 150ms to 100ms
    this.MOVEMENT_THRESHOLD = 50;
    this.CENTER_MARGIN = 10;
    this.DRAG_SMOOTHING = 0.2;
    this.VELOCITY_MULTIPLIER = 0.1;
    this.ORBIT_SPEED = 3.0;
    this.MIN_HORIZONTAL_MOVEMENT = 10;
    this.CIRCLE_ZOOM_SPEED = 2.0;
    
    // UI Controller reference (to be set later)
    this.uiController = null;
    
    // Add slingshot properties
    this.maxSlingshotDistance = 200;
    this.slingshotTension = 0;
    this.slingshotElasticity = 2.5;
    this.pullStartX = 0;
    this.pullStartY = 0;
    this.SLINGSHOT_SPEED = 2000; // Increased to 2000 (4x from 500)
    
    this.MIN_ORBIT_SPEED = 6;
    this.MAX_ORBIT_SPEED = 30;
    this.lastMoveTime = 0;
    this.lastMoveSpeed = 0;
    
    this.setupEventListeners();
  }
  
  setUIController(uiController) {
    this.uiController = uiController;
  }

  getCenter() {
    return {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
    };
  }

  getTouchDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  setupEventListeners() {
    // Touch events
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    this.canvas.addEventListener('touchcancel', this.handleTouchCancel.bind(this));
    
    // Mouse events
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    
    // Audio initialization events
    this.canvas.addEventListener('click', this.handleFirstInteraction.bind(this));
    this.canvas.addEventListener('touchstart', this.handleFirstInteraction.bind(this));
    document.addEventListener('keydown', this.handleFirstInteraction.bind(this));
  }

  async handleFirstInteraction() {
    if (!this.audioManager.isAudioInitialized) {
      await this.audioManager.initializeAudio();
    }
  }

  handleTouchStart(e) {
    e.preventDefault();
    
    if (e.touches.length === 3) {
      // Initialize 3-finger gesture
      this.isThreeFingerGesture = true;
      this.initialThreeFingerY = e.touches[0].clientY;
      return;
    }
    
    if (e.touches.length === 2) {
      // Clear any existing single-touch state
      this.shadowCircle = null;
      this.isLongPress = false;
      this.dragStartedInCenter = false;
      
      // Set up pinch gesture
      this.isPinching = true;
      this.initialPinchDistance = this.getTouchDistance(e.touches[0], e.touches[1]);
      if (this.uiController) {
        this.initialCircleSize = this.uiController.getCircleSize();
        this.initialStepSpeed = this.uiController.getStepSpeed();
      }
      return;
    }
    
    // Reset multi-touch states
    this.isThreeFingerGesture = false;
    this.isPinching = false;
    
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      this.touchStartTime = Date.now();
      this.touchStartX = x;
      this.touchStartY = y;
      this.lastTouchX = x;
      this.lastTouchY = y;
      this.lastTouchTime = performance.now();
      
      const c = this.getCenter();
      const centerRadius = this.uiController ? this.uiController.getCircleSize() * this.uiController.getScale() : 50;
      const distToCenter = Math.sqrt((x - c.x) ** 2 + (y - c.y) ** 2);
      this.dragStartedInCenter = distToCenter <= centerRadius + this.CENTER_MARGIN;

      if (this.dragStartedInCenter) {
        this.pullStartX = x;
        this.pullStartY = y;
        
        // For center drags, initially place the shadow circle at the opposite side
        const dx = x - c.x;
        const dy = y - c.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // Create shadow circle on the opposite side
        this.shadowCircle = {
          x: c.x - Math.cos(angle) * distance,
          y: c.y - Math.sin(angle) * distance,
          radius: this.obstacleManager.obstacleRadius,
          alpha: 0.3,
          scale: 0,
          isPreview: true,
          dragStartX: x,
          dragStartY: y,
          dragStartTime: performance.now() / 1000,
          vx: 0,
          vy: 0,
          isFromCenter: this.dragStartedInCenter,
          noRays: true // Prevent rays on shadow circle
        };
      } else {
        // Normal shadow circle creation for non-center drags
        this.shadowCircle = {
          x,
          y,
          radius: this.obstacleManager.obstacleRadius,
          alpha: 0.3,
          scale: 1,
          isPreview: true,
          dragStartX: x,
          dragStartY: y,
          dragStartTime: performance.now() / 1000,
          vx: 0,
          vy: 0,
          isFromCenter: this.dragStartedInCenter,
          noRays: true
        };
      }
      
      console.log('Touch start:', {
        x,
        y,
        time: this.touchStartTime,
        inCenter: this.dragStartedInCenter
      });
    }
  }

  handleTouchMove(e) {
    e.preventDefault();
    
    // Handle 3-finger gesture
    if (this.isThreeFingerGesture && e.touches.length === 3) {
      const avgY = (e.touches[0].clientY + e.touches[1].clientY + e.touches[2].clientY) / 3;
      const deltaY = avgY - this.initialThreeFingerY;
      
      // Scale all circles' distances from center based on vertical movement
      const scaleFactor = 1 + (deltaY * 0.003); // Adjust sensitivity here
      const center = this.getCenter();
      
      this.obstacleManager.getObstacles().forEach(obstacle => {
        if (obstacle.isOrbiting) {
          // Scale orbit radius
          obstacle.orbitRadius *= scaleFactor;
          
          // Update position based on new radius
          const dx = obstacle.x - center.x;
          const dy = obstacle.y - center.y;
          const currentAngle = Math.atan2(dy, dx);
          
          obstacle.x = center.x + obstacle.orbitRadius * Math.cos(currentAngle);
          obstacle.y = center.y + obstacle.orbitRadius * Math.sin(currentAngle);
        } else {
          // Scale position relative to center
          const dx = obstacle.x - center.x;
          const dy = obstacle.y - center.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          
          const newDistance = distance * scaleFactor;
          obstacle.x = center.x + Math.cos(angle) * newDistance;
          obstacle.y = center.y + Math.sin(angle) * newDistance;
        }
      });
      
      this.initialThreeFingerY = avgY;
      return;
    }
    
    // Handle pinch gesture
    if (this.isPinching && e.touches.length === 2) {
      const currentDistance = this.getTouchDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / this.initialPinchDistance;
      
      if (this.uiController) {
        this.uiController.updatePinchGesture(scale, this.initialCircleSize, this.initialStepSpeed);
      }
      return;
    }
    
    if (e.touches.length === 1 && this.shadowCircle) {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      if (this.dragStartedInCenter) {
        const center = this.getCenter();
        
        // Calculate vector from center to finger
        const dx = x - center.x;
        const dy = y - center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          // Calculate tension
          this.slingshotTension = Math.min(distance / this.maxSlingshotDistance, 1);
          
          // Position circle on the OPPOSITE side of center from finger
          const effectiveDistance = Math.min(distance, this.maxSlingshotDistance);
          
          // Unit vector pointing from center to finger
          const unitX = dx / distance;
          const unitY = dy / distance;
          
          // Place circle on opposite side (behind the center from finger's perspective)
          this.shadowCircle.x = center.x - unitX * effectiveDistance;
          this.shadowCircle.y = center.y - unitY * effectiveDistance;
          
          // Store where to launch (toward finger position)
          this.shadowCircle.launchTargetX = x;
          this.shadowCircle.launchTargetY = y;
          
          // Visual feedback
          this.shadowCircle.scale = 0.8 + this.slingshotTension * 0.4;
          this.shadowCircle.alpha = 0.3 + this.slingshotTension * 0.4;
        }
      } else {
        // Update shadow circle position for non-center drags
        this.shadowCircle.x = x;
        this.shadowCircle.y = y;
        
        // Calculate movement relative to center for orbit direction
        const center = this.getCenter();
        const prevAngle = Math.atan2(this.lastTouchY - center.y, this.lastTouchX - center.x);
        const currentAngle = Math.atan2(y - center.y, x - center.x);
        
        let angleDiff = currentAngle - prevAngle;
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        this.orbitDirection = angleDiff > 0 ? 1 : -1;

        // Calculate movement speed
        const now = performance.now();
        const dt = (now - this.lastMoveTime) / 1000;
        if (dt > 0) {
          const dx = x - this.lastTouchX;
          const dy = y - this.lastTouchY;
          const moveSpeed = Math.sqrt(dx * dx + dy * dy) / dt;
          this.lastMoveSpeed = moveSpeed;
        }
        this.lastMoveTime = now;
      }
      
      this.lastTouchX = x;
      this.lastTouchY = y;
      this.lastTouchTime = performance.now();
    }
  }

  handleTouchEnd(e) {
    e.preventDefault();

    // End pinch gesture
    if (e.touches.length < 2) {
      this.isPinching = false;
    }

    // End time freeze
    if (e.touches.length < 3) {
      this.obstacleManager.setTimeFreeze(false);
    }
    
    if (e.changedTouches.length === 1 && this.shadowCircle) {
      const touch = e.changedTouches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const touchDuration = Date.now() - this.touchStartTime;
      
      console.log('Touch end:', {
        x,
        y,
        duration: touchDuration,
        isLongEnough: touchDuration >= this.LONG_PRESS_DURATION,
        moveDistance: Math.sqrt(
          (x - this.touchStartX) ** 2 + 
          (y - this.touchStartY) ** 2
        ),
        inCenter: this.dragStartedInCenter
      });
      
      const moveDistance = Math.sqrt(
        (x - this.touchStartX) ** 2 + 
        (y - this.touchStartY) ** 2
      );
      
      if (this.dragStartedInCenter && this.slingshotTension > 0.1) {
        // Launch from circle position toward finger position
        const launchDx = this.shadowCircle.launchTargetX - this.shadowCircle.x;
        const launchDy = this.shadowCircle.launchTargetY - this.shadowCircle.y;
        const launchDist = Math.sqrt(launchDx * launchDx + launchDy * launchDy);
        
        if (launchDist > 0) {
          const circle = this.obstacleManager.createObstacle(
            this.shadowCircle.x,
            this.shadowCircle.y,
            (launchDx / launchDist) * (this.SLINGSHOT_SPEED * this.slingshotTension),
            (launchDy / launchDist) * (this.SLINGSHOT_SPEED * this.slingshotTension),
            { isSlingshotCircle: true } // Pass flag to make it smaller
          );
          
          if (circle) {
            circle.isSlingshotCircle = true;
            circle.isFromSlingshot = true; // Mark for special collision sound
          }
        }
        
        // Play slingshot release sound
        this.audioManager.playSlingshotSound(this.slingshotTension);
      } else if (!this.dragStartedInCenter) {
        if (touchDuration >= this.LONG_PRESS_DURATION) {
          const center = this.getCenter();
          const dx = this.shadowCircle.x - center.x;
          const dy = this.shadowCircle.y - center.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Calculate orbit speed based on movement speed - increased multiplier for faster orbits
          const baseSpeed = Math.max(this.MIN_ORBIT_SPEED, 
            Math.min(this.MAX_ORBIT_SPEED, this.lastMoveSpeed * 0.2)); // Increased from 0.1 to 0.2
          
          // Create orbiting circle with speed based on movement
          const angle = Math.atan2(dy, dx);
          const direction = this.orbitDirection || 1;
          
          // Calculate velocities for circular orbit
          const vx = -Math.sin(angle) * baseSpeed * direction;
          const vy = Math.cos(angle) * baseSpeed * direction;
          
          const circle = this.obstacleManager.createObstacle(
            this.shadowCircle.x,
            this.shadowCircle.y,
            vx,
            vy
          );
          
          if (circle) {
            circle.isOrbiting = true;
            circle.orbitDistance = distance;
            circle.orbitDirection = direction;
            circle.orbitSpeed = baseSpeed;
            circle.noRays = true;
          }
        } else if (touchDuration < 300 && moveDistance < 10) {
          // Handle quick tap
        this.handleClickOrTap(x, y);
      }
      }
    }
    
    // Reset state
    if (e.touches.length === 0) {
      this.touchStartTime = 0;
      this.isLongPress = false;
      this.dragStartedInCenter = false;
      this.shadowCircle = null;
      this.slingshotTension = 0;
      this.orbitDirection = null;
      this.lastMoveSpeed = 0;
    }
  }

  handleTouchCancel(e) {
    e.preventDefault();
    
    if (this.obstacleManager.isTimeFreeze) {
      this.obstacleManager.setTimeFreeze(false);
    }
    
    if (this.shadowCircle) {
      this.audioManager.stopDragSound();
      this.shadowCircle = null;
      this.isLongPress = false;
    }
  }

  handleClick(e) {
    if (!this.shadowCircle) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.handleClickOrTap(x, y);
    }
  }

  createObstacleFromShadow() {
    if (!this.shadowCircle || !this.uiController) return;

    const c = this.getCenter();
    const dx = this.shadowCircle.x - c.x;
    const dy = this.shadowCircle.y - c.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length > 0) {
      const normalizedDx = dx / length;
      const normalizedDy = dy / length;
      const outwardForce = this.uiController.getOutwardForce();

      const finalVx = (this.shadowCircle.vx || 0) * this.VELOCITY_MULTIPLIER;
      const finalVy = (this.shadowCircle.vy || 0) * this.VELOCITY_MULTIPLIER;

      let spawnX, spawnY;
      const isOutwardFlick = !this.dragStartedInCenter;
      
      if (isOutwardFlick) {
        spawnX = c.x;
        spawnY = c.y;
      } else {
        spawnX = this.shadowCircle.x;
        spawnY = this.shadowCircle.y;
      }

      // Play marimba sound
      const maxDistance = Math.sqrt(this.canvas.width * this.canvas.width + this.canvas.height * this.canvas.height) / 2;
      this.audioManager.playMarimbaSound(length, maxDistance);

      this.obstacleManager.createObstacle(spawnX, spawnY, 
        finalVx + normalizedDx * outwardForce,
        finalVy + normalizedDy * outwardForce,
        {
          targetX: this.shadowCircle.x,
          targetY: this.shadowCircle.y,
          isLaunching: isOutwardFlick,
          launchProgress: 0
        }
      );
    }
  }

  handleClickOrTap(x, y) {
    if (!this.uiController) return;

    // Check if we clicked on an existing obstacle
    const clickedObstacle = this.obstacleManager.findObstacleAtPosition(x, y);

    if (clickedObstacle) {
      const boostForce = this.uiController.getOutwardForce() * 3;
      if (this.obstacleManager.boostObstacle(clickedObstacle, boostForce)) {
        this.audioManager.playHitSound(clickedObstacle, this.getCenter(), this.canvas);
      }
    } else {
      // Create new obstacle from center
      const c = this.getCenter();
      const dx = x - c.x;
      const dy = y - c.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      const centerRadius = this.uiController.getCircleSize() * this.uiController.getScale();
      const isOutsideCenter = length > centerRadius + this.CENTER_MARGIN;

      if (isOutsideCenter) {
        const normalizedDx = dx / length;
        const normalizedDy = dy / length;
        const outwardForce = this.uiController.getOutwardForce();

        const launchSpeed = Math.min(length * 2, 800);
        const initialVx = normalizedDx * launchSpeed;
        const initialVy = normalizedDy * launchSpeed;

        // Play marimba sound
        const maxDistance = Math.sqrt(this.canvas.width * this.canvas.width + this.canvas.height * this.canvas.height) / 2;
        this.audioManager.playMarimbaSound(length, maxDistance);

        this.obstacleManager.createObstacle(c.x, c.y, initialVx, initialVy, {
          isBoostAnimating: false,
          boostCount: 0,
          isLaunching: false,
          damping: 0.98
        });
      }
    }
  }

  updateTrail() {
    const currentTime = performance.now() / 1000;
    this.trail = this.trail.filter(point => {
      const age = currentTime - point.spawnTime;
      return age < this.TRAIL_FADE_DURATION;
    });
  }

  drawTrail(ctx) {
    const currentTime = performance.now() / 1000;
    
    this.trail.forEach(point => {
      const age = currentTime - point.spawnTime;
      const alpha = 1 - (age / this.TRAIL_FADE_DURATION);
      
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.3})`;
      ctx.fill();
    });
  }

  drawShadowCircle(ctx) {
    if (!this.shadowCircle) return;

    const currentTime = performance.now() / 1000;
    
    // Update shadow circle scale
    if (this.shadowCircle.isDragging) {
      const dragTime = currentTime - this.shadowCircle.dragStartTime;
      const GROW_DURATION = 1.0;
      if (dragTime < GROW_DURATION) {
        const t = dragTime / GROW_DURATION;
        const startScale = this.shadowCircle.scale;
        this.shadowCircle.scale = startScale + ((1 - startScale) * (1 - Math.pow(1 - t, 2)));
      } else {
        this.shadowCircle.scale = 1;
      }
    } else {
      const centerGrowTime = currentTime - this.shadowCircle.centerGrowStartTime;
      const CENTER_GROW_DURATION = 0.5;
      if (centerGrowTime < CENTER_GROW_DURATION) {
        const t = centerGrowTime / CENTER_GROW_DURATION;
        this.shadowCircle.scale = this.obstacleManager.CENTER_MAX_SCALE * (1 - Math.pow(1 - t, 3));
      } else {
        this.shadowCircle.scale = this.obstacleManager.CENTER_MAX_SCALE;
      }
    }

    // Draw shadow circle fill
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
    ctx.beginPath();
    ctx.arc(this.shadowCircle.x, this.shadowCircle.y, this.shadowCircle.radius * this.shadowCircle.scale, 0, Math.PI * 2);
    if (!this.shadowCircle.isDragging) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.shadowCircle.alpha * 0.8})`;
    } else {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.shadowCircle.alpha})`;
    }
    ctx.fill();
    ctx.restore();

    // Draw shadow circle outline
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath();
    ctx.arc(this.shadowCircle.x, this.shadowCircle.y, this.shadowCircle.radius * this.shadowCircle.scale, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = this.shadowCircle.isDragging ? 1 : 2;
    ctx.stroke();
    ctx.restore();

    // Draw connection line during long press
    if (this.isLongPress && this.dragStartedInCenter) {
      const c = this.getCenter();
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(this.shadowCircle.x, this.shadowCircle.y);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  }

  getShadowCircle() {
    return this.shadowCircle;
  }

  getTrail() {
    return this.trail;
  }

  createOrbitCircle(x, y) {
    const c = this.getCenter();
    const dx = x - c.x;
    const dy = y - c.y;
    const angle = Math.atan2(dy, dx);
    const radius = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate perpendicular velocity for orbit
    // Use orbitDirection to determine clockwise or counterclockwise
    const vx = -Math.sin(angle) * this.ORBIT_SPEED * this.orbitDirection;
    const vy = Math.cos(angle) * this.ORBIT_SPEED * this.orbitDirection;
    
    console.log('Creating orbit circle:', {
      x,
      y,
      angle,
      radius,
      vx,
      vy,
      direction: this.orbitDirection === 1 ? 'clockwise' : 'counterclockwise',
      speed: this.ORBIT_SPEED
    });
    
    // Create the orbiting circle
    this.obstacleManager.createObstacle(x, y, vx, vy, {
      isOrbiting: true,
      orbitAngle: angle,
      orbitSpeed: this.ORBIT_SPEED * this.orbitDirection,
      orbitRadius: radius,
      centerX: c.x,
      centerY: c.y
    });
    
    // Play sound
    const maxDistance = Math.sqrt(this.canvas.width * this.canvas.width + this.canvas.height * this.canvas.height) / 2;
    this.audioManager.playMarimbaSound(radius, maxDistance);
    
    // Reset orbit speed and direction for next time
    this.ORBIT_SPEED = 3.0;
    this.orbitDirection = 1;
  }

  draw(ctx) {
    if (this.shadowCircle) {
      // Draw slingshot line when dragging from center
      if (this.dragStartedInCenter && this.slingshotTension > 0) {
        const center = this.getCenter();
        
        // Draw line from center to shadow circle
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(this.shadowCircle.x, this.shadowCircle.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.slingshotTension * 0.8})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw line from center to finger position to show trajectory
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(this.shadowCircle.launchTargetX, this.shadowCircle.launchTargetY);
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.slingshotTension * 0.3})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
      
      // Draw shadow circle
      ctx.save();
      ctx.beginPath();
      ctx.globalAlpha = this.shadowCircle.alpha;
      ctx.arc(
        this.shadowCircle.x,
        this.shadowCircle.y,
        this.obstacleManager.obstacleRadius * this.shadowCircle.scale,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fill();
      ctx.restore();
    }
  }
} 