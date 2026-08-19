import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 1. AI Gut Health Score
app.post('/api/gemini/gut-score', async (req, res) => {
  try {
    const { profile, dietLogs, symptoms, waterIntake } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.status(503).json({
        error: 'API Key not configured',
        fallback: true
      });
    }

    const prompt = `
Analyze this user's health profile, diet, symptoms, and water intake for a wellness Gut Health Assessment:
Profile: ${JSON.stringify(profile || {})}
Diet Logs: ${JSON.stringify(dietLogs || [])}
Symptoms: ${JSON.stringify(symptoms || [])}
Water Intake: ${JSON.stringify(waterIntake || {})}

Provide a structured JSON output with:
1. overallScore (number 0-100)
2. subScores: {
     nutrition: number 0-100,
     hydration: number 0-100,
     fiber: number 0-100,
     lifestyle: number 0-100,
     symptomTrend: number 0-100
   }
3. summary (string explanation)
4. improvementSuggestions (array of 2 to 3 strings)
5. disclaimer (string stating this is a wellness indicator, not a medical diagnosis)
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.INTEGER },
            subScores: {
              type: Type.OBJECT,
              properties: {
                nutrition: { type: Type.INTEGER },
                hydration: { type: Type.INTEGER },
                fiber: { type: Type.INTEGER },
                lifestyle: { type: Type.INTEGER },
                symptomTrend: { type: Type.INTEGER },
              },
              required: ['nutrition', 'hydration', 'fiber', 'lifestyle', 'symptomTrend'],
            },
            summary: { type: Type.STRING },
            improvementSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            disclaimer: { type: Type.STRING },
          },
          required: ['overallScore', 'subScores', 'summary', 'improvementSuggestions', 'disclaimer'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    res.json(data);
  } catch (err: any) {
    console.error('Gut score error:', err);
    res.status(500).json({ error: err.message || 'Failed to calculate gut score' });
  }
});

// 2. AI Personalized Recommendations
app.post('/api/gemini/recommendations', async (req, res) => {
  try {
    const { profile, dietLogs, symptoms, waterIntake } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.status(503).json({ error: 'API Key not configured' });
    }

    const prompt = `
Analyze user profile, diet logs, symptoms, water intake, and health goals to generate personalized nutrition recommendations:
Profile: ${JSON.stringify(profile || {})}
Diet Logs: ${JSON.stringify(dietLogs || [])}
Symptoms: ${JSON.stringify(symptoms || [])}
Water Intake: ${JSON.stringify(waterIntake || {})}

Generate JSON with:
- foodsToInclude: array of objects with { food: string, reason: string }
- foodsToLimit: array of objects with { food: string, reason: string }
- nutritionalPriorities: array of strings
- dailyNutritionSuggestions: array of strings
- personalizedMealSuggestions: array of objects with { mealType: string, title: string, why: string }
- disclaimer: string
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodsToInclude: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  food: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ['food', 'reason'],
              },
            },
            foodsToLimit: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  food: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ['food', 'reason'],
              },
            },
            nutritionalPriorities: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            dailyNutritionSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            personalizedMealSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  mealType: { type: Type.STRING },
                  title: { type: Type.STRING },
                  why: { type: Type.STRING },
                },
                required: ['mealType', 'title', 'why'],
              },
            },
            disclaimer: { type: Type.STRING },
          },
          required: ['foodsToInclude', 'foodsToLimit', 'nutritionalPriorities', 'dailyNutritionSuggestions', 'personalizedMealSuggestions', 'disclaimer'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    res.json(data);
  } catch (err: any) {
    console.error('Recommendations error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate recommendations' });
  }
});

// 3. AI Probiotic Guidance
app.post('/api/gemini/probiotics', async (req, res) => {
  try {
    const { profile, symptoms } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.status(503).json({ error: 'API Key not configured' });
    }

    const prompt = `
Give evidence-based, non-prescriptive probiotic wellness guidance for this user context:
Profile: ${JSON.stringify(profile || {})}
Symptoms: ${JSON.stringify(symptoms || [])}

Generate JSON with:
- recommendations: array of objects with {
    category: string (e.g. "Fermented Foods", "Lactobacillus / Bifidobacterium Strains"),
    strainOrFood: string,
    reason: string (Why this recommendation?),
    suggestedFoodSources: array of strings,
    usageGuidance: string
  }
- mandatoryDisclaimer: string (e.g., "Consult a qualified healthcare professional before using probiotic supplements, especially if you have a medical condition or take medication.")
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  strainOrFood: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  suggestedFoodSources: { type: Type.ARRAY, items: { type: Type.STRING } },
                  usageGuidance: { type: Type.STRING },
                },
                required: ['category', 'strainOrFood', 'reason', 'suggestedFoodSources', 'usageGuidance'],
              },
            },
            mandatoryDisclaimer: { type: Type.STRING },
          },
          required: ['recommendations', 'mandatoryDisclaimer'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    res.json(data);
  } catch (err: any) {
    console.error('Probiotics error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate probiotic guidance' });
  }
});

// 4. AI Meal Planner (India-First 🇮🇳)
app.post('/api/gemini/meal-plan', async (req, res) => {
  try {
    const { profile, goals, region, budgetINR, symptoms, previousMealNames } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.status(503).json({ error: 'API Key not configured' });
    }

    const selectedRegion = region || 'Maharashtra';
    const targetBudget = budgetINR || 200;
    const selectedGoal = goals || profile?.healthGoals || 'Better Gut Health';

    const prompt = `
CRITICAL INSTRUCTION: You MUST generate a 100% INDIA-FIRST 🇮🇳 personalized gut-healthy daily meal plan.
Do NOT recommend oats, cereal, smoothies, avocado toast, salads, or sandwiches as defaults.
Primarily recommend authentic Indian dishes (e.g. Poha, Thalipeeth, Bhakri, Pithla, Varan Bhaat, Usal, Khichdi, Idli, Dosa, Upma, Sambar, Rasam, Curd Rice, Chilla, Paratha, Kadhi, Chaas, Sol Kadhi, Sabudana, Ragi, Bajra, Jowar).

User Parameters:
- Preferred Indian Cuisine: ${selectedRegion}
- Daily Food Budget: ₹${targetBudget}
- Health Goal: ${selectedGoal}
- Age: ${profile?.age || 'N/A'}, Gender: ${profile?.gender || 'N/A'}
- Dietary Preference: ${profile?.dietaryPreference || 'Vegetarian'}
- Food Allergies: ${profile?.foodAllergies || 'None'}
- Food Intolerances: ${profile?.foodIntolerances || 'None'}
- Reported Symptoms: ${JSON.stringify(symptoms || [])}
- Previous Meals (DO NOT REPEAT ANY OF THESE): ${JSON.stringify(previousMealNames || [])}

Generate JSON with:
- planId: unique string ID
- region: "${selectedRegion}"
- budgetINR: ${targetBudget}
- healthGoal: "${selectedGoal}"
- totalCostINR: total cost of 4 meals in ₹ (must be <= ₹${targetBudget})
- totalFiberGrams: total fiber in grams
- totalProteinGrams: total protein in grams
- totalCalories: total calories
- overallWhy: string explanation of why this Indian meal plan suits the user
- estimatedGutScoreGain: number (e.g. 3 to 5)
- meals: object with keys 'breakfast', 'lunch', 'snack', 'dinner'. Each containing:
    { food: string, regionalName: string, estimatedCalories: number, protein: number, fiber: number, gutHealthReason: string, costINR: number }
- groceryItems: array of objects { category: string, item: string }
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planId: { type: Type.STRING },
            region: { type: Type.STRING },
            budgetINR: { type: Type.INTEGER },
            healthGoal: { type: Type.STRING },
            totalCostINR: { type: Type.INTEGER },
            totalFiberGrams: { type: Type.INTEGER },
            totalProteinGrams: { type: Type.INTEGER },
            totalCalories: { type: Type.INTEGER },
            overallWhy: { type: Type.STRING },
            estimatedGutScoreGain: { type: Type.INTEGER },
            meals: {
              type: Type.OBJECT,
              properties: {
                breakfast: {
                  type: Type.OBJECT,
                  properties: {
                    food: { type: Type.STRING },
                    regionalName: { type: Type.STRING },
                    estimatedCalories: { type: Type.INTEGER },
                    protein: { type: Type.INTEGER },
                    fiber: { type: Type.INTEGER },
                    gutHealthReason: { type: Type.STRING },
                    costINR: { type: Type.INTEGER },
                  },
                  required: ['food', 'estimatedCalories', 'protein', 'fiber', 'gutHealthReason', 'costINR'],
                },
                lunch: {
                  type: Type.OBJECT,
                  properties: {
                    food: { type: Type.STRING },
                    regionalName: { type: Type.STRING },
                    estimatedCalories: { type: Type.INTEGER },
                    protein: { type: Type.INTEGER },
                    fiber: { type: Type.INTEGER },
                    gutHealthReason: { type: Type.STRING },
                    costINR: { type: Type.INTEGER },
                  },
                  required: ['food', 'estimatedCalories', 'protein', 'fiber', 'gutHealthReason', 'costINR'],
                },
                snack: {
                  type: Type.OBJECT,
                  properties: {
                    food: { type: Type.STRING },
                    regionalName: { type: Type.STRING },
                    estimatedCalories: { type: Type.INTEGER },
                    protein: { type: Type.INTEGER },
                    fiber: { type: Type.INTEGER },
                    gutHealthReason: { type: Type.STRING },
                    costINR: { type: Type.INTEGER },
                  },
                  required: ['food', 'estimatedCalories', 'protein', 'fiber', 'gutHealthReason', 'costINR'],
                },
                dinner: {
                  type: Type.OBJECT,
                  properties: {
                    food: { type: Type.STRING },
                    regionalName: { type: Type.STRING },
                    estimatedCalories: { type: Type.INTEGER },
                    protein: { type: Type.INTEGER },
                    fiber: { type: Type.INTEGER },
                    gutHealthReason: { type: Type.STRING },
                    costINR: { type: Type.INTEGER },
                  },
                  required: ['food', 'estimatedCalories', 'protein', 'fiber', 'gutHealthReason', 'costINR'],
                },
              },
              required: ['breakfast', 'lunch', 'snack', 'dinner'],
            },
            groceryItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  item: { type: Type.STRING },
                },
                required: ['category', 'item'],
              },
            },
          },
          required: ['meals', 'groceryItems'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    res.json(data);
  } catch (err: any) {
    console.error('Meal plan error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate meal plan' });
  }
});

// 5. AI Food Scanner
app.post('/api/gemini/scan-food', async (req, res) => {
  try {
    const { imageBase64, imageMimeType, foodName, profile } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.status(503).json({ error: 'API Key not configured' });
    }

    const contentsParts: any[] = [];

    if (imageBase64) {
      contentsParts.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType || 'image/jpeg',
        },
      });
    }

    contentsParts.push({
      text: `Identify and analyze this food item for gut health ${foodName ? `(User specified name: ${foodName})` : ''}.
User profile context: Allergies: ${profile?.foodAllergies || 'None'}, Intolerances: ${profile?.foodIntolerances || 'None'}, Preference: ${profile?.dietaryPreference || 'None'}.

Provide JSON output with:
- foodName: string
- estimatedNutrition: { calories: number, proteinGrams: number, fiberGrams: number, carbsGrams: number, fatGrams: number }
- gutFriendlyRating: "GOOD" | "MODERATE" | "LIMIT"
- ratingExplanation: string (detailed explanation of why it received this rating for gut health)
- benefits: array of strings
- potentialDrawbacks: array of strings
- disclaimer: string ("Nutritional values are estimates.")
`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: { parts: contentsParts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING },
            estimatedNutrition: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.INTEGER },
                proteinGrams: { type: Type.NUMBER },
                fiberGrams: { type: Type.NUMBER },
                carbsGrams: { type: Type.NUMBER },
                fatGrams: { type: Type.NUMBER },
              },
              required: ['calories', 'proteinGrams', 'fiberGrams', 'carbsGrams', 'fatGrams'],
            },
            gutFriendlyRating: { type: Type.STRING },
            ratingExplanation: { type: Type.STRING },
            benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
            potentialDrawbacks: { type: Type.ARRAY, items: { type: Type.STRING } },
            disclaimer: { type: Type.STRING },
          },
          required: ['foodName', 'estimatedNutrition', 'gutFriendlyRating', 'ratingExplanation', 'benefits', 'potentialDrawbacks', 'disclaimer'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    res.json(data);
  } catch (err: any) {
    console.error('Scan food error:', err);
    res.status(500).json({ error: err.message || 'Failed to scan food' });
  }
});

// 6. AI Nutritionist Chatbot
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, chatHistory, profile, symptoms, dietLogs } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.status(503).json({ error: 'API Key not configured' });
    }

    const systemInstruction = `
You are "NutriPlus AI", an expert personalized gut-health and nutrition AI assistant.
User Profile context:
Age: ${profile?.age || 'N/A'}, Gender: ${profile?.gender || 'N/A'}, Height: ${profile?.height || 'N/A'}cm, Weight: ${profile?.weight || 'N/A'}kg
Dietary Preference: ${profile?.dietaryPreference || 'None'}
Food Allergies: ${profile?.foodAllergies || 'None'}
Food Intolerances: ${profile?.foodIntolerances || 'None'}
Activity Level: ${profile?.activityLevel || 'N/A'}
Health Goals: ${profile?.healthGoals || 'General gut health'}
Recent Symptoms: ${JSON.stringify(symptoms || [])}
Recent Diet: ${JSON.stringify(dietLogs || [])}

Rules:
1. Provide concise, empathetic, practical gut-health and nutrition guidance.
2. NEVER diagnose medical conditions or prescribe medications.
3. If user mentions severe or concerning symptoms (e.g., severe pain, blood in stool, rapid unexplainable weight loss, persistent high fever), explicitly recommend evaluating with a doctor.
4. Keep answers clean, formatted with bullet points where helpful.
`;

    const chat = ai.chats.create({
      model: 'gemini-3.6-flash',
      config: {
        systemInstruction,
      },
    });

    // Send history if present
    if (Array.isArray(chatHistory)) {
      for (const h of chatHistory.slice(-6)) {
        if (h.sender === 'user') {
          await chat.sendMessage({ message: h.text });
        }
      }
    }

    const response = await chat.sendMessage({ message });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message || 'Failed to process chat message' });
  }
});

// 7. AI Health Report
app.post('/api/gemini/health-report', async (req, res) => {
  try {
    const { profile, gutScore, dietLogs, symptoms, waterIntake, progress } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.status(503).json({ error: 'API Key not configured' });
    }

    const prompt = `
Generate a comprehensive, beautifully structured Gut Health Report in Markdown format based on this data:
Profile: ${JSON.stringify(profile || {})}
Gut Score Data: ${JSON.stringify(gutScore || {})}
Diet Logs: ${JSON.stringify(dietLogs || [])}
Symptoms History: ${JSON.stringify(symptoms || [])}
Water Intake: ${JSON.stringify(waterIntake || {})}
Progress: ${JSON.stringify(progress || {})}

The report should have sections:
1. Executive Summary & Gut Health Score
2. User Health Profile Overview
3. Nutritional Analysis & Fiber Intake
4. Symptom Pattern & Digestive Trend
5. Personalized Probiotic & Diet Action Plan
6. 7-Day Gut Wellness Strategy
7. Important Medical Disclaimer ("AI-generated wellness guidance. Not a medical diagnosis.")
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    res.json({ reportMarkdown: response.text });
  } catch (err: any) {
    console.error('Health report error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate health report' });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NutriPlus AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
