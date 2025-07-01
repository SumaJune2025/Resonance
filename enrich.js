// enrich.js — Unified Enrichment + Match (with Glassdoor snippet support)

import axios from 'axios';

export default async function handler(req, res) {
  const { domain, preferences } = req.method === 'POST' ? req.body : req.query;

  if (!domain) {
    return res.status(400).json({ error: 'Missing domain parameter' });
  }

  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    const summary = await simulateCompanyAnalysis(cleanDomain);

    // Get Glassdoor cultural cues (via Google search snippet + GPT parsing)
    const glassdoor = await getGlassdoorCulture(cleanDomain);

    const match = computeMatch([...summary.tags, ...glassdoor.tags], preferences);

    return res.status(200).json({
      domain: cleanDomain,
      summary,
      glassdoor,
      match
    });
  } catch (error) {
    console.error('Error in enrich API:', error);
    return res.status(500).json({ error: 'Internal error while enriching company data' });
  }
}

function computeMatch(tags, preferences) {
  let score = 0;
  const reasons = [];
  if (!preferences) return { score, reasons };

  if (preferences.flexibility && tags.includes(preferences.flexibility)) {
    score++;
    reasons.push(`Matches flexibility: ${preferences.flexibility}`);
  }
  if (preferences.management && tags.includes(preferences.management)) {
    score++;
    reasons.push(`Matches management: ${preferences.management}`);
  }
  if (preferences.inclusion && tags.includes(preferences.inclusion)) {
    score++;
    reasons.push(`Matches inclusion: ${preferences.inclusion}`);
  }

  return { score, reasons };
}

async function simulateCompanyAnalysis(domain) {
  const domainLower = domain.toLowerCase();
  let tags = ['professional'];
  let summary = `Analysis for ${domain}: `;

  if (domainLower.includes('tech') || domainLower.includes('ai')) {
    tags.push('innovation', 'digital-transformation');
    summary += 'Likely a tech-focused culture. ';
  }
  if (domainLower.includes('health')) {
    tags.push('healthcare', 'compassion');
    summary += 'Likely a health-driven mission. ';
  }

  tags.push('integrity', 'teamwork');
  summary += 'General values may include teamwork and integrity.';

  return { summary, tags };
}

async function getGlassdoorCulture(domain) {
  const company = domain.split('.')[0];
  const query = `site:glassdoor.com ${company} reviews`;

  try {
    const serpRes = await axios.get(`https://www.googleapis.com/customsearch/v1`, {
      params: {
        key: process.env.GOOGLE_API_KEY,
        cx: process.env.GOOGLE_CSE_ID,
        q: query
      }
    });

    const snippets = serpRes.data.items.map(item => item.snippet).slice(0, 3).join('\n');

    const prompt = `From these employee reviews, identify: flexibility, management, inclusion, and growth. 
Return JSON with keys: flexibility, management, inclusion, growth.\n\n${snippets}`;

    const gptRes = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a cultural insights analyst.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 300
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const parsed = JSON.parse(gptRes.data.choices[0].message.content);

    const tags = [];
    if (parsed.flexibility === true) tags.push('flexibility');
    if (parsed.management) tags.push(parsed.management);
    if (parsed.inclusion === true) tags.push('inclusion');
    if (parsed.growth === true) tags.push('growth');

    return { source: 'glassdoor', raw: parsed, tags };
  } catch (err) {
    console.error('Glassdoor analysis failed', err);
    return { source: 'glassdoor', raw: null, tags: [] };
  }
}
