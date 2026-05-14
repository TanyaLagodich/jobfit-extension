import { useState } from "react";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  // Это нужно потому что по умолчанию OpenAI SDK запрещает работу в браузере
  // В продакшене ключ должен быть на сервере, но для пет-проекта так ок
  dangerouslyAllowBrowser: true,
});

type JobData = {
  fullText: string;
  url: string;
};

type Analysis = {
  fitScore: number;
  title: string;
  company: string;
  whyMatch: string[];
  concerns: string[];
  stack: string[];
  missingSkills: string[];
  interviewTopics: string[];
};

function App() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    setLoading(true);
    setError(null);

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const jobData: JobData = await chrome.tabs.sendMessage(tab.id!, {
        type: "GET_JOB_DATA",
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        // gpt-4o-mini — самая дешёвая модель OpenAI, ~$0.0002 за запрос
        // для пет-проекта $5 хватит на тысячи запросов
        messages: [
          {
            role: "system",
            content:
              "You are helping a frontend developer evaluate job postings. Always respond with valid JSON only, no markdown, no code blocks.",
          },
          {
            role: "user",
            content: `
  You are analyzing a LinkedIn job posting page text.

  Page text:
  ${jobData.fullText}

  My profile: senior frontend developer, 7 years of Vue.js experience, basic React knowledge, TypeScript, strong CSS/HTML skills.

  Extract the job title and company name from the text above.
  Then evaluate how well my profile matches this job.

  Return ONLY valid JSON, no markdown, no code blocks:
  {
    "fitScore": number from 0 to 100,
    "title": "job title extracted from the text",
    "company": "company name extracted from the text",
    "whyMatch": ["reason 1", "reason 2", "reason 3"],
    "concerns": ["concern 1", "concern 2"],
    "stack": ["technology 1", "technology 2"],
    "missingSkills": ["skill 1", "skill 2"],
    "interviewTopics": ["topic 1", "topic 2", "topic 3"]
  }
`,
          },
        ],
      });

      // OpenAI возвращает ответ в choices[0].message.content
      const text = response.choices[0].message.content ?? "";
      console.log("Job data:", jobData);
      console.log("AI response:", text); // добавь эту строку
      const parsed: Analysis = JSON.parse(text);
      setAnalysis(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: 380, padding: 16, fontFamily: "sans-serif" }}>
      <h2>JobFit AI</h2>

      <button onClick={analyze} disabled={loading}>
        {loading ? "Анализирую..." : "Анализировать вакансию"}
      </button>

      {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}

      {analysis && (
        <div style={{ marginTop: 16 }}>
          <h3>Fit Score: {analysis.fitScore}/100</h3>
          <p>
            <strong>{analysis.title}</strong> · {analysis.company}
          </p>

          <h4 style={{ marginTop: 12 }}>Почему подходишь:</h4>
          <ul>
            {analysis.whyMatch.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h4 style={{ marginTop: 12 }}>Опасения:</h4>
          <ul>
            {analysis.concerns.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h4 style={{ marginTop: 12 }}>Стек:</h4>
          <p>{analysis.stack.join(", ")}</p>

          <h4 style={{ marginTop: 12 }}>Пропущенные скиллы:</h4>
          <p>{analysis.missingSkills.join(", ")}</p>

          <h4 style={{ marginTop: 12 }}>Темы для интервью:</h4>
          <ul>
            {analysis.interviewTopics.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
