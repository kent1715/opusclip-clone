---
Task ID: 1
Agent: Main Agent
Task: Fix clip results to match the provided video link

Work Log:
- Analyzed the core issue: AI was generating generic clips unrelated to the video URL
- Added YouTube oEmbed API to fetch actual video title, thumbnail, and author name
- Added Vimeo oEmbed API support
- Added platform detection (YouTube, TikTok, Vimeo, Instagram)
- Used Web-Reader (page_reader) to extract video page content
- Fed actual video metadata to LLM for relevant clip suggestions
- Fixed HeroSection clip type mismatch (tags: string vs string[], captions: boolean vs string|null)
- Fixed ClipEditorSection to pass userId for auth fallback
- Added userId query param support to /api/clips endpoint
- Improved fallback clip generator with content-type detection (music, tutorial, vlog, review, comedy)
- Removed standalone output from next.config for better EC2 compatibility
- Fixed EC2 database path issues by creating symlink and updating .env
- Rebuilt and deployed on EC2 with PM2 ecosystem config

Stage Summary:
- YouTube oEmbed returns correct video title and thumbnail
- Clips now reference the actual video title and author
- Genre detection (music, tutorial, vlog, etc.) creates appropriate clip templates
- EC2 deployment working with correct database path
- Video: Rick Astley test shows specific clips like "The Chorus That Everyone Knows" instead of generic titles
