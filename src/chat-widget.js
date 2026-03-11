(function initChatWidget() {
  if (typeof window === "undefined" || window.__lcChatWidgetInitialized) {
    return;
  }

  window.__lcChatWidgetInitialized = true;

  var MOBILE_BREAKPOINT = 768;
  var ROOT_OPEN_CLASS = "lc-chat-widget-open";
  var LOCAL_EMBED_BASE_URL = "http://localhost:4100";
  var PROD_EMBED_BASE_URL = "https://playground-git-main-langchain.vercel.app/react";
  var CHAT_APP_URL = "https://chat.langchain.com/";
  var PANEL_TRANSITION = "300ms cubic-bezier(0.22, 1, 0.36, 1)";
  var panelReady = false;
  var panelOpen = false;
  var iframe = null;
  var fallbackTimer = 0;
  var themeObserver = null;
  var appRoot = null;

  var style = document.createElement("style");
  style.id = "lc-chat-widget-style";
  style.textContent = [
    ":root {",
    "  --lc-chat-panel-width: 420px;",
    "  --lc-chat-widget-bg-light: #161f34;",
    "  --lc-chat-widget-bg-dark: #006ddd;",
    "  --lc-chat-widget-surface-light: #ffffff;",
    "  --lc-chat-widget-surface-dark: #030710;",
    "  --lc-chat-widget-border-light: rgba(22, 31, 52, 0.12);",
    "  --lc-chat-widget-border-dark: rgba(127, 200, 255, 0.18);",
    "  --lc-chat-widget-shadow-light: 0 20px 60px rgba(3, 7, 16, 0.18);",
    "  --lc-chat-widget-shadow-dark: 0 20px 60px rgba(0, 0, 0, 0.45);",
    "}",
    "#lc-chat-widget-button {",
    "  position: fixed;",
    "  right: 24px;",
    "  bottom: 24px;",
    "  z-index: 9999;",
    "  width: 64px;",
    "  height: 64px;",
    "  border: 0;",
    "  border-radius: 999px;",
    "  display: inline-flex;",
    "  align-items: center;",
    "  justify-content: center;",
    "  color: #ffffff;",
    "  cursor: pointer;",
    "  transition: transform 180ms ease, opacity 180ms ease, box-shadow 180ms ease;",
    "  box-shadow: var(--lc-chat-widget-shadow-light);",
    "  background: var(--lc-chat-widget-bg-light);",
    "}",
    "#lc-chat-widget-button:hover {",
    "  transform: scale(1.04);",
    "}",
    "#lc-chat-widget-button:focus-visible,",
    "#lc-chat-widget-close:focus-visible,",
    "#lc-chat-widget-open-link:focus-visible {",
    "  outline: 2px solid #7fc8ff;",
    "  outline-offset: 3px;",
    "}",
    "#lc-chat-widget-button svg,",
    "#lc-chat-widget-close svg,",
    "#lc-chat-widget-open-link svg {",
    "  width: 28px;",
    "  height: 28px;",
    "}",
    "html." + ROOT_OPEN_CLASS + " #lc-chat-widget-button {",
    "  opacity: 0;",
    "  pointer-events: none;",
    "  transform: translateY(8px) scale(0.94);",
    "}",
    "#lc-chat-widget-panel {",
    "  position: fixed;",
    "  top: 0;",
    "  right: 0;",
    "  z-index: 9998;",
    "  width: var(--lc-chat-panel-width);",
    "  height: 100vh;",
    "  display: flex;",
    "  flex-direction: column;",
    "  transform: translateX(100%);",
    "  transition: transform " + PANEL_TRANSITION + ";",
    "  background: var(--lc-chat-widget-surface-light);",
    "  border-left: 1px solid var(--lc-chat-widget-border-light);",
    "  box-shadow: var(--lc-chat-widget-shadow-light);",
    "}",
    "html." + ROOT_OPEN_CLASS + " #lc-chat-widget-panel {",
    "  transform: translateX(0);",
    "}",
    "#lc-chat-widget-panel[data-theme='dark'] {",
    "  background: var(--lc-chat-widget-surface-dark);",
    "  border-left-color: var(--lc-chat-widget-border-dark);",
    "  box-shadow: var(--lc-chat-widget-shadow-dark);",
    "}",
    "#lc-chat-widget-header {",
    "  display: flex;",
    "  align-items: center;",
    "  justify-content: space-between;",
    "  gap: 12px;",
    "  padding: 16px 18px;",
    "  border-bottom: 1px solid var(--lc-chat-widget-border-light);",
    "}",
    "#lc-chat-widget-panel[data-theme='dark'] #lc-chat-widget-header {",
    "  border-bottom-color: var(--lc-chat-widget-border-dark);",
    "}",
    "#lc-chat-widget-title {",
    "  margin: 0;",
    "  font: 600 16px/1.2 Inter, sans-serif;",
    "  color: #030710;",
    "}",
    "#lc-chat-widget-panel[data-theme='dark'] #lc-chat-widget-title {",
    "  color: #ffffff;",
    "}",
    "#lc-chat-widget-actions {",
    "  display: flex;",
    "  align-items: center;",
    "  gap: 8px;",
    "}",
    "#lc-chat-widget-open-link,",
    "#lc-chat-widget-close {",
    "  width: 36px;",
    "  height: 36px;",
    "  border: 0;",
    "  border-radius: 999px;",
    "  display: inline-flex;",
    "  align-items: center;",
    "  justify-content: center;",
    "  color: #4b5563;",
    "  background: transparent;",
    "  text-decoration: none;",
    "  cursor: pointer;",
    "}",
    "#lc-chat-widget-panel[data-theme='dark'] :is(#lc-chat-widget-open-link, #lc-chat-widget-close) {",
    "  color: #d1d5db;",
    "}",
    "#lc-chat-widget-body {",
    "  position: relative;",
    "  flex: 1 1 auto;",
    "  min-height: 0;",
    "}",
    "#lc-chat-widget-iframe {",
    "  width: 100%;",
    "  height: 100%;",
    "  border: 0;",
    "  opacity: 0;",
    "  transition: opacity 200ms ease;",
    "  background: #ffffff;",
    "}",
    "#lc-chat-widget-panel[data-theme='dark'] #lc-chat-widget-iframe {",
    "  background: #030710;",
    "}",
    "#lc-chat-widget-panel[data-ready='true'] #lc-chat-widget-iframe {",
    "  opacity: 1;",
    "}",
    "#lc-chat-widget-loading {",
    "  position: absolute;",
    "  inset: 0;",
    "  display: flex;",
    "  align-items: center;",
    "  justify-content: center;",
    "  background: rgba(255, 255, 255, 0.92);",
    "}",
    "#lc-chat-widget-panel[data-theme='dark'] #lc-chat-widget-loading {",
    "  background: rgba(3, 7, 16, 0.94);",
    "}",
    "#lc-chat-widget-panel[data-ready='true'] #lc-chat-widget-loading {",
    "  display: none;",
    "}",
    "#lc-chat-widget-spinner {",
    "  width: 28px;",
    "  height: 28px;",
    "  border: 3px solid rgba(22, 31, 52, 0.14);",
    "  border-top-color: #7fc8ff;",
    "  border-radius: 999px;",
    "  animation: lc-chat-widget-spin 0.8s linear infinite;",
    "}",
    "#lc-chat-widget-panel[data-theme='dark'] #lc-chat-widget-spinner {",
    "  border-color: rgba(255, 255, 255, 0.14);",
    "  border-top-color: #7fc8ff;",
    "}",
    "@keyframes lc-chat-widget-spin {",
    "  to { transform: rotate(360deg); }",
    "}",
    "@media (max-width: 768px) {",
    "  :root { --lc-chat-panel-width: 100vw; }",
    "  #lc-chat-widget-panel { width: 100vw; }",
    "}",
  ].join("\n");
  document.head.appendChild(style);

  var button = document.createElement("button");
  button.id = "lc-chat-widget-button";
  button.type = "button";
  button.setAttribute("aria-label", "Open Chat LangChain");
  button.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M7 18.5c-2.761 0-5-2.015-5-4.5s2.239-4.5 5-4.5h.5C8.507 5.852 11.952 3 16 3c4.971 0 9 4.03 9 9s-4.029 9-9 9c-1.411 0-2.746-.325-3.935-.903L8 21l1.194-2.984A6.87 6.87 0 0 1 7 18.5Z" fill="currentColor" transform="scale(0.8) translate(-2.2,-1.5)"/>' +
    "</svg>";
  document.body.appendChild(button);

  var panel = document.createElement("aside");
  panel.id = "lc-chat-widget-panel";
  panel.setAttribute("aria-label", "Chat LangChain");
  panel.setAttribute("data-ready", "false");
  panel.setAttribute("data-theme", detectPageTheme());
  panel.innerHTML =
    '<div id="lc-chat-widget-header">' +
    '  <h2 id="lc-chat-widget-title">Chat LangChain</h2>' +
    '  <div id="lc-chat-widget-actions">' +
    '    <a id="lc-chat-widget-open-link" href="' + CHAT_APP_URL + '" target="_blank" rel="noreferrer" aria-label="Open Chat LangChain in a new tab">' +
    '      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '        <path d="M14 5h5v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
    '        <path d="M10 14 19 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
    '        <path d="M19 14v4a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
    "      </svg>" +
    "    </a>" +
    '    <button id="lc-chat-widget-close" type="button" aria-label="Close Chat LangChain">' +
    '      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '        <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
    "      </svg>" +
    "    </button>" +
    "  </div>" +
    "</div>" +
    '<div id="lc-chat-widget-body">' +
    '  <div id="lc-chat-widget-loading" aria-hidden="true"><div id="lc-chat-widget-spinner"></div></div>' +
    "</div>";
  document.body.appendChild(panel);

  var panelBody = document.getElementById("lc-chat-widget-body");
  var closeButton = document.getElementById("lc-chat-widget-close");

  function isLocalhost() {
    var hostname = window.location.hostname;
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]"
    );
  }

  function getEmbedSrc() {
    var baseUrl = isLocalhost() ? LOCAL_EMBED_BASE_URL : PROD_EMBED_BASE_URL;
    return baseUrl + "/#/chat-langchain";
  }

  function detectPageTheme() {
    var el = document.documentElement;
    if (el.classList.contains("dark")) {
      return "dark";
    }
    if (el.getAttribute("data-theme") === "dark") {
      return "dark";
    }
    if (el.style.colorScheme === "dark") {
      return "dark";
    }
    return "light";
  }

  function syncTheme() {
    var theme = detectPageTheme();
    button.style.background =
      theme === "dark"
        ? "var(--lc-chat-widget-bg-dark)"
        : "var(--lc-chat-widget-bg-light)";
    button.style.boxShadow =
      theme === "dark"
        ? "var(--lc-chat-widget-shadow-dark)"
        : "var(--lc-chat-widget-shadow-light)";
    panel.setAttribute("data-theme", theme);

    if (iframe && panelReady && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        { type: "CHAT_LC_SET_THEME", theme: theme },
        "*",
      );
    }
  }

  function getPanelWidth() {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      return 0;
    }

    return Math.round(Math.max(360, Math.min(window.innerWidth * 0.3, 480)));
  }

  function ensureAppRoot() {
    if (appRoot && document.body.contains(appRoot)) {
      return appRoot;
    }

    appRoot =
      document.querySelector("body > .antialiased") ||
      document.querySelector("body > div.antialiased") ||
      document.querySelector("body > div:not(#lc-chat-widget-panel):not(#lc-chat-widget-button)");

    return appRoot;
  }

  function updateLayout() {
    var root = ensureAppRoot();
    document.documentElement.style.setProperty(
      "--lc-chat-panel-width",
      window.innerWidth <= MOBILE_BREAKPOINT
        ? "100vw"
        : getPanelWidth() + "px",
    );

    // Shift the Mintlify app root instead of overlaying it on desktop so the
    // docs remain readable beside the panel.
    if (root) {
      root.style.transition = "margin-right " + PANEL_TRANSITION;
      root.style.marginRight =
        panelOpen && window.innerWidth > MOBILE_BREAKPOINT
          ? getPanelWidth() + "px"
          : "";
    }
  }

  function ensureIframe() {
    if (iframe) {
      return;
    }

    iframe = document.createElement("iframe");
    iframe.id = "lc-chat-widget-iframe";
    iframe.src = getEmbedSrc();
    iframe.title = "Chat LangChain";
    iframe.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-forms",
    );
    iframe.setAttribute("allow", "clipboard-write");
    iframe.addEventListener("load", function handleLoad() {
      if (panelReady) {
        return;
      }

      fallbackTimer = window.setTimeout(function showIframeFallback() {
        setPanelReady();
      }, 1500);
    });
    panelBody.appendChild(iframe);
  }

  function setPanelReady() {
    if (panelReady) {
      return;
    }

    panelReady = true;
    panel.setAttribute("data-ready", "true");

    if (fallbackTimer) {
      window.clearTimeout(fallbackTimer);
      fallbackTimer = 0;
    }

    syncTheme();
  }

  function openPanel() {
    ensureIframe();
    panelOpen = true;
    document.documentElement.classList.add(ROOT_OPEN_CLASS);
    updateLayout();
  }

  function closePanel() {
    panelOpen = false;
    document.documentElement.classList.remove(ROOT_OPEN_CLASS);
    updateLayout();
  }

  button.addEventListener("click", openPanel);
  closeButton.addEventListener("click", closePanel);

  window.addEventListener("keydown", function handleEscape(event) {
    if (event.key === "Escape" && panelOpen) {
      closePanel();
    }
  });

  window.addEventListener("resize", updateLayout, { passive: true });

  window.addEventListener("message", function handleReady(event) {
    if (event.data && event.data.type === "CHAT_LC_READY") {
      setPanelReady();
    }
  });

  themeObserver = new MutationObserver(syncTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme", "style"],
  });

  syncTheme();
  updateLayout();
})();
