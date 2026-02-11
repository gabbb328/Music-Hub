import { motion } from "framer-motion";
import { BarChart3, Clock, TrendingUp, Music, Headphones, Disc3, Calendar } from "lucide-react";
import { useTopTracks, useTopArtists, useRecentlyPlayed } from "@/hooks/useSpotify";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type TimeRange = "short_term" | "medium_term" | "long_term";

const timeRangeLabels: Record<TimeRange, string> = {
  short_term: "Last 4 Weeks",
  medium_term: "Last 6 Months", 
  long_term: "All Time"
};

export default function StatsContent() {
  const [timeRange, setTimeRange] = useState<TimeRange>("medium_term");
  
  const { data: topTracksData, isLoading: loadingTracks } = useTopTracks(timeRange);
  const { data: topArtistsData, isLoading: loadingArtists } = useTopArtists(timeRange);
  const { data: recentData } = useRecentlyPlayed(50);

  const topTracks = topTracksData?.items || [];
  const topArtists = topArtistsData?.items || [];
  const recentTracks = recentData?.items || [];

  // Calculate stats
  const totalTracks = topTracks.length;
  const totalArtists = topArtists.length;
  
  // Calculate total listening time from top tracks
  const totalDurationMs = topTracks.reduce((acc, track) => acc + track.duration_ms, 0);
  const totalHours = Math.floor(totalDurationMs / (1000 * 60 * 60));
  const totalMinutes = Math.floor((totalDurationMs % (1000 * 60 * 60)) / (1000 * 60));

  // Extract genres from top artists
  const genreCounts: Record<string, number> = {};
  topArtists.forEach(artist => {
    artist.genres.forEach(genre => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
  });

  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count], index) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count,
      pct: Math.round((count / topArtists.length) * 100),
      color: [
        "bg-cyan-500",
        "bg-indigo-500", 
        "bg-emerald-500",
        "bg-pink-500",
        "bg-violet-500"
      ][index]
    }));

  // Calculate listening by day of week from recent plays
  const dayListening: Record<string, number> = {
    Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0
  };

  recentTracks.forEach(item => {
    const date = new Date(item.played_at);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = dayNames[date.getDay()];
    dayListening[day] += item.track.duration_ms / (1000 * 60 * 60); // Convert to hours
  });

  const listeningHours = Object.entries(dayListening).map(([day, hours]) => ({
    day,
    hours: Math.round(hours * 10) / 10
  }));

  const maxHours = Math.max(...listeningHours.map(d => d.hours), 1);

  // Calculate top artists with plays (using popularity as proxy)
  const topArtistsWithPlays = topArtists.slice(0, 5).map((artist, index) => {
    const maxPopularity = topArtists[0]?.popularity || 100;
    return {
      name: artist.name,
      plays: artist.popularity,
      pct: Math.round((artist.popularity / maxPopularity) * 100),
      image: artist.images[0]?.url
    };
  });

  const stats = [
    { 
      label: "Listening Time", 
      value: totalHours > 0 ? `${totalHours}h ${totalMinutes}m` : "0h", 
      icon: Clock 
    },
    { 
      label: "Top Tracks", 
      value: totalTracks.toString(), 
      icon: Music 
    },
    { 
      label: "Top Artists", 
      value: totalArtists.toString(), 
      icon: Headphones 
    },
    { 
      label: "Recent Plays", 
      value: recentTracks.length.toString(), 
      icon: Disc3 
    },
  ];

  const isLoading = loadingTracks || loadingArtists;

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <div className="space-y-6">
          <div className="h-8 bg-muted rounded w-48 animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-5">
                  <div className="h-5 bg-muted rounded w-5 mb-3" />
                  <div className="h-8 bg-muted rounded w-16 mb-2" />
                  <div className="h-4 bg-muted rounded w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground mb-4 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          Your Statistics
        </h1>
        
        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-2">
            {(Object.keys(timeRangeLabels) as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {timeRangeLabels[range]}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-surface rounded-xl p-5"
          >
            <stat.icon className="w-5 h-5 text-primary mb-3" />
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-surface rounded-xl p-6"
        >
          <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            Weekly Listening
          </h2>
          <div className="flex items-end justify-between gap-3 h-40">
            {listeningHours.map((d, i) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.hours / maxHours) * 100}%` }}
                  transition={{ delay: 0.5 + i * 0.08, type: "spring", stiffness: 100 }}
                  className="w-full rounded-t-lg bg-gradient-to-t from-primary/60 to-primary min-h-[4px]"
                  title={`${d.hours}h`}
                />
                <span className="text-xs text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top artists */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-surface rounded-xl p-6"
        >
          <h2 className="text-lg font-bold text-foreground mb-6">Top Artists</h2>
          <div className="space-y-4">
            {topArtistsWithPlays.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No artist data available
              </p>
            ) : (
              topArtistsWithPlays.map((artist, i) => (
                <div key={artist.name} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-5 text-right">{i + 1}</span>
                  {artist.image && (
                    <img 
                      src={artist.image} 
                      alt={artist.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground mb-1 truncate">{artist.name}</p>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${artist.pct}%` }}
                        transition={{ delay: 0.6 + i * 0.1, duration: 0.8 }}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{artist.plays}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Top Tracks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-surface rounded-xl p-6"
        >
          <h2 className="text-lg font-bold text-foreground mb-6">Top Tracks</h2>
          <div className="space-y-3">
            {topTracks.slice(0, 5).map((track, i) => (
              <div key={track.id} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-5 text-right">{i + 1}</span>
                <img 
                  src={track.album.images[0]?.url} 
                  alt={track.name}
                  className="w-10 h-10 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{track.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {track.artists.map(a => a.name).join(", ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Genre breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-surface rounded-xl p-6"
        >
          <h2 className="text-lg font-bold text-foreground mb-6">Favorite Genres</h2>
          {topGenres.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No genre data available
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 h-8 rounded-full overflow-hidden mb-4">
                {topGenres.map((g) => (
                  <motion.div
                    key={g.name}
                    initial={{ width: 0 }}
                    animate={{ width: `${g.pct}%` }}
                    transition={{ delay: 0.7, duration: 0.8 }}
                    className={`h-full ${g.color} first:rounded-l-full last:rounded-r-full`}
                    title={`${g.name}: ${g.pct}%`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                {topGenres.map((g) => (
                  <div key={g.name} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${g.color}`} />
                    <span className="text-sm text-muted-foreground">{g.name} ({g.pct}%)</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
