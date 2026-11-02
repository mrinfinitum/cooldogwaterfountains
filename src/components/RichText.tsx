/**
 * Renders rich text from the CMS (HTML produced by WordPress) with the site's
 * content styles. The HTML comes from our own CMS through an authenticated API.
 */
export default function RichText({ html, className = "" }: { html: string; className?: string }) {
  if (!html?.trim()) return null;
  return <div className={`wp-content ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
