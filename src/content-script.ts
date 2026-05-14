import { createRoot } from "react-dom/client";
import { createElement } from "react";
import Sidebar from "./Sidebar";

console.log("JobFit AI content script loaded");

const isJobPage = window.location.href.includes("/jobs/");

if (isJobPage) {
  injectUI();
}

function injectUI() {
  // Floating кнопка
  const button = document.createElement("button");
  button.id = "jobfit-trigger";
  button.innerHTML = "✦";
  button.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #7c3aed;
    color: white;
    font-size: 20px;
    border: none;
    cursor: pointer;
    z-index: 999999;
    box-shadow: 0 4px 20px rgba(124, 58, 237, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s, background 0.2s;
  `;

  button.addEventListener("mouseenter", () => {
    button.style.transform = "scale(1.1)";
  });
  button.addEventListener("mouseleave", () => {
    button.style.transform = "scale(1)";
  });

  // Shadow DOM контейнер
  const container = document.createElement("div");
  container.id = "jobfit-container";
  document.body.appendChild(container);

  const shadowRoot = container.attachShadow({ mode: "open" });
  const mountPoint = document.createElement("div");
  shadowRoot.appendChild(mountPoint);

  document.body.appendChild(button);

  const root = createRoot(mountPoint);
  let isOpen = false;

  function render(open: boolean) {
    root.render(
      createElement(Sidebar, {
        isOpen: open,
        shadowRoot,
        onClose: () => {
          isOpen = false;
          button.innerHTML = "✦";
          render(false);
        },
      }),
    );
  }

  button.addEventListener("click", () => {
    isOpen = !isOpen;
    button.innerHTML = isOpen ? "✕" : "✦";
    render(isOpen);
  });

  render(false);
}

chrome.runtime.onMessage.addListener(
  (
    message: { type: string },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void,
  ) => {
    if (message.type === "GET_JOB_DATA") {
      const fullText = document.body.innerText.slice(0, 6000);
      const url = window.location.href;
      sendResponse({ fullText, url });
    }

    if (message.type === "TOGGLE_SIDEBAR") {
      // Симулируем клик на кнопку — она уже умеет открывать/закрывать
      const button = document.getElementById(
        "jobfit-trigger",
      ) as HTMLButtonElement;
      button?.click();
      sendResponse({ ok: true });
    }

    return true;
  },
);
