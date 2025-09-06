import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(time: string): string {
  // Convert 24-hour format to 12-hour format for display
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

export function getDayOrder(day: string): number {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  return days.indexOf(day)
}

export function sortTimeblocksByDayAndTime(timeblocks: any[]) {
  return timeblocks.sort((a, b) => {
    const dayComparison = getDayOrder(a.dayOfWeek) - getDayOrder(b.dayOfWeek)
    if (dayComparison !== 0) return dayComparison
    return a.startTime.localeCompare(b.startTime)
  })
}
