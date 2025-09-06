import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { HybridTimetableProcessor } from '@/lib/hybrid-processor'

// Custom logger that captures console output
class LogCapture {
  private logs: string[] = []
  private originalConsoleLog: typeof console.log
  private originalConsoleError: typeof console.error
  private originalConsoleWarn: typeof console.warn

  constructor() {
    this.originalConsoleLog = console.log
    this.originalConsoleError = console.error
    this.originalConsoleWarn = console.warn
  }

  start() {
    console.log = (...args: unknown[]) => {
      const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')
      this.logs.push(`[${new Date().toISOString()}] ${message}`)
      this.originalConsoleLog(...args)
    }

    console.error = (...args: unknown[]) => {
      const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')
      this.logs.push(`[${new Date().toISOString()}] ERROR: ${message}`)
      this.originalConsoleError(...args)
    }

    console.warn = (...args: unknown[]) => {
      const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')
      this.logs.push(`[${new Date().toISOString()}] WARN: ${message}`)
      this.originalConsoleWarn(...args)
    }
  }

  stop() {
    console.log = this.originalConsoleLog
    console.error = this.originalConsoleError
    console.warn = this.originalConsoleWarn
  }

  getLogs() {
    return this.logs
  }

  clear() {
    this.logs = []
  }
}

export async function POST(request: NextRequest) {
  const logCapture = new LogCapture()

  try {
    const { fileId, teacherId, title, description } = await request.json()

    if (!fileId) {
      return new Response(JSON.stringify({ error: 'File ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get the uploaded file
    const uploadedFile = await prisma.uploadedFile.findUnique({
      where: { id: fileId }
    })

    if (!uploadedFile) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (uploadedFile.processed) {
      return new Response(JSON.stringify({ error: 'File already processed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Start capturing logs
    logCapture.start()

    // Process the file to extract timetable data using hybrid processor
    const processor = HybridTimetableProcessor.getInstance()
    const extractedData = await processor.processImage(uploadedFile.path)

    // Create or get teacher
    let teacher
    if (teacherId) {
      teacher = await prisma.teacher.findUnique({ where: { id: teacherId } })
    }

    if (!teacher) {
      // Create or get default teacher (upsert to handle existing teacher)
      teacher = await prisma.teacher.upsert({
        where: { email: 'teacher@example.com' },
        update: {},
        create: {
          name: 'Default Teacher',
          email: 'teacher@example.com'
        }
      })
    }

    // Create timetable
    const timetable = await prisma.timetable.create({
      data: {
        title: title || 'Extracted Timetable',
        description: description || 'Timetable extracted from uploaded file',
        teacherId: teacher.id
      }
    })

    // Create timeblocks
    const timeblocks = await Promise.all(
      extractedData.timeblocks.map((block: {
        title: string;
        description?: string;
        startTime: string;
        endTime: string;
        dayOfWeek: string;
        duration?: number;
        color?: string;
      }) =>
        prisma.timeBlock.create({
          data: {
            title: block.title,
            description: block.description,
            startTime: block.startTime,
            endTime: block.endTime,
            dayOfWeek: block.dayOfWeek,
            duration: block.duration,
            color: block.color,
            timetableId: timetable.id
          }
        })
      )
    )

    // Mark file as processed
    await prisma.uploadedFile.update({
      where: { id: fileId },
      data: { processed: true }
    })

    // Stop capturing logs
    logCapture.stop()

    return new Response(JSON.stringify({
      success: true,
      timetable: {
        id: timetable.id,
        title: timetable.title,
        description: timetable.description,
        timeblocks
      },
      logs: logCapture.getLogs(),
      message: 'Timetable processed successfully'
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    logCapture.stop()
    console.error('Processing error:', error)

    return new Response(JSON.stringify({
      error: 'Failed to process timetable',
      logs: logCapture.getLogs()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
