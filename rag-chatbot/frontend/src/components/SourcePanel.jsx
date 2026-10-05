export default function SourcePanel({ sources }) {
  if (!sources || sources.length === 0) {
    return (
      <div className="source-panel">
        <p className="sidebar-label">Retrieved from</p>
        <p className="sidebar-empty">Ask a question to see which documents it came from.</p>
      </div>
    );
  }

  // Sort best match first.
  const sorted = [...sources].sort((a, b) => b.score - a.score);
  const bestScore = sorted[0].score;
  const lowConfidence = bestScore < 50;

  return (
    <div className="source-panel">
      <p className="sidebar-label">Retrieved from</p>

      {lowConfidence && (
        <p className="low-confidence-note">
          Low match confidence -- this answer may not be well grounded in your documents.
        </p>
      )}

      {sorted.map((s, i) => (
        <div key={i} className="source-card">
          <p className="source-card-name">{s.document_name}</p>
          <div className="score-bar-track">
            <div
              className="score-bar-fill"
              style={{ width: `${Math.max(s.score, 2)}%` }}
            />
          </div>
          <p className="source-card-score">{s.score}% match</p>
        </div>
      ))}
    </div>
  );
}