import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const timetable = await prisma.timetable.findUnique({
      where: { id: params.id },
      include: {
        timeblocks: {
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!timetable) {
      return NextResponse.json(
        { error: 'Timetable not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      timetable
    })
  } catch (error) {
    console.error('Error fetching timetable:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timetable' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { title, description, timeblocks } = await request.json()
    const { id } = await params

    console.log('🔄 Updating timetable:', { id, title, description })
    console.log('📊 Timeblocks to process:', timeblocks?.length || 0)

    // Update timetable
    await prisma.timetable.update({
      where: { id },
      data: {
        title,
        description
      }
    })

    // Update timeblocks if provided
    if (timeblocks) {
      console.log('🗑️ Deleting existing timeblocks for timetable:', id)
      // Delete existing timeblocks
      await prisma.timeBlock.deleteMany({
        where: { timetableId: id }
      })

      console.log('➕ Creating new timeblocks:', timeblocks.length)
      // Create new timeblocks
      const createdTimeblocks = await prisma.timeBlock.createMany({
        data: timeblocks.map((block: {
          title: string;
          description?: string;
          startTime: string;
          endTime: string;
          dayOfWeek: string;
          duration?: number;
          color?: string;
        }) => ({
          ...block,
          timetableId: id
        }))
      })

      console.log('✅ Created timeblocks:', createdTimeblocks)
    }

    const timetable = await prisma.timetable.findUnique({
      where: { id },
      include: {
        timeblocks: {
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    console.log('📋 Final timetable with timeblocks:', timetable?.timeblocks?.length || 0)

    return NextResponse.json({
      success: true,
      timetable
    })
  } catch (error) {
    console.error('Error updating timetable:', error)
    return NextResponse.json(
      { error: 'Failed to update timetable' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.timetable.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Timetable deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting timetable:', error)
    return NextResponse.json(
      { error: 'Failed to delete timetable' },
      { status: 500 }
    )
  }
}
