export interface TimeBlock {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  dayOfWeek: string
  duration?: number
  color?: string
  timetableId: string
  createdAt: string
  updatedAt: string
}

export interface Timetable {
  id: string
  title: string
  description?: string
  teacherId: string
  createdAt: string
  updatedAt: string
  timeblocks: TimeBlock[]
  teacher: {
    id: string
    name: string
    email: string
  }
}

export interface Teacher {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface UploadedFile {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  path: string
  processed: boolean
  createdAt: string
}
