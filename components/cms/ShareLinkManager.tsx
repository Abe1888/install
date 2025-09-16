'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Share,
  Link as LinkIcon,
  Copy,
  Eye,
  Clock,
  Shield,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Calendar,
  Key,
  Globe,
  Settings,
  Activity,
  ExternalLink,
  AlertCircle,
  QrCode
} from 'lucide-react';

interface ShareableLink {
  id: string;
  pageName: string;
  pageUrl: string;
  shareToken: string;
  shareUrl: string;
  expiresAt: Date | null;
  createdAt: Date;
  accessCount: number;
  isActive: boolean;
  description: string;
}

interface ShareLinkCreationData {
  pageName: string;
  pageUrl: string;
  description: string;
  expiresIn: number; // hours, 0 for no expiry
  maxAccess?: number; // max number of accesses, 0 for unlimited
}

export function ShareLinkManager() {
  const [shareLinks, setShareLinks] = useState<ShareableLink[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Available pages for sharing
  const availablePages = [
    {
      name: 'Dashboard',
      url: '/',
      description: 'Main dashboard with project overview and real-time metrics',
      icon: Activity
    },
    {
      name: 'Vehicle Schedule',
      url: '/schedule',
      description: 'Vehicle scheduling calendar and task assignments',
      icon: Calendar
    },
    {
      name: 'Installation Timeline',
      url: '/timeline',
      description: 'Project timeline with installation progress tracking',
      icon: Clock
    },
    {
      name: 'Gantt Chart',
      url: '/gantt',
      description: 'Interactive Gantt chart for project management',
      icon: Settings
    }
  ];

  const [formData, setFormData] = useState<ShareLinkCreationData>({
    pageName: '',
    pageUrl: '',
    description: '',
    expiresIn: 24, // Default 24 hours
    maxAccess: 0 // Unlimited by default
  });

  // Load existing share links on component mount
  useEffect(() => {
    loadShareLinks();
  }, []);

  const loadShareLinks = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would fetch from an API/database
      // For now, we'll load from localStorage as a demo
      const savedLinks = localStorage.getItem('shareableLinks');
      if (savedLinks) {
        const links: ShareableLink[] = JSON.parse(savedLinks);
        // Convert date strings back to Date objects
        const linksWithDates = links.map(link => ({
          ...link,
          createdAt: new Date(link.createdAt),
          expiresAt: link.expiresAt ? new Date(link.expiresAt) : null
        }));
        setShareLinks(linksWithDates);
      }
    } catch (error) {
      console.error('Failed to load share links:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveShareLinks = (links: ShareableLink[]) => {
    // In a real app, this would save to an API/database
    // For now, we'll save to localStorage as a demo
    localStorage.setItem('shareableLinks', JSON.stringify(links));
  };

  const generateShareToken = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const createShareLink = async () => {
    if (!formData.pageName || !formData.pageUrl) {
      return;
    }

    setIsCreating(true);
    
    try {
      const shareToken = generateShareToken();
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const shareUrl = `${baseUrl}/shared/${shareToken}`;
      
      const expiresAt = formData.expiresIn > 0 
        ? new Date(Date.now() + formData.expiresIn * 60 * 60 * 1000)
        : null;

      const newShareLink: ShareableLink = {
        id: Date.now().toString(),
        pageName: formData.pageName,
        pageUrl: formData.pageUrl,
        shareToken,
        shareUrl,
        expiresAt,
        createdAt: new Date(),
        accessCount: 0,
        isActive: true,
        description: formData.description
      };

      const updatedLinks = [...shareLinks, newShareLink];
      setShareLinks(updatedLinks);
      saveShareLinks(updatedLinks);

      // Reset form
      setFormData({
        pageName: '',
        pageUrl: '',
        description: '',
        expiresIn: 24,
        maxAccess: 0
      });
      setShowCreateForm(false);
      setSelectedPage('');

    } catch (error) {
      console.error('Failed to create share link:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteShareLink = (linkId: string) => {
    const updatedLinks = shareLinks.filter(link => link.id !== linkId);
    setShareLinks(updatedLinks);
    saveShareLinks(updatedLinks);
  };

  const toggleLinkStatus = (linkId: string) => {
    const updatedLinks = shareLinks.map(link =>
      link.id === linkId ? { ...link, isActive: !link.isActive } : link
    );
    setShareLinks(updatedLinks);
    saveShareLinks(updatedLinks);
  };

  const copyToClipboard = async (text: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(linkId);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handlePageSelect = (page: typeof availablePages[0]) => {
    setSelectedPage(page.name);
    setFormData(prev => ({
      ...prev,
      pageName: page.name,
      pageUrl: page.url,
      description: page.description
    }));
    setShowCreateForm(true);
  };

  const isExpired = (link: ShareableLink) => {
    return link.expiresAt && link.expiresAt < new Date();
  };

  const getStatusColor = (link: ShareableLink) => {
    if (!link.isActive) return 'text-gray-400';
    if (isExpired(link)) return 'text-red-400';
    return 'text-green-400';
  };

  const getStatusText = (link: ShareableLink) => {
    if (!link.isActive) return 'Disabled';
    if (isExpired(link)) return 'Expired';
    return 'Active';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-700 border border-gray-600 rounded-lg overflow-hidden">
        <div className="bg-gray-800 border-b border-gray-600 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Share className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">Share Link Manager</h4>
                <p className="text-sm text-gray-400">Create shareable links for dashboard pages</p>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              {shareLinks.length} link{shareLinks.length !== 1 ? 's' : ''} created
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Quick Page Selection */}
          {!showCreateForm && (
            <div className="space-y-4">
              <h5 className="text-md font-semibold text-white mb-3">Select Page to Share</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availablePages.map((page) => {
                  const Icon = page.icon;
                  const existingLink = shareLinks.find(link => link.pageUrl === page.url && link.isActive && !isExpired(link));
                  
                  return (
                    <div
                      key={page.name}
                      onClick={() => handlePageSelect(page)}
                      className="p-4 border border-gray-600 bg-gray-800 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-gray-700 transition-all duration-200"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h6 className="font-medium text-white">{page.name}</h6>
                            {existingLink && (
                              <div className="flex items-center space-x-1 text-green-400">
                                <CheckCircle className="w-3 h-3" />
                                <span className="text-xs">Active Link</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{page.description}</p>
                          <div className="text-xs text-indigo-400 mt-1">{page.url}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Create Form */}
          {showCreateForm && (
            <div className="space-y-6 border border-gray-600 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <h5 className="text-md font-semibold text-white">Create Share Link</h5>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setSelectedPage('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-600 rounded transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Page Name
                  </label>
                  <input
                    type="text"
                    value={formData.pageName}
                    onChange={(e) => setFormData(prev => ({ ...prev, pageName: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter page name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Page URL
                  </label>
                  <input
                    type="text"
                    value={formData.pageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, pageUrl: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., /dashboard"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Brief description of what this link provides access to..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expires In (hours)
                  </label>
                  <select
                    value={formData.expiresIn}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiresIn: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value={1}>1 hour</option>
                    <option value={6}>6 hours</option>
                    <option value={24}>24 hours</option>
                    <option value={168}>7 days</option>
                    <option value={720}>30 days</option>
                    <option value={0}>Never expires</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Access Count
                  </label>
                  <input
                    type="number"
                    value={formData.maxAccess}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxAccess: Number(e.target.value) }))}
                    min="0"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0 for unlimited"
                  />
                </div>
              </div>

              <button
                onClick={createShareLink}
                disabled={isCreating || !formData.pageName || !formData.pageUrl}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center justify-center space-x-2"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Creating Link...</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-5 h-5" />
                    <span>Create Share Link</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Existing Share Links */}
      {shareLinks.length > 0 && (
        <div className="bg-gray-700 border border-gray-600 rounded-lg overflow-hidden">
          <div className="bg-gray-800 border-b border-gray-600 p-4">
            <h5 className="text-lg font-semibold text-white">Existing Share Links</h5>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {shareLinks.map((link) => (
                <div key={link.id} className="border border-gray-600 bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h6 className="font-semibold text-white">{link.pageName}</h6>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(link)} ${
                          link.isActive && !isExpired(link) 
                            ? 'bg-green-900/20' 
                            : isExpired(link) 
                            ? 'bg-red-900/20' 
                            : 'bg-gray-600/20'
                        }`}>
                          {getStatusText(link)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{link.description}</p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Created: {link.createdAt.toLocaleString()}</div>
                        <div>Accessed: {link.accessCount} times</div>
                        {link.expiresAt && (
                          <div>Expires: {link.expiresAt.toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-900 rounded-lg p-2">
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-indigo-400" />
                          <span className="text-sm text-gray-300 font-mono break-all">{link.shareUrl}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(link.shareUrl, link.id)}
                        className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-1"
                      >
                        {copySuccess === link.id ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => window.open(link.shareUrl, '_blank')}
                          className="px-3 py-1 text-xs bg-gray-600 text-gray-200 rounded hover:bg-gray-500 transition-colors flex items-center space-x-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Test Link</span>
                        </button>
                        <button
                          onClick={() => toggleLinkStatus(link.id)}
                          className={`px-3 py-1 text-xs rounded transition-colors flex items-center space-x-1 ${
                            link.isActive 
                              ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{link.isActive ? 'Disable' : 'Enable'}</span>
                        </button>
                      </div>
                      <button
                        onClick={() => deleteShareLink(link.id)}
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center space-x-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
        <h5 className="text-gray-200 font-semibold mb-3">📋 How Share Links Work</h5>
        <div className="text-sm text-gray-300 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="font-medium text-indigo-300 mb-2">Creating Links:</div>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Select a page from the available options</li>
                <li>Configure expiration and access limits</li>
                <li>Generate secure shareable link</li>
                <li>Copy and share the link with others</li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-indigo-300 mb-2">Link Features:</div>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Secure token-based authentication</li>
                <li>Configurable expiration times</li>
                <li>Access count tracking</li>
                <li>Enable/disable link status</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-600">
          <p className="text-xs text-gray-400">
            <strong>Note:</strong> Share links provide read-only access to dashboard pages without requiring authentication. 
            Links can be disabled or deleted at any time for security.
          </p>
        </div>
      </div>
    </div>
  );
}
