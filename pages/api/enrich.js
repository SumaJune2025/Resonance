import { JSDOM } from 'jsdom'; // Still present, but tryBasicWebScraping is commented out
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
  let maxPossibleScore = 0;

  // Define preferences to iterate through
  const preferenceCategories = ['flexibility', 'management', 'inclusion'];

  // Map user preference selections to numerical scores
  const preferenceScoreMap = {
    'not-important': 0,
    'slightly-important': 1,
    'important': 2,
    'very-important': 3,
  };

  // Calculate max possible score for normalization
  preferenceCategories.forEach(category => {
    maxPossibleScore += preferenceScoreMap[userPreferences[category] || 'not-important'];
  });

  // Factor in positive tags
  companyTags.forEach(tag => {
    switch (tag) {
      // Flexibility
      case 'work-from-home-friendly':
      case 'remote-friendly':
      case 'flexible-hours':
      case 'work-life-balance':
      case 'flexibility-carers': // New tag
      case 'paternity-leave': // New tag
        if (preferenceScoreMap[userPreferences.flexibility] > 0) {
          score += preferenceScoreMap[userPreferences.flexibility];
          reasons.push(`Strong focus on ${tag.replace(/-/g, ' ')} aligns with your flexibility preference.`);
        }
        break;
      // Management
      case 'flat-hierarchy':
      case 'employee-empowerment':
      case 'transparent-communication':
      case 'professional-growth':
      case 'learning-culture':
      case 'innovation-voice': // New tag
        if (preferenceScoreMap[userPreferences.management] > 0) {
          score += preferenceScoreMap[userPreferences.management];
          reasons.push(`Emphasis on ${tag.replace(/-/g, ' ')} aligns with your management preference.`);
        }
        break;
      // Inclusion
      case 'diverse-workforce':
      case 'inclusive-environment':
      case 'equal-opportunity':
      case 'women-leadership': // New tag
      case 'lgbtqa': // New tag
      case 'lgbtqa-plus': // New tag
      case 'ramadan-friendly': // New tag
      case 'diwali-friendly': // New tag
      case 'onam-friendly': // New tag
      case 'eid-friendly': // New tag
      case 'christmas-friendly': // New tag
      case 'communities-respect': // New tag
      case 'climate-change': // New tag (can be inclusion/values)
        if (preferenceScoreMap[userPreferences.inclusion] > 0) {
          score += preferenceScoreMap[userPreferences.inclusion];
          reasons.push(`Commitment to ${tag.replace(/-/g, ' ')} aligns with your inclusion preference.`);
        }
        break;
      default:
        // Other general positive tags that contribute slightly if any preference is strong
        if (['integrity', 'teamwork', 'communication', 'customer-centric'].includes(tag) && maxPossibleScore > 0) {
          score += 0.5; // Small bonus for general positive traits
          reasons.push(`General positive attribute: ${tag.replace(/-/g, ' ')}.`);
        }
        break;
    }
  });

  // Factor in negative tags (penalties)
  companyTags.forEach(tag => {
    switch (tag) {
      // Management & Flexibility
      case 'micro-managed': // New negative tag
      case 'long-hours': // New negative tag
      case 'top-down': // New negative tag
        if (preferenceScoreMap[userPreferences.management] > 1 || preferenceScoreMap[userPreferences.flexibility] > 1) { // Penalize if management/flexibility is important
          score -= preferenceScoreMap[userPreferences.management] + preferenceScoreMap[userPreferences.flexibility];
          reasons.push(`Concern: ${tag.replace(/-/g, ' ')} which conflicts with your preferences.`);
        } else {
            reasons.push(`Note: ${tag.replace(/-/g, ' ')} may be a factor to consider.`);
        }
        break;
      // Inclusion
      case 'racial-bias': // New negative tag
      case 'ethnic-bias': // New negative tag
      case 'religious-bias': // New negative tag
      case 'caste-bias': // New negative tag
        if (preferenceScoreMap[userPreferences.inclusion] > 1) { // Penalize heavily if inclusion is important
          score -= (preferenceScoreMap[userPreferences.inclusion] * 2); // Double penalty for strong inclusion preference
          reasons.push(`Critical concern: Presence of ${tag.replace(/-/g, ' ')} which heavily conflicts with your inclusion preference.`);
        } else {
            reasons.push(`Note: Potential ${tag.replace(/-/g, ' ')} issues were identified.`);
        }
        break;
    }
  });

  // Ensure score doesn't go below zero
  score = Math.max(0, score);

  // Calculate percentage match
  const matchPercentage = maxPossibleScore > 0 ? Math.round((score / maxPossibleScore) * 100) : 0;

  // Add a general concluding reason if no specific reasons were added
  if (reasons.length === 0 && matchPercentage > 0) {
    reasons.push('The company generally aligns with your selected preferences.');
  } else if (reasons.length === 0 && matchPercentage === 0) {
    reasons.push('No significant cultural alignment found with your preferences.');
  }


  return {
    score: matchPercentage,
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
  if (domainLower.includes('deloitte') || domainLower.includes('ey') || domainLower.includes('pwc') || domainLower.includes('kpmg')) {
    tags.push('long-hours', 'top-down'); // Simulated: Large consulting/accounting firms often have long hours, top-down structures
  }
  if (domainLower.includes('amazon') || domainLower.includes('microsoft')) {
    tags.push('long-hours'); // Simulated: Known for demanding environments
  }
  if (domainLower.includes('google') || domainLower.includes('netflix')) {
    tags.push('high-autonomy'); // Simulated: High autonomy culture
  }
  if (domainLower.includes('oldcorp') || domainLower.includes('bureaucracy')) { // Example imaginary domains
    tags.push('micro-managed', 'top-down');
  }
  if (domainLower.includes('biasedinc')) { // Example imaginary domains for bias
    tags.push('racial-bias', 'ethnic-bias');
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
  if (domainLower.includes('carers') || domainLower.includes('family')) { // New tag trigger
    tags.push('flexibility-carers', 'paternity-leave');
    culturalInsights.flexibility += ' Particularly supportive of carers and parental leave.';
  }

  // Management
  if (domainLower.includes('team') || domainLower.includes('collaborate')) {
    tags.push('team-oriented', 'employee-empowerment');
    culturalInsights.management = 'Fosters a collaborative and empowering environment with a focus on teamwork.';
  } else if (Math.random() > 0.6) { // Random chance for some positive management traits
    tags.push('transparent-communication', 'professional-growth');
    culturalInsights.management = 'Encourages transparent communication and employee professional growth.';
  }
  if (domainLower.includes('innovation') || domainLower.includes('voice') || domainLower.includes('ideas')) { // New tag trigger
    tags.push('innovation-voice');
    culturalInsights.management += ' Values employee voice and innovative ideas from all levels.';
  }

  // Inclusion
  if (domainLower.includes('diverse') || domainLower.includes('inclusion') || domainLower.includes('equity')) {
    tags.push('diverse-workforce', 'inclusive-environment', 'equal-opportunity');
    culturalInsights.inclusion = 'Highly committed to diversity, equity, and inclusion across all aspects.';
  } else if (Math.random() > 0.5) { // Random chance for some positive inclusion traits
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
    // These are sensitive, so let's simulate recognition if the domain implies focus, without generating bias tags here.
    // Negative bias tags are handled separately based on other domain patterns.
    tags.push('racial-equity-focus', 'caste-equity-awareness'); // Positive recognition
  }
  if (domainLower.includes('community') || domainLower.includes('csr') || domainLower.includes('impact')) { // New tag trigger
    tags.push('communities-respect');
    culturalInsights.inclusion += ' Demonstrates strong commitment to community engagement and respect.';
  }
  if (domainLower.includes('green') || domainLower.includes('sustain') || domainLower.includes('ecofriendly')) { // New tag trigger
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
