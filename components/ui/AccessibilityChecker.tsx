'use client';

import React, { useState, useEffect, memo } from 'react';
import { Eye, EyeOff, Contrast, Type, MousePointer, Keyboard, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  element?: string;
  suggestion: string;
}

const AccessibilityChecker: React.FC = memo(() => {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const runAccessibilityCheck = () => {
    setIsChecking(true);
    const foundIssues: AccessibilityIssue[] = [];

    // Check for missing alt text on images
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.alt || img.alt.trim() === '') {
        foundIssues.push({
          type: 'error',
          category: 'Images',
          message: 'Image missing alt text',
          element: `Image ${index + 1}`,
          suggestion: 'Add descriptive alt text for screen readers'
        });
      }
    });

    // Check for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > lastLevel + 1) {
        foundIssues.push({
          type: 'warning',
          category: 'Headings',
          message: 'Heading hierarchy skipped',
          element: `${heading.tagName} "${heading.textContent?.slice(0, 30)}..."`,
          suggestion: 'Use proper heading hierarchy (h1 → h2 → h3, etc.)'
        });
      }
      lastLevel = level;
    });

    // Check for buttons without accessible names
    const buttons = document.querySelectorAll('button');
    buttons.forEach((button, index) => {
      const hasText = button.textContent?.trim();
      const hasAriaLabel = button.getAttribute('aria-label');
      const hasAriaLabelledBy = button.getAttribute('aria-labelledby');
      
      if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
        foundIssues.push({
          type: 'error',
          category: 'Interactive Elements',
          message: 'Button without accessible name',
          element: `Button ${index + 1}`,
          suggestion: 'Add text content, aria-label, or aria-labelledby attribute'
        });
      }
    });

    // Check for form inputs without labels
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea, select');
    inputs.forEach((input, index) => {
      const hasLabel = document.querySelector(`label[for="${input.id}"]`);
      const hasAriaLabel = input.getAttribute('aria-label');
      const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
      
      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
        foundIssues.push({
          type: 'error',
          category: 'Forms',
          message: 'Form input without label',
          element: `Input ${index + 1}`,
          suggestion: 'Associate input with a label element or add aria-label'
        });
      }
    });

    // Check for low contrast (simplified check)
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button');
    let lowContrastCount = 0;
    textElements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Simplified contrast check - in real implementation, you'd calculate actual contrast ratios
      if (color === 'rgb(128, 128, 128)' || color.includes('gray')) {
        lowContrastCount++;
      }
    });

    if (lowContrastCount > 0) {
      foundIssues.push({
        type: 'warning',
        category: 'Color Contrast',
        message: `${lowContrastCount} elements may have low contrast`,
        suggestion: 'Ensure text has sufficient contrast ratio (4.5:1 for normal text, 3:1 for large text)'
      });
    }

    // Check for keyboard navigation
    const focusableElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]');
    let tabIndexIssues = 0;
    focusableElements.forEach((element) => {
      const tabIndex = element.getAttribute('tabindex');
      if (tabIndex && parseInt(tabIndex) > 0) {
        tabIndexIssues++;
      }
    });

    if (tabIndexIssues > 0) {
      foundIssues.push({
        type: 'warning',
        category: 'Keyboard Navigation',
        message: `${tabIndexIssues} elements use positive tabindex`,
        suggestion: 'Avoid positive tabindex values; use 0 or -1, or rely on natural tab order'
      });
    }

    // Check for ARIA landmarks
    const landmarks = document.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer');
    if (landmarks.length === 0) {
      foundIssues.push({
        type: 'info',
        category: 'ARIA Landmarks',
        message: 'No ARIA landmarks found',
        suggestion: 'Add semantic HTML elements or ARIA landmarks for better navigation'
      });
    }

    setIssues(foundIssues);
    setIsChecking(false);
  };

  const toggleHighContrast = () => {
    setHighContrast(!highContrast);
    document.documentElement.classList.toggle('high-contrast', !highContrast);
  };

  const toggleLargeText = () => {
    setLargeText(!largeText);
    document.documentElement.classList.toggle('large-text', !largeText);
  };

  const toggleReducedMotion = () => {
    setReducedMotion(!reducedMotion);
    document.documentElement.classList.toggle('reduced-motion', !reducedMotion);
  };

  useEffect(() => {
    // Run initial check
    setTimeout(runAccessibilityCheck, 1000);
  }, []);

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info':
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-400" />;
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const issueStats = {
    errors: issues.filter(i => i.type === 'error').length,
    warnings: issues.filter(i => i.type === 'warning').length,
    info: issues.filter(i => i.type === 'info').length
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-600 rounded-md flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Accessibility Checker</h3>
              <p className="text-sm text-slate-600">Web accessibility compliance and testing tools</p>
            </div>
          </div>
          
          <button
            onClick={runAccessibilityCheck}
            disabled={isChecking}
            className="btn-secondary flex items-center space-x-2"
          >
            <Eye className={`w-4 h-4 ${isChecking ? 'animate-pulse' : ''}`} />
            <span>{isChecking ? 'Checking...' : 'Run Check'}</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Accessibility Tools */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Accessibility Tools</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={toggleHighContrast}
              className={`p-3 rounded-lg border text-left transition-colors ${
                highContrast 
                  ? 'bg-slate-900 text-white border-slate-700' 
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                <Contrast className="w-4 h-4" />
                <span className="text-sm font-medium">High Contrast</span>
              </div>
              <p className="text-xs opacity-75">Toggle high contrast mode</p>
            </button>
            
            <button
              onClick={toggleLargeText}
              className={`p-3 rounded-lg border text-left transition-colors ${
                largeText 
                  ? 'bg-blue-600 text-white border-blue-500' 
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                <Type className="w-4 h-4" />
                <span className="text-sm font-medium">Large Text</span>
              </div>
              <p className="text-xs opacity-75">Increase text size</p>
            </button>
            
            <button
              onClick={toggleReducedMotion}
              className={`p-3 rounded-lg border text-left transition-colors ${
                reducedMotion 
                  ? 'bg-green-600 text-white border-green-500' 
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                <MousePointer className="w-4 h-4" />
                <span className="text-sm font-medium">Reduced Motion</span>
              </div>
              <p className="text-xs opacity-75">Minimize animations</p>
            </button>
          </div>
        </div>

        {/* Issue Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-red-50 rounded-md border border-red-200">
            <div className="text-lg font-semibold text-red-800">{issueStats.errors}</div>
            <div className="text-xs text-red-600">Errors</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-md border border-yellow-200">
            <div className="text-lg font-semibold text-yellow-800">{issueStats.warnings}</div>
            <div className="text-xs text-yellow-600">Warnings</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-md border border-blue-200">
            <div className="text-lg font-semibold text-blue-800">{issueStats.info}</div>
            <div className="text-xs text-blue-600">Info</div>
          </div>
        </div>

        {/* Issues List */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-slate-700">Accessibility Issues</h4>
          
          {issues.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Great job!</h3>
              <p className="text-slate-600">No major accessibility issues found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map((issue, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-4 border ${getIssueColor(issue.type)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getIssueIcon(issue.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-900">
                          {issue.category}
                        </span>
                        <span className="text-xs text-slate-500 capitalize">
                          {issue.type}
                        </span>
                      </div>
                      
                      <p className="text-sm text-slate-700 mb-1">{issue.message}</p>
                      
                      {issue.element && (
                        <p className="text-xs text-slate-600 mb-2">
                          <span className="font-medium">Element:</span> {issue.element}
                        </p>
                      )}
                      
                      <p className="text-xs text-slate-600 bg-white bg-opacity-50 rounded p-2">
                        <span className="font-medium">Suggestion:</span> {issue.suggestion}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Keyboard Navigation Test */}
        <div className="border-t border-slate-200 pt-6 mt-6">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Keyboard Navigation Test</h4>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center space-x-2 mb-2">
              <Keyboard className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Test Instructions</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Press <kbd className="bg-white px-1 rounded">Tab</kbd> to navigate forward through interactive elements</li>
              <li>• Press <kbd className="bg-white px-1 rounded">Shift + Tab</kbd> to navigate backward</li>
              <li>• Press <kbd className="bg-white px-1 rounded">Enter</kbd> or <kbd className="bg-white px-1 rounded">Space</kbd> to activate buttons</li>
              <li>• Use arrow keys to navigate within menus and lists</li>
              <li>• Press <kbd className="bg-white px-1 rounded">Escape</kbd> to close modals and dropdowns</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});

AccessibilityChecker.displayName = 'AccessibilityChecker';

export default AccessibilityChecker;