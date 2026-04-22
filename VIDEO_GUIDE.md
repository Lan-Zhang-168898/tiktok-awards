# Video Upload Guide

This guide explains how to add videos to the Media Gallery page for in-site playback.

## Quick Start

### For In-Site Playback (Recommended)

To host videos directly on the site for seamless playback:

1. **Upload Video File**
   - Go to the `videos/` folder in the repository
   - Upload your video file (MP4 format, max 100MB per file)

2. **Update Media Data**
   - Edit `data/media.json`
   - Add a new entry in the `videos` array:

```json
{
  "id": "unique-video-id",
  "title": "Video Title",
  "description": "Brief description",
  "type": "opening",
  "source": "local",
  "url": "videos/your-video-file.mp4",
  "duration": "2mins 30secs",
  "uploadedAt": "2026-01-15"
}
```

3. **Commit Changes**
   - The video will automatically appear in the gallery

### For Feishu Links

If you prefer to link to Feishu videos:

```json
{
  "id": "feishu-video-id",
  "title": "Video Title",
  "description": "Brief description",
  "type": "opening",
  "source": "feishu",
  "url": "https://bytedance.larkoffice.com/file/xxxx",
  "duration": "5mins",
  "uploadedAt": "2026-01-15"
}
```

## Video Configuration Options

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier (use lowercase with hyphens) |
| `title` | Yes | Display title |
| `description` | No | Brief description |
| `type` | Yes | Category: `featured`, `opening`, or `story` |
| `source` | Yes | `local` for in-site, `feishu` for external |
| `url` | Yes | Path to video file or Feishu URL |
| `duration` | No | Display duration (e.g., "2mins 30secs") |
| `badge` | No | Special badge (e.g., "Featured") |
| `uploadedAt` | No | Upload date (YYYY-MM-DD) |

## Video Types

- **`featured`**: Large featured video at the top (only one recommended)
- **`opening`**: Opening videos, regional showcases
- **`story`**: Employee and leader stories

## Best Practices

1. **File Size**: Keep videos under 50MB for optimal loading
2. **Format**: Use MP4 with H.264 codec for best compatibility
3. **Resolution**: 1080p recommended, 720p for smaller files
4. **Naming**: Use descriptive names like `global-selling-2026.mp4`
5. **Compression**: Use HandBrake or similar to compress videos before uploading

## Troubleshooting

### Video won't play?
- Check the URL path is correct
- Ensure the file exists in the `videos/` folder
- Verify the file extension matches (case-sensitive)

### Video loads slowly?
- Consider compressing the video
- Check if the file size is under 100MB

## GitHub Storage Limits

- **Single file**: 100MB max
- **Repository total**: 1GB recommended
- For larger videos, use Feishu links instead
