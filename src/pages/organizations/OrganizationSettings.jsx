/**
 * WorkLedger - Organization Settings Page
 * 
 * Page for managing organization settings and members.
 * 
 * @module pages/organizations/OrganizationSettings
 * @created January 29, 2026
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { organizationService } from '../../services/api/organizationService';

export function OrganizationSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [organization, setOrganization] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // general, members
  
  const [formData, setFormData] = useState({
    name: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadOrganization();
    loadMembers();
  }, [id]);

  const loadOrganization = async () => {
    setLoading(true);
    const org = await organizationService.getOrganization(id);
    if (org) {
      setOrganization(org);
      setFormData({
        name: org.name
      });
    } else {
      // Organization not found
      navigate('/organizations');
    }
    setLoading(false);
  };

  const loadMembers = async () => {
    const membersList = await organizationService.getOrgMembers(id);
    setMembers(membersList);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!formData.name || formData.name.trim() === '') {
      setErrors({ name: 'Organization name is required' });
      return;
    }

    setSaving(true);

    try {
      const result = await organizationService.updateOrganization(id, {
        name: formData.name.trim()
      });

      if (result.success) {
        console.log('✅ Organization updated successfully');
        setOrganization(result.data);
        // Show success message (could use toast notification in future)
        alert('Organization settings updated successfully!');
      } else {
        setErrors({ submit: result.error || 'Failed to update organization' });
      }
    } catch (error) {
      console.error('❌ Error updating organization:', error);
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <LoadingSpinner size="lg" text="Loading organization settings..." />
      </AppLayout>
    );
  }

  if (!organization) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Organization not found</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Organization Settings
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage {organization.name} settings and members
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('general')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'general'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'members'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Members ({members.length})
            </button>
          </nav>
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Organization Details
                </h3>
                
                <Input
                  label="Organization Name"
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                />
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Organization Information
                </h4>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 text-sm">
                  <div>
                    <dt className="text-gray-500">Organization ID</dt>
                    <dd className="text-gray-900 font-mono text-xs">{organization.id}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Slug</dt>
                    <dd className="text-gray-900">{organization.slug}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Created</dt>
                    <dd className="text-gray-900">
                      {new Date(organization.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Subscription Tier</dt>
                    <dd className="text-gray-900 capitalize">{organization.subscription_tier || 'free'}</dd>
                  </div>
                </dl>
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">{errors.submit}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/organizations')}
                  disabled={saving}
                >
                  Back to Organizations
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={saving}
                  disabled={saving}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Team Members
              </h3>
              <Button
                variant="primary"
                size="sm"
                onClick={() => alert('Invite member feature coming in future session!')}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Invite Member
              </Button>
            </div>

            {members.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 className="mt-4 text-sm font-medium text-gray-900">
                  No members yet
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Invite your first team member to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-medium">
                            {member.user_profile?.full_name?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {member.user_profile?.full_name || 'Unknown User'}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {member.user_profile?.email || member.user_id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`
                        px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${member.role === 'org_admin' ? 'bg-purple-100 text-purple-800' :
                          member.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'}
                      `}>
                        {member.role.replace('_', ' ')}
                      </span>
                      {member.role !== 'org_admin' && (
                        <button
                          className="text-sm text-red-600 hover:text-red-700"
                          onClick={() => alert('Remove member feature coming in future session!')}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Member invitations coming soon!</p>
                  <p>Email invitation system will be added in a future session.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default OrganizationSettings;
