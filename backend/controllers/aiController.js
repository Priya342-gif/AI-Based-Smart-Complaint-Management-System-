const axios = require('axios');
const Complaint = require('../models/Complaint');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
// Use llama-3.3-70b (free) — better instruction following than 3.1-8b
const AI_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

/**
 * Build the AI prompt with clear, explicit priority rules so the model
 * doesn't default to "Medium" for everything.
 */
const buildAnalysisPrompt = (title, description, category, location) =>
  `You are analyzing a public complaint for a government complaint management system.

Complaint Title: ${title}
Description: ${description}
Category: ${category}
Location: ${location || 'Not specified'}

Assign priority using these STRICT rules:
- HIGH: electricity outage/failure, fire hazard, gas leak, flooding, sewage overflow, no water supply, road accident, structural collapse, public safety threat, violence, medical emergency, or ANY situation with immediate risk to health, life, or property. Electricity issues are ALWAYS High. Water leakage causing flooding is ALWAYS High.
- LOW: cosmetic issues, minor inconveniences, suggestions, feedback, non-urgent requests, or issues that have existed for a long time without worsening.
- MEDIUM: everything else that needs attention but is not immediately dangerous.

Respond with ONLY this JSON object — no markdown, no explanation, no extra text:
{
  "priority": "High",
  "department": "name of the responsible government department",
  "summary": "2-3 sentence factual summary of the complaint",
  "autoResponse": "professional 2-3 sentence response to the complainant acknowledging their complaint and stating next steps"
}`;

/**
 * Call OpenRouter AI API with retry logic for slow/free tier responses
 */
const callOpenRouterAI = async (prompt, retries = 3, delayMs = 5000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(
        OPENROUTER_API_URL,
        {
          model: AI_MODEL,
          messages: [
            {
              role: 'system',
              content:
                'You are a complaint analysis AI. You ONLY output valid JSON. Never output markdown, never output explanations. Just the raw JSON object.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.2
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://smart-complaint-management.onrender.com',
            'X-Title': 'Smart Complaint Management System'
          },
          timeout: 30000
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty response from AI');
      return content;
    } catch (error) {
      console.error(`AI attempt ${attempt} failed:`, error.message);
      if (attempt < retries) {
        console.log(`Retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        throw error;
      }
    }
  }
};

/**
 * Parse AI JSON response safely — strips markdown fences if present
 */
const parseAIResponse = (content) => {
  try {
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
};

/**
 * Rule-based fallback — used when AI is unavailable.
 * Has a broad keyword list so High priority is correctly detected.
 */
const getRuleBasedAnalysis = (category, title, description) => {
  const text = `${title} ${description}`.toLowerCase();

  // High-priority keywords — broad and realistic
  const highKeywords = [
    'urgent', 'emergency', 'danger', 'dangerous', 'fire', 'flood', 'flooding',
    'accident', 'injury', 'injured', 'death', 'dead', 'critical', 'immediate',
    'electricity', 'electric', 'power outage', 'power cut', 'no power', 'no electricity',
    'shock', 'electrocution', 'short circuit', 'sparking', 'wire', 'cable',
    'gas leak', 'gas', 'explosion', 'blast',
    'sewage', 'overflow', 'blockage', 'blocked drain',
    'no water', 'water cut', 'pipeline burst', 'burst pipe', 'leakage', 'leak',
    'road accident', 'pothole', 'collapse', 'collapsed', 'structural',
    'violence', 'assault', 'theft', 'robbery', 'crime',
    'hospital', 'medical', 'health hazard', 'contamination', 'contaminated',
    'broken', 'damaged', 'not working', 'failed', 'failure', 'outage'
  ];

  const lowKeywords = [
    'minor', 'small', 'slight', 'little', 'cosmetic', 'suggestion',
    'feedback', 'request', 'improvement', 'paint', 'aesthetic'
  ];

  // Category-based default priorities
  const highCategories = ['Electricity', 'Public Safety', 'Healthcare'];
  const lowCategories = ['Education'];

  let priority = 'Medium';

  if (highKeywords.some((k) => text.includes(k)) || highCategories.includes(category)) {
    priority = 'High';
  } else if (lowKeywords.some((k) => text.includes(k)) || lowCategories.includes(category)) {
    priority = 'Low';
  }

  const deptMap = {
    'Water Supply': 'Water Supply & Sanitation Department',
    Electricity: 'Electricity & Power Department',
    Roads: 'Public Works Department (PWD)',
    Sanitation: 'Municipal Sanitation Department',
    'Public Safety': 'Police & Public Safety Department',
    Healthcare: 'Health & Medical Department',
    Education: 'Education Department',
    Other: 'General Administration Department'
  };

  const department = deptMap[category] || 'General Administration Department';
  const summary = `A ${priority.toLowerCase()} priority complaint has been registered regarding ${category.toLowerCase()} issues at ${title}. The matter has been forwarded to the ${department} for immediate review and action.`;
  const autoResponse = `Dear Complainant, thank you for reporting this ${category} issue. Your complaint has been assigned ${priority} priority and forwarded to the ${department}. We will ensure it is addressed ${priority === 'High' ? 'as a matter of urgency' : 'in due course'}.`;

  return { priority, department, summary, autoResponse };
};

/**
 * Async AI analysis — runs in background after complaint submission.
 * Always resolves (never throws), falls back to rule-based on any failure.
 */
const analyzeComplaintAsync = async (complaintId, title, description, category, location) => {
  const prompt = buildAnalysisPrompt(title, description, category, location);

  try {
    const content = await callOpenRouterAI(prompt);
    const parsed = parseAIResponse(content);

    if (parsed && parsed.department) {
      // Always validate priority with rule-based logic — free AI models often
      // ignore instructions and default to "Medium". We use AI for department,
      // summary and autoResponse, but enforce priority ourselves.
      const ruleBased = getRuleBasedAnalysis(category, title, description);
      const finalPriority = ruleBased.priority;

      await Complaint.findByIdAndUpdate(complaintId, {
        aiAnalysis: {
          priority: finalPriority,
          department: parsed.department || ruleBased.department,
          summary: parsed.summary || ruleBased.summary,
          autoResponse: parsed.autoResponse || ruleBased.autoResponse,
          analyzedAt: new Date()
        },
        aiStatus: 'completed'
      });
      console.log(`AI analysis completed for complaint ${complaintId} — priority: ${finalPriority} (rule-enforced)`);
    } else {
      throw new Error('AI returned unparseable response');
    }
  } catch (error) {
    console.error(`AI analysis failed for complaint ${complaintId}:`, error.message);
    try {
      const fallback = getRuleBasedAnalysis(category, title, description);
      await Complaint.findByIdAndUpdate(complaintId, {
        aiAnalysis: { ...fallback, analyzedAt: new Date() },
        aiStatus: 'completed'
      });
      console.log(`Fallback analysis used for complaint ${complaintId} — priority: ${fallback.priority}`);
    } catch (dbError) {
      console.error('DB fallback update failed:', dbError.message);
      await Complaint.findByIdAndUpdate(complaintId, { aiStatus: 'failed' });
    }
  }
};

/**
 * @route   POST /api/ai/analyze
 * @desc    Analyze a complaint using AI (direct / on-demand call)
 * @access  Public
 */
const analyzeComplaint = async (req, res) => {
  const { title, description, category, location, complaintId } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ message: 'title, description, and category are required' });
  }

  // Return cached result if already done
  if (complaintId) {
    try {
      const existing = await Complaint.findById(complaintId);
      if (existing && existing.aiStatus === 'completed' && existing.aiAnalysis?.priority) {
        return res.json({ message: 'Analysis retrieved from cache', analysis: existing.aiAnalysis });
      }
      if (existing && existing.aiStatus === 'analyzing') {
        return res.json({ message: 'Analysis is still in progress', status: 'analyzing', analysis: null });
      }
    } catch (_) {
      // fall through to fresh analysis
    }
  }

  const prompt = buildAnalysisPrompt(title, description, category, location);

  try {
    const content = await callOpenRouterAI(prompt);
    const parsed = parseAIResponse(content);

    if (parsed && parsed.department) {
      // Enforce priority via rule-based logic — AI model unreliable on free tier
      const ruleBased = getRuleBasedAnalysis(category, title, description);
      const finalPriority = ruleBased.priority;
      const finalResult = {
        priority: finalPriority,
        department: parsed.department || ruleBased.department,
        summary: parsed.summary || ruleBased.summary,
        autoResponse: parsed.autoResponse || ruleBased.autoResponse
      };

      if (complaintId) {
        await Complaint.findByIdAndUpdate(complaintId, {
          aiAnalysis: { ...finalResult, analyzedAt: new Date() },
          aiStatus: 'completed'
        });
      }
      return res.json({ message: 'Analysis completed', analysis: finalResult });
    } else {
      throw new Error('Unparseable AI response');
    }
  } catch (error) {
    console.error('AI analyze error:', error.message);
    const fallback = getRuleBasedAnalysis(category, title, description);
    if (complaintId) {
      try {
        await Complaint.findByIdAndUpdate(complaintId, {
          aiAnalysis: { ...fallback, analyzedAt: new Date() },
          aiStatus: 'completed'
        });
      } catch (dbErr) {
        console.error('DB update error:', dbErr.message);
      }
    }
    return res.json({ message: 'Analysis completed (fallback)', analysis: fallback });
  }
};

/**
 * @route   GET /api/ai/status/:complaintId
 * @desc    Poll AI analysis status for a complaint
 * @access  Public
 */
const getAnalysisStatus = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.complaintId);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    res.json({
      aiStatus: complaint.aiStatus,
      aiAnalysis: complaint.aiStatus === 'completed' ? complaint.aiAnalysis : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get analysis status', error: error.message });
  }
};

module.exports = { analyzeComplaint, analyzeComplaintAsync, getAnalysisStatus };
