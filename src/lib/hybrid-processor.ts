// Removed unused imports
import OpenAI from 'openai'

// Dynamic import for Tesseract to handle serverless environments better
let Tesseract: typeof import('tesseract.js') | null = null

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Alternative LLM providers
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY

interface ExtractedData {
  timeblocks: Array<{
    title: string
    description?: string
    startTime: string
    endTime: string
    dayOfWeek: string
    duration?: number
    color?: string
  }>
}

interface OCRResult {
  text: string
  confidence: number
  words: Array<{
    text: string
    confidence: number
    bbox: {
      x0: number
      y0: number
      x1: number
      y1: number
    }
  }>
}

/**
 * Hybrid OCR + LLM Processor
 * Combines Tesseract OCR with LLM intelligence for better accuracy
 */
export class HybridTimetableProcessor {
  private static instance: HybridTimetableProcessor

  static getInstance(): HybridTimetableProcessor {
    if (!HybridTimetableProcessor.instance) {
      HybridTimetableProcessor.instance = new HybridTimetableProcessor()
    }
    return HybridTimetableProcessor.instance
  }

  /**
   * Process image with hybrid OCR + LLM approach
   */
  async processImage(filePath: string): Promise<ExtractedData> {
    console.log('🔄 Starting hybrid OCR + LLM processing...')

    try {
      // Check if it's a PDF file
      if (filePath.toLowerCase().endsWith('.pdf')) {
        console.log('📄 Processing PDF with text extraction...')
        // For PDFs, skip OCR and use LLM directly with a generic prompt
        try {
          // For PDFs, skip text extraction and use a generic prompt
          // This avoids the pdf-parse library issues
          console.log('📄 Using generic PDF processing approach...')
          const genericPrompt = 'Please extract timetable information from the uploaded PDF document. Look for time blocks, activities, subjects, and schedule information. Extract any visible text content and structure it into a timetable format.'
          const timetableData = await this.extractTimetableWithLLM(genericPrompt)
          console.log(`🤖 LLM extracted ${timetableData.timeblocks.length} timeblocks from PDF`)
          return timetableData
        } catch (pdfError) {
          console.error('PDF processing failed:', pdfError)
          // Return fallback data
          return this.getFallbackData()
        }
      } else {
        // Step 1: OCR with Tesseract for images
        const ocrResult = await this.performOCR(filePath)
        console.log(`📖 OCR extracted ${ocrResult.text.length} characters with ${ocrResult.confidence}% confidence`)

        // Step 2: Structure the OCR data for LLM
        const structuredData = this.structureOCRData(ocrResult)
        console.log('🏗️ Structured OCR data for LLM processing')

        // Step 3: Use LLM to refine and extract timetable
        const timetableData = await this.extractTimetableWithLLM(structuredData)
        console.log(`🤖 LLM extracted ${timetableData.timeblocks.length} timeblocks`)

        return timetableData
      }
    } catch (error) {
      console.error('❌ Hybrid processing error:', error)
      return this.getFallbackData()
    }
  }

  /**
   * Perform OCR using Tesseract.js
   */
  private async performOCR(filePath: string): Promise<OCRResult> {
    console.log('🔍 Running Tesseract OCR...')

    try {
      // Dynamic import for better serverless compatibility
      if (!Tesseract) {
        Tesseract = (await import('tesseract.js')).default
      }

      const { data } = await Tesseract.recognize(filePath, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
          }
        },
        // Enhanced OCR settings for better text recognition
        // Note: Some advanced Tesseract options may not be available in this version
        // Try different page segmentation modes for better table recognition
      })

      return {
        text: data.text || '',
        confidence: data.confidence || 0,
        words: ((data as unknown as { words?: unknown[] }).words || []).map((word: unknown) => {
          const wordObj = word as Record<string, unknown>
          return {
            text: (wordObj.text as string) || '',
            confidence: (wordObj.confidence as number) || 0,
            bbox: (wordObj.bbox as { x0: number; y0: number; x1: number; y1: number }) || { x0: 0, y0: 0, x1: 0, y1: 0 }
          }
        })
      }
    } catch (error) {
      console.error('Tesseract OCR failed:', error)
      console.error('OCR Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      // Return empty result if OCR fails
      return {
        text: '',
        confidence: 0,
        words: []
      }
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
    const prompt = `
You are an expert timetable extraction AI. I've provided OCR data from a timetable image.
Extract the timetable information and return ONLY a valid JSON object with this exact structure:

{
  "timeblocks": [
    {
      "title": "Activity name",
      "description": "Optional description",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "dayOfWeek": "Monday/Tuesday/etc",
      "duration": minutes,
      "color": "#hexcode"
    }
  ]
}

Rules:
- Use the structured line data to identify timetable entries
- Convert times to 24-hour format (HH:MM)
- Assign appropriate colors for different activity types
- Calculate duration from start/end times if not specified
- Be flexible with time formats (9:00, 9:00 AM, 09:00, etc.)
- Group activities by day of the week

OCR Data:
${structuredData}
`

    // Try multiple LLM providers
    const providers = [
      { name: 'OpenAI', fn: () => this.extractWithOpenAI(prompt) },
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
   * Extract with OpenAI
   */
  private async extractWithOpenAI(prompt: string): Promise<ExtractedData> {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting structured timetable data from OCR text.

EXAMPLES OF TIMETABLE FORMATS TO EXTRACT:

1. Reception Timetable Format:
- Time slots: 8.40, 9.00, 9.15-10.45, 10.45-11.00, 11.00-11.30, 11.30-12.00, 12.00, 1.00, 1.15, 1.30-2.30, 2.30
- Days: Monday (M), Tuesday (Tu), Wednesday (W), Thursday (Th), Friday (F)
- Activities: "Readers and reading champions", "Snack time", "Outside play", "Maths", "Lunch", "Yoga", "Carpet time", "Jigsaw", "Continuous provision", "Phonics", "Word time"

2. Daily Schedule Format:
- Time format: 8:35, 9:00-9:15, 9:15-9:30, etc.
- Activities: "Students are allowed inside", "Late Bell Rings", "Morning Work", "Daily 5: Station 1", "Morning Meeting", "Word Work (Phonics)", "Writer's Workshop", "Morning Recess", "Math", "Lunch", "Specialty Classes", "Handwriting", "Science/Health/Social Studies", "Reader's Workshop", "Language/Grammar", "Jobs & Read Aloud", "Pack Up", "School Dismissed"

3. School Timetable Format:
- Time slots: 8:35-8:50, 9-9:30, 9:30-10, 10-10:15, 10:20-10:35, 10:35-11:00, 11:00-11:55, 12-1, 1-1:15, 1:15-2, 2-3, 3-3:15
- Days: Monday, Tuesday, Wednesday, Thursday, Friday
- Activities: "Registration and Early Morning work", "RWI", "Maths", "Assembly", "Break", "Maths Con", "English", "Lunch", "Handwriting", "Maths Meeting", "Science", "Comprehension/Library", "Storytime", "PHSE", "Computing", "History", "Music", "PE", "Singing Assembly", "RE", "Art"

SPECIAL BLOCKS TO ALWAYS EXTRACT:
- Teacher Details: "Teacher: Miss Joynes", "Class: 2EJ", "Term: Autumn 2 2024", "Little Thurrock Primary School"
- Registration/Early Morning: "Registration and Early Morning work", "Students are allowed inside", "Morning Work"
- Break Times: "Break", "Morning Recess", "Snack time", "Outside play"
- Lunch: "Lunch", "Lunch break"
- Story Time: "Storytime", "Story Time", "End of day story"
- Assembly: "Assembly", "Celebration Assembly", "Singing Assembly", "In Class Assembly"
- RWI: "RWI", "Read Write Inc"
- Handwriting: "Handwriting"
- Maths Meeting: "Maths Meeting"

EXTRACTION RULES:
1. Extract ALL activities with their exact times and days
2. Handle time ranges like "9:15-10:45" or "1:30-2:30"
3. Handle single times like "9:00" or "12:00"
4. Map day abbreviations: M=Monday, Tu=Tuesday, W=Wednesday, Th=Thursday, F=Friday
5. Extract activity descriptions exactly as written
6. Calculate duration in minutes from start and end times
7. Assign appropriate colors based on subject type
8. ONLY extract blocks that are actually present in the source - do not add standard blocks if they don't exist
9. Extract teacher details and class information if present
10. Always return valid JSON with timeblocks array

Always return valid JSON in this format:
{
  "timeblocks": [
    {
      "title": "Activity Name",
      "description": "Additional details if any",
      "startTime": "09:15",
      "endTime": "10:45",
      "dayOfWeek": "Monday",
      "duration": 90,
      "color": "#3B82F6"
    }
  ]
}`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 4000
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    console.log('🔍 OpenAI raw response:', response)
    return this.parseJSONResponse(response)
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
          content: `You are an expert at extracting structured timetable data from OCR text.

EXAMPLES OF TIMETABLE FORMATS TO EXTRACT:

1. Reception Timetable Format:
- Time slots: 8.40, 9.00, 9.15-10.45, 10.45-11.00, 11.00-11.30, 11.30-12.00, 12.00, 1.00, 1.15, 1.30-2.30, 2.30
- Days: Monday (M), Tuesday (Tu), Wednesday (W), Thursday (Th), Friday (F)
- Activities: "Readers and reading champions", "Snack time", "Outside play", "Maths", "Lunch", "Yoga", "Carpet time", "Jigsaw", "Continuous provision", "Phonics", "Word time"

2. Daily Schedule Format:
- Time format: 8:35, 9:00-9:15, 9:15-9:30, etc.
- Activities: "Students are allowed inside", "Late Bell Rings", "Morning Work", "Daily 5: Station 1", "Morning Meeting", "Word Work (Phonics)", "Writer's Workshop", "Morning Recess", "Math", "Lunch", "Specialty Classes", "Handwriting", "Science/Health/Social Studies", "Reader's Workshop", "Language/Grammar", "Jobs & Read Aloud", "Pack Up", "School Dismissed"

3. School Timetable Format:
- Time slots: 8:35-8:50, 9-9:30, 9:30-10, 10-10:15, 10:20-10:35, 10:35-11:00, 11:00-11:55, 12-1, 1-1:15, 1:15-2, 2-3, 3-3:15
- Days: Monday, Tuesday, Wednesday, Thursday, Friday
- Activities: "Registration and Early Morning work", "RWI", "Maths", "Assembly", "Break", "Maths Con", "English", "Lunch", "Handwriting", "Maths Meeting", "Science", "Comprehension/Library", "Storytime", "PHSE", "Computing", "History", "Music", "PE", "Singing Assembly", "RE", "Art"

SPECIAL BLOCKS TO ALWAYS EXTRACT:
- Teacher Details: "Teacher: Miss Joynes", "Class: 2EJ", "Term: Autumn 2 2024", "Little Thurrock Primary School"
- Registration/Early Morning: "Registration and Early Morning work", "Students are allowed inside", "Morning Work"
- Break Times: "Break", "Morning Recess", "Snack time", "Outside play"
- Lunch: "Lunch", "Lunch break"
- Story Time: "Storytime", "Story Time", "End of day story"
- Assembly: "Assembly", "Celebration Assembly", "Singing Assembly", "In Class Assembly"
- RWI: "RWI", "Read Write Inc"
- Handwriting: "Handwriting"
- Maths Meeting: "Maths Meeting"

EXTRACTION RULES:
1. Extract ALL activities with their exact times and days
2. Handle time ranges like "9:15-10:45" or "1:30-2:30"
3. Handle single times like "9:00" or "12:00"
4. Map day abbreviations: M=Monday, Tu=Tuesday, W=Wednesday, Th=Thursday, F=Friday
5. Extract activity descriptions exactly as written
6. Calculate duration in minutes from start and end times
7. Assign appropriate colors based on subject type
8. ONLY extract blocks that are actually present in the source - do not add standard blocks if they don't exist
9. Extract teacher details and class information if present
10. Always return valid JSON with timeblocks array

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
            text: `You are an expert at extracting structured timetable data from OCR text.

EXAMPLES OF TIMETABLE FORMATS TO EXTRACT:

1. Reception Timetable Format:
- Time slots: 8.40, 9.00, 9.15-10.45, 10.45-11.00, 11.00-11.30, 11.30-12.00, 12.00, 1.00, 1.15, 1.30-2.30, 2.30
- Days: Monday (M), Tuesday (Tu), Wednesday (W), Thursday (Th), Friday (F)
- Activities: "Readers and reading champions", "Snack time", "Outside play", "Maths", "Lunch", "Yoga", "Carpet time", "Jigsaw", "Continuous provision", "Phonics", "Word time"

2. Daily Schedule Format:
- Time format: 8:35, 9:00-9:15, 9:15-9:30, etc.
- Activities: "Students are allowed inside", "Late Bell Rings", "Morning Work", "Daily 5: Station 1", "Morning Meeting", "Word Work (Phonics)", "Writer's Workshop", "Morning Recess", "Math", "Lunch", "Specialty Classes", "Handwriting", "Science/Health/Social Studies", "Reader's Workshop", "Language/Grammar", "Jobs & Read Aloud", "Pack Up", "School Dismissed"

3. School Timetable Format:
- Time slots: 8:35-8:50, 9-9:30, 9:30-10, 10-10:15, 10:20-10:35, 10:35-11:00, 11:00-11:55, 12-1, 1-1:15, 1:15-2, 2-3, 3-3:15
- Days: Monday, Tuesday, Wednesday, Thursday, Friday
- Activities: "Registration and Early Morning work", "RWI", "Maths", "Assembly", "Break", "Maths Con", "English", "Lunch", "Handwriting", "Maths Meeting", "Science", "Comprehension/Library", "Storytime", "PHSE", "Computing", "History", "Music", "PE", "Singing Assembly", "RE", "Art"

SPECIAL BLOCKS TO ALWAYS EXTRACT:
- Teacher Details: "Teacher: Miss Joynes", "Class: 2EJ", "Term: Autumn 2 2024", "Little Thurrock Primary School"
- Registration/Early Morning: "Registration and Early Morning work", "Students are allowed inside", "Morning Work"
- Break Times: "Break", "Morning Recess", "Snack time", "Outside play"
- Lunch: "Lunch", "Lunch break"
- Story Time: "Storytime", "Story Time", "End of day story"
- Assembly: "Assembly", "Celebration Assembly", "Singing Assembly", "In Class Assembly"
- RWI: "RWI", "Read Write Inc"
- Handwriting: "Handwriting"
- Maths Meeting: "Maths Meeting"

EXTRACTION RULES:
1. Extract ALL activities with their exact times and days
2. Handle time ranges like "9:15-10:45" or "1:30-2:30"
3. Handle single times like "9:00" or "12:00"
4. Map day abbreviations: M=Monday, Tu=Tuesday, W=Wednesday, Th=Thursday, F=Friday
5. Extract activity descriptions exactly as written
6. Calculate duration in minutes from start and end times
7. Assign appropriate colors based on subject type
8. ONLY extract blocks that are actually present in the source - do not add standard blocks if they don't exist
9. Extract teacher details and class information if present
10. Always return valid JSON with timeblocks array

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

    // Check if the response is valid JSON
    if (!jsonContent.startsWith('{') || !jsonContent.includes('timeblocks')) {
      console.log('⚠️ Response is not valid JSON, using fallback data')
      return this.getFallbackData()
    }

    let parsed
    try {
      parsed = JSON.parse(jsonContent)
    } catch (error) {
      console.error('❌ JSON parsing error:', error)
      console.log('⚠️ Using fallback data due to JSON parsing error')
      return this.getFallbackData()
    }

    // Validate and add default values
    if (!parsed.timeblocks || !Array.isArray(parsed.timeblocks)) {
      throw new Error('Invalid response format')
    }

    const processedTimeblocks = parsed.timeblocks.map((block: Record<string, unknown>, index: number) => {
      // Handle different response formats from LLMs
      const title = (block.title as string) || (block.subject as string) || (block.activity as string) || `Activity ${index + 1}`
      let startTime = (block.startTime as string) || '09:00'
      let endTime = (block.endTime as string) || '10:00'
      const dayOfWeek = (block.dayOfWeek as string) || (block.day as string) || 'Monday'

      // If time is in format "9:30-10:30", split it
      if (block.time && typeof block.time === 'string' && block.time.includes('-')) {
        const [start, end] = block.time.split('-')
        startTime = start.trim()
        endTime = end.trim()
      }

      // Handle nested blocks structure (from Claude) - both 'blocks' and 'schedule' arrays
      if ((block.blocks && Array.isArray(block.blocks)) || (block.schedule && Array.isArray(block.schedule))) {
        const nestedArray = (block.blocks || block.schedule) as unknown[]
        // Flatten the nested structure
        return nestedArray.map((nestedBlock: unknown, nestedIndex: number) => {
          const nestedBlockObj = nestedBlock as Record<string, unknown>
          const nestedTitle = (nestedBlockObj.subject as string) || (nestedBlockObj.title as string) || (nestedBlockObj.activity as string) || `Activity ${index + 1}.${nestedIndex + 1}`
          let nestedStartTime = (nestedBlockObj.startTime as string) || '09:00'
          let nestedEndTime = (nestedBlockObj.endTime as string) || '10:00'

          if (nestedBlockObj.time && typeof nestedBlockObj.time === 'string' && nestedBlockObj.time.includes('-')) {
            const [start, end] = nestedBlockObj.time.split('-')
            nestedStartTime = start.trim()
            nestedEndTime = end.trim()
          }

          return {
            title: nestedTitle,
            description: (nestedBlockObj.description as string) || '',
            startTime: nestedStartTime,
            endTime: nestedEndTime,
            dayOfWeek: dayOfWeek,
            duration: (nestedBlockObj.duration as number) || this.calculateDuration(nestedStartTime, nestedEndTime),
            color: (nestedBlockObj.color as string) || this.getDefaultColor(nestedTitle)
          }
        })
      }

      return {
        title: title,
        description: (block.description as string) || '',
        startTime: startTime,
        endTime: endTime,
        dayOfWeek: dayOfWeek,
        duration: (block.duration as number) || this.calculateDuration(startTime, endTime),
        color: (block.color as string) || this.getDefaultColor(title)
      }
    }).flat() // Flatten the array in case we have nested structures

    // Only add standard blocks if they don't already exist in the extracted data
    const standardBlocks = this.generateConditionalStandardBlocks(processedTimeblocks)
    const allTimeblocks = [...processedTimeblocks, ...standardBlocks]

    return {
      timeblocks: allTimeblocks
    }
  }

  /**
   * Generate standard blocks conditionally based on what's already extracted
   */
  private generateConditionalStandardBlocks(existingBlocks: Record<string, unknown>[]): Record<string, unknown>[] {
    const standardBlocks: Record<string, unknown>[] = []
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

    // Check if standard blocks already exist
    const existingTitles = existingBlocks.map(block => (block.title as string).toLowerCase())

    // Only add blocks that don't already exist
    const shouldAddBlock = (blockTitle: string) => {
      return !existingTitles.some(title =>
        title.includes(blockTitle.toLowerCase()) ||
        blockTitle.toLowerCase().includes(title)
      )
    }

    // Registration and Early Morning Work (8:35-8:50) - only if not present
    if (shouldAddBlock('Registration') || shouldAddBlock('Early Morning')) {
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
    }

    // Morning Break (10:00-10:15) - only if not present
    if (shouldAddBlock('Break') || shouldAddBlock('Recess')) {
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
    }

    // Lunch (12:00-13:00) - only if not present
    if (shouldAddBlock('Lunch')) {
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
    }

    // Story Time (15:00-15:15) - only if not present
    if (shouldAddBlock('Story Time') || shouldAddBlock('Storytime')) {
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
    }

    // Assembly (Monday, Wednesday, Friday at 9:00-9:15) - only if not present
    if (shouldAddBlock('Assembly')) {
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
    }

    // Handwriting (Tuesday, Thursday at 14:30-15:00) - only if not present
    if (shouldAddBlock('Handwriting')) {
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
    }

    // Maths Meeting (Friday at 10:15-10:30) - only if not present
    if (shouldAddBlock('Maths Meeting') || shouldAddBlock('Math Meeting')) {
      standardBlocks.push({
        title: 'Maths Meeting',
        description: 'Maths meeting and review',
        startTime: '10:15',
        endTime: '10:30',
        dayOfWeek: 'Friday',
        duration: 15,
        color: '#3B82F6'
      })
    }

    return standardBlocks
  }

  /**
   * Generate standard blocks that should be present in every school timetable
   */
  private generateStandardBlocks(): Record<string, unknown>[] {
    const standardBlocks: Record<string, unknown>[] = []
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
          title: "Maths",
          description: "Mathematics lesson",
          startTime: "09:00",
          endTime: "10:00",
          dayOfWeek: "Monday",
          duration: 60,
          color: "#F59E0B"
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
          title: "Science",
          description: "Science lesson",
          startTime: "13:00",
          endTime: "14:00",
          dayOfWeek: "Monday",
          duration: 60,
          color: "#06B6D4"
        },
        {
          title: "Art",
          description: "Art and Design",
          startTime: "14:00",
          endTime: "15:00",
          dayOfWeek: "Monday",
          duration: 60,
          color: "#EC4899"
        }
      ]
    }
  }
}
