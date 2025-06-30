import axios from 'axios';
import { JSDOM } from 'jsdom';

export default async function handler(req, res) {
  const { domain } = req.query;
  if (!domain) return res.status(400).json({ error: 'Missing domain' });

  try {
    // LinkedIn simulation
    if (domain.includes('linkedin.com/company')) {
      return res.status(200).json({
        domain,
        summary: {
          summary: `Based on recent LinkedIn content, the company emphasizes DEI, hybrid work, and purpose-driven innovation.`,
          tags: ['DEI', 'hybrid', 'purpose', 'inclusive'],
        },
      });
    }

    // Website scraping
    const { data: html } = await axios.get(`https://${domain}`);
    const dom = new JSDOM(html);
    const text = dom.window.document.body.textContent || '';

    // GPT call
    const gptResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a cultural analyst for company websites.',
          },
          {
            role: 'user',
            content: `Based on the following homepage text, identify cultural values or signals (e.g., DEI, flexibility, climate focus, hybrid work, inclusion, purpose, innovation, etc.). Return a JSON object with a summary and tags.\n\nText:\n${text.slice(0, 5000)}`,
          },
        ],
        temperature: 0.4,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const parsed = gptResponse.data.choices[0].message.content;

    let result;
    try {
      result = JSON.parse(parsed);
    } catch {
      result = { summary: parsed, tags: [] };
    }

    res.status(200).json({ domain, summary: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to enrich domain', details: err.message });
  }
}