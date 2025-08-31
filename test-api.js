#!/usr/bin/env node

// Test script to debug the API endpoint
const fs = require('fs');
const path = require('path');

async function testAPI() {
  try {
    console.log('Testing Ghostty API endpoint...');
    
    // Read the test video file
    const videoPath = path.join(process.cwd(), 'test-video.mp4');
    if (!fs.existsSync(videoPath)) {
      console.error('test-video.mp4 not found');
      return;
    }
    
    const videoBuffer = fs.readFileSync(videoPath);
    console.log(`Video file size: ${videoBuffer.length} bytes`);
    
    // Create FormData
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('video', videoBuffer, {
      filename: 'test-video.mp4',
      contentType: 'video/mp4'
    });
    
    // Test the API
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('http://localhost:3000/api/process-ghostty', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', result);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAPI();
