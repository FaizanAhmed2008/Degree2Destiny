// AI Insights Card Component
import React from 'react';
import { AIInsights } from '../types';

interface AIInsightsCardProps {
  insights: AIInsights;
  onRefresh?: () => void;
  loading?: boolean;
}

const AIInsightsCard: React.FC<AIInsightsCardProps> = ({ insights, onRefresh, loading }) => {
  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold mb-1">AI Insights</h3>
          <p className="text-indigo-100 text-sm">
            Powered by Gemini AI
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        )}
      </div>

      {/* Strengths */}
      {insights.strengths && insights.strengths.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2 text-indigo-100">Strengths</h4>
          <ul className="space-y-1">
            {insights.strengths.slice(0, 3).map((strength, idx) => (
              <li key={idx} className="text-sm text-indigo-100 flex items-start">
                <span className="mr-2">✓</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {insights.weaknesses && insights.weaknesses.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2 text-indigo-100">Areas to Improve</h4>
          <ul className="space-y-1">
            {insights.weaknesses.slice(0, 3).map((weakness, idx) => (
              <li key={idx} className="text-sm text-indigo-100 flex items-start">
                <span className="mr-2">→</span>
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 text-indigo-100">Recommendations</h4>
          <ul className="space-y-1">
            {insights.recommendations.slice(0, 2).map((rec, idx) => (
              <li key={idx} className="text-sm text-indigo-100 flex items-start">
                <span className="mr-2">💡</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested Roles */}
      {insights.suggestedRoles && insights.suggestedRoles.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <h4 className="font-semibold mb-2 text-indigo-100">Suggested Roles</h4>
          <div className="flex flex-wrap gap-2">
            {insights.suggestedRoles.slice(0, 3).map((role, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-white/20 rounded text-xs font-medium"
              >
                {role.role} ({role.matchScore}%)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsightsCard;
