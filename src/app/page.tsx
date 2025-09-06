'use client'

import { useState, useEffect } from 'react'
import { Upload, Calendar, Clock, Users, FileText, Sparkles, Database, Brain } from 'lucide-react'
import FileUpload from '@/components/FileUpload'
import TimetableGrid from '@/components/TimetableGrid'
import TimetableList from '@/components/TimetableList'
import { Timetable } from '@/types'
import { sampleTimetable } from '@/lib/sample-data'

export default function Home() {
  const [timetables, setTimetables] = useState<Timetable[]>([])
  const [selectedTimetable, setSelectedTimetable] = useState<Timetable | null>(null)

  useEffect(() => {
    fetchTimetables()
  }, [])

  const fetchTimetables = async () => {
    try {
      const response = await fetch('/api/timetables')
      const data = await response.json()
      if (data.success) {
        setTimetables(data.timetables)
        if (data.timetables.length > 0) {
          setSelectedTimetable(data.timetables[0])
        }
      } else {
        // Fallback to sample data if no timetables exist
        setTimetables([sampleTimetable])
        setSelectedTimetable(sampleTimetable)
      }
    } catch (error) {
      console.error('Error fetching timetables:', error)
      // Fallback to sample data on error
      setTimetables([sampleTimetable])
      setSelectedTimetable(sampleTimetable)
    } finally {
      // Loading completed
    }
  }

  const handleTimetableCreated = (newTimetable: Timetable) => {
    setTimetables(prev => [newTimetable, ...prev])
    setSelectedTimetable(newTimetable)
  }

  const handleTimetableDeleted = (deletedId: string) => {
    setTimetables(prev => prev.filter(t => t.id !== deletedId))
    if (selectedTimetable?.id === deletedId) {
      setSelectedTimetable(timetables.length > 1 ? timetables[1] : null)
    }
  }

  const handleSelectTimetable = (timetable: Timetable) => {
    setSelectedTimetable(timetable)
  }

  const handleTimetableUpdated = async (timetableId: string) => {
    try {
      const response = await fetch(`/api/timetables/${timetableId}`)
      const data = await response.json()
      if (data.success) {
        const updatedTimetable = data.timetable
        setTimetables(prev =>
          prev.map(t => t.id === timetableId ? updatedTimetable : t)
        )
        if (selectedTimetable?.id === timetableId) {
          setSelectedTimetable(updatedTimetable)
        }
      }
    } catch (error) {
      console.error('Error updating timetable:', error)
    }
  }

  return (
    <>
      <style jsx>{`
        @keyframes flow {
          0% { transform: translateX(-10px); opacity: 0.5; }
          50% { transform: translateX(10px); opacity: 1; }
          100% { transform: translateX(-10px); opacity: 0.5; }
        }

        @keyframes glow {
          0% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(147, 51, 234, 0.6); }
          100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
        }

        .workflow-step:hover {
          animation: glow 2s ease-in-out infinite;
        }

        .arrow-right {
          animation: flow 2s ease-in-out infinite;
        }

        .processing-flow {
          background: linear-gradient(45deg, #3b82f6, #8b5cf6, #10b981, #f59e0b);
          background-size: 400% 400%;
          animation: gradientShift 3s ease infinite;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Timetable Manager</h1>
                <p className="text-sm text-gray-500">AI-Powered Schedule Extraction</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>Teachers</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Transform Your Timetables
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upload your timetable documents and let AI extract, organize, and display your schedule beautifully.
            Works with images, PDFs, and Word documents.
          </p>
        </div>

        {/* Compact 7-Box Workflow System */}
        <div className="mb-12">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Hybrid AI Processing Workflow</h3>
            <p className="text-gray-600 text-sm">Complete pipeline from upload to interactive display</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
            {/* Step 1: Upload */}
            <div className="workflow-step group">
              <div className="bg-white rounded-xl p-3 shadow-lg border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-2 mx-auto animate-bounce">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-xs font-bold text-gray-900 mb-1 text-center">Upload</h4>
                <p className="text-xs text-gray-600 text-center">Images, PDFs</p>
              </div>
            </div>

            {/* Step 2: Tesseract OCR */}
            <div className="workflow-step group">
              <div className="bg-white rounded-xl p-3 shadow-lg border-2 border-purple-200 hover:border-purple-400 transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-2 mx-auto animate-pulse">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-xs font-bold text-gray-900 mb-1 text-center">Tesseract OCR</h4>
                <p className="text-xs text-gray-600 text-center">Text extraction</p>
              </div>
            </div>

            {/* Step 3: RAG System */}
            <div className="workflow-step group">
              <div className="bg-white rounded-xl p-3 shadow-lg border-2 border-orange-200 hover:border-orange-400 transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-2 mx-auto animate-pulse">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-xs font-bold text-gray-900 mb-1 text-center">RAG System</h4>
                <p className="text-xs text-gray-600 text-center">PDF processing</p>
              </div>
            </div>

            {/* Step 4: AI Intelligence */}
            <div className="workflow-step group">
              <div className="bg-white rounded-xl p-3 shadow-lg border-2 border-green-200 hover:border-green-400 transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-2 mx-auto animate-spin">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-xs font-bold text-gray-900 mb-1 text-center">AI Intelligence</h4>
                <p className="text-xs text-gray-600 text-center">Claude • Gemini</p>
              </div>
            </div>

            {/* Step 5: Database Storage */}
            <div className="workflow-step group">
              <div className="bg-white rounded-xl p-3 shadow-lg border-2 border-indigo-200 hover:border-indigo-400 transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-2 mx-auto animate-bounce">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-xs font-bold text-gray-900 mb-1 text-center">Database</h4>
                <p className="text-xs text-gray-600 text-center">SQLite storage</p>
              </div>
            </div>

            {/* Step 6: Beautiful Display */}
            <div className="workflow-step group">
              <div className="bg-white rounded-xl p-3 shadow-lg border-2 border-emerald-200 hover:border-emerald-400 transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mb-2 mx-auto animate-pulse">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-xs font-bold text-gray-900 mb-1 text-center">Display</h4>
                <p className="text-xs text-gray-600 text-center">Interactive UI</p>
              </div>
            </div>

            {/* Step 7: Management */}
            <div className="workflow-step group">
              <div className="bg-white rounded-xl p-3 shadow-lg border-2 border-rose-200 hover:border-rose-400 transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-rose-600 rounded-lg flex items-center justify-center mb-2 mx-auto animate-pulse">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-xs font-bold text-gray-900 mb-1 text-center">Management</h4>
                <p className="text-xs text-gray-600 text-center">Edit & manage</p>
              </div>
            </div>
          </div>

          {/* Workflow Flow Indicator */}
          <div className="mt-6 flex justify-center">
            <div className="processing-flow rounded-full px-6 py-3 text-white font-bold text-sm shadow-lg">
              🔄 Complete Processing Pipeline
            </div>
          </div>
        </div>

        {/* Main Content - Single Column Layout */}
        <div className="space-y-8">
          {/* Upload and Timetable List Row */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Upload Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Timetable</h3>
              <FileUpload onTimetableCreated={handleTimetableCreated} />
            </div>

            {/* Timetable List */}
            <div>
              <TimetableList
                onSelectTimetable={handleSelectTimetable}
                onDeleteTimetable={handleTimetableDeleted}
              />
            </div>
          </div>

          {/* Selected Timetable Display - Full Width */}
          {selectedTimetable && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Timetable View</h3>
                <div className="text-sm text-gray-500">
                  {selectedTimetable.timeblocks.length} activities
                </div>
              </div>
                                  <TimetableGrid
                      timetable={selectedTimetable}
                      onTimetableUpdated={handleTimetableUpdated}
                    />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>© 2025 Timetable Manager. Developed by Shantanu Goswami.</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}
