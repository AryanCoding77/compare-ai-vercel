# Deploying to Vercel

This guide will help you deploy your application to Vercel.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. The [Vercel CLI](https://vercel.com/docs/cli) installed (optional, but recommended)

## Environment Variables

You need to set up the following environment variables in your Vercel project:

- `DATABASE_URL`: Your Neon database connection string
- `SESSION_SECRET`: A secure random string for session encryption
- `FACEPP_API_KEY`: Your Face++ API key
- `FACEPP_API_SECRET`: Your Face++ API secret
- `NODE_ENV`: Set to "production"
- `VERCEL`: Set to "1" to enable Vercel-specific code paths

## Deployment Steps

### Option 1: Using the Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Log in to your Vercel account
3. Click "New Project"
4. Import your repository
5. Configure the project:
   - Set the Framework Preset to "Other"
   - Set the Build Command to `npm run vercel-build`
   - Set the Output Directory to `dist`
6. Add all the environment variables listed above
7. Click "Deploy"

### Option 2: Using the Vercel CLI

1. Install the Vercel CLI: `npm i -g vercel`
2. Log in to Vercel: `vercel login`
3. Run the deployment command: `vercel`
4. Follow the prompts to configure your project
5. Set up environment variables:
   ```
   vercel env add DATABASE_URL
   vercel env add SESSION_SECRET
   vercel env add FACEPP_API_KEY
   vercel env add FACEPP_API_SECRET
   vercel env add NODE_ENV production
   vercel env add VERCEL 1
   ```
6. Deploy to production: `vercel --prod`

## WebSocket Limitations

Vercel doesn't support WebSockets in serverless functions. The application has been configured to automatically fall back to polling when deployed to Vercel.

## Database Migrations

The deployment process includes running database migrations automatically. If you need to run migrations manually, you can use:

```
vercel env pull .env.production.local
npm run db:push
```

## Troubleshooting

If you encounter issues with your deployment:

1. Check the Vercel deployment logs
2. Ensure all environment variables are set correctly
3. Verify that your database is accessible from Vercel's servers
4. Check that your database migrations ran successfully

For more help, refer to the [Vercel documentation](https://vercel.com/docs) or contact Vercel support.
