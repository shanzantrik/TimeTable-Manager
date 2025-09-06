import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(time: string): string {
  // Handle undefined/null values
  if (!time || typeof time !== 'string') {
    return '00:00 AM'
  }

  // Convert 24-hour format to 12-hour format for display
  const [hours, minutes] = time.split(':').map(Number)

  // Handle invalid time format
  if (isNaN(hours) || isNaN(minutes)) {
    return '00:00 AM'
  }

  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

export function getDayOrder(day: string): number {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  return days.indexOf(day)
}

interface TimeBlock {
  dayOfWeek: string
  startTime: string
}

export function sortTimeblocksByDayAndTime(timeblocks: unknown[]) {
  return timeblocks.sort((a: unknown, b: unknown) => {
    const timeBlockA = a as TimeBlock
    const timeBlockB = b as TimeBlock
    const dayComparison = getDayOrder(timeBlockA.dayOfWeek) - getDayOrder(timeBlockB.dayOfWeek)
    if (dayComparison !== 0) return dayComparison
    return timeBlockA.startTime.localeCompare(timeBlockB.startTime)
  })
}
