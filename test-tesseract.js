// Simple test to verify Tesseract.js works
const { HybridTimetableProcessor } = require('./src/lib/hybrid-processor.ts')

async function testTesseract() {
  console.log('🧪 Testing Tesseract initialization...')

  try {
    const processor = HybridTimetableProcessor.getInstance()
    console.log('✅ HybridTimetableProcessor instance created')

    // Test with a simple image (you can replace with any test image)
    const result = await processor.processImage('./test-image.png')
    console.log('✅ Tesseract processing completed')
    console.log('📊 Result:', result)
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testTesseract()
