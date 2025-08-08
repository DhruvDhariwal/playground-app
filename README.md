# AI Playground

A light, dependable playground app that allows authenticated users to try three AI skills:

- **Conversation Analysis** — Upload audio → STT transcript + speaker diarization (max 2 speakers) → transcript, diarized text, short summary
- **Image Analysis** — Upload image → descriptive text
- **Document/URL Summarization** — Upload PDF/DOCX or submit URL → concise summary

## Features

- 🔐 Authentication with GitHub OAuth and Email magic links
- 🎤 Audio transcription and speaker diarization
- 🖼️ Image analysis and description generation
- 📄 Document and URL summarization
- 🎨 Clean, modern UI with Tailwind CSS
- 📱 Responsive design
- 🚀 Serverless deployment ready

## Tech Stack

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Hook Form** for form handling
- **NextAuth.js** for authentication
- **SWR** for data fetching

### Backend
- **Next.js API Routes** for serverless functions
- **Python FastAPI** worker for audio diarization (separate service)
- **OpenAI API** for STT and LLM processing
- **S3/Cloudflare R2** for file storage

## Quick Start

### Prerequisites

- Node.js 18+ 
- Python 3.11+ (for audio worker)
- ffmpeg (for audio processing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd playground-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in the required environment variables:
   ```env
   # NextAuth
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3000
   
   # GitHub OAuth (optional)
   GITHUB_ID=your-github-client-id
   GITHUB_SECRET=your-github-client-secret
   
   # Email provider (optional)
   EMAIL_SERVER_HOST=smtp.gmail.com
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER=your-email@gmail.com
   EMAIL_SERVER_PASSWORD=your-app-password
   EMAIL_FROM=noreply@yourdomain.com
   
   # OpenAI API
   OPENAI_API_KEY=your-openai-api-key
   
   # Storage (S3 or Cloudflare R2)
   STORAGE_PROVIDER=s3
   S3_BUCKET=your-bucket-name
   S3_REGION=your-region
   S3_ACCESS_KEY=your-access-key
   S3_SECRET=your-secret-key
   
   # Python worker URL
   DIARIZATION_WORKER_URL=http://localhost:8000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
playground-app/
├── src/
│   ├── app/
│   │   ├── api/                    # API routes
│   │   │   ├── auth/               # NextAuth configuration
│   │   │   ├── conversation/       # Audio processing
│   │   │   ├── image/              # Image analysis
│   │   │   ├── doc/                # Document summarization
│   │   │   └── upload/             # File upload handling
│   │   ├── auth/                   # Authentication pages
│   │   └── page.tsx                # Main page
│   ├── components/
│   │   ├── skills/                 # Skill-specific components
│   │   │   ├── conversation-analysis.tsx
│   │   │   ├── image-analysis.tsx
│   │   │   └── document-summarization.tsx
│   │   ├── auth-provider.tsx       # NextAuth provider
│   │   ├── navigation.tsx          # Navigation component
│   │   ├── skill-selector.tsx      # Skill selection UI
│   │   └── upload-area.tsx         # File upload component
│   └── types/
│       └── next-auth.d.ts          # TypeScript declarations
├── public/                         # Static assets
└── README.md
```

## API Endpoints

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth configuration

### File Upload
- `POST /api/upload/s3-signed` - Generate signed URLs for file uploads

### Skills
- `POST /api/conversation/process` - Process audio files for transcription and diarization
- `POST /api/image/analyze` - Analyze images for description and object detection
- `POST /api/doc/summarize` - Summarize documents and URLs

## Deployment

### Frontend (Vercel)

1. **Connect to Vercel**
   - Push your code to GitHub
   - Connect your repository to Vercel
   - Set environment variables in Vercel dashboard

2. **Deploy**
   ```bash
   vercel --prod
   ```

### Python Worker (Render/Railway)

1. **Create worker directory**
   ```bash
   mkdir worker
   cd worker
   ```

2. **Create FastAPI app** (see worker/README.md for details)
3. **Deploy to Render/Railway**
   - Connect your repository
   - Set environment variables
   - Deploy the worker service

## Environment Variables

### Required
- `NEXTAUTH_SECRET` - Secret key for NextAuth
- `NEXTAUTH_URL` - Your app's URL
- `OPENAI_API_KEY` - OpenAI API key

### Optional
- `GITHUB_ID` & `GITHUB_SECRET` - GitHub OAuth credentials
- `EMAIL_*` - Email provider configuration
- `S3_*` - S3 storage configuration
- `DIARIZATION_WORKER_URL` - Python worker URL

## Development

### Running Tests
```bash
npm run test
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, please open an issue on GitHub or contact the development team.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Authentication with [NextAuth.js](https://next-auth.js.org/)
- AI processing with [OpenAI](https://openai.com/)
