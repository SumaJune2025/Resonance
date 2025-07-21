import { JSDOM } from 'jsdom';
import axios from 'axios';

export default async function handler(req, res) {
  const { domain, preferences } = req.method === 'POST' ? req.body : req.query;

  if (!domain) {
    return res.status(400).json({ error: 'Missing domain parameter' });
  }

  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    
    // Simulate initial company analysis (general summary and tags)
    const summary = simulateCompanyAnalysis(cleanDomain);
    
    // Simulate enhanced cultural analysis (more specific insights and tags)
    const culturalInsights = getEnhancedCulturalAnalysis(cleanDomain);

    // Combine all company tags from both simulations
    const allCompanyTags = [...summary.tags, ...culturalInsights.tags];

    // Compute the match score based on combined tags and user preferences
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

// Function to compute the culture match score
function computeMatch(companyTags, userPreferences) {
  let score = 0;
  let reasons = [];
  let maxPossibleScoreForPositiveTags = 0; // Tracks the max score achievable from positive tags if all preferences are 'very-important'

  // Define preferences to iterate through
  const preferenceCategories = ['flexibility', 'management', 'inclusion'];

  // Map user preference selections to numerical scores
  const preferenceScoreMap = {
    'not-important': 0,
    'slightly-important': 1,
    'important': 2,
    'very-important': 3,
  };

  // Define positive tags and their mapping to categories
  const positiveTagMap = {
    'flexibility': ['work-from-home-friendly', 'remote-friendly', 'flexible-hours', 'work-life-balance', 'flexibility-carers', 'paternity-leave'],
    'management': ['flat-hierarchy', 'employee-empowerment', 'transparent-communication', 'professional-growth', 'learning-culture', 'innovation-voice'],
    'inclusion': ['diverse-workforce', 'inclusive-environment', 'equal-opportunity', 'women-leadership', 'lgbtqa', 'lgbtqa-plus', 'ramadan-friendly', 'diwali-friendly', 'onam-friendly', 'eid-friendly', 'christmas-friendly', 'communities-respect', 'climate-change'],
  };

  // Calculate max possible score for normalization based on *user's selected preferences*
  // This ensures normalization only considers categories where the user expressed importance.
  preferenceCategories.forEach(category => {
    const userPrefScore = preferenceScoreMap[userPreferences[category] || 'not-important'];
    if (userPrefScore > 0) { // Only add to max if user cares about this category
      // Add the highest possible score for a relevant tag in this category
      // For simplicity, assuming each relevant positive tag can contribute up to userPrefScore
      // and a category can have multiple contributing tags.
      // A simpler max would be just userPrefScore * (number of relevant positive tags in that category)
      // Let's go with a simpler model: max possible score is the sum of user's chosen preference importance
      // across all categories they care about. This represents the 'ideal match'.
      maxPossibleScoreForPositiveTags += userPrefScore;
    }
  });


  // Factor in positive tags
  companyTags.forEach(tag => {
    let tagFound = false;
    for (const category of preferenceCategories) {
      if (positiveTagMap[category].includes(tag)) {
        const userPrefScore = preferenceScoreMap[userPreferences[category] || 'not-important'];
        if (userPrefScore > 0) { // Only add score if user cares about this preference
          score += userPrefScore;
          reasons.push(`Strong focus on ${tag.replace(/-/g, ' ')} aligns with your ${category} preference.`);
          tagFound = true;
        }
        break; // Tag found in a category, move to next company tag
      }
    }
    // Handle general positive tags that aren't specific to a category but add a small bonus
    if (!tagFound && ['integrity', 'teamwork', 'communication', 'customer-centric'].includes(tag)) {
        if (maxPossibleScoreForPositiveTags > 0) { // Only if user has any preferences
            score += 0.5; // Small bonus for general positive traits
            reasons.push(`General positive attribute: ${tag.replace(/-/g, ' ')}.`);
        }
    }
  });

  // Define negative tags and their associated penalties (scaled by preference importance)
  const negativeTagPenalties = {
    'micro-managed': { category: ['management', 'flexibility'], penaltyFactor: 1.5 }, // Moderate penalty
    'long-hours': { category: ['flexibility'], penaltyFactor: 2 }, // Higher penalty for flexibility
    'top-down': { category: ['management'], penaltyFactor: 1.5 }, // Moderate penalty
    'racial-bias': { category: ['inclusion'], penaltyFactor: 4 }, // High penalty for inclusion
    'ethnic-bias': { category: ['inclusion'], penaltyFactor: 4 },
    'religious-bias': { category: ['inclusion'], penaltyFactor: 4 },
    'caste-bias': { category: ['inclusion'], penaltyFactor: 4 },
  };


  // Factor in negative tags (penalties)
  companyTags.forEach(tag => {
    if (negativeTagPenalties[tag]) {
      const { category, penaltyFactor } = negativeTagPenalties[tag];
      let penalized = false;
      let relevantUserPrefScore = 0;

      // Sum up user's preference score in relevant categories for this negative tag
      if (Array.isArray(category)) {
        category.forEach(cat => {
          relevantUserPrefScore += preferenceScoreMap[userPreferences[cat] || 'not-important'];
        });
      } else {
        relevantUserPrefScore = preferenceScoreMap[userPreferences[category] || 'not-important'];
      }

      if (relevantUserPrefScore > 0) { // Penalize if user cares about the affected categories
        const penalty = relevantUserPrefScore * penaltyFactor;
        score -= penalty;
        reasons.push(`Critical concern: Presence of ${tag.replace(/-/g, ' ')} which heavily conflicts with your preferences.`);
        penalized = true;
      }
      
      if (!penalized) { // If not directly penalized because user didn't have high preference, still note it
        reasons.push(`Note: Potential ${tag.replace(/-/g, ' ')} issues were identified.`);
      }
    }
  });


  // Ensure score doesn't go below zero
  score = Math.max(0, score);

  // Calculate percentage match
  // Normalize based on max possible score from *positive* contributions only.
  // If maxPossibleScoreForPositiveTags is 0, it means user selected 'not-important' for all categories,
  // so the match should be 0 unless there's some base positive score (which we don't have beyond 0.5 bonus).
  const matchPercentage = maxPossibleScoreForPositiveTags > 0 ? Math.round((score / maxPossibleScoreForPositiveTags) * 100) : 0;

  // Final sanity check for percentage to be between 0 and 100
  const finalMatchPercentage = Math.min(100, Math.max(0, matchPercentage));

  // Add a general concluding reason if no specific reasons were added
  if (reasons.length === 0 && finalMatchPercentage > 0) {
    reasons.push('The company generally aligns with your selected preferences, but no specific matches were highlighted.');
  } else if (reasons.length === 0 && finalMatchPercentage === 0) {
    reasons.push('No significant cultural alignment found with your preferences, or strong conflicts exist.');
  }


  return {
    score: finalMatchPercentage,
    reasons: reasons.length > 0 ? reasons : ["No specific cultural alignment found, or too few preferences selected."],
  };
}

// Simulates basic company analysis based on domain keywords
function simulateCompanyAnalysis(domain) {
  const domainLower = domain.toLowerCase();
  let tags = ['integrity', 'teamwork', 'communication']; // Always present for a 'positive' base
  let summary = `Simulated general summary for ${domain}.`;

  if (domainLower.includes('tech') || domainLower.includes('software') || domainLower.includes('it')) {
    tags.push('innovation', 'agile-methodology', 'fast-paced');
    summary = `${domain} is a technology-focused company, likely valuing innovation and agility.`;
  }
  if (domainLower.includes('bank') || domainLower.includes('finance') || domainLower.includes('wealth')) {
    tags.push('analytical', 'risk-management', 'structured-environment');
    summary = `${domain} operates in the financial sector, emphasizing analytical rigor and risk management.`;
  }
  if (domainLower.includes('health') || domainLower.includes('hospital') || domainLower.includes('pharma')) {
    tags.push('patient-centric', 'research-driven', 'ethical-considerations');
    summary = `${domain} is a healthcare entity, focused on patient well-being and ethical practices.`;
  }
  if (domainLower.includes('consulting') || domainLower.includes('advisory')) {
    tags.push('client-focused', 'problem-solving', 'expert-driven');
    summary = `${domain} is a consulting firm, valuing problem-solving and client relationships.`;
  }
  if (domainLower.includes('startup') || domainLower.includes('ventures')) {
    tags.push('entrepreneurial', 'rapid-growth', 'adaptive');
    summary = `${domain} is a fast-growing startup, fostering an entrepreneurial and adaptive culture.`;
  }
  if (domainLower.includes('govt') || domainLower.includes('public')) {
    tags.push('public-service', 'regulatory-compliance', 'stability');
    summary = `${domain} is a government or public sector organization, emphasizing public service and compliance.`;
  }
  if (domainLower.includes('retail') || domainLower.includes('ecommerce')) {
    tags.push('customer-centric', 'fast-paced', 'dynamic-market');
    summary = `${domain} is involved in retail/e-commerce, operating in a customer-centric and dynamic environment.`;
  }
  if (domainLower.includes('manufacture') || domainLower.includes('industry')) {
    tags.push('process-driven', 'efficiency', 'quality-control');
    summary = `${domain} is a manufacturing company, focused on efficient processes and quality.`;
  }

  // Add some negative tags based on domain patterns (simulated)
  // These are examples, feel free to adjust to your desired simulation
  if (domainLower.includes('deloitte') || domainLower.includes('ey') || domainLower.includes('pwc') || domainLower.includes('kpmg') || domainLower.includes('mckinsey')) {
    if (Math.random() < 0.7) tags.push('long-hours'); // High chance
    if (Math.random() < 0.3) tags.push('top-down'); // Medium chance
  }
  if (domainLower.includes('amazon')) {
    if (Math.random() < 0.8) tags.push('long-hours');
    if (Math.random() < 0.4) tags.push('micro-managed');
  }
  if (domainLower.includes('walmart') || domainLower.includes('oldco')) { // Imaginary old, traditional company
    if (Math.random() < 0.5) tags.push('micro-managed');
    if (Math.random() < 0.6) tags.push('top-down');
  }
  
  // Simulated bias triggers
  if (domainLower.includes('biasedorg') || domainLower.includes('oldboysclub')) { // Example imaginary domains for bias
    tags.push('racial-bias', 'ethnic-bias', 'religious-bias', 'caste-bias');
  }
  // Add a small random chance for general bias if no specific keywords
  if (Math.random() < 0.05 && !tags.some(t => ['racial-bias', 'ethnic-bias', 'religious-bias', 'caste-bias'].includes(t))) {
    const biasTypes = ['racial-bias', 'ethnic-bias', 'religious-bias', 'caste-bias'];
    tags.push(biasTypes[Math.floor(Math.random() * biasTypes.length)]);
  }

  return { summary, tags: [...new Set(tags)] }; // Return unique tags
}


// Simulates more specific cultural analysis with insights and tags
function getEnhancedCulturalAnalysis(domain) {
  const domainLower = domain.toLowerCase();
  let tags = [];
  let culturalInsights = {
    flexibility: 'Generally offers standard flexibility options.',
    management: 'Management style varies by team.',
    inclusion: 'Committed to diversity, but specific programs may vary.',
  };

  // Flexibility
  if (domainLower.includes('remote') || domainLower.includes('flex')) {
    tags.push('fully-remote-company', 'flexible-hours', 'work-life-balance');
    culturalInsights.flexibility = 'Strong emphasis on remote work and flexible hours, supporting work-life balance.';
  } else if (Math.random() > 0.7) { // Random chance for some flexibility
    tags.push('work-from-home-friendly');
    culturalInsights.flexibility = 'Offers some work-from-home options.';
  }
  if (domainLower.includes('carers') || domainLower.includes('family')) {
    tags.push('flexibility-carers', 'paternity-leave');
    culturalInsights.flexibility += ' Particularly supportive of carers and parental leave.';
  }

  // Management
  if (domainLower.includes('team') || domainLower.includes('collaborate')) {
    tags.push('team-oriented', 'employee-empowerment');
    culturalInsights.management = 'Fosters a collaborative and empowering environment with a focus on teamwork.';
  } else if (Math.random() > 0.6) {
    tags.push('transparent-communication', 'professional-growth');
    culturalInsights.management = 'Encourages transparent communication and employee professional growth.';
  }
  if (domainLower.includes('innovation') || domainLower.includes('voice') || domainLower.includes('ideas')) {
    tags.push('innovation-voice');
    culturalInsights.management += ' Values employee voice and innovative ideas from all levels.';
  }

  // Inclusion
  if (domainLower.includes('diverse') || domainLower.includes('inclusion') || domainLower.includes('equity')) {
    tags.push('diverse-workforce', 'inclusive-environment', 'equal-opportunity');
    culturalInsights.inclusion = 'Highly committed to diversity, equity, and inclusion across all aspects.';
  } else if (Math.random() > 0.5) {
    tags.push('inclusive-environment');
    culturalInsights.inclusion = 'Strives to maintain an inclusive environment for all employees.';
  }

  // New specific inclusion tags based on domain (simulated)
  if (domainLower.includes('womenintech') || domainLower.includes('femlead')) {
    tags.push('women-leadership');
    culturalInsights.inclusion += ' Special focus on promoting women in leadership.';
  }
  if (domainLower.includes('lgbt') || domainLower.includes('pride')) {
    tags.push('lgbtqa', 'lgbtqa-plus');
    culturalInsights.inclusion += ' Actively supports the LGBTQIA+ community.';
  }
  if (domainLower.includes('multifaith') || domainLower.includes('globalculture')) {
    if (Math.random() < 0.5) { // Simulate some holidays being supported
      tags.push('ramadan-friendly', 'diwali-friendly');
    } else {
      tags.push('onam-friendly', 'eid-friendly', 'christmas-friendly');
    }
    culturalInsights.inclusion += ' Recognizes and accommodates various religious and cultural observances.';
  }
  if (domainLower.includes('dalit') || domainLower.includes('race') || domainLower.includes('equity')) {
    tags.push('racial-equity-focus', 'caste-equity-awareness');
  }
  if (domainLower.includes('community') || domainLower.includes('csr') || domainLower.includes('impact')) {
    tags.push('communities-respect');
    culturalInsights.inclusion += ' Demonstrates strong commitment to community engagement and respect.';
  }
  if (domainLower.includes('green') || domainLower.includes('sustain') || domainLower.includes('ecofriendly')) {
    tags.push('climate-change');
    culturalInsights.inclusion += ' Prioritizes environmental sustainability and climate action.';
  }


  culturalInsights.note = "Disclaimer: This cultural analysis is simulated and may not reflect the actual company culture. For accurate insights, refer to official company resources, employee reviews, and direct communication with employees.";

  return { culturalInsights, tags: [...new Set(tags)] }; // Return unique tags
}

// Function to try basic web scraping (currently unused in main flow, for reference)
async function tryBasicWebScraping(domain) {
  try {
    const url = `https://${domain}`;
    console.log(`Attempting to scrape: ${url}`);
    const response = await axios.get(url, { timeout: 5000 }); // 5 seconds timeout
    const dom = new JSDOM(response.data);
    const textContent = dom.window.document.body.textContent;
    
    // Simple keyword extraction (for demonstration)
    const keywords = ['innovation', 'culture', 'teamwork', 'diversity', 'values'];
    let foundKeywords = [];
    for (const keyword of keywords) {
      if (textContent.toLowerCase().includes(keyword)) {
        foundKeywords.push(keyword);
      }
    }
    console.log(`Scraped keywords for ${domain}:`, foundKeywords);
    return foundKeywords;
  } catch (error) {
    console.error(`Scraping failed for ${domain}:`, error.message);
    return []; // Return empty array on error
  }
}
