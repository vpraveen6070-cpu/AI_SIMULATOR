# 🚀 Cyberpunk AI Interview Simulator

A deeply immersive, highly interactive web-based AI Interview Simulator styled with a modern, futuristic dark-glassmorphic neon aesthetic. The platform continuously simulates technical engineering interviews completely natively in the browser without requiring a backend server.

## ✨ Features
*   **Immersive 3D Environment**: Native integration with Three.js rendering an active wireframe UI galaxy and fully dynamic camera sweeps across multiple states (Login, Role Selection, Interview Dashboard).
*   **Voice Recognition & Speech Synthesis**: Uses the Web Speech API (`SpeechRecognition` and `SpeechSynthesis`) to provide a hands-free conversational interface allowing the user to dictate technical answers while a synthesized digital voice asks questions.
*   **Algorithmic Concept Parsing**: The simulator grades the candidate entirely based on length heuristics and an internal mapping of `30+` specialized technical engineering vocabulary keywords guaranteeing purely deterministic and "fair" outputs.
*   **Dynamic SPA Routing**: The app natively routes view chunks (`Login -> Landing -> Role Select -> History`) seamlessly over the 3D WebGL background without page reloads.
*   **Persistent Trails**: Tracks exactly where users drop out of an interview question chunk, smoothly bringing them back exactly where they left off in the question sequence when rebooting that role pathway.

## 🛠️ Technology Stack
*   **HTML5 / CSS3** (Vanilla Glassmorphism Layout + Keyframe Animations)
*   **Vanilla JavaScript / ES6** 
*   **Three.js** (For 3D environmental camera staging)
*   **Vite / Web Speech API**

## 💻 How to Run
Due to the Application dynamically pulling HTML chunk templates natively into the DOM via the Fetch API (`await fetch()`), **the project must be run from a local development server** rather than just double-clicking the `index.html` file (otherwise modern browsers trigger a strict local execution CORS block).

1. Ensure you have the `Live Server` plugin installed in VSCode (or use Node's `http-server`).
2. Serve the root `/ai-interview-simulator/` folder.
3. Automatically triggers and bootstraps the login gateway on `localhost`!
