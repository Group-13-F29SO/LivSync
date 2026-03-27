'use client';

import { useState, useEffect } from 'react';

/**
 * ArticleFeedback Component
 * Allows users to provide feedback (helpful/unhelpful) on articles
 * Displays feedback counts
 */
export default function ArticleFeedback({ articleId, helpfulCount = 0, unhelpfulCount = 0 }) {
  const [userFeedback, setUserFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentHelpful, setCurrentHelpful] = useState(helpfulCount);
  const [currentUnhelpful, setCurrentUnhelpful] = useState(unhelpfulCount);
  const [message, setMessage] = useState('');

  // Fetch user's existing feedback on component mount
  useEffect(() => {
    fetchUserFeedback();
  }, [articleId]);

  const fetchUserFeedback = async () => {
    try {
      const response = await fetch(`/api/articles/feedback?articleId=${articleId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }

      const data = await response.json();
      if (data.data) {
        setUserFeedback(data.data.feedback);
      }
    } catch (error) {
      console.error('Error fetching user feedback:', error);
    }
  };

  const handleFeedback = async (feedback) => {
    try {
      setIsLoading(true);
      setMessage('');

      const response = await fetch('/api/articles/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          articleId: parseInt(articleId),
          feedback,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      const data = await response.json();
      
      // Update UI
      setUserFeedback(feedback);
      setCurrentHelpful(data.data.article.helpful_count);
      setCurrentUnhelpful(data.data.article.unhelpful_count);
      setMessage(
        data.data.isNewFeedback
          ? 'Thank you for your feedback! 👍'
          : 'Feedback updated! 👍'
      );

      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setMessage('Failed to submit feedback. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const helpfulPercentage =
    currentHelpful + currentUnhelpful > 0
      ? Math.round((currentHelpful / (currentHelpful + currentUnhelpful)) * 100)
      : 0;

  return (
    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Was this article helpful?
          </p>
          
          <div className="flex gap-3 items-center">
            {/* Helpful Button */}
            <button
              onClick={() => handleFeedback('helpful')}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                userFeedback === 'helpful'
                  ? 'bg-green-500 dark:bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900 hover:text-green-700 dark:hover:text-green-300'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Mark as helpful"
            >
              <span>👍</span>
              <span>Helpful</span>
              <span className="text-xs font-semibold">({currentHelpful})</span>
            </button>

            {/* Unhelpful Button */}
            <button
              onClick={() => handleFeedback('unhelpful')}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                userFeedback === 'unhelpful'
                  ? 'bg-red-500 dark:bg-red-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-700 dark:hover:text-red-300'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Mark as unhelpful"
            >
              <span>👎</span>
              <span>Not Helpful</span>
              <span className="text-xs font-semibold">({currentUnhelpful})</span>
            </button>
          </div>
        </div>

        {/* Feedback Percentage */}
        {currentHelpful + currentUnhelpful > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-green-500 dark:bg-green-400 h-full transition-all duration-300"
                style={{ width: `${helpfulPercentage}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              {helpfulPercentage}% found helpful
            </span>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`text-sm font-medium ${
            message.includes('Thank you') || message.includes('updated')
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
