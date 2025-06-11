class RaycastingSystem {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.rayCount = 120;
    this.minRayThickness = 0.5;
    this.currentRayIndex = 0;
    this.lastStepTime = performance.now() / 1000;
    this.rays = Array(this.rayCount).fill().map(() => ({
      opacity: 0,
      active: false,
    }));
  }

  getCenter() {
    return {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
    };
  }

  rayCircleIntersection(cx, cy, r, x0, y0, dx, dy) {
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

  calculateRayLengthToBorder(rayOriginX, rayOriginY, dx, dy, obstacles, trail, shadowCircle) {
    let t = Infinity;
    let hitObstacle = null;

    // Check horizontal borders
    if (dy !== 0) {
      const t1 = -rayOriginY / dy;
      const t2 = (this.canvas.height - rayOriginY) / dy;
      if (t1 > 0) t = Math.min(t, t1);
      if (t2 > 0) t = Math.min(t, t2);
    }

    // Check vertical borders
    if (dx !== 0) {
      const t3 = -rayOriginX / dx;
      const t4 = (this.canvas.width - rayOriginX) / dx;
      if (t3 > 0) t = Math.min(t, t3);
      if (t4 > 0) t = Math.min(t, t4);
    }

    // Check intersections with ALL obstacles (including slingshot circles)
    for (const obstacle of obstacles) {
      // Only skip circles with noRays flag (not slingshot circles)
      if (obstacle.noRays) continue;
      
      const tObstacle = this.rayCircleIntersection(
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
      const tTrail = this.rayCircleIntersection(
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

    return { distance: t, hitObstacle };
  }

  updateRays(stepSpeed, fadeSpeed, hitObstacles, obstacles, trail, shadowCircle, pushForce, lastHitTimes, audioManager, now) {
    const deltaTime = now - this.lastStepTime;

    // Update ray states
    if (deltaTime >= 1 / stepSpeed) {
      this.currentRayIndex = (this.currentRayIndex + 1) % this.rayCount;
      this.rays[this.currentRayIndex].active = true;
      this.rays[this.currentRayIndex].opacity = 1;

      if (this.currentRayIndex === 0) {
        hitObstacles.clear();
      }

      this.lastStepTime = now;
    }

    // Update opacities
    this.rays.forEach((ray) => {
      if (ray.active) {
        ray.opacity = Math.max(0, ray.opacity - fadeSpeed * deltaTime);
        if (ray.opacity === 0) {
          ray.active = false;
        }
      }
    });

    // Handle ray hits
    this.handleRayHits(hitObstacles, obstacles, trail, shadowCircle, pushForce, lastHitTimes, audioManager, now);
  }

  handleRayHits(hitObstacles, obstacles, trail, shadowCircle, pushForce, lastHitTimes, audioManager, now) {
    const center = this.getCenter();
    const INCREASED_PUSH_FORCE = pushForce * 3; // Tripled push force
    
    for (let i = 0; i < this.rayCount; ++i) {
      const ray = this.rays[i];
      if (!ray.active) continue;

      const angle = (2 * Math.PI * i) / this.rayCount;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);

      const circleRadius = this.getCircleRadius();
      const startX = center.x + dx * circleRadius;
      const startY = center.y + dy * circleRadius;

      const { hitObstacle } = this.calculateRayLengthToBorder(
        startX,
        startY,
        dx,
        dy,
        obstacles,
        trail,
        shadowCircle
      );

      if (i === this.currentRayIndex && hitObstacle) {
        hitObstacles.add(hitObstacle);
        
        if (hitObstacle.isOrbiting) {
          // For orbiting circles, increase orbit distance more significantly
          const centerToObstacle = Math.sqrt(
            (hitObstacle.x - center.x) ** 2 + (hitObstacle.y - center.y) ** 2
          );
          hitObstacle.orbitDistance = Math.max(hitObstacle.orbitDistance, centerToObstacle + 50);
        } else {
          // Increased push for all circles (including slingshot circles)
          hitObstacle.vx += dx * INCREASED_PUSH_FORCE;
          hitObstacle.vy += dy * INCREASED_PUSH_FORCE;
        }
        
        if (!hitObstacle.isShadow && !hitObstacle.isTrail) {
          const lastHitTime = lastHitTimes.get(hitObstacle) || 0;
          
          if ((now - lastHitTime) > 3) {
            lastHitTimes.set(hitObstacle, now);
            audioManager.playHitSound(hitObstacle, center, this.canvas);
          }
        }
      }
    }
  }

  getCircleRadius() {
    // This should be provided by the UI controller
    return 50; // Default value
  }

  drawRays(scale, circleSize, maxRayThickness, rayLength, obstacles, trail, shadowCircle) {
    const center = this.getCenter();
    const circleRadius = circleSize * scale;

    // Draw rays ONLY from center circle
    for (let i = 0; i < this.rayCount; ++i) {
      const ray = this.rays[i];
      if (!ray.active) continue;

      const angle = (2 * Math.PI * i) / this.rayCount;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);

      const startX = center.x + dx * circleRadius;
      const startY = center.y + dy * circleRadius;

      const { distance: maxLength, hitObstacle } = this.calculateRayLengthToBorder(
        startX,
        startY,
        dx,
        dy,
        obstacles,
        trail,
        null // Never pass shadow circle
      );
      const currentRayLength = maxLength * rayLength * scale;

      let endX, endY;
      if (hitObstacle) {
        const t = this.rayCircleIntersection(
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

      const thickness = this.minRayThickness + (maxRayThickness - this.minRayThickness) * ray.opacity;

      this.ctx.save();
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = `rgba(255, 255, 255, ${ray.opacity * 0.8})`;
      this.ctx.strokeStyle = `rgba(255,255,240,${ray.opacity})`;
      this.ctx.lineWidth = thickness;
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  drawShadowRays(shadowCircle, rayLength, scale, rayThickness, obstacles, trail) {
    // COMPLETELY DISABLE shadow rays - no rays from any circles except center
    return;
  }
} 