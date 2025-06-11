const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const fileInput = document.getElementById("fileInput");

let points = [];
let velocities = [];
let image = null;
const numPoints = 100;
const pointRadius = 2;

// Initialize canvas size
function resizeCanvas() {
  canvas.width = window.innerWidth * 0.8;
  canvas.height = window.innerHeight * 0.8;
}

// Initialize points
function initPoints() {
  points = [];
  velocities = [];
  for (let i = 0; i < numPoints; i++) {
    points.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
    });
    velocities.push({
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
    });
  }
}

// Update point positions
function updatePoints() {
  for (let i = 0; i < points.length; i++) {
    points[i].x += velocities[i].x;
    points[i].y += velocities[i].y;

    // Bounce off edges
    if (points[i].x < 0 || points[i].x > canvas.width) {
      velocities[i].x *= -1;
    }
    if (points[i].y < 0 || points[i].y > canvas.height) {
      velocities[i].y *= -1;
    }
  }
}

// Draw Voronoi diagram
function drawVoronoi() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      let minDist = Infinity;
      let closestPoint = null;

      // Find closest point
      for (let i = 0; i < points.length; i++) {
        const dx = points[i].x - x;
        const dy = points[i].y - y;
        const dist = dx * dx + dy * dy;

        if (dist < minDist) {
          minDist = dist;
          closestPoint = points[i];
        }
      }

      // Get color from image at closest point
      if (image) {
        const imgX = Math.floor((closestPoint.x / canvas.width) * image.width);
        const imgY = Math.floor(
          (closestPoint.y / canvas.height) * image.height
        );
        const idx = (imgY * image.width + imgX) * 4;

        const pixelIdx = (y * canvas.width + x) * 4;
        data[pixelIdx] = image.data[idx];
        data[pixelIdx + 1] = image.data[idx + 1];
        data[pixelIdx + 2] = image.data[idx + 2];
        data[pixelIdx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Draw points
  ctx.fillStyle = "white";
  for (let i = 0; i < points.length; i++) {
    ctx.beginPath();
    ctx.arc(points[i].x, points[i].y, pointRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Animation loop
function animate() {
  updatePoints();
  drawVoronoi();
  requestAnimationFrame(animate);
}

// Handle image upload
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create temporary canvas to get image data
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        tempCtx.drawImage(img, 0, 0);
        image = tempCtx.getImageData(0, 0, img.width, img.height);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Initialize
resizeCanvas();
initPoints();
animate();

// Handle window resize
window.addEventListener("resize", () => {
  resizeCanvas();
  initPoints();
});
