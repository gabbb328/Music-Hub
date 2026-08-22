import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Search,
  Bot,
  Layers,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Sliders,
  PlayCircle
} from "lucide-react";

import { APP_VERSION } from "@/hooks/version";

interface InteractiveTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSection?: (section: string) => void;
  onOpenAI?: () => void;
}

const TUTORIAL_STEPS = [
  {
    id: "welcome",
    title: `Benvenuto in Music Hub v${APP_VERSION}!`,
    subtitle: "Design Glassmorphic & Interfaccia Fluttuante",
    description:
      "La nuova versione introduce un design interamente in vetro traslucido con sfondi sfocati, colori dinamici ed elementi fluttuanti che si adattano ai tuoi ascolti.",
    icon: Sparkles,
    color: "from-purple-500 to-indigo-600",
    badge: "Nuovo Design Glass",
    sectionTarget: "home",
    targetSelector: null,
  },
  {
    id: "lyra",
    title: "LyraAI: Assistente Chatbot",
    subtitle: "Analisi brani, BPM, mood e chat conversazionale",
    description:
      "Clicca sull'icona Gemini/LyraAI in alto a destra per aprire l'assistente musicale. Puoi chiedergli i BPM del brano in riproduzione, l'atmosfera o 10 consigli giocabili!",
    icon: Bot,
    color: "from-pink-500 to-purple-600",
    badge: "Intelligenza Artificiale",
    sectionTarget: "home",
    targetSelector: "#lyra-ai-btn",
  },
  {
    id: "profile",
    title: "Profilo Spotify",
    subtitle: "Avatar e impostazioni profilo",
    description:
      "Trovi il pulsante col tuo avatar di Spotify in alto a destra per controllare il tuo account e riavviare questo tutorial.",
    icon: UserCheck,
    color: "from-amber-500 to-orange-600",
    badge: "Profilo",
    sectionTarget: "home",
    targetSelector: "#profile-btn",
  },
  {
    id: "tools",
    title: "Strumenti & App",
    subtitle: "Tutti gli strumenti raggruppati in un'unica sezione",
    description:
      "Testi sincronizzati, Neural Space Mixer 3D, Equalizzatore, Radio Hub, Statistiche e Music Games sono organizzati nella sezione 'Estensioni & Strumenti'.",
    icon: Layers,
    color: "from-emerald-500 to-teal-600",
    badge: "Strumenti & Giochi",
    sectionTarget: "extensions",
    targetSelector: "[data-section='extensions']",
  },
];

export default function InteractiveTutorial({
  isOpen,
  onClose,
  onNavigateToSection,
  onOpenAI,
}: InteractiveTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const sel = TUTORIAL_STEPS[currentStep]?.targetSelector;
    if (sel) {
      const el = document.querySelector(sel);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  }, [currentStep, isOpen]);

  if (!isOpen) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const Icon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;

  const dismissPermanently = () => {
    localStorage.setItem("hasSeenTutorial_v3_done", "true");
    localStorage.setItem(`hasSeenTutorial_v${APP_VERSION}`, "true");
    onClose();
  };

  const handleNext = () => {
    if (isLast) {
      dismissPermanently();
    } else {
      const nextStepIndex = currentStep + 1;
      setCurrentStep(nextStepIndex);
      const targetSec = TUTORIAL_STEPS[nextStepIndex]?.sectionTarget;
      if (targetSec && onNavigateToSection) {
        onNavigateToSection(targetSec);
      }
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      const prevStepIndex = currentStep - 1;
      setCurrentStep(prevStepIndex);
      const targetSec = TUTORIAL_STEPS[prevStepIndex]?.sectionTarget;
      if (targetSec && onNavigateToSection) {
        onNavigateToSection(targetSec);
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-hidden">
        {/* Backdrop con sfocatura */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismissPermanently}
          className="absolute inset-0 bg-black/75 backdrop-blur-xl"
        />

        {/* Quadratino Spotlight Evidenziatore sul bottone/funzione target */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
            }}
            className="fixed z-[201] rounded-2xl border-2 border-primary shadow-[0_0_35px_rgba(168,85,247,0.9)] ring-4 ring-primary/40 pointer-events-none animate-pulse"
          >
            <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center shadow-lg">
              !
            </div>
          </motion.div>
        )}

        {/* Effetto sfocatura al Neon di sfondo */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-[201]">
          <motion.div
            key={`glow-${currentStep}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.6, scale: 1.1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-gradient-to-tr ${step.color} blur-[120px] opacity-40`}
          />
        </div>

        {/* Tutorial Card Dialog */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-[202] w-full max-w-lg rounded-3xl bg-background/90 border border-white/20 p-6 md:p-8 shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col justify-between min-h-[420px]"
        >
          <div>
            {/* Top Bar: Step Indicator & Close */}
            <div className="flex items-center justify-between mb-6">
              <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {step.badge}
              </span>

              <button
                onClick={dismissPermanently}
                className="p-2 rounded-full bg-secondary/40 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Chiudi e non mostrare più"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Icon & Title */}
            <div className="flex items-start gap-4 mb-5">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-xl shrink-0 ring-4 ring-white/10`}
              >
                <Icon className="w-7 h-7" />
              </motion.div>

              <div>
                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="text-xs md:text-sm text-primary font-medium mt-0.5">
                  {step.subtitle}
                </p>
              </div>
            </div>

            {/* Step Description */}
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">
              {step.description}
            </p>

            {/* Action Preview Button se al passo LyraAI */}
            {step.id === "lyra" && onOpenAI && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onOpenAI();
                  dismissPermanently();
                }}
                className="w-full py-2.5 px-4 mb-4 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Bot className="w-4 h-4" />
                Apri subito la chat con LyraAI
              </motion.button>
            )}
          </div>

          {/* Footer Controls & Step Dots */}
          <div className="pt-4 border-t border-border/50 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {TUTORIAL_STEPS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentStep(idx);
                      const targetSec = TUTORIAL_STEPS[idx]?.sectionTarget;
                      if (targetSec && onNavigateToSection) {
                        onNavigateToSection(targetSec);
                      }
                    }}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      idx === currentStep
                        ? "w-8 bg-primary shadow-[0_0_10px_hsl(var(--primary))]"
                        : "w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                    title={`Vai al passo ${idx + 1}`}
                  />
                ))}
              </div>

              <span className="text-xs text-muted-foreground font-mono">
                Passo {currentStep + 1} di {TUTORIAL_STEPS.length}
              </span>
            </div>

            {/* Buttons: Precedente & Avanti */}
            <div className="flex items-center gap-3">
              {!isFirst ? (
                <button
                  onClick={handlePrev}
                  className="flex-1 py-3 px-4 rounded-2xl bg-secondary/60 hover:bg-secondary text-foreground font-semibold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Precedente
                </button>
              ) : (
                <button
                  onClick={dismissPermanently}
                  className="px-4 py-3 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                  Chiudi e non mostrare più
                </button>
              )}

              <button
                onClick={handleNext}
                className={`flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r ${step.color} text-white font-semibold text-xs md:text-sm shadow-xl flex items-center justify-center gap-1.5 transition-all hover:opacity-95 active:scale-[0.98]`}
              >
                {isLast ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Ho capito! Inizia ora
                  </>
                ) : (
                  <>
                    Avanti
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
