<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Gregorious Creative Studios - Virtual Try-On

A production-ready, high-quality virtual try-on application powered by Google's Gemini AI. Transform photos into professional fashion model images and experiment with different outfits using state-of-the-art AI image generation.

## Features

- **AI-Powered Model Transformation**: Convert any portrait into a professional fashion model image
- **Virtual Try-On**: Seamlessly fit garments onto your digital model
- **Pose Variations**: View your outfit from 6 different angles and poses
- **Color Recoloring**: Instantly change garment colors with AI precision
- **Style Scoring**: Get professional fashion critiques powered by AI
- **Undo/Redo System**: Full history tracking with keyboard shortcuts
- **Persistent Storage**: Save and restore your favorite looks
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Keyboard Navigation**: Full keyboard shortcut support for power users
- **Accessibility**: ARIA labels and screen reader support throughout

## Recent Improvements (Production-Ready)

### Security & Performance
- Image validation and file size limits (10MB max)
- Automatic image compression for optimal performance
- Input sanitization to prevent XSS attacks
- API key validation and error handling
- Retry logic with exponential backoff for failed requests
- Request timeouts to prevent hanging operations

### UX Enhancements
- Improved loading states with descriptive messages
- Better error handling with user-friendly messages
- Keyboard shortcuts for all major operations
- ARIA labels for screen reader accessibility
- Enhanced mobile responsiveness
- Smooth animations and transitions

### Code Quality
- Removed duplicate code
- Comprehensive error handling
- Type-safe TypeScript throughout
- Improved Gemini prompts for better image quality
- Better separation of concerns
- Comprehensive inline documentation

## Prerequisites

- **Node.js** (v16 or higher)
- **Gemini API Key** (Get one at [Google AI Studio](https://aistudio.google.com/apikey))

## Quick Start

### 1. Installation

```bash
# Clone the repository
cd Tailoring-Future

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

**Important**: Never commit your `.env` file to version control!

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Z` | Undo last action |
| `Ctrl/Cmd + Y` or `Ctrl/Cmd + Shift + Z` | Redo action |
| `Ctrl/Cmd + S` | Save current look |
| `←` (Left Arrow) | Previous pose |
| `→` (Right Arrow) | Next pose |

## User Guide

### 1. Upload Your Photo
- Click "Launch Studio" and select a high-quality portrait
- Best results with neutral backgrounds and good lighting
- Supported formats: JPG, PNG, WebP (max 10MB)

### 2. Review Your Model
- View the AI-generated fashion model version of your photo
- Use the before/after slider to compare
- Click "Enter Studio" to proceed or "Discard" to try another photo

### 3. Try On Garments
- Browse the studio wardrobe in the right sidebar
- Click any garment to virtually try it on
- Upload your own garments using the "Import" button
- Layer multiple garments to create complete outfits

### 4. Change Poses
- Hover over the canvas to reveal the pose navigation bar
- Use arrow keys or click the pose buttons
- Available poses: Frontal, 3/4 view, Side profile, Jumping, Walking, Leaning

### 5. Customize Colors
- Hover over any garment in your outfit stack
- Click the rotate icon to recolor
- AI generates new color variations while preserving texture

### 6. Get Style Feedback
- Click "Generate Score" in the outfit stack
- Receive a professional fashion critique (1-100 score)
- Get actionable feedback from an AI fashion director

### 7. Save & Restore
- Click "Archive Look" to save your current outfit
- Use "Restore" to load your saved session
- Use Undo/Redo to navigate through your styling history

## Project Structure

```
Tailoring-Future/
├── components/          # React components
│   ├── StartScreen.tsx  # Photo upload and model generation
│   ├── Canvas.tsx       # Main display canvas with controls
│   ├── WardrobeModal.tsx  # Garment selection interface
│   ├── OutfitStack.tsx  # Outfit layer management
│   ├── Footer.tsx       # App footer with tips
│   └── ui/              # Reusable UI components
├── services/            # API services
│   └── geminiService.ts # Gemini AI integration
├── lib/                 # Utility functions
│   └── utils.ts         # Validation, compression, error handling
├── types.ts             # TypeScript type definitions
├── wardrobe.ts          # Default wardrobe items
├── App.tsx              # Main application logic
└── index.tsx            # Application entry point
```

## API Integration

This app uses Google's Gemini AI models:

- **gemini-2.5-flash-image**: For image generation (model transformation, try-on, poses, recoloring)
- **gemini-2.0-flash-exp**: For style analysis and scoring

### Rate Limits & Costs

- Free tier: Generous limits for development
- Automatic retry logic handles temporary failures
- Image compression reduces API payload sizes
- Consider implementing a backend proxy for production to protect API keys

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add `GEMINI_API_KEY` environment variable in project settings
4. Deploy!

Vercel configuration is pre-configured in `vercel.json`.

### Deploy to Other Platforms

The app is a standard Vite + React SPA and can be deployed to:
- Netlify
- GitHub Pages
- Firebase Hosting
- Any static hosting service

Just run `npm run build` and deploy the `dist` folder.

## Troubleshooting

### API Key Issues
```
Error: "Studio authentication failed"
```
- Verify your `GEMINI_API_KEY` in `.env` is correct
- Ensure `.env` file is in the project root
- Restart the development server after adding the key

### Image Upload Fails
```
Error: "File size exceeds 10MB limit"
```
- Compress your image before uploading
- Use JPG format for smaller file sizes
- The app automatically compresses images, but very large files may be rejected

### Safety Filters Triggered
```
Error: "AI safety filters flagged this image"
```
- Use professional, well-lit portraits
- Avoid inappropriate content
- Try a different photo with a neutral background

### Build Errors
```
Error during build
```
- Clear `node_modules`: `rm -rf node_modules && npm install`
- Clear cache: `rm -rf dist .cache`
- Ensure Node.js version is 16 or higher

## Browser Support

- Chrome/Edge (recommended): Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 14+, Chrome Mobile

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Apache-2.0 License - See LICENSE file for details

## Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review the Gemini AI documentation

## Acknowledgments

- Built with [Google Gemini AI](https://deepmind.google/technologies/gemini/)
- UI powered by [React](https://react.dev/) and [Framer Motion](https://www.framer.com/motion/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

**Made with ❤️ by Gregorious Creative Studios**
