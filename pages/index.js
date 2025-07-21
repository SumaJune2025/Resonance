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
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">CultureMatch</h1>

      {currentStep === 'preferences' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Step 1: Select Your Preferences</h2>

          {['flexibility', 'management', 'inclusion'].map((category) => (
            <div key={category}>
              <h3 className="font-semibold capitalize">{category}</h3>
              {Object.keys(preferences[category]).map((field) => (
                <div key={field} className="mb-2">
                  <label className="block text-sm">
                    {field.replace(/([A-Z])/g, ' $1')}:
                    <select
                      className="ml-2 border p-1"
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
                </div>
              ))}
            </div>
          ))}

          <button
            onClick={handleSavePreferencesAndContinue}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Continue
          </button>
        </div>
      )}

      {currentStep === 'analysis' && (
        <div className="space-y-4 mt-4">
          <h2 className="text-lg font-semibold">Step 2: Analyze Company</h2>
          <input
            type="text"
            placeholder="Enter company domain (e.g., acme.org)"
            value={domain}
            onChange={(e) => setDomain(e.target.valu
