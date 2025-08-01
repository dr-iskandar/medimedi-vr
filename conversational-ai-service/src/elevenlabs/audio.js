const { Logger } = require('../utils/logger');

class AudioProcessor {
  constructor() {
    this.logger = new Logger();
  }

  // Convert audio buffer to format expected by ElevenLabs
  processAudioInput(audioBuffer, format = 'wav') {
    try {
      // Validate audio buffer
      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error('Invalid audio buffer');
      }

      // For now, we'll pass through the audio buffer
      // In production, you might want to:
      // - Convert sample rate to 16kHz
      // - Ensure mono channel
      // - Apply noise reduction
      // - Normalize volume levels
      
      this.logger.debug(`Processing audio input: ${audioBuffer.length} bytes`);
      
      return {
        data: audioBuffer,
        format: format,
        sampleRate: 16000,
        channels: 1,
        bitDepth: 16
      };
    } catch (error) {
      this.logger.error('Error processing audio input:', error);
      throw error;
    }
  }

  // Process audio output from ElevenLabs
  processAudioOutput(audioData) {
    try {
      if (!audioData) {
        throw new Error('No audio data received');
      }

      this.logger.debug(`Processing audio output: ${audioData.length} bytes`);
      
      // Convert to format suitable for Unity
      return {
        data: audioData,
        format: 'wav',
        sampleRate: 22050, // ElevenLabs default
        channels: 1,
        bitDepth: 16,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Error processing audio output:', error);
      throw error;
    }
  }

  // Validate audio format
  validateAudioFormat(audioData, expectedFormat = 'wav') {
    try {
      // Basic validation
      if (!audioData || typeof audioData !== 'object') {
        return false;
      }

      // Check for required properties
      const requiredProps = ['data', 'format', 'sampleRate'];
      for (const prop of requiredProps) {
        if (!(prop in audioData)) {
          this.logger.warn(`Missing audio property: ${prop}`);
          return false;
        }
      }

      // Check format
      if (audioData.format !== expectedFormat) {
        this.logger.warn(`Unexpected audio format: ${audioData.format}, expected: ${expectedFormat}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Error validating audio format:', error);
      return false;
    }
  }

  // Convert base64 audio to buffer
  base64ToBuffer(base64Audio) {
    try {
      // Remove data URL prefix if present
      const base64Data = base64Audio.replace(/^data:audio\/[a-z]+;base64,/, '');
      return Buffer.from(base64Data, 'base64');
    } catch (error) {
      this.logger.error('Error converting base64 to buffer:', error);
      throw error;
    }
  }

  // Convert buffer to base64
  bufferToBase64(buffer, mimeType = 'audio/wav') {
    try {
      const base64 = buffer.toString('base64');
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      this.logger.error('Error converting buffer to base64:', error);
      throw error;
    }
  }

  // Get audio duration (approximate)
  getAudioDuration(audioBuffer, sampleRate = 16000, channels = 1, bitDepth = 16) {
    try {
      const bytesPerSample = bitDepth / 8;
      const totalSamples = audioBuffer.length / (bytesPerSample * channels);
      const duration = totalSamples / sampleRate;
      
      return Math.round(duration * 1000) / 1000; // Round to 3 decimal places
    } catch (error) {
      this.logger.error('Error calculating audio duration:', error);
      return 0;
    }
  }
}

module.exports = { AudioProcessor };