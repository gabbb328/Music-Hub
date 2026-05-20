import { createClient } from "@supabase/supabase-js";
import { NeuroFractalState, CognitiveMetrics } from "../types/neurofractal";


const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isUrlValid = rawUrl && (rawUrl.startsWith("http://") || rawUrl.startsWith("https://"));

const supabaseUrl = isUrlValid ? rawUrl : "https://placeholder-url.supabase.co";
const supabaseKey = (rawKey && rawKey !== "placeholder-key") ? rawKey : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";

if (!isUrlValid || !rawKey) {
  console.warn("Supabase environment variables are invalid or missing. Falling back to local/placeholder configuration.");
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

// ─── ADMIN COLLAB USERS (Supabase / LocalStorage fallback) ─────────────────────

export interface CollabUser {
  id: string;
  name: string;
  email?: string;
  requestedAt: string;
  status: "pending" | "accepted" | "rejected";
  permissions: {
    canViewStats: boolean;
    canViewToken: boolean;
    canAccessAdmin: boolean;
    canAccessGithub: boolean;
  };
  message?: string;
  credentials?: {
    username?: string;
    password?: string;
  };
}

const LOCAL_KEY = "admin_collab_users";

let supabaseActive = true;

// Helper for checking if Supabase is actually configured and working
export const isSupabaseConfigured = () => {
  const envConfigured = !!import.meta.env.VITE_SUPABASE_URL && 
                         !!import.meta.env.VITE_SUPABASE_ANON_KEY &&
                         import.meta.env.VITE_SUPABASE_URL.startsWith("http");
  return envConfigured && supabaseActive;
};

export const getCollabUsers = async (): Promise<CollabUser[]> => {
  const envConfigured = !!import.meta.env.VITE_SUPABASE_URL && 
                         !!import.meta.env.VITE_SUPABASE_ANON_KEY &&
                         import.meta.env.VITE_SUPABASE_URL.startsWith("http");
                         
  if (envConfigured) {
    try {
      const { data, error } = await supabase.from("admin_collab_users").select("*");
      if (!error && data) {
        supabaseActive = true;
        return data as CollabUser[];
      } else {
        supabaseActive = false;
      }
    } catch (e) {
      supabaseActive = false;
      console.warn("Supabase non ha la tabella admin_collab_users o errore connessione, fallback su localStorage", e);
    }
  }
  // Fallback a localStorage
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
};

export const saveCollabUsers = async (users: CollabUser[]): Promise<void> => {
  // Save to local storage always, as a backup
  localStorage.setItem(LOCAL_KEY, JSON.stringify(users));

  const envConfigured = !!import.meta.env.VITE_SUPABASE_URL && 
                         !!import.meta.env.VITE_SUPABASE_ANON_KEY &&
                         import.meta.env.VITE_SUPABASE_URL.startsWith("http");

  if (envConfigured) {
    try {
      // Upsert all users
      const { error } = await supabase.from("admin_collab_users").upsert(users);
      if (error) {
        supabaseActive = false;
        console.error("Errore salvataggio Supabase:", error);
      } else {
        supabaseActive = true;
      }
    } catch (e) {
      supabaseActive = false;
      console.warn("Errore salvataggio Supabase:", e);
    }
  }
};

export const deleteCollabUser = async (id: string): Promise<void> => {
  const users = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  const next = users.filter((u: any) => u.id !== id);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(next));

  if (isSupabaseConfigured()) {
    try {
      await supabase.from("admin_collab_users").delete().eq("id", id);
    } catch (e) {
      console.warn("Errore eliminazione Supabase:", e);
    }
  }
};

// ─── ADMIN FEEDBACKS (Supabase / LocalStorage fallback) ─────────────────────

export interface AdminFeedback {
  id: string;
  userName: string;
  type: string;
  message: string;
  submittedAt: string;
  read: boolean;
}

const FEEDBACKS_KEY = "admin_feedbacks";

export const getAdminFeedbacks = async (): Promise<AdminFeedback[]> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from("admin_feedbacks").select("*").order("submittedAt", { ascending: false });
      if (!error && data) {
        return data as AdminFeedback[];
      }
    } catch (e) {
      console.warn("Supabase fallback for admin_feedbacks", e);
    }
  }
  try {
    return JSON.parse(localStorage.getItem(FEEDBACKS_KEY) || "[]");
  } catch {
    return [];
  }
};

export const saveAdminFeedbacks = async (feedbacks: AdminFeedback[]): Promise<void> => {
  localStorage.setItem(FEEDBACKS_KEY, JSON.stringify(feedbacks));

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from("admin_feedbacks").upsert(feedbacks);
      if (error) console.error("Errore salvataggio feedbacks Supabase:", error);
    } catch (e) {
      console.warn("Errore salvataggio feedbacks Supabase:", e);
    }
  }
};

export const deleteAdminFeedback = async (id: string): Promise<void> => {
  const feedbacks = JSON.parse(localStorage.getItem(FEEDBACKS_KEY) || "[]");
  const next = feedbacks.filter((f: any) => f.id !== id);
  localStorage.setItem(FEEDBACKS_KEY, JSON.stringify(next));

  if (isSupabaseConfigured()) {
    try {
      await supabase.from("admin_feedbacks").delete().eq("id", id);
    } catch (e) {
      console.warn("Errore eliminazione feedbacks Supabase:", e);
    }
  }
};

export interface SupabaseTableCounts {
  neuro_states: number;
  admin_collab_users: number;
  admin_feedbacks: number;
  active: boolean;
}

export const getSupabaseTableCounts = async (): Promise<SupabaseTableCounts> => {
  if (!isSupabaseConfigured()) {
    return { neuro_states: 0, admin_collab_users: 0, admin_feedbacks: 0, active: false };
  }
  try {
    const [ns, ac, af] = await Promise.all([
      supabase.from("neuro_states").select("*", { count: "exact", head: true }),
      supabase.from("admin_collab_users").select("*", { count: "exact", head: true }),
      supabase.from("admin_feedbacks").select("*", { count: "exact", head: true }),
    ]);
    return {
      neuro_states: ns.count ?? 0,
      admin_collab_users: ac.count ?? 0,
      admin_feedbacks: af.count ?? 0,
      active: true,
    };
  } catch (e) {
    console.error("Errore fetch counts Supabase:", e);
    return { neuro_states: 0, admin_collab_users: 0, admin_feedbacks: 0, active: false };
  }
};

export const getRecentNeuroStates = async (limit: number = 5): Promise<UserNeuroState[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from("neuro_states")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error("Errore recupero recent neuro states:", e);
    return [];
  }
};

export const testSupabaseLatency = async (): Promise<number> => {
  if (!isSupabaseConfigured()) return -1;
  const start = performance.now();
  try {
    await supabase.from("admin_collab_users").select("id").limit(1);
    const end = performance.now();
    return Math.round(end - start);
  } catch (e) {
    console.error("Errore test latenza Supabase:", e);
    return -1;
  }
};

