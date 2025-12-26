(() => {
  const input = document.getElementById("terminal-input");
  const suggestions = document.getElementById("terminal-suggestions");
  if (!input || !suggestions) return;

  const commandRows = Array.from(document.querySelectorAll(".command-list li"));
  const commands = commandRows
    .map((row) => {
      const text = row.querySelector(".command")?.textContent?.trim();
      const link = row.querySelector("a");
      if (!text || !link) return null;
      return {
        text,
        label: link.textContent?.trim() || text,
        href: link.getAttribute("href")
      };
    })
    .filter(Boolean);

  const history = [];
  let historyIndex = -1;
  let activeIndex = -1;

  const normalize = (value) => value.toLowerCase().trim();

  const renderSuggestions = (items) => {
    suggestions.innerHTML = "";
    activeIndex = -1;

    items.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "suggestion";
      div.setAttribute("role", "option");
      div.textContent = `${item.text} -> ${item.label}`;
      div.addEventListener("click", () => {
        window.location.href = item.href;
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
    if (!needle) return commands;

    return commands.filter((command) => {
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

    return (
      commands.find((command) => normalize(command.text) === needle) ||
      commands.find((command) => normalize(command.label) === needle)
    );
  };

  const applyInput = (value) => {
    input.value = value;
    input.setSelectionRange(value.length, value.length);
    renderSuggestions(getMatches(value));
  };

  renderSuggestions(commands);

  input.addEventListener("input", () => {
    historyIndex = -1;
    renderSuggestions(getMatches(input.value));
  });

  input.addEventListener("keydown", (event) => {
    const items = Array.from(suggestions.children);

    if (event.key === "Tab") {
      event.preventDefault();
      const match = getMatches(input.value)[0];
      if (match) applyInput(match.text);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (input.value.trim() === "" && history.length > 0) {
        historyIndex = Math.max(historyIndex - 1, -1);
        applyInput(historyIndex === -1 ? "" : history[historyIndex]);
        return;
      }

      if (items.length > 0) {
        const nextIndex = activeIndex + 1 >= items.length ? 0 : activeIndex + 1;
        setActive(nextIndex);
        return;
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (input.value.trim() === "" && history.length > 0) {
        historyIndex = Math.min(historyIndex + 1, history.length - 1);
        applyInput(history[historyIndex]);
        return;
      }

      if (items.length > 0) {
        const nextIndex = activeIndex - 1 < 0 ? items.length - 1 : activeIndex - 1;
        setActive(nextIndex);
        return;
      }
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const active = getMatches(input.value)[activeIndex];
      const resolved = active || resolveCommand(input.value);
      if (resolved) {
        if (input.value.trim()) history.unshift(input.value.trim());
        window.location.href = resolved.href;
        return;
      }

      input.classList.add("error");
      setTimeout(() => input.classList.remove("error"), 300);
      return;
    }

    if (event.key === "Escape") {
      applyInput("");
      renderSuggestions(commands);
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
    if (event.key === "/" && document.activeElement !== input) {
      event.preventDefault();
      input.focus();
    }
  });
})();
