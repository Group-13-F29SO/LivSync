/**
 * Biometrics API Routes
 * Handles /api/biometrics endpoints for data generation and retrieval
 */

const express = require('express');
const router = express.Router();

// Import the biometric data generator
const BiometricDataGenerator = require('../services/biometricGenerator');

// Import Prisma client (initialized in main app)
let prisma;

/**
 * Initialize routes with Prisma client
 * @param {PrismaClient} prismaClient - Initialized Prisma client
 */
function initializeBiometricsRoutes(prismaClient) {
  prisma = prismaClient;
  return router;
}

/**
 * Private middleware: Authenticate user
 * Checks for authenticated user in request
 */
function authenticateUser(req, res, next) {
  // Check if user is authenticated
  // This should integrate with your existing auth system
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  next();
}

/**
 * POST /api/biometrics/generate
 * Generate simulated biometric data for authenticated user
 * 
 * Request body:
 * {
 *   "date": "2026-02-16" (optional, defaults to today)
 * }
 * 
 * Response (success):
 * {
 *   "success": true,
 *   "message": "Data generated successfully",
 *   "data": {
 *     "patient_id": "uuid",
 *     "date": "2026-02-16",
 *     "data_points_generated": 1728,
 *     "metrics_count": 6,
 *     "breakdown": { "steps": 288, ... }
 *   }
 * }
 */
router.post('/generate', authenticateUser, async (req, res) => {
  try {
    const { date } = req.body;
    const patientId = req.user.id;

    // Validate patient ID
    if (!patientId || typeof patientId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid patient ID'
      });
    }

    // Validate optional date parameter
    let generateDate = new Date();
    if (date) {
      generateDate = new Date(date);
      if (isNaN(generateDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD or ISO format.'
        });
      }
    }

    // Create generator instance
    const generator = new BiometricDataGenerator(prisma);

    // Generate data
    const result = await generator.generate(patientId, generateDate);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Data generated successfully',
      data: result
    });
  } catch (error) {
    console.error('Biometrics generation error:', error);

    // Route error response based on error type
    if (error.message.includes('validation')) {
      return res.status(400).json({
        success: false,
        error: 'Data validation failed: ' + error.message
      });
    }

    if (error.message.includes('database')) {
      return res.status(500).json({
        success: false,
        error: 'Database error. Please try again later.'
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred during data generation'
    });
  }
});

/**
 * GET /api/biometrics
 * Get biometric data for authenticated user
 * 
 * Query parameters:
 * - metric: Filter by metric type (steps, heart_rate, calories, sleep, hydration, blood_glucose)
 * - startDate: Start date for range query (YYYY-MM-DD)
 * - endDate: End date for range query (YYYY-MM-DD)
 * - limit: Maximum number of records (default: 1000)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     { "metric_type": "steps", "value": 1000, "timestamp": "2026-02-16T00:00:00Z", ... },
 *     ...
 *   ],
 *   "count": 288
 * }
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { metric, startDate, endDate, limit = 1000 } = req.query;
    const patientId = req.user.id;

    // Build query filters
    const where = {
      patient_id: patientId
    };

    if (metric) {
      where.metric_type = metric;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    // Query biometric data
    const data = await prisma.biometric_data.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      take: parseInt(limit) || 1000
    });

    res.status(200).json({
      success: true,
      data,
      count: data.length
    });
  } catch (error) {
    console.error('Biometrics retrieval error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve biometric data'
    });
  }
});

/**
 * GET /api/biometrics/summary
 * Get summary statistics for biometric data
 * 
 * Query parameters:
 * - days: Number of days to look back (default: 7)
 * - metric: Specific metric to summarize (optional)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "steps": { "avg": 8000, "min": 5000, "max": 15000 },
 *     "heart_rate": { "avg": 72, "min": 60, "max": 140 },
 *     ...
 *   }
 * }
 */
router.get('/summary', authenticateUser, async (req, res) => {
  try {
    const { days = 7, metric } = req.query;
    const patientId = req.user.id;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Build query
    const where = {
      patient_id: patientId,
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    };

    if (metric) {
      where.metric_type = metric;
    }

    // Get data and group by metric
    const data = await prisma.biometric_data.findMany({
      where,
      orderBy: { timestamp: 'asc' }
    });

    // Calculate summaries
    const summaries = this.calculateMetricSummaries(data);

    res.status(200).json({
      success: true,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: parseInt(days)
      },
      data: summaries
    });
  } catch (error) {
    console.error('Summary calculation error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to calculate summary'
    });
  }
});

/**
 * Helper function: Calculate summary statistics for metrics
 * @private
 */
function calculateMetricSummaries(data) {
  const summaries = {};

  // Group by metric type
  const byMetric = {};
  data.forEach(point => {
    if (!byMetric[point.metric_type]) {
      byMetric[point.metric_type] = [];
    }
    byMetric[point.metric_type].push(point.value);
  });

  // Calculate stats for each metric
  for (const [metricType, values] of Object.entries(byMetric)) {
    if (values.length > 0) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      summaries[metricType] = {
        avg: Math.round(avg * 100) / 100,
        min,
        max,
        count: values.length
      };
    }
  }

  return summaries;
}

module.exports = { initializeBiometricsRoutes, router };
