import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState('preferences');

  const [preferences, setPreferences] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedPreferences = localStorage.getItem('userPreferences');
      if (savedPreferences) {
        setCurrentStep('analysis');
        return JSON.parse(savedPreferences);
      }
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
    setCurrentStep('preferences');
  };

  const handleSavePreferencesAndContinue = () => {
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
    setCompany(null);
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
    const counts = {};
    Object.values(categoryPrefs).forEach(value => {
      if (value !== '') {
        counts[value] = (counts[value] || 0) + 1;
      }
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : 'not-important';
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-blue-700">ValueSync</h1>
          <p className="text-gray-600 mt-2">
            Matching your values with the organization culture.
          </p>
        </header>

        <section className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">How it works</h2>
          <ol className="list-decimal list-inside text-gray-600 space-y-2">
            <li><strong>Step 1:</strong> Select your work preferences</li>
            <li><strong>Step 2:</strong> Enter the domain of an organization you're interested in</li>
            <li><strong>Step 3:</strong> Get a Match Score based on cultural alignment</li>
          </ol>
        </section>

        {currentStep === 'preferences' && (
          <section className="bg-white rounded shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Step 1: Your Preferences</h2>
            {['flexibility', 'management', 'inclusion'].map((category) => (
              <div key={category}>
                <h3 className="font-semibold capitalize text-gray-700 mb-1">{category}</h3>
                {Object.keys(preferences[category]).map((field) => (
                  <label key={field} className="block text-sm text-gray-600 mb-2">
                    {field.replace(/([A-Z])/g, ' $1')}:
                    <select
                      className="ml-2 border rounded p-1"
                      value={preferences[category][field]}
                      onChange={(e) => handlePreferenceChange(category, field, e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="not-important">Not Important</option>
                      <option value="somewhat-important">Somewhat Important</option>
                      <option value="important">Important</option>
                      <option value="very-important">Very Important</option>
                    </select>
                  </label>
                ))}
              </div>
            ))}
            <button
              onClick={handleSavePreferencesAndContinue}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Continue
            </button>
          </section>
        )}

        {currentStep === 'analysis' && (
          <section className="bg-white rounded shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Step 2: Analyze an Organization</h2>
            <input
              type="text"
              placeholder="e.g., acme.org"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <div className="flex space-x-4">
              <button
                onClick={handleEnrich}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                {loading ? 'Analyzing...' : 'Get Match Score'}
              </button>
              <button
                onClick={handleResetPreferences}
                className="text-sm text-gray-500 underline"
              >
                Reset Preferences
              </button>
            </div>

            {error && <p className="text-red-600">{error}</p>}

            {company && (
              <div className="mt-4 border p-4 rounded bg-gray-100">
                <h3 className="text-md font-semibold mb-2 text-gray-700">Results for {company.domain}</h3>
                <p className="mb-2"><strong>Match Score:</strong> {company.match.score}%</p>
                <ul className="list-disc ml-5 text-gray-600">
                  {company.match.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
