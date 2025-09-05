import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { title, description, startTime, endTime, dayOfWeek, color } = await request.json()
    const { id } = await params

    if (!title || !startTime || !endTime || !dayOfWeek) {
      return NextResponse.json(
        { error: 'Title, startTime, endTime, and dayOfWeek are required' },
        { status: 400 }
      )
    }

    const updatedTimeblock = await prisma.timeBlock.update({
      where: { id },
      data: {
        title,
        description: description || '',
        startTime,
        endTime,
        dayOfWeek,
        color: color || '#3B82F6'
      }
    })

    return NextResponse.json({
      success: true,
      timeblock: updatedTimeblock
    })
  } catch (error) {
    console.error('Error updating timeblock:', error)
    return NextResponse.json(
      { error: 'Failed to update timeblock' },
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
    await prisma.timeBlock.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Timeblock deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting timeblock:', error)
    return NextResponse.json(
      { error: 'Failed to delete timeblock' },
      { status: 500 }
    )
  }
}
