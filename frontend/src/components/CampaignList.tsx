/**
 * CampaignList - Display campaigns for active workspace
 */

import { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { campaignClient, Campaign } from '../lib/api/campaignClient';
import { CreateCampaignModal } from './CreateCampaignModal';
import './CampaignList.css';

export function CampaignList() {
  const { activeWorkspace } = useWorkspace();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (activeWorkspace) {
      loadCampaigns();
    }
  }, [activeWorkspace]);

  const loadCampaigns = async () => {
    if (!activeWorkspace) return;

    try {
      setLoading(true);
      const data = await campaignClient.getCampaigns(activeWorkspace.id);
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!activeWorkspace) {
    return <div className='campaign-list-empty'>No workspace selected</div>;
  }

  if (loading) {
    return <div className='campaign-list-loading'>Loading campaigns...</div>;
  }

  return (
    <div className='campaign-list'>
      <div className='campaign-list-header'>
        <h2>Campaigns</h2>
        <button
          className='btn-create-campaign'
          onClick={() => setShowCreateModal(true)}
        >
          + Create Campaign
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className='campaign-list-empty'>
          <div className='empty-icon'>📋</div>
          <h3>No campaigns yet</h3>
          <p>Create your first campaign to get started</p>
          <button
            className='btn-create-campaign'
            onClick={() => setShowCreateModal(true)}
          >
            + Create Campaign
          </button>
        </div>
      ) : (
        <table className='campaign-table'>
          <thead>
            <tr>
              <th>Name</th>
              <th>Objective</th>
              <th>Funnel Stage</th>
              <th>Placements</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td className='campaign-name'>
                  <div>{campaign.name}</div>
                  {campaign.description && (
                    <div className='campaign-description'>
                      {campaign.description}
                    </div>
                  )}
                </td>
                <td>
                  <span className='badge badge-objective'>
                    {campaign.objective}
                  </span>
                </td>
                <td>
                  <span
                    className={`badge badge-funnel badge-funnel-${campaign.funnelStage}`}
                  >
                    {campaign.funnelStage}
                  </span>
                </td>
                <td>{campaign.placements.length} platforms</td>
                <td>
                  <span
                    className={`badge badge-status badge-status-${campaign.status}`}
                  >
                    {campaign.status}
                  </span>
                </td>
                <td>{new Date(campaign.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showCreateModal && (
        <CreateCampaignModal
          workspaceId={activeWorkspace.id}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadCampaigns();
          }}
        />
      )}
    </div>
  );
}
