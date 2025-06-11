// Utility functions used across the application
const Utils = {
  // Mathematical utilities
  distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },

  normalize(x, y) {
    const length = Math.sqrt(x * x + y * y);
    if (length === 0) return { x: 0, y: 0 };
    return { x: x / length, y: y / length };
  },

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  lerp(start, end, factor) {
    return start + (end - start) * factor;
  },

  // Easing functions
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  },

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },

  // Touch utilities
  getTouchDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  },

  getTouchCoordinates(touch, canvas) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  },

  // Canvas utilities
  getCanvasCenter(canvas) {
    return {
      x: canvas.width / 2,
      y: canvas.height / 2
    };
  },

  getMaxCanvasDistance(canvas) {
    return Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
  },

  // Audio utilities
  mapDistanceToScale(distance, maxDistance, scale) {
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    const scaleIndex = Math.floor(normalizedDistance * scale.length);
    return scale[scaleIndex];
  },

  // Animation utilities
  getCurrentTime() {
    return performance.now() / 1000;
  },

  isOffscreen(obstacle, canvas) {
    return (
      obstacle.x + obstacle.radius < 0 ||
      obstacle.x - obstacle.radius > canvas.width ||
      obstacle.y + obstacle.radius < 0 ||
      obstacle.y - obstacle.radius > canvas.height
    );
  },

  // Color utilities
  rgba(r, g, b, a) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  },

  // Validation utilities
  isValidNumber(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }
}; 