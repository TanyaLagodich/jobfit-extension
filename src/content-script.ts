console.log("JobFit AI content script loaded");

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_JOB_DATA") {
    const jobData = parseJobData();
    sendResponse(jobData);
  }
  return true;
});

function parseJobData() {
  const jobSection =
    document.querySelector(".jobs-description") ||
    document.querySelector(".job-view-layout") ||
    document.querySelector("main");

  const text = jobSection ? jobSection.innerText : document.body.innerText;

  const fullText = text.slice(0, 6000);
  const url = window.location.href;

  return { fullText, url };
}
