class AudioManager {
  constructor() {
    this.audioContext = null;
    this.audioBuffer = null;
    this.tickBuffer = null;
    this.doorbellBuffer = null;
    this.marimbaBuffer = null;
    this.pvcPipeBuffer = null;
    this.bikeBellBuffer = null;
    this.isAudioInitialized = false;
    this.playingSounds = new Set();
    this.dragOscillator = null;
    this.dragGainNode = null;
    
    // Audio constants
    this.PENTATONIC_SCALE = [1, 1.25, 1.5, 1.67, 2];
    this.BASE_FREQUENCY = 0.75;
  }

  async initializeAudio() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Load audio files
      await this.loadAudioFiles();
      
      // Create tick sound
      this.createTickSound();
      
      // Create drag sound oscillator
      this.createDragSound();

      this.isAudioInitialized = true;
      console.log("Audio initialized and loaded");
    } catch (error) {
      console.error("Error initializing audio:", error);
    }
  }

  async loadAudioFiles() {
    // Load the handpan sound
    const response = await fetch('handpan.wav');
    const arrayBuffer = await response.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    // Load the doorbell sound
    const doorbellResponse = await fetch('doorbell.wav');
    const doorbellArrayBuffer = await doorbellResponse.arrayBuffer();
    this.doorbellBuffer = await this.audioContext.decodeAudioData(doorbellArrayBuffer);

    // Load the marimba sound
    const marimbaResponse = await fetch('marimba.wav');
    const marimbaArrayBuffer = await marimbaResponse.arrayBuffer();
    this.marimbaBuffer = await this.audioContext.decodeAudioData(marimbaArrayBuffer);

    // Load PVC pipe hit sound
    try {
      const pvcResponse = await fetch('pvc_pipe_hit_2.wav');
      const pvcArrayBuffer = await pvcResponse.arrayBuffer();
      this.pvcPipeBuffer = await this.audioContext.decodeAudioData(pvcArrayBuffer);
    } catch (error) {
      console.warn('Could not load pvc_pipe_hit_2.wav:', error);
    }

    // Load bike bell sound (MP3)
    try {
      const bellResponse = await fetch('bike_bell.mp3');
      const bellArrayBuffer = await bellResponse.arrayBuffer();
      this.bikeBellBuffer = await this.audioContext.decodeAudioData(bellArrayBuffer);
    } catch (error) {
      console.warn('Could not load bike_bell.mp3:', error);
    }
  }

  createTickSound() {
    const tickDuration = 0.1;
    this.tickBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * tickDuration, this.audioContext.sampleRate);
    const tickData = this.tickBuffer.getChannelData(0);
    for (let i = 0; i < this.tickBuffer.length; i++) {
      const t = i / this.tickBuffer.length;
      tickData[i] = Math.sin(2 * Math.PI * 110 * t) * (1 - t) * 0.05;
    }
  }

  createDragSound() {
    this.dragOscillator = this.audioContext.createOscillator();
    this.dragGainNode = this.audioContext.createGain();
    this.dragGainNode.gain.value = 0;
    this.dragOscillator.connect(this.dragGainNode);
    this.dragGainNode.connect(this.audioContext.destination);
    this.dragOscillator.start();
  }

  updateDragSound(x, y, center, canvas) {
    if (!this.isAudioInitialized || !this.dragOscillator || !this.dragGainNode) return;

    const dx = x - center.x;
    const dy = y - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const maxDistance = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    
    const frequency = 220 + (normalizedDistance * 660);
    this.dragOscillator.frequency.value = frequency;
    this.dragGainNode.gain.value = 0.1;
  }

  stopDragSound() {
    if (!this.isAudioInitialized || !this.dragGainNode) return;
    this.dragGainNode.gain.value = 0;
  }

  playHitSound(obstacle, center, canvas) {
    if (!this.isAudioInitialized || !this.audioContext || !this.audioBuffer) {
      return;
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const dx = obstacle.x - center.x;
    const dy = obstacle.y - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const maxDistance = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    
    const scaleIndex = Math.floor(normalizedDistance * this.PENTATONIC_SCALE.length);
    const playbackRate = this.BASE_FREQUENCY * this.PENTATONIC_SCALE[scaleIndex];

    const source = this.audioContext.createBufferSource();
    source.buffer = this.audioBuffer;
    source.playbackRate.value = playbackRate;
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0.5;
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start();
  }

  playTickSound() {
    if (!this.isAudioInitialized || !this.audioContext || !this.tickBuffer) {
      return;
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = this.tickBuffer;
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0.08;
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start();
  }

  playMarimbaSound(distance, maxDistance) {
    if (!this.isAudioInitialized || !this.marimbaBuffer) return;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0.4;
    const source = this.audioContext.createBufferSource();
    source.buffer = this.marimbaBuffer;
    
    const normalizedDistance = distance / maxDistance;
    const pitches = [1.0, 1.122, 1.260, 1.498, 1.682, 2.0];
    const pitchIndex = Math.floor(normalizedDistance * (pitches.length - 1));
    source.playbackRate.value = pitches[pitchIndex];
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start();
  }

  playSlingshotSound(tension) {
    if (!this.isAudioInitialized || !this.pvcPipeBuffer) return;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0.6 * tension; // Volume based on tension
    const source = this.audioContext.createBufferSource();
    source.buffer = this.pvcPipeBuffer;
    source.playbackRate.value = 0.8 + (tension * 0.4); // Pitch based on tension
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start();
  }

  playMergeSound(isSlingshotCollision = false) {
    if (!this.isAudioInitialized) return;

    if (isSlingshotCollision && this.bikeBellBuffer) {
      // Use bike bell for slingshot collisions
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0.5;
      const source = this.audioContext.createBufferSource();
      source.buffer = this.bikeBellBuffer;
      source.playbackRate.value = 1.0;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      source.start();
    } else if (this.doorbellBuffer) {
      // Use doorbell for normal merges
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0.4;
      const source = this.audioContext.createBufferSource();
      source.buffer = this.doorbellBuffer;
      source.playbackRate.value = 1.0;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      source.start();
    }
  }
} 