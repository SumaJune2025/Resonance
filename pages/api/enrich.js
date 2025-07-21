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
  let maxPossibleScoreForPositiveTags = 0;

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
    'inclusion': ['diverse-workforce', 'inclusive-environment', 'equal-opportunity', 'women-leadership', 'lgbtqa', 'lgbtqa-plus', 'ramadan-friendly', 'diwali-friendly', 'onam-friendly', 'eid-friendly', 'christmas-friendly', 'communities-respect', 'climate-change', 'racial-equity-focus', 'caste-equity-awareness'], // Added equity tags as positive
  };

  // Calculate max possible score for normalization based on *user's selected preferences*
  preferenceCategories.forEach(category => {
    const userPrefScore = preferenceScoreMap[userPreferences[category] || 'not-important'];
    if (userPrefScore > 0) { // Only add to max if user cares about this category
      maxPossibleScoreForPositiveTags += userPrefScore;
    }
  });


  // Factor in positive tags
  companyTags.forEach(tag => {
    let tagFoundInPositiveMap = false;
    for (const category of preferenceCategories) {
      if (positiveTagMap[category].includes(tag)) {
        const userPrefScore = preferenceScoreMap[userPreferences[category] || 'not-important'];
        if (userPrefScore > 0) { // Only add score if user cares about this preference
          score += userPrefScore;
          reasons.push(`Strong focus on ${tag.replace(/-/g, ' ')} aligns with your ${category} preference.`);
        }
        tagFoundInPositiveMap = true;
        break; 
      }
    }
    // Handle general positive tags that aren't specific to a category but add a small bonus
    if (!tagFoundInPositiveMap && ['integrity', 'teamwork', 'communication', 'customer-centric'].includes(tag)) {
        if (maxPossibleScoreForPositiveTags > 0) { // Only if user has any preferences selected
            score += 0.5; // Small bonus for general positive traits
            reasons.push(`General positive attribute: ${tag.replace(/-/g, ' ')}.`);
        }
    }
  });

  // Define negative tags and their associated penalties (scaled by preference importance)
  const negativeTagPenalties = {
    'micro-managed': { category: ['management', 'flexibility'], penaltyFactor: 1 }, // Reduced penalty
    'long-hours': { category: ['flexibility'], penaltyFactor: 1.5 }, // Reduced penalty
    'top-down': { category: ['management'], penaltyFactor: 1 }, // Reduced penalty
    'racial-bias': { category: ['inclusion'], penaltyFactor: 3 }, // Reduced penalty
    'ethnic-bias': { category: ['inclusion'], penaltyFactor: 3 },
    'religious-bias': { category: ['inclusion'], penaltyFactor: 3 },
    'caste-bias': { category: ['inclusion'], penaltyFactor: 3 },
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
      } else { // Single category
        relevantUserPrefScore = preferenceScoreMap[userPreferences[category] || 'not-important'];
      }

      if (relevantUserPrefScore > 0) { // Penalize if user cares about the affected categories
        const penalty = relevantUserPrefScore * penaltyFactor;
        score -= penalty;
        reasons.push(`Critical concern: Presence of ${tag.replace(/-/g, ' ')} which heavily conflicts with your preferences.`);
        penalized = true;
      }
      
      if (!penalized) { // If not directly penalized because user didn't have high preference, still note it
        reasons.push(`Note: Potential ${tag.replace(/-/g, ' ')} issues were identified, even if not a strong conflict with your current preferences.`);
      }
    }
  });


  // Ensure score doesn't go below zero
  score = Math.max(0, score);

  // Calculate percentage match
  let matchPercentage;
  if (maxPossibleScoreForPositiveTags === 0) {
      // If user selected "not-important" for all categories, but positive tags were found,
      // we need a base to show a score. Let's use a small default max.
      // Or, more accurately, if user cares about nothing, match is 0.
      // If there's a score but no max, that implies user didn't set preferences.
      matchPercentage = 0; 
      if (score > 0) { // If some score accumulated (e.g., from general tags) but user has no preferences
        // This case indicates user didn't specify preferences but there's something good.
        // It's tricky. For now, let's keep it 0 as no explicit preference was set.
      }
  } else {
      matchPercentage = Math.round((score / maxPossibleScoreForPositiveTags) * 100);
  }

  // Final sanity check for percentage to be between 0 and 100
  const finalMatchPercentage = Math.min(100, Math.max(0, matchPercentage));

  // Add a general concluding reason if no specific reasons were added
  if (reasons.length === 0 && finalMatchPercentage > 0) {
    reasons.push('The company shows general positive cultural aspects that may align with your overall preferences.');
  } else if (reasons.length === 0 && finalMatchPercentage === 0) {
    reasons.push('No significant cultural alignment found with your preferences, or strong conflicts exist with your selected importance levels.');
  }


  return {
    score: finalMatchPercentage,
    reasons: reasons.length > 0 ? reasons : ["No specific cultural alignment found, or too few preferences selected."],
  };
}

// Simulates basic company analysis based on domain keywords
function simulateCompanyAnalysis(domain) {
  const domainLower = domain.toLowerCase();
  let tags = ['integrity', 'teamwork', 'communication', 'customer-centric']; // More base positive tags
  let summary = `Simulated general summary for ${domain}.`;

  if (domainLower.includes('tech') || domainLower.includes('software') || domainLower.includes('it') || domainLower.includes('digital')) {
    tags.push('innovation', 'agile-methodology', 'fast-paced', 'employee-empowerment'); // Added empowerment
    summary = `${domain} is a technology-focused company, likely valuing innovation, agility, and employee empowerment.`;
  }
  if (domainLower.includes('bank') || domainLower.includes('finance') || domainLower.includes('wealth')) {
    tags.push('analytical', 'risk-management', 'structured-environment', 'professional-growth'); // Added growth
    summary = `${domain} operates in the financial sector, emphasizing analytical rigor, risk management, and professional development.`;
  }
  if (domainLower.includes('health') || domainLower.includes('hospital') || domainLower.includes('pharma')) {
    tags.push('patient-centric', 'research-driven', 'ethical-considerations', 'learning-culture'); // Added learning
    summary = `${domain} is a healthcare entity, focused on patient well-being, ethical practices, and continuous learning.`;
  }
  if (domainLower.includes('consulting') || domainLower.includes('advisory')) {
    tags.push('client-focused', 'problem-solving', 'expert-driven', 'transparent-communication'); // Added communication
    summary = `${domain} is a consulting firm, valuing problem-solving, client relationships, and clear communication.`;
  }
  if (domainLower.includes('startup') || domainLower.includes('ventures')) {
    tags.push('entrepreneurial', 'rapid-growth', 'adaptive', 'innovation-voice'); // Added innovation voice
    summary = `${domain} is a fast-growing startup, fostering an entrepreneurial, adaptive, and innovative culture.`;
  }
  if (domainLower.includes('govt') || domainLower.includes('public') || domainLower.includes('state')) {
    tags.push('public-service', 'regulatory-compliance', 'stability', 'work-life-balance'); // Added work-life balance
    summary = `${domain} is a government or public sector organization, emphasizing public service, compliance, and work-life balance.`;
  }
  if (domainLower.includes('retail') || domainLower.includes('ecommerce') || domainLower.includes('fashion')) {
    tags.push('customer-centric', 'fast-paced', 'dynamic-market', 'diverse-workforce'); // Added diversity
    summary = `${domain} is involved in retail/e-commerce, operating in a customer-centric, dynamic, and diverse environment.`;
  }
  if (domainLower.includes('manufacture') || domainLower.includes('industry') || domainLower.includes('factory')) {
    tags.push('process-driven', 'efficiency', 'quality-control', 'team-oriented'); // Added team-oriented
    summary = `${domain} is a manufacturing company, focused on efficient processes, quality, and teamwork.`;
  }

  // Add some negative tags based on domain patterns (simulated)
  if (domainLower.includes('bigcorp') || domainLower.includes('legacyco') || domainLower.includes('oldcompany')) {
    if (Math.random() < 0.4) tags.push('top-down'); // 40% chance
    if (Math.random() < 0.2) tags.push('micro-managed'); // 20% chance
  }
  if (domainLower.includes('intenseco') || domainLower.includes('grindhub')) {
    if (Math.random() < 0.7) tags.push('long-hours'); // 70% chance
  }
  // Explicit bias triggers for testing
  if (domainLower.includes('biasinc')) { 
      tags.push('racial-bias', 'ethnic-bias');
  }
  if (domainLower.includes('exclusiveclub')) {
      tags.push('religious-bias', 'caste-bias');
  }

  return { summary, tags: [...new Set(tags)] }; // Return unique tags
}


// Simulates more specific cultural analysis with insights and tags
function getEnhancedCulturalAnalysis(domain) {
  const domainLower = domain.toLowerCase();
  let tags = ['professional-growth', 'transparent-communication']; // Default positive tags
  let culturalInsights = {
    flexibility: 'Generally offers standard flexibility options and encourages professional growth.',
    management: 'Management style varies by team, with an emphasis on transparent communication.',
    inclusion: 'Committed to diversity, but specific programs may vary.',
  };

  // Flexibility
  if (domainLower.includes('remote') || domainLower.includes('flex')) {
    tags.push('fully-remote-company', 'flexible-hours', 'work-life-balance');
    culturalInsights.flexibility = 'Strong emphasis on remote work and flexible hours, supporting work-life balance.';
  } else if (Math.random() > 0.6) { // Increased chance for some flexibility
    tags.push('work-from-home-friendly');
    culturalInsights.flexibility = 'Offers some work-from-home options.';
  }
  if (domainLower.includes('carers') || domainLower.includes('familyfriendly')) {
    tags.push('flexibility-carers', 'paternity-leave');
    culturalInsights.flexibility += ' Particularly supportive of carers and parental leave.';
  }

  // Management
  if (domainLower.includes('empower') || domainLower.includes('autonomy')) {
    tags.push('team-oriented', 'employee-empowerment', 'flat-hierarchy');
    culturalInsights.management = 'Fosters a collaborative and empowering environment with a focus on teamwork and flatter hierarchies.';
  } else if (Math.random() > 0.5) { // Increased chance for some positive management traits
    tags.push('learning-culture');
    culturalInsights.management = 'Encourages a strong learning culture and continuous skill development.';
  }
  if (domainLower.includes('innovation') || domainLower.includes('voice') || domainLower.includes('ideas')) {
    tags.push('innovation-voice');
    culturalInsights.management += ' Values employee voice and innovative ideas from all levels.';
  }

  // Inclusion
  if (domainLower.includes('diverse') || domainLower.includes('inclusion') || domainLower.includes('equity')) {
    tags.push('diverse-workforce', 'inclusive-environment', 'equal-opportunity', 'women-leadership', 'lgbtqa-plus', 'racial-equity-focus', 'caste-equity-awareness');
    culturalInsights.inclusion = 'Highly committed to diversity, equity, and inclusion across all aspects, with specific focus on representation.';
  } else if (Math.random() > 0.4) { // Increased chance for some positive inclusion traits
    tags.push('inclusive-environment');
    culturalInsights.inclusion = 'Strives to maintain an inclusive environment for all employees.';
  }

  // New specific inclusion tags based on domain (simulated)
  if (domainLower.includes('multifaith') || domainLower.includes('globalculture')) {
    tags.push('ramadan-friendly', 'diwali-friendly', 'onam-friendly', 'eid-friendly', 'christmas-friendly');
    culturalInsights.inclusion += ' Recognizes and accommodates various religious and cultural observances.';
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
