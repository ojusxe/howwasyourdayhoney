import '@testing-library/jest-dom'

// Mock global APIs
global.URL.createObjectURL = jest.fn(() => 'blob://test')
global.URL.revokeObjectURL = jest.fn()

// Mock ImageData
global.ImageData = class ImageData {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.data = new Uint8ClampedArray(width * height * 4)
  }
}

// Mock File and Blob
global.File = class File extends Blob {
  constructor(bits, name, options = {}) {
    super(bits, options)
    this.name = name
    this.lastModified = options.lastModified || Date.now()
  }
}

// Setup canvas mocks
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  drawImage: jest.fn(),
  getImageData: jest.fn(() => new ImageData(10, 10)),
  putImageData: jest.fn(),
}))

// Mock video element
HTMLVideoElement.prototype.load = jest.fn()
HTMLVideoElement.prototype.play = jest.fn(() => Promise.resolve())
HTMLVideoElement.prototype.pause = jest.fn()
