# Move Video File Instructions

Your video file `corporate.mp4` is currently in `src/pages/` but it needs to be in the `public` folder for Next.js to serve it properly.

## Quick Fix:

1. **Copy the video file** from:
   ```
   src/pages/corporate.mp4
   ```
   
   To:
   ```
   public/videos/hero-video.mp4
   ```

2. The code is already updated to use `/videos/hero-video.mp4`

## Manual Steps:

1. Navigate to: `Degree2Destiny/src/pages/`
2. Copy `corporate.mp4`
3. Navigate to: `Degree2Destiny/public/videos/`
4. Paste and rename it to `hero-video.mp4`

Or use this PowerShell command (run from project root):
```powershell
Copy-Item "src\pages\corporate.mp4" "public\videos\hero-video.mp4" -Force
```

After moving the file, restart your dev server to see the video in the hero section!
