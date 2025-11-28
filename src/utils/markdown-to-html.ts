import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { marked } from 'marked';

function markdownToHtml(markdown: string): string {
  const html = marked.parse(markdown) as string;

  const window = new JSDOM('').window;
  const purify = DOMPurify(window);
  const sanitized = purify.sanitize(html);
  const withTargetBlank = addTargetBlankToAnchors(sanitized);
  const withDelReplaced = replaceDelTagsWithTilde(withTargetBlank);
  return correctUnconvertedBoldSyntax(withDelReplaced);
}

export default markdownToHtml;

function addTargetBlankToAnchors(htmlString: string): string {
  // Regular expression to find '<a>' tags
  // This regex matches '<a>' tags that contain 'href' attribute and optionally other attributes
  // Excludes 'target="[^"]*"' to check if target attribute already exists
  const regex = /<a(\s+[^>]*?)?(?<!target="[^"]*")>/gi;

  // Use regex to find '<a>' tags and add 'target="_blank"'
  return htmlString.replace(regex, (_match, attributes) => {
    // Handle undefined attributes as empty string
    const currentAttributes = attributes || '';

    // Double check if target attribute exists (safety check for regex limitations)
    if (currentAttributes.includes('target=')) {
      return `<a${currentAttributes}>`; // If target attribute exists, return without modification
    } else {
      // Add target="_blank" attribute
      return `<a${currentAttributes} target="_blank">`;
    }
  });
}

function replaceDelTagsWithTilde(htmlString: string): string {
  // Replace opening and closing del tags with tilde (~)
  return htmlString.replace(/<del>/gi, '~').replace(/<\/del>/gi, '~');
}

function correctUnconvertedBoldSyntax(htmlString: string): string {
  // Replace unconverted "**text**" markdown syntax with <b> tags
  // Matches "**" followed by one or more non-asterisk characters, followed by "**"
  return htmlString.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
}
