# AI Headshot Generator

A modern Next.js web application that uses Google's Gemini 2.5 Flash Image Preview to transform regular photos into professional headshots.

## Features

- **Drag & Drop Upload**: Upload images by dragging and dropping or clicking to browse
- **AI-Powered Generation**: Uses Gemini 2.5 Flash Image Preview for high-quality headshot generation
- **Professional Styling**: Transforms photos with cinematic lighting and professional backgrounds
- **Download Functionality**: Download generated headshots in high resolution
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Next.js App Router**: Built with the latest Next.js 15 features
- **Vercel Ready**: Optimized for deployment on Vercel

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Get Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the API key

3. **Configure Environment**
   - Create a `.env.local` file in the root directory
   - Add your API key:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

4. **Run the Application**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   - The app will open at `http://localhost:3000`

## Deployment to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Add your `GEMINI_API_KEY` in the environment variables section
   - Deploy!

3. **Alternative: Vercel CLI**
   ```bash
   npm i -g vercel
   vercel
   ```

## Usage

1. **Upload Image**: Drag and drop an image or click to browse and select a photo
2. **Generate**: Click "Generate Headshot" to process the image with AI
3. **Download**: Once generated, click "Download Image" to save your professional headshot

## Technology Stack

- **Frontend**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **AI**: Google Gemini 2.5 Flash Image Preview
- **Deployment**: Vercel
- **Language**: TypeScript

## API Endpoint

The application includes a serverless API endpoint at `/api/generate-headshot` that handles the Gemini AI integration securely on the server side.

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

MIT License - feel free to use this project for personal or commercial purposes.