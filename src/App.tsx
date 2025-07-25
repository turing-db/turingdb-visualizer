import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-8">
              Vite + React
            </h1>
            <div className="card bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 max-w-md mx-auto">
              <button 
                onClick={() => setCount((count) => count + 1)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                count is {count}
              </button>
              <p className="text-white/80 mt-4">
                Edit <code className="bg-black/20 px-2 py-1 rounded">src/App.tsx</code> and save to test HMR
              </p>
            </div>
            <p className="text-white/60 mt-8">
              Click on the Vite and React logos to learn more
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default App