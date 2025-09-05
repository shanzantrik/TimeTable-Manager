'use client'

import { useState, useEffect } from 'react'
import { Trash2, Eye, Calendar, RefreshCw } from 'lucide-react'
import { Timetable } from '@/types'

interface TimetableListProps {
  onSelectTimetable: (timetable: Timetable) => void
  onDeleteTimetable: (id: string) => void
}

export default function TimetableList({ onSelectTimetable, onDeleteTimetable }: TimetableListProps) {
  const [timetables, setTimetables] = useState<Timetable[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchTimetables()
  }, [])

  const fetchTimetables = async () => {
    try {
      const response = await fetch('/api/timetables')
      if (response.ok) {
        const data = await response.json()
        setTimetables(data.timetables || [])
      }
    } catch (error) {
      console.error('Error fetching timetables:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this timetable?')) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/timetables/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTimetables(prev => prev.filter(t => t.id !== id))
        onDeleteTimetable(id)
      } else {
        alert('Failed to delete timetable')
      }
    } catch (error) {
      console.error('Error deleting timetable:', error)
      alert('Failed to delete timetable')
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (timetables.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Timetables Yet</h3>
        <p className="text-gray-500">Upload a timetable file to get started!</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Your Timetables</h2>
            <p className="text-sm text-gray-500">{timetables.length} timetable{timetables.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={fetchTimetables}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh timetables"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="divide-y">
        {timetables.map((timetable) => (
          <div key={timetable.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {timetable.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {timetable.description}
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-400">
                  <Calendar className="w-3 h-3 mr-1" />
                  Created {formatDate(timetable.createdAt)}
                  <span className="mx-2">•</span>
                  {timetable.timeblocks.length} activities
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => onSelectTimetable(timetable)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </button>

                <button
                  onClick={() => handleDelete(timetable.id)}
                  disabled={deleting === timetable.id}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting === timetable.id ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-1"></div>
                  ) : (
                    <Trash2 className="w-4 h-4 mr-1" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
