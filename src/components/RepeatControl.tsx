import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Repeat, Repeat1, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RepeatControlProps {
  repeat: "off" | "all" | "one";
  onToggle: () => void;
  onSetCustomRepeat?: (count: number) => void;
}

export default function RepeatControl({ repeat, onToggle, onSetCustomRepeat }: RepeatControlProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const handleClick = () => {
    if (repeat === "off") {
      onToggle();
    } else if (repeat === "all") {
      onToggle();
    } else if (repeat === "one") {
      setShowMenu(true);
    }
  };

  const handleSetRepeat = (count: number) => {
    onSetCustomRepeat?.(count);
    setShowMenu(false);
  };

  const handleCustomRepeat = () => {
    const num = parseInt(customValue);
    if (num >= 2 && num <= 99) {
      handleSetRepeat(num);
      setCustomValue("");
    }
  };

  return (
    <div className="relative">
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        className={`p-1.5 rounded-full transition-colors ${
          repeat !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
        title={repeat === "one" ? "Repeat One - Click for options" : repeat === "all" ? "Repeat All" : "Repeat Off"}
      >
        {repeat === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
      </motion.button>

      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute bottom-full right-0 mb-2 bg-popover border border-border rounded-lg shadow-lg p-3 z-50 min-w-[200px]"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">Repeat Count</p>
                <button
                  onClick={() => setShowMenu(false)}
                  className="p-1 hover:bg-secondary rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1 mb-2">
                {[2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <Button
                    key={num}
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetRepeat(num)}
                    className="h-8"
                  >
                    {num}×
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  type="number"
                  min="2"
                  max="99"
                  placeholder="Custom"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  className="h-8"
                />
                <Button
                  size="sm"
                  onClick={handleCustomRepeat}
                  disabled={!customValue || parseInt(customValue) < 2}
                  className="h-8"
                >
                  OK
                </Button>
              </div>

              <button
                onClick={() => {
                  onToggle();
                  setShowMenu(false);
                }}
                className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground text-left"
              >
                Back to normal repeat
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
