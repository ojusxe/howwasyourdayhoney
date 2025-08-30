import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock fetch globally
global.fetch = jest.fn()

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
}

// Mock File API
global.File = class MockFile {
  constructor(chunks, filename, options = {}) {
    this.chunks = chunks
    this.name = filename
    this.type = options.type || ''
    this.size = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    this.lastModified = options.lastModified || Date.now()
  }
}

// Mock Blob API
global.Blob = class MockBlob {
  constructor(chunks = [], options = {}) {
    this.chunks = chunks
    this.type = options.type || ''
    this.size = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
  }
}

// Mock FormData API
global.FormData = class MockFormData {
  constructor() {
    this.data = new Map()
  }
  
  append(key, value) {
    if (this.data.has(key)) {
      const existing = this.data.get(key)
      if (Array.isArray(existing)) {
        existing.push(value)
      } else {
        this.data.set(key, [existing, value])
      }
    } else {
      this.data.set(key, value)
    }
  }
  
  get(key) {
    const value = this.data.get(key)
    return Array.isArray(value) ? value[0] : value
  }
  
  getAll(key) {
    const value = this.data.get(key)
    return Array.isArray(value) ? value : [value]
  }
  
  has(key) {
    return this.data.has(key)
  }
  
  delete(key) {
    this.data.delete(key)
  }
}

// Mock ImageData
global.ImageData = class MockImageData {
  constructor(data, width, height) {
    if (data instanceof Uint8ClampedArray) {
      this.data = data
      this.width = width
      this.height = height || data.length / (width * 4)
    } else {
      // data is width, width is height
      this.width = data
      this.height = width
      this.data = new Uint8ClampedArray(data * width * 4)
    }
    this.colorSpace = 'srgb'
  }
}

// Mock console methods for cleaner test output
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps has been renamed')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
  
  // Clear any timers
  jest.clearAllTimers()
  
  // Reset fetch mock
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear()
  }
})