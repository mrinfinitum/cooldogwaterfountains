/**
 * Renders WordPress HTML that has already been cleaned by `cleanWpHtml`
 * (allow-listed tags and attributes only, scripts and styles removed).
 */
export default function WpContent({ html, className = "" }: { html: string; className?: string }) {
  return <div className={`wp-content ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
