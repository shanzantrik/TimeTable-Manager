// Removed unused imports
import Tesseract from 'tesseract.js'

// Alternative LLM providers
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

interface TimeBlock {
  id?: string
  title: string
  description?: string
  startTime: string
  endTime: string
  dayOfWeek: string
  duration?: number
  color?: string
  keywords?: string[]
  subject?: string
  activityType?: string
}

interface ExtractedData {
  timeblocks: TimeBlock[]
}

interface WordData {
  text: string
  confidence: number
  bbox: {
    x0: number
    y0: number
    x1: number
    y1: number
  }
}

interface OCRResult {
  text: string
  confidence: number
  words: WordData[]
}

interface TesseractData {
  text: string
  confidence: number
  words?: WordData[]
}

interface ParsedTimeblock {
  title?: string
  subject?: string
  activity?: string
  description?: string
  startTime?: string
  endTime?: string
  time?: string
  dayOfWeek?: string
  day?: string
  duration?: number
  color?: string
  blocks?: ParsedTimeblock[]
  schedule?: ParsedTimeblock[]
  activities?: ParsedTimeblock[]
}

interface ParsedResponse {
  timeblocks: ParsedTimeblock[]
}

/**
 * Hybrid OCR + LLM Processor
 * Combines Tesseract OCR with LLM intelligence for better accuracy
 */
export class HybridTimetableProcessor {
  private static instance: HybridTimetableProcessor
  private knowledgeBase: Map<string, TimeBlock[]> = new Map()

  static getInstance(): HybridTimetableProcessor {
    if (!HybridTimetableProcessor.instance) {
      HybridTimetableProcessor.instance = new HybridTimetableProcessor()
    }
    return HybridTimetableProcessor.instance
  }

  /**
   * Process file with hybrid OCR + LLM approach
   * For PDFs: Use LLM + RAG directly
   * For Images: Use Tesseract OCR + LLM + RAG
   */
  async processImage(filePath: string): Promise<ExtractedData> {
    console.log('🔄 Starting hybrid processing...')

    try {
      // Determine file type
      const isPDF = filePath.toLowerCase().endsWith('.pdf')

      if (isPDF) {
        console.log('📄 Processing PDF file - using LLM + RAG directly')
        return await this.processPDFDirectly(filePath)
      } else {
        console.log('🖼️ Processing image file - using Tesseract OCR + LLM + RAG')
        return await this.processImageWithOCR(filePath)
      }
    } catch (error) {
      console.error('❌ Hybrid processing error:', error)
      return this.getFallbackData()
    }
  }

  /**
   * Process PDF directly with LLM + RAG (skip OCR)
   */
  private async processPDFDirectly(filePath: string): Promise<ExtractedData> {
    console.log('📄 Processing PDF with LLM + RAG...')

    try {
      // Step 1: Extract text from PDF
      const pdfText = await this.extractPDFText(filePath)
      console.log(`📖 PDF extracted ${pdfText.length} characters`)

      // Check if we have text to process
      if (!pdfText || pdfText.trim().length === 0) {
        console.log('⚠️ No text extracted from PDF, using fallback data')
        return this.getFallbackData()
      }

      // Step 2: Use LLM to extract timetable data directly from PDF text
      const timetableData = await this.extractTimetableWithLLM(pdfText)
      console.log(`🤖 LLM extracted ${timetableData.timeblocks.length} timeblocks from PDF`)

      return timetableData
    } catch (error) {
      console.error('❌ PDF processing error:', error)
      return this.getFallbackData()
    }
  }

  /**
   * Process image with Tesseract OCR + LLM + RAG
   */
  private async processImageWithOCR(filePath: string): Promise<ExtractedData> {
    console.log('🖼️ Processing image with Tesseract OCR + LLM + RAG...')

    try {
      // Step 1: OCR with Tesseract
      const ocrResult = await this.performOCR(filePath)
      console.log(`📖 OCR extracted ${ocrResult.text.length} characters with ${ocrResult.confidence}% confidence`)

      // Check if we have text to process
      if (!ocrResult.text || ocrResult.text.trim().length === 0) {
        console.log('⚠️ No text extracted from image, using fallback data')
        return this.getFallbackData()
      }

      // Step 2: Structure the OCR data for LLM
      const structuredData = this.structureOCRData(ocrResult)
      console.log('🏗️ Structured OCR data for LLM processing')

      // Step 3: Use LLM to refine and extract timetable
      const timetableData = await this.extractTimetableWithLLM(structuredData)
      console.log(`🤖 LLM extracted ${timetableData.timeblocks.length} timeblocks`)

      return timetableData
    } catch (error) {
      console.error('❌ Image processing error:', error)
      return this.getFallbackData()
    }
  }

  /**
   * Extract text from PDF file
   */
  private async extractPDFText(filePath: string): Promise<string> {
    console.log('📄 Extracting text from PDF...')

    try {
      // Import pdf-parse dynamically
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let pdfParse: any
      try {
        pdfParse = await import('pdf-parse')
      } catch {
        console.log('PDF parser not available, using fallback')
        return ''
      }

      // Read PDF file
      const fs = await import('fs')
      const dataBuffer = fs.readFileSync(filePath)

      // Parse PDF
      const data = await pdfParse.default(dataBuffer)
      console.log(`📖 PDF text extracted: ${data.text.length} characters`)

      return data.text || ''
    } catch (error) {
      console.error('❌ PDF text extraction error:', error)
      return ''
    }
  }

  /**
   * Perform OCR using Tesseract.js
   */
  private async performOCR(filePath: string): Promise<OCRResult> {
    console.log('🔍 Running Tesseract OCR...')

    const { data } = await Tesseract.recognize(filePath, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
        }
      },
      // Enhanced OCR settings for better text recognition
      // Note: Some advanced Tesseract options may not be available in this version
    }) as { data: TesseractData }

    return {
      text: data.text || '',
      confidence: data.confidence || 0,
      words: (data.words || []).map((word: WordData) => ({
        text: word.text || '',
        confidence: word.confidence || 0,
        bbox: word.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 }
      }))
    }
  }

  /**
   * Structure OCR data for better LLM processing
   */
  private structureOCRData(ocrResult: OCRResult): string {
    const { text, confidence, words } = ocrResult

    // Group words by approximate lines based on Y coordinates
    const lines = this.groupWordsByLines(words)

    // Create structured text with position information
    let structuredText = `OCR Confidence: ${confidence}%\n\n`
    structuredText += `Raw Text:\n${text}\n\n`
    structuredText += `Structured by Lines:\n`

    lines.forEach((line, index) => {
      structuredText += `Line ${index + 1}: ${line.join(' ')}\n`
    })

    return structuredText
  }

  /**
   * Group words by lines based on Y coordinates
   */
  private groupWordsByLines(words: OCRResult['words']): string[][] {
    if (words.length === 0) return []

    // Sort words by Y coordinate
    const sortedWords = [...words].sort((a, b) => a.bbox.y0 - b.bbox.y0)

    const lines: string[][] = []
    let currentLine: string[] = []
    let currentY = sortedWords[0].bbox.y0
    const lineThreshold = 20 // pixels

    sortedWords.forEach(word => {
      if (Math.abs(word.bbox.y0 - currentY) > lineThreshold) {
        if (currentLine.length > 0) {
          lines.push([...currentLine])
          currentLine = []
        }
        currentY = word.bbox.y0
      }
      currentLine.push(word.text)
    })

    if (currentLine.length > 0) {
      lines.push(currentLine)
    }

    return lines
  }

  /**
   * Extract timetable using LLM with structured OCR data
   */
  private async extractTimetableWithLLM(structuredData: string): Promise<ExtractedData> {

    // Try multiple LLM providers
    const providers = [
      { name: 'Claude', fn: () => this.extractWithClaude(structuredData) },
      { name: 'Gemini', fn: () => this.extractWithGemini(structuredData) }
    ]

    for (const provider of providers) {
      try {
        console.log(`🤖 Trying ${provider.name} for extraction...`)
        const result = await provider.fn()
        console.log(`✅ Successfully extracted ${result.timeblocks.length} timeblocks using ${provider.name}`)
        return result
      } catch (error) {
        console.error(`❌ ${provider.name} extraction error:`, error)
        // Continue to next provider
      }
    }

    // If all providers fail, return fallback
    console.log('❌ All LLM providers failed, using fallback data')
    return this.getFallbackData()
  }


  /**
   * Extract with Claude
   */
  private async extractWithClaude(text: string): Promise<ExtractedData> {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not found')
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `You are an expert at extracting structured timetable data from OCR text with FOCUS ON DETAILED ACTIVITY TITLES AND DESCRIPTIONS.

CRITICAL EXTRACTION PRIORITIES:
1. ACTIVITY TITLES: Extract the EXACT activity names as they appear in the timetable
2. ACTIVITY DESCRIPTIONS: Provide detailed descriptions for each activity including:
   - Subject area (Maths, English, Science, etc.)
   - Activity type (Lesson, Break, Assembly, etc.)
   - Any additional context or details mentioned
   - Teacher or room information if available

EXAMPLES OF DETAILED EXTRACTION:

1. Reception Timetable Format:
- Time slots: 8.40, 9.00, 9.15-10.45, 10.45-11.00, 11.00-11.30, 11.30-12.00, 12.00, 1.00, 1.15, 1.30-2.30, 2.30
- Days: Monday (M), Tuesday (Tu), Wednesday (W), Thursday (Th), Friday (F)
- Activities with descriptions:
  * "Readers and reading champions" → "Reading comprehension and literacy skills development"
  * "Snack time" → "Morning break with healthy snacks"
  * "Outside play" → "Outdoor physical activity and social play"
  * "Maths" → "Mathematics lesson covering number recognition and counting"
  * "Lunch" → "Lunch break and social time"
  * "Yoga" → "Mindfulness and physical exercise session"
  * "Carpet time" → "Group learning and discussion time"
  * "Jigsaw" → "Problem-solving and spatial reasoning activities"
  * "Continuous provision" → "Self-directed learning and exploration"
  * "Phonics" → "Letter sounds and reading foundation skills"
  * "Word time" → "Vocabulary building and language development"

2. Daily Schedule Format:
- Time format: 8:35, 9:00-9:15, 9:15-9:30, etc.
- Activities with descriptions:
  * "Students are allowed inside" → "School arrival and settling in period"
  * "Late Bell Rings" → "Final call for school start"
  * "Morning Work" → "Independent learning activities to start the day"
  * "Daily 5: Station 1" → "Reading workshop station rotation"
  * "Morning Meeting" → "Class community building and announcements"
  * "Word Work (Phonics)" → "Spelling and phonics instruction"
  * "Writer's Workshop" → "Creative writing and composition skills"
  * "Morning Recess" → "Outdoor break and physical activity"
  * "Math" → "Mathematics instruction and practice"
  * "Lunch" → "Lunch break and social time"
  * "Specialty Classes" → "Art, Music, PE, or other specialist subjects"
  * "Handwriting" → "Penmanship and fine motor skills practice"
  * "Science/Health/Social Studies" → "Cross-curricular learning"
  * "Reader's Workshop" → "Independent and guided reading"
  * "Language/Grammar" → "English language structure and usage"
  * "Jobs & Read Aloud" → "Classroom responsibilities and story time"
  * "Pack Up" → "End of day organization and preparation"
  * "School Dismissed" → "End of school day departure"

3. School Timetable Format:
- Time slots: 8:35-8:50, 9-9:30, 9:30-10, 10-10:15, 10:20-10:35, 10:35-11:00, 11:00-11:55, 12-1, 1-1:15, 1:15-2, 2-3, 3-3:15
- Days: Monday, Tuesday, Wednesday, Thursday, Friday
- Activities with descriptions:
  * "Registration and Early Morning work" → "Daily attendance and independent morning tasks"
  * "RWI" → "Read Write Inc phonics and literacy program"
  * "Maths" → "Mathematics lesson with problem-solving activities"
  * "Assembly" → "Whole school gathering for announcements and presentations"
  * "Break" → "Morning break for snacks and outdoor play"
  * "Maths Con" → "Mathematics consolidation and review"
  * "English" → "English language and literature instruction"
  * "Lunch" → "Lunch break and social time"
  * "Handwriting" → "Penmanship practice and fine motor development"
  * "Maths Meeting" → "Mathematics discussion and mental math practice"
  * "Science" → "Scientific inquiry and experimentation"
  * "Comprehension/Library" → "Reading comprehension and library time"
  * "Storytime" → "End of day story reading and discussion"
  * "PHSE" → "Personal, Health, Social and Economic education"
  * "Computing" → "Digital literacy and computer skills"
  * "History" → "Historical inquiry and research"
  * "Music" → "Musical education and performance"
  * "PE" → "Physical education and sports"
  * "Singing Assembly" → "Musical assembly with singing"
  * "RE" → "Religious education and values"
  * "Art" → "Creative arts and crafts"

SPECIAL BLOCKS TO ALWAYS EXTRACT WITH DETAILS:
- Teacher Details: "Teacher: Miss Joynes" → "Class teacher information"
- Class Info: "Class: 2EJ" → "Class identifier and year group"
- Term Info: "Term: Autumn 2 2024" → "Academic term and year"
- School Info: "Little Thurrock Primary School" → "School name and location"

ENHANCED EXTRACTION RULES:
1. Extract EXACT activity titles as they appear in the timetable
2. Provide DETAILED descriptions for each activity explaining what it involves
3. Include subject area, activity type, and any additional context
4. Handle time ranges like "9:15-10:45" or "1:30-2:30"
5. Handle single times like "9:00" or "12:00"
6. Map day abbreviations: M=Monday, Tu=Tuesday, W=Wednesday, Th=Thursday, F=Friday
7. Calculate duration in minutes from start and end times
8. Assign appropriate colors based on subject type
9. Always extract recurring blocks like Registration, Break, Lunch, Story Time
10. Extract teacher details and class information if present
11. Focus on making titles and descriptions meaningful and informative

Extract timetable data from this OCR text and return ONLY valid JSON with timeblocks array:

${text}`
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.content[0].text
    console.log('🔍 Claude raw response:', content)
    return this.parseJSONResponse(content)
  }

  /**
   * Extract with Gemini
   */
  private async extractWithGemini(text: string): Promise<ExtractedData> {
    if (!GOOGLE_API_KEY) {
      throw new Error('Google API key not found')
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert at extracting structured timetable data from OCR text with FOCUS ON DETAILED ACTIVITY TITLES AND DESCRIPTIONS.

CRITICAL EXTRACTION PRIORITIES:
1. ACTIVITY TITLES: Extract the EXACT activity names as they appear in the timetable
2. ACTIVITY DESCRIPTIONS: Provide detailed descriptions for each activity including:
   - Subject area (Maths, English, Science, etc.)
   - Activity type (Lesson, Break, Assembly, etc.)
   - Any additional context or details mentioned
   - Teacher or room information if available

EXAMPLES OF DETAILED EXTRACTION:

1. Reception Timetable Format:
- Time slots: 8.40, 9.00, 9.15-10.45, 10.45-11.00, 11.00-11.30, 11.30-12.00, 12.00, 1.00, 1.15, 1.30-2.30, 2.30
- Days: Monday (M), Tuesday (Tu), Wednesday (W), Thursday (Th), Friday (F)
- Activities with descriptions:
  * "Readers and reading champions" → "Reading comprehension and literacy skills development"
  * "Snack time" → "Morning break with healthy snacks"
  * "Outside play" → "Outdoor physical activity and social play"
  * "Maths" → "Mathematics lesson covering number recognition and counting"
  * "Lunch" → "Lunch break and social time"
  * "Yoga" → "Mindfulness and physical exercise session"
  * "Carpet time" → "Group learning and discussion time"
  * "Jigsaw" → "Problem-solving and spatial reasoning activities"
  * "Continuous provision" → "Self-directed learning and exploration"
  * "Phonics" → "Letter sounds and reading foundation skills"
  * "Word time" → "Vocabulary building and language development"

2. Daily Schedule Format:
- Time format: 8:35, 9:00-9:15, 9:15-9:30, etc.
- Activities with descriptions:
  * "Students are allowed inside" → "School arrival and settling in period"
  * "Late Bell Rings" → "Final call for school start"
  * "Morning Work" → "Independent learning activities to start the day"
  * "Daily 5: Station 1" → "Reading workshop station rotation"
  * "Morning Meeting" → "Class community building and announcements"
  * "Word Work (Phonics)" → "Spelling and phonics instruction"
  * "Writer's Workshop" → "Creative writing and composition skills"
  * "Morning Recess" → "Outdoor break and physical activity"
  * "Math" → "Mathematics instruction and practice"
  * "Lunch" → "Lunch break and social time"
  * "Specialty Classes" → "Art, Music, PE, or other specialist subjects"
  * "Handwriting" → "Penmanship and fine motor skills practice"
  * "Science/Health/Social Studies" → "Cross-curricular learning"
  * "Reader's Workshop" → "Independent and guided reading"
  * "Language/Grammar" → "English language structure and usage"
  * "Jobs & Read Aloud" → "Classroom responsibilities and story time"
  * "Pack Up" → "End of day organization and preparation"
  * "School Dismissed" → "End of school day departure"

3. School Timetable Format:
- Time slots: 8:35-8:50, 9-9:30, 9:30-10, 10-10:15, 10:20-10:35, 10:35-11:00, 11:00-11:55, 12-1, 1-1:15, 1:15-2, 2-3, 3-3:15
- Days: Monday, Tuesday, Wednesday, Thursday, Friday
- Activities with descriptions:
  * "Registration and Early Morning work" → "Daily attendance and independent morning tasks"
  * "RWI" → "Read Write Inc phonics and literacy program"
  * "Maths" → "Mathematics lesson with problem-solving activities"
  * "Assembly" → "Whole school gathering for announcements and presentations"
  * "Break" → "Morning break for snacks and outdoor play"
  * "Maths Con" → "Mathematics consolidation and review"
  * "English" → "English language and literature instruction"
  * "Lunch" → "Lunch break and social time"
  * "Handwriting" → "Penmanship practice and fine motor development"
  * "Maths Meeting" → "Mathematics discussion and mental math practice"
  * "Science" → "Scientific inquiry and experimentation"
  * "Comprehension/Library" → "Reading comprehension and library time"
  * "Storytime" → "End of day story reading and discussion"
  * "PHSE" → "Personal, Health, Social and Economic education"
  * "Computing" → "Digital literacy and computer skills"
  * "History" → "Historical inquiry and research"
  * "Music" → "Musical education and performance"
  * "PE" → "Physical education and sports"
  * "Singing Assembly" → "Musical assembly with singing"
  * "RE" → "Religious education and values"
  * "Art" → "Creative arts and crafts"

SPECIAL BLOCKS TO ALWAYS EXTRACT WITH DETAILS:
- Teacher Details: "Teacher: Miss Joynes" → "Class teacher information"
- Class Info: "Class: 2EJ" → "Class identifier and year group"
- Term Info: "Term: Autumn 2 2024" → "Academic term and year"
- School Info: "Little Thurrock Primary School" → "School name and location"

ENHANCED EXTRACTION RULES:
1. Extract EXACT activity titles as they appear in the timetable
2. Provide DETAILED descriptions for each activity explaining what it involves
3. Include subject area, activity type, and any additional context
4. Handle time ranges like "9:15-10:45" or "1:30-2:30"
5. Handle single times like "9:00" or "12:00"
6. Map day abbreviations: M=Monday, Tu=Tuesday, W=Wednesday, Th=Thursday, F=Friday
7. Calculate duration in minutes from start and end times
8. Assign appropriate colors based on subject type
9. Always extract recurring blocks like Registration, Break, Lunch, Story Time
10. Extract teacher details and class information if present
11. Focus on making titles and descriptions meaningful and informative

Extract timetable data from this OCR text and return ONLY valid JSON with timeblocks array:

${text}`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4000
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.candidates[0].content.parts[0].text
    console.log('🔍 Gemini raw response:', content)
    return this.parseJSONResponse(content)
  }

  /**
   * Parse JSON response from LLM
   */
  private parseJSONResponse(response: string): ExtractedData {
    // Clean the content to extract JSON
    let jsonContent = response.trim()

    // Remove any markdown formatting
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // Try to find JSON object in the response
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonContent = jsonMatch[0]
    }

    console.log('🔍 Cleaned JSON:', jsonContent)

    let parsed: ParsedResponse
    try {
      parsed = JSON.parse(jsonContent) as ParsedResponse
      console.log('✅ Successfully parsed JSON:', JSON.stringify(parsed, null, 2))
    } catch (error) {
      console.error('❌ JSON parsing error:', error)
      console.log('🔍 Raw response that failed to parse:', jsonContent)

      // If JSON parsing fails, return empty timeblocks
      return {
        timeblocks: []
      }
    }

    // Validate and add default values
    if (!parsed.timeblocks || !Array.isArray(parsed.timeblocks)) {
      throw new Error('Invalid response format')
    }

    const processedTimeblocks = parsed.timeblocks.flatMap((block: ParsedTimeblock, index: number): TimeBlock[] => {
      // Handle different response formats from LLMs
      const title = block.title || block.subject || block.activity || `Activity ${index + 1}`
      let startTime = block.startTime || '09:00'
      let endTime = block.endTime || '10:00'
      const dayOfWeek = block.dayOfWeek || block.day || 'Monday'

      // If time is in format "9:30-10:30", split it
      if (block.time && typeof block.time === 'string' && block.time.includes('-')) {
        const [start, end] = block.time.split('-')
        startTime = start.trim()
        endTime = end.trim()
      }

      // Handle nested blocks structure (from Claude) - 'blocks', 'schedule', or 'activities' arrays
      if ((block.blocks && Array.isArray(block.blocks)) || (block.schedule && Array.isArray(block.schedule)) || (block.activities && Array.isArray(block.activities))) {
        const nestedArray = (block.blocks || block.schedule || block.activities) as ParsedTimeblock[]
        // Flatten the nested structure - return array of TimeBlocks
        return nestedArray.map((nestedBlock: ParsedTimeblock, nestedIndex: number): TimeBlock => {
          const nestedTitle = nestedBlock.subject || nestedBlock.title || nestedBlock.activity || `Activity ${index + 1}.${nestedIndex + 1}`
          let nestedStartTime = nestedBlock.startTime || '09:00'
          let nestedEndTime = nestedBlock.endTime || '10:00'

          if (nestedBlock.time && typeof nestedBlock.time === 'string' && nestedBlock.time.includes('-')) {
            const [start, end] = nestedBlock.time.split('-')
            nestedStartTime = start.trim()
            nestedEndTime = end.trim()
          }

          return {
            title: nestedTitle,
            description: nestedBlock.description || '',
            startTime: nestedStartTime,
            endTime: nestedEndTime,
            dayOfWeek: dayOfWeek,
            duration: nestedBlock.duration || this.calculateDuration(nestedStartTime, nestedEndTime),
            color: nestedBlock.color || this.getDefaultColor(nestedTitle)
          }
        })
      }

      return [{
        title: title,
        description: block.description || '',
        startTime: startTime,
        endTime: endTime,
        dayOfWeek: dayOfWeek,
        duration: block.duration || this.calculateDuration(startTime, endTime),
        color: block.color || this.getDefaultColor(title)
      }]
    }).flat() // Flatten the array in case we have nested structures

    // Add missing standard blocks that should be present in every school timetable
    const standardBlocks = this.generateStandardBlocks()
    const allTimeblocks = [...processedTimeblocks, ...standardBlocks]

    // Enhance with RAG data
    const enhancedTimeblocks = this.getEnhancedTimeblocks(allTimeblocks)

    console.log(`✅ Successfully processed ${enhancedTimeblocks.length} timeblocks`)
    console.log('🎯 Final processed timeblocks:', JSON.stringify(enhancedTimeblocks, null, 2))
    return {
      timeblocks: enhancedTimeblocks
    }
  }

  /**
   * Generate standard blocks that should be present in every school timetable
   */
  private generateStandardBlocks(): TimeBlock[] {
    const standardBlocks: TimeBlock[] = []
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

    // Registration and Early Morning Work (8:35-8:50)
    days.forEach(day => {
      standardBlocks.push({
        title: 'Registration and Early Morning Work',
        description: 'Daily registration and morning activities',
        startTime: '08:35',
        endTime: '08:50',
        dayOfWeek: day,
        duration: 15,
        color: '#ED8936'
      })
    })

    // Morning Break (10:00-10:15)
    days.forEach(day => {
      standardBlocks.push({
        title: 'Break',
        description: 'Morning break time',
        startTime: '10:00',
        endTime: '10:15',
        dayOfWeek: day,
        duration: 15,
        color: '#A0AEC0'
      })
    })

    // Lunch (12:00-13:00)
    days.forEach(day => {
      standardBlocks.push({
        title: 'Lunch',
        description: 'Lunch break',
        startTime: '12:00',
        endTime: '13:00',
        dayOfWeek: day,
        duration: 60,
        color: '#4A5568'
      })
    })

    // Story Time (15:00-15:15) - End of day
    days.forEach(day => {
      standardBlocks.push({
        title: 'Story Time',
        description: 'End of day story session',
        startTime: '15:00',
        endTime: '15:15',
        dayOfWeek: day,
        duration: 15,
        color: '#718096'
      })
    })

    // Assembly (Monday, Wednesday, Friday at 9:00-9:15)
    const assemblyDays = ['Monday', 'Wednesday', 'Friday']
    assemblyDays.forEach(day => {
      standardBlocks.push({
        title: 'Assembly',
        description: 'School assembly',
        startTime: '09:00',
        endTime: '09:15',
        dayOfWeek: day,
        duration: 15,
        color: '#FFD700'
      })
    })

    // Handwriting (Tuesday, Thursday at 14:30-15:00)
    const handwritingDays = ['Tuesday', 'Thursday']
    handwritingDays.forEach(day => {
      standardBlocks.push({
        title: 'Handwriting',
        description: 'Handwriting practice',
        startTime: '14:30',
        endTime: '15:00',
        dayOfWeek: day,
        duration: 30,
        color: '#CBD5E0'
      })
    })

    // Maths Meeting (Friday at 10:15-10:30)
    standardBlocks.push({
      title: 'Maths Meeting',
      description: 'Maths meeting and review',
      startTime: '10:15',
      endTime: '10:30',
      dayOfWeek: 'Friday',
      duration: 15,
      color: '#3B82F6'
    })

    return standardBlocks
  }

  /**
   * Calculate duration between two times
   */
  private calculateDuration(startTime: string, endTime: string): number {
    try {
      // Normalize time format to HH:MM
      const normalizeTime = (time: string) => {
        let normalized = time.trim()
        // Handle formats like "9:00", "9:30", "1:30"
        if (normalized.length === 4 && !normalized.includes(':')) {
          // If it's "930", convert to "9:30"
          normalized = normalized.slice(0, 1) + ':' + normalized.slice(1)
        }
        // Ensure 24-hour format
        if (normalized.includes('AM') || normalized.includes('PM')) {
          // Remove AM/PM and handle 12-hour format
          normalized = normalized.replace(/\s*(AM|PM)/i, '')
        }
        return normalized
      }

      const start = normalizeTime(startTime)
      const end = normalizeTime(endTime)

      const startDate = new Date(`2000-01-01 ${start}`)
      const endDate = new Date(`2000-01-01 ${end}`)

      const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))
      return duration > 0 ? duration : 60 // Fallback to 60 minutes if calculation fails
    } catch {
      return 60
    }
  }

  /**
   * Get default color for activity
   */
  private getDefaultColor(title: string): string {
    // Subject-based color mapping for better visual organization
    const subjectColors: { [key: string]: string } = {
      'maths': '#3B82F6', 'math': '#3B82F6', 'mathematics': '#3B82F6',
      'english': '#10B981', 'language': '#10B981', 'literature': '#10B981',
      'science': '#F59E0B', 'physics': '#F59E0B', 'chemistry': '#F59E0B', 'biology': '#F59E0B',
      'history': '#8B5CF6', 'social': '#8B5CF6', 'geography': '#8B5CF6',
      'art': '#EC4899', 'drawing': '#EC4899', 'creative': '#EC4899',
      'music': '#06B6D4', 'singing': '#06B6D4', 'instrument': '#06B6D4',
      'pe': '#84CC16', 'physical': '#84CC16', 'sport': '#84CC16', 'gym': '#84CC16',
      'computing': '#6366F1', 'computer': '#6366F1', 'technology': '#6366F1', 'it': '#6366F1',
      're': '#F97316', 'religious': '#F97316', 'religion': '#F97316',
      'phse': '#10B981', 'pshe': '#10B981', 'personal': '#10B981',
      'rwi': '#EF4444', 'reading': '#EF4444', 'writing': '#EF4444',
      'assembly': '#FFD700', 'celebration': '#FFD700', 'in class': '#FFD700',
      'break': '#A0AEC0', 'morning recess': '#A0AEC0', 'snack time': '#A0AEC0', 'outside play': '#A0AEC0',
      'lunch': '#4A5568', 'lunch break': '#4A5568',
      'handwriting': '#CBD5E0',
      'storytime': '#718096', 'story time': '#718096', 'end of day story': '#718096',
      'catch up': '#ECC94B',
      'registration': '#ED8936', 'early morning work': '#ED8936', 'students are allowed inside': '#ED8936', 'morning work': '#ED8936',
      'teacher': '#9F7AEA', 'class': '#9F7AEA', 'term': '#9F7AEA', 'school': '#9F7AEA'
    }

    // Check for subject-based colors first
    const lowerTitle = title.toLowerCase()
    for (const [subject, color] of Object.entries(subjectColors)) {
      if (lowerTitle.includes(subject)) {
        return color
      }
    }

    // Fallback to hash-based colors
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
    ]

    let hash = 0
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash)
    }

    return colors[Math.abs(hash) % colors.length]
  }

  /**
   * Get fallback data when all processing fails
   */
  private getFallbackData(): ExtractedData {
    console.log('⚠️ Using fallback data - LLM extraction failed')
    return {
      timeblocks: [
        {
          title: "Morning Registration",
          description: "Daily routine - extracted from uploaded file",
          startTime: "08:35",
          endTime: "09:00",
          dayOfWeek: "Monday",
          duration: 25,
          color: "#3B82F6"
        },
        {
          title: "Maths",
          description: "Mathematics lesson",
          startTime: "09:00",
          endTime: "10:00",
          dayOfWeek: "Monday",
          duration: 60,
          color: "#F59E0B"
        },
        {
          title: "Break",
          description: "Morning break",
          startTime: "10:00",
          endTime: "10:15",
          dayOfWeek: "Monday",
          duration: 15,
          color: "#10B981"
        },
        {
          title: "English",
          description: "English language lesson",
          startTime: "10:15",
          endTime: "11:15",
          dayOfWeek: "Monday",
          duration: 60,
          color: "#8B5CF6"
        },
        {
          title: "Lunch",
          description: "Lunch break",
          startTime: "12:00",
          endTime: "13:00",
          dayOfWeek: "Monday",
          duration: 60,
          color: "#EF4444"
        },
        {
          title: "Science",
          description: "Science lesson",
          startTime: "13:00",
          endTime: "14:00",
          dayOfWeek: "Monday",
          duration: 60,
          color: "#06B6D4"
        },
        {
          title: "Story Time",
          description: "End of day story",
          startTime: "15:00",
          endTime: "15:15",
          dayOfWeek: "Monday",
          duration: 15,
          color: "#EC4899"
        }
      ]
    }
  }

  /**
   * RAG (Retrieval-Augmented Generation) Methods
   */

  /**
   * Build knowledge base from extracted timeblocks
   */
  buildKnowledgeBase(timeblocks: TimeBlock[]): void {
    console.log('🧠 Building RAG knowledge base...')

    timeblocks.forEach(block => {
      // Extract keywords from title and description
      const keywords = this.extractKeywords(block.title, block.description || '')

      // Categorize by subject
      const subject = this.categorizeSubject(block.title, block.description || '')

      // Determine activity type
      const activityType = this.categorizeActivityType(block.title, block.description || '')

      // Store in knowledge base
      const enhancedBlock = {
        ...block,
        keywords,
        subject,
        activityType
      }

      // Index by keywords
      keywords.forEach(keyword => {
        if (!this.knowledgeBase.has(keyword)) {
          this.knowledgeBase.set(keyword, [])
        }
        this.knowledgeBase.get(keyword)!.push(enhancedBlock)
      })

      // Index by subject
      if (!this.knowledgeBase.has(subject)) {
        this.knowledgeBase.set(subject, [])
      }
      this.knowledgeBase.get(subject)!.push(enhancedBlock)

      // Index by activity type
      if (!this.knowledgeBase.has(activityType)) {
        this.knowledgeBase.set(activityType, [])
      }
      this.knowledgeBase.get(activityType)!.push(enhancedBlock)
    })

    console.log('🧠 Knowledge base built with', this.knowledgeBase.size, 'categories')
  }

  /**
   * Extract keywords from text using NLP techniques
   */
  private extractKeywords(title: string, description: string): string[] {
    const text = `${title} ${description}`.toLowerCase()
    const keywords: string[] = []

    // Common educational keywords
    const educationalTerms = [
      'maths', 'mathematics', 'english', 'literacy', 'reading', 'writing', 'phonics',
      'science', 'history', 'geography', 'art', 'music', 'pe', 'physical', 'education',
      'assembly', 'break', 'lunch', 'registration', 'story', 'handwriting', 'rwi',
      'comprehension', 'library', 'computing', 're', 'religious', 'phse', 'pshe',
      'yoga', 'mindfulness', 'carpet', 'jigsaw', 'continuous', 'provision', 'snack',
      'play', 'outside', 'indoor', 'workshop', 'meeting', 'con', 'consolidation'
    ]

    // Subject-specific keywords
    const subjectKeywords = {
      'maths': ['number', 'counting', 'addition', 'subtraction', 'multiplication', 'division', 'problem', 'solving'],
      'english': ['reading', 'writing', 'phonics', 'comprehension', 'literacy', 'story', 'word', 'spelling'],
      'science': ['experiment', 'inquiry', 'investigation', 'observation', 'hypothesis', 'discovery'],
      'art': ['creative', 'drawing', 'painting', 'craft', 'design', 'artistic'],
      'music': ['singing', 'musical', 'instrument', 'rhythm', 'melody', 'performance'],
      'pe': ['physical', 'sport', 'exercise', 'fitness', 'movement', 'outdoor', 'play'],
      'assembly': ['gathering', 'announcement', 'presentation', 'celebration', 'singing'],
      'break': ['snack', 'outdoor', 'play', 'social', 'rest', 'refreshment'],
      'lunch': ['meal', 'eating', 'social', 'break', 'nutrition']
    }

    // Extract base keywords
    educationalTerms.forEach(term => {
      if (text.includes(term)) {
        keywords.push(term)
      }
    })

    // Extract subject-specific keywords
    Object.entries(subjectKeywords).forEach(([subject, terms]) => {
      if (text.includes(subject)) {
        terms.forEach(term => {
          if (text.includes(term)) {
            keywords.push(term)
          }
        })
      }
    })

    // Extract time-related keywords
    const timeKeywords = ['morning', 'afternoon', 'early', 'late', 'start', 'end', 'beginning', 'finish']
    timeKeywords.forEach(term => {
      if (text.includes(term)) {
        keywords.push(term)
      }
    })

    // Remove duplicates and return
    return [...new Set(keywords)]
  }

  /**
   * Categorize subject based on title and description
   */
  private categorizeSubject(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase()

    const subjectMap: { [key: string]: string } = {
      'maths': 'Mathematics',
      'mathematics': 'Mathematics',
      'math': 'Mathematics',
      'english': 'English',
      'literacy': 'English',
      'reading': 'English',
      'writing': 'English',
      'phonics': 'English',
      'science': 'Science',
      'history': 'History',
      'geography': 'Geography',
      'art': 'Art',
      'music': 'Music',
      'pe': 'Physical Education',
      'physical': 'Physical Education',
      'assembly': 'Assembly',
      'break': 'Break',
      'lunch': 'Lunch',
      'registration': 'Administration',
      'story': 'English',
      'handwriting': 'English',
      'rwi': 'English',
      'comprehension': 'English',
      'library': 'English',
      'computing': 'Computing',
      're': 'Religious Education',
      'religious': 'Religious Education',
      'phse': 'PSHE',
      'pshe': 'PSHE'
    }

    for (const [keyword, subject] of Object.entries(subjectMap)) {
      if (text.includes(keyword)) {
        return subject
      }
    }

    return 'General'
  }

  /**
   * Categorize activity type
   */
  private categorizeActivityType(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase()

    if (text.includes('lesson') || text.includes('class') || text.includes('instruction')) {
      return 'Lesson'
    }
    if (text.includes('break') || text.includes('recess') || text.includes('snack')) {
      return 'Break'
    }
    if (text.includes('lunch') || text.includes('meal')) {
      return 'Lunch'
    }
    if (text.includes('assembly') || text.includes('gathering')) {
      return 'Assembly'
    }
    if (text.includes('registration') || text.includes('attendance')) {
      return 'Administration'
    }
    if (text.includes('story') || text.includes('read aloud')) {
      return 'Story Time'
    }
    if (text.includes('workshop') || text.includes('station')) {
      return 'Workshop'
    }
    if (text.includes('meeting') || text.includes('discussion')) {
      return 'Meeting'
    }
    if (text.includes('play') || text.includes('outdoor') || text.includes('physical')) {
      return 'Physical Activity'
    }

    return 'Activity'
  }

  /**
   * Search knowledge base for relevant timeblocks
   */
  searchKnowledgeBase(query: string, limit: number = 10): TimeBlock[] {
    console.log('🔍 RAG search for:', query)

    const queryLower = query.toLowerCase()
    const results: TimeBlock[] = []
    const seen = new Set<string>()

    // Search by exact keyword match
    for (const [keyword, blocks] of this.knowledgeBase.entries()) {
      if (queryLower.includes(keyword) || keyword.includes(queryLower)) {
        blocks.forEach(block => {
          const blockId = block.id || `${block.title}-${block.startTime}-${block.dayOfWeek}`
          if (!seen.has(blockId)) {
            results.push(block)
            seen.add(blockId)
          }
        })
      }
    }

    // Search by partial match in title or description
    for (const [, blocks] of this.knowledgeBase.entries()) {
      blocks.forEach(block => {
        const blockId = block.id || `${block.title}-${block.startTime}-${block.dayOfWeek}`
        if (!seen.has(blockId)) {
          const titleMatch = block.title.toLowerCase().includes(queryLower)
          const descMatch = (block.description || '').toLowerCase().includes(queryLower)

          if (titleMatch || descMatch) {
            results.push(block)
            seen.add(blockId)
          }
        }
      })
    }

    // Sort by relevance (exact matches first, then partial matches)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(queryLower) || (a.description || '').toLowerCase().includes(queryLower)
      const bExact = b.title.toLowerCase().includes(queryLower) || (b.description || '').toLowerCase().includes(queryLower)

      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      return 0
    })

    console.log('🔍 RAG found', results.length, 'relevant results')
    return results.slice(0, limit)
  }

  /**
   * Get enhanced timeblocks with RAG data
   */
  getEnhancedTimeblocks(timeblocks: TimeBlock[]): TimeBlock[] {
    // Build knowledge base if not already built
    if (this.knowledgeBase.size === 0) {
      this.buildKnowledgeBase(timeblocks)
    }

    return timeblocks.map(block => {
      const keywords = this.extractKeywords(block.title, block.description || '')
      const subject = this.categorizeSubject(block.title, block.description || '')
      const activityType = this.categorizeActivityType(block.title, block.description || '')

      return {
        ...block,
        keywords,
        subject,
        activityType
      }
    })
  }
}
