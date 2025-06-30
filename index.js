import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState(null);
  const [error, setError] = useState(null);

  const [preferences, setPreferences] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userPreferences');
      return saved ? JSON.parse(saved) : {
        flexibility: '',
        management: '',
        inclusion: ''
      };
    }
    return {
      flexibility: '',
      management: '',
      inclusion: ''
    };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
    }
  }, [preferences]);

  const handleEnrich = async () => {
    if (!domain.trim()) {
      setError('Please enter a domain');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/enrich', {
        domain,
        preferences
      });
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
      maxWidth: '600px',
      margin: '0 auto'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '16px',
      color: '#333'
    },
    input: {
      border: '1px solid #ccc',
      padding: '8px',
      width: '100%',
      marginBottom: '8px',
      borderRadius: '4px',
      fontSize: '14px'
    },
    button: {
      backgroundColor: loading ? '#666' : '#000',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '4px',
      border: 'none',
      cursor: loading ? 'not-allowed' : 'pointer',
      fontSize: '14px',
      marginTop: '8px'
    },
    resetButton: {
      backgroundColor: '#e11d48',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '4px',
      border: 'none',
      fontSize: '14px',
      marginTop: '8px'
    },
    error: {
      color: '#dc2626',
      marginTop: '8px'
    },
    result: {
      marginTop: '24px',
      border: '1px solid #ddd',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    resultTitle: {
      fontSize: '20px',
      fontWeight: '600',
      marginBottom: '4px'
    },
    summary: {
      marginBottom: '8px',
      whiteSpace: 'pre-line',
      lineHeight: '1.5'
    },
    tagsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginTop: '8px'
    },
    tag: {
      backgroundColor: '#f3f4f6',
      fontSize: '12px',
      padding: '4px 8px',
      borderRadius: '12px',
      color: '#374151'
    },
    linkButton: {
      display: 'inline-block',
      backgroundColor: '#2563eb',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '4px',
      textDecoration: 'none',
      fontSize: '12px',
      marginTop: '16px'
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🌐 CultureMatch</h1>
      <p style={{ marginBottom: '16px', color: '#666' }}>
        Discover company culture through their website or LinkedIn presence
      </p>

      <input
        style={styles.input}
        placeholder="Enter company domain (e.g. acme.com or linkedin.com/company/acme)"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleEnrich()}
      />

      {/* Survey Inputs */}
      <select
        style={styles.input}
        value={preferences.flexibility}
        onChange={e => setPreferences({ ...preferences, flexibility: e.target.value })}
      >
        <option value="">Flexibility preference</option>
        <option value="remote">Remote</option>
        <option value="hybrid">Hybrid</option>
        <option value="flexible-hours">Flexible hours</option>
      </select>

      <select
        style={styles.input}
        value={preferences.management}
        onChange={e => setPreferences({ ...preferences, management: e.target.value })}
      >
        <option value="">Management style</option>
        <option value="flat">Flat</option>
        <option value="hierarchical">Hierarchical</option>
      </select>

      <select
        style={styles.input}
        value={preferences.inclusion}
        onChange={e => setPreferences({ ...preferences, inclusion: e.target.value })}
      >
        <option value="">Inclusion focus</option>
        <option value="gender">Gender</option>
        <option value="caste">Caste</option>
        <option value="race">Race</option>
        <option value="religion">Religion</option>
      </select>

      <button
        style={styles.button}
        onClick={handleEnrich}
        disabled={loading}
      >
        {loading ? 'Analyzing...' : 'Analyze Culture'}
      </button>

      <button
        style={styles.resetButton}
        onClick={() => {
          setPreferences({ flexibility: '', management: '', inclusion: '' });
          localStorage.removeItem('userPreferences');
        }}
      >
        Reset Preferences
      </button>

      {error && <p style={styles.error}>{error}</p>}

      {company && (
        <div style={styles.result}>
          <h2 style={styles.resultTitle}>{company.domain}</h2>
          <p style={styles.summary}>
            {company.summary?.summary || company.summary}
          </p>

          {company.summary?.tags && company.summary.tags.length > 0 && (
            <div style={styles.tagsContainer}>
              {company.summary.tags.map((tag, index) => (
                <span key={index} style={styles.tag}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {company.match && (
            <div style={{ marginTop: '16px' }}>
              <strong>🔎 Culture Match Score: {company.match.score}/3</strong>
              <ul style={{ paddingLeft: '16px' }}>
                {company.match.reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <a
              href={`https://www.google.com/search?q=site:linkedin.com/company+${encodeURIComponent(
                company.domain.replace(/https?:\/\/|www\.|linkedin\.com\/company\//g, '')
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.linkButton}
            >
              🔍 View LinkedIn Posts via Google
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
