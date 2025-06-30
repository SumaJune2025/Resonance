# 🌐 Values Sync
An app to assess company culture cues using website content or LinkedIn URLs. Designed to help job seekers discover cultural alignment with organizations
Features

- Enter a company domain or LinkedIn URL
- Enriches with GPT-4 to extract cultural tags (gender, climate, hybrid, equity, inclusionetc.etc)
- LinkedIn fallback using Google Search for recent posts
- Simple UI with Tailwind-ready styling

## 📦 Stack

- Next.js (React + API routes)
- Axios for data fetching
- JSDOM for parsing visible text
- OpenAI API for summarization
- Google search integration

## 🛠 Setup

1. Clone this repo:
   ```bash
   git clone https://github.com/your-username/culturematch-app.git
   cd culturematch-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Add your OpenAI API key:
   Create a `.env.local` file with:
   ```
   OPENAI_API_KEY=your_key_here
   ```

4. Run locally:
   ```bash
   npm run dev
   ```

5. Visit [http://localhost:3000](http://localhost:3000)

## 🧪 Example Inputs

- `acmeclimate.org`
- `linkedin.com/company/purposeworks`

## 🔒 Notes

- GPT-4 recommended (but works with `gpt-3.5-turbo`)
- Replace OpenAI with Claude or Groq for cost control later
- You can also add scraping or database logging later for scale

---

MIT License • Built for public interest apps.
