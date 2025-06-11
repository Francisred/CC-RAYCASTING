class Renderer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  getCenter() {
    return {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
    };
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawTimeFreezeFx() {
    // Add subtle overlay to indicate time freeze
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    
    // Add pulsing glow to the center
    const c = this.getCenter();
    this.ctx.save();
    const pulseIntensity = 0.2 + Math.sin(performance.now() / 1000 * 2) * 0.1;
    const gradient = this.ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 200);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${pulseIntensity})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  drawCentralCircle(circleRadius) {
    const c = this.getCenter();
    
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(c.x, c.y, circleRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = "#000000";
    this.ctx.fill();
    this.ctx.restore();
  }

  drawLaunchEffects(obstacles) {
    const currentTime = performance.now() / 1000;
    const center = this.getCenter();

    obstacles.forEach(obstacle => {
      if (obstacle.isLaunching) {
        const launchAge = currentTime - obstacle.launchStartTime;
        const LAUNCH_DURATION = 2.5;
        
        if (launchAge < LAUNCH_DURATION) {
          this.ctx.save();
          this.ctx.shadowBlur = 10;
          this.ctx.shadowColor = `rgba(255, 255, 255, ${0.3 * (1 - obstacle.launchProgress)})`;
          
          // Draw simplified energy trail from center
          const dx = obstacle.x - center.x;
          const dy = obstacle.y - center.y;
          
          // Single trail instead of multiple for better performance
          this.ctx.beginPath();
          this.ctx.moveTo(center.x, center.y);
          this.ctx.lineTo(obstacle.x, obstacle.y);
          this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * (1 - obstacle.launchProgress)})`;
          this.ctx.lineWidth = 2 * (1 - obstacle.launchProgress);
          this.ctx.stroke();
          
          // Draw expanding ring at launch point (less frequently)
          if (launchAge % 0.1 < 0.05) { // Only draw every 10th of a second
            const ringProgress = Math.min(launchAge / (LAUNCH_DURATION * 0.5), 1);
            const ringRadius = Math.max(0.1, obstacle.radius * (1 + ringProgress * 1.5));
            this.ctx.beginPath();
            this.ctx.arc(center.x, center.y, ringRadius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - ringProgress)})`;
            this.ctx.lineWidth = 0.5;
            this.ctx.stroke();
          }
          
          this.ctx.restore();
        }
      }
    });
  }

  drawObstacleGlow(obstacle, currentScale) {
    // Ensure positive radius to prevent canvas errors
    const radius = Math.max(0.1, obstacle.radius * currentScale);
    if (radius <= 0) return;
    
    const center = this.getCenter();
    const dx = obstacle.x - center.x;
    const dy = obstacle.y - center.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const normalizedDx = length > 0 ? dx / length : 0;
    const normalizedDy = length > 0 ? dy / length : 0;

    // Draw rim lighting
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(obstacle.x, obstacle.y, radius, 0, Math.PI * 2);
    
    const rimGradient = this.ctx.createRadialGradient(
      obstacle.x - normalizedDx * radius * 0.3,
      obstacle.y - normalizedDy * radius * 0.3,
      0,
      obstacle.x,
      obstacle.y,
      radius
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
  }

  drawObstacleCore(obstacle, currentScale) {
    // Draw the circle fill
    this.ctx.beginPath();
    this.ctx.arc(obstacle.x, obstacle.y, obstacle.radius * currentScale, 0, Math.PI * 2);
    
    if (obstacle.isSlingshotCircle) {
      this.ctx.fillStyle = "#000000";
    } else {
      this.ctx.fillStyle = "#FFFFFF";
    }
    this.ctx.fill();

    // Draw the circle outline
    this.ctx.save();
    this.ctx.shadowBlur = 12;
    this.ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
    this.ctx.beginPath();
    this.ctx.arc(obstacle.x, obstacle.y, obstacle.radius * currentScale, 0, Math.PI * 2);
    this.ctx.strokeStyle = "rgba(255,255,255,0.8)";
    this.ctx.lineWidth = obstacle.isSlingshotCircle ? 1 : 2;
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawMergeEffects(obstacle) {
    const currentTime = performance.now() / 1000;
    
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
        
        // Draw shockwave
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
  }

  drawBoostEffects(obstacle, currentScale) {
    const currentTime = performance.now() / 1000;
    const BOOST_DURATION = 0.3;
    
    if (obstacle.isBoostAnimating) {
      const boostAge = currentTime - obstacle.boostStartTime;
      if (boostAge < BOOST_DURATION) {
        // Ensure positive radius
        const radius = Math.max(0.1, obstacle.radius * obstacle.scale);
        if (radius <= 0) return;
        
        const baseGlow = 15;
        const boostMultiplier = obstacle.boostCount ? Math.min(obstacle.boostCount * 1.5, 5) : 1;
        const glowIntensity = baseGlow * boostMultiplier;
        
        this.ctx.save();
        this.ctx.shadowBlur = glowIntensity;
        this.ctx.shadowColor = `rgba(255, 255, 255, ${1 - (boostAge / BOOST_DURATION)})`;
        this.ctx.beginPath();
        this.ctx.arc(obstacle.x, obstacle.y, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        this.ctx.restore();
      }
    }
  }

  drawObstacle(obstacle) {
    // Early exit for invalid obstacles
    if (!obstacle || obstacle.radius <= 0 || obstacle.scale <= 0) return;
    
    const currentTime = performance.now() / 1000;
    let currentScale = Math.max(0.01, obstacle.scale); // Ensure positive scale

    // Handle scaling animations
    if (obstacle.spawnTime !== undefined) {
      const spawnAge = currentTime - obstacle.spawnTime;
      const SPAWN_DURATION = 0.3;
      if (spawnAge < SPAWN_DURATION) {
        const spawnProgress = spawnAge / SPAWN_DURATION;
        currentScale = Math.max(0.01, obstacle.scale * (1 - Math.pow(1 - spawnProgress, 3)));
      }
    }

    // Calculate final radius and skip if too small
    const finalRadius = obstacle.radius * currentScale;
    if (finalRadius < 0.1) return;

    // Draw merge glow effect (most expensive, draw first)
    this.drawMergeGlow(obstacle, currentScale, currentTime);

    // Draw glow effect
    this.drawObstacleGlow(obstacle, currentScale);

    // Draw the circle fill based on type
    this.ctx.beginPath();
    this.ctx.arc(obstacle.x, obstacle.y, finalRadius, 0, Math.PI * 2);
    
    if (obstacle.isSlingshotCircle) {
      // Slingshot circles: black fill
      this.ctx.fillStyle = "#000000";
    } else {
      // Normal circles: white fill
      this.ctx.fillStyle = "#FFFFFF";
    }
    this.ctx.fill();

    // Draw the circle outline
    this.ctx.save();
    this.ctx.shadowBlur = 12;
    this.ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
    this.ctx.beginPath();
    this.ctx.arc(obstacle.x, obstacle.y, finalRadius, 0, Math.PI * 2);
    this.ctx.strokeStyle = "rgba(255,255,255,0.8)";
    
    if (obstacle.isSlingshotCircle) {
      // Thin outline for slingshot circles
      this.ctx.lineWidth = 1;
    } else {
      // Normal outline for regular circles
      this.ctx.lineWidth = 2;
    }
    
    this.ctx.stroke();
    this.ctx.restore();

    // Add boost glow effect
    this.drawBoostEffects(obstacle, currentScale);
  }

  drawMergeGlow(obstacle, currentScale, currentTime) {
    if (!obstacle.hasMergeGlow) return;

    const glowAge = currentTime - obstacle.mergeGlowStartTime;
    const glowProgress = glowAge / obstacle.mergeGlowDuration;
    
    if (glowProgress >= 1) return; // Glow has finished

    // Create intense glow that fades out
    const intensity = 1 - glowProgress; // Start at 1, fade to 0
    const baseRadius = Math.max(0.1, obstacle.radius * currentScale); // Ensure positive
    const glowRadius = baseRadius * (1.5 + intensity * 2); // Grows then shrinks
    
    // Reduce glow layers for performance (from 5 to 3)
    for (let i = 0; i < 3; i++) {
      const layerRadius = Math.max(0.1, glowRadius * (0.4 + i * 0.3)); // Ensure positive
      const layerAlpha = intensity * 0.2 * (3 - i) / 3; // Outer layers more transparent
      
      if (layerRadius <= 0 || layerAlpha <= 0) continue; // Skip invalid values
      
      this.ctx.save();
      this.ctx.globalCompositeOperation = 'screen'; // Additive blending
      this.ctx.beginPath();
      this.ctx.arc(obstacle.x, obstacle.y, layerRadius, 0, Math.PI * 2);
      
      const gradient = this.ctx.createRadialGradient(
        obstacle.x, obstacle.y, 0,
        obstacle.x, obstacle.y, layerRadius
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${layerAlpha})`);
      gradient.addColorStop(0.7, `rgba(255, 255, 255, ${layerAlpha * 0.5})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
      this.ctx.restore();
    }

    // Add pulsing ring effect (simplified)
    if (intensity > 0.5) {
      const pulseRadius = Math.max(0.1, baseRadius * (2 + Math.sin(glowAge * 8) * 0.3));
      this.ctx.save();
      this.ctx.globalCompositeOperation = 'screen';
      this.ctx.beginPath();
      this.ctx.arc(obstacle.x, obstacle.y, pulseRadius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.3})`;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
} 