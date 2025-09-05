import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processTimetableFile } from '@/lib/timetable-processor'

export async function POST(request: NextRequest) {
  try {
    const { fileId, teacherId, title, description } = await request.json()

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    // Get the uploaded file
    const uploadedFile = await prisma.uploadedFile.findUnique({
      where: { id: fileId }
    })

    if (!uploadedFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    if (uploadedFile.processed) {
      return NextResponse.json({ error: 'File already processed' }, { status: 400 })
    }

    // Process the file to extract timetable data
    const extractedData = await processTimetableFile(uploadedFile.path, uploadedFile.mimeType)

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

    return NextResponse.json({
      success: true,
      timetable: {
        id: timetable.id,
        title: timetable.title,
        description: timetable.description,
        timeblocks
      },
      message: 'Timetable processed successfully'
    })

  } catch (error) {
    console.error('Processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process timetable' },
      { status: 500 }
    )
  }
}
