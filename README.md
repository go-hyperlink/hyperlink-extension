# Hyperlink — Universal Browser Command Center

> **Hyperlink** is an all-in-one, 100% free Chrome extension (Manifest V3) that provides a unified floating sidebar and command center directly over any webpage.

Instead of installing a dozen separate extensions for AI chat, article summarization, screen recording, screenshot capture, ad-free reading, data extraction, media downloading, and tab management, **Hyperlink** combines all these utilities into a single, high-performance interface with zero host-page styling interference (isolated via Shadow DOM).

---

## ✨ Features at a Glance

- **🤖 AI Assistant & Web Copilot:** Ask questions about the current page, define terms, explain selections, or chat with multi-turn AI. Supports **Groq Cloud** (`llama-3.1-8b-instant`, `qwen/qwen3.8-27b`, `deepseek-r1-distill-llama-70b`), **Google Gemini**, **OpenAI**, **Ollama**, or the **Offline Built-in Engine**.
- **⚡ Smart Article Summarizer:** Instant executive briefs, bullet points, and key takeaways from any article or document.
- **📖 Clean Reader Mode:** Distraction-free reading view that strips ads, clutter, and trackers with customizable themes and font sizing.
- **📸 Screenshot Suite:** Viewport captures, draggable area selections, and full-page captures with copy, download, and annotation.
- **🎙️ Screen & Audio Recorder:** Capture browser tabs, entire screens, or microphone audio with no watermarks.
- **🔊 Read Aloud (TTS):** Natural speech reader with sentence highlighting and adjustable playback speeds.
- **📊 Content Extractor:** Extract tables to CSV/JSON, batch-download images, and extract emails, phone numbers, and links.
- **🗂️ Tab Manager:** Fast fuzzy tab search, duplicate tab remover, and session snapshots.
- **🎨 Quick Utilities:** Color picker (EyeDropper), video speed controller, page-to-PDF exporter, and language translator.

---

## 📋 Prerequisites

Make sure you have the following installed on your computer:

- **[Node.js](https://nodejs.org/)** (v18.0.0 or higher recommended)
- **npm** (comes bundled with Node.js)
- A **Chromium-based browser** (Google Chrome, Brave, Microsoft Edge, Arc, Opera, etc.)

---

## 🚀 Local Setup & Installation

Follow these simple steps to set up and run Hyperlink on your local machine:

### 1. Clone or Download the Repository

```bash
git clone https://github.com/your-username/hyperlink.git
cd hyperlink
```
*(Or simply open the project folder in your terminal).*

### 2. Install Dependencies

Install the required npm packages:

```bash
npm install
```

### 3. Build the Extension Bundle

Compile the TypeScript and Tailwind CSS code into the `dist/` directory:

```bash
npm run build
```

Once the build finishes, you will see a `dist/` folder containing the compiled extension files (`manifest.json`, `content.js`, `background.js`, `popup.html`, etc.).

---

## 🌐 Load the Extension in Your Browser

1. Open your browser and navigate to the extensions page:
   - **Chrome / Brave:** `chrome://extensions`
   - **Edge:** `edge://extensions`
2. Enable **Developer mode** (toggle located in the top-right corner).
3. Click the **Load unpacked** button in the top-left corner.
4. In the file picker, select the **`dist/`** folder located inside this project directory.
5. Hyperlink is now active! Pin the extension icon to your browser toolbar for quick access.

---

## ⌨️ How to Use Hyperlink

- **Open / Close Sidebar:** Press `Alt + Space` (or `Ctrl + Space` / `Cmd + Space`), or click the floating pill on the edge of any page.
- **Universal Command Bar:** Press `Ctrl + K` or `Cmd + K` to search and launch any tool instantly.
- **Text Selection Toolbar:** Highlight any text on any webpage to instantly trigger AI explanations, translations, or TTS read-aloud.
- **Close Panels:** Press `Escape` to close active sliding panels or collapse the sidebar.

---

## 🔑 Setting Up Free AI (Optional)

Hyperlink includes a **Built-in Offline Hybrid Engine** that works with zero setup and no API keys. 

If you want ultra-fast, frontier AI answers:
1. Open the Hyperlink sidebar and click **Settings** (gear icon).
2. Choose **Groq Cloud** under **Provider Engine**.
3. Paste your free API key from [console.groq.com/keys](https://console.groq.com/keys) (free 1-step signup, no credit card required).
4. Select your preferred model:
   - **`qwen/qwen3.8-27b`** (Qwen 3.8 27B)
   - **`llama-3.1-8b-instant`** (Ultra-fast / High rate-limit)
   - **`deepseek-r1-distill-llama-70b`** (Advanced reasoning)
5. Click **Save Settings**!

---

## 🔄 Making Changes & Rebuilding

If you edit any files in `src/`:
1. Rebuild the bundle:
   ```bash
   npm run build
   ```
2. Go to `chrome://extensions` and click the **Reload (↻)** icon on the Hyperlink card.
3. Refresh any open web page to test your updates.

---

## 📁 Project Structure

```text
├── dist/                # Compiled production extension ready for browser loading
├── public/              # Static assets, icons, and manifest.json template
├── scripts/
│   └── build.js         # esbuild & Tailwind production build pipeline
├── src/
│   ├── background/      # Chrome extension service worker
│   ├── components/      # Reusable UI elements, modals, and container shells
│   ├── content/         # Shadow-DOM isolated overlay and floating sidebar
│   ├── context/         # React state management (HyperlinkContext)
│   ├── features/        # Modular feature panels (AI, Reader, Recorder, etc.)
│   ├── services/        # Storage, AI providers, media capture, tab management
│   └── styles/          # Tailwind CSS styles and glassmorphism themes
├── package.json         # Project scripts and dependencies
└── tsconfig.json        # TypeScript configuration
```

---

## 📄 License

This project is licensed under the MIT License.
