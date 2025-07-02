import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState(null);
  const [error, setError] = useState(null);

  // New state to manage the current step: 'preferences' or 'analysis'
  const [currentStep, setCurrentStep] = useState('preferences');

  const [preferences, setPreferences] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedPreferences = localStorage.getItem('userPreferences');
      if (savedPreferences) {
        // If preferences exist, start at the analysis step
        setCurrentStep('analysis');
        return JSON.parse(savedPreferences);
      }
      // If no saved preferences, stay at the preferences step
      return {
        flexibility: { workFromHome: '', flexibleHours: '', remoteLocation: '' },
        management: { structure: '', decisionMaking: '', autonomy: '' },
        inclusion: { womenLeadership: '', diversityRepresentation: '', inclusivePolicies: '' }
      };
    }
    return {
      flexibility: { workFromHome: '', flexibleHours: '', remoteLocation: '' },
      management: { structure: '', decisionMaking: '', autonomy: '' },
      inclusion: { womenLeadership: '', diversityRepresentation: '', inclusivePolicies: '' }
    };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
    }
  }, [preferences]);

  const handlePreferenceChange = (category, field, value) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleResetPreferences = () => {
    const initialPreferences = {
      flexibility: { workFromHome: '', flexibleHours: '', remoteLocation: '' },
      management: { structure: '', decisionMaking: '', autonomy: '' },
      inclusion: { womenLeadership: '', diversityRepresentation: '', inclusivePolicies: '' }
    };
    setPreferences(initialPreferences);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userPreferences');
    }
    setError(null);
    setCompany(null);
    setCurrentStep('preferences'); // Go back to preferences after reset
  };

  // New function to save preferences and proceed to analysis
  const handleSavePreferencesAndContinue = () => {
    // Basic validation: ensure at least one preference is selected
    const allPreferencesSelected = Object.values(preferences).every(category =>
      Object.values(category).some(value => value !== '')
    );

    if (!allPreferencesSelected) {
      setError('Please select at least one preference in each category to proceed.');
      return;
    }
    setError(null);
    setCurrentStep('analysis');
  };

  const handleEnrich = async () => {
    if (!domain.trim()) {
      setError('Please enter a domain.');
      return;
    }

    setLoading(true);
    setError(null);
    setCompany(null); // Clear previous company data
    try {
      const formattedPreferences = {
        flexibility: getPreferenceScore(preferences.flexibility),
        management: getPreferenceScore(preferences.management),
        inclusion: getPreferenceScore(preferences.inclusion)
      };

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

  const getPreferenceScore = (categoryPrefs) => {
    const values = Object.values(categoryPrefs).filter(v => v !== '');
    if (values.length === 0) return 0;

    const scoreMap = {
      'very-important': 5,
      'important': 4,
      'somewhat-important': 3,
      'not-important': 2,
      'not-applicable': 1
    };

    const totalScore = values.reduce((sum, val) => sum + (scoreMap[val] || 0), 0);
    return Math.round(totalScore / values.length);
  };

  const styles = {
    container: {
      padding: '24px',
      fontFamily: 'Inter, sans-serif',
      maxWidth: '900px',
      margin: '0 auto',
      backgroundColor: '#f0f9ff', // Light Teal background
      minHeight: '100vh',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      '@media (max-width: 768px)': {
        padding: '16px',
      }
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      marginBottom: '12px',
      color: '#0f172a',
      textAlign: 'center',
      '@media (max-width: 768px)': {
        fontSize: '28px',
      }
    },
    subtitle: {
      marginBottom: '32px',
      color: '#475569',
      textAlign: 'center',
      fontSize: '18px',
      '@media (max-width: 768px)': {
        fontSize: '16px',
      }
    },
    sectionHeading: { // New style for section headings
      fontSize: '24px',
      fontWeight: '600',
      marginBottom: '20px',
      color: '#0e7490', // Teal heading
      textAlign: 'center',
      borderBottom: '2px solid #a7f3d0',
      paddingBottom: '10px'
    },
    inputContainer: {
      backgroundColor: 'white',
      padding: '28px',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      marginBottom: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    preferencesContainer: {
      backgroundColor: 'white',
      padding: '28px',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      marginBottom: '24px'
    },
    input: {
      border: '2px solid #a7f3d0',
      padding: '14px',
      width: '100%',
      borderRadius: '8px',
      fontSize: '17px',
      transition: 'border-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
      outline: 'none',
      '&:focus': {
        borderColor: '#14b8a6',
        boxShadow: '0 0 0 3px rgba(20, 184, 166, 0.2)'
      }
    },
    button: {
      backgroundColor: loading ? '#94a3b8' : '#14b8a6',
      color: 'white',
      padding: '14px 28px',
      borderRadius: '8px',
      border: 'none',
      cursor: loading ? 'not-allowed' : 'pointer',
      fontSize: '17px',
      fontWeight: '600',
      width: '100%',
      transition: 'background-color 0.3s ease-in-out, transform 0.2s',
      boxShadow: '0 4px 10px rgba(20, 184, 166, 0.2)',
      '&:hover': {
        backgroundColor: '#0f766e',
        transform: 'translateY(-2px)'
      }
    },
    secondaryButton: { // New style for secondary actions
      backgroundColor: '#06b6d4',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: '500',
      transition: 'background-color 0.2s',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      display: 'inline-block',
      marginTop: '15px'
    },
    resetButton: {
      backgroundColor: '#ef4444',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      marginBottom: '16px',
      marginLeft: '10px',
      transition: 'background-color 0.2s',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    error: {
      color: '#dc2626',
      marginTop: '16px',
      padding: '12px',
      backgroundColor: '#fef2f2',
      borderRadius: '8px',
      border: '1px solid #fecaca',
      fontSize: '14px'
    },
    result: {
      backgroundColor: 'white',
      border: '1px solid #e0f2f7',
      padding: '28px',
      borderRadius: '12px',
      boxShadow: '0 6px 12px rgba(0,0,0,0.08)'
    },
    resultTitle: {
      fontSize: '26px',
      fontWeight: '700',
      marginBottom: '10px',
      color: '#0f172a'
    },
    matchScore: {
      backgroundColor: '#ecfdf5',
      border: '2px solid #34d399',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      textAlign: 'center',
      boxShadow: '0 4px 12px rgba(52,211,153,0.2)'
    },
    matchScoreTitle: {
      fontSize: '22px',
      fontWeight: '700',
      color: '#065f46',
      marginBottom: '12px'
    },
    matchScoreValue: {
      fontSize: '38px',
      fontWeight: '800',
      color: '#065f46',
      marginBottom: '12px'
    },
    matchReasons: {
      fontSize: '15px',
      color: '#065f46',
      lineHeight: '1.6'
    },
    summary: {
      marginBottom: '20px',
      whiteSpace: 'pre-line',
      lineHeight: '1.7',
      color: '#374151',
      fontSize: '16px'
    },
    tagsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
      marginBottom: '24px'
    },
    tag: {
      backgroundColor: '#d1fae5',
      fontSize: '14px',
      padding: '8px 16px',
      borderRadius: '20px',
      color: '#065f46',
      fontWeight: '500'
    },
    categoryTitle: {
      fontSize: '20px',
      fontWeight: '600',
      marginBottom: '16px',
      color: '#374151',
      borderBottom: '2px solid #e2e8f0',
      paddingBottom: '10px'
    },
    questionGroup: {
      marginBottom: '24px'
    },
    questionLabel: {
      fontSize: '15px',
      fontWeight: '500',
      color: '#4b5563',
      marginBottom: '10px',
      display: 'block'
    },
    radioGroup: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '14px',
      marginBottom: '12px'
    },
    radioOption: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: '#6b7280'
    },
    radioInput: {
      margin: '0',
      transform: 'scale(1.2)'
    },
    insightsSection: {
      marginTop: '24px',
      padding: '20px',
      backgroundColor: '#f0f9ff',
      borderRadius: '10px',
      border: '1px solid #cffafe'
    },
    insightsTitle: {
      fontSize: '20px',
      fontWeight: '600',
      marginBottom: '16px',
      color: '#083344'
    },
    insightItem: {
      marginBottom: '10px',
      fontSize: '15px',
      color: '#334155'
    },
    linksContainer: {
      marginTop: '24px',
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    linkButton: {
      display: 'inline-block',
      backgroundColor: '#0ea5e9',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '8px',
      textDecoration: 'none',
      fontSize: '15px',
      fontWeight: '500',
      transition: 'background-color 0.2s, transform 0.2s',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      '&:hover': {
        backgroundColor: '#0284c7',
        transform: 'translateY(-1px)'
      }
    },
    note: {
      fontSize: '13px',
      color: '#64748b',
      fontStyle: 'italic',
      marginTop: '16px',
      padding: '10px',
      backgroundColor: '#f8fafc',
      borderRadius: '6px'
    },
    disclaimer: {
      fontSize: '13px',
      color: '#475569',
      textAlign: 'center',
      marginTop: '40px',
      padding: '15px',
      backgroundColor: '#e0f2fe',
      borderRadius: '10px',
      border: '1px solid #7dd3fc',
      lineHeight: '1.6'
    }
  };

  const getCleanDomain = (domain) => {
    return domain.replace(/https?:\/\//g, '')
                 .replace(/www\./g, '')
                 .replace(/linkedin\.com\/company\//g, '');
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return { bg: '#ecfdf5', border: '#34d399', text: '#065f46' };
    if (score >= 50) return { bg: '#fff7ed', border: '#fbbf24', text: '#b45309' };
    return { bg: '#fef2f2', border: '#f87171', text: '#b91c1c' };
  };

  const renderPreferencesForm = () => (
    <div style={styles.preferencesContainer}>
      <h3 style={styles.sectionHeading}>📋 What values and aspects of organization culture are important to you?</h3>
      <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '24px', textAlign: 'center' }}>
        Please rate the importance of the following cultural aspects to you. Your selections will help us find companies that best align with your values.
      </p>

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
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '30px' }}>
        <button
          style={{...styles.button, width: 'auto', padding: '12px 25px'}}
          onClick={handleSavePreferencesAndContinue}
          onMouseEnter={(e) => e.target.style.backgroundColor = styles.button['&:hover'].backgroundColor}
          onMouseLeave={(e) => e.target.style.backgroundColor = styles.button.backgroundColor}
        >
          Save Preferences & Continue {'->'}
        </button>
        <button
          style={{...styles.resetButton, width: 'auto', padding: '12px 25px', marginLeft: 0}}
          onClick={handleResetPreferences}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
        >
          Reset Preferences
        </button>
      </div>
      {error && <div style={{...styles.error, marginTop: '20px', textAlign: 'center'}}>{error}</div>}
    </div>
  );

  const renderAnalysisSection = () => (
    <>
      <h3 style={styles.sectionHeading}>🔎 Now, check if the organization you are interested in syncs with your values!</h3>
      <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '24px', textAlign: 'center' }}>
        Enter a company domain below to see how well its culture aligns with your preferences.
      </p>

      <div style={styles.inputContainer}>
        <input
          style={styles.input}
          placeholder="Enter company domain (e.g., acme.com or linkedin.com/company/acme)"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleEnrich()}
          onFocus={(e) => e.target.style.borderColor = styles.input['&:focus'].borderColor}
          onBlur={(e) => e.target.style.borderColor = styles.input.border.split(' ')[2]}
        />

        <button
          style={styles.button}
          onClick={handleEnrich}
          disabled={loading}
          onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = styles.button['&:hover'].backgroundColor)}
          onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = styles.button.backgroundColor)}
        >
          {loading ? 'Analyzing Culture...' : 'Analyze Company Culture'}
        </button>

        {error && <div style={styles.error}>{error}</div>}
      </div>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <button
          style={styles.secondaryButton}
          onClick={() => setCurrentStep('preferences')}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#0284c7'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#06b6d4'}
        >
          ✏️ Edit My Preferences
        </button>
      </div>

      {company && (
        <div style={styles.result}>
          <h2 style={styles.resultTitle}>{company.domain}</h2>

          {company.match && company.match.score !== undefined && (
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
                {company.match.score}%
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
              onMouseEnter={(e) => e.target.style.backgroundColor = styles.linkButton['&:hover'].backgroundColor}
              onMouseLeave={(e) => e.target.style.backgroundColor = styles.linkButton.backgroundColor}
            >
              🔍 LinkedIn Posts
            </a>
            <a
              href={`https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(getCleanDomain(company.domain))}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.linkButton}
              onMouseEnter={(e) => e.target.style.backgroundColor = styles.linkButton['&:hover'].backgroundColor}
              onMouseLeave={(e) => e.target.style.backgroundColor = styles.linkButton.backgroundColor}
            >
              💼 Glassdoor Reviews
            </a>
            <a
              href={`https://${getCleanDomain(company.domain)}/careers`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.linkButton}
              onMouseEnter={(e) => e.target.style.backgroundColor = styles.linkButton['&:hover'].backgroundColor}
              onMouseLeave={(e) => e.target.style.backgroundColor = styles.linkButton.backgroundColor}
            >
              🚀 Career Page
            </a>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🌐 Values Sync</h1>
      <p style={styles.subtitle}>
        Discover company culture and values alignment through intelligent domain analysis
      </p>

      {currentStep === 'preferences' ? renderPreferencesForm() : renderAnalysisSection()}

      <div style={styles.disclaimer}>
        <strong>Disclaimer:</strong> Company and organization-related data, including cultural insights and tags, are based on publicly available reviews, company web pages, and social media pages. This analysis is simulated and intended for informational purposes only, and may not reflect the full complexity of a company's culture. For more detailed and accurate insights, direct research and engagement with the company are recommended.
      </div>
    </div>
  );
}
