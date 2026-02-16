/**
 * Biometric Data Generator - Main Orchestrator
 * Coordinates all metric generators and handles database insertion
 */

const StepsGenerator = require('../generators/stepsGenerator');
const HeartRateGenerator = require('../generators/heartRateGenerator');
const CaloriesGenerator = require('../generators/caloriesGenerator');
const SleepGenerator = require('../generators/sleepGenerator');
const HydrationGenerator = require('../generators/hydrationGenerator');
const BloodGlucoseGenerator = require('../generators/bloodGlucoseGenerator');

const { validateCompleteDataset } = require('../utils/dataValidation');

class BiometricDataGenerator {
  constructor(prisma) {
    this.prisma = prisma;

    // Initialize all generators
    this.generators = {
      steps: new StepsGenerator(),
      heart_rate: new HeartRateGenerator(),
      calories: new CaloriesGenerator(),
      sleep: new SleepGenerator(),
      hydration: new HydrationGenerator(),
      blood_glucose: new BloodGlucoseGenerator()
    };
  }

  /**
   * Generate biometric data for a patient and date
   * @param {string} patientId - Patient UUID
   * @param {Date|string} date - Date to generate for (defaults to today)
   * @returns {Promise<Object>} Result object with generation stats
   */
  async generate(patientId, date = new Date()) {
    try {
      // Normalize date
      if (typeof date === 'string') {
        date = new Date(date);
      }
      date.setHours(0, 0, 0, 0);

      // Step 1: Generate data for all metrics
      const allData = [];
      const generationStartTime = Date.now();

      for (const [metricName, generator] of Object.entries(this.generators)) {
        const metricData = generator.generate(date);

        // Add patient_id to each point
        metricData.forEach(point => {
          point.patient_id = patientId;
        });

        allData.push(...metricData);
      }

      // Step 2: Validate all data
      validateCompleteDataset(allData);

      // Step 3: Save to database
      await this.saveToDatabase(allData);

      const generationEndTime = Date.now();

      // Return success result
      return {
        success: true,
        patient_id: patientId,
        date: date.toISOString().split('T')[0],
        data_points_generated: allData.length,
        metrics_count: Object.keys(this.generators).length,
        start_time: date.toISOString(),
        end_time: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000 - 5 * 60 * 1000).toISOString(),
        generation_time_ms: generationEndTime - generationStartTime,
        breakdown: this.countByMetric(allData)
      };
    } catch (error) {
      throw new Error(`Biometric data generation failed: ${error.message}`);
    }
  }

  /**
   * Save generated data to database using batch insert
   * @param {Array<Object>} data - Array of data points
   * @returns {Promise<void>}
   */
  async saveToDatabase(data) {
    if (!data || data.length === 0) {
      throw new Error('No data to save to database');
    }

    try {
      // Use Prisma createMany for batch insertion
      await this.prisma.biometric_data.createMany({
        data: data,
        skipDuplicates: false // Fail if duplicates exist
      });
    } catch (error) {
      // If createMany isn't available, try individual inserts with transaction
      if (error.message.includes('createMany')) {
        await this.saveWithTransaction(data);
      } else {
        throw new Error(`Database insertion failed: ${error.message}`);
      }
    }
  }

  /**
   * Fallback: Save data with transaction for atomicity
   * @param {Array<Object>} data - Array of data points
   * @returns {Promise<void>}
   */
  async saveWithTransaction(data) {
    try {
      await this.prisma.$transaction(
        data.map(point =>
          this.prisma.biometric_data.create({
            data: {
              patient_id: point.patient_id,
              metric_type: point.metric_type,
              value: point.value,
              timestamp: point.timestamp,
              source: point.source || 'simulated'
            }
          })
        )
      );
    } catch (error) {
      throw new Error(`Transactional insertion failed: ${error.message}`);
    }
  }

  /**
   * Count data points by metric type
   * @param {Array<Object>} data - Array of data points
   * @returns {Object} Metric type -> count mapping
   */
  countByMetric(data) {
    const counts = {};

    data.forEach(point => {
      counts[point.metric_type] = (counts[point.metric_type] || 0) + 1;
    });

    return counts;
  }
}

module.exports = BiometricDataGenerator;
