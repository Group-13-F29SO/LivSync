/**
 * Math Helper Utilities for Biometric Data Generation
 * Provides functions for variance, smoothing, clamping, and noise generation
 */

/**
 * Add random variance to a value
 * @param {number} value - Base value
 * @param {number} percentageVariance - Variance percentage (e.g., 10 for ±10%)
 * @returns {number} Value with variance applied
 */
function addRandomVariance(value, percentageVariance = 5) {
  const variance = (Math.random() - 0.5) * 2 * (value * percentageVariance / 100);
  return value + variance;
}

/**
 * Clamp a value between min and max bounds
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} t - Progress (0 to 1)
 * @returns {number} Interpolated value
 */
function lerp(start, end, t) {
  return start + (end - start) * t;
}

/**
 * Smooth value using exponential moving average
 * @param {number} currentValue - Current value
 * @param {number} previousValue - Previous value
 * @param {number} smoothingFactor - Smoothing factor (0 to 1, higher = more smooth)
 * @returns {number} Smoothed value
 */
function smoothValue(currentValue, previousValue, smoothingFactor = 0.3) {
  return previousValue * (1 - smoothingFactor) + currentValue * smoothingFactor;
}

/**
 * Generate random noise within a range
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random value between min and max
 */
function generateNoise(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Generate random integer within a range
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {number} Random integer between min and max
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate Perlin-like noise using sine wave for smoother variations
 * @param {number} time - Time value (0-1 for smooth progression)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Smoothed noise value
 */
function perlinNoise(time, min, max) {
  const value = (Math.sin(time * Math.PI * 2) + 1) / 2; // Convert sin to 0-1 range
  return min + value * (max - min);
}

/**
 * Apply smoothing with occasional spikes for activity bursts
 * @param {number} baseValue - Base value
 * @param {number} spikeChance - Probability of spike (0 to 1)
 * @param {number} spikeMultiplier - How much to spike (1.5 = 50% increase)
 * @returns {number} Value with potential spike
 */
function applyActivitySpike(baseValue, spikeChance = 0.1, spikeMultiplier = 1.3) {
  if (Math.random() < spikeChance) {
    return baseValue * spikeMultiplier;
  }
  return baseValue;
}

/**
 * Round to desired decimal places
 * @param {number} value - Value to round
 * @param {number} decimals - Number of decimal places (default 2)
 * @returns {number} Rounded value
 */
function roundTo(value, decimals = 2) {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

module.exports = {
  addRandomVariance,
  clamp,
  lerp,
  smoothValue,
  generateNoise,
  getRandomInt,
  perlinNoise,
  applyActivitySpike,
  roundTo
};
