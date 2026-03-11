const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a senior business analyst writing executive briefings. 
Your task is to analyze sales data provided in CSV format and produce a concise, 
professional narrative summary suitable for C-suite leadership.

Structure your response with these sections using markdown:
1. **Executive Summary** — 2-3 sentence TL;DR of overall performance
2. **Key Metrics** — Top figures (total revenue, units sold, top-performing region/category)
3. **Trends & Insights** — Notable patterns, anomalies, or momentum shifts
4. **Recommendations** — 2-3 actionable next steps based on the data

Keep the tone confident, data-driven, and free of unnecessary jargon. 
Do not include raw data tables — synthesize the data into narrative insights.`;

/**
 * Sends parsed CSV data to Groq Llama 3 and returns a formatted summary.
 *
 * @param {string} dataPreview - Flattened CSV text (headers + rows)
 * @param {number} totalRows - Total row count in the dataset
 * @returns {Promise<string>} Markdown-formatted executive summary
 */
const generateSummary = async (dataPreview, totalRows) => {
  const userPrompt = `Below is sales data with ${totalRows} total records. Analyze it and produce the executive briefing.\n\n${dataPreview}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
    max_tokens: 1024,
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No response received from the AI engine.");
  }

  return content;
};

module.exports = { generateSummary };
