class ObstacleManager {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.obstacles = [];
    this.obstacleRadius = 30;
    this.slingshotRadius = 18; // Smaller radius for slingshot circles
    this.friction = 0.99;
    this.frozenVelocities = new Map();
    this.isTimeFreeze = false;
    this.lastUpdateTime = performance.now();
    this.radiusVariation = 0.3; // 30% size variation
    
    // Animation constants
    this.SPAWN_ANIMATION_DURATION = 0.5;
    this.DRAG_ANIMATION_DURATION = 0.3;
    this.CENTER_GROW_DURATION = 0.5;
    this.CENTER_MAX_SCALE = 1.0;
    this.GROW_DURATION = 1.0;
    this.BOOST_DURATION = 0.3;
    this.BOOST_SCALE = 1.5;
    this.VELOCITY_MULTIPLIER = 0.1;
    this.SPIRAL_SPEED = 50; // pixels per second outward spiral
  }

  getCenter() {
    return {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
    };
  }

  createObstacle(x, y, vx = 0, vy = 0, options = {}) {
    // Determine base radius based on circle type
    const baseRadius = options.isSlingshotCircle ? this.slingshotRadius : this.obstacleRadius;
    
    // Add random size variation (±30%)
    const randomMultiplier = 1 + (Math.random() - 0.5) * 2 * this.radiusVariation;
    const randomRadius = baseRadius * randomMultiplier;
    
    // Set appropriate minimum radius
    const minRadius = options.isSlingshotCircle ? 10 : 15;
    
    const obstacle = {
      x,
      y,
      vx,
      vy,
      radius: Math.max(minRadius, randomRadius),
      alpha: 1,
      scale: 1,
      spawnTime: performance.now() / 1000,
      isDragging: false,
      dragStartTime: performance.now() / 1000,
      dragStartX: x,
      dragStartY: y,
      damping: 0.98,
      boostCount: 0,
      isBoostAnimating: false,
      boostStartTime: 0,
      isSlingshotCircle: options.isSlingshotCircle || false,
      ...options
    };
    
    this.obstacles.push(obstacle);
    return obstacle;
  }

  createObstacleFromCenter(targetX, targetY, outwardForce) {
    const center = this.getCenter();
    const dx = targetX - center.x;
    const dy = targetY - center.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length > 0) {
      const normalizedDx = dx / length;
      const normalizedDy = dy / length;
      
      return this.createObstacle(center.x, center.y, 
        normalizedDx * outwardForce, 
        normalizedDy * outwardForce,
        {
          targetX,
          targetY,
          isLaunching: true,
          launchProgress: 0
        }
      );
    }
    return null;
  }

  boostObstacle(obstacle, boostForce) {
    const center = this.getCenter();
    const dx = obstacle.x - center.x;
    const dy = obstacle.y - center.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length > 0) {
      obstacle.boostCount = (obstacle.boostCount || 0) + 1;
      
      const normalizedDx = dx / length;
      const normalizedDy = dy / length;
      const exponentialMultiplier = Math.pow(1.5, obstacle.boostCount - 1);
      const finalBoostForce = boostForce * exponentialMultiplier;
      
      obstacle.vx += normalizedDx * finalBoostForce;
      obstacle.vy += normalizedDy * finalBoostForce;
      
      obstacle.isBoostAnimating = true;
      obstacle.boostStartTime = performance.now() / 1000;
      
      return true;
    }
    return false;
  }

  findObstacleAtPosition(x, y, bufferRadius = 20) {
    return this.obstacles.find(obstacle => {
      const dx = x - obstacle.x;
      const dy = y - obstacle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const hitRadius = obstacle.radius * obstacle.scale + bufferRadius;
      return distance <= hitRadius;
    });
  }

  setTimeFreeze(freeze) {
    if (freeze && !this.isTimeFreeze) {
      this.isTimeFreeze = true;
      this.frozenVelocities.clear();
      
      this.obstacles.forEach((obstacle, index) => {
        this.frozenVelocities.set(index, {
          vx: obstacle.vx,
          vy: obstacle.vy
        });
      });
    } else if (!freeze && this.isTimeFreeze) {
      this.obstacles.forEach((obstacle, index) => {
        const frozenVel = this.frozenVelocities.get(index);
        if (frozenVel) {
          obstacle.vx = frozenVel.vx;
          obstacle.vy = frozenVel.vy;
        }
      });
      this.isTimeFreeze = false;
      this.frozenVelocities.clear();
    }
  }

  handleCollisions(audioManager) {
    const currentTime = performance.now() / 1000;
    
    if (this.isTimeFreeze) return;

    for (let i = 0; i < this.obstacles.length; i++) {
      if (this.obstacles[i].isMerging) continue;
      
      for (let j = i + 1; j < this.obstacles.length; j++) {
        if (this.obstacles[j].isMerging) continue;
        
        const obstacleA = this.obstacles[i];
        const obstacleB = this.obstacles[j];
        
        const dx = obstacleB.x - obstacleA.x;
        const dy = obstacleB.y - obstacleA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (obstacleA.radius * obstacleA.scale) + (obstacleB.radius * obstacleB.scale);
        
        if (distance <= minDistance && distance > 0) {
          // Check if either circle is from slingshot
          const isSlingshotCollision = obstacleA.isFromSlingshot || obstacleB.isFromSlingshot;
          
          this.mergeObstacles(obstacleA, obstacleB, currentTime);
          audioManager.playMergeSound(isSlingshotCollision);
          break;
        }
      }
    }
  }

  mergeObstacles(obstacleA, obstacleB, currentTime) {
    // Mark both obstacles as merging
    obstacleA.isMerging = true;
    obstacleB.isMerging = true;

    // Calculate merged properties
    const totalMass = obstacleA.radius + obstacleB.radius;
    const mergedRadius = Math.sqrt(obstacleA.radius * obstacleA.radius + obstacleB.radius * obstacleB.radius);
    
    const weightA = obstacleA.radius / totalMass;
    const weightB = obstacleB.radius / totalMass;
    
    const mergedX = obstacleA.x * weightA + obstacleB.x * weightB;
    const mergedY = obstacleA.y * weightA + obstacleB.y * weightB;
    const mergedVx = obstacleA.vx * weightA + obstacleB.vx * weightB;
    const mergedVy = obstacleA.vy * weightA + obstacleB.vy * weightB;

    // Check if either was launching
    const isEitherLaunching = obstacleA.isLaunching || obstacleB.isLaunching;

    // Add slight random variation to merged radius too
    const randomMultiplier = 1 + (Math.random() - 0.5) * 0.1; // ±5% for merged circles
    const finalMergedRadius = Math.max(15, mergedRadius * randomMultiplier); // Minimum radius of 15

    // Create merged obstacle
    const mergedObstacle = {
      x: mergedX,
      y: mergedY,
      radius: finalMergedRadius,
      vx: mergedVx,
      vy: mergedVy,
      spawnTime: currentTime,
      scale: isEitherLaunching ? Math.max(obstacleA.scale || 1, obstacleB.scale || 1) : 0,
      mergeStartTime: currentTime,
      isMerging: false,
      isMergingNew: true,
      sourceCircles: [obstacleA, obstacleB],
      boostCount: (obstacleA.boostCount || 0) + (obstacleB.boostCount || 0),
      mergeAnimationProgress: 0,
      isLaunching: isEitherLaunching,
      launchStartTime: isEitherLaunching ? currentTime : null,
      launchProgress: isEitherLaunching ? Math.max(
        obstacleA.isLaunching ? obstacleA.launchProgress : 0,
        obstacleB.isLaunching ? obstacleB.launchProgress : 0
      ) : 0,
      targetX: isEitherLaunching ? mergedX : null,
      targetY: isEitherLaunching ? mergedY : null,
      // Inherit special properties
      isSlingshotCircle: obstacleA.isSlingshotCircle || obstacleB.isSlingshotCircle,
      isFromSlingshot: obstacleA.isFromSlingshot || obstacleB.isFromSlingshot,
      noRays: obstacleA.noRays || obstacleB.noRays,
      isOrbiting: false, // Merged circles don't orbit
      // Add merge glow effect
      mergeGlowStartTime: currentTime,
      mergeGlowDuration: 2.0, // 2 seconds
      hasMergeGlow: true
    };

    // Remove the original obstacles
    this.obstacles = this.obstacles.filter(obs => obs !== obstacleA && obs !== obstacleB);
    
    // Add the merged obstacle
    this.obstacles.push(mergedObstacle);
  }

  updateObstacles(deltaTime, outwardForce, audioManager) {
    const activeObstacles = [];
    const center = this.getCenter();
    const currentTime = performance.now() / 1000;

    this.handleCollisions(audioManager);

    for (const obstacle of this.obstacles) {
      // Handle merge animation for source circles
      if (obstacle.isMerging && !obstacle.isMergingNew) {
        const mergeAge = currentTime - obstacle.mergeStartTime;
        const MERGE_DURATION = 1.2;
        
        if (mergeAge < MERGE_DURATION) {
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
        const MERGE_DURATION = 1.2;
        
        if (mergeAge < MERGE_DURATION) {
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
      if (timeSinceSpawn < this.SPAWN_ANIMATION_DURATION && !obstacle.isMergingNew) {
        const t = timeSinceSpawn / this.SPAWN_ANIMATION_DURATION;
        obstacle.scale = 1 - Math.pow(1 - t, 3);
      } else if (!obstacle.isMergingNew) {
        obstacle.scale = 1;
      }

      // Handle orbiting behavior
      if (obstacle.isOrbiting) {
        // Get current angle and distance from center
        const dx = obstacle.x - center.x;
        const dy = obstacle.y - center.y;
        const currentAngle = Math.atan2(dy, dx);
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        
        // Use the circle's stored orbit speed instead of hardcoded value
        const nextAngle = currentAngle + (obstacle.orbitSpeed / currentDistance) * obstacle.orbitDirection;
        
        // Update position to maintain orbit distance
        obstacle.x = center.x + Math.cos(nextAngle) * obstacle.orbitDistance;
        obstacle.y = center.y + Math.sin(nextAngle) * obstacle.orbitDistance;
        
        // Update velocities for visual effects (like ray interactions)
        const tangentX = -Math.sin(nextAngle) * obstacle.orbitSpeed * obstacle.orbitDirection;
        const tangentY = Math.cos(nextAngle) * obstacle.orbitSpeed * obstacle.orbitDirection;
        obstacle.vx = tangentX;
        obstacle.vy = tangentY;
      } else {
        // Calculate direction from center to obstacle
        const dx = obstacle.x - center.x;
        const dy = obstacle.y - center.y;
        const length = Math.sqrt(dx * dx + dy * dy);

        // Add constant outward force
        if (length > 0) {
          const normalizedDx = dx / length;
          const normalizedDy = dy / length;
          obstacle.vx += normalizedDx * outwardForce * deltaTime;
          obstacle.vy += normalizedDy * outwardForce * deltaTime;
        }

        // Update position based on velocity
        if (this.isTimeFreeze) {
          const dx = center.x - obstacle.x;
          const dy = center.y - obstacle.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > 0) {
            const DRIFT_SPEED = 50;
            const normalizedDx = dx / dist;
            const normalizedDy = dy / dist;
            
            obstacle.x += normalizedDx * DRIFT_SPEED * deltaTime;
            obstacle.y += normalizedDy * DRIFT_SPEED * deltaTime;
            
            const pulseScale = 1 + Math.sin(currentTime * 2) * 0.03;
            obstacle.scale = obstacle.scale * pulseScale;
          }
        } else {
          obstacle.x += obstacle.vx * deltaTime;
          obstacle.y += obstacle.vy * deltaTime;

          if (obstacle.damping) {
            obstacle.vx *= Math.pow(obstacle.damping, deltaTime * 60);
            obstacle.vy *= Math.pow(obstacle.damping, deltaTime * 60);
          } else {
            obstacle.vx *= this.friction;
            obstacle.vy *= this.friction;
          }

          if (Math.abs(obstacle.vx) < 0.1) obstacle.vx = 0;
          if (Math.abs(obstacle.vy) < 0.1) obstacle.vy = 0;
        }
      }

      // Check if the obstacle is completely offscreen
      const isOffscreen =
        obstacle.x + obstacle.radius < 0 ||
        obstacle.x - obstacle.radius > this.canvas.width ||
        obstacle.y + obstacle.radius < 0 ||
        obstacle.y - obstacle.radius > this.canvas.height;

      if (!isOffscreen && (!obstacle.isMerging || obstacle.isMergingNew)) {
        activeObstacles.push(obstacle);
      } else if (isOffscreen) {
        this.frozenVelocities.delete(this.obstacles.indexOf(obstacle));
      }
    }

    this.obstacles = activeObstacles;
  }

  drawObstacles() {
    const currentTime = performance.now() / 1000;
    const center = this.getCenter();

    this.obstacles.forEach((obstacle) => {
      // Calculate boost animation if active
      let currentScale = obstacle.scale;
      if (obstacle.isBoostAnimating) {
        const boostAge = currentTime - obstacle.boostStartTime;
        if (boostAge < this.BOOST_DURATION) {
          const t = boostAge / this.BOOST_DURATION;
          const boostScale = 1 + (this.BOOST_SCALE - 1) * Math.sin(t * Math.PI);
          currentScale *= boostScale;
        } else {
          obstacle.isBoostAnimating = false;
        }
      }

      // Add merge animation effects
      if (obstacle.isMergingNew) {
        const mergeAge = currentTime - obstacle.mergeStartTime;
        const MERGE_DURATION = 1.2;
        
        if (mergeAge < MERGE_DURATION) {
          this.ctx.save();
          this.ctx.shadowBlur = 20;
          
          const progress = mergeAge / MERGE_DURATION;
          const easeOutCubic = 1 - Math.pow(1 - progress, 3);
          const fadeOpacity = 1 - easeOutCubic;
          
          this.ctx.shadowColor = `rgba(255, 255, 255, ${fadeOpacity * 0.6})`;
          
          const shockwaveProgress = easeOutCubic;
          const shockwaveRadius = obstacle.radius * (1 + shockwaveProgress * 1.5);
          this.ctx.beginPath();
          this.ctx.arc(obstacle.x, obstacle.y, shockwaveRadius, 0, Math.PI * 2);
          this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * fadeOpacity})`;
          this.ctx.lineWidth = 1.5;
          this.ctx.stroke();
          this.ctx.restore();
        }
      }

      // Draw rim lighting
      const dx = obstacle.x - center.x;
      const dy = obstacle.y - center.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const normalizedDx = length > 0 ? dx / length : 0;
      const normalizedDy = length > 0 ? dy / length : 0;

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(obstacle.x, obstacle.y, obstacle.radius * currentScale, 0, Math.PI * 2);
      
      const rimGradient = this.ctx.createRadialGradient(
        obstacle.x - normalizedDx * obstacle.radius * currentScale * 0.3,
        obstacle.y - normalizedDy * obstacle.radius * currentScale * 0.3,
        0,
        obstacle.x,
        obstacle.y,
        obstacle.radius * currentScale
      );
      
      if (obstacle.isMergingNew) {
        rimGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        rimGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
        rimGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      } else {
        rimGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        rimGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
        rimGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      
      this.ctx.fillStyle = rimGradient;
      this.ctx.fill();
      this.ctx.restore();

      // Draw the circle fill
      this.ctx.beginPath();
      this.ctx.arc(obstacle.x, obstacle.y, obstacle.radius * currentScale, 0, Math.PI * 2);
      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.fill();

      // Draw the circle outline
      this.ctx.save();
      this.ctx.shadowBlur = 12;
      this.ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
      this.ctx.beginPath();
      this.ctx.arc(obstacle.x, obstacle.y, obstacle.radius * currentScale, 0, Math.PI * 2);
      this.ctx.strokeStyle = "rgba(255,255,255,0.8)";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.restore();

      // Add boost glow effect
      if (obstacle.isBoostAnimating) {
        const boostAge = currentTime - obstacle.boostStartTime;
        if (boostAge < this.BOOST_DURATION) {
          const baseGlow = 15;
          const boostMultiplier = obstacle.boostCount ? Math.min(obstacle.boostCount * 1.5, 5) : 1;
          const glowIntensity = baseGlow * boostMultiplier;
          
          this.ctx.save();
          this.ctx.shadowBlur = glowIntensity;
          this.ctx.shadowColor = `rgba(255, 255, 255, ${1 - (boostAge / this.BOOST_DURATION)})`;
          this.ctx.beginPath();
          this.ctx.arc(obstacle.x, obstacle.y, obstacle.radius * obstacle.scale, 0, Math.PI * 2);
          this.ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
          this.ctx.lineWidth = 3;
          this.ctx.stroke();
          this.ctx.restore();
        }
      }
    });
  }

  getObstacles() {
    return this.obstacles;
  }

  clearObstacles() {
    this.obstacles = [];
  }

  isOutOfBounds(obstacle) {
    return obstacle.x < -100 || 
           obstacle.x > this.canvas.width + 100 || 
           obstacle.y < -100 || 
           obstacle.y > this.canvas.height + 100;
  }

  checkCollisions(centerX, centerY, centerRadius) {
    const collidedObstacles = [];
    
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      const dx = obstacle.x - centerX;
      const dy = obstacle.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Only remove non-slingshot circles that touch the center
      if (distance <= centerRadius + obstacle.radius && !obstacle.isSlingshotCircle) {
        collidedObstacles.push(obstacle);
        this.obstacles.splice(i, 1);
      }
    }
    
    return collidedObstacles;
  }

  update() {
    const center = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
    const currentTime = performance.now() / 1000;
    
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      
      // Ensure scale and radius are always positive
      if (!obstacle.scale || obstacle.scale <= 0) obstacle.scale = 1;
      if (!obstacle.radius || obstacle.radius <= 0) obstacle.radius = 15;
      obstacle.scale = Math.max(0.01, obstacle.scale);
      obstacle.radius = Math.max(0.1, obstacle.radius);
      
      // Update merge glow effect
      if (obstacle.hasMergeGlow) {
        const glowAge = currentTime - obstacle.mergeGlowStartTime;
        if (glowAge >= obstacle.mergeGlowDuration) {
          obstacle.hasMergeGlow = false;
        }
      }
      
      if (obstacle.isOrbiting) {
        // Get current angle and distance from center
        const dx = obstacle.x - center.x;
        const dy = obstacle.y - center.y;
        const currentAngle = Math.atan2(dy, dx);
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        
        // Use the circle's stored orbit speed instead of hardcoded value
        const nextAngle = currentAngle + (obstacle.orbitSpeed / currentDistance) * obstacle.orbitDirection;
        
        // Update position to maintain orbit distance
        obstacle.x = center.x + Math.cos(nextAngle) * obstacle.orbitDistance;
        obstacle.y = center.y + Math.sin(nextAngle) * obstacle.orbitDistance;
        
        // Update velocities for visual effects (like ray interactions)
        const tangentX = -Math.sin(nextAngle) * obstacle.orbitSpeed * obstacle.orbitDirection;
        const tangentY = Math.cos(nextAngle) * obstacle.orbitSpeed * obstacle.orbitDirection;
        obstacle.vx = tangentX;
        obstacle.vy = tangentY;
      } else {
        // Normal physics update for non-orbiting circles
        obstacle.x += obstacle.vx;
        obstacle.y += obstacle.vy;
        
        // Only apply friction to non-slingshot circles
        if (!obstacle.isSlingshotCircle) {
          obstacle.vx *= this.friction;
          obstacle.vy *= this.friction;
        }
      }
      
      // Remove if off screen with padding
      if (this.isOffScreen(obstacle)) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  isOffScreen(obstacle) {
    const padding = 100;
    return obstacle.x < -padding ||
           obstacle.x > this.canvas.width + padding ||
           obstacle.y < -padding ||
           obstacle.y > this.canvas.height + padding;
  }
} 