/** Defensive version of computeMatch() to avoid crashes from undefined preferences */
function computeMatch(companyTags, userPreferences) {
  let score = 0;
  let reasons = [];
  let maxPossibleScore = 0;

  const preferenceCategories = ['flexibility', 'management', 'inclusion'];

  const preferenceScoreMap = {
    'not-important': 0,
    'somewhat-important': 1,
    'important': 2,
    'very-important': 3
  };

  // Safely compute max possible score
  preferenceCategories.forEach(category => {
    const prefKey = userPreferences?.[category];
    const mapped = preferenceScoreMap[prefKey] ?? 0;
    maxPossibleScore += mapped;
  });

  // Factor in positive tags
  companyTags.forEach(tag => {
    const flexibilityScore = preferenceScoreMap[userPreferences?.flexibility] ?? 0;
    const managementScore = preferenceScoreMap[userPreferences?.management] ?? 0;
    const inclusionScore = preferenceScoreMap[userPreferences?.inclusion] ?? 0;

    switch (tag) {
      case 'work-from-home-friendly':
      case 'remote-friendly':
      case 'flexible-hours':
      case 'work-life-balance':
      case 'flexibility-carers':
      case 'paternity-leave':
        if (flexibilityScore > 0) {
          score += flexibilityScore;
          reasons.push(`Strong focus on ${tag.replace(/-/g, ' ')} aligns with your flexibility preference.`);
        }
        break;
      case 'flat-hierarchy':
      case 'employee-empowerment':
      case 'transparent-communication':
      case 'professional-growth':
      case 'learning-culture':
      case 'innovation-voice':
        if (managementScore > 0) {
          score += managementScore;
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
        if (inclusionScore > 0) {
          score += inclusionScore;
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

  // Handle negative tags (penalties)
  companyTags.forEach(tag => {
    const flexibilityScore = preferenceScoreMap[userPreferences?.flexibility] ?? 0;
    const managementScore = preferenceScoreMap[userPreferences?.management] ?? 0;
    const inclusionScore = preferenceScoreMap[userPreferences?.inclusion] ?? 0;

    switch (tag) {
      case 'micro-managed':
      case 'long-hours':
      case 'top-down':
        if (managementScore > 1 || flexibilityScore > 1) {
          score -= (managementScore + flexibilityScore);
          reasons.push(`Concern: ${tag.replace(/-/g, ' ')} which conflicts with your preferences.`);
        } else {
          reasons.push(`Note: ${tag.replace(/-/g, ' ')} may be a factor to consider.`);
        }
        break;
      case 'racial-bias':
      case 'ethnic-bias':
      case 'religious-bias':
      case 'caste-bias':
        if (inclusionScore > 1) {
          score -= (inclusionScore * 2);
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
