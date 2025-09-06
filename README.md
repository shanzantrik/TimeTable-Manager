# Timetable Manager - AI-Powered Schedule Extraction

A modern Next.js application that allows teachers to upload their timetable documents and automatically extract, organize, and display their schedules using AI technology.

## Features

- 📁 **Multi-format Support**: Upload images, PDFs, and Word documents
- 🤖 **AI-Powered Extraction**: Uses OpenAI GPT-4 to intelligently extract timetable data
- 🎨 **Beautiful UI**: Modern, responsive design with Tailwind CSS
- 📊 **Visual Timetable Grid**: Interactive weekly schedule display
- 🔄 **Real-time Processing**: Instant file upload and processing
- 💾 **Data Persistence**: SQLite database with Prisma ORM
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite
- **AI/ML**: OpenAI GPT-4, OpenAI Vision API
- **File Processing**: pdf-parse, mammoth, sharp
- **UI Components**: Lucide React, Radix UI

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd timetable-manager
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```env
DATABASE_URL="file:./dev.db"

# AI Provider API Keys (at least one required)
OPENAI_API_KEY="your-openai-api-key-here"

# Alternative providers (optional - will fallback if OpenAI fails)
ANTHROPIC_API_KEY="your-anthropic-api-key-here"
GOOGLE_API_KEY="your-google-api-key-here"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

**⚠️ Important:** You need at least one valid AI API key for extraction to work. The system will try providers in this order:

1. **OpenAI** (primary) - Get from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Anthropic Claude** (fallback) - Get from [Anthropic Console](https://console.anthropic.com/)
3. **Google Gemini** (fallback) - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

4. Set up the database:

```bash
npx prisma generate
npx prisma db push
```

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Uploading a Timetable

1. **Upload File**: Drag and drop or click to upload your timetable file
2. **Add Details**: Enter a title and optional description
3. **Process**: Click "Upload & Process" to extract timetable data
4. **View Results**: See your timetable displayed in a beautiful grid format

### Supported File Types

- **Images**: JPEG, PNG, JPG
- **Documents**: PDF, DOCX
- **Formats**: Scanned images, typed documents, handwritten notes

### Timetable Display

The extracted timetable is displayed as an interactive grid showing:

- **Weekly View**: Monday through Sunday columns
- **Time Slots**: Hourly time slots from 6 AM to 6 PM
- **Activities**: Color-coded blocks for each activity
- **Details**: Start/end times, descriptions, and durations

## API Endpoints

### File Upload

```
POST /api/upload
Content-Type: multipart/form-data

Body: file (image, PDF, or DOCX)
Response: { success: boolean, fileId: string, filename: string }
```

### Process Timetable

```
POST /api/process
Content-Type: application/json

Body: { fileId: string, title: string, description?: string }
Response: { success: boolean, timetable: Timetable }
```

### Get Timetables

```
GET /api/timetables?teacherId=optional
Response: { success: boolean, timetables: Timetable[] }
```

### Get Single Timetable

```
GET /api/timetables/[id]
Response: { success: boolean, timetable: Timetable }
```

## Database Schema

### Teachers

- `id`: Unique identifier
- `name`: Teacher's name
- `email`: Teacher's email
- `createdAt`, `updatedAt`: Timestamps

### Timetables

- `id`: Unique identifier
- `title`: Timetable title
- `description`: Optional description
- `teacherId`: Reference to teacher
- `createdAt`, `updatedAt`: Timestamps

### TimeBlocks

- `id`: Unique identifier
- `title`: Activity name
- `description`: Optional description
- `startTime`: Start time (HH:MM format)
- `endTime`: End time (HH:MM format)
- `dayOfWeek`: Day of the week
- `duration`: Duration in minutes
- `color`: Hex color code for display
- `timetableId`: Reference to timetable

## AI Processing Pipeline

1. **File Upload**: File is saved to disk and metadata stored in database
2. **Text Extraction**:
   - PDFs: Uses pdf-parse
   - Images: Uses OpenAI Vision API
   - Word docs: Uses mammoth
3. **AI Analysis**: Multi-provider LLM system tries providers in order:
   - **OpenAI GPT-4** (primary)
   - **Anthropic Claude** (fallback)
   - **Google Gemini** (fallback)
4. **Data Storage**: Processed data is saved to database
5. **UI Display**: Timetable is rendered in interactive grid

## Customization

### Adding New File Types

Extend the `processTimetableFile` function in `src/lib/timetable-processor.ts`:

```typescript
// Add new file type handling
if (mimeType === "application/your-type") {
  // Your processing logic
}
```

### Customizing AI Prompts

Modify the prompt in `extractTimetableWithAI` function:

```typescript
const prompt = `
  Your custom prompt here...
  ${text}
`;
```

### Styling

The app uses Tailwind CSS with custom design tokens. Modify `tailwind.config.js` and `src/app/globals.css` for custom styling.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

1. Build the application: `npm run build`
2. Start production server: `npm start`
3. Set up your database and environment variables

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@timetablemanager.com or create an issue in the repository.

---

Built with ❤️ using Next.js, OpenAI, and modern web technologies.
