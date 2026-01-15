# Contributing to CC-RAYCASTING

Thank you for your interest in contributing to this interactive raycasting sound toy! This guide will help you set up your development environment with Visual Studio Code.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Setting Up Visual Studio Code](#setting-up-visual-studio-code)
- [Installing GitHub Copilot](#installing-github-copilot)
- [Development Setup](#development-setup)
- [Running the Project](#running-the-project)
- [Project Structure](#project-structure)

## Prerequisites

Before you begin, make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Git](https://git-scm.com/)
- [Visual Studio Code](https://code.visualstudio.com/)

## Setting Up Visual Studio Code

### 1. Install Visual Studio Code
If you haven't already, download and install VS Code from [https://code.visualstudio.com/](https://code.visualstudio.com/)

### 2. Clone the Repository
```bash
git clone https://github.com/Francisred/CC-RAYCASTING.git
cd CC-RAYCASTING
```

### 3. Open in VS Code
```bash
code .
```

Or open VS Code and use `File > Open Folder` to open the CC-RAYCASTING directory.

## Installing GitHub Copilot

GitHub Copilot is an AI-powered code completion tool that can significantly speed up your development workflow.

### Step 1: Install the GitHub Copilot Extension

1. Open VS Code
2. Click on the Extensions icon in the sidebar (or press `Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "GitHub Copilot"
4. Click "Install" on both:
   - **GitHub Copilot** (main extension)
   - **GitHub Copilot Chat** (for interactive AI assistance)

### Step 2: Sign In to GitHub

1. After installing, you'll be prompted to sign in to GitHub
2. Click "Sign in to GitHub" in the notification
3. Follow the browser prompts to authorize VS Code
4. Return to VS Code once authorized

### Step 3: Verify Copilot is Active

- Look for the Copilot icon in the status bar (bottom right)
- It should show a checkmark when active
- If you see a warning icon, click it to troubleshoot

> **Note:** GitHub Copilot requires a subscription. You can start a free trial or use it free if you're a student, teacher, or open source maintainer. Learn more at [https://github.com/features/copilot](https://github.com/features/copilot)

## Recommended Extensions

When you open this project in VS Code, you'll be prompted to install recommended extensions. Click "Install All" to get:

- **GitHub Copilot** - AI-powered code suggestions
- **GitHub Copilot Chat** - Interactive AI coding assistant
- **ESLint** - JavaScript linting
- **Prettier** - Code formatter
- **Live Server** - Local development server
- **JavaScript Debugger** - Enhanced debugging tools

Alternatively, install them manually from the Extensions marketplace.

## Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```

This will start Vite's development server, typically at `http://localhost:5173`

### 3. Open in Browser
The development server will automatically open your browser. If not, navigate to the URL shown in the terminal.

## Running the Project

### Development Mode
```bash
npm run dev
```
- Hot module reloading enabled
- Open at `http://localhost:5173`
- Changes reload automatically

### Build for Production
```bash
npm run build
```
Builds the project to the `dist` folder.

### Preview Production Build
```bash
npm run preview
```
Preview the production build locally.

## Project Structure

```
CC-RAYCASTING/
├── .vscode/              # VS Code configuration
│   ├── extensions.json   # Recommended extensions
│   ├── settings.json     # Project-specific settings
│   └── launch.json       # Debug configurations
├── js/                   # Modular JavaScript classes
│   ├── Constants.js      # Global configuration
│   ├── Utils.js          # Utility functions
│   ├── AnimationController.js
│   ├── AudioManager.js
│   ├── UIController.js
│   ├── ObstacleManager.js
│   ├── InputHandler.js
│   ├── RaycastingSystem.js
│   ├── Renderer.js
│   └── App.js           # Main application
├── public/              # Static assets
├── index.html           # Entry point
├── package.json         # Dependencies and scripts
└── README.md           # Project documentation
```

## Using GitHub Copilot Effectively

### Inline Suggestions
- Start typing and Copilot will suggest completions
- Press `Tab` to accept a suggestion
- Press `Esc` to dismiss
- Use `Alt+]` (Windows/Linux) or `Option+]` (Mac) to see next suggestion

### Copilot Chat
- Press `Ctrl+I` / `Cmd+I` to open inline chat
- Press `Ctrl+Shift+I` / `Cmd+Shift+I` to open chat sidebar
- Ask questions about the code
- Request explanations or refactoring suggestions
- Generate documentation or tests

### Tips for Better Copilot Suggestions
1. Write clear, descriptive comments before code blocks
2. Use meaningful variable and function names
3. Break down complex tasks into smaller functions
4. Review suggestions before accepting them
5. Provide context with well-structured code

## Debugging

### Using Browser DevTools
1. Open the app in Chrome/Edge
2. Press `F12` to open DevTools
3. Use Console, Sources, and Network tabs for debugging

### VS Code Debugging
1. Press `F5` to start debugging
2. Set breakpoints by clicking left of line numbers
3. Use Debug Console for live code evaluation

## Code Style

This project uses:
- 2 spaces for indentation
- Single quotes for strings
- Semicolons at end of statements
- Format on save (via Prettier)

The VS Code settings are pre-configured to enforce these styles.

## Making Changes

1. Create a new branch for your feature
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes using the modular class structure

3. Test your changes thoroughly
   - Check browser console for errors
   - Test on different screen sizes
   - Verify audio functionality

4. Commit your changes
   ```bash
   git add .
   git commit -m "Add your descriptive commit message"
   ```

5. Push and create a pull request
   ```bash
   git push origin feature/your-feature-name
   ```

## Getting Help

- Check existing [Issues](https://github.com/Francisred/CC-RAYCASTING/issues)
- Review the [README.md](README.md) for project overview
- Use GitHub Copilot Chat to ask questions about the code
- Reach out to maintainers if you need assistance

## Additional Resources

- [VS Code Documentation](https://code.visualstudio.com/docs)
- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Vite Documentation](https://vitejs.dev/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

Happy coding! 🎵
