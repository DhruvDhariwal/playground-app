# Deployment Guide

This guide will help you deploy the AI Playground application to production.

## Prerequisites

1. **GitHub Account** - for code repository
2. **Vercel Account** - for frontend deployment
3. **Render/Railway Account** - for Python worker deployment
4. **OpenAI API Key** - for AI processing
5. **S3/Cloudflare R2 Account** - for file storage (optional)

## Step 1: Prepare Your Repository

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: AI Playground app"
   git branch -M main
   git remote add origin https://github.com/yourusername/ai-playground.git
   git push -u origin main
   ```

2. **Create Environment Variables**
   - Copy `env.example` to `.env.local`
   - Fill in your actual values

## Step 2: Deploy Frontend to Vercel

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your repository

2. **Configure Environment Variables**
   In Vercel dashboard, add these environment variables:
   ```
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=https://your-vercel-domain.vercel.app
   GITHUB_ID=your-github-client-id
   GITHUB_SECRET=your-github-client-secret
   OPENAI_API_KEY=your-openai-api-key
   STORAGE_PROVIDER=s3
   S3_BUCKET=your-bucket-name
   S3_REGION=your-region
   S3_ACCESS_KEY=your-access-key
   S3_SECRET=your-secret-key
   DIARIZATION_WORKER_URL=https://your-worker-url.onrender.com
   ```

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be available at `https://your-project.vercel.app`

## Step 3: Deploy Python Worker to Render

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Set the following:
     - **Name**: `ai-playground-worker`
     - **Root Directory**: `worker`
     - **Environment**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Add Environment Variables**
   ```
   PYTHON_VERSION=3.11.0
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note the URL (e.g., `https://ai-playground-worker.onrender.com`)

5. **Update Frontend**
   - Go back to Vercel
   - Update `DIARIZATION_WORKER_URL` to your Render worker URL

## Step 4: Configure Authentication

### GitHub OAuth (Recommended)

1. **Create GitHub OAuth App**
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Click "New OAuth App"
   - Fill in:
     - **Application name**: AI Playground
     - **Homepage URL**: `https://your-vercel-domain.vercel.app`
     - **Authorization callback URL**: `https://your-vercel-domain.vercel.app/api/auth/callback/github`

2. **Get Credentials**
   - Copy Client ID and Client Secret
   - Add to Vercel environment variables

### Email Authentication (Optional)

1. **Configure Email Provider**
   - Use Gmail, SendGrid, or similar
   - Add SMTP settings to environment variables

## Step 5: Configure File Storage

### Option A: S3 (Recommended)

1. **Create S3 Bucket**
   - Go to AWS S3 Console
   - Create new bucket
   - Configure CORS:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "POST", "PUT"],
       "AllowedOrigins": ["https://your-vercel-domain.vercel.app"],
       "ExposeHeaders": []
     }
   ]
   ```

2. **Create IAM User**
   - Create user with S3 access
   - Generate access keys
   - Add to environment variables

### Option B: Cloudflare R2

1. **Create R2 Bucket**
   - Go to Cloudflare Dashboard
   - Create R2 bucket
   - Configure permissions

2. **Add Credentials**
   - Generate API tokens
   - Add to environment variables

## Step 6: Test Your Deployment

1. **Test Authentication**
   - Visit your Vercel URL
   - Try signing in with GitHub
   - Verify redirect works

2. **Test File Upload**
   - Try uploading a small audio file
   - Check if it appears in your storage

3. **Test AI Processing**
   - Try conversation analysis with a short audio file
   - Verify worker responds correctly

## Step 7: Monitor and Maintain

### Monitoring

1. **Vercel Analytics**
   - Enable in Vercel dashboard
   - Monitor performance and errors

2. **Render Logs**
   - Check worker logs regularly
   - Monitor for errors

### Maintenance

1. **Regular Updates**
   - Keep dependencies updated
   - Monitor security advisories

2. **Backup**
   - Backup environment variables
   - Document configuration

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check worker CORS configuration
   - Verify allowed origins

2. **Authentication Issues**
   - Verify callback URLs
   - Check environment variables

3. **File Upload Failures**
   - Check storage credentials
   - Verify bucket permissions

4. **Worker Timeouts**
   - Increase timeout settings
   - Optimize processing

### Getting Help

1. **Check Logs**
   - Vercel function logs
   - Render worker logs

2. **Debug Locally**
   - Test with local development
   - Use debugging tools

## Security Considerations

1. **Environment Variables**
   - Never commit secrets
   - Use secure storage

2. **CORS Configuration**
   - Restrict to your domain
   - Avoid wildcards in production

3. **Rate Limiting**
   - Implement rate limits
   - Monitor usage

4. **File Validation**
   - Validate file types
   - Check file sizes

## Cost Optimization

1. **Vercel**
   - Use free tier for development
   - Monitor usage

2. **Render**
   - Use free tier for worker
   - Scale as needed

3. **OpenAI**
   - Monitor API usage
   - Set usage limits

4. **Storage**
   - Clean up old files
   - Use lifecycle policies

## Next Steps

1. **Add Analytics**
   - User behavior tracking
   - Performance monitoring

2. **Implement Caching**
   - Redis for session storage
   - CDN for static assets

3. **Add Testing**
   - Unit tests
   - Integration tests

4. **Scale Up**
   - Multiple workers
   - Load balancing

## Support

For issues and questions:
1. Check the main README.md
2. Review this deployment guide
3. Open an issue on GitHub
4. Contact the development team 