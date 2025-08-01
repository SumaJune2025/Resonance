import { useState, useEffect } from 'react';
import axios from 'axios';

// Define the importance levels for the slider
const importanceLevels = ['Not Important', 'Somewhat Important', 'Important', 'Very Important'];

export default function Home() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState('preferences');

  // Initialize preferences with numerical values (0-3)
  const [preferences, setPreferences] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedPreferences = localStorage.getItem('userPreferences');
      if (savedPreferences) {
        setCurrentStep('analysis');
        return JSON.parse(savedPreferences);
      }
    }
    return {
      flexibility: { workFromHome: 0, flexibleHours: 0, remoteLocation: 0 },
      management: { structure: 0, decisionMaking: 0, autonomy: 0 },
      inclusion: { womenLeadership: 0, diversityRepresentation: 0, inclusivePolicies: 0 }
    };
  });

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
    }
  }, [preferences]);

  // Handler for updating individual preference fields with slider values
  const handlePreferenceChange = (category, field, value) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: Number(value)
      }
    }));
  };

  const handleResetPreferences = () => {
    setPreferences({
      flexibility: { workFromHome: 0, flexibleHours: 0, remoteLocation: 0 },
      management: { structure: 0, decisionMaking: 0, autonomy: 0 },
      inclusion: { womenLeadership: 0, diversityRepresentation: 0, inclusivePolicies: 0 }
    });
    setCompany(null);
    setError(null);
    setDomain('');
    setCurrentStep('preferences');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Map the numerical preference values to their string representations for the backend
    const formattedPreferences = {};
    for (const category in preferences) {
      formattedPreferences[category] = {};
      for (const field in preferences[category]) {
        formattedPreferences[category][field] = importanceLevels[preferences[category][field]].toLowerCase().replace(/ /g, '-');
      }
    }

    try {
      const response = await axios.post('/api/enrich', {
        companyDomain: domain,
        preferences: formattedPreferences
      });
      setCompany(response.data);
      setCurrentStep('results');
    } catch (err) {
      console.error(err);
      setError('Could not enrich company data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPreferenceSliders = (category, title, fields) => (
    <div className="bg-white p-6 rounded-xl shadow-lg transition-transform duration-300 hover:scale-[1.02]">
      <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">{title}</h3>
      <div className="space-y-6">
        {fields.map(field => (
          <div key={field.name}>
            <label className="block text-gray-700 font-medium mb-2">{field.label}</label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="3"
                value={preferences[category][field.name]}
                onChange={(e) => handlePreferenceChange(category, field.name, e.target.value)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="min-w-[120px] text-sm text-gray-600 font-semibold text-right">
                {importanceLevels[preferences[category][field.name]]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      <main className="max-w-6xl mx-auto py-12 px-6">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">ValueSync</h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Matching your values with the organization culture.
          </p>
        </div>

        {/* How it works Section */}
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg">
              <span className="text-3xl font-extrabold text-blue-600 mb-2">1.</span>
              <p className="text-lg text-gray-700">Select work preferences on a sliding scale.</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg">
              <span className="text-3xl font-extrabold text-blue-600 mb-2">2.</span>
              <p className="text-lg text-gray-700">Enter a company domain.</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg">
              <span className="text-3xl font-extrabold text-blue-600 mb-2">3.</span>
              <p className="text-lg text-gray-700">Get a personalized match score.</p>
            </div>
          </div>
        </div>

        {/* Preferences & Analysis Section */}
        <div className="bg-gray-50 p-8 rounded-2xl shadow-2xl">
          {currentStep === 'preferences' && (
            <>
              <h2 className="text-3xl font-bold text-gray-800 mb-8">Step 1: Your Preferences</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {renderPreferenceSliders('flexibility', 'Flexibility', [
                  { name: 'workFromHome', label: 'Work From Home' },
                  { name: 'flexibleHours', label: 'Flexible Hours' },
                  { name: 'remoteLocation', label: 'Remote Location' },
                ])}
                {renderPreferenceSliders('management', 'Management Style', [
                  { name: 'structure', label: 'Structure' },
                  { name: 'decisionMaking', label: 'Decision Making' },
                  { name: 'autonomy', label: 'Autonomy' },
                ])}
                {renderPreferenceSliders('inclusion', 'Inclusion & Diversity', [
                  { name: 'womenLeadership', label: 'Women in Leadership' },
                  { name: 'diversityRepresentation', label: 'Diversity Representation' },
                  { name: 'inclusivePolicies', label: 'Inclusive Policies' },
                ])}
              </div>
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setCurrentStep('analysis')}
                  className="bg-blue-600 text-white font-bold py-4 px-10 rounded-full shadow-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
                >
                  Next: Get Match Score
                </button>
              </div>
            </>
          )}

          {currentStep !== 'preferences' && (
            <div className="mt-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Step 2 & 3: Get Your Match Score</h2>
              <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="Enter company domain (e.g., google.com)"
                  className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </span>
                    ) : 'Get Match Score'}
                  </button>
                  <button
                    onClick={handleResetPreferences}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-4 px-6 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                  >
                    Reset All
                  </button>
                </div>
              </form>

              {error && <p className="text-red-600 text-center mt-4">{error}</p>}

              {/* Company Analysis Results */}
              {company && (
                <div className="mt-8 border border-blue-200 p-8 rounded-2xl bg-white shadow-xl">
                  <h3 className="text-3xl font-bold text-gray-800 mb-4 text-center">Results for {company.domain}</h3>
                  <p className="mb-6 text-xl text-center">
                    <strong>Match Score:</strong> <span className="text-green-600 font-extrabold text-2xl">{company.match.score}%</span>
                  </p>
                  <h4 className="text-xl font-semibold text-gray-700 mb-4">Key Insights:</h4>
                  <ul className="list-disc ml-6 text-gray-600 space-y-3">
                    {company.match.reasons.map((reason, idx) => (
                      <li key={idx} className="bg-gray-50 p-3 rounded-lg shadow-sm">
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
