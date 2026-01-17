# Instruction PDF Generator - English Only

A web application that analyzes images using ChatGPT and generates instruction PDFs.

## Features

✅ **Image Upload**: Upload 1-4 images (PNG/JPG, max 10MB each)
✅ **AI Analysis**: ChatGPT analyzes images and auto-fills 15 dropdown fields
✅ **Manual Editing**: Edit all analyzed fields via dropdown menus
✅ **PDF Export**: Generate clean English PDFs with images and field data

## Analyzed Fields (15 total)

ChatGPT automatically analyzes and fills these fields:

1. **Purpose** - SNS Post, YouTube Thumbnail, Ad Banner, etc.
2. **Subject** - Human, Animal, Food, Building, etc.
3. **Situation** - Standing, Sitting, Working, etc.
4. **Age Range** - Newborn, Young adult, Senior, etc.
5. **Gender** - Male, Female, Non-binary, Unknown
6. **Nationality** - Japan, USA, France, etc.
7. **Style** - Realistic, Cinematic, Anime, etc.
8. **Shot Distance** - Close-up, Full shot, Long shot, etc.
9. **Camera Angle** - Eye-level, Low angle, Top view, etc.
10. **Lighting/Color** - Natural light, Dramatic lighting, etc.
11. **Background** - Studio, Park, Street, etc.
12. **City** - Tokyo, New York, Paris, etc.
13. **Location Type** - Downtown, Park, Airport, etc.
14. **Output Format** - PNG, JPG
15. **Aspect Ratio** - 1:1, 16:9, 9:16, etc.

**Additional Words** - Manual text input (not analyzed by AI)

## How to Use

1. **Upload Images**: Click or drag-and-drop 1-4 images
2. **Analyze**: Click "Analyze Images" button
3. **Review**: Check the auto-filled dropdowns and edit if needed
4. **Add Notes**: Type any additional instructions in the text area
5. **Export**: Click "Download PDF" to generate the instruction PDF

## PDF Output

The generated PDF includes:
- Title: "Instruction PDF"
- Images: All uploaded images displayed
- Details: Table with field names and values (all in English)

## Technical Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase Edge Functions (Hono)
- **AI**: OpenAI GPT-4o-mini with Vision
- **PDF**: jsPDF library

## Data Storage

All dropdown values are stored in **English** only. The system uses:
- English values in data storage
- English display in UI
- English output in PDF

## Notes

- Maximum 4 images per upload
- File size limit: 10MB per image
- Supported formats: PNG, JPG
- ChatGPT uses low-detail mode for faster processing
- Additional Words field is manual input only (not AI-analyzed)
