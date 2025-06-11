class App {
  constructor() {
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    
    // Initialize all systems
    this.audioManager = new AudioManager();
    this.uiController = new UIController();
    this.obstacleManager = new ObstacleManager(this.canvas, this.ctx);
    this.inputHandler = new InputHandler(this.canvas, this.obstacleManager, this.audioManager);
    this.raycastingSystem = new RaycastingSystem(this.canvas, this.ctx);
    this.renderer = new Renderer(this.canvas, this.ctx);
    
    // Connect systems
    this.inputHandler.setUIController(this.uiController);
    
    // State tracking
    this.hitObstacles = new Set();
    this.lastHitTimes = new Map();
    
    // Performance optimization
    this.lastUpdateTime = 0;
    this.frameSkipCounter = 0;
    this.TARGET_FPS = 60;
    this.FRAME_TIME = 1000 / this.TARGET_FPS;
    this.lastFrameTime = 0;
    
    // Initialize
    this.init();
  }

  init() {
    // Set up canvas resize
    window.addEventListener("resize", () => this.resize());
    this.resize();
    
    // Set up audio initialization callback
    this.audioManager.initializeAudio = async () => {
      await AudioManager.prototype.initializeAudio.call(this.audioManager);
      this.uiController.hideAudioStatus();
    };
    
    // Initialize UI display values
    this.uiController.updateAllDisplayValues();
    
    // Start the main loop
    this.loop();
  }

  resize() {
    this.renderer.resize();
  }

  getCenter() {
    return {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
    };
  }

  update() {
    const now = performance.now() / 1000;
    const deltaTime = Math.min(now - (this.lastUpdateTime || now), 1/30); // Cap deltaTime
    this.lastUpdateTime = now;
    
    // Get UI values
    const uiValues = this.uiController.getAllValues();
    
    // Update obstacles (always run)
    this.obstacleManager.updateObstacles(deltaTime, uiValues.outwardForce, this.audioManager);
    
    // Update raycasting (can be less frequent)
    this.frameSkipCounter++;
    if (this.frameSkipCounter % 2 === 0) { // Update every other frame
      this.raycastingSystem.updateRays(
        uiValues.stepSpeed,
        uiValues.fadeSpeed,
        this.hitObstacles,
        this.obstacleManager.getObstacles(),
        this.inputHandler.getTrail(),
        this.inputHandler.getShadowCircle(),
        uiValues.pushForce,
        this.lastHitTimes,
        this.audioManager,
        now
      );
    }
    
    // Update trail (always run for smooth visual)
    this.inputHandler.updateTrail();
  }

  draw() {
    // Clear canvas
    this.renderer.clear();
    
    // Get UI values
    const uiValues = this.uiController.getAllValues();
    
    // Draw time freeze effects if active
    if (this.obstacleManager.isTimeFreeze) {
      this.renderer.drawTimeFreezeFx();
    }
    
    // Draw trail
    this.inputHandler.drawTrail(this.ctx);
    
    // Draw central circle
    const circleRadius = uiValues.circleSize * uiValues.scale;
    this.renderer.drawCentralCircle(circleRadius);
    
    // Draw shadow circle
    this.inputHandler.draw(this.ctx);
    
    // Draw shadow rays if applicable
    const shadowCircle = this.inputHandler.getShadowCircle();
    if (shadowCircle && shadowCircle.isFromCenter) {
      this.raycastingSystem.drawShadowRays(
        shadowCircle,
        uiValues.rayLength,
        uiValues.scale,
        uiValues.rayThickness,
        this.obstacleManager.getObstacles(),
        this.inputHandler.getTrail()
      );
    }
    
    // Draw launch effects
    this.renderer.drawLaunchEffects(this.obstacleManager.getObstacles());
    
    // Draw obstacles with viewport culling
    const obstacles = this.obstacleManager.getObstacles();
    const margin = 100; // Margin for objects just outside viewport
    
    obstacles.forEach(obstacle => {
      // Simple viewport culling
      if (obstacle.x + obstacle.radius < -margin || 
          obstacle.x - obstacle.radius > this.canvas.width + margin ||
          obstacle.y + obstacle.radius < -margin || 
          obstacle.y - obstacle.radius > this.canvas.height + margin) {
        return; // Skip drawing off-screen obstacles
      }
      
      this.renderer.drawObstacle(obstacle);
    });
    
    // Draw rays
    this.raycastingSystem.drawRays(
      uiValues.scale,
      uiValues.circleSize,
      uiValues.rayThickness * uiValues.scale,
      uiValues.rayLength,
      obstacles,
      this.inputHandler.getTrail(),
      shadowCircle
    );
  }

  loop() {
    const currentTime = performance.now();
    
    // Frame rate limiting
    if (currentTime - this.lastFrameTime >= this.FRAME_TIME) {
      this.update();
      this.draw();
      this.lastFrameTime = currentTime;
    }
    
    requestAnimationFrame(() => this.loop());
  }
}

// Initialize the app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new App();
}); 