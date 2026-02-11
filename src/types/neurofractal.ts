// NeuroFractal State Types
export interface NeuroFractalState {
  id: string;
  timestamp: string;
  userId: string;
  sessionId: string;

  // Core fractal parameters
  fractalDimension: number;
  entropy: number;
  coherence: number;
  complexity: number;

  // Neural network state
  neuralLayers: NeuralLayer[];
  synapticWeights: number[][];
  activationPatterns: number[][];

  // Cognitive metrics
  cognitiveMetrics: CognitiveMetrics;

  // Emotional state
  emotionalState: EmotionalState;

  // Memory patterns
  shortTermMemory: MemoryPattern[];
  longTermMemory: MemoryPattern[];

  // Adaptation parameters
  adaptationRate: number;
  learningRate: number;
  plasticityThreshold: number;

  // Quantum-inspired properties
  superpositionStates: SuperpositionState[];
  entanglementMatrix: number[][];
  quantumCoherence: number;

  // Biofeedback data
  biofeedbackMetrics: BiofeedbackMetrics;

  // Therapeutic context
  therapeuticContext: TherapeuticContext;
}

export interface NeuralLayer {
  id: string;
  neurons: Neuron[];
  activationFunction: string;
  bias: number[];
  weights: number[][];
}

export interface Neuron {
  id: string;
  activation: number;
  threshold: number;
  refractoryPeriod: number;
  synapticInputs: SynapticInput[];
}

export interface SynapticInput {
  fromNeuronId: string;
  weight: number;
  delay: number;
  plasticity: number;
}

export interface CognitiveMetrics {
  coherence: number; // 0-1, measure of neural synchronization
  complexity: number; // 0-1, measure of information processing capacity
  adaptability: number; // 0-1, ability to adjust to new patterns
  resilience: number; // 0-1, resistance to cognitive stress
  creativity: number; // 0-1, novel pattern generation capacity
  emotional_balance: number; // 0-1, emotional regulation effectiveness
}

export interface EmotionalState {
  valence: number; // -1 to 1, positive/negative affect
  arousal: number; // 0-1, emotional intensity
  dominance: number; // 0-1, sense of control
  emotions: EmotionIntensity[];
}

export interface EmotionIntensity {
  emotion: string;
  intensity: number; // 0-1
}

export interface MemoryPattern {
  id: string;
  pattern: number[];
  strength: number;
  timestamp: string;
  context: string[];
}

export interface SuperpositionState {
  stateId: string;
  probability: number;
  phase: number;
  interference: number;
}

export interface BiofeedbackMetrics {
  heartRate: number;
  heartRateVariability: number;
  skinConductance: number;
  respirationRate: number;
  brainwaves: BrainwaveData;
  muscleTension: number[];
}

export interface BrainwaveData {
  delta: number; // 0.5-4 Hz
  theta: number; // 4-8 Hz
  alpha: number; // 8-12 Hz
  beta: number; // 12-30 Hz
  gamma: number; // 30-100 Hz
}

export interface TherapeuticContext {
  sessionType: string;
  therapeuticGoals: string[];
  currentPhase: string;
  progressMetrics: ProgressMetric[];
  contraindications: string[];
}

export interface ProgressMetric {
  metric: string;
  baseline: number;
  current: number;
  target: number;
  trend: "improving" | "stable" | "declining";
}

// Chat and Interaction Types
export interface EnhancedChatMessage {
  id: string;
  timestamp: string;
  sender: "user" | "ai" | "system";
  content: string;
  neuroState: Partial<NeuroFractalState>;
  emotionalContext: EmotionalContext;
  therapeuticIntent: TherapeuticIntent;
  metadata: MessageMetadata;
}

export interface EmotionalContext {
  detectedEmotions: EmotionIntensity[];
  emotionalTrajectory: EmotionalState[];
  emotionalResonance: number;
}

export interface TherapeuticIntent {
  primaryGoal: string;
  secondaryGoals: string[];
  interventionType: string;
  expectedOutcome: string;
  riskLevel: "low" | "medium" | "high";
}

export interface MessageMetadata {
  processingTime: number;
  confidence: number;
  modelVersion: string;
  safetyFlags: string[];
  neuroFeedback: NeuroFeedback;
}

export interface NeuroFeedback {
  stateChange: Partial<NeuroFractalState>;
  coherenceShift: number;
  emotionalShift: EmotionalState;
  recommendations: string[];
}

// Configuration Types
export interface NeuroFractalConfig {
  fractalParams: FractalParameters;
  neuralConfig: NeuralConfig;
  therapeuticSettings: TherapeuticSettings;
  safetyLimits: SafetyLimits;
  adaptationRules: AdaptationRule[];
}

export interface FractalParameters {
  dimensionRange: [number, number];
  entropyThreshold: number;
  coherenceTarget: number;
  complexityBounds: [number, number];
}

export interface NeuralConfig {
  layerCount: number;
  neuronsPerLayer: number[];
  activationFunctions: string[];
  learningRate: number;
  plasticityRules: PlasticityRule[];
}

export interface TherapeuticSettings {
  sessionDuration: number;
  interventionFrequency: number;
  biofeedbackEnabled: boolean;
  quantumMode: boolean;
  adaptiveMode: boolean;
}

export interface SafetyLimits {
  maxCoherenceShift: number;
  minComplexity: number;
  emotionalBounds: [number, number];
  interventionCooldown: number;
}

export interface AdaptationRule {
  condition: string;
  action: string;
  priority: number;
  cooldown: number;
}

export interface PlasticityRule {
  type: "hebbian" | "spike_timing" | "homeostatic";
  parameters: Record<string, number>;
}

// Database Types (for Supabase integration)
export interface UserNeuroState {
  id: string;
  user_id: string;
  state: NeuroFractalState;
  cognitive_metrics: CognitiveMetrics;
  timestamp: string;
  session_id: string;
  encrypted: boolean;
}

// Analytics Types
export interface CognitiveAnalytics {
  userId: string;
  timeRange: [string, string];
  metrics: CognitiveMetrics;
  trends: MetricTrend[];
  insights: CognitiveInsight[];
  recommendations: TherapeuticRecommendation[];
}

export interface MetricTrend {
  metric: keyof CognitiveMetrics;
  trend: "increasing" | "decreasing" | "stable";
  slope: number;
  confidence: number;
}

export interface CognitiveInsight {
  type: "pattern" | "anomaly" | "milestone";
  description: string;
  severity: "low" | "medium" | "high";
  timestamp: string;
}

export interface TherapeuticRecommendation {
  type: "intervention" | "adjustment" | "monitoring";
  description: string;
  priority: "low" | "medium" | "high";
  rationale: string;
  expectedImpact: number;
}
