import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    const timetables = await prisma.timetable.findMany({
      where: teacherId ? { teacherId } : {},
      include: {
        timeblocks: true,
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      timetables
    })
  } catch (error) {
    console.error('Error fetching timetables:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timetables' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, teacherId, timeblocks } = await request.json()

    if (!title || !teacherId) {
      return NextResponse.json(
        { error: 'Title and teacherId are required' },
        { status: 400 }
      )
    }

    const timetable = await prisma.timetable.create({
      data: {
        title,
        description: description || '',
        teacherId,
        timeblocks: {
          create: timeblocks || []
        }
      },
      include: {
        timeblocks: true,
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      timetable
    })
  } catch (error) {
    console.error('Error creating timetable:', error)
    return NextResponse.json(
      { error: 'Failed to create timetable' },
      { status: 500 }
    )
  }
}
