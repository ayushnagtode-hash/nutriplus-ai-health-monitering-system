export type ViewMode =
  | 'login'
  | 'dashboard'
  | 'digital-twin'
  | 'indian-recs'
  | 'my-health'
  | 'diet-log'
  | 'symptoms'
  | 'gut-score'
  | 'recommendations'
  | 'probiotics'
  | 'meal-planner'
  | 'food-scanner'
  | 'progress'
  | 'ai-nutritionist'
  | 'water'
  | 'grocery'
  | 'landing';

export interface UserHealthProfile {
  email?: string;
  fullName?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Non-binary' | 'Other' | '';
  heightCm: number;
  weightKg: number;
  dietaryPreference: string; // e.g. "Vegetarian", "Vegan", "Keto", "Low-FODMAP", "Omnivore", etc.
  foodAllergies: string; // e.g. "Peanuts, Shellfish"
  foodIntolerances: string; // e.g. "Lactose, Gluten"
  activityLevel: 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extra Active';
  sleepHours: number;
  waterGoalMl: number;
  stressLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  existingSymptoms: string[];
  healthGoals: string; // e.g. "Reduce bloating, improve energy, balance microbiome"
  updatedAt: string;
}

export interface DietEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  foodName: string;
  quantity: string;
  time: string; // HH:mm
  estimatedCalories: number;
  estimatedProteinGrams: number;
  estimatedFiberGrams: number;
  isAiEstimated?: boolean;
}

export interface SymptomEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  symptomType: 'Bloating' | 'Constipation' | 'Diarrhea' | 'Acidity' | 'Gas' | 'Abdominal Discomfort' | 'Nausea' | 'Fatigue' | 'Other';
  severity: number; // 0 = None, 1-3 = Mild, 4-6 = Moderate, 7-10 = Severe
  notes?: string;
  triggers?: string;
}

export interface GutHealthScoreData {
  overallScore: number; // 0 - 100
  subScores: {
    nutrition: number;
    hydration: number;
    fiber: number;
    lifestyle: number;
    symptomTrend: number;
  };
  summary: string;
  improvementSuggestions: string[];
  disclaimer: string;
  calculatedAt: string;
}

export interface FoodRecommendation {
  food: string;
  reason: string;
}

export interface MealRecommendation {
  mealType: string;
  title: string;
  why: string;
}

export interface RecommendationsData {
  foodsToInclude: FoodRecommendation[];
  foodsToLimit: FoodRecommendation[];
  nutritionalPriorities: string[];
  dailyNutritionSuggestions: string[];
  personalizedMealSuggestions: MealRecommendation[];
  disclaimer: string;
  updatedAt: string;
}

export interface ProbioticGuidanceItem {
  category: string;
  strainOrFood: string;
  reason: string;
  suggestedFoodSources: string[];
  usageGuidance: string;
}

export interface ProbioticGuidanceData {
  recommendations: ProbioticGuidanceItem[];
  mandatoryDisclaimer: string;
  updatedAt: string;
}

export interface MealPlanItem {
  id?: string;
  food: string;
  regionalName?: string;
  estimatedCalories: number;
  protein: number;
  fiber: number;
  gutHealthReason: string;
  costINR?: number;
  region?: string;
  isFermented?: boolean;
  consumed?: boolean;
}

export interface MealPlanData {
  planId?: string;
  region?: string;
  budgetINR?: number;
  healthGoal?: string;
  totalCostINR?: number;
  totalFiberGrams?: number;
  totalProteinGrams?: number;
  totalCalories?: number;
  overallWhy?: string;
  estimatedGutScoreGain?: number;
  meals: {
    breakfast: MealPlanItem;
    lunch: MealPlanItem;
    snack: MealPlanItem;
    dinner: MealPlanItem;
  };
  groceryItems: { category: string; item: string }[];
  generatedAt: string;
}

export interface FoodScanResult {
  foodName: string;
  estimatedNutrition: {
    calories: number;
    proteinGrams: number;
    fiberGrams: number;
    carbsGrams: number;
    fatGrams: number;
  };
  gutFriendlyRating: 'GOOD' | 'MODERATE' | 'LIMIT';
  ratingExplanation: string;
  benefits: string[];
  potentialDrawbacks: string[];
  disclaimer: string;
  scannedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface WaterLog {
  date: string; // YYYY-MM-DD
  consumedMl: number;
  goalMl: number;
}

export interface GroceryItem {
  id: string;
  category: 'Fruits' | 'Vegetables' | 'Whole grains' | 'Protein' | 'Probiotic foods' | 'Other essentials';
  item: string;
  purchased: boolean;
}
