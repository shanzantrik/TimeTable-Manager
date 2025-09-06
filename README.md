# Timetable Manager - AI-Powered Schedule Extraction

**Developed by Shantanu Goswami**

A cutting-edge Next.js application that revolutionizes timetable management through hybrid AI processing, combining Tesseract OCR, RAG (Retrieval-Augmented Generation), and multi-LLM intelligence to extract, organize, and display schedules with unprecedented accuracy.

## 🌟 Features

- 📁 **Multi-format Support**: Upload images, PDFs, and Word documents
- 🤖 **Hybrid AI Processing**: Tesseract OCR + RAG + Multi-LLM Intelligence
- 🧠 **Smart Extraction**: Claude 3.5 Sonnet & Google Gemini for accurate data extraction
- 🔍 **Keyword-Based Selective Search**: RAG system for intelligent PDF processing
- 🎨 **Beautiful UI**: Modern, responsive design with dark/light mode support
- 📊 **Interactive Timetable Grid**: Drag-and-drop weekly schedule display
- 🔄 **Real-time Processing**: Instant file upload and processing
- 💾 **Data Persistence**: SQLite database with Prisma ORM
- 📱 **Super Responsive**: Optimized for all devices from mobile to desktop
- 🌙 **Dark Mode**: Toggle between light and dark themes

## 🏗️ Architecture Overview

### Hybrid AI Processing Pipeline

The application employs a sophisticated multi-stage processing pipeline that adapts based on file type:

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│   Upload    │───▶│ Tesseract OCR│───▶│ RAG System  │───▶│ AI Intelligence│
│  (Images)   │    │  (Images)    │    │   (PDFs)    │    │ Claude+Gemini │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
                                                              │
                                                              ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│  Database   │◀───│   Display    │◀───│ Management  │◀───│  Structured  │
│  Storage    │    │ Interactive  │    │   Tools     │    │    Data      │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
```

### Core Components

#### 1. **File Processing Engine**

- **Tesseract OCR**: Extracts text from images with high accuracy
- **RAG System**: Direct PDF processing using keyword-based selective search
- **Text Extraction**: Handles multiple file formats intelligently

#### 2. **AI Intelligence Layer**

- **Claude 3.5 Sonnet**: Primary LLM for complex timetable extraction
- **Google Gemini 1.5 Flash**: Secondary LLM for enhanced accuracy
- **Multi-Provider Fallback**: Ensures processing reliability

#### 3. **RAG (Retrieval-Augmented Generation) System**

- **Knowledge Base**: Pre-trained on educational timetable patterns
- **Keyword Extraction**: Identifies subjects, activities, and time patterns
- **Semantic Search**: Matches extracted text with relevant timetable structures
- **Context Enhancement**: Provides additional context for better extraction

#### 4. **Data Processing Pipeline**

- **JSON Parsing**: Robust handling of varied LLM response formats
- **Data Validation**: Ensures extracted data meets quality standards
- **Structure Normalization**: Converts different formats to unified structure
- **Error Handling**: Graceful fallbacks for processing failures

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with responsive design
- **UI Components**: Lucide React icons
- **State Management**: React hooks (useState, useEffect)
- **Drag & Drop**: @dnd-kit for interactive timetable editing

### Backend

- **API**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **File Processing**: pdf-parse, Tesseract.js
- **AI Integration**: Anthropic Claude, Google Gemini

### AI/ML Stack

- **OCR**: Tesseract.js for image text extraction
- **LLMs**: Claude 3.5 Sonnet, Google Gemini 1.5 Flash
- **RAG**: Custom keyword-based selective search system
- **Processing**: Hybrid approach combining OCR and direct text extraction

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- AI API keys (Claude and/or Google Gemini)

### Installation

1. **Clone the repository:**

```bash
git clone <repository-url>
cd timetable-manager
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables:**

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
DATABASE_URL="file:./dev.db"

# AI Provider API Keys (at least one required)
ANTHROPIC_API_KEY="your-anthropic-api-key-here"
GOOGLE_API_KEY="your-google-api-key-here"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

**⚠️ Important:** You need at least one valid AI API key for extraction to work. The system will try providers in this order:

1. **Anthropic Claude** (primary) - Get from [Anthropic Console](https://console.anthropic.com/)
2. **Google Gemini** (fallback) - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

3. **Set up the database:**

```bash
npx prisma generate
npx prisma db push
```

5. **Start the development server:**

```bash
npm run dev
```

6. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

## 📖 Usage Guide

### Uploading a Timetable

1. **Upload File**: Drag and drop or click to upload your timetable file
2. **Add Details**: Enter a title and optional description
3. **Process**: Click "Upload & Process" to extract timetable data
4. **View Results**: See your timetable displayed in a beautiful grid format

### Supported File Types

- **Images**: JPEG, PNG, JPG (processed with Tesseract OCR)
- **PDFs**: Direct processing with RAG system
- **Documents**: DOCX (converted to text for AI processing)

### Timetable Display

The extracted timetable is displayed as an interactive grid showing:

- **Weekly View**: Monday through Sunday columns
- **Time Slots**: Hourly time slots from 6 AM to 6 PM
- **Activities**: Color-coded blocks for each activity
- **Details**: Start/end times, descriptions, and durations
- **Drag & Drop**: Reorder activities by dragging blocks
- **Responsive Design**: Optimized for all screen sizes

## 🔧 API Endpoints

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

### Update Timeblock

```
PUT /api/timeblocks/[id]
Content-Type: application/json

Body: { title, description, startTime, endTime, dayOfWeek, duration, color }
Response: { success: boolean, timeblock: TimeBlock }
```

### Delete Timeblock

```
DELETE /api/timeblocks/[id]
Response: { success: boolean }
```

## 🗄️ Database Schema

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

## 🧠 AI Processing Pipeline

### 1. File Upload & Type Detection

- File is saved to disk and metadata stored in database
- MIME type detection determines processing path

### 2. Text Extraction (Adaptive)

- **Images**: Tesseract OCR extracts text with high accuracy
- **PDFs**: RAG system processes directly using keyword-based search
- **Word docs**: Text extraction for AI processing

### 3. RAG System (PDF Processing)

- **Knowledge Base**: Pre-trained on educational timetable patterns
- **Keyword Extraction**: Identifies subjects, activities, time patterns
- **Semantic Search**: Matches extracted text with relevant structures
- **Context Enhancement**: Provides additional context for better extraction

### 4. AI Analysis (Multi-Provider)

- **Claude 3.5 Sonnet**: Primary LLM for complex extraction
- **Google Gemini 1.5 Flash**: Secondary LLM for enhanced accuracy
- **Fallback System**: Ensures processing reliability

### 5. Data Processing & Validation

- **JSON Parsing**: Robust handling of varied LLM response formats
- **Structure Normalization**: Converts different formats to unified structure
- **Quality Validation**: Ensures extracted data meets standards

### 6. Storage & Display

- Processed data is saved to database
- Timetable is rendered in interactive grid
- Real-time editing and management capabilities

## 🎨 UI/UX Features

### Responsive Design

- **Mobile First**: Optimized for small screens
- **Progressive Enhancement**: Better experience on larger screens
- **Flexible Layouts**: Content adapts smoothly across all device sizes

### Dark/Light Mode

- **Toggle Button**: Easy switching between themes
- **Smooth Transitions**: Animated theme changes
- **Consistent Styling**: All components support both modes

### Interactive Elements

- **Drag & Drop**: Reorder timetable activities
- **Real-time Editing**: Edit activities directly in the grid
- **Visual Feedback**: Hover effects and animations
- **Touch-Friendly**: Optimized for mobile interactions

## 🔧 Customization

### Adding New File Types

Extend the processing logic in `src/lib/hybrid-processor.ts`:

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

## 🚀 Deployment

### Railway (Recommended)

1. Connect your GitHub repository to Railway
2. Add environment variables in Railway dashboard
3. Deploy automatically on push

### Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

1. Build the application: `npm run build`
2. Start production server: `npm start`
3. Set up your database and environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email shaanjyot13@gmail.com or create an issue in the repository.

## 🙏 Acknowledgments

- **Tesseract.js** for OCR capabilities
- **Anthropic** for Claude AI
- **Google** for Gemini AI
- **Next.js** team for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework

---

**Built with ❤️ by Shantanu Goswami**

_Revolutionizing timetable management through hybrid AI processing and modern web technologies._
