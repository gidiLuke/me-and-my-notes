(() => {
  const input = document.getElementById("terminal-input");
  const suggestions = document.getElementById("terminal-suggestions");
  const screen = document.getElementById("terminal-screen");
  const historyView = document.getElementById("terminal-history");
  const inputBlock = document.getElementById("terminal-input-block");
  const promptPath = document.getElementById("prompt-path");
  const content = document.getElementById("content");
  const panel = content?.querySelector(".panel");
  const form = document.getElementById("terminal-form");
  const commandList = document.querySelector(".command-list");
  const page = document.querySelector(".page");
  const header = document.querySelector(".site-header");
  const modeToggle = document.getElementById("nav-mode-toggle");
  const menuToggle = document.getElementById("mobile-nav-toggle");
  if (!input || !suggestions || !screen || !historyView || !panel || !promptPath || !inputBlock) {
    return;
  }

  const setHeaderHeight = () => {
    if (!header) return;
    const height = header.getBoundingClientRect().height || 0;
    document.documentElement.style.setProperty("--header-height", `${height}px`);
  };

  setHeaderHeight();

  const isMobile = window.matchMedia("(max-width: 1149px)").matches;
  if (isMobile) {
    document.body.classList.add("is-mobile", "nav-mode-classic");
  }

  const applyMode = (mode, persist = true) => {
    const nextMode = mode === "command" ? "command" : "classic";
    document.body.classList.toggle("nav-mode-classic", nextMode === "classic");
    document.body.classList.toggle("nav-mode-command", nextMode === "command");
    if (modeToggle) {
      modeToggle.querySelectorAll("[data-mode]").forEach((btn) => {
        btn.setAttribute("aria-pressed", btn.dataset.mode === nextMode ? "true" : "false");
      });
    }
    if (persist) {
      localStorage.setItem("nav-mode", nextMode);
    }
    input.disabled = nextMode !== "command";
    input.setAttribute("aria-disabled", nextMode !== "command" ? "true" : "false");
  };

  const storedMode = localStorage.getItem("nav-mode");
  applyMode(storedMode || "classic", false);

  if (modeToggle) {
    modeToggle.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-mode]");
      if (!btn) return;
      applyMode(btn.dataset.mode);
    });
  }

  if (isMobile) {
    applyMode("classic", false);
    const setMenuHidden = (hidden, persist = true) => {
      document.body.classList.toggle("nav-menu-hidden", hidden);
      if (menuToggle) {
        menuToggle.setAttribute("aria-expanded", hidden ? "false" : "true");
        menuToggle.textContent = hidden ? "Show Menu ▼" : "Hide Menu ▲";
      }
      if (persist) {
        sessionStorage.setItem("nav-menu-hidden", hidden ? "1" : "0");
      }
    };
    const storedMenuHidden = sessionStorage.getItem("nav-menu-hidden");
    setMenuHidden(storedMenuHidden === "1", false);
    menuToggle?.addEventListener("click", () => {
      setMenuHidden(!document.body.classList.contains("nav-menu-hidden"));
    });
    return;
  }

  const disableEleventyReload = () => {
    const reloadClient = Array.from(document.scripts).some((script) =>
      script.src?.includes("/.11ty/reload-client.js")
    );
    if (!reloadClient) return;
    const originalReload = window.location.reload.bind(window.location);
    window.location.reload = () => {
      // Prevent dev-server live reload from clobbering the SPA view.
      if (window.__allowHardReload) {
        originalReload();
      }
    };
  };

  disableEleventyReload();

  const explorerRows = Array.from(document.querySelectorAll(".command-list .tree-item"));
  const commandRows = Array.from(document.querySelectorAll("#command-data li"));
  const sourceRows = commandRows.length > 0 ? commandRows : explorerRows;
  const commands = sourceRows
    .map((row) => {
      const link = row.querySelector("a");
      const text = row.dataset.command || row.querySelector(".command")?.textContent?.trim();
      const label = row.dataset.label || link?.textContent?.trim() || text;
      const href = row.dataset.href || link?.getAttribute("href");
      const url = row.dataset.url || link?.getAttribute("href") || href;
      if (!text || !href) return null;
      return {
        text,
        label,
        href,
        url
      };
    })
    .filter(Boolean);
  const extraCommands = [
    { text: "ls", label: "ls" },
    { text: "pwd", label: "pwd" },
    { text: "whoami", label: "whoami" },
    { text: "help", label: "help" }
  ];
  const suggestionCommands = [...commands, ...extraCommands];

  const history = [];
  let historyIndex = -1;
  let activeIndex = -1;

  const normalize = (value) => value.toLowerCase().trim();
  const normalizePath = (value) => {
    const cleaned = value.trim().replace(/\/+$/g, "");
    return cleaned === "" ? "/" : cleaned;
  };
  const splitPath = (value) => normalizePath(value).split("/").filter(Boolean);
  const storageKey = "terminal-session";
  const maxTranscript = 40;
  const maxHistoryLines = 40;
  const allowHistoryScroll = true;
  let dynamicMaxLines = maxHistoryLines;
  const pageCache = new Map();
  const pathPrefix = normalizePath(document.body?.dataset?.pathPrefix || "/");
  const stripPrefix = (path) => {
    const normalized = normalizePath(path);
    if (!pathPrefix || pathPrefix === "/") return normalized;
    if (normalized.startsWith(pathPrefix)) {
      const stripped = normalized.slice(pathPrefix.length);
      return normalizePath(stripped || "/");
    }
    return normalized;
  };

  let currentPath = stripPrefix(window.location.pathname);

  const loadSession = () => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  };

  const saveSession = (session) => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(session));
    } catch (err) {
      // ignore storage failures (private mode, disabled storage)
    }
  };

  const session = loadSession() || {
    history: [],
    transcript: []
  };
  if (!session.fallbackPath) {
    session.fallbackPath = normalizePath(window.location.pathname);
    saveSession(session);
  }

  const scrollScreen = () => {
    const target = allowHistoryScroll ? historyView : screen;
    const lastLine = historyView.lastElementChild;
    if (lastLine) {
      lastLine.scrollIntoView({ block: "end" });
      return;
    }
    target.scrollTop = target.scrollHeight;
  };

  const scrollToLatest = () => {
    requestAnimationFrame(() => {
      scrollScreen();
    });
  };

  const updateHistoryMetrics = () => {
    if (allowHistoryScroll) {
      historyView.style.maxHeight = "";
      return;
    }
    const line = historyView.querySelector(".terminal-line");
    const lineHeight = line ? line.getBoundingClientRect().height : 22;
    const screenGap = parseFloat(window.getComputedStyle(screen).gap) || 0;
    const available = screen.clientHeight - inputBlock.offsetHeight - screenGap;
    if (available > 0) {
      historyView.style.maxHeight = `${available}px`;
      dynamicMaxLines = Math.max(3, Math.floor(available / lineHeight));
    }
  };

  const trimHistoryView = () => {
    if (allowHistoryScroll) return;
    while (historyView.children.length > dynamicMaxLines) {
      historyView.removeChild(historyView.firstElementChild);
    }
  };

  const setTerminalMetrics = () => {
    if (!page || !header) return;
    const pageStyle = window.getComputedStyle(page);
    const paddingTop = parseFloat(pageStyle.paddingTop) || 0;
    const paddingBottom = parseFloat(pageStyle.paddingBottom) || 0;
    const headerHeight = header.getBoundingClientRect().height || 0;
    const headerStyle = window.getComputedStyle(header);
    const headerOffset = headerStyle.position === "fixed" ? 0 : headerHeight;
    const offsetTop = paddingTop + headerOffset;
    const maxHeight = Math.max(
      240,
      window.innerHeight - offsetTop - paddingBottom
    );

    document.documentElement.style.setProperty("--terminal-offset-top", `${offsetTop}px`);
    document.documentElement.style.setProperty("--terminal-max-height", `${maxHeight}px`);
  };

  const renderInputLine = (value, path = currentPath) => {
    const line = document.createElement("div");
    line.className = "terminal-line";

    const pathSpan = document.createElement("span");
    pathSpan.className = "prompt-path";
    pathSpan.textContent = path;

    const prompt = document.createElement("span");
    prompt.className = "prompt";
    prompt.textContent = "$";

    const text = document.createElement("span");
    text.textContent = ` ${value}`;

    line.append(pathSpan, document.createTextNode(" "), prompt, text);
    historyView.appendChild(line);
    updateHistoryMetrics();
    trimHistoryView();
    scrollScreen();
  };

  const renderOutputLine = (value, type = "output") => {
    const line = document.createElement("div");
    line.className = `terminal-line terminal-line--${type}`;
    line.textContent = value;
    historyView.appendChild(line);
    updateHistoryMetrics();
    trimHistoryView();
    scrollScreen();
  };

  const appendInputLine = (value) => {
    renderInputLine(value, currentPath);
    session.transcript.push({ type: "input", text: value, path: currentPath });
    if (session.transcript.length > maxTranscript) {
      session.transcript.shift();
    }
    saveSession(session);
  };

  const appendOutputLine = (value, type = "output") => {
    renderOutputLine(value, type);
    session.transcript.push({ type, text: value });
    if (session.transcript.length > maxTranscript) {
      session.transcript.shift();
    }
    saveSession(session);
  };

  const setPanelLoading = (loading) => {
    if (loading) {
      panel.dataset.minHeight = panel.offsetHeight.toString();
      panel.style.minHeight = `${panel.dataset.minHeight}px`;
      panel.classList.add("is-loading");
      return;
    }

    panel.classList.remove("is-loading");
    panel.style.minHeight = "";
    delete panel.dataset.minHeight;
  };

  const updateMeta = (nextDoc) => {
    const nextTitle = nextDoc.querySelector("title");
    if (nextTitle) document.title = nextTitle.textContent || document.title;

    const nextDescription = nextDoc.querySelector('meta[name="description"]');
    const currentDescription = document.querySelector('meta[name="description"]');
    if (nextDescription && currentDescription) {
      currentDescription.setAttribute(
        "content",
        nextDescription.getAttribute("content") || ""
      );
    }
  };

  const updatePanel = (nextDoc) => {
    const nextPanel = nextDoc.querySelector(".panel");
    if (!nextPanel) return false;
    panel.innerHTML = nextPanel.innerHTML;
    return true;
  };

  const setActiveCommand = (path) => {
    const target = normalizePath(path);
    currentPath = target;
    promptPath.textContent = currentPath;
    explorerRows.forEach((row) => {
      const href = row.dataset.href || row.querySelector("a")?.getAttribute("href");
      if (!href) return;
      const normalizedHref = normalizePath(href);
      const isRoot = normalizedHref === "/";
      const isExact = normalizedHref === target;
      const isParent = !isRoot && target.startsWith(`${normalizedHref}/`);
      row.classList.toggle("is-active", isExact);
      row.classList.toggle("is-parent", isParent);
      const link = row.querySelector("a");
      if (!link) return;
      if (isExact) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const fetchPage = async (href) => {
    const targetUrl = new URL(href, window.location.origin);
    const cacheKey = targetUrl.pathname + targetUrl.search + targetUrl.hash;

    if (pageCache.has(cacheKey)) {
      return pageCache.get(cacheKey);
    }

    const response = await fetch(targetUrl.pathname + targetUrl.search, {
      headers: { "X-Requested-With": "terminal" }
    });
    if (!response.ok) throw new Error("failed");

    const html = await response.text();
    pageCache.set(cacheKey, html);
    return html;
  };

  const loadPage = async (href, { push = true } = {}) => {
    const targetUrl = new URL(href, window.location.origin);

    if (targetUrl.origin !== window.location.origin) {
      window.location.href = href;
      return;
    }

    try {
      setPanelLoading(true);
      const html = await fetchPage(targetUrl.href);
      const nextDoc = new DOMParser().parseFromString(html, "text/html");

      if (!updatePanel(nextDoc)) throw new Error("missing panel");
      updateMeta(nextDoc);

      if (push) {
        history.pushState({ href: targetUrl.href }, "", targetUrl.href);
      }
      setActiveCommand(stripPrefix(targetUrl.pathname));

      if (targetUrl.hash) {
        const targetId = targetUrl.hash.slice(1);
        const targetEl = document.getElementById(targetId);
        if (targetEl) targetEl.scrollIntoView({ block: "start" });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
      setPanelLoading(false);
      scrollToLatest();
    } catch (err) {
      setPanelLoading(false);
      if (navigator.onLine === false) {
        appendOutputLine("navigation failed (offline?). staying on current page.", "error");
        return;
      }
      window.location.href = href;
    }
  };

  const renderSuggestions = (items) => {
    suggestions.innerHTML = "";
    activeIndex = -1;

    items.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "suggestion";
      div.setAttribute("role", "option");
      div.textContent = item.text;
      div.addEventListener("click", () => {
        executeCommand(item.text, item);
      });
      div.addEventListener("mousemove", () => {
        setActive(index);
      });
      suggestions.appendChild(div);
    });
  };

  const setActive = (index) => {
    const items = Array.from(suggestions.children);
    items.forEach((item, idx) => {
      item.classList.toggle("active", idx === index);
    });
    activeIndex = index;
  };

  const getMatches = (value) => {
    const needle = normalize(value);
    if (!needle) return suggestionCommands;

    if (needle.startsWith("cd ")) {
      const target = normalize(needle.replace(/^cd\s+/, ""));
      if (!target) return suggestionCommands;
      return commands.filter((command) => {
        const label = normalize(command.label);
        const cmd = normalize(command.text.replace(/^cd\s+/, ""));
        const href = normalize(command.href?.replace(/^\/+|\/+$/g, ""));
        return (
          label.startsWith(target) ||
          cmd.startsWith(target) ||
          href.startsWith(target)
        );
      });
    }

    return suggestionCommands.filter((command) => {
      return (
        normalize(command.text).startsWith(needle) ||
        normalize(command.label).startsWith(needle) ||
        normalize(command.text).includes(needle)
      );
    });
  };

  const resolveCommand = (value) => {
    const needle = normalize(value);
    if (!needle) return null;

    const byText =
      commands.find((command) => normalize(command.text) === needle) ||
      commands.find((command) => normalize(command.label) === needle);
    if (byText) return byText;

    const pathNeedle = normalizePath(needle.startsWith("/") ? needle : `/${needle}`);
    return commands.find((command) => normalizePath(command.href) === pathNeedle);
  };

  const applyInput = (value) => {
    input.value = value;
    input.setSelectionRange(value.length, value.length);
    renderSuggestions(getMatches(value));
  };

  const listSubdirectories = (path) => {
    const parentSegments = splitPath(path);
    const results = [];
    const seen = new Set();

    commands.forEach((command) => {
      const segments = splitPath(command.href);
      if (segments.length !== parentSegments.length + 1) return;
      const matchesParent = parentSegments.every((segment, idx) => segments[idx] === segment);
      if (!matchesParent) return;
      const name = segments[segments.length - 1];
      if (seen.has(name)) return;
      seen.add(name);
      results.push(name);
    });

    return results;
  };

  const listCommands = () => {
    const children = listSubdirectories(currentPath);
    if (children.length === 0) return;
    appendOutputLine(children.join("  "));
  };

  const describeLine = (label, value) => {
    if (value === undefined || value === null || value === "") return null;
    return `${label}: ${value}`;
  };

  const listWhoAmI = () => {
    appendOutputLine("lukasheidegger");
  };

  const listAllCommands = () => {
    const navList = commands.map((item) => item.text).join(" | ");
    const extraList = extraCommands.map((item) => item.text).join(" | ");
    appendOutputLine(`nav: ${navList || "(none)"}`);
    appendOutputLine(`extra: ${extraList}`);
    appendOutputLine("usage: cd <path> (supports relative, .., ~)");
  };

  const resolveByCd = (value) => {
    const normalized = normalize(value);
    if (!normalized.startsWith("cd ")) return null;
    let target = normalize(normalized.replace(/^cd\s+/, ""));
    if (!target) return null;
    if (target === "~") {
      return commands.find((command) => normalizePath(command.href) === "/");
    }

    const base = currentPath === "" ? "/" : currentPath;
    const isAbsolute = target.startsWith("/");
    const rawPath = isAbsolute ? target : `${base}/${target}`;
    const normalizedPath = rawPath
      .replace(/\/+/g, "/")
      .split("/")
      .reduce((acc, part) => {
        if (part === "" || part === ".") return acc;
        if (part === "..") {
          if (acc.length > 0) acc.pop();
          return acc;
        }
        acc.push(part);
        return acc;
      }, [])
      .join("/");
    const finalPath = normalizePath(`/${normalizedPath}`);

    target = target.replace(/^\/+/, "");
    target = target.replace(/\/+$/g, "");

    if (isAbsolute) {
      return (
        commands.find((command) => normalize(command.label) === target) ||
        commands.find((command) => normalize(command.text.replace(/^cd\s+/, "")) === target) ||
        commands.find((command) => normalize(command.href?.replace(/^\/+|\/+$/g, "")) === target) ||
        commands.find((command) => normalizePath(command.href) === finalPath)
      );
    }

    return commands.find((command) => normalizePath(command.href) === finalPath);
  };

  const executeCommand = (rawValue, resolved) => {
    const value = rawValue.trim();
    if (!value) {
      appendInputLine("");
      input.value = "";
      return;
    }

    const normalized = normalize(value);
    const command = resolved || resolveCommand(value) || resolveByCd(value);
    appendInputLine(value);

    if (normalized === "help") {
      listAllCommands();
      input.value = "";
      return;
    }

    if (normalized === "ls") {
      listCommands();
      input.value = "";
      return;
    }

    if (normalized === "pwd") {
      appendOutputLine(currentPath);
      input.value = "";
      return;
    }

    if (normalized === "whoami") {
      listWhoAmI();
      input.value = "";
      return;
    }

    if (command) {
      history.unshift(value);
      session.history.unshift(value);
      if (session.history.length > 20) session.history.length = 20;
      saveSession(session);
      historyIndex = -1;
      input.value = "";
      renderSuggestions(suggestionCommands);
      setTimeout(() => {
        loadPage(command.url || command.href, { push: true });
      }, 200);
      return;
    }

    const allCommandTexts = [
      ...commands.map((item) => item.text),
      ...extraCommands.map((item) => item.text)
    ];
    appendOutputLine(
      `command not found. try: ${allCommandTexts.join(", ")}`,
      "error"
    );
    input.value = "";
    input.classList.add("error");
    setTimeout(() => input.classList.remove("error"), 300);
  };

  const hydrateSession = () => {
    if (session.transcript.length === 0) return;
    historyView.innerHTML = "";
    session.transcript.forEach((entry) => {
      if (entry.type === "input") {
        renderInputLine(entry.text, entry.path || session.fallbackPath || "/");
      } else {
        renderOutputLine(entry.text, entry.type);
      }
    });
    updateHistoryMetrics();
    trimHistoryView();
  };

  if (session.history.length > 0) {
    history.push(...session.history);
  }

  hydrateSession();
  renderSuggestions(suggestionCommands);
  setActiveCommand(currentPath);
  setTerminalMetrics();
  updateHistoryMetrics();

  const focusInput = () => {
    if (document.activeElement !== input) {
      input.focus({ preventScroll: true });
    }
  };

  input.addEventListener("input", () => {
    historyIndex = -1;
    renderSuggestions(getMatches(input.value));
  });

  const handleArrowNavigation = (event) => {
    const items = Array.from(suggestions.children);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (items.length > 0) {
        const nextIndex = activeIndex + 1 >= items.length ? 0 : activeIndex + 1;
        setActive(nextIndex);
        return true;
      }

      if (input.value.trim() === "" && history.length > 0) {
        historyIndex = Math.max(historyIndex - 1, -1);
        applyInput(historyIndex === -1 ? "" : history[historyIndex]);
        return true;
      }
      return true;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (items.length > 0) {
        const nextIndex = activeIndex - 1 < 0 ? items.length - 1 : activeIndex - 1;
        setActive(nextIndex);
        return true;
      }

      if (input.value.trim() === "" && history.length > 0) {
        historyIndex = Math.min(historyIndex + 1, history.length - 1);
        applyInput(history[historyIndex]);
        return true;
      }
      return true;
    }

    return false;
  };

  input.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      const match = getMatches(input.value)[0];
      if (match) applyInput(match.text);
      return;
    }

    if (handleArrowNavigation(event)) {
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const active = getMatches(input.value)[activeIndex];
      if (active) {
        executeCommand(active.text, active);
      } else {
        executeCommand(input.value, null);
      }
      return;
    }

    if (event.key === "Escape") {
      applyInput("");
      renderSuggestions(suggestionCommands);
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      return;
    }

    if (event.key === "PageUp" || event.key === "PageDown") {
      return;
    }
  });

  input.addEventListener("focus", () => {
    renderSuggestions(getMatches(input.value));
  });

  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented) return;
    if (input.disabled) return;
    if (event.key === "/" && document.activeElement !== input) {
      event.preventDefault();
      focusInput();
      return;
    }

    if ((event.key === "ArrowUp" || event.key === "ArrowDown") && document.activeElement !== input) {
      focusInput();
      handleArrowNavigation(event);
      return;
    }

    const isTypingKey =
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey;

    if (isTypingKey && document.activeElement !== input) {
      focusInput();
    }
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    executeCommand(input.value);
  });

  commandList?.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;
    const row = link.closest(".tree-item");
    const href = row?.dataset.href || link.getAttribute("href");
    const url = row?.dataset.url || link.getAttribute("href") || href;
    if (!href || !url) return;
    event.preventDefault();
    const command = commands.find(
      (item) => normalizePath(item.href) === normalizePath(href)
    );
    if (command) {
      executeCommand(command.text, command);
      return;
    }
    loadPage(url, { push: true });
  });

  window.addEventListener("popstate", (event) => {
    const href = event.state?.href || window.location.href;
    loadPage(href, { push: false });
  });

  window.addEventListener("resize", () => {
    setTerminalMetrics();
    updateHistoryMetrics();
    setHeaderHeight();
    scrollToLatest();
  });

  const prefetchPages = () => {
    commands.forEach((command) => {
      fetchPage(command.href).catch(() => null);
    });
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(prefetchPages, { timeout: 1500 });
  } else {
    setTimeout(prefetchPages, 600);
  }
})();
