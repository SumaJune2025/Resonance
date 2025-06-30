import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState(null);
  const [error, setError] = useState(null);

  const handleEnrich = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/enrich?domain=${domain}`);
      setCompany(res.data);
    } catch (err) {
      console.error(err);
      setError('Could not enrich company data.');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 font-sans max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">CultureMatch</h1>

      <input
        className="border p-2 w-full mb-2"
        placeholder="Enter company domain (e.g. acme.org or linkedin.com/company/acme)"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
      />
      <button
        className="bg-black text-white px-4 py-2 rounded"
        onClick={handleEnrich}
        disabled={loading}
      >
        {loading ? 'Analyzing...' : 'Enrich'}
      </button>

      {error && <p className="text-red-600 mt-2">{error}</p>}

      {company && (
        <div className="mt-6 border p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-1">{company.domain}</h2>
          <p className="mb-2 whitespace-pre-line">{company.summary?.summary || company.summary}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {(company.summary?.tags || []).map((tag) => (
              <span
                key={tag}
                className="bg-gray-200 text-sm px-2 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
          <div className="mt-4">
            <a
              href={\`https://www.google.com/search?q=site:linkedin.com/company+\${encodeURIComponent(
                company.domain.replace(/https?:\/\/|www\.|linkedin\.com\/company\//g, '')
              )}\`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm inline-block bg-blue-600 text-white px-3 py-2 rounded mt-2"
            >
              🔍 View LinkedIn Posts via Google
            </a>
          </div>
        </div>
      )}
    </div>
  );
}