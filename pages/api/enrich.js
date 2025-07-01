// enrich.js — Unified Enrichment + Match (without Google API dependency)

import axios from 'axios';

export default async function handler(req, res) {
  const { domain, preferences } = req.method === 'POST' ? req.body : req.query;

  if (!domain) {
    return res.status(400).json({ error: 'Missing domain parameter' });
  }

  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    const summary = await simulateCompanyAnalysis(cleanDomain);

    // Get enhanced cultural analysis (without external APIs)
    const culturalInsights = await getEnhancedCulturalAnalysis(cleanDomain);

    const match = computeMatch([...summary.tags, ...culturalInsights.tags], preferences);

    return res.status(200).json({
      domain: cleanDomain,
      summary,
      culturalInsights,
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

  // Enhanced domain-based analysis
  if (domainLower.includes('tech') || domainLower.includes('ai') || domainLower.includes('software') || domainLower.includes('dev')) {
    tags.push('innovation', 'digital-transformation', 'agile', 'remote-friendly');
    summary += 'Tech-focused culture with emphasis on innovation and digital transformation. ';
  }
  
  if (domainLower.includes('health') || domainLower.includes('medical') || domainLower.includes('pharma')) {
    tags.push('healthcare', 'compassion', 'patient-focused', 'compliance');
    summary += 'Healthcare-driven mission with focus on patient care and regulatory compliance. ';
  }
  
  if (domainLower.includes('finance') || domainLower.includes('bank') || domainLower.includes('invest')) {
    tags.push('analytical', 'risk-management', 'client-service', 'regulatory');
    summary += 'Financial services culture emphasizing analysis and client relationships. ';
  }
  
  if (domainLower.includes('edu') || domainLower.includes('school') || domainLower.includes('university')) {
    tags.push('education', 'mentorship', 'growth', 'research');
    summary += 'Educational environment focused on learning and development. ';
  }
  
  if (domainLower.includes('green') || domainLower.includes('sustain') || domainLower.includes('eco')) {
    tags.push('sustainability', 'environmental', 'purpose-driven', 'social-impact');
    summary += 'Environmentally conscious culture with sustainability focus. ';
  }
  
  if (domainLower.includes('start') || domainLower.includes('venture')) {
    tags.push('entrepreneurial', 'fast-paced', 'equity-participation', 'risk-taking');
    summary += 'Startup culture with entrepreneurial spirit and rapid growth focus. ';
  }

  // Add common cultural elements
  tags.push('integrity', 'teamwork', 'communication');
  summary += 'Core values likely include teamwork, integrity, and effective communication.';

  return { summary, tags };
}

async function getEnhancedCulturalAnalysis(domain) {
  const company = domain.split('.')[0].toLowerCase();
  
  // Enhanced cultural analysis based on company name patterns and common industry insights
  const culturalPatterns = {
    flexibility: ['remote', 'hybrid', 'flex', 'work-life', 'balance'],
    management: ['flat', 'hierarchical', 'collaborative', 'autonomous', 'micromanage'],
    inclusion: ['diverse', 'inclusive', 'equity', 'belonging', 'equal'],
    growth: ['learning', 'development', 'career', 'advancement', 'mentorship'],
    innovation: ['creative', 'innovative', 'cutting-edge', 'research', 'experiment'],
    workEnvironment: ['open-office', 'collaborative', 'quiet', 'dynamic', 'structured']
  };

  const insights = {
    flexibility: null,
    management: null,
    inclusion: null,
    growth: null,
    workEnvironment: null
  };

  const tags = [];

  // Analyze based on domain patterns
  if (company.includes('flex') || company.includes('remote') || company.includes('work')) {
    insights.flexibility = 'high';
    tags.push('flexible-work', 'work-life-balance');
  }

  if (company.includes('team') || company.includes('collab') || company.includes('together')) {
    insights.management = 'collaborative';
    tags.push('collaborative', 'team-oriented');
  }

  if (company.includes('diverse') || company.includes('equal') || company.includes('inclusive')) {
    insights.inclusion = 'high';
    tags.push('diversity', 'inclusion', 'equity');
  }

  if (company.includes('grow') || company.includes('learn') || company.includes('dev')) {
    insights.growth = 'high';
    tags.push('professional-development', 'learning-culture');
  }

  // Add some general positive cultural indicators
  tags.push('professional-growth', 'team-collaboration');

  return {
    source: 'domain-analysis',
    insights,
    tags,
    note: 'Analysis based on domain patterns and industry standards. For more detailed insights, consider checking the company\'s LinkedIn, Glassdoor, or career pages directly.'
  };
}

// Optional: Add a simple web scraping function (if you want to try fetching basic company info)
async function tryBasicWebScraping(domain) {
  try {
    const response = await axios.get(`https://${domain}`, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CultureMatch/1.0)'
      }
    });
    
    const text = response.data.toLowerCase();
    const culturalKeywords = [];
    
    if (text.includes('remote') || text.includes('hybrid')) {
      culturalKeywords.push('remote-friendly');
    }
    if (text.includes('diverse') || text.includes('inclusion')) {
      culturalKeywords.push('inclusive');
    }
    if (text.includes('innovation') || text.includes('creative')) {
      culturalKeywords.push('innovative');
    }
    
    return culturalKeywords;
  } catch (error) {
    // Silently fail and return empty array
    return [];
  }
}
