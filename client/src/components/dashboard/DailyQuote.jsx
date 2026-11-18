
import { useState } from "react";
import { Heart, Sparkles } from "lucide-react";
import quotes from "../../data/quotes";

const FAVORITES_KEY = "projectpulse:favoriteQuotes:v1";

function getDailyQuote() {
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  const dateNumber = dateKey
    .split("-")
    .reduce((total, part) => total + Number(part), 0);

  return quotes[dateNumber % quotes.length];
}

function getFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export default function DailyQuote() {
  const quote = getDailyQuote();
  const [favorites, setFavorites] = useState(getFavorites);

  const isFavorite = favorites.includes(quote.id);

  function toggleFavorite() {
    const updated = isFavorite
      ? favorites.filter((id) => id !== quote.id)
      : [...favorites, quote.id];

    setFavorites(updated);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  }

  return (
    <section className="daily-quote-card">
      <div className="daily-quote-top">
        <span className="daily-quote-label">
          <Sparkles size={16} />
          DAILY INSPIRATION
        </span>

        <button
          type="button"
          className={`daily-quote-favorite ${isFavorite ? "is-favorite" : ""}`}
          onClick={toggleFavorite}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart size={19} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      <blockquote className="daily-quote-text">
        {quote.text}
      </blockquote>

      <div className="daily-quote-footer">
        <span>- {quote.author}</span>
        <span className="daily-quote-category">{quote.category}</span>
      </div>
    </section>
  );
}
