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

  // ... rest of your component remains unchanged (UI and styles)
}
