import { useEffect, useState } from "react";
import { Flame, Trophy } from "lucide-react";

const STORAGE_KEY = "projectpulse:activityStreak:v1";

function getToday() {
  return new Date().toLocaleDateString("en-CA");
}

function getYesterday() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toLocaleDateString("en-CA");
}

function loadStreak() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
      current: 0,
      longest: 0,
      lastActive: "",
    };
  } catch {
    return { current: 0, longest: 0, lastActive: "" };
  }
}

function getInitialStreak() {
  const saved = loadStreak();
  const today = getToday();

  if (saved.lastActive === today) {
    return { streak: saved, shouldPersist: false };
  }

  const current =
    saved.lastActive === getYesterday() ? saved.current + 1 : 1;
  const streak = {
    ...saved,
    current,
    longest: Math.max(saved.longest, current),
    lastActive: today,
  };

  return { streak, shouldPersist: true };
}

export default function ActivityStreak() {
  const [initialStreak] = useState(getInitialStreak);
  const { streak } = initialStreak;

  useEffect(() => {
    if (!initialStreak.shouldPersist) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(streak));
  }, [initialStreak, streak]);

  return (
    <section className="activity-streak-card">
      <div>
        <span className="activity-streak-label">
          <Flame size={17} /> DAILY ACTIVITY
        </span>
        <h2>{streak.current} Day Streak</h2>
        <p>Keep showing up every day!</p>
      </div>

      <div className="activity-streak-record">
        <Trophy size={20} />
        <strong>{streak.longest}</strong>
        <span>Longest streak</span>
      </div>
    </section>
  );
}