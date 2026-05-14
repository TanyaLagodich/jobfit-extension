import { useEffect, useState } from "react";

function App() {
  const [isLinkedIn, setIsLinkedIn] = useState(false);

  // Проверяем при открытии popup — на LinkedIn ли мы сейчас
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url ?? "";
      setIsLinkedIn(url.includes("linkedin.com/jobs"));
    });
  }, []);

  async function openSidebar() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    // Отправляем сообщение content script — открой sidebar
    await chrome.tabs.sendMessage(tab.id!, { type: "TOGGLE_SIDEBAR" });
    // Закрываем popup
    window.close();
  }

  return (
    <div className="w-[300px] bg-[#1a1a2e] text-white font-sans">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="font-semibold text-sm tracking-wide">
          AI Job Match
        </span>
      </div>

      <div className="px-4 py-6 text-center">
        {isLinkedIn ? (
          <>
            <p className="text-white/40 text-sm mb-4">Job posting detected</p>
            <button
              onClick={openSidebar}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors text-sm font-medium"
            >
              Open Analysis
            </button>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
                  stroke="white"
                  strokeOpacity="0.4"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
                  stroke="white"
                  strokeOpacity="0.4"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="text-white/40 text-sm">
              Open a LinkedIn job posting to analyze it
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
