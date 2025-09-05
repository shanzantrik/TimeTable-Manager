export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">CSS Test Page</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <div className="w-6 h-6 bg-blue-600 rounded"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Card 1</h3>
            <p className="text-gray-600">This is a test card to verify Tailwind CSS is working properly.</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <div className="w-6 h-6 bg-purple-600 rounded"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Card 2</h3>
            <p className="text-gray-600">Another test card with different colors and styling.</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <div className="w-6 h-6 bg-green-600 rounded"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Card 3</h3>
            <p className="text-gray-600">Third test card to complete the grid layout.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Timetable Grid Test</h2>
          <div className="grid grid-cols-8 gap-2">
            <div className="space-y-1">
              <div className="h-16 flex items-center justify-center text-sm font-medium text-gray-500 bg-gray-50 rounded-lg">
                Time
              </div>
              {Array.from({ length: 5 }, (_, i) => {
                const hour = i + 8
                return (
                  <div
                    key={hour}
                    className="h-16 flex items-center justify-center text-sm text-gray-500 border-b border-gray-100"
                  >
                    {hour}:00
                  </div>
                )
              })}
            </div>

            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
              <div key={day} className="space-y-1">
                <div className="h-16 flex items-center justify-center text-sm font-medium text-gray-700 bg-gray-50 rounded-lg">
                  {day}
                </div>
                <div className="relative min-h-[400px] border border-gray-100 rounded-lg">
                  <div className="absolute left-1 right-1 top-4 rounded-lg p-3 text-white text-sm shadow-sm bg-blue-500">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-2 h-2 bg-white/30 rounded-full"></div>
                      <p className="font-semibold">Sample Class</p>
                    </div>
                    <p className="text-xs opacity-90">9:00 AM - 10:00 AM</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
