import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState(null);
  const [error, setError] = useState(null);

  const handleEnrich = async () => {
    if (!domain.trim()) {
      setError('Please enter a domain');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/enrich?domain=${encodeURIComponent(domain)}`);
      setCompany(res.data);
    } catch (err) {
      console.error(err);
      setError('Could not enrich company data. Please try again.');
    }
    setLoading(false);
  };

  const styles = {
    container: {
      padding: '24px',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '700px',
      margin: '0 auto',
      backgroundColor: '#f9fafb',
      minHeight: '100vh'
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
      transition: 'background-color 0.2s'
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
      transition: 'background-color 0.2s'
    },
    note: {
      fontSize: '12px',
      color: '#9ca3af',
      fontStyle: 'italic',
      marginTop: '12px',
      padding: '8px',
      backgroundColor: '#f9fafb',
      borderRadius: '4px'
    }
  };

  // Helper function to clean domain for searches
  const getCleanDomain = (domain) => {
    return domain.replace(/https?:\/\//g, '')
                 .replace(/www\./g, '')
                 .replace(/linkedin\.com\/company\//g, '');
  };

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

      {company && (
        <div style={styles.result}>
          <h2 style={styles.resultTitle}>{company.domain}</h2>
          <p style={styles.summary}>
            {company.summary?.summary || company.summary}
          </p>
          
          {company.summary?.tags && company.summary.tags.length > 0 && (
            <div>
              <strong style={{color: '#374151', marginBottom: '8px', display: 'block'}}>
                Cultural Tags:
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
              <h3 style={styles.insightsTitle}>Cultural Insights</h3>
              
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
                <div style={styles.tagsContainer}>
                  {company.culturalInsights.tags.map((tag, index) => (
                    <span key={index} style={{...styles.tag, backgroundColor: '#ecfdf5', color: '#059669'}}>
                      #{tag}
                    </span>
                  ))}
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
    </div>
  );
}
