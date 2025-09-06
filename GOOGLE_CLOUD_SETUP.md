# Google Cloud Vision Setup

This application now uses Google Cloud Vision API for OCR processing instead of Tesseract.js. Here's how to set it up:

## Prerequisites

1. A Google Cloud Platform account
2. A Google Cloud project with the Vision API enabled

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your Project ID

### 2. Enable the Vision API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Cloud Vision API"
3. Click on it and enable the API

### 3. Create Service Account Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Give it a name (e.g., "timetable-manager")
4. Assign the "Cloud Vision API User" role
5. Click "Create Key" > "JSON"
6. Download the JSON key file

### 4. Configure Environment Variables

Add these to your `.env` file:

```bash
# Google Cloud Vision API Configuration
GOOGLE_APPLICATION_CREDENTIALS="path/to/your/service-account-key.json"
GOOGLE_CLOUD_PROJECT_ID="your-google-cloud-project-id"
```

### 5. Alternative: Application Default Credentials

If you're running on Google Cloud Platform (App Engine, Cloud Run, etc.), you can use Application Default Credentials instead:

1. Install the Google Cloud CLI
2. Run: `gcloud auth application-default login`
3. Omit the environment variables above

## How It Works

1. **Image Processing**: When an image is uploaded, the system first tries Google Cloud Vision OCR
2. **Fallback**: If Google Cloud Vision fails or credentials are not configured, it falls back to the RAG system
3. **PDF Processing**: PDFs are processed using the RAG system (text extraction + LLM)
4. **RAG System**: Uses OpenAI's vision models for image processing as a fallback

## Benefits of Google Cloud Vision

- **Higher Accuracy**: Better text recognition than Tesseract.js
- **Better Performance**: Faster processing times
- **Cloud-based**: No local dependencies or worker threads
- **Scalable**: Handles large images and complex layouts better
- **Reliable**: Enterprise-grade service with high uptime

## Cost Considerations

Google Cloud Vision API charges per image processed:

- First 1,000 images per month: Free
- Additional images: $1.50 per 1,000 images

This is very cost-effective for most use cases.

## Troubleshooting

### Common Issues

1. **"Google Cloud credentials not configured"**

   - Make sure `GOOGLE_APPLICATION_CREDENTIALS` points to a valid JSON file
   - Ensure the service account has the correct permissions

2. **"Project not found"**

   - Verify `GOOGLE_CLOUD_PROJECT_ID` is correct
   - Make sure the project exists and Vision API is enabled

3. **"Permission denied"**
   - Check that the service account has "Cloud Vision API User" role
   - Verify the JSON key file is valid and not expired

### Fallback Behavior

If Google Cloud Vision is not configured or fails, the system will:

1. Try the RAG system (for images and PDFs)
2. Use OpenAI's vision models as a final fallback
3. Return standard timetable blocks if all else fails

This ensures the application continues to work even without Google Cloud Vision setup.
