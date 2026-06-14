import {
  DEFAULT_SUBPATTERNS,
  generateWords,
  type Subpatterns,
} from "./pattern";

type ElementConstructor<T extends HTMLElement> = new () => T;

function requireElement<T extends HTMLElement>(
  id: string,
  ElementClass: ElementConstructor<T>,
): T {
  const element = document.getElementById(id);

  if (!(element instanceof ElementClass)) {
    throw new Error(`Missing #${id}`);
  }

  return element;
}

export function setupWordsGenerator() {
  const container = requireElement("subpatternsContainer", HTMLDivElement);
  const addSubpatternButton = requireElement("addSpBtn", HTMLButtonElement);
  const patternInput = requireElement("patternInput", HTMLInputElement);
  const wordCount = requireElement("wordCount", HTMLInputElement);
  const filterDuplicates = requireElement("filterDuplicates", HTMLInputElement);
  const newlineEach = requireElement("newlineEach", HTMLInputElement);
  const generateButton = requireElement("generateBtn", HTMLButtonElement);
  const wordGrid = requireElement("wordGrid", HTMLDivElement);
  const outputMeta = requireElement("outputMeta", HTMLSpanElement);
  const errorMessage = requireElement("errorMsg", HTMLDivElement);
  const copyButton = requireElement("copyBtn", HTMLButtonElement);
  const saveButton = requireElement("saveBtn", HTMLButtonElement);

  function createRow(name = "", value = "") {
    const row = document.createElement("div");
    row.className = "subpattern-row";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "sp-name";
    nameInput.value = name;
    nameInput.maxLength = 1;
    nameInput.placeholder = "?";
    nameInput.addEventListener("input", () => {
      nameInput.value = nameInput.value.toUpperCase().slice(-1);
    });

    const equals = document.createElement("span");
    equals.className = "sp-equals";
    equals.textContent = "=";

    const valueInput = document.createElement("input");
    valueInput.type = "text";
    valueInput.className = "sp-value";
    valueInput.value = value;
    valueInput.placeholder = "a/b/c  (separate with /)";
    valueInput.spellcheck = false;

    const removeButton = document.createElement("button");
    removeButton.className = "remove-sp";
    removeButton.textContent = "×";
    removeButton.title = "Remove";
    removeButton.addEventListener("click", () => row.remove());

    row.appendChild(nameInput);
    row.appendChild(equals);
    row.appendChild(valueInput);
    row.appendChild(removeButton);
    container.appendChild(row);
    return row;
  }

  function getSubpatterns(): Subpatterns {
    const subpatterns: Subpatterns = {};

    for (const row of container.querySelectorAll(".subpattern-row")) {
      const name =
        row.querySelector<HTMLInputElement>(".sp-name")?.value.trim().toUpperCase() ??
        "";
      const value =
        row.querySelector<HTMLInputElement>(".sp-value")?.value.trim() ?? "";

      if (name && value) {
        subpatterns[name] = value.split("/").filter(Boolean);
      }
    }

    return subpatterns;
  }

  function showError(message: string) {
    errorMessage.textContent = message;
    errorMessage.classList.add("visible");
  }

  function currentWords() {
    return Array.from(wordGrid.querySelectorAll(".word-item"), (element) =>
      element.textContent ?? "",
    ).filter(Boolean);
  }

  function generate() {
    errorMessage.classList.remove("visible");

    const subpatterns = getSubpatterns();
    const pattern = patternInput.value.trim();
    const count = Math.min(
      Math.max(Number.parseInt(wordCount.value) || 100, 1),
      9999,
    );
    const dedupe = filterDuplicates.checked;
    const newline = newlineEach.checked;

    if (!pattern) {
      showError("Pattern cannot be empty.");
      return;
    }

    generateButton.classList.add("loading");

    window.setTimeout(() => {
      let words: string[];
      try {
        words = generateWords({ count, dedupe, pattern, subpatterns });
      } catch {
        showError("Pattern syntax error.");
        generateButton.classList.remove("loading");
        return;
      }

      if (words.length === 0) {
        showError("Could not generate any words. Check your pattern and subpatterns.");
        generateButton.classList.remove("loading");
        return;
      }

      wordGrid.innerHTML = "";
      wordGrid.className = `word-grid${newline ? " newline" : ""}`;
      outputMeta.textContent = `${words.length} word${words.length !== 1 ? "s" : ""}`;

      words.forEach((word, index) => {
        const element = document.createElement("span");
        element.className = "word-item";
        element.textContent = word;
        element.style.animationDelay = `${Math.min(index, 40) * 8}ms`;
        element.title = "Click to copy";
        element.addEventListener("click", () => {
          navigator.clipboard.writeText(word).catch(() => {});
        });
        wordGrid.appendChild(element);
      });

      generateButton.classList.remove("loading");
    }, 30);
  }

  DEFAULT_SUBPATTERNS.forEach((subpattern) => {
    createRow(subpattern.name, subpattern.value);
  });

  addSubpatternButton.addEventListener("click", () => {
    const row = createRow();
    row.querySelector<HTMLInputElement>(".sp-name")?.focus();
  });

  copyButton.addEventListener("click", () => {
    const words = currentWords();
    if (!words.length) return;

    navigator.clipboard
      .writeText(words.join(newlineEach.checked ? "\n" : " "))
      .then(() => {
        const original = copyButton.textContent;
        copyButton.textContent = "Copied!";
        window.setTimeout(() => {
          copyButton.textContent = original;
        }, 1500);
      });
  });

  saveButton.addEventListener("click", () => {
    const words = currentWords();
    if (!words.length) return;

    const blob = new Blob([words.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "syllabary-words.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  });

  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      generate();
    }
  });

  generateButton.addEventListener("click", generate);
}
