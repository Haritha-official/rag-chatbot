import { useRef } from "react";

export default function Sidebar({
  open,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  documents,
  onUpload,
  onDeleteDocument,
  uploading,
}) {
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) onUpload(file);
    e.target.value = ""; // reset, so uploading the same file twice still fires onChange
  }

  if (!open) return null;

  return (
    <div className="sidebar">
      <button onClick={onNewChat} className="new-chat-btn">
        + New chat
      </button>

      <p className="sidebar-label">Recent</p>
      <div className="conversation-list">
        {conversations.length === 0 && <p className="sidebar-empty">No chats yet.</p>}
        {conversations.map((c) => (
          <button
            key={c.id}
            className={`conversation-item ${c.id === activeConversationId ? "active" : ""}`}
            onClick={() => onSelectConversation(c.id)}
          >
            {c.title || "New chat"}
          </button>
        ))}
      </div>

      <div className="documents-section">
        <p className="sidebar-label">Your documents</p>
        <div className="document-list">
          {documents.length === 0 && <p className="sidebar-empty">None uploaded yet.</p>}
          {documents.map((d) => (
            <div key={d.id} className="document-item">
              <span className="document-name" title={d.file_name}>
                {d.file_name}
              </span>
              <button
                className="delete-doc-btn"
                onClick={() => onDeleteDocument(d.id)}
                title="Delete this document"
                aria-label={`Delete ${d.file_name}`}
              >
                &times;
              </button>
            </div>
          ))}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".md,.txt"
          style={{ display: "none" }}
        />
        <button
          className="secondary upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "+ Upload doc"}
        </button>
      </div>
    </div>
  );
}