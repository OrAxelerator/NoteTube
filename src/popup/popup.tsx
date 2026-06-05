import { createRoot } from "react-dom/client";
import "./popup.css";

function Popup() {
  const openDashboard = () => {
    const url = chrome.runtime.getURL("src/dashboard/index.html");
    void chrome.tabs.create({ url });
  };

  return (
    <main className="popup">
      <h1>YouTube Notes</h1>
      <button type="button" onClick={openDashboard}>
        Ouvrir les notes
      </button>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Popup />);
