# Google Gemini 2.5 Flash Chatbot Application

A modern, SaaS-style AI Chatbot client built with pure Vanilla JavaScript (ES6+), semantic HTML5, and responsive CSS3. The application is integrated with the official Google Gemini 2.5 Flash API to provide rapid, context-aware AI conversations.

---

## Features

- **Gemini 2.5 Flash Integration**: Connected to Google's rapid language model for text completion, brainstorming, and code generation.
- **SaaS-Style UX/UI**: Responsive mobile-friendly design with custom HSL theme settings, cards, status alerts, and glassmorphism panels.
- **Light/Dark Mode Toggling**: Seamless background/border swaps preserving user settings across refreshes.
- **Chat History Cache**: Automatically persists and loads chat history utilizing browser local storage.
- **Clean Markdown Renderer**: Custom parser to format lists, bold titles, inline code, and code blocks complete with a Copy-to-Clipboard button.
- **Robust Network Communications**: Expontential backoff retry logic to handle transient rate limits (`429`) or server limits (`5xx`).
- **Input Security & XSS Shield**: Escapes HTML tags and segregates parsed outputs to prevent Cross-Site Scripting.

---

## Project Folder Structure

```text
AI-Chatbot-GoogleGemini/
├── index.html       # Web App entry point containing structure and settings modal
├── style.css        # Premium responsive design tokens, variables, layout, animations
├── config.js        # Gemini API credentials, safety parameters, and retry rules
├── script.js        # DOM events, local storage persistence, markdown parser, Fetch and retry loop
└── README.md        # This setup, configuration, security, and deployment manual
```

---

## Setup Instructions

### 1. Prerequisite: Local Hosting Environment
Because the application uses ES6 Javascript Modules (`import`/`export`), opening the `index.html` file directly in your browser (`file://` protocol) will fail due to browser CORS security policies.

To run it locally, host the directory on a local server. You can use any of the following simple tools:

- **VS Code Live Server (Recommended)**:
  1. Open the project folder in VS Code.
  2. Install the **Live Server** extension by Ritwick Dey.
  3. Click the **Go Live** button in the bottom right corner of VS Code.
  
- **NodeJS http-server**:
  1. Run `npx http-server` in the project directory.
  2. Open the URL shown (usually `http://127.0.0.1:8080`) in your browser.

- **Python HTTP Server**:
  - For Python 3: Run `python -m http.server 8000`
  - For Python 2: Run `python -m SimpleHTTPServer 8000`
  - Open `http://localhost:8000` in your browser.

---

## Gemini API Configuration Guide

To use the chatbot, you need a Google Gemini API Key. Follow these steps:

1. **Create an API Key**:
   - Go to [Google AI Studio](https://aistudio.google.com/).
   - Click the **Get API Key** button in the top left.
   - Click **Create API Key** and choose whether to attach it to a new or existing Google Cloud project.
   - Copy the generated API key (starts with `AIzaSy...`).

2. **Configure the API Key**:
   - **Option A (Persistent & Private)**: Paste your key into `config.js` in the `GEMINI_API_KEY` field:
     ```javascript
     export const CONFIG = {
       GEMINI_API_KEY: 'YOUR_COPIED_API_KEY_HERE',
       // ...
     };
     ```
   - **Option B (Safe for Public Repositories)**: Leave the `GEMINI_API_KEY` blank in `config.js`. When you launch the web page, the app will detect the missing key and open the **API Configuration Settings Modal**. Paste your key there. It will be stored in your browser's local storage and used directly for API requests.

---

## Deployment Guides

Since this application is a static website (HTML, CSS, JS), it can be deployed to static hosting providers for free.

### 1. GitHub Pages
1. Create a repository on GitHub.
2. Initialize Git in your local folder and push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/your-repo-name.git
   git push -u origin main
   ```
3. Go to the repository settings on GitHub.
4. Click on **Pages** in the left sidebar menu.
5. In the **Build and deployment** section:
   - Source: **Deploy from a branch**.
   - Branch: Select `main` and folder `/ (root)`.
   - Click **Save**.
6. GitHub will build the site and provide a URL (e.g., `https://your-username.github.io/your-repo-name/`) within a few minutes.

> [!IMPORTANT]
> If deploying to a public repository on GitHub, **do not** write your API key in `config.js`. Rely on Option B (entering the key via the UI settings modal) to keep your key secure.

---

### 2. Netlify
#### Option A: Drag and Drop (Fastest)
1. Go to [Netlify](https://www.netlify.com/) and log in.
2. Go to the **Sites** tab.
3. Scroll down to the bottom and drag your project folder into the box labeled **"Want to deploy a new site without connecting to Git? Drag and drop your site folder here"**.
4. Netlify will deploy your site instantly and generate a live link.

#### Option B: GitHub Integration
1. Go to the Netlify Dashboard and click **Add new site** -> **Import from Git**.
2. Connect your GitHub account and select your repository.
3. Keep default settings:
   - Build command: Leave blank.
   - Publish directory: `.` (root).
4. Click **Deploy Site**. Netlify will rebuild the project automatically on every push.

---

### 3. Vercel
#### Option A: Vercel CLI
1. Install the Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```
2. Open your terminal in the project directory and run:
   ```bash
   vercel
   ```
3. Log in or sign up when prompted.
4. Follow the configuration prompts:
   - Link to existing project? **No**
   - Project name: **gemini-chatbot**
   - In which directory is your code located? **./**
   - Want to modify these settings? **No**
5. Vercel will upload and deploy your files. To deploy to production, run:
   ```bash
   vercel --prod
   ```

#### Option B: Vercel Dashboard
1. Go to [Vercel](https://vercel.com/) and log in.
2. Click **Add New...** -> **Project**.
3. Select your GitHub repository from the import list.
4. Keep the framework preset as **Other** and build settings empty.
5. Click **Deploy**. Vercel will host the files on a `.vercel.app` subdomain.

---

## Security Practices Included

- **XSS Shielding**: The application runs incoming text values through character escapes for elements, preventing users or the model from triggering DOM script injections.
- **Pruned Dynamic Parsing**: Markdown structures are processed via isolated state blocks so that raw script headers are stripped from code block containers.
- **Client-Side Encryption/Isolation**: Storing custom keys inside local storage ensures credentials remain in sandbox segments on your physical system and are never transferred to outside parties.