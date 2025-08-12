// src/utils/manaRenderer.js
// Utility to render {G} {2/W} {T} tokens into <img> tags using a symbol→svg map.
// Returns an HTML string safe for v-html (best if you also use DOMPurify).

/**
 * Escape HTML except keep braces {} intact (we need the braces for token parsing).
 * Escapes: & < > " '
 */
function escapeHtmlKeepBraces(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Build an <img> tag for a token using the provided manaMap ({ "{G}": "https://..." }).
 * Falls back to a small span with the token text if no URI found.
 */
function tokenToImgHtml(token, manaMap, opts = {}) {
  const svg = manaMap && manaMap[token];
  const alt = token;
  const cls = opts.className || "mana-symbol";
  const title = opts.title || token;
  if (svg) {
    // Note: svg urls from Scryfall are safe; we still recommend using DOMPurify further down.
    return `<img src="${svg}" alt="${escapeHtmlKeepBraces(
      alt
    )}" class="${cls}" title="${escapeHtmlKeepBraces(title)}" />`;
  }
  // fallback: show the token text inside a small span
  return `<span class="${cls}">${escapeHtmlKeepBraces(token)}</span>`;
}

/**
 * renderManaHtml(text, manaMap, options)
 * - text: string containing {G} style tokens and plain text (oracle text)
 * - manaMap: object mapping token -> svg_uri (from store)
 * - options: { className, breakToBr (bool) }
 *
 * Returns HTML string (escaped + token images inserted).
 */
export function renderManaHtml(text, manaMap = {}, options = {}) {
  if (!text && text !== "") return "";

  // if scryfall sometimes returns HTML already, we still escape it to avoid XSS
  const escaped = escapeHtmlKeepBraces(text);

  // Replace tokens like {G} or {2/G} using a regex (keeps order)
  const replaced = escaped.replace(/\{([^}]+)\}/g, (full, inner) => {
    const token = `{${inner}}`; // token including braces
    return tokenToImgHtml(token, manaMap, {
      className: options.className || "mana-symbol",
      title: token,
    });
  });

  // Convert newlines to <br> for oracle text preservation if requested (default true)
  const withBreaks =
    options.breakToBr === false
      ? replaced
      : replaced.replace(/\r?\n/g, "<br/>");

  // Optionally sanitize final HTML with DOMPurify if available
  if (
    typeof window !== "undefined" &&
    window.DOMPurify &&
    typeof window.DOMPurify.sanitize === "function"
  ) {
    // allow only img and basic tags
    return window.DOMPurify.sanitize(withBreaks, {
      ALLOWED_TAGS: ["img", "br", "strong", "em", "span", "div"],
      ALLOWED_ATTR: ["src", "alt", "title", "class", "style"],
    });
  }

  // Without DOMPurify: return the constructed HTML (we already escaped original text)
  return withBreaks;
}

// default export convenience
export default {
  renderManaHtml,
};
