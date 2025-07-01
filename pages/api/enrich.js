// enrich.js — Unified Enrichment + Match (without Google API dependency)

import axios from 'axios';

export default async function handler(req, res) {
  // Extract domain and preferences from the request body for POST, or query for GET
  const { domain, preferences } = req.method === 'POST' ? req.body : req.query;

  if (!domain) {
    return res.status(400).json({ error: 'Missing domain parameter' });
  }

  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    const summary = await simulateCompanyAnalysis(cleanDomain);

    // Get enhanced cultural analysis (without external APIs)
    const culturalInsights = await getEnhancedCulturalAnalysis(cleanDomain);

    // Compute the match score based on company tags and user preferences
    const allCompanyTags = [...summary.tags, ...culturalInsights.tags];
    const match = computeMatch(allCompanyTags, preferences);

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

/**
 * Computes a match score between company tags and user preferences.
 * @param {string[]} companyTags - An array of cultural tags associated with the company.
 * @param {object} userPreferences - An object containing user's cultural preferences.
 * Example:
 * {
 * flexibility: 4, // Score from 1-5
 * management: 3,
 * inclusion: 5
 * }
 * @returns {object} - An object containing the match score and reasons.
 */
function computeMatch(companyTags, userPreferences) {
  let score = 0;
  const reasons = [];
  // If no preferences are provided, return a score of 0
  if (!userPreferences) return { score: 0, reasons: [] };

  // Define a mapping for preference values to influence the score
  // This is a simplified mapping; a more complex one could use NLP similarity
  const preferenceMapping = {
    'work-from-home': 'flexibility',
    'flexible-hours': 'flexibility',
    'remote-friendly': 'flexibility',
    'flat-structure': 'management',
    'hierarchical-structure': 'management',
    'collaborative-decision': 'management',
    'autonomy': 'management',
    'women-leadership': 'inclusion',
    'diversity-representation': 'inclusion',
    'inclusive-policies': 'inclusion',
  };

  // Iterate through company tags and check for matches with user preferences
  companyTags.forEach(tag => {
    const category = preferenceMapping[tag];
    if (category) {
      // If the company tag matches a preference category, add to the score
      // The score is directly proportional to the user's preference level (1-5)
      if (userPreferences[category] && userPreferences[category] > 0) {
        score += userPreferences[category]; // Add the preference score directly
        reasons.push(`Company tag '${tag}' aligns with your preference for ${category}.`);
      }
    }
  });

  // Normalize the score to a 0-5 scale.
  // Assuming a maximum possible score based on the number of categories and max preference score (5).
  // For simplicity, let's assume 3 main categories (flexibility, management, inclusion)
  // Max possible score = 3 categories * 5 (max preference score) = 15
  const maxPossibleScore = Object.keys(userPreferences).length * 5; // Dynamically calculate max score
  const normalizedScore = maxPossibleScore > 0 ? Math.round((score / maxPossibleScore) * 5) : 0;

  return { score: normalizedScore, reasons };
}

/**
 * Simulates a basic company analysis based on the domain name.
 * This function provides general tags and a summary.
 * @param {string} domain - The company domain.
 * @returns {Promise<object>} - A promise resolving to an object with summary and tags.
 */
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

/**
 * Provides enhanced cultural analysis based on company name patterns.
 * This simulates deeper insights that would typically come from NLP or dedicated APIs.
 * @param {string} domain - The company domain.
 * @returns {Promise<object>} - A promise resolving to an object with insights, tags, and a note.
 */
async function getEnhancedCulturalAnalysis(domain) {
  const company = domain.split('.')[0].toLowerCase();
  
  // Enhanced cultural analysis based on company name patterns and common industry insights
  const insights = {
    flexibility: null,
    management: null,
    inclusion: null,
    growth: null,
    workEnvironment: null
  };

  const tags = [];

  // Analyze based on domain patterns for specific cultural aspects
  if (company.includes('flex') || company.includes('remote') || company.includes('work') || domain.includes('hybrid')) {
    insights.flexibility = 'high';
    tags.push('flexible-work', 'work-life-balance', 'work-from-home', 'flexible-hours', 'remote-friendly');
  } else {
    // Default or opposite for demonstration if not explicitly flexible
    tags.push('office-centric');
  }

  if (company.includes('team') || company.includes('collab') || company.includes('together') || domain.includes('agile')) {
    insights.management = 'collaborative';
    tags.push('collaborative-decision', 'flat-structure', 'team-oriented');
  } else if (company.includes('corp') || company.includes('group')) {
    insights.management = 'structured';
    tags.push('hierarchical-structure');
  } else {
    tags.push('autonomy'); // Default to some autonomy if no strong signal
  }

  if (company.includes('diverse') || company.includes('equal') || company.includes('inclusive') || domain.includes('equity')) {
    insights.inclusion = 'high';
    tags.push('diversity-representation', 'inclusion', 'equity', 'women-leadership', 'inclusive-policies');
  } else {
    tags.push('traditional-culture');
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
// This function is not directly used in the main flow but kept for reference.
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
