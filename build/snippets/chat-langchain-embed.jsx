"use client";
import { useEffect, useRef, useState } from "react";

export const ChatLangChainEmbed = ({
  theme,
  height = 600,
  className,
  apiUrl,
  assistantId,
  onReady
}) => {
// src/ChatLangChainEmbed.tsx
function isLocalhost() {
  if (typeof window === "undefined") return false;
  const { hostname } = window.location;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::]";
}
function detectPageTheme() {
  if (typeof document === "undefined") return "light";
  const el = document.documentElement;
  if (el.classList.contains("dark")) return "dark";
  if (el.getAttribute("data-theme") === "dark") return "dark";
  if (el.style.colorScheme === "dark") return "dark";
  return "light";
}
var CACHE_KEY = "__lcChatLangChainIframeCache";
var iframeCache = globalThis[CACHE_KEY] ?? (() => {
  const m = /* @__PURE__ */ new Map();
  globalThis[CACHE_KEY] = m;
  return m;
})();
var EMBED_CSS = `
[data-lc-chat-embed] .lc-chat-spinner {
  border: 2px solid #1A2740;
  border-top-color: #7FC8FF;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: lc-chat-spin 0.8s linear infinite;
}
@keyframes lc-chat-spin {
  to { transform: rotate(360deg); }
}
`;
var LOCAL_URL = "http://localhost:4100";
var PROD_URL = "https://playground-git-main-langchain.vercel.app/react";

  const slotRef = useRef(null);
  const [ready, setReady] = useState(false);
  const useLocal = isLocalhost();
  const baseUrl = useLocal ? LOCAL_URL : PROD_URL;
  const queryParts = [];
  if (apiUrl) queryParts.push(`apiUrl=${encodeURIComponent(apiUrl)}`);
  if (assistantId) queryParts.push(`assistantId=${encodeURIComponent(assistantId)}`);
  const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const iframeSrc = `${baseUrl}/${query}#/chat-langchain`;
  const cacheKey = iframeSrc;
  const [pageTheme, setPageTheme] = useState(detectPageTheme);
  useEffect(() => {
    setPageTheme(detectPageTheme());
    const observer = new MutationObserver(() => setPageTheme(detectPageTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"]
    });
    return () => observer.disconnect();
  }, []);
  const effectiveTheme = theme ?? pageTheme;
  useEffect(() => {
    if (document.getElementById("lc-chat-embed-css")) return;
    const style = document.createElement("style");
    style.id = "lc-chat-embed-css";
    style.textContent = EMBED_CSS;
    document.head.appendChild(style);
  }, []);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const themeRef = useRef(effectiveTheme);
  themeRef.current = effectiveTheme;
  useEffect(() => {
    let cached = iframeCache.get(cacheKey);
    if (cached?.hideTimer) {
      clearTimeout(cached.hideTimer);
      cached.hideTimer = void 0;
    }
    if (!cached) {
      const iframe2 = document.createElement("iframe");
      iframe2.src = iframeSrc;
      iframe2.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");
      iframe2.setAttribute("allow", "clipboard-write");
      iframe2.title = "Chat LangChain";
      iframe2.setAttribute("data-cache-key", cacheKey);
      Object.assign(iframe2.style, {
        position: "fixed",
        border: "none",
        visibility: "hidden",
        pointerEvents: "auto",
        zIndex: "1",
        borderRadius: "0 0 12px 12px"
      });
      document.body.appendChild(iframe2);
      cached = { iframe: iframe2, ready: false };
      iframeCache.set(cacheKey, cached);
    }
    const { iframe } = cached;
    const onMessage = (e) => {
      if (e.data?.type === "CHAT_LC_READY") {
        cached.ready = true;
        setReady(true);
        iframe.style.visibility = "visible";
        iframe.contentWindow?.postMessage(
          { type: "CHAT_LC_SET_THEME", theme: themeRef.current },
          "*"
        );
        onReadyRef.current?.();
      }
    };
    window.addEventListener("message", onMessage);
    if (cached.ready) {
      setReady(true);
      iframe.style.visibility = "visible";
      iframe.contentWindow?.postMessage(
        { type: "CHAT_LC_SET_THEME", theme: themeRef.current },
        "*"
      );
    }
    function syncPosition() {
      const slot = slotRef.current;
      if (!slot) return;
      const rect = slot.getBoundingClientRect();
      const { style } = iframe;
      style.top = `${rect.top}px`;
      style.left = `${rect.left}px`;
      style.width = `${rect.width}px`;
      style.setProperty("height", `${rect.height}px`, "important");
    }
    syncPosition();
    const ro = new ResizeObserver(syncPosition);
    if (slotRef.current) ro.observe(slotRef.current);
    document.addEventListener("scroll", syncPosition, { passive: true, capture: true });
    window.addEventListener("resize", syncPosition, { passive: true });
    let frameCount = 0;
    let rafId = 0;
    function initialSync() {
      syncPosition();
      if (++frameCount < 5) rafId = requestAnimationFrame(initialSync);
    }
    rafId = requestAnimationFrame(initialSync);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      document.removeEventListener("scroll", syncPosition, { capture: true });
      window.removeEventListener("resize", syncPosition);
      window.removeEventListener("message", onMessage);
      cached.hideTimer = setTimeout(() => {
        iframe.style.visibility = "hidden";
      }, 200);
    };
  }, [cacheKey, iframeSrc]);
  useEffect(() => {
    const cached = iframeCache.get(cacheKey);
    if (!cached?.ready) return;
    cached.iframe.contentWindow?.postMessage(
      { type: "CHAT_LC_SET_THEME", theme: effectiveTheme },
      "*"
    );
  }, [effectiveTheme, cacheKey]);
  const heightStyle = typeof height === "number" ? `${height}px` : height;
  useEffect(() => {
    slotRef.current?.style.setProperty("height", heightStyle, "important");
  }, [heightStyle]);
  return <div data-lc-chat-embed className={className ?? ""}>
      <div className="overflow-hidden" style={{ borderRadius: 12 }}>
        <div ref={slotRef} className="relative w-full" style={{ height: heightStyle }}>
          {!ready && <div
    className="absolute inset-0 flex items-center justify-center"
    style={{ background: "#09090b" }}
  >
              <div className="lc-chat-spinner" />
            </div>}
        </div>
      </div>
    </div>;

};
