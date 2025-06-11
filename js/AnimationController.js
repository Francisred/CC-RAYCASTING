// Handles complex animations and effects
class AnimationController {
  constructor() {
    this.animations = [];
  }

  // Animation factory methods
  createSpawnAnimation(obstacle) {
    return {
      target: obstacle,
      type: 'spawn',
      startTime: Utils.getCurrentTime(),
      duration: CONSTANTS.SPAWN_ANIMATION_DURATION,
      update: (progress) => {
        obstacle.scale = CONSTANTS.easeOutCubic ? Utils.easeOutCubic(progress) : progress;
      }
    };
  }

  createBoostAnimation(obstacle) {
    return {
      target: obstacle,
      type: 'boost',
      startTime: Utils.getCurrentTime(),
      duration: CONSTANTS.BOOST_DURATION,
      originalScale: obstacle.scale,
      update: (progress) => {
        const boostScale = 1 + (CONSTANTS.BOOST_SCALE - 1) * Math.sin(progress * Math.PI);
        obstacle.currentScale = obstacle.scale * boostScale;
      },
      onComplete: () => {
        obstacle.isBoostAnimating = false;
        obstacle.currentScale = obstacle.scale;
      }
    };
  }

  createMergeAnimation(obstacle) {
    return {
      target: obstacle,
      type: 'merge',
      startTime: Utils.getCurrentTime(),
      duration: CONSTANTS.MERGE_DURATION,
      update: (progress) => {
        const eased = Utils.easeOutCubic(progress);
        obstacle.scale = eased;
        obstacle.mergeAnimationProgress = eased;
      },
      onComplete: () => {
        obstacle.scale = 1;
        obstacle.isMergingNew = false;
      }
    };
  }

  createFadeOutAnimation(obstacle) {
    return {
      target: obstacle,
      type: 'fadeOut',
      startTime: Utils.getCurrentTime(),
      duration: CONSTANTS.MERGE_DURATION,
      originalScale: obstacle.scale,
      update: (progress) => {
        const eased = Utils.easeOutCubic(progress);
        obstacle.scale = obstacle.originalScale * (1 - eased);
      }
    };
  }

  createLaunchAnimation(obstacle) {
    return {
      target: obstacle,
      type: 'launch',
      startTime: Utils.getCurrentTime(),
      duration: CONSTANTS.LAUNCH_DURATION,
      update: (progress) => {
        obstacle.launchProgress = progress;
      },
      onComplete: () => {
        obstacle.isLaunching = false;
      }
    };
  }

  // Animation management
  addAnimation(animation) {
    this.animations.push(animation);
  }

  removeAnimation(animation) {
    const index = this.animations.indexOf(animation);
    if (index > -1) {
      this.animations.splice(index, 1);
    }
  }

  update() {
    const currentTime = Utils.getCurrentTime();
    
    for (let i = this.animations.length - 1; i >= 0; i--) {
      const animation = this.animations[i];
      const elapsed = currentTime - animation.startTime;
      const progress = Math.min(elapsed / animation.duration, 1);
      
      // Update animation
      if (animation.update) {
        animation.update(progress);
      }
      
      // Check if completed
      if (progress >= 1) {
        if (animation.onComplete) {
          animation.onComplete();
        }
        this.animations.splice(i, 1);
      }
    }
  }

  // Convenience methods for starting animations
  animateSpawn(obstacle) {
    const animation = this.createSpawnAnimation(obstacle);
    this.addAnimation(animation);
    return animation;
  }

  animateBoost(obstacle) {
    obstacle.isBoostAnimating = true;
    obstacle.boostStartTime = Utils.getCurrentTime();
    const animation = this.createBoostAnimation(obstacle);
    this.addAnimation(animation);
    return animation;
  }

  animateMerge(obstacle) {
    obstacle.isMergingNew = true;
    obstacle.mergeStartTime = Utils.getCurrentTime();
    const animation = this.createMergeAnimation(obstacle);
    this.addAnimation(animation);
    return animation;
  }

  animateFadeOut(obstacle) {
    obstacle.isMerging = true;
    obstacle.mergeStartTime = Utils.getCurrentTime();
    obstacle.originalScale = obstacle.scale;
    const animation = this.createFadeOutAnimation(obstacle);
    this.addAnimation(animation);
    return animation;
  }

  animateLaunch(obstacle) {
    obstacle.isLaunching = true;
    obstacle.launchStartTime = Utils.getCurrentTime();
    const animation = this.createLaunchAnimation(obstacle);
    this.addAnimation(animation);
    return animation;
  }

  // Get active animations for debugging
  getActiveAnimations() {
    return this.animations.map(anim => ({
      type: anim.type,
      target: anim.target,
      progress: (Utils.getCurrentTime() - anim.startTime) / anim.duration
    }));
  }

  // Clear all animations
  clear() {
    this.animations = [];
  }
} 