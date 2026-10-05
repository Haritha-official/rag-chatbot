import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";
import Sidebar from "../components/Sidebar.jsx";
import TopBar from "../components/TopBar.jsx";
import ChatThread from "../components/ChatThread.jsx";
import SourcePanel from "../components/SourcePanel.jsx";

export default function Chat() {
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeSources, setActiveSources] = useState(null);

  // Load the sidebar's data once, when the page first mounts.
  useEffect(() => {
    loadConversations();
    loadDocuments();
  }, []);

  async function loadConversations() {
    try {
      const data = await api.getConversations();
      setConversations(data.conversations);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  }

  async function loadDocuments() {
    try {
      const data = await api.getDocuments();
      setDocuments(data.documents);
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  }

  function handleNewChat() {
    setActiveConversationId(null);
    setMessages([]);
    setActiveSources(null);
  }

  async function handleSelectConversation(id) {
    setActiveConversationId(id);
    setActiveSources(null);
    try {
      const data = await api.getMessages(id);
      setMessages(data.messages);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }

  async function handleAsk(e) {
    e.preventDefault();
    if (!question.trim() || asking) return;

    const userMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setAsking(true);

    try {
      const data = await api.ask(userMessage.content, activeConversationId);

      const assistantMessage = { role: "assistant", content: data.answer, sources: data.sources };
      setMessages((prev) => [...prev, assistantMessage]);
      setActiveSources(data.sources);

      // If this was a brand new chat, we now have a real conversationId --
      // store it, and refresh the sidebar so the new chat shows up there.
      if (!activeConversationId) {
        setActiveConversationId(data.conversationId);
        loadConversations();
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Something went wrong: ${err.message}`, sources: [] },
      ]);
    } finally {
      setAsking(false);
    }
  }

  async function handleUpload(file) {
    setUploading(true);
    try {
      await api.uploadDocument(file);
      await loadDocuments();
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDocument(id) {
    const confirmed = window.confirm("Delete this document? This can't be undone.");
    if (!confirmed) return;

    try {
      await api.deleteDocument(id);
      await loadDocuments();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  return (
    <div className="app-shell">
      <TopBar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        userName={user?.name}
        onLogout={logout}
      />

      <div className="app-body">
        <Sidebar
          open={sidebarOpen}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          documents={documents}
          onUpload={handleUpload}
          onDeleteDocument={handleDeleteDocument}
          uploading={uploading}
        />

        <div className="main-panel">
          <ChatThread messages={messages} loading={asking} onSelectMessageSources={setActiveSources} />

          <form className="ask-bar" onSubmit={handleAsk}>
            <input
              type="text"
              placeholder="Ask about your documents..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={asking}
            />
            <button type="submit" disabled={asking || !question.trim()}>
              Send
            </button>
          </form>
        </div>

        <SourcePanel sources={activeSources} />
      </div>
    </div>
  );
}