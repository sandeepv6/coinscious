'use client'

import { useState, useEffect } from 'react';
import { TrendingUp, FileText, AlertCircle, ArrowUpRight, DollarSign, TrendingDown, BarChart4, PieChart, ArrowRight } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { marked } from 'marked';

type FinancialSummary = {
  highlights: string[];
  detailed_report: string;
};

export default function FinancialSummaryCard() {
  const { user, isLoaded } = useUser();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  
  // Fetch financial summary when component mounts or user changes
  useEffect(() => {
    if (isLoaded && user) {
      fetchFinancialSummary();
    }
  }, [isLoaded, user]);
  
  const fetchFinancialSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/finance/summary/clerk/${user?.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch financial summary');
      }
      
      const data = await response.json();
      
      // Ensure data is properly formatted
      if (data && typeof data === 'object') {
        // If highlights is not an array, try to parse it
        if (data.highlights && !Array.isArray(data.highlights)) {
          data.highlights = ensureHighlightsArray(data.highlights);
        }
        
        // If detailed_report is missing, create a placeholder
        if (!data.detailed_report) {
          data.detailed_report = "No detailed report available.";
        }
      }
      
      setSummary(data);
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      setError('Unable to load your financial summary at this time.');
    } finally {
      setLoading(false);
    }
  };
  
  const openDetailedReport = (section = 'overview') => {
    setActiveSection(section);
    setShowModal(true);
  };

  // Helper function to determine if a highlight is positive or negative
  const getHighlightSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
    const positiveTerms = ['increase', 'higher', 'surplus', 'saved', 'under budget', 'good', 'excellent', 'improved'];
    const negativeTerms = ['decrease', 'lower', 'deficit', 'overspent', 'over budget', 'concerning', 'poor', 'declined'];
    
    const lowerText = text.toLowerCase();
    
    if (positiveTerms.some(term => lowerText.includes(term))) {
      return 'positive';
    }
    if (negativeTerms.some(term => lowerText.includes(term))) {
      return 'negative';
    }
    return 'neutral';
  };
  
  // Add this function right after the getHighlightSentiment function:
  const ensureHighlightsArray = (highlights: any): string[] => {
    // If highlights is already an array, return it
    if (Array.isArray(highlights)) {
      return highlights;
    }
    
    // If highlights is a string, try to parse it as JSON
    if (typeof highlights === 'string') {
      try {
        const parsed = JSON.parse(highlights);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        // If it's a string but not a JSON array, split by newlines and clean up
        return highlights.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && (line.startsWith('-') || line.startsWith('*')))
          .map(line => line.substring(1).trim());
      } catch (e) {
        // If parsing fails, split by newlines and clean up
        return highlights.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && (line.startsWith('-') || line.startsWith('*')))
          .map(line => line.substring(1).trim());
      }
    }
    
    // If highlights is something else, return an empty array
    console.error('Unexpected highlights format:', highlights);
    return ['No highlights available'];
  };
  
  // Simplify the processDetailedReport function to concatenate all content
  const processDetailedReport = (report: any): string => {
    console.log("Report data:", report); // Debug log to see the actual structure
    
    // If it's a simple string, return it directly
    if (typeof report === 'string') {
      return report;
    }
    
    // Handle the case of a JSON object
    if (typeof report === 'object' && report !== null && !Array.isArray(report)) {
      let allContent = '';
      
      // Process each property in the object
      for (const [key, value] of Object.entries(report)) {
        // Add a section header
        allContent += `## ${key}\n\n`;
        
        // If the value is an array of strings, concatenate them
        if (Array.isArray(value)) {
          value.forEach((item) => {
            allContent += `${item}\n\n`;
          });
        } 
        // If it's a string, just add it
        else if (typeof value === 'string') {
          allContent += `${value}\n\n`;
        }
        // For any other type, stringify it
        else {
          allContent += `${JSON.stringify(value, null, 2)}\n\n`;
        }
      }
      
      return allContent;
    }
    
    // If it's an array, just concatenate all items
    if (Array.isArray(report)) {
      return report.join('\n\n');
    }
    
    // Fallback
    return 'No detailed report available.';
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 w-full bg-gray-200 rounded"></div>
          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
        <div className="mt-4 h-10 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Financial Summary</h3>
          <AlertCircle className="text-red-500" size={24} />
        </div>
        <p className="text-red-500">{error}</p>
        <button 
          onClick={fetchFinancialSummary}
          className="mt-4 w-full py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6 transition-all hover:shadow-md border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">AI Financial Insights</h3>
        <div className="bg-orange-100 p-2 rounded-full">
          <TrendingUp className="text-orange-500" size={20} />
        </div>
      </div>
      
      {summary && (
        <>
          {/* Report Navigation on main card */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div 
              onClick={() => openDetailedReport('overview')}
              className="bg-blue-50 p-2 rounded-lg flex items-center cursor-pointer hover:bg-blue-100 transition-colors"
            >
              <div className="bg-blue-100 p-1.5 rounded-full mr-2">
                <BarChart4 className="text-blue-600" size={14} />
              </div>
              <div>
                <p className="text-xs text-blue-800">Income & Expenses</p>
              </div>
            </div>
            
            <div 
              onClick={() => openDetailedReport('analysis')}
              className="bg-green-50 p-2 rounded-lg flex items-center cursor-pointer hover:bg-green-100 transition-colors"
            >
              <div className="bg-green-100 p-1.5 rounded-full mr-2">
                <PieChart className="text-green-600" size={14} />
              </div>
              <div>
                <p className="text-xs text-green-800">Spending Patterns</p>
              </div>
            </div>
            
            <div 
              onClick={() => openDetailedReport('recommendations')}
              className="bg-orange-50 p-2 rounded-lg flex items-center cursor-pointer hover:bg-orange-100 transition-colors"
            >
              <div className="bg-orange-100 p-1.5 rounded-full mr-2">
                <ArrowRight className="text-orange-600" size={14} />
              </div>
              <div>
                <p className="text-xs text-orange-800">Recommendations</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            {ensureHighlightsArray(summary.highlights).slice(0, 3).map((highlight, index) => {
              const sentiment = getHighlightSentiment(highlight);
              return (
                <div key={index} className="flex items-start bg-gray-50 p-3 rounded-lg">
                  <div className={`p-1.5 rounded-full mr-3 flex-shrink-0 ${
                    sentiment === 'positive' ? 'bg-green-100' : 
                    sentiment === 'negative' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {sentiment === 'positive' ? (
                      <TrendingUp className="text-green-600" size={16} />
                    ) : sentiment === 'negative' ? (
                      <TrendingDown className="text-red-600" size={16} />
                    ) : (
                      <BarChart4 className="text-blue-600" size={16} />
                    )}
                  </div>
                  <p className={`text-sm ${
                    sentiment === 'positive' ? 'text-green-800' : 
                    sentiment === 'negative' ? 'text-red-800' : 'text-gray-700'
                  }`}>
                    {highlight}
                  </p>
                </div>
              );
            })}
          </div>
          
          <button 
            onClick={() => openDetailedReport()}
            className="mt-2 w-full py-2.5 bg-orange-100 text-orange-800 rounded-lg font-medium hover:bg-orange-200 transition-colors flex items-center justify-center"
          >
            <FileText size={16} className="mr-2" />
            <span>View Full AI Financial Report</span>
          </button>
        </>
      )}
      
      {/* Detailed Report Modal */}
      {showModal && summary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <DollarSign className="text-orange-500 mr-2" />
                Financial Health Report
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {/* Report Navigation in modal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div 
                onClick={() => setActiveSection('overview')}
                className={`${activeSection === 'overview' ? 'ring-2 ring-blue-400' : ''} 
                  bg-blue-50 p-3 rounded-lg flex items-center cursor-pointer hover:bg-blue-100 transition-colors`}
              >
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <BarChart4 className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium">OVERVIEW</p>
                  <p className="text-sm text-blue-800">Income & Expenses</p>
                </div>
              </div>
              
              <div 
                onClick={() => setActiveSection('analysis')}
                className={`${activeSection === 'analysis' ? 'ring-2 ring-green-400' : ''} 
                  bg-green-50 p-3 rounded-lg flex items-center cursor-pointer hover:bg-green-100 transition-colors`}
              >
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <PieChart className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="text-xs text-green-600 font-medium">ANALYSIS</p>
                  <p className="text-sm text-green-800">Spending Patterns</p>
                </div>
              </div>
              
              <div 
                onClick={() => setActiveSection('recommendations')}
                className={`${activeSection === 'recommendations' ? 'ring-2 ring-orange-400' : ''} 
                  bg-orange-50 p-3 rounded-lg flex items-center cursor-pointer hover:bg-orange-100 transition-colors`}
              >
                <div className="bg-orange-100 p-2 rounded-full mr-3">
                  <ArrowRight className="text-orange-600" size={20} />
                </div>
                <div>
                  <p className="text-xs text-orange-600 font-medium">RECOMMENDATIONS</p>
                  <p className="text-sm text-orange-800">Next Steps</p>
                </div>
              </div>
            </div>
            
            {/* Highlights section in modal */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Key Insights</h3>
              <div className="space-y-3">
                {ensureHighlightsArray(summary.highlights).map((highlight, index) => {
                  const sentiment = getHighlightSentiment(highlight);
                  return (
                    <div key={index} className="flex items-start">
                      <div className={`p-1.5 rounded-full mr-3 flex-shrink-0 ${
                        sentiment === 'positive' ? 'bg-green-100' : 
                        sentiment === 'negative' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {sentiment === 'positive' ? (
                          <TrendingUp className="text-green-600" size={16} />
                        ) : sentiment === 'negative' ? (
                          <TrendingDown className="text-red-600" size={16} />
                        ) : (
                          <BarChart4 className="text-blue-600" size={16} />
                        )}
                      </div>
                      <p className={`${
                        sentiment === 'positive' ? 'text-green-800' : 
                        sentiment === 'negative' ? 'text-red-800' : 'text-gray-700'
                      }`}>
                        {highlight}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Render markdown content with enhanced styling */}
            <div className="prose max-w-none prose-headings:text-orange-800 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-h3:text-gray-700 prose-strong:text-gray-800 prose-a:text-orange-600 prose-ul:list-disc prose-li:ml-4">
              <div dangerouslySetInnerHTML={{ 
                __html: marked(processDetailedReport(summary.detailed_report)) 
              }} />
            </div>
            
            <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 