# Raycaster Sound Toy - Modular Structure

This interactive raycaster application has been restructured into modular JavaScript classes for better organization and development experience.

## File Structure

```
js/
├── Constants.js         - Global configuration and constants
├── Utils.js            - Utility functions and helpers
├── AnimationController.js - Advanced animation system
├── AudioManager.js      - Handles all audio functionality
├── UIController.js      - Manages UI controls and sliders
├── ObstacleManager.js   - Handles obstacle physics and rendering
├── InputHandler.js      - Manages touch/mouse input events
├── RaycastingSystem.js  - Handles ray calculations and rendering
├── Renderer.js          - Manages drawing operations
└── App.js              - Main application coordinator
```

## Class Overview

### Constants
- Centralized configuration values
- Animation durations and timing
- Physics constants and magic numbers
- Audio file paths and scales

### Utils
- Mathematical utility functions (distance, normalize, clamp)
- Easing functions for smooth animations
- Touch and canvas helper functions
- Color and validation utilities

### AnimationController
- Manages complex animation sequences
- Handles spawn, boost, merge, and launch animations
- Provides animation factory methods
- Centralized animation timing and easing

### AudioManager
- Initializes Web Audio API context
- Loads audio files (handpan, doorbell, marimba)
- Handles sound playback for hits, merges, and creation
- Manages drag sound effects

### UIController
- Manages all UI sliders and controls
- Provides getter methods for UI values
- Handles pinch gesture updates
- Manages audio status display

### ObstacleManager
- Creates and manages obstacle circles
- Handles physics simulation and collisions
- Manages merge animations and effects
- Handles time freeze functionality

### InputHandler
- Processes touch and mouse events
- Manages shadow circle and trail system
- Handles gesture recognition (pinch, long press, tap)
- Creates obstacles based on user interaction

### RaycastingSystem
- Calculates ray intersections with obstacles
- Manages ray animation states
- Handles ray-obstacle hit detection
- Renders rays and shadow rays

### Renderer
- Handles all drawing operations
- Manages visual effects (glows, shadows)
- Draws obstacles with various states
- Handles time freeze visual effects

### App
- Main coordinator class
- Initializes all systems
- Manages the main update/render loop
- Handles system communication

## Development Benefits

1. **Modularity**: Each class has a single responsibility
2. **Maintainability**: Easier to find and modify specific functionality
3. **Testing**: Individual components can be tested in isolation
4. **Cursor AI Optimization**: Smaller, focused files improve AI development speed
5. **Scalability**: Easy to add new features without affecting existing code

## Loading Order

The JavaScript files are loaded in dependency order in `index.html`:
1. Constants (global configuration)
2. Utils (utility functions)
3. AnimationController (animation system)
4. AudioManager
5. UIController
6. ObstacleManager
7. InputHandler
8. RaycastingSystem
9. Renderer
10. App (main coordinator)

## Usage

The application initializes automatically when the DOM is ready. All classes are instantiated and connected in the `App` constructor.

## Getting Started with Development

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Francisred/CC-RAYCASTING.git
   cd CC-RAYCASTING
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to `http://localhost:5173`

### Setting Up Visual Studio Code

This project is optimized for development with Visual Studio Code and GitHub Copilot.

#### Step 1: Install VS Code
Download from [https://code.visualstudio.com/](https://code.visualstudio.com/)

#### Step 2: Open Project
```bash
code .
```

#### Step 3: Install Recommended Extensions
When you open the project, VS Code will prompt you to install recommended extensions. Click "Install All" to get:
- **GitHub Copilot** - AI-powered code completion
- **GitHub Copilot Chat** - Interactive AI assistant
- ESLint, Prettier, and more

#### Step 4: Sign in to GitHub Copilot
1. Click the Copilot icon in the status bar
2. Sign in with your GitHub account
3. Start coding with AI assistance!

> **New to GitHub Copilot?** Check out our [CONTRIBUTING.md](CONTRIBUTING.md) for a complete setup guide, tips, and best practices.

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed instructions on:
- Setting up your development environment
- Installing and using GitHub Copilot
- Project structure and code style
- Making and submitting changes 