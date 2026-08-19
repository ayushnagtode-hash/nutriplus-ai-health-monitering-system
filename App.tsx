import React, { useState, useEffect } from 'react';
import {
  ViewMode,
  UserHealthProfile,
  GutHealthScoreData,
  DietEntry,
  SymptomEntry,
  WaterLog,
  RecommendationsData,
  ProbioticGuidanceData,
  MealPlanData,
  GroceryItem,
  ChatMessage,
} from './types';
import { Storage } from './lib/storage';
import {
  calculateFallbackGutScore,
  generateFallbackRecommendations,
  generateFallbackProbiotics,
  generateFallbackMealPlan,
  generateFallbackChatResponse,
} from './lib/aiFallback';
import { generatePersonalizedIndianMealPlan } from './lib/indianFoodEngine';
import { calculateGutDigitalTwin } from './lib/gutDigitalTwinEngine';

import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { GutDigitalTwin } from './components/GutDigitalTwin';
import { IndianFoodEngine } from './components/IndianFoodEngine';
import { MyHealthProfile } from './components/MyHealthProfile';
import { DietLog } from './components/DietLog';
import { SymptomTracker } from './components/SymptomTracker';
import { GutScoreCard } from './components/GutScoreCard';
import { AIRecommendations } from './components/AIRecommendations';
import { ProbioticGuidance } from './components/ProbioticGuidance';
import { MealPlanner } from './components/MealPlanner';
import { FoodScanner } from './components/FoodScanner';
import { ProgressDashboard } from './components/ProgressDashboard';
import { NutritionistChat } from './components/NutritionistChat';
import { WaterTracker } from './components/WaterTracker';
import { GroceryList } from './components/GroceryList';
import { HealthReportModal } from './components/HealthReportModal';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = Storage.getProfile();
    if (!saved || !saved.email) {
      return 'login';
    }
    return 'login'; // Show login page before dashboard as requested
  });

  // Application State
  const [profile, setProfile] = useState<UserHealthProfile>(() => Storage.getProfile());
  const [gutScore, setGutScore] = useState<GutHealthScoreData | null>(() => Storage.getGutScore());
  const [dietLogs, setDietLogs] = useState<DietEntry[]>(() => Storage.getDietLogs());
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>(() => Storage.getSymptoms());
  const [waterLog, setWaterLog] = useState<WaterLog>(() => Storage.getWaterLog());
  const [recommendations, setRecommendations] = useState<RecommendationsData | null>(() => Storage.getRecommendations());
  const [probiotics, setProbiotics] = useState<ProbioticGuidanceData | null>(() => Storage.getProbiotics());
  const [mealPlan, setMealPlan] = useState<MealPlanData | null>(() => Storage.getMealPlan());
  const [groceryList, setGroceryList] = useState<GroceryItem[]>(() => Storage.getGroceryList());
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => Storage.getChatHistory());

  // Loading States
  const [isLoadingScore, setIsLoadingScore] = useState(false);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [isLoadingProbiotics, setIsLoadingProbiotics] = useState(false);
  const [isLoadingMealPlan, setIsLoadingMealPlan] = useState(false);

  // Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Sync state changes to LocalStorage
  useEffect(() => { Storage.saveProfile(profile); }, [profile]);
  useEffect(() => { Storage.saveGutScore(gutScore); }, [gutScore]);
  useEffect(() => { Storage.saveDietLogs(dietLogs); }, [dietLogs]);
  useEffect(() => { Storage.saveSymptoms(symptoms); }, [symptoms]);
  useEffect(() => { Storage.saveWaterLog(waterLog); }, [waterLog]);
  useEffect(() => { Storage.saveRecommendations(recommendations); }, [recommendations]);
  useEffect(() => { Storage.saveProbiotics(probiotics); }, [probiotics]);
  useEffect(() => { Storage.saveMealPlan(mealPlan); }, [mealPlan]);
  useEffect(() => { Storage.saveGroceryList(groceryList); }, [groceryList]);
  useEffect(() => { Storage.saveChatHistory(chatHistory); }, [chatHistory]);

  // Recalculate Gut Score dynamically when logs change
  useEffect(() => {
    const twin = calculateGutDigitalTwin(profile, dietLogs, symptoms, waterLog);
    setGutScore({
      overallScore: twin.overallScore,
      subScores: {
        nutrition: twin.factors[3]?.score || 75,
        hydration: twin.factors[1]?.score || 70,
        fiber: twin.factors[0]?.score || 75,
        lifestyle: twin.factors[4]?.score || 75,
        symptomTrend: twin.factors[6]?.score || 80,
      },
      summary: twin.explanation,
      improvementSuggestions: twin.top3ImprovementAreas,
      disclaimer: twin.disclaimer,
      calculatedAt: new Date().toISOString(),
    });
  }, [dietLogs, symptoms, waterLog, profile]);

  // Email Login Handler: Sets user email & redirects straight to profile page ('my-health')
  const handleLogin = (email: string, name?: string) => {
    const updated: UserHealthProfile = {
      ...profile,
      email: email.trim(),
      fullName: name?.trim() || profile.fullName,
      updatedAt: new Date().toISOString(),
    };
    setProfile(updated);
    Storage.saveProfile(updated);
    setViewMode('my-health');
  };

  // Logout Handler
  const handleLogout = () => {
    setProfile((prev) => ({
      ...prev,
      email: '',
    }));
    setViewMode('login');
  };

  // Profile Save
  const handleSaveProfile = (updatedProfile: UserHealthProfile) => {
    setProfile(updatedProfile);
    Storage.saveProfile(updatedProfile);
  };

  // Diet Handlers
  const handleAddMeal = (entry: Omit<DietEntry, 'id'>) => {
    const fullEntry: DietEntry = {
      ...entry,
      id: 'd-' + Date.now(),
    };
    setDietLogs((prev) => [fullEntry, ...prev]);
  };
  const handleDeleteMeal = (id: string) => {
    setDietLogs((prev) => prev.filter((d) => d.id !== id));
  };

  // Symptom Handlers
  const handleAddSymptom = (entry: SymptomEntry) => {
    setSymptoms((prev) => [entry, ...prev]);
  };
  const handleDeleteSymptom = (id: string) => {
    setSymptoms((prev) => prev.filter((s) => s.id !== id));
  };

  // Water Handlers
  const handleAddWater = (amountMl: number) => {
    setWaterLog((prev) => ({ ...prev, consumedMl: prev.consumedMl + amountMl }));
  };
  const handleUpdateWaterGoal = (goalMl: number) => {
    setWaterLog((prev) => ({ ...prev, goalMl }));
  };
  const handleResetWater = () => {
    setWaterLog((prev) => ({ ...prev, consumedMl: 0 }));
  };

  // Grocery Handlers
  const handleAddGroceryItem = (item: GroceryItem) => {
    setGroceryList((prev) => [item, ...prev]);
  };
  const handleDeleteGroceryItem = (id: string) => {
    setGroceryList((prev) => prev.filter((g) => g.id !== id));
  };
  const handleToggleGroceryPurchased = (id: string) => {
    setGroceryList((prev) =>
      prev.map((g) => (g.id === id ? { ...g, purchased: !g.purchased } : g))
    );
  };
  const handleSyncGroceryFromPlan = (items: GroceryItem[]) => {
    setGroceryList((prev) => [...items, ...prev]);
  };
  const handleClearGrocery = () => {
    setGroceryList([]);
  };

  // API Call: Calculate Gut Score
  const handleCalculateScore = async () => {
    setIsLoadingScore(true);
    try {
      const res = await fetch('/api/gemini/gut-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, dietLogs, symptoms, waterLog }),
      });
      if (!res.ok) throw new Error('API Error');
      const data: GutHealthScoreData = await res.json();
      setGutScore(data);
    } catch (err) {
      console.warn('Backend API error, using intelligent local calculation:', err);
      setGutScore(calculateFallbackGutScore(profile, dietLogs, symptoms, waterLog));
    } finally {
      setIsLoadingScore(false);
    }
  };

  // API Call: Recommendations
  const handleFetchRecommendations = async () => {
    setIsLoadingRecs(true);
    try {
      const res = await fetch('/api/gemini/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, dietLogs, symptoms }),
      });
      if (!res.ok) throw new Error('API Error');
      const data: RecommendationsData = await res.json();
      setRecommendations(data);
    } catch (err) {
      console.warn('Backend API error, using fallback recommendations:', err);
      setRecommendations(generateFallbackRecommendations(profile, dietLogs, symptoms));
    } finally {
      setIsLoadingRecs(false);
    }
  };

  // API Call: Probiotics
  const handleFetchProbiotics = async () => {
    setIsLoadingProbiotics(true);
    try {
      const res = await fetch('/api/gemini/probiotics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, symptoms }),
      });
      if (!res.ok) throw new Error('API Error');
      const data: ProbioticGuidanceData = await res.json();
      setProbiotics(data);
    } catch (err) {
      console.warn('Backend API error, using fallback probiotics:', err);
      setProbiotics(generateFallbackProbiotics(profile));
    } finally {
      setIsLoadingProbiotics(false);
    }
  };

  // API Call: Meal Plan (India-First 🇮🇳)
  const handleGenerateMealPlan = async (
    region = 'Maharashtra',
    budgetINR = 200,
    healthGoal = 'Better Gut Health'
  ) => {
    setIsLoadingMealPlan(true);

    const previousMealNames: string[] = [];
    if (mealPlan?.meals) {
      previousMealNames.push(
        mealPlan.meals.breakfast.food,
        mealPlan.meals.lunch.food,
        mealPlan.meals.snack.food,
        mealPlan.meals.dinner.food
      );
    }

    try {
      const res = await fetch('/api/gemini/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          symptoms,
          region,
          budgetINR,
          goals: healthGoal,
          previousMealNames,
        }),
      });
      if (!res.ok) throw new Error('API Error');
      const data: MealPlanData = await res.json();
      setMealPlan(data);
    } catch (err) {
      console.warn('Backend API error, using local Indian meal generator:', err);
      setMealPlan(
        generatePersonalizedIndianMealPlan(
          profile,
          symptoms,
          region,
          budgetINR,
          healthGoal,
          previousMealNames
        )
      );
    } finally {
      setIsLoadingMealPlan(false);
    }
  };

  // Chat Handler
  const handleSendChatMessage = async (userText: string) => {
    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          chatHistory: newHistory,
          profile,
        }),
      });

      let botText = '';
      if (res.ok) {
        const data = await res.json();
        botText = data.text || data.reply;
      } else {
        botText = generateFallbackChatResponse(userText, profile);
      }

      const botMsg: ChatMessage = {
        id: 'msg-bot-' + Date.now(),
        sender: 'ai',
        text: botText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatHistory([...newHistory, botMsg]);
    } catch (err) {
      const fallbackText = generateFallbackChatResponse(userText, profile);
      const botMsg: ChatMessage = {
        id: 'msg-bot-' + Date.now(),
        sender: 'ai',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatHistory([...newHistory, botMsg]);
    }
  };

  const handleClearChat = () => {
    setChatHistory([
      {
        id: 'msg-init',
        sender: 'ai',
        text: `Hello! I'm NutriPlus AI, your personalized gut-health nutritionist assistant. How can I support your digestive wellness today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation Bar */}
      <Navbar
        currentView={viewMode}
        onNavigate={(mode) => setViewMode(mode)}
        userEmail={profile.email}
        onLogout={handleLogout}
        onOpenReport={() => setIsReportModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'landing' && (
          <LandingPage
            onNavigate={(mode) => setViewMode(mode)}
            userEmail={profile.email}
          />
        )}

        {viewMode === 'login' && (
          <LoginPage
            currentEmail={profile.email || ''}
            onLogin={handleLogin}
            onNavigate={(mode) => setViewMode(mode)}
          />
        )}

        {viewMode === 'dashboard' && (
          <Dashboard
            profile={profile}
            gutScore={gutScore}
            dietLogs={dietLogs}
            symptoms={symptoms}
            waterLog={waterLog}
            onNavigate={(mode) => setViewMode(mode)}
            onRecalculateScore={handleCalculateScore}
            isLoadingScore={isLoadingScore}
            onLogFood={handleAddMeal}
          />
        )}

        {viewMode === 'digital-twin' && (
          <GutDigitalTwin
            profile={profile}
            dietLogs={dietLogs}
            symptoms={symptoms}
            waterLog={waterLog}
            onNavigate={(mode) => setViewMode(mode as any)}
          />
        )}

        {viewMode === 'indian-recs' && (
          <IndianFoodEngine
            profile={profile}
            symptoms={symptoms}
            dietLogs={dietLogs}
            onLogFood={handleAddMeal}
            onNavigate={(mode) => setViewMode(mode as any)}
          />
        )}

        {viewMode === 'my-health' && (
          <MyHealthProfile
            profile={profile}
            onSaveProfile={handleSaveProfile}
            onNavigate={(mode) => setViewMode(mode)}
          />
        )}

        {viewMode === 'diet-log' && (
          <DietLog
            dietLogs={dietLogs}
            waterLog={waterLog}
            onAddMeal={(meal) => handleAddMeal(meal)}
            onDeleteMeal={handleDeleteMeal}
            onAddWater={handleAddWater}
          />
        )}

        {viewMode === 'symptoms' && (
          <SymptomTracker
            symptoms={symptoms}
            onAddSymptom={handleAddSymptom}
            onDeleteSymptom={handleDeleteSymptom}
          />
        )}

        {viewMode === 'gut-score' && (
          <div className="py-4 space-y-6">
            <GutScoreCard
              scoreData={gutScore}
              onRecalculate={handleCalculateScore}
              isLoading={isLoadingScore}
            />
          </div>
        )}

        {viewMode === 'recommendations' && (
          <AIRecommendations
            data={recommendations}
            onRefresh={handleFetchRecommendations}
            isLoading={isLoadingRecs}
          />
        )}

        {viewMode === 'probiotics' && (
          <ProbioticGuidance
            data={probiotics}
            onRefresh={handleFetchProbiotics}
            isLoading={isLoadingProbiotics}
          />
        )}

        {viewMode === 'meal-planner' && (
          <MealPlanner
            mealPlan={mealPlan}
            profile={profile}
            symptoms={symptoms}
            gutScore={gutScore}
            onGenerateNewPlan={(reg, budg, goal) => handleGenerateMealPlan(reg, budg, goal)}
            onSyncGroceryList={handleSyncGroceryFromPlan}
            onLogMealToDiet={handleAddMeal}
            onUpdateMealPlanState={(updated) => setMealPlan(updated)}
            isLoading={isLoadingMealPlan}
          />
        )}

        {viewMode === 'food-scanner' && <FoodScanner profile={profile} onLogFood={handleAddMeal} />}

        {viewMode === 'progress' && (
          <ProgressDashboard
            gutScore={gutScore}
            symptoms={symptoms}
            dietLogs={dietLogs}
            waterLog={waterLog}
          />
        )}

        {viewMode === 'ai-nutritionist' && (
          <NutritionistChat
            chatHistory={chatHistory}
            onSendMessage={handleSendChatMessage}
            onClearHistory={handleClearChat}
            profile={profile}
            symptoms={symptoms}
            dietLogs={dietLogs}
          />
        )}

        {viewMode === 'water' && (
          <WaterTracker
            waterLog={waterLog}
            onAddWater={handleAddWater}
            onUpdateGoal={handleUpdateWaterGoal}
            onResetWater={handleResetWater}
          />
        )}

        {viewMode === 'grocery' && (
          <GroceryList
            groceryList={groceryList}
            onAddItem={handleAddGroceryItem}
            onDeleteItem={handleDeleteGroceryItem}
            onTogglePurchased={handleToggleGroceryPurchased}
            onClearList={handleClearGrocery}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 tracking-tight text-sm">
              NUTRIPLUS <span className="text-emerald-600">AI</span>
            </span>
            <span>— Personalized Gut-Health & Indian Food Engine</span>
          </div>

          <p className="text-[11px] text-slate-400 text-center sm:text-right">
            Disclaimer: Educational wellness application. Does not diagnose or prescribe medical treatments.
          </p>
        </div>
      </footer>

      {/* AI Health Report Modal */}
      <HealthReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        profile={profile}
        gutScore={gutScore}
        dietLogs={dietLogs}
        symptoms={symptoms}
        waterLog={waterLog}
        recommendations={recommendations}
        probiotics={probiotics}
        mealPlan={mealPlan}
      />
    </div>
  );
}
