import { motion } from "framer-motion";
import {
  Radio,
  Mic2,
  BarChart3,
  Headphones,
  Sparkles,
  Heart,
  Clock,
  ListMusic,
  ScanSearch,
  Settings,
  User
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MoreContentProps {
  onSectionChange: (section: string) => void;
  onOpenSettings: () => void;
}

const features = [
  { id: "ai-dj", label: "AI DJ", icon: Sparkles, color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: "radio", label: "Radio", icon: Radio, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "lyrics", label: "Lyrics", icon: Mic2, color: "text-pink-500", bg: "bg-pink-500/10" },
  { id: "recognize", label: "Recognize", icon: ScanSearch, color: "text-orange-500", bg: "bg-orange-500/10" },
  { id: "stats", label: "Statistics", icon: BarChart3, color: "text-green-500", bg: "bg-green-500/10" },
  { id: "devices", label: "Devices", icon: Headphones, color: "text-yellow-500", bg: "bg-yellow-500/10" },
];

const libraryItems = [
  { id: "liked", label: "Liked Songs", icon: Heart, color: "text-red-500", bg: "bg-red-500/10" },
  { id: "recent", label: "Recently Played", icon: Clock, color: "text-gray-400", bg: "bg-gray-400/10" },
  { id: "queue", label: "Queue", icon: ListMusic, color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

export default function MoreContent({ onSectionChange, onOpenSettings }: MoreContentProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          More Features
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          {features.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="glass-surface border-none cursor-pointer hover:bg-secondary/50 transition-colors group"
                onClick={() => onSectionChange(item.id)}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center gap-3 text-center">
                  <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Your Library</h3>
        <div className="grid grid-cols-3 gap-3">
          {libraryItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (features.length + index) * 0.05 }}
            >
              <button
                onClick={() => onSectionChange(item.id)}
                className="w-full flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-secondary/50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                  {item.label.split(' ')[0]}
                </span>
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-muted-foreground">App</h3>
        <Card 
          className="glass-surface border-none cursor-pointer hover:bg-secondary/50 transition-colors"
          onClick={onOpenSettings}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Settings</p>
              <p className="text-xs text-muted-foreground">Theme, account, and more</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
