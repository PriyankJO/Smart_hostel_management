// Tracks every time a student moves into, out of, or between rooms — so a room's
// "Details" view can show a full history of who has ever stayed there, not just
// who's there right now.

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// A single entry captures one room change (move-in, move-out, or a direct shift
// between two rooms). fromRoom/toRoom being empty means "no room" on that side.
export function makeRoomChangeEntry({ studentId, studentName, fromRoom, toRoom, note }) {
  return {
    id: `RH-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: todayStr(),
    studentId,
    studentName,
    fromRoom: fromRoom || "",
    toRoom: toRoom || "",
    note: note || "",
  };
}

// Returns a given room's history, most recent first, with a human-readable label
// per entry: "Moved in", "Vacated", "Shifted in from X", or "Shifted to X".
export function historyForRoom(history, roomNumber) {
  return history
    .filter((h) => h.fromRoom === roomNumber || h.toRoom === roomNumber)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .map((h) => {
      let label;
      if (h.toRoom === roomNumber && !h.fromRoom) label = "Moved in";
      else if (h.toRoom === roomNumber && h.fromRoom) label = `Shifted in from ${h.fromRoom}`;
      else if (h.fromRoom === roomNumber && !h.toRoom) label = "Vacated";
      else label = `Shifted to ${h.toRoom}`;
      return { ...h, label };
    });
}
