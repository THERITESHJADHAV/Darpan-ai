# 🎥 Darpan-ai: AI Whiteboard Explainer Generator

Darpan-ai is an autonomous, full-stack pipeline that transforms any text, URL, or idea into a professional whiteboard animation video. It mimics a high-end production studio by automatically handling storyboarding, visual generation, hand-drawn animation, and voiceover orchestration.

![Darpan-ai Banner](https://image.pollinations.ai/prompt/professional%20whiteboard%20animation%20studio%20dashboard%20modern%20dark%20ui?width=1200&height=400&nologo=true)

## 🚀 The AI Video Pipeline

Unlike simple slideshow generators, Darpan-ai uses a sophisticated multi-stage backend pipeline:

1.  **🤖 Scene Orchestration**: Uses Google Gemini to transform user input into a logical sequence of visual metaphors and narrations.
2.  **🎨 Visual Synthesis**: Automatically generates high-quality whiteboard sketches using Pollinations AI.
3.  **✍️ Whiteboard Animation**: An OpenCV-powered Python engine simulates a hand-drawing effect frame-by-frame for every scene.
4.  **🎙️ Text-to-Speech**: Generates realistic narration using `gTTS` (Google Text-to-Speech).
5.  **🎞️ FFmpeg Orchestration**: A powerful backend layer that merges audio-video streams, loops visuals to match narration length, and concatenates scenes into a single high-quality `.mp4` file.

## 💎 Key Features

-   **One-Click Generation**: Enter a topic and get a fully-produced video in under 60 seconds.
-   **Intelligent Analogy Engine**: Gemini AI simplifies complex topics into visual metaphors and simple language.
-   **Professional Transitions**: Seamlessly stitched scenes with baked-in audio synchronization.
-   **Native Web Player**: High-performance video player with full-screen support and native controls.
-   **Premium Dark UI**: A stunning glassmorphism interface built for modern creators.

## 🛠️ Tech Stack

-   **Frontend/Backend**: [Next.js 14](https://nextjs.org/) (App Router)
-   **Database**: MongoDB (via Mongoose)
-   **Image AI**: Pollinations AI (Free/No-Key)
-   **Video Engine**: Python 3.14 + [OpenCV](https://opencv.org/)
-   **Audio Engine**: Python + [gTTS](https://pypi.org/project/gTTS/)
-   **Processing**: [FFmpeg](https://ffmpeg.org/) (System Level)
-   **AI Intelligence**: [Google Gemini Pro](https://ai.google.dev/)

## 🚀 Getting Started

### 1. Prerequisites

-   **Python 3.10+**: Required for animation and audio scripts.
-   **FFmpeg**: Must be installed and added to your System PATH.
-   **Node.js 18+**: For the Next.js environment.

### 2. Setup Environment

Create a `.env.local` file:
```env
GEMINI_API_KEY=your_gemini_key_here
MONGODB_URI=your_mongodb_connection_string
```

### 3. Install Dependencies

```bash
# Install Node dependencies
npm install

# Install Python dependencies
pip install opencv-python numpy gTTS
```

### 4. Run the Platform

```bash
npm run dev
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
