class UIController {
  constructor() {
    this.controls = document.querySelector(".controls");
    this.initializeSliders();
    this.initializeDisplayValues();
    this.setupEventListeners();
    this.showControls();
    this.createAudioStatus();
  }

  initializeSliders() {
    this.scaleSlider = document.getElementById("scale");
    this.circleSizeSlider = document.getElementById("circleSize");
    this.rayThicknessSlider = document.getElementById("rayThickness");
    this.fadeSpeedSlider = document.getElementById("fadeSpeed");
    this.stepSpeedSlider = document.getElementById("stepSpeed");
    this.rayLengthSlider = document.getElementById("rayLength");
    this.pushForceSlider = document.getElementById("pushForce");
    this.outwardForceSlider = document.getElementById("outwardForce");
    this.tickFrequencySlider = document.getElementById("tickFrequency");
  }

  initializeDisplayValues() {
    this.scaleValue = document.getElementById("scaleValue");
    this.circleSizeValue = document.getElementById("circleSizeValue");
    this.rayThicknessValue = document.getElementById("rayThicknessValue");
    this.fadeSpeedValue = document.getElementById("fadeSpeedValue");
    this.stepSpeedValue = document.getElementById("stepSpeedValue");
    this.rayLengthValue = document.getElementById("rayLengthValue");
    this.pushForceValue = document.getElementById("pushForceValue");
    this.outwardForceValue = document.getElementById("outwardForceValue");
    this.tickFrequencyValue = document.getElementById("tickFrequencyValue");
  }

  setupEventListeners() {
    this.scaleSlider.addEventListener("input", (e) => {
      this.scaleValue.textContent = e.target.value;
    });

    this.circleSizeSlider.addEventListener("input", (e) => {
      this.circleSizeValue.textContent = e.target.value;
    });

    this.rayThicknessSlider.addEventListener("input", (e) => {
      this.rayThicknessValue.textContent = e.target.value;
    });

    this.fadeSpeedSlider.addEventListener("input", (e) => {
      this.fadeSpeedValue.textContent = e.target.value;
    });

    this.stepSpeedSlider.addEventListener("input", (e) => {
      this.stepSpeedValue.textContent = e.target.value;
    });

    this.rayLengthSlider.addEventListener("input", (e) => {
      this.rayLengthValue.textContent = e.target.value;
    });

    this.pushForceSlider.addEventListener("input", (e) => {
      this.pushForceValue.textContent = e.target.value;
    });

    this.outwardForceSlider.addEventListener("input", (e) => {
      this.outwardForceValue.textContent = e.target.value;
    });

    this.tickFrequencySlider.addEventListener("input", (e) => {
      this.tickFrequencyValue.textContent = e.target.value;
    });
  }

  showControls() {
    this.controls.style.display = "block";
  }

  createAudioStatus() {
    this.audioStatus = document.createElement('div');
    this.audioStatus.style.position = 'fixed';
    this.audioStatus.style.top = '10px';
    this.audioStatus.style.left = '10px';
    this.audioStatus.style.color = 'white';
    this.audioStatus.style.padding = '10px';
    this.audioStatus.style.backgroundColor = 'rgba(0,0,0,0.5)';
    this.audioStatus.style.borderRadius = '5px';
    this.audioStatus.style.cursor = 'pointer';
    this.audioStatus.style.userSelect = 'none';
    this.audioStatus.style.fontFamily = 'Arial, sans-serif';
    this.audioStatus.style.fontSize = '16px';
    this.audioStatus.textContent = 'begin sound toy';
    document.body.appendChild(this.audioStatus);
  }

  hideAudioStatus() {
    if (this.audioStatus) {
      this.audioStatus.remove();
      this.audioStatus = null;
    }
  }

  updatePinchGesture(scale, initialCircleSize, initialStepSpeed) {
    // Calculate new circle size based on pinch scale
    let newSize = initialCircleSize * scale;
    newSize = Math.max(parseFloat(this.circleSizeSlider.min), 
                      Math.min(parseFloat(this.circleSizeSlider.max), newSize));
    
    this.circleSizeSlider.value = newSize;
    this.circleSizeValue.textContent = Math.round(newSize);

    // Calculate new step speed based on pinch scale (inverse relationship)
    let newStepSpeed = initialStepSpeed / scale;
    newStepSpeed = Math.max(parseFloat(this.stepSpeedSlider.min),
                          Math.min(parseFloat(this.stepSpeedSlider.max), newStepSpeed));
    
    this.stepSpeedSlider.value = newStepSpeed;
    this.stepSpeedValue.textContent = Math.round(newStepSpeed);
  }

  // Getter methods for accessing slider values
  getScale() {
    return parseFloat(this.scaleSlider.value);
  }

  getCircleSize() {
    return parseFloat(this.circleSizeSlider.value);
  }

  getRayThickness() {
    return parseFloat(this.rayThicknessSlider.value);
  }

  getFadeSpeed() {
    return parseFloat(this.fadeSpeedSlider.value);
  }

  getStepSpeed() {
    return parseFloat(this.stepSpeedSlider.value);
  }

  getRayLength() {
    return parseFloat(this.rayLengthSlider.value);
  }

  getPushForce() {
    return parseFloat(this.pushForceSlider.value);
  }

  getOutwardForce() {
    return parseFloat(this.outwardForceSlider.value);
  }

  getTickFrequency() {
    return parseFloat(this.tickFrequencySlider.value);
  }

  // Combined getter methods for convenience
  getCircleRadius() {
    return this.getCircleSize() * this.getScale();
  }

  getMaxRayThickness() {
    return this.getRayThickness() * this.getScale();
  }

  // Methods to get all values at once for performance
  getAllValues() {
    return {
      scale: this.getScale(),
      circleSize: this.getCircleSize(),
      rayThickness: this.getRayThickness(),
      fadeSpeed: this.getFadeSpeed(),
      stepSpeed: this.getStepSpeed(),
      rayLength: this.getRayLength(),
      pushForce: this.getPushForce(),
      outwardForce: this.getOutwardForce(),
      tickFrequency: this.getTickFrequency()
    };
  }

  // Update all display values (useful for initialization)
  updateAllDisplayValues() {
    this.scaleValue.textContent = this.getScale();
    this.circleSizeValue.textContent = this.getCircleSize();
    this.rayThicknessValue.textContent = this.getRayThickness();
    this.fadeSpeedValue.textContent = this.getFadeSpeed();
    this.stepSpeedValue.textContent = this.getStepSpeed();
    this.rayLengthValue.textContent = this.getRayLength();
    this.pushForceValue.textContent = this.getPushForce();
    this.outwardForceValue.textContent = this.getOutwardForce();
    this.tickFrequencyValue.textContent = this.getTickFrequency();
  }
} 