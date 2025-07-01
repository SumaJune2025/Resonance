import { useState, useEffect } from 'react'; // Import useEffect for local storage
import axios from 'axios';

export default function Home() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState(null);
  const [error, setError] = useState(null);
  // Set showPreferences to true by default so the survey is visible immediately
  const [showPreferences, setShowPreferences] = useState(true); 
  
  // User preferences state, initialized with empty strings for each option
  // Initial state will now be loaded from local storage
  const [preferences, setPreferences] = useState(() => {
    // Try to load preferences from local storage on initial render
    if (typeof window !== 'undefined') { // Ensure window is defined (client-side)
      const savedPreferences = localStorage.getItem('userPreferences');
      return savedPreferences ? JSON.parse(savedPreferences) : {
        flexibility: {
          workFromHome: '',
          flexibleHours: '',
          remoteLocation: ''
        },
        management: {
          structure: '',
          decisionMaking: '',
          autonomy: ''
        },
        inclusion: {
          womenLeadership: '',
          diversityRepresentation: '',
          inclusivePolicies: ''
        }
      };
    }
    // Default initial state for server-side rendering or if window is not defined
    return {
      flexibility: {
        workFromHome: '',
        flexibleHours: '',
        remoteLocation: ''
      },
      management: {
        structure: '',
        decisionMaking: '',
        autonomy: ''
      },
      inclusion: {
        womenLeadership: '',
        diversityRepresentation: '',
        inclusivePolicies: ''
      }
    };
  });

  // useEffect to save preferences to local storage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') { // Ensure window is defined (client-side)
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
    }
  }, [preferences]); // Dependency array: run this effect whenever 'preferences' state changes

  /**
   * Handles changes in the preference survey radio buttons.
   * @param {string} category - The main category of the preference (e.g., 'flexibility').
   * @param {string} field - The specific field within the category (e.g., 'workFromHome').
   * @param {string} value - The selected value for the field.
   */
  const handlePreferenceChange = (category, field, value) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  /**
   * Resets all user preferences to their initial empty state and clears local storage.
   */
  const handleResetPreferences = () => {
    const initialPreferences = {
      flexibility: {
        workFromHome: '',
        flexibleHours: '',
        remoteLocation: ''
      },
      management: {
        structure: '',
        decisionMaking: '',
        autonomy: ''
      },
      inclusion: {
        womenLeadership: '',
        diversityRepresentation: '',
        inclusivePolicies: ''
      }
    };
    setPreferences(initialPreferences);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userPreferences');
    }
    setError(null); // Clear any previous errors
    setCompany(null); // Clear previous company results
  };

  /**
   * Handles the enrichment process, sending the domain and preferences to the API.
   */
  const handleEnrich = async () => {
    if (!domain.trim()) {
      setError('Please enter a domain');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // Convert preferences to a simplified format for the API (e.g., average score per category)
      const formattedPreferences = {
        flexibility: getPreferenceScore(preferences.flexibility),
        management: getPreferenceScore(preferences.management),
        inclusion: getPreferenceScore(preferences.inclusion)
      };

      // Use POST request to send preferences in the body
      const res = await axios.post('/api/enrich', {
        domain,
        preferences: formattedPreferences
      });
      setCompany(res.data);
    } catch (err) {
      console.error(err);
      setError('Could not enrich company data. Please try again.');
    }
    setLoading(false);
  };

  /**
   * Helper function to convert preference responses (e.g., 'very-important') to a numerical score.
   * @param {object} categoryPrefs - An object containing preferences for a specific category.
   * @returns {number} - The average score for the category (1-5).
   */
  const getPreferenceScore = (categoryPrefs) => {
    const values = Object.values(categoryPrefs).filter(v => v !== ''); // Filter out unselected options
    if (values.length === 0) return 0; // Return 0 if no preferences are selected for the category
    
    // Map preference strings to numerical scores
    const scoreMap = {
      'very-important': 5,
      'important': 4,
      'somewhat-important': 3,
      'not-important': 2,
      'not-applicable': 1 // Treat 'not-applicable' as a low score or neutral
    };
    
    const totalScore = values.reduce((sum, val) => sum + (scoreMap[val] || 0), 0);
    // Return the average score, rounded to the nearest integer
    return Math.round(totalScore / values.length);
  };

  // Inline styles for the components (can be moved to a CSS file or Tailwind classes)
  const styles = {
    container: {
      padding: '24px',
      fontFamily: 'Inter, sans-serif', // Using Inter font
      maxWidth: '900px',
      margin: '0 auto',
      backgroundColor: '#f9fafb',
      minHeight: '100vh',
      borderRadius: '12px', // Rounded corners for the main container
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      marginBottom: '8px',
      color: '#111827',
      textAlign: 'center'
    },
    subtitle: {
      marginBottom: '24px', 
      color: '#6b7280',
      textAlign: 'center',
      fontSize: '16px'
    },
    inputContainer: {
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '24px'
    },
    preferencesContainer: {
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '24px'
    },
    input: {
      border: '2px solid #e5e7eb',
      padding: '12px',
      width: '100%',
      marginBottom: '12px',
      borderRadius: '8px',
      fontSize: '16px',
      transition: 'border-color 0.2s',
      outline: 'none'
    },
    button: {
      backgroundColor: loading ? '#9ca3af' : '#1f2937',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      cursor: loading ? 'not-allowed' : 'pointer',
      fontSize: '16px',
      fontWeight: '600',
      width: '100%',
      transition: 'background-color 0.2s',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    toggleButton: {
      backgroundColor: '#3b82f6',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      marginBottom: '16px',
      transition: 'background-color 0.2s',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    resetButton: {
      backgroundColor: '#ef4444', // Red color for reset
      color: 'white',
      padding: '10px 20px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      marginBottom: '16px',
      marginLeft: '10px', // Add some margin
      transition: 'background-color 0.2s',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    error: {
      color: '#dc2626',
      marginTop: '8px',
      padding: '8px',
      backgroundColor: '#fef2f2',
      borderRadius: '4px',
      border: '1px solid #fecaca'
    },
    result: {
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
    },
    resultTitle: {
      fontSize: '24px',
      fontWeight: '700',
      marginBottom: '8px',
      color: '#111827'
    },
    matchScore: {
      backgroundColor: '#f0fdf4',
      border: '2px solid #22c55e',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(34,197,94,0.2)'
    },
    matchScoreTitle: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#15803d',
      marginBottom: '8px'
    },
    matchScoreValue: {
      fontSize: '32px',
      fontWeight: '800',
      color: '#15803d',
      marginBottom: '8px'
    },
    matchReasons: {
      fontSize: '14px',
      color: '#166534',
      lineHeight: '1.5'
    },
    summary: {
      marginBottom: '16px',
      whiteSpace: 'pre-line',
      lineHeight: '1.6',
      color: '#374151',
      fontSize: '15px'
    },
    tagsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginBottom: '20px'
    },
    tag: {
      backgroundColor: '#dbeafe',
      fontSize: '13px',
      padding: '6px 12px',
      borderRadius: '16px',
      color: '#1e40af',
      fontWeight: '500'
    },
    categoryTitle: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '12px',
      color: '#374151',
      borderBottom: '2px solid #e5e7eb',
      paddingBottom: '8px'
    },
    questionGroup: {
      marginBottom: '20px'
    },
    questionLabel: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#4b5563',
      marginBottom: '8px',
      display: 'block'
    },
    radioGroup: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      marginBottom: '12px'
    },
    radioOption: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '13px',
      color: '#6b7280'
    },
    radioInput: {
      margin: '0',
      transform: 'scale(1.1)'
    },
    insightsSection: {
      marginTop: '20px',
      padding: '16px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    },
    insightsTitle: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '12px',
      color: '#475569'
    },
    insightItem: {
      marginBottom: '8px',
      fontSize: '14px',
      color: '#64748b'
    },
    linksContainer: {
      marginTop: '20px',
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap'
    },
    linkButton: {
      display: 'inline-block',
      backgroundColor: '#2563eb',
      color: 'white',
      padding: '10px 16px',
      borderRadius: '6px',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'background-color 0.2s',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    note: {
      fontSize: '12px',
      color: '#9ca3af',
      fontStyle: 'italic',
      marginTop: '12px',
      padding: '8px',
      backgroundColor: '#f9fafb',
      borderRadius: '4px'
    },
    disclaimer: {
      fontSize: '12px',
      color: '#6b7280',
      textAlign: 'center',
      marginTop: '30px',
      padding: '10px',
      backgroundColor: '#e0e7ff', // Light blue background for emphasis
      borderRadius: '8px',
      border: '1px solid #93c5fd'
    }
  };

  // Helper function to clean domain for searches
  const getCleanDomain = (domain) => {
    return domain.replace(/https?:\/\//g, '')
                 .replace(/www\./g, '')
                 .replace(/linkedin\.com\/company\//g, '');
  };

  // Function to determine color scheme for match score based on its value
  const getMatchScoreColor = (score) => {
    if (score >= 4) return { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' }; // Green for high score
    if (score >= 2) return { bg: '#fffbeb', border: '#f59e0b', text: '#d97706' }; // Orange for medium score
    return { bg: '#fef2f2', border: '#ef4444', text: '#dc2626' }; // Red for low score
  };

  // Component to render the preferences survey form
  const renderPreferencesForm = () => (
    <div style={styles.preferencesContainer}>
      <h3 style={styles.categoryTitle}>📋 Your Work Preferences</h3>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
        Please rate the importance of the following cultural aspects to you. Your selections will help us find companies that best align with your values.
      </p>

      {/* Work Flexibility Section */}
      <div style={{...styles.categoryTitle, marginTop: '20px'}}>🏠 Work Flexibility</div>
      
      <div style={styles.questionGroup}>
        <label style={styles.questionLabel}>Work from Home Options</label>
        <div style={styles.radioGroup}>
          {[
            { value: 'very-important', label: 'Very Important' },
            { value: 'important', label: 'Important' },
            { value: 'somewhat-important', label: 'Somewhat Important' },
            { value: 'not-important', label: 'Not Important' },
            { value: 'not-applicable', label: 'Not Applicable' }
          ].map(option => (
            <label key={option.value} style={styles.radioOption}>
              <input
                type="radio"
                name="workFromHome"
                value={option.value}
                checked={preferences.flexibility.workFromHome === option.value}
                onChange={(e) => handlePreferenceChange('flexibility', 'workFromHome', e.target.value)}
                style={styles.radioInput}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div style={styles.questionGroup}>
        <label style={styles.questionLabel}>Flexible Working Hours</label>
        <div style={styles.radioGroup}>
          {[
            { value: 'very-important', label: 'Very Important' },
            { value: 'important', label: 'Important' },
            { value: 'somewhat-important', label: 'Somewhat Important' },
            { value: 'not-important', label: 'Not Important' },
            { value: 'not-applicable', label: 'Not Applicable' }
          ].map(option => (
            <label key={option.value} style={styles.radioOption}>
              <input
                type="radio"
                name="flexibleHours"
                value={option.value}
                checked={preferences.flexibility.flexibleHours === option.value}
                onChange={(e) => handlePreferenceChange('flexibility', 'flexibleHours', e.target.value)}
                style={styles.radioInput}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div style={styles.questionGroup}>
        <label style={styles.questionLabel}>Remote Work from Different Locations</label>
        <div style={styles.radioGroup}>
          {[
            { value: 'very-important', label: 'Very Important' },
            { value: 'important', label: 'Important' },
            { value: 'somewhat-important', label: 'Somewhat Important' },
            { value: 'not-important', label: 'Not Important' },
            { value: 'not-applicable', label: 'Not Applicable' }
          ].map(option => (
            <label key={option.value} style={styles.radioOption}>
              <input
                type="radio"
                name="remoteLocation"
                value={option.value}
                checked={preferences.flexibility.remoteLocation === option.value}
                onChange={(e) => handlePreferenceChange('flexibility', 'remoteLocation', e.target.value)}
                style={styles.radioInput}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {/* Management Structure Section */}
      <div style={{...styles.categoryTitle, marginTop: '20px'}}>👥 Management Structure</div>
      
      <div style={styles.questionGroup}>
        <label style={styles.questionLabel}>Organizational Structure (Flat vs Hierarchical)</label>
        <div style={styles.radioGroup}>
          {[
            { value: 'very-important', label: 'Very Important' },
            { value: 'important', label: 'Important' },
            { value: 'somewhat-important', label: 'Somewhat Important' },
            { value: 'not-important', label: 'Not Important' },
            { value: 'not-applicable', label: 'Not Applicable' }
          ].map(option => (
            <label key={option.value} style={styles.radioOption}>
              <input
                type="radio"
                name="structure"
                value={option.value}
                checked={preferences.management.structure === option.value}
                onChange={(e) => handlePreferenceChange('management', 'structure', e.target.value)}
                style={styles.radioInput}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div style={styles.questionGroup}>
        <label style={styles.questionLabel}>Collaborative Decision Making</label>
        <div style={styles.radioGroup}>
          {[
            { value: 'very-important', label: 'Very Important' },
            { value: 'important', label: 'Important' },
            { value: 'somewhat-important', label: 'Somewhat Important' },
            { value: 'not-important', label: 'Not Important' },
            { value: 'not-applicable', label: 'Not Applicable' }
          ].map(option => (
            <label key={option.value} style={styles.radioOption}>
              <input
                type="radio"
                name="decisionMaking"
                value={option.value}
                checked={preferences.management.decisionMaking === option.value}
                onChange={(e) => handlePreferenceChange('management', 'decisionMaking', e.target.value)}
                style={styles.radioInput}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div style={styles.questionGroup}>
        <label style={styles.questionLabel}>Work Autonomy and Independence</label>
        <div style={styles.radioGroup}>
          {[
            { value: 'very-important', label: 'Very Important' },
            { value: 'important', label: 'Important' },
            { value: 'somewhat-important', label: 'Somewhat Important' },
            { value: 'not-important', label: 'Not Important' },
            { value: 'not-applicable', label: 'Not Applicable' }
          ].map(option => (
            <label key={option.value} style={styles.radioOption}>
              <input
                type="radio"
                name="autonomy"
                value={option.value}
                checked={preferences.management.autonomy === option.value}
                onChange={(e) => handlePreferenceChange('management', 'autonomy', e.target.value)}
                style={styles.radioInput}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {/* Inclusion & Diversity Section */}
      <div style={{...styles.categoryTitle, marginTop: '20px'}}>🌈 Inclusion & Diversity</div>
      
      <div style={styles.questionGroup}>
        <label style={styles.questionLabel}>Women in Leadership Positions</label>
        <div style={styles.radioGroup}>
          {[
            { value: 'very-important', label: 'Very Important' },
            { value: 'important', label: 'Important' },
            { value: 'somewhat-important', label: 'Somewhat Important' },
            { value: 'not-important', label: 'Not Important' },
            { value: 'not-applicable', label: 'Not Applicable' }
          ].map(option => (
            <label key={option.value} style={styles.radioOption}>
              <input
                type="radio"
                name="womenLeadership"
                value={option.value}
                checked={preferences.inclusion.womenLeadership === option.value}
                onChange={(e) => handlePreferenceChange('inclusion', 'womenLeadership', e.target.value)}
                style={styles.radioInput}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div style={styles.questionGroup}>
        <label style={styles.questionLabel}>Diverse Representation (Race, Caste, Gender, Religion)</label>
        <div style={styles.radioGroup}>
          {[
            { value: 'very-important', label: 'Very Important' },
            { value: 'important', label: 'Important' },
            { value: 'somewhat-important', label: 'Somewhat Important' },
            { value: 'not-important', label: 'Not Important' },
            { value: 'not-applicable', label: 'Not Applicable' }
          ].map(option => (
            <label key={option.value} style={styles.radioOption}>
              <input
                type="radio"
                name="diversityRepresentation"
                value={option.value}
                checked={preferences.inclusion.diversityRepresentation === option.value}
                onChange={(e) => handlePreferenceChange('inclusion', 'diversityRepresentation', e.target.value)}
                style={styles.radioInput}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div style={styles.questionGroup}>
        <label style={styles.questionLabel}>Inclusive Policies and Practices</label>
        <div style={styles.radioGroup}>
          {[
            { value: 'very-important', label: 'Very Important' },
            { value: 'important', label: 'Important' },
            { value: 'somewhat-important', label: 'Somewhat Important' },
            { value: 'not-important', label: 'Not Important' },
            { value: 'not-applicable', label: 'Not Applicable' }
          ].map(option => (
            <label key={option.value} style={styles.radioOption}>
              <input
                type="radio"
                name="inclusivePolicies"
                value={option.value}
                checked={preferences.inclusion.inclusivePolicies === option.value}
                onChange={(e) => handlePreferenceChange('inclusion', 'inclusivePolicies', e.target.value)}
                style={styles.radioInput}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
        <button
          style={styles.resetButton}
          onClick={handleResetPreferences}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
        >
          Reset Preferences
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🌐 Values Sync</h1>
      <p style={styles.subtitle}>
        Discover company culture and values alignment through intelligent domain analysis
      </p>

      <div style={styles.inputContainer}>
        <input
          style={styles.input}
          placeholder="Enter company domain (e.g., acme.com or linkedin.com/company/acme)"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleEnrich()}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        />
        
        {/* Toggle button for showing/hiding preferences */}
        <button
          style={{...styles.toggleButton, marginBottom: showPreferences ? '16px' : '0'}}
          onClick={() => setShowPreferences(!showPreferences)}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
        >
          {showPreferences ? '🔼 Hide Preferences Survey' : '🔽 Show Preferences Survey (Optional)'}
        </button>

        <button
          style={styles.button}
          onClick={handleEnrich}
          disabled={loading}
          onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#111827')}
          onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#1f2937')}
        >
          {loading ? 'Analyzing Culture...' : 'Analyze Company Culture'}
        </button>

        {error && <div style={styles.error}>{error}</div>}
      </div>

      {/* Display Match Score and Company Details at the top, conditional on company data */}
      {company && (
        <div style={styles.result}>
          <h2 style={styles.resultTitle}>{company.domain}</h2>
          
          {company.match && company.match.score !== undefined && ( // Check for undefined to allow 0 score
            <div style={{
              ...styles.matchScore,
              backgroundColor: getMatchScoreColor(company.match.score).bg,
              borderColor: getMatchScoreColor(company.match.score).border
            }}>
              <div style={{
                ...styles.matchScoreTitle,
                color: getMatchScoreColor(company.match.score).text
              }}>
                🎯 Culture Match Score
              </div>
              <div style={{
                ...styles.matchScoreValue,
                color: getMatchScoreColor(company.match.score).text
              }}>
                {company.match.score}/5
              </div>
              {company.match.reasons && company.match.reasons.length > 0 && (
                <div style={{
                  ...styles.matchReasons,
                  color: getMatchScoreColor(company.match.score).text
                }}>
                  <strong>Matching factors:</strong>
                  <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                    {company.match.reasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
              {company.match.reasons && company.match.reasons.length === 0 && (
                <div style={{
                  ...styles.matchReasons,
                  color: getMatchScoreColor(company.match.score).text
                }}>
                  No specific matching factors found based on your preferences and company analysis.
                </div>
              )}
            </div>
          )}
          
          <p style={styles.summary}>
            {company.summary?.summary || company.summary}
          </p>
          
          {company.summary?.tags && company.summary.tags.length > 0 && (
            <div>
              <strong style={{color: '#374151', marginBottom: '8px', display: 'block'}}>
                General Cultural Tags:
              </strong>
              <div style={styles.tagsContainer}>
                {company.summary.tags.map((tag, index) => (
                  <span key={index} style={styles.tag}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {company.culturalInsights && (
            <div style={styles.insightsSection}>
              <h3 style={styles.insightsTitle}>Detailed Cultural Insights</h3>
              
              {company.culturalInsights.insights && (
                <div>
                  {Object.entries(company.culturalInsights.insights).map(([key, value]) => (
                    value && (
                      <div key={key} style={styles.insightItem}>
                        <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
                      </div>
                    )
                  ))}
                </div>
              )}

              {company.culturalInsights.tags && company.culturalInsights.tags.length > 0 && (
                <div>
                  <strong style={{color: '#374151', marginBottom: '8px', display: 'block'}}>
                    Specific Cultural Tags:
                  </strong>
                  <div style={styles.tagsContainer}>
                    {company.culturalInsights.tags.map((tag, index) => (
                      <span key={index} style={{...styles.tag, backgroundColor: '#ecfdf5', color: '#059669'}}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {company.culturalInsights.note && (
                <div style={styles.note}>
                  {company.culturalInsights.note}
                </div>
              )}
            </div>
          )}
          
          <div style={styles.linksContainer}>
            <a
              href={`https://www.google.com/search?q=site:linkedin.com/company+${encodeURIComponent(getCleanDomain(company.domain))}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.linkButton}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
            >
              🔍 LinkedIn Posts
            </a>
            <a
              href={`https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(getCleanDomain(company.domain))}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.linkButton}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
            >
              💼 Glassdoor Reviews
            </a>
            <a
              href={`https://${getCleanDomain(company.domain)}/careers`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.linkButton}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
            >
              🚀 Career Page
            </a>
          </div>
        </div>
      )}

      {/* Render preferences form only if showPreferences is true (now at the bottom) */}
      {showPreferences && renderPreferencesForm()}

      {/* Disclaimer Section */}
      <div style={styles.disclaimer}>
        <strong>Disclaimer:</strong> Company and organization-related data, including cultural insights and tags, are based on publicly available reviews, company web pages, and social media pages. This analysis is simulated and intended for informational purposes only, and may not reflect the full complexity of a company's culture. For more detailed and accurate insights, direct research and engagement with the company are recommended.
      </div>
    </div>
  );
}
