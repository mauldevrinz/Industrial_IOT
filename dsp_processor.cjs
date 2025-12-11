const FFT = require('fft-js').fft;
const util = require('fft-js').util;

/**
 * DSP Processor for Edge Impulse Spectral Analysis
 * Extracts spectral features from raw sensor data
 */
class DSPProcessor {
  constructor(config = {}) {
    this.sampleRate = config.sampleRate || 10; // Hz
    this.frameLength = config.frameLength || 270; // samples
    this.frameLengthPower2 = config.frameLengthPower2 || 256; // next power of 2
    this.axisCount = config.axisCount || 9;
    this.expectedFeatures = config.expectedFeatures || 9729;
  }

  /**
   * Process raw sensor data and extract spectral features
   * @param {Array} rawData - Flat array of sensor values [ax1, ay1, az1, ax2, ay2, az2, gx, gy, gz, ...]
   * @returns {Array} - Processed features ready for model
   */
  processSpectralFeatures(rawData) {
    // Reshape data: split into 9 separate axis arrays
    const axisData = this.reshapeToAxes(rawData);
    
    // Extract features from each axis
    const allFeatures = [];
    
    for (let axis = 0; axis < this.axisCount; axis++) {
      const axisValues = axisData[axis];
      
      // Pad or truncate to frame length
      const paddedValues = this.padOrTruncate(axisValues, this.frameLength);
      
      // Extract spectral features for this axis
      const features = this.extractSpectralFeatures(paddedValues);
      
      allFeatures.push(...features);
    }
    
    // Pad to expected feature count if needed
    while (allFeatures.length < this.expectedFeatures) {
      allFeatures.push(0);
    }
    
    return allFeatures.slice(0, this.expectedFeatures);
  }

  /**
   * Reshape flat array to per-axis arrays
   */
  reshapeToAxes(flatData) {
    const axes = Array(this.axisCount).fill(0).map(() => []);
    
    for (let i = 0; i < flatData.length; i += this.axisCount) {
      for (let axis = 0; axis < this.axisCount; axis++) {
        if (i + axis < flatData.length) {
          axes[axis].push(flatData[i + axis]);
        }
      }
    }
    
    return axes;
  }

  /**
   * Pad or truncate array to target length
   */
  padOrTruncate(arr, targetLength) {
    if (arr.length >= targetLength) {
      return arr.slice(0, targetLength);
    }
    
    // Pad with zeros
    const padded = [...arr];
    while (padded.length < targetLength) {
      padded.push(0);
    }
    return padded;
  }

  /**
   * Extract spectral features from single axis data
   */
  extractSpectralFeatures(samples) {
    const features = [];
    
    // 1. Time domain features
    features.push(...this.extractTimeDomainFeatures(samples));
    
    // 2. Frequency domain features (FFT)
    features.push(...this.extractFrequencyFeatures(samples));
    
    // 3. Statistical features
    features.push(...this.extractStatisticalFeatures(samples));
    
    return features;
  }

  /**
   * Time domain features
   */
  extractTimeDomainFeatures(samples) {
    const features = [];
    
    // Mean
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    features.push(mean);
    
    // RMS (Root Mean Square)
    const rms = Math.sqrt(samples.reduce((a, b) => a + b * b, 0) / samples.length);
    features.push(rms);
    
    // Standard deviation
    const variance = samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / samples.length;
    const std = Math.sqrt(variance);
    features.push(std);
    
    // Min, Max
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    features.push(min, max);
    
    // Peak-to-peak
    features.push(max - min);
    
    // Kurtosis (measure of "tailedness")
    const kurtosis = samples.reduce((a, b) => a + Math.pow(b - mean, 4), 0) / 
                     (samples.length * Math.pow(std, 4)) - 3;
    features.push(kurtosis);
    
    // Skewness (measure of asymmetry)
    const skewness = samples.reduce((a, b) => a + Math.pow(b - mean, 3), 0) / 
                     (samples.length * Math.pow(std, 3));
    features.push(skewness);
    
    return features;
  }

  /**
   * Frequency domain features using FFT
   */
  extractFrequencyFeatures(samples) {
    const features = [];
    
    // Pad to next power of 2 for efficient FFT
    const paddedSamples = this.padOrTruncate(samples, this.frameLengthPower2);
    
    // Compute FFT
    const phasors = FFT(paddedSamples);
    const magnitudes = util.fftMag(phasors);
    
    // Only use first half (Nyquist frequency)
    const halfMag = magnitudes.slice(0, Math.floor(magnitudes.length / 2));
    
    // Spectral centroid (center of mass of spectrum)
    let weightedSum = 0;
    let totalMag = 0;
    for (let i = 0; i < halfMag.length; i++) {
      weightedSum += i * halfMag[i];
      totalMag += halfMag[i];
    }
    const spectralCentroid = totalMag > 0 ? weightedSum / totalMag : 0;
    features.push(spectralCentroid);
    
    // Spectral energy
    const spectralEnergy = halfMag.reduce((a, b) => a + b * b, 0);
    features.push(spectralEnergy);
    
    // Spectral entropy
    const totalEnergy = halfMag.reduce((a, b) => a + b, 0);
    let entropy = 0;
    if (totalEnergy > 0) {
      for (let i = 0; i < halfMag.length; i++) {
        const prob = halfMag[i] / totalEnergy;
        if (prob > 0) {
          entropy -= prob * Math.log2(prob);
        }
      }
    }
    features.push(entropy);
    
    // Dominant frequency
    let maxMag = 0;
    let dominantIdx = 0;
    for (let i = 0; i < halfMag.length; i++) {
      if (halfMag[i] > maxMag) {
        maxMag = halfMag[i];
        dominantIdx = i;
      }
    }
    const dominantFreq = dominantIdx * this.sampleRate / this.frameLengthPower2;
    features.push(dominantFreq);
    
    // Add top 10 FFT magnitudes as features
    const sortedMag = [...halfMag].sort((a, b) => b - a);
    features.push(...sortedMag.slice(0, 10));
    
    // Frequency band powers (divide spectrum into bands)
    const numBands = 8;
    const bandSize = Math.floor(halfMag.length / numBands);
    for (let band = 0; band < numBands; band++) {
      const start = band * bandSize;
      const end = start + bandSize;
      const bandPower = halfMag.slice(start, end).reduce((a, b) => a + b * b, 0);
      features.push(bandPower);
    }
    
    return features;
  }

  /**
   * Statistical features
   */
  extractStatisticalFeatures(samples) {
    const features = [];
    
    // Zero crossing rate
    let zeroCrossings = 0;
    for (let i = 1; i < samples.length; i++) {
      if ((samples[i] >= 0 && samples[i - 1] < 0) || 
          (samples[i] < 0 && samples[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    features.push(zeroCrossings / samples.length);
    
    // Mean absolute deviation
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const mad = samples.reduce((a, b) => a + Math.abs(b - mean), 0) / samples.length;
    features.push(mad);
    
    // Interquartile range (IQR)
    const sorted = [...samples].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(samples.length * 0.25)];
    const q3 = sorted[Math.floor(samples.length * 0.75)];
    features.push(q3 - q1);
    
    return features;
  }

  /**
   * Get total expected feature count for debugging
   */
  getExpectedFeatureCount() {
    // Calculate based on feature extraction methods
    const timeDomain = 8; // mean, rms, std, min, max, p2p, kurtosis, skewness
    const freqDomain = 1 + 1 + 1 + 1 + 10 + 8; // centroid, energy, entropy, dominant, top10, 8bands = 22
    const statistical = 3; // zcr, mad, iqr
    
    const perAxisFeatures = timeDomain + freqDomain + statistical; // 33 per axis
    const totalFeatures = perAxisFeatures * this.axisCount; // 33 * 9 = 297
    
    return totalFeatures;
  }
}

module.exports = DSPProcessor;
