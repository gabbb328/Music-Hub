import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Brain, Send, User, Bot } from 'lucide-react'
import { EnhancedChatMessage, NeuroFractalState, CognitiveMetrics } from '@/types/neurofractal'
import { AITrainingPipeline } from '@/services/ai-training'
import { AdaptationEngine } from '@/services/adaptation-engine'

interface EnhancedChatProps {
  userId: string
  initialNeuroState?: Partial<NeuroFractalState>
}

const getDefaultNeuroState = (): NeuroFractalState => ({
  id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'default-id',
  timestamp: new Date().toISOString(),
  userId: 'user',
  sessionId: 'session-1',
  fractalDimension: 1.5,
  entropy: 0.5,
  coherence: 0.7,
  complexity: 0.6,
  neuralLayers: [],
  synapticWeights: [],
  activationPatterns: [],
  cognitiveMetrics: { coherence: 0.7, complexity: 0.6, adaptability: 0.8, resilience: 0.75, creativity: 0.65, emotional_balance: 0.7 },
  emotionalState: { valence: 0.5, arousal: 0.5, dominance: 0.5, emotions: [] },
  shortTermMemory: [],
  longTermMemory: [],
  adaptationRate: 0.1,
  learningRate: 0.01,
  plasticityThreshold: 0.5,
  superpositionStates: [],
  entanglementMatrix: [],
  quantumCoherence: 0.8,
  biofeedbackMetrics: { heartRate: 70, heartRateVariability: 50, skinConductance: 0.5, respirationRate: 16, brainwaves: { delta: 0.2, theta: 0.2, alpha: 0.3, beta: 0.2, gamma: 0.1 }, muscleTension: [0.1, 0.2] },
  therapeuticContext: { sessionType: 'interactive', therapeuticGoals: [], currentPhase: 'initial', progressMetrics: [], contraindications: [] }
})

export const EnhancedChat: React.FC<EnhancedChatProps> = ({
  userId,
  initialNeuroState
}) => {
  const [messages, setMessages] = useState<EnhancedChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentNeuroState, setCurrentNeuroState] = useState<NeuroFractalState>(
    initialNeuroState ? { ...getDefaultNeuroState(), ...initialNeuroState } : getDefaultNeuroState()
  )
  const [cognitiveMetrics, setCognitiveMetrics] = useState<CognitiveMetrics>({
    coherence: 0.7,
    complexity: 0.6,
    adaptability: 0.8,
    resilience: 0.75,
    creativity: 0.65,
    emotional_balance: 0.7
  })

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const aiTraining = useRef(new AITrainingPipeline())
  const adaptationEngine = useRef(new AdaptationEngine({
    fractalParams: { dimensionRange: [1.2, 1.8], entropyThreshold: 0.5, coherenceTarget: 0.8, complexityBounds: [0.3, 0.9] },
    neuralConfig: { layerCount: 3, neuronsPerLayer: [64, 32, 16], activationFunctions: ['relu', 'tanh', 'sigmoid'], learningRate: 0.01, plasticityRules: [] },
    therapeuticSettings: { sessionDuration: 3600, interventionFrequency: 300, biofeedbackEnabled: true, quantumMode: false, adaptiveMode: true },
    safetyLimits: { maxCoherenceShift: 0.3, minComplexity: 0.2, emotionalBounds: [-0.8, 0.8], interventionCooldown: 60 },
    adaptationRules: []
  }))

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: EnhancedChatMessage = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'msg-1',
      timestamp: new Date().toISOString(),
      sender: 'system',
      content: "Welcome to your NeuroFractal therapy session. I'm here to support your cognitive and emotional well-being. How are you feeling today?",
      neuroState: currentNeuroState,
      emotionalContext: {
        detectedEmotions: [],
        emotionalTrajectory: [],
        emotionalResonance: 0.5
      },
      therapeuticIntent: {
        primaryGoal: 'assessment',
        secondaryGoals: ['build_rapport'],
        interventionType: 'exploratory',
        expectedOutcome: 'emotional_awareness',
        riskLevel: 'low'
      },
      metadata: {
        processingTime: 0,
        confidence: 1.0,
        modelVersion: '1.0.0',
        safetyFlags: [],
        neuroFeedback: {
          stateChange: {},
          coherenceShift: 0,
          emotionalShift: { valence: 0, arousal: 0, dominance: 0, emotions: [] },
          recommendations: []
        }
      }
    }
    setMessages([welcomeMessage])
  }, [])

  const handleSend = () => {
    if (!inputMessage.trim()) return

    const userMessage: EnhancedChatMessage = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'user-msg-' + Date.now(),
      timestamp: new Date().toISOString(),
      sender: 'user',
      content: inputMessage.trim(),
      neuroState: currentNeuroState,
      emotionalContext: {
        detectedEmotions: [],
        emotionalTrajectory: [],
        emotionalResonance: 0.5
      },
      therapeuticIntent: {
        primaryGoal: 'expression',
        secondaryGoals: [],
        interventionType: 'supportive',
        expectedOutcome: 'validation',
        riskLevel: 'low'
      },
      metadata: {
        processingTime: 0,
        confidence: 1.0,
        modelVersion: '1.0.0',
        safetyFlags: [],
        neuroFeedback: {
          stateChange: {},
          coherenceShift: 0,
          emotionalShift: { valence: 0, arousal: 0, dominance: 0, emotions: [] },
          recommendations: []
        }
      }
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage('')
  }

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <CardTitle className="text-lg">NeuroFractal Chat</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${
                  msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`p-3 rounded-lg max-w-[80%] text-sm ${
                    msg.sender === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex space-x-2 pt-2 border-t">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button onClick={handleSend} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default EnhancedChat
