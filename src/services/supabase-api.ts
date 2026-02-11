import { createClient } from "@supabase/supabase-js";
import { NeuroFractalState, CognitiveMetrics } from "../types/neurofractal";


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types
export interface UserNeuroState {
  id: string;
  user_id: string;
  state: NeuroFractalState;
  cognitive_metrics: CognitiveMetrics;
  timestamp: string;
  session_id: string;
  encrypted: boolean;
}

// API Functions
export const saveNeuroState = async (
  userId: string,
  state: NeuroFractalState,
  metrics: CognitiveMetrics,
  sessionId: string,
  encrypted: boolean = true,
): Promise<UserNeuroState> => {
  const { data, error } = await supabase
    .from("neuro_states")
    .insert({
      user_id: userId,
      state,
      cognitive_metrics: metrics,
      session_id: sessionId,
      encrypted,
      timestamp: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getNeuroStates = async (
  userId: string,
  limit: number = 50,
): Promise<UserNeuroState[]> => {
  const { data, error } = await supabase
    .from("neuro_states")
    .select("*")
    .eq("user_id", userId)
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

export const getNeuroStateById = async (
  stateId: string,
): Promise<UserNeuroState | null> => {
  const { data, error } = await supabase
    .from("neuro_states")
    .select("*")
    .eq("id", stateId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }
  return data;
};

export const updateNeuroState = async (
  stateId: string,
  updates: Partial<Pick<UserNeuroState, "state" | "cognitive_metrics">>,
): Promise<UserNeuroState> => {
  const { data, error } = await supabase
    .from("neuro_states")
    .update({
      ...updates,
      timestamp: new Date().toISOString(),
    })
    .eq("id", stateId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteNeuroState = async (stateId: string): Promise<void> => {
  const { error } = await supabase
    .from("neuro_states")
    .delete()
    .eq("id", stateId);

  if (error) throw error;
};

// Session management
export const getSessionStates = async (
  userId: string,
  sessionId: string,
): Promise<UserNeuroState[]> => {
  const { data, error } = await supabase
    .from("neuro_states")
    .select("*")
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .order("timestamp", { ascending: true });

  if (error) throw error;
  return data || [];
};

// Analytics functions
export const getCognitiveTrends = async (
  userId: string,
  days: number = 30,
): Promise<any[]> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("neuro_states")
    .select("timestamp, cognitive_metrics")
    .eq("user_id", userId)
    .gte("timestamp", startDate.toISOString())
    .order("timestamp", { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getAverageMetrics = async (
  userId: string,
  days: number = 7,
): Promise<CognitiveMetrics> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("neuro_states")
    .select("cognitive_metrics")
    .eq("user_id", userId)
    .gte("timestamp", startDate.toISOString());

  if (error) throw error;

  if (!data || data.length === 0) {
    return {
      coherence: 0,
      complexity: 0,
      adaptability: 0,
      resilience: 0,
      creativity: 0,
      emotional_balance: 0,
    };
  }

  const metrics = data.map((item: any) => item.cognitive_metrics);
  const avgMetrics: CognitiveMetrics = {
    coherence:
      metrics.reduce((sum, m) => sum + m.coherence, 0) / metrics.length,
    complexity:
      metrics.reduce((sum, m) => sum + m.complexity, 0) / metrics.length,
    adaptability:
      metrics.reduce((sum, m) => sum + m.adaptability, 0) / metrics.length,
    resilience:
      metrics.reduce((sum, m) => sum + m.resilience, 0) / metrics.length,
    creativity:
      metrics.reduce((sum, m) => sum + m.creativity, 0) / metrics.length,
    emotional_balance:
      metrics.reduce((sum, m) => sum + m.emotional_balance, 0) / metrics.length,
  };

  return avgMetrics;
};
