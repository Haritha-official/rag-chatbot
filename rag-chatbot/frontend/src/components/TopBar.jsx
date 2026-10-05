export default function TopBar({ sidebarOpen, onToggleSidebar, userName, onLogout }) {
  const initial = userName ? userName.charAt(0).toUpperCase() : "?";

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button
          className="secondary sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          &#9776;
        </button>
        <h2 className="app-name">Haritha's Index</h2>
      </div>

      <div className="topbar-right">
        <div className="avatar" title={userName} onClick={onLogout} role="button" tabIndex={0}>
          {initial}
        </div>
      </div>
    </div>
  );
}