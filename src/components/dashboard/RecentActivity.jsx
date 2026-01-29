/**
 * WorkLedger - Recent Activity Component
 * 
 * Component displaying recent activity feed with time formatting
 * and activity type icons.
 * 
 * @module components/dashboard/RecentActivity
 * @created January 29, 2026
 */

import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  
  return date.toLocaleDateString();
}

/**
 * Get icon for activity type
 */
function getActivityIcon(type) {
  const icons = {
    'work_entry_created': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    'work_entry_submitted': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    'work_entry_approved': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'project_created': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    'member_joined': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
    'default': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  };

  return icons[type] || icons.default;
}

/**
 * Get color class for activity type
 */
function getActivityColor(type) {
  const colors = {
    'work_entry_created': 'bg-blue-100 text-blue-600',
    'work_entry_submitted': 'bg-yellow-100 text-yellow-600',
    'work_entry_approved': 'bg-green-100 text-green-600',
    'project_created': 'bg-purple-100 text-purple-600',
    'member_joined': 'bg-indigo-100 text-indigo-600',
    'default': 'bg-gray-100 text-gray-600'
  };

  return colors[type] || colors.default;
}

/**
 * RecentActivity Component
 * 
 * @param {Object} props
 * @param {Array} props.activities - Array of activity objects
 * @param {string} props.activities[].type - Activity type
 * @param {string} props.activities[].message - Activity message
 * @param {string} props.activities[].user - User who performed action
 * @param {string} props.activities[].timestamp - ISO timestamp
 * @param {string} props.activities[].link - Link to related resource (optional)
 * @param {number} props.maxItems - Maximum items to display (default: 5)
 * 
 * @example
 * <RecentActivity
 *   activities={[
 *     {
 *       type: 'work_entry_created',
 *       message: 'Work entry created for PMC Contract',
 *       user: 'John Doe',
 *       timestamp: '2026-01-29T10:30:00Z',
 *       link: '/work-entries/123'
 *     }
 *   ]}
 * />
 */
export function RecentActivity({ activities = [], maxItems = 5 }) {
  // Limit activities to maxItems
  const displayActivities = activities.slice(0, maxItems);

  // Empty state
  if (displayActivities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">
            No recent activity yet
          </p>
          <p className="text-xs text-gray-400">
            Activity will appear here as you use the app
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Recent Activity
      </h3>
      
      <div className="flow-root">
        <ul className="-mb-8">
          {displayActivities.map((activity, index) => {
            const ActivityContent = (
              <div className="relative pb-8">
                {/* Connecting line */}
                {index !== displayActivities.length - 1 && (
                  <span
                    className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}

                <div className="relative flex items-start space-x-3">
                  {/* Icon */}
                  <div className={`
                    relative px-1 flex h-10 w-10 items-center justify-center rounded-full
                    ${getActivityColor(activity.type)}
                  `}>
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">
                          {activity.user}
                        </span>{' '}
                        <span className="text-gray-500">
                          {activity.message}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {formatRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>

                  {/* Arrow link */}
                  {activity.link && (
                    <div className="flex-shrink-0 self-center">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );

            // Wrap with link if available
            if (activity.link) {
              return (
                <li key={index}>
                  <Link to={activity.link} className="block hover:bg-gray-50 -mx-2 px-2 rounded">
                    {ActivityContent}
                  </Link>
                </li>
              );
            }

            return <li key={index}>{ActivityContent}</li>;
          })}
        </ul>
      </div>

      {/* View all link */}
      {activities.length > maxItems && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <Link
            to="/activity"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View all activity →
          </Link>
        </div>
      )}
    </div>
  );
}

export default RecentActivity;
