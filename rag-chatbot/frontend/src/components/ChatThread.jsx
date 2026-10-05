export default function ChatThread({ messages, loading, onSelectMessageSources }) {
  if (messages.length === 0 && !loading) {
    return (
      <div className="empty-thread">
        <p>Ask a question about one of your uploaded documents.</p>
      </div>
    );
  }

  return (
    <div className="chat-thread">
      {messages.map((m, i) => {
        if (m.role === "user") {
          return (
            <div key={i} className="bubble user-bubble">
              {m.content}
            </div>
          );
        }

        // Assistant message. An answer with zero sources means retrieval
        // found nothing (no docs uploaded, or nothing relevant) -- we show
        // that honestly instead of styling it like a normal confident answer.
        const hasSources = m.sources && m.sources.length > 0;

        return (
          <div key={i} className="assistant-block">
            <div className={`bubble assistant-bubble ${hasSources ? "" : "muted-bubble"}`}>
              {m.content}
            </div>
            {hasSources && (
              <button className="sources-link" onClick={() => onSelectMessageSources(m.sources)}>
                {m.sources.length} source{m.sources.length > 1 ? "s" : ""} &rsaquo;
              </button>
            )}
          </div>
        );
      })}

      {loading && (
        <div className="assistant-block">
          <div className="bubble assistant-bubble thinking-bubble">thinking...</div>
        </div>
      )}
    </div>
  );
}