// Skill Card Component
import React from 'react';
import { StudentSkill, VerificationStatus } from '../types';
import { getSkillImprovementSuggestions } from '../services/studentService';

interface SkillCardProps {
  skill: StudentSkill;
  onImprove?: (skillId: string) => void;
  onVerify?: (skillId: string) => void;
}

const SkillCard: React.FC<SkillCardProps> = ({ skill, onImprove, onVerify }) => {
  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'under-review':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all hover:shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {skill.name}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(skill.verificationStatus)}`}>
              {skill.verificationStatus === 'verified' ? '✓ Verified' : 
               skill.verificationStatus === 'rejected' ? '✗ Rejected' :
               skill.verificationStatus === 'under-review' ? '⏳ Review' : 'Pending'}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {skill.category} • Level: {skill.selfLevel}
          </p>
        </div>
        <div className="text-center">
          <div className={`text-3xl font-bold ${getScoreColor(skill.score)}`}>
            {skill.score}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">points</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              skill.score >= 80
                ? 'bg-gradient-to-r from-green-500 to-green-600'
                : skill.score >= 60
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                : 'bg-gradient-to-r from-red-500 to-red-600'
            }`}
            style={{ width: `${skill.score}%` }}
          />
        </div>
      </div>

      {/* Proof Links */}
      {skill.proofLinks && skill.proofLinks.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Proof Links:</p>
          <div className="flex flex-wrap gap-2">
            {skill.proofLinks.slice(0, 3).map((link, idx) => {
              try {
                const url = new URL(link);
                return (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {url.hostname}
                  </a>
                );
              } catch {
                return (
                  <span key={idx} className="text-xs text-gray-500 dark:text-gray-400">
                    {link.length > 30 ? link.substring(0, 30) + '...' : link}
                  </span>
                );
              }
            })}
          </div>
        </div>
      )}

      {/* Assessments */}
      {skill.assessments && skill.assessments.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Assessments: {skill.assessments.filter(a => a.status === 'evaluated').length} / {skill.assessments.length} completed
          </p>
        </div>
      )}
      
      {/* Skill Points Info */}
      <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
        <p className="text-xs text-indigo-900 dark:text-indigo-300 font-medium">
          💡 Skill Points: Higher points = stronger proficiency
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {skill.score < 80 && onImprove && (
          <button
            onClick={() => onImprove(skill.id)}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
          >
            Improve
          </button>
        )}
        {skill.verificationStatus === 'pending' && onVerify && (
          <button
            onClick={() => onVerify(skill.id)}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
          >
            Request Verification
          </button>
        )}
      </div>
    </div>
  );
};

export default SkillCard;
