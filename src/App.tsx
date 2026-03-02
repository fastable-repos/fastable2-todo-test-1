import { useState, useEffect, useCallback } from 'react'

interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

const STORAGE_KEY = 'todos'

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Todo[]
  } catch (err) {
    console.error('Failed to load todos from localStorage:', err)
    return []
  }
}

function saveTodos(todos: Todo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  } catch (err) {
    console.error('Failed to save todos to localStorage:', err)
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(() => loadTodos())
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    saveTodos(todos)
  }, [todos])

  const addTodo = useCallback(() => {
    const trimmed = inputValue.trim()
    if (!trimmed) return

    const newTodo: Todo = {
      id: generateId(),
      text: trimmed,
      completed: false,
      createdAt: new Date().toISOString(),
    }

    setTodos((prev) => [newTodo, ...prev])
    setInputValue('')
  }, [inputValue])

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    )
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addTodo()
    }
  }

  const isInputEmpty = inputValue.trim().length === 0

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center pt-16 px-4 pb-16">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-8 pb-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800 mb-5 tracking-tight">
            SimpleTodo
          </h1>

          {/* Input row */}
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a new todo..."
              aria-label="New todo input"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
            />
            <button
              onClick={addTodo}
              disabled={isInputEmpty}
              aria-label="Add todo"
              className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
            >
              Add
            </button>
          </div>
        </div>

        {/* Todo list */}
        <div className="divide-y divide-gray-100">
          {todos.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-400 text-sm">No todos yet. Add one above!</p>
            </div>
          ) : (
            <ul>
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors group"
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    aria-label={`Mark "${todo.text}" as ${todo.completed ? 'incomplete' : 'complete'}`}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-500 accent-indigo-500 cursor-pointer flex-shrink-0"
                  />

                  {/* Todo text */}
                  <span
                    className={`flex-1 text-sm leading-relaxed transition-all ${
                      todo.completed
                        ? 'line-through text-gray-400'
                        : 'text-gray-800'
                    }`}
                  >
                    {todo.text}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
