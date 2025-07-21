import { JSDOM } from 'jsdom';
import axios from 'axios';

export default async function handler(req, res) {
  const { domain, preferences } = req.method === 'POST' ? req.body : req.query;

  if (!domain) {
    return res.status(400).json({ error: 'Missing domain parameter' });
  }

  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    const summary = simulateCompanyAnalysis(cleanDomain);
    const culturalInsights = getEnhancedCulturalAnalysis(cleanDomain);
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

// Defensive match score function
function computeMatch(companyTags, userPreferences) {
  let score = 0;
  let reasons = [];
  let maxPossibleScore = 0;

  const preferenceCategories = ['flexibility', 'management', 'inclusion'];

  const preferenceScoreMap = {
    'not-important': 0,
    'somewhat-important': 1,
    'important': 2,
    'very-important': 3,
  };

  // Ensure userPreferences is defined and valid
  preferenceCategories.forEach(category => {
    const pref = preferenceScoreMap[userPreferences?.[category]] ?? 0;
    maxPossibleScore += pref;
  });

  companyTags.forEach(tag => {
    const flex = preferenceScoreMap[userPreferences?.flexibility] ?? 0;
    const mgmt = preferenceScoreMap[userPreferences?.management] ?? 0;
    const incl = preferenceScoreMap[userPreferences?.inclusion] ?? 0;

    switch (tag) {
      case 'work-from-home-friendly':
      case 'remote-friendly':
      case 'flexible-hours':
      case 'work-life-balance':
      case 'flexibility-carers':
      case 'paternity-leave':
        if (flex > 0) {
          score += flex;
          reasons.push(`Strong focus on ${tag.replace(/-/g, ' ')} aligns with your flexibility preference.`);
        }
        break;
      case 'flat-hierarchy':
      case 'employee-empowerment':
      case 'transparent-communication':
      case 'professional-growth':
      case 'learning-culture':
      case 'innovation-voice':
        if (mgmt > 0) {
          score += mgmt;
          reasons.push(`Emphasis on ${tag.replace(/-/g, ' ')} aligns with your management preference.`);
        }
        break;
      case 'diverse-workforce':
      case 'inclusive-environment':
      case 'equal-opportunity':
      case 'women-leadership':
      case 'lgbtqa':
      case 'lgbtqa-plus':
      case 'ramadan-friendly':
      case 'diwali-friendly':
      case 'onam-friendly':
      case 'eid-friendly':
      case 'christmas-friendly':
      case 'communities-respect':
      case 'climate-change':
        if (incl > 0) {
          score += incl;
          reasons.push(`Commitment to ${tag.replace(/-/g, ' ')} aligns with your inclusion preference.`);
        }
        break;
      default:
        if (['integrity', 'teamwork', 'communication', 'customer-centric'].includes(tag) && maxPossibleScore > 0) {
          score += 0.5;
          reasons.push(`General positive attribute: ${tag.replace(/-/g, ' ')}.`);
        }
        break;
    }
  });

  companyTags.forEach(tag => {
    const flex = preferenceScoreMap[userPreferences?.flexibility] ?? 0;
    const mgmt = preferenceScoreMap[userPreferences?.management] ?? 0;
    const incl = preferenceScoreMap[userPreferences?.inclusion] ?? 0;

    switch (tag) {
      case 'micro-managed':
      case 'long-hours':
      case 'top-down':
        if (mgmt > 1 || flex > 1) {
          score -= mgmt + flex;
          reasons.push(`Concern: ${tag.replace(/-/g, ' ')} which conflicts with your preferences.`);
        } else {
          reasons.push(`Note: ${tag.replace(/-/g, ' ')} may be a factor to consider.`);
        }
        break;
      case 'racial-bias':
      case 'ethnic-bias':
      case 'religious-bias':
      case 'caste-bias':
        if (incl > 1) {
          score -= incl * 2;
          reasons.push(`Critical concern: Presence of ${tag.replace(/-/g, ' ')} which heavily conflicts with your inclusion preference.`);
        } else {
          reasons.push(`Note: Potential ${tag.replace(/-/g, ' ')} issues were identified.`);
        }
        break;
    }
  });

  score = Math.max(0, score);
  const matchPercentage = maxPossibleScore > 0 ? Math.round((score / maxPossibleScore) * 100) : 0;

  if (reasons.length === 0 && matchPercentage > 0) {
    reasons.push('The company generally aligns with your selected preferences.');
  } else if (reasons.length === 0 && matchPercentage === 0) {
    reasons.push('No significant cultural alignment found with your preferences.');
  }

  return {
    score: matchPercentage,
    reasons: reasons.length > 0 ? reasons : ["No specific cultural alignment found, or too few preferences selected."]
  };
}

// The simulateCompanyAnalysis() and getEnhancedCulturalAnalysis() functions stay unchanged from your latest version.
