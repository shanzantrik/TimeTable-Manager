# 📚 Timetable Manager - AI-Powered Teacher Schedule Management

A comprehensive Next.js application that enables teachers to upload, process, and visualize weekly class timetables using advanced AI technologies including OCR, LLM processing, and modern web technologies.

## 🌟 Features

### 🚀 Core Functionality

- **Multi-Format Upload**: Support for images (JPG, PNG, JPEG), PDFs, and Word documents
- **AI-Powered Extraction**: Hybrid OCR + LLM processing for accurate timetable data extraction
- **Interactive Timetable Display**: Beautiful, responsive timetable grid with drag-and-drop functionality
- **Real-time Editing**: Add, edit, and delete timetable blocks with instant UI updates
- **Full-screen Mode**: Immersive timetable viewing experience
- **Database Persistence**: SQLite database with Prisma ORM for reliable data storage

### 🤖 AI Processing Pipeline

- **Tesseract.js OCR**: Advanced optical character recognition for image processing
- **Multi-LLM Support**: OpenAI GPT-4, Anthropic Claude, and Google Gemini integration
- **Intelligent Fallback**: Automatic fallback between different AI providers
- **Smart Block Detection**: Automatic recognition of standard school blocks (Registration, Break, Lunch, etc.)
- **Conditional Block Generation**: Only adds standard blocks if they don't exist in the source

### 🎨 User Interface

- **Modern Design**: Clean, professional interface with Tailwind CSS
- **Responsive Layout**: Optimized for desktop and mobile devices
- **Drag & Drop**: Intuitive reordering of timetable blocks
- **Modal Dialogs**: Detailed view and editing of timetable entries
- **Real-time Feedback**: Processing logs and status updates
- **Scrollable Interface**: Hidden scrollbars for clean appearance

## 🏗️ Project Structure

```
timetable-manager/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── process/route.ts          # File processing endpoint
│   │   │   ├── timetables/route.ts       # Timetable CRUD operations
│   │   │   └── timetables/[id]/route.ts  # Individual timetable operations
│   │   ├── globals.css                   # Global styles
│   │   ├── layout.tsx                    # Root layout component
│   │   └── page.tsx                      # Main application page
│   ├── components/
│   │   ├── FileUpload.tsx                # File upload component
│   │   ├── TimetableGrid.tsx             # Main timetable display
│   │   ├── TimetableList.tsx             # Timetable selection list
│   │   └── WorkflowSection.tsx           # Animated workflow display
│   ├── lib/
│   │   ├── hybrid-processor.ts           # AI processing pipeline
│   │   ├── timetable-processor.ts        # File processing logic
│   │   └── prisma.ts                     # Database connection
│   └── prisma/
│       ├── schema.prisma                 # Database schema
│       └── migrations/                   # Database migrations
├── uploads/                              # Uploaded files storage
├── .env.example                          # Environment variables template
├── package.json                          # Dependencies and scripts
└── README.md                             # This file
```

## 🔧 Technology Stack

### Frontend

- **Next.js 15.5.2** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Modern icon library
- **@dnd-kit** - Drag and drop functionality

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Database object-relational mapping
- **SQLite** - Lightweight database
- **Multer** - File upload handling

### AI & Processing

- **Tesseract.js** - OCR (Optical Character Recognition)
- **OpenAI GPT-4** - Large Language Model processing
- **Anthropic Claude** - Alternative LLM provider
- **Google Gemini** - Additional LLM fallback
- **pdf-parse** - PDF text extraction
- **mammoth** - Word document processing

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- API keys for AI providers (optional)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd timetable-manager
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:

   ```env
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   GOOGLE_API_KEY=your_google_key
   ```

4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📋 Usage Guide

### Uploading Timetables

1. **Select File**: Click "Choose File" and select your timetable document
2. **Supported Formats**: Images (JPG, PNG, JPEG), PDFs, Word documents
3. **Processing**: Watch the real-time processing log as AI extracts data
4. **Review**: Check the extracted timetable blocks for accuracy

### Managing Timetables

1. **View All**: See all uploaded timetables in the "Your Timetables" section
2. **Select Timetable**: Click on a timetable to view and edit
3. **Add Blocks**: Use the "Add Activity" button to create new time blocks
4. **Edit Blocks**: Click on existing blocks to modify details
5. **Delete Blocks**: Remove unwanted blocks with the delete button
6. **Reorder**: Drag and drop blocks to rearrange the schedule

### Timetable Features

- **Full-screen Mode**: Click the maximize button for immersive viewing
- **Responsive Design**: Works on desktop and mobile devices
- **Color Coding**: Automatic color assignment for different subjects
- **Time Management**: Precise start/end times and duration tracking
- **Day Organization**: Monday through Friday schedule management

## 🔄 AI Processing Flow

### 1. File Upload & Validation

- File type detection and validation
- Secure file storage in uploads directory
- MIME type verification

### 2. Content Extraction

- **Images**: Tesseract.js OCR → Structured data → LLM processing
- **PDFs**: pdf-parse text extraction → LLM processing
- **Word Docs**: mammoth text extraction → LLM processing

### 3. AI Processing Pipeline

```
Raw Content → OCR/Text Extraction → Structured Data → LLM Processing → Timetable Blocks
```

### 4. LLM Processing (Multi-Provider)

1. **OpenAI GPT-4** (Primary)
2. **Anthropic Claude** (Fallback)
3. **Google Gemini** (Final Fallback)

### 5. Data Enhancement

- Standard block detection (Registration, Break, Lunch, etc.)
- Color assignment for visual organization
- Time validation and formatting
- Database storage with Prisma

## 🎯 Key Components

### FileUpload Component

- Handles file selection and upload
- Displays processing status and logs
- Manages upload progress and errors

### TimetableGrid Component

- Main timetable display interface
- Drag and drop functionality
- CRUD operations for time blocks
- Full-screen mode support

### TimetableList Component

- Displays all uploaded timetables
- Timetable selection and deletion
- Refresh functionality

### HybridTimetableProcessor

- Core AI processing engine
- Multi-LLM fallback system
- OCR and text extraction coordination
- Intelligent block generation

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open database GUI

### Database Management

- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes
- `npx prisma migrate dev` - Create migration

### Environment Variables

- `OPENAI_API_KEY` - OpenAI API key for GPT processing
- `ANTHROPIC_API_KEY` - Anthropic API key for Claude
- `GOOGLE_API_KEY` - Google API key for Gemini
- `DATABASE_URL` - SQLite database connection string

## 🐛 Troubleshooting

### Common Issues

1. **PDF Processing Errors**: Ensure pdf-parse is properly installed
2. **OCR Failures**: Check Tesseract.js installation and file permissions
3. **LLM Quota Exceeded**: Verify API keys and billing status
4. **Database Errors**: Run `npx prisma generate` and `npx prisma db push`

### Error Handling

- Comprehensive error logging throughout the application
- Graceful fallbacks for all AI processing steps
- User-friendly error messages in the UI
- Automatic retry mechanisms for failed operations

## 📈 Performance Optimizations

- **Lazy Loading**: Dynamic imports for heavy libraries
- **Caching**: Efficient data caching and state management
- **Optimized Images**: Responsive image handling
- **Database Indexing**: Optimized database queries
- **Error Boundaries**: Graceful error handling

## 🔒 Security Features

- **File Validation**: MIME type and file extension verification
- **Secure Uploads**: Controlled file upload directory
- **Input Sanitization**: All user inputs are sanitized
- **API Rate Limiting**: Built-in rate limiting for API endpoints

## 🚀 Deployment

### Production Build

```bash
npm run build
npm run start
```

### Environment Setup

1. Set production environment variables
2. Configure database connection
3. Set up file storage
4. Configure AI API keys

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:

- Create an issue in the repository
- Check the troubleshooting section
- Review the documentation

---

**Built with ❤️ for teachers and educators worldwide by Shantanu Goswami**
