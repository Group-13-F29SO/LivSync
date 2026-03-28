'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth } from '@/hooks/useAuth';

export default function WeeklySummaryPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [weeklyData, setWeeklyData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const fetchWeeklySummary = async () => {
    try {
      setIsLoadingData(true);
      const res = await fetch('/api/biometrics/weekly-summary?weeks=12');
      const json = await res.json();

      if (json.success) {
        setWeeklyData(json.data);
        setError(null);
      } else {
        setError(json.error || 'Failed to load weekly summary');
      }
    } catch (err) {
      console.error('Failed to load weekly summary', err);
      setError('Failed to load weekly summary');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (!isLoading && user) {
      fetchWeeklySummary();
    }
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startMonth = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    return `${startMonth} - ${endMonth}`;
  };

  const getWeekNumber = (dateString) => {
    const date = new Date(dateString);
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDay) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7);
  };

  const exportToPDF = async () => {
    if (!contentRef.current) return;

    try {
      setIsExporting(true);

      // Capture the content as an image
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const availableWidth = pageWidth - 2 * margin;
      const availableHeight = pageHeight - 2 * margin;

      // Calculate dimensions to fit content proportionally
      const imgWidth = availableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let yPosition = margin;

      // Add header
      pdf.setFontSize(18);
      pdf.text('Weekly Summary Report', margin, yPosition);
      yPosition += 15;

      pdf.setFontSize(10);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, margin, yPosition);
      yPosition += 10;

      // Add content image(s)
      let remainingHeight = imgHeight;
      let imgYOffset = 0;

      while (remainingHeight > 0) {
        const heightToPrint = Math.min(remainingHeight, availableHeight - yPosition + margin);
        const sourceHeight = (heightToPrint * canvas.height) / imgHeight;

        pdf.addImage(
          imgData,
          'PNG',
          margin,
          yPosition,
          imgWidth,
          heightToPrint,
          undefined,
          'FAST'
        );

        remainingHeight -= heightToPrint;
        imgYOffset += sourceHeight;

        if (remainingHeight > 0) {
          pdf.addPage();
          yPosition = margin;
        }
      }

      // Download the PDF
      pdf.save(`weekly-summary-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      <main className="flex-1 p-8 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">
                Weekly Summary
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                View your weekly metrics and trends
              </p>
            </div>
          </div>
          
          {/* Export Button */}
          {weeklyData.length > 0 && (
            <button
              onClick={exportToPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-semibold"
            >
              <Download className="w-5 h-5" />
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoadingData ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading weekly summaries...</p>
            </div>
          </div>
        ) : weeklyData.length > 0 ? (
          <div ref={contentRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {weeklyData.map((week, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Week Header */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Week {getWeekNumber(week.weekStart)}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDateRange(week.weekStart, week.weekEnd)}
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Steps */}
                  <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold mb-2">
                      Steps
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {week.steps.total.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Avg: {week.steps.average.toLocaleString()}/day
                    </p>
                  </div>

                  {/* Calories */}
                  <div className="bg-orange-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold mb-2">
                      Calories
                    </p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {week.calories.total.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Avg: {week.calories.average.toLocaleString()}/day
                    </p>
                  </div>

                  {/* Sleep */}
                  <div className="bg-purple-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold mb-2">
                      Sleep
                    </p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {week.sleep.totalHours.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Avg: {week.sleep.averageHours.toFixed(1)}/night
                    </p>
                  </div>

                  {/* Hydration */}
                  <div className="bg-cyan-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold mb-2">
                      Hydration
                    </p>
                    <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                      {week.hydration.total}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Avg: {week.hydration.average}/day
                    </p>
                  </div>

                  {/* Heart Rate */}
                  <div className="bg-red-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold mb-2">
                      Heart Rate
                    </p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {week.heartRate.average}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Avg BPM
                    </p>
                  </div>

                  {/* Blood Glucose */}
                  <div className="bg-green-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold mb-2">
                      Blood Glucose
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {week.bloodGlucose.average}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Avg mg/dL
                    </p>
                  </div>

                  {/* Sleep Quality */}
                  <div className="bg-indigo-50 dark:bg-gray-800 p-4 rounded-lg col-span-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold mb-2">
                      Sleep Quality
                    </p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {week.sleep.quality}
                    </p>
                  </div>

                  {/* Workouts */}
                  <div className="bg-emerald-50 dark:bg-gray-800 p-4 rounded-lg col-span-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold mb-2">
                      Workouts
                    </p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {week.workouts}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No data available yet. Start syncing your health data to see weekly summaries.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
