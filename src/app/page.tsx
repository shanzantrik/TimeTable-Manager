'use client'

import { useState, useEffect } from 'react'
import { Upload, Calendar, Clock, Users, FileText, Sparkles, Database } from 'lucide-react'
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

        {/* Animated Workflow System */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Hybrid AI Processing Workflow</h3>
            <p className="text-gray-600">Advanced OCR + Multi-LLM Intelligence for Perfect Extraction</p>
          </div>

          <div className="relative">
            {/* Workflow Steps */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              {/* Step 1: Upload */}
              <div className="workflow-step group">
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-xl hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto animate-bounce">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2 text-center">Upload Document</h4>
                  <p className="text-sm text-gray-600 text-center">Images, PDFs, Word docs</p>
                </div>
              </div>

              {/* Arrow 1 */}
              <div className="hidden md:flex justify-center">
                <div className="arrow-right animate-pulse">
                  <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Step 2: OCR Processing */}
              <div className="workflow-step group">
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200 hover:border-purple-400 transition-all duration-300 hover:shadow-xl hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 mx-auto animate-pulse">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2 text-center">Tesseract OCR</h4>
                  <p className="text-sm text-gray-600 text-center">Text extraction & analysis</p>
                </div>
              </div>

              {/* Arrow 2 */}
              <div className="hidden md:flex justify-center">
                <div className="arrow-right animate-pulse" style={{ animationDelay: '0.5s' }}>
                  <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Step 3: Multi-LLM Processing */}
              <div className="workflow-step group">
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-200 hover:border-green-400 transition-all duration-300 hover:shadow-xl hover:scale-105">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 mx-auto animate-spin">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2 text-center">AI Intelligence</h4>
                  <p className="text-sm text-gray-600 text-center">OpenAI • Claude • Gemini</p>
                </div>
              </div>
            </div>

            {/* Processing Details Row */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* LLM Providers */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <h5 className="text-lg font-semibold text-gray-900 mb-4 text-center">Multi-LLM Processing</h5>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 animate-pulse">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">O</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">OpenAI GPT-4o-mini</span>
                  </div>
                  <div className="flex items-center space-x-3 animate-pulse" style={{ animationDelay: '0.2s' }}>
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">C</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Claude 3.5 Sonnet</span>
                  </div>
                  <div className="flex items-center space-x-3 animate-pulse" style={{ animationDelay: '0.4s' }}>
                    <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">G</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Gemini 1.5 Flash</span>
                  </div>
                </div>
              </div>

              {/* Database Storage */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <h5 className="text-lg font-semibold text-gray-900 mb-4 text-center">Database Storage</h5>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 mx-auto animate-bounce">
                    <Database className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm text-gray-700 font-medium">SQLite Database</p>
                  <p className="text-xs text-gray-600 mt-1">Structured data storage</p>
                </div>
              </div>

              {/* Final Display */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <h5 className="text-lg font-semibold text-gray-900 mb-4 text-center">Beautiful Display</h5>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 mx-auto animate-pulse">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm text-gray-700 font-medium">Interactive Timetable</p>
                  <p className="text-xs text-gray-600 mt-1">Real-time editing & management</p>
                </div>
              </div>
            </div>

            {/* Workflow Flow Indicator */}
            <div className="mt-8 flex justify-center">
              <div className="processing-flow rounded-full px-8 py-4 text-white font-bold text-lg shadow-lg">
                🔄 Continuous Processing Pipeline
              </div>
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
