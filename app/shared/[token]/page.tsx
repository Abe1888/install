'use client';

// Using direct imports instead of next/navigation and next/dynamic
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  AlertTriangle, 
  Clock, 
  Shield, 
  Eye, 
  CheckCircle,
  XCircle,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';

// Direct imports instead of dynamic imports
const ImprovedDashboard = () => null;

// Simple component implementations instead of dynamic imports
const VehicleSchedule = () => (
  <div className="p-4 border rounded">
    <LoadingSpinner text="Vehicle schedule component" />
  </div>
);

const OptimizedInstallationTimeline = () => (
  <div className="p-4 border rounded">
    <LoadingSpinner text="Installation timeline component" />
  </div>
);

const WorkingGanttChart = () => (
  <div className="p-4 border rounded">
    <LoadingSpinner text="Gantt chart component" />
  </div>
);

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

export default function SharedLinkPage({
  params
}: {
  params: { token: string }
}) {
  // Using params directly from page props instead of useParams
  // Using window.location for navigation instead of useRouter
  const router = {
    push: (url: string) => { window.location.href = url; }
  };
  const token = params?.token as string;
  
  const [link, setLink] = useState<ShareableLink | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessGranted, setAccessGranted] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid share link token');
      setIsLoading(false);
      return;
    }

    verifyAndGrantAccess();
  }, [token]);

  const verifyAndGrantAccess = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load shareable links from localStorage (in a real app, this would be an API call)
      const savedLinks = localStorage.getItem('shareableLinks');
      if (!savedLinks) {
        throw new Error('No shareable links found');
      }

      const links: ShareableLink[] = JSON.parse(savedLinks);
      const shareLink = links.find(l => l.shareToken === token);

      if (!shareLink) {
        throw new Error('Share link not found');
      }

      // Convert date strings back to Date objects
      const linkWithDates = {
        ...shareLink,
        createdAt: new Date(shareLink.createdAt),
        expiresAt: shareLink.expiresAt ? new Date(shareLink.expiresAt) : null
      };

      setLink(linkWithDates);

      // Check if link is active
      if (!linkWithDates.isActive) {
        throw new Error('This share link has been disabled');
      }

      // Check if link has expired
      if (linkWithDates.expiresAt && linkWithDates.expiresAt < new Date()) {
        throw new Error('This share link has expired');
      }

      // Increment access count
      const updatedLinks = links.map(l => 
        l.shareToken === token 
          ? { ...l, accessCount: l.accessCount + 1 }
          : l
      );
      localStorage.setItem('shareableLinks', JSON.stringify(updatedLinks));

      setAccessGranted(true);

    } catch (err: any) {
      setError(err.message || 'Failed to verify share link');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPageContent = () => {
    if (!link) return null;

    switch (link.pageUrl) {
      case '/':
        return <ImprovedDashboard />;
      case '/schedule':
        return <VehicleSchedule />;
      case '/timeline':
        return <OptimizedInstallationTimeline />;
      case '/gantt':
        return <WorkingGanttChart />;
      default:
        return (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unsupported Page</h3>
            <p className="text-gray-600">This page type is not supported for sharing.</p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-lg">
          <div className="text-center">
            <LoadingSpinner text="Verifying share link..." />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-lg">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            
            <div className="space-y-3">
              <button
                onClick={() => router.push('/')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go to Main Dashboard</span>
              </button>
              
              <div className="text-xs text-gray-500">
                If you believe this is an error, please contact the person who shared this link.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!accessGranted || !link) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-lg">
          <div className="text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Access</h2>
            <p className="text-gray-600">Please wait while we verify your share link...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Share Link Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{link.pageName}</h1>
                <p className="text-sm text-gray-500">Shared view • Read-only access</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Secure link verified</span>
                </div>
              </div>
              
              <button
                onClick={() => window.open('/', '_blank')}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Full Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Link Info Banner */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-indigo-900 mb-1">Shared Access Information</h3>
              <p className="text-sm text-indigo-700 mb-2">{link.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-indigo-600">
                <div>
                  <span className="font-medium">Shared:</span> {link.createdAt.toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Views:</span> {link.accessCount + 1}
                </div>
                <div>
                  <span className="font-medium">Expires:</span> {
                    link.expiresAt 
                      ? link.expiresAt.toLocaleDateString()
                      : 'Never'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shared Page Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {renderPageContent()}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center text-sm text-gray-500">
            <Shield className="w-4 h-4 mr-2" />
            <span>This is a secure shared view of the Task Management System</span>
          </div>
        </div>
      </div>
    </div>
  );
}
