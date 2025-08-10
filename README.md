# Linear Webhook to GitHub Dispatch

A Vercel serverless function that receives Linear webhooks and triggers GitHub repository_dispatch events.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env.local`
   - Fill in your GitHub configuration:
     - `GH_OWNER`: Your GitHub username or organization
     - `GH_REPO`: The repository name to dispatch events to
     - `GH_TOKEN`: GitHub Personal Access Token or App token with `repo` scope

3. **Deploy to Vercel:**
   ```bash
   vercel
   ```

4. **Configure Linear webhook:**
   - Go to your Linear workspace settings
   - Add a new webhook pointing to: `https://your-vercel-domain.vercel.app/api/webhook`
   - Select "Issues" events

## How it works

1. Linear sends a webhook when issues are created/updated
2. This function validates the request and extracts issue details
3. It triggers a GitHub `repository_dispatch` event with type `linear_issue_created`
4. Your GitHub Actions can listen for this event and take automated actions

## Environment Variables

Set these in your Vercel project settings:

- `GH_OWNER`: GitHub username/organization
- `GH_REPO`: Repository name
- `GH_TOKEN`: GitHub token with repo access

## GitHub Action Example

Create `.github/workflows/linear-webhook.yml` in your target repository:

```yaml
name: Handle Linear Issue Created
on:
  repository_dispatch:
    types: [linear_issue_created]

jobs:
  handle-issue:
    runs-on: ubuntu-latest
    steps:
      - name: Process Linear Issue
        run: |
          echo "Issue ID: ${{ github.event.client_payload.issueId }}"
          echo "Issue Title: ${{ github.event.client_payload.issueTitle }}"
          echo "Issue URL: ${{ github.event.client_payload.issueUrl }}"
          # Add your automation logic here
```

## Development

Run locally with:
```bash
npm run dev
```

The function will be available at `http://localhost:3000/api/webhook`
