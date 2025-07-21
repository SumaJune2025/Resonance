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

    // Combine all company tags from both simulations, ensuring uniqueness
    const allCompanyTags = [...new Set([...summary.tags, ...culturalInsights.tags])]; 

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
  let maxPossibleScoreForPositiveTags = 0; // Denominator for normalization

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
    'inclusion': ['diverse-workforce', 'inclusive-environment', 'equal-opportunity', 'women-leadership', 'lgbtqa', 'lgbtqa-plus', 'ramadan-friendly', 'diwali-friendly', 'onam-friendly', 'eid-friendly', 'christmas-friendly', 'communities-respect', 'climate-change', 'racial-equity-focus', 'caste-equity-awareness'],
  };
  
  // Define general positive tags that add a small bonus regardless of specific category importance
  const generalPositiveTags = ['integrity', 'teamwork', 'communication', 'customer-centric'];

  // 1. Calculate max possible score based on *user's selected importance*
  // This is the sum of the user's preference scores for categories they care about.
  preferenceCategories.forEach(category => {
    const userPrefScore = preferenceScoreMap[userPreferences[category] || 'not-important'];
    maxPossibleScoreForPositiveTags += userPrefScore;
  });


  // 2. Factor in positive tags
  companyTags.forEach(tag => {
    let tagMatchedToCategory = false;
    for (const category of preferenceCategories) {
      if (positiveTagMap[category].includes(tag)) {
        const userPrefScore = preferenceScoreMap[userPreferences[category] || 'not-important'];
        if (userPrefScore > 0) { 
          score += userPrefScore; // Add user's preference score for EACH matching tag
          reasons.push(`Positive match: ${tag.replace(/-/g, ' ')} aligns with your ${category} preference.`);
        }
        tagMatchedToCategory = true;
        break; 
      }
    }
    // Add small bonus for general positive tags IF user has expressed *any* preference for culture (maxPossibleScoreForPositiveTags > 0)
    if (!tagMatchedToCategory && generalPositiveTags.includes(tag)) {
        if (maxPossibleScoreForPositiveTags > 0) { 
            score += 0.5; // Fixed small bonus
            reasons.push(`General positive attribute: ${tag.replace(/-/g, ' ')}.`);
        }
    }
  });

  // Log score after positives for debugging
  console.log('Score (after positives, before negatives):', score);

  // 3. Define negative tags and their associated fixed penalty points
  const negativeTagPenalties = {
    'micro-managed': { category: ['management', 'flexibility'], penaltyPoints: 1 }, 
    'long-hours': { category: ['flexibility'], penaltyPoints: 2 }, 
    'top-down': { category: ['management'], penaltyPoints: 1 }, 
    'racial-bias': { category: ['inclusion'], penaltyPoints: 3 }, 
    'ethnic-bias': { category: ['inclusion'], penaltyPoints: 3 },
    'religious-bias': { category: ['inclusion'], penaltyPoints: 3 },
    'caste-bias': { category: ['inclusion'], penaltyPoints: 3 },
  };

  // 4. Factor in negative tags (penalties)
  companyTags.forEach(tag => {
    if (negativeTagPenalties[tag]) {
      const { category, penaltyPoints } = negativeTagPenalties[tag];
      let shouldPenalize = false;

      // Check if user has *any* preference (score > 0) in the relevant categories for this negative tag
      if (Array.isArray(category)) {
        shouldPenalize = category.some(cat => preferenceScoreMap[userPreferences[cat] || 'not-important'] > 0);
      } else { 
        shouldPenalize = preferenceScoreMap[userPreferences[category] || 'not-important'] > 0;
      }

      if (shouldPenalize) { 
        score -= penaltyPoints; // Deduct fixed penalty points
        reasons.push(`Critical concern: Presence of ${tag.replace(/-/g, ' ')} which conflicts with your preferences.`);
      } else {
          reasons.push(`Note: Potential ${tag.replace(/-/g, ' ')} issues were identified, even if not a strong conflict with your current preferences.`);
      }
    }
  });


  // 5. Ensure score doesn't go below zero
  score = Math.max(0, score);

  // --- Debugging Logs (Placed before final percentage calculation) ---
  console.log('--- ComputeMatch Debugging ---');
  console.log('Company Tags:', companyTags);
  console.log('User Preferences:', userPreferences);
  console.log('Max Possible Score (Denominator, sum of user preference levels):', maxPossibleScoreForPositiveTags);
  console.log('Score (after all calculations, before final clamping):', score);
  
  // 6. Calculate percentage match
  let matchPercentage = 0;
  if (maxPossibleScoreForPositiveTags > 0) {
      matchPercentage = Math.round((score / maxPossibleScoreForPositiveTags) * 100);
  } else {
      // If user selected "not-important" for all categories, then the max possible score is 0.
      // In this case, if any score accumulated (e.g., from general tags), we can still show a small percentage
      // normalized against an arbitrary base (e.g., if there's 1 point, it's 1/5 = 20%).
      // This ensures not 0% even if no specific preferences are set but good tags exist.
      if (score > 0) {
          matchPercentage = Math.round((score / 5) * 100); // Normalize against a small arbitrary max (e.g., 5 points)
          reasons.unshift("General positive cultural aspects found, though specific preferences were not set, contributing to a basic score.");
      } else {
          matchPercentage = 0; 
      }
  }

  // Final sanity check for percentage to be between 0 and 100
  const finalMatchPercentage = Math.min(100, Math.max(0, matchPercentage));
  
  console.log('Final Match Percentage:', finalMatchPercentage);
  console.log('Reasons:', reasons);
  console.log('------------------------------');


  // 7. Add a general concluding reason if no specific reasons were added
  if (reasons.length === 0 && finalMatchPercentage > 0) {
    reasons.push('The company shows general positive cultural aspects that may align with your overall preferences, but no strong specific matches were highlighted.');
  } else if (reasons.length === 0 && finalMatchPercentage === 0) {
    reasons.push('No significant cultural alignment found with your preferences, or strong conflicts exist given your selected importance levels.');
  }


  return {
    score: finalMatchPercentage,
    reasons: reasons.length > 0 ? reasons : ["No specific cultural alignment could be determined based on your preferences."],
  };
}

// Simulates basic company analysis based on domain keywords
function simulateCompanyAnalysis(domain) {
  const domainLower = domain.toLowerCase();
  // Ensure a good set of positive default tags
  let tags = ['integrity', 'teamwork', 'communication', 'customer-centric', 'professional-growth', 'learning-culture']; 
  let summary = `Simulated general summary for ${domain}.`;

  if (domainLower.includes('tech') || domainLower.includes('software') || domainLower.includes('it') || domainLower.includes('digital')) {
    tags.push('innovation', 'agile-methodology', 'fast-paced', 'employee-empowerment');
    summary = `${domain} is a technology-focused company, likely valuing innovation, agility, and employee empowerment.`;
  }
  if (domainLower.includes('bank') || domainLower.includes('finance') || domainLower.includes('wealth')) {
    tags.push('analytical', 'risk-management', 'structured-environment', 'transparent-communication'); 
    summary = `${domain} operates in the financial sector, emphasizing analytical rigor, risk management, and transparent communication.`;
  }
  if (domainLower.includes('health') || domainLower.includes('hospital') || domainLower.includes('pharma')) {
    tags.push('patient-centric', 'research-driven', 'ethical-considerations', 'work-life-balance'); 
    summary = `${domain} is a healthcare entity, focused on patient well-being, ethical practices, and work-life balance.`;
  }
  if (domainLower.includes('consulting') || domainLower.includes('advisory')) {
    tags.push('client-focused', 'problem-solving', 'expert-driven', 'flat-hierarchy'); 
    summary = `${domain} is a consulting firm, valuing problem-solving, client relationships, and a flatter hierarchy.`;
  }
  if (domainLower.includes('startup') || domainLower.includes('ventures')) {
    tags.push('entrepreneurial', 'rapid-growth', 'adaptive', 'innovation-voice', 'flexible-hours'); 
    summary = `${domain} is a fast-growing startup, fostering an entrepreneurial, adaptive, and innovative culture with flexible hours.`;
  }
  if (domainLower.includes('govt') || domainLower.includes('public') || domainLower.includes('state')) {
    tags.push('public-service', 'regulatory-compliance', 'stability', 'work-from-home-friendly'); 
    summary = `${domain} is a government or public sector organization, emphasizing public service, compliance, and work-from-home options.`;
  }
  if (domainLower.includes('retail') || domainLower.includes('ecommerce') || domainLower.includes('fashion')) {
    tags.push('customer-centric', 'fast-paced', 'dynamic-market', 'diverse-workforce', 'inclusive-environment'); 
    summary = `${domain} is involved in retail/e-commerce, operating in a customer-centric, dynamic, and diverse environment.`;
  }
  if (domainLower.includes('manufacture') || domainLower.includes('industry') || domainLower.includes('factory')) {
    tags.push('process-driven', 'efficiency', 'quality-control', 'team-oriented'); 
    summary = `${domain} is a manufacturing company, focused on efficient processes, quality, and teamwork.`;
  }

  // Add some negative tags based on domain patterns (simulated)
  if (domainLower.includes('bigcorp') || domainLower.includes('legacyco') || domainLower.includes('oldcompany')) {
    if (Math.random() < 0.4) tags.push('top-down'); 
    if (Math.random() < 0.2) tags.push('micro-managed'); 
  }
  if (domainLower.includes('intenseco') || domainLower.includes('grindhub') || domainLower.includes('consultingfirm')) { 
    if (Math.random() < 0.7) tags.push('long-hours'); 
  }
  // Explicit bias triggers for testing (you can use these as test domains)
  if (domainLower.includes('biasinc')) { 
      tags.push('racial-bias', 'ethnic-bias');
  }
  if (domainLower.includes('exclusiveclub')) {
      tags.push('religious-bias', 'caste-bias');
  }

  return { summary, tags: [...new Set(tags)] }; 
}

// Simulates more specific cultural analysis with insights and tags
function getEnhancedCulturalAnalysis(domain) {
  const domainLower = domain.toLowerCase();
  // Ensure a good set of positive default tags
  let tags = ['professional-growth', 'transparent-communication', 'inclusive-environment', 'employee-empowerment', 'work-life-balance']; 
  let culturalInsights = {
    flexibility: 'Generally offers standard flexibility options and encourages professional growth.',
    management: 'Management style varies by team, with an emphasis on transparent communication and employee empowerment.',
    inclusion: 'Committed to diversity and aims to maintain an inclusive environment.',
  };

  // Flexibility
  if (domainLower.includes('remote') || domainLower.includes('flex')) {
    tags.push('fully-remote-company', 'flexible-hours', 'work-life-balance');
    culturalInsights.flexibility = 'Strong emphasis on remote work and flexible hours, supporting work-life balance.';
  } else if (Math.random() > 0.6) { 
    tags.push('work-from-home-friendly');
    culturalInsights.flexibility = 'Offers some work-from-home options.';
  }
  if (domainLower.includes('carers') || domainLower.includes('familyfriendly')) {
    tags.push('flexibility-carers', 'paternity-leave');
    culturalInsights.flexibility += ' Particularly supportive of carers and parental leave.';
  }

  // Management
  if (domainLower.includes('empower') || domainLower.includes('autonomy') || domainLower.includes('ownership')) {
    tags.push('team-oriented', 'employee-empowerment', 'flat-hierarchy');
    culturalInsights.management = 'Fosters a collaborative and empowering environment with a focus on teamwork and flatter hierarchies.';
  } else if (Math.random() > 0.5) { 
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
  } else if (Math.random() > 0.4) { 
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
