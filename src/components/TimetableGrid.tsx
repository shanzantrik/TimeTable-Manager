'use client'

import { useState, useEffect } from 'react'
import { Clock, Calendar, Edit3, Trash2, Plus, Maximize2, Minimize2, Save, X, Filter, Search, Info, GripVertical } from 'lucide-react'
import { Timetable, TimeBlock } from '@/types'
import { formatTime, sortTimeblocksByDayAndTime } from '@/lib/utils'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface TimetableGridProps {
  timetable: Timetable
  onTimetableUpdated?: (timetableId: string) => void
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Sortable TimeBlock Component
function SortableTimeBlock({
  block,
  isSmall,
  onView,
  onEdit,
  onDelete,
  getTimeSlotTop,
  getTimeSlotHeight,
  getEnhancedBackgroundColor
}: {
  block: TimeBlock
  isSmall: boolean
  onView: (block: TimeBlock) => void
  onEdit: (block: TimeBlock) => void
  onDelete: (id: string) => void
  getTimeSlotTop: (startTime: string) => number
  getTimeSlotHeight: (startTime: string, endTime: string) => number
  getEnhancedBackgroundColor: (color: string) => string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: getEnhancedBackgroundColor(block.color || '#3B82F6'),
        color: '#ffffff',
        top: `${getTimeSlotTop(block.startTime)}px`,
        height: `${getTimeSlotHeight(block.startTime, block.endTime)}px`,
        borderLeftColor: block.color || '#3B82F6',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
      }}
      {...attributes}
      {...listeners}
      onClick={() => onView(block)}
      className="absolute left-2 right-2 rounded-xl p-2 sm:p-3 text-xs shadow-lg border-l-4 group hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-move"
    >
      <div className="flex items-start justify-between h-full">
        <div className="flex-1 min-w-0 pr-2">
          {isSmall ? (
            // Small blocks - only show title
            <div className="flex items-center space-x-1 h-full">
              <div
                className="w-1 h-1 rounded-full shadow-sm flex-shrink-0"
                style={{
                  backgroundColor: '#ffffff',
                  opacity: 0.9
                }}
              ></div>
              <p className="font-bold text-xs leading-tight text-white break-words">
                {block.title}
              </p>
            </div>
          ) : (
            // Larger blocks - show full content
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <div
                  className="w-1 h-1 rounded-full shadow-sm flex-shrink-0"
                  style={{
                    backgroundColor: '#ffffff',
                    opacity: 0.9
                  }}
                ></div>
                <p className="font-bold text-xs leading-tight text-white break-words">
                  {block.title}
                </p>
              </div>
              <p
                className="text-xs font-medium text-white"
                style={{
                  opacity: 0.95,
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}
              >
                {formatTime(block.startTime)} - {formatTime(block.endTime)}
              </p>
              {block.description && (
                <p
                  className="text-xs text-white leading-tight"
                  style={{
                    opacity: 0.9,
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                  }}
                >
                  {block.description}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1 ml-2">
          <div className="p-1 text-white/60 hover:text-white/80 cursor-move" title="Drag to reorder">
            <GripVertical className="w-3 h-3" />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(block)
            }}
            className="p-1 rounded-lg transition-all duration-200 hover:scale-110 hover:bg-white/30 backdrop-blur-sm"
            style={{
              color: '#ffffff',
            }}
            title="Edit activity"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(block.id)
            }}
            className="p-1 rounded-lg transition-all duration-200 hover:scale-110 hover:bg-white/30 backdrop-blur-sm"
            style={{
              color: '#ffffff',
            }}
            title="Delete activity"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TimetableGrid({ timetable, onTimetableUpdated }: TimetableGridProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [editingTimeblock, setEditingTimeblock] = useState<TimeBlock | null>(null)
  const [creatingTimeblock, setCreatingTimeblock] = useState(false)
  const [viewingTimeblock, setViewingTimeblock] = useState<TimeBlock | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDay, setSelectedDay] = useState('All')
  const [showFilters, setShowFilters] = useState(false)
  const [timeblocks, setTimeblocks] = useState<TimeBlock[]>(timetable.timeblocks)

  // Sync timeblocks state with timetable prop changes
  useEffect(() => {
    setTimeblocks(timetable.timeblocks)
  }, [timetable.timeblocks])

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    dayOfWeek: '',
    color: ''
  })
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    startTime: '09:00',
    endTime: '10:00',
    dayOfWeek: 'Monday',
    color: '#3B82F6'
  })

  const sortedTimeblocks = sortTimeblocksByDayAndTime(timeblocks) as TimeBlock[]

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setTimeblocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Filter timeblocks based on search and day filter
  const filteredTimeblocks = sortedTimeblocks.filter((block: TimeBlock) => {
    const matchesSearch = searchTerm === '' ||
      block.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (block.description && block.description.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesDay = selectedDay === 'All' || block.dayOfWeek === selectedDay

    return matchesSearch && matchesDay
  })

  // Group filtered timeblocks by day
  const timeblocksByDay = DAYS.map(day => ({
    day,
    blocks: filteredTimeblocks.filter((block: TimeBlock) => block.dayOfWeek === day)
  }))

  const getTimeSlotHeight = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01 ${startTime}`)
    const end = new Date(`2000-01-01 ${endTime}`)
    const duration = (end.getTime() - start.getTime()) / (1000 * 60) // minutes
    return Math.max(duration * 2, 60) // Minimum 60px height, scaled up
  }

  const getTimeSlotTop = (startTime: string) => {
    const start = new Date(`2000-01-01 ${startTime}`)
    const hours = start.getHours()
    const minutes = start.getMinutes()
    return (hours - 8) * 120 + minutes * 2 // Starting from 8 AM, 2px per minute
  }

  const isSmallBlock = (startTime: string, endTime: string) => {
    const height = getTimeSlotHeight(startTime, endTime)
    return height < 80 // Consider blocks smaller than 80px as small
  }

  const handleEditTimeblock = (timeblock: TimeBlock) => {
    setEditingTimeblock(timeblock)

    // Format time for HTML time input (HH:MM)
    const formatTimeForInput = (time: string) => {
      // If time is already in HH:MM format, return as is
      if (time.match(/^\d{2}:\d{2}$/)) {
        return time
      }
      // If time is in H:MM format, pad with zero
      if (time.match(/^\d{1}:\d{2}$/)) {
        return `0${time}`
      }
      // If time is in HH:MM:SS format, remove seconds
      if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
        return time.substring(0, 5)
      }
      // Default fallback
      return time
    }

    setEditForm({
      title: timeblock.title,
      description: timeblock.description || '',
      startTime: formatTimeForInput(timeblock.startTime),
      endTime: formatTimeForInput(timeblock.endTime),
      dayOfWeek: timeblock.dayOfWeek,
      color: timeblock.color || '#3B82F6'
    })
  }

  const handleCreateTimeblock = () => {
    setCreatingTimeblock(true)
    setCreateForm({
      title: '',
      description: '',
      startTime: '09:00',
      endTime: '10:00',
      dayOfWeek: 'Monday',
      color: '#3B82F6'
    })
  }

  const handleSaveEdit = async () => {
    if (editingTimeblock) {
      try {
        const response = await fetch(`/api/timeblocks/${editingTimeblock.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(editForm)
        })

        if (!response.ok) {
          throw new Error('Failed to update timeblock')
        }

        const data = await response.json()
        if (data.success) {
          // Update the parent component with fresh data
          if (onTimetableUpdated) {
            onTimetableUpdated(timetable.id)
          }
          // Close the edit form
          setEditingTimeblock(null)
        }
      } catch (error) {
        console.error('Error saving timeblock:', error)
        alert('Failed to save changes. Please try again.')
      }
    }
  }

  const handleDeleteTimeblock = async (timeblockId: string) => {
    if (confirm('Are you sure you want to delete this activity?')) {
      try {
        const response = await fetch(`/api/timeblocks/${timeblockId}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error('Failed to delete timeblock')
        }

        const data = await response.json()
        if (data.success) {
          // Update the parent component with fresh data
          if (onTimetableUpdated) {
            onTimetableUpdated(timetable.id)
          }
        }
      } catch (error) {
        console.error('Error deleting timeblock:', error)
        alert('Failed to delete activity. Please try again.')
      }
    }
  }

  const handleSaveCreate = async () => {
    try {
      console.log('🔄 Creating new timeblock...', createForm)

      // Calculate duration
      const start = new Date(`2000-01-01 ${createForm.startTime}`)
      const end = new Date(`2000-01-01 ${createForm.endTime}`)
      const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60))

      const newTimeblock = {
        title: createForm.title,
        description: createForm.description,
        startTime: createForm.startTime,
        endTime: createForm.endTime,
        dayOfWeek: createForm.dayOfWeek,
        duration: duration,
        color: createForm.color
      }

      console.log('📝 New timeblock data:', newTimeblock)
      console.log('📊 Current timetable timeblocks count:', timetable.timeblocks.length)

      const response = await fetch(`/api/timetables/${timetable.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: timetable.title,
          description: timetable.description,
          timeblocks: [
            ...timetable.timeblocks,
            newTimeblock
          ]
        })
      })

      console.log('🌐 API Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error:', errorText)
        throw new Error('Failed to create timeblock')
      }

      const data = await response.json()
      console.log('✅ API Response data:', data)

      if (data.success) {
        console.log('🎉 Timeblock created successfully! Updating UI...')
        // Update the parent component with fresh data
        if (onTimetableUpdated) {
          onTimetableUpdated(timetable.id)
        }
        // Close the create form
        setCreatingTimeblock(false)
        setCreateForm({
          title: '',
          description: '',
          startTime: '09:00',
          endTime: '10:00',
          dayOfWeek: 'Monday',
          color: '#3B82F6'
        })
      } else {
        console.error('❌ API returned success: false', data)
        alert('Failed to create activity. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error creating timeblock:', error)
      alert('Failed to create activity. Please try again.')
    }
  }

  const handleCancelEdit = () => {
    setEditingTimeblock(null)
    setEditForm({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      dayOfWeek: '',
      color: ''
    })
  }

  const handleCancelCreate = () => {
    setCreatingTimeblock(false)
    setCreateForm({
      title: '',
      description: '',
      startTime: '09:00',
      endTime: '10:00',
      dayOfWeek: 'Monday',
      color: '#3B82F6'
    })
  }

  const handleViewTimeblock = (timeblock: TimeBlock) => {
    setViewingTimeblock(timeblock)
  }

  const handleCloseView = () => {
    setViewingTimeblock(null)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Enhanced function to determine text color with better contrast
  // const getTextColor = (backgroundColor: string) => {
  //   // Always return white for better visibility on colored backgrounds
  //   return '#ffffff'
  // }

  // Function to get enhanced background color with better contrast
  const getEnhancedBackgroundColor = (originalColor: string) => {
    // Remove # if present
    const hex = originalColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

    // If too light, darken it slightly for better text contrast
    if (luminance > 0.7) {
      return `rgba(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)}, 0.9)`
    }

    return originalColor
  }

  return (
    <>
      <style jsx>{`
        .timetable-container {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* Internet Explorer 10+ */
        }
        .timetable-container::-webkit-scrollbar {
          display: none; /* WebKit */
        }
        .timetable-grid {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* Internet Explorer 10+ */
        }
        .timetable-grid::-webkit-scrollbar {
          display: none; /* WebKit */
        }
      `}</style>
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden timetable-container ${isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : ''}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold">{timetable.title}</h3>
            {timetable.description && (
              <p className="text-blue-100 mt-1">{timetable.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCreateTimeblock}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              title="Add new activity"
            >
              <Plus className="w-4 h-4" />
              <span>Add Activity</span>
            </button>
            <button
              onClick={toggleFullscreen}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              title={isFullscreen ? 'Exit fullscreen view' : 'View in fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-200 w-4 h-4" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
            >
              <option value="All" className="text-gray-900">All Days</option>
              {DAYS.map(day => (
                <option key={day} value={day} className="text-gray-900">{day}</option>
              ))}
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              title="Toggle advanced filters"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Filter Results Info */}
        {(searchTerm || selectedDay !== 'All') && (
          <div className="mt-3 flex items-center space-x-2 text-blue-100 text-sm">
            <Info className="w-4 h-4" />
            <span>
              Showing {filteredTimeblocks.length} of {timetable.timeblocks.length} activities
              {searchTerm && ` matching "${searchTerm}"`}
              {selectedDay !== 'All' && ` on ${selectedDay}`}
            </span>
          </div>
        )}
      </div>

      {/* Timetable Grid */}
      <div className="p-3 sm:p-4 lg:p-6 overflow-y-auto timetable-grid" style={{ maxHeight: isFullscreen ? 'calc(100vh - 200px)' : '600px' }}>
        <div className="overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 sm:gap-3 min-w-[700px] sm:min-w-0">
          {/* Time column */}
          <div className="space-y-2">
            <div className="h-16 sm:h-20 flex items-center justify-center text-sm font-semibold text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 shadow-sm">
              Time
            </div>
            {Array.from({ length: 16 }, (_, i) => {
              const hour = i + 8 // Starting from 8 AM, going to 11 PM
              return (
                <div
                  key={hour}
                  className="h-14 sm:h-16 flex items-center justify-center text-xs sm:text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg shadow-sm"
                >
                  {hour}:00
                </div>
              )
            })}
          </div>

          {/* Day columns */}
          {timeblocksByDay.map(({ day, blocks }) => (
            <div key={day} className="space-y-2">
              <div className="h-16 sm:h-20 flex items-center justify-center text-xs sm:text-sm font-semibold text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 shadow-sm">
                {day.slice(0, 3)}
              </div>
              <div className="relative min-h-[1200px] sm:min-h-[1400px] bg-white border-2 border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <SortableContext items={blocks.map(block => block.id)} strategy={verticalListSortingStrategy}>
                  {blocks.map((block) => {
                    const isSmall = isSmallBlock(block.startTime, block.endTime)
                    return (
                      <SortableTimeBlock
                        key={block.id}
                        block={block}
                        isSmall={isSmall}
                        onView={handleViewTimeblock}
                        onEdit={handleEditTimeblock}
                        onDelete={handleDeleteTimeblock}
                        getTimeSlotTop={getTimeSlotTop}
                        getTimeSlotHeight={getTimeSlotHeight}
                        getEnhancedBackgroundColor={getEnhancedBackgroundColor}
                      />
                    )
                  })}
                </SortableContext>

                {/* Empty slots with enhanced + button */}
                {blocks.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      className="w-12 h-12 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all duration-200 hover:scale-110 shadow-lg hover:shadow-xl"
                      title="Add new activity"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
            </div>
          </DndContext>
        </div>
      </div>

      {/* Enhanced Stats */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="font-medium">
                {filteredTimeblocks.length} of {timetable.timeblocks.length} activities
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-green-600" />
              <span className="font-medium">
                {Math.round(
                  filteredTimeblocks.reduce((total: number, block: TimeBlock) => {
                    const start = new Date(`2000-01-01 ${block.startTime}`)
                    const end = new Date(`2000-01-01 ${block.endTime}`)
                    return total + (end.getTime() - start.getTime()) / (1000 * 60)
                  }, 0)
                )} minutes total
              </span>
            </div>
            {(searchTerm || selectedDay !== 'All') && (
              <div className="flex items-center space-x-2 text-blue-600">
                <Filter className="w-4 h-4" />
                <span className="font-medium">Filtered</span>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500 flex items-center space-x-2">
            <span>Created {new Date(timetable.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span>Last updated {new Date(timetable.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      {editingTimeblock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Edit Activity</h3>
                  <p className="text-sm text-gray-500 mt-1">Modify activity details and timing</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDeleteTimeblock(editingTimeblock.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete this activity"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity Title
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={editForm.startTime}
                      onChange={(e) => setEditForm(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={editForm.endTime}
                      onChange={(e) => setEditForm(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Week
                  </label>
                  <select
                    value={editForm.dayOfWeek}
                    onChange={(e) => setEditForm(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {DAYS.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={editForm.color}
                      onChange={(e) => setEditForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editForm.color}
                      onChange={(e) => setEditForm(prev => ({ ...prev, color: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      {creatingTimeblock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Create New Activity</h3>
                  <p className="text-sm text-gray-500 mt-1">Add a new activity to your timetable</p>
                </div>
                <button
                  onClick={handleCancelCreate}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity Title
                  </label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter activity title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter activity description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={createForm.startTime}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={createForm.endTime}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Week
                  </label>
                  <select
                    value={createForm.dayOfWeek}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {DAYS.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={createForm.color}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                    <input
                      type="text"
                      value={createForm.color}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, color: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={handleCancelCreate}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCreate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Create Activity</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingTimeblock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Activity Details</h3>
                  <p className="text-sm text-gray-500 mt-1">View complete activity information</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditTimeblock(viewingTimeblock)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit this activity"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTimeblock(viewingTimeblock.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete this activity"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleCloseView}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Activity Header */}
                <div className="flex items-start space-x-4">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                    style={{
                      backgroundColor: viewingTimeblock.color || '#3B82F6'
                    }}
                  ></div>
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">
                      {viewingTimeblock.title}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatTime(viewingTimeblock.startTime)} - {formatTime(viewingTimeblock.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{viewingTimeblock.dayOfWeek}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {viewingTimeblock.description && (
                  <div>
                    <h5 className="text-lg font-semibold text-gray-900 mb-2">Description</h5>
                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                      {viewingTimeblock.description}
                    </p>
                  </div>
                )}

                {/* Duration Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="text-lg font-semibold text-gray-900 mb-2">Duration</h5>
                  <p className="text-gray-700">
                    {Math.round(
                      (new Date(`2000-01-01 ${viewingTimeblock.endTime}`).getTime() -
                       new Date(`2000-01-01 ${viewingTimeblock.startTime}`).getTime()) / (1000 * 60)
                    )} minutes
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleCloseView}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleCloseView()
                      handleEditTimeblock(viewingTimeblock)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Activity</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}
