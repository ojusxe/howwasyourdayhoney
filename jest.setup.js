import '@testing-library/jest-dom'

// Mock global APIs for client-side processing
global.URL.createObjectURL = jest.fn(() => 'blob://test')
global.URL.revokeObjectURL = jest.fn()

// Mock WebAssembly for FFmpeg.wasm
global.WebAssembly = {
  instantiate: jest.fn(),
  compile: jest.fn(),
  Module: jest.fn()
}

// Mock SharedArrayBuffer
global.SharedArrayBuffer = ArrayBuffer

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

// Mock createImageBitmap
global.createImageBitmap = jest.fn(() => Promise.resolve({
  width: 100,
  height: 100,
  close: jest.fn()
}))

// Mock OffscreenCanvas
global.OffscreenCanvas = jest.fn(() => ({
  getContext: jest.fn(() => ({
    drawImage: jest.fn(),
    getImageData: jest.fn(() => new ImageData(100, 100)),
    putImageData: jest.fn(),
  }))
}))

// Setup canvas mocks
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  drawImage: jest.fn(),
  getImageData: jest.fn(() => new ImageData(10, 10)),
  putImageData: jest.fn(),
}))

// Mock document for canvas fallback
global.document = {
  createElement: jest.fn(() => ({
    width: 0,
    height: 0,
    getContext: jest.fn(() => ({
      drawImage: jest.fn(),
      getImageData: jest.fn(() => new ImageData(100, 100)),
      putImageData: jest.fn(),
    }))
  }))
}
