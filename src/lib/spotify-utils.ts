/**
 * Groups recently played tracks by their ID and adds a count.
 * Assumes the input items are in reverse chronological order (most recent first).
 */
export const groupRecentTracks = (items: any[]) => {
  if (!items) return [];
  
  const grouped: any[] = [];
  const trackMap = new Map<string, any>();
  
  items.forEach(item => {
    const trackId = item.track?.id;
    if (!trackId) return;

    if (trackMap.has(trackId)) {
      trackMap.get(trackId).count++;
    } else {
      const newItem = { ...item, count: 1 };
      trackMap.set(trackId, newItem);
      grouped.push(newItem);
    }
  });
  
  return grouped;
};
