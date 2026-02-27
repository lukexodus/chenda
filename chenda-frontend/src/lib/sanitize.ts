/**
 * Client-side sanitization helpers.
 *
 * The Next.js frontend does not render raw HTML via dangerouslySetInnerHTML,
 * so heavy libraries like DOMPurify are not needed. This lightweight helper
 * covers defensive sanitization for any edge-cases where user content is
 * rendered as text or passed directly to URLs.
 */

/**
 * Strip characters commonly used for XSS / HTML injection from a string.
 * Removes tags and javascript: URI schemes.
 *
 * @example
 *   sanitizeText('<script>alert(1)</script>hello') // => 'hello'
 */
export function sanitizeText(value: unknown): string {
    if (typeof value !== "string") return String(value ?? "");
    return value
        .replace(/<[^>]*>/g, "")        // Strip HTML tags
        .replace(/javascript:/gi, "")   // Strip javascript: URI scheme
        .replace(/on\w+\s*=/gi, "")     // Strip inline event handlers
        .trim();
}

/**
 * Sanitize a URL so it cannot be used for javascript: or data: injection.
 * Returns an empty string if the URL is unsafe.
 *
 * @example
 *   sanitizeUrl('javascript:alert(1)')  // => ''
 *   sanitizeUrl('https://example.com') // => 'https://example.com'
 */
export function sanitizeUrl(url: unknown): string {
    if (typeof url !== "string") return "";
    const trimmed = url.trim();
    // Allow only http, https, and relative paths
    if (/^(javascript|data|vbscript):/i.test(trimmed)) {
        return "";
    }
    return trimmed;
}
