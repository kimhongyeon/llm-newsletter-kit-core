import type { HtmlString } from './common';

/**
 * Type representing an email address.
 * @example "user@example.com"
 */
export type EmailAddress = string;

/**
 * Information about an email attachment.
 */
export type EmailAttachment = {
  /**
   * Attachment file name
   */
  filename: string;

  /**
   * Attachment content (Buffer or string)
   */
  content: Buffer | string;

  /**
   * Attachment MIME type (optional)
   * @example 'application/pdf', 'image/png'
   */
  contentType?: string;

  /**
   * Content-ID for inline images (optional)
   * Can be referenced in HTML as <img src="cid:contentId">
   */
  contentId?: string;
};

/**
 * Email message information.
 */
export type EmailMessage = {
  /**
   * Sender email address
   */
  from: EmailAddress;

  /**
   * Recipient email address(es)
   */
  to: EmailAddress | EmailAddress[];

  /**
   * Email subject
   */
  subject: string;

  /**
   * HTML body
   */
  html: HtmlString;

  /**
   * Plain text body (optional)
   */
  text?: string;

  /**
   * CC address(es) (optional)
   */
  cc?: EmailAddress | EmailAddress[];

  /**
   * BCC address(es) (optional)
   */
  bcc?: EmailAddress | EmailAddress[];

  /**
   * Reply-to address (optional)
   * Address for recipients to reply to
   */
  replyTo?: EmailAddress;

  /**
   * Additional headers (optional)
   * @example { 'X-Priority': '1', 'X-Mailer': 'MyApp' }
   */
  headers?: Record<string, string>;

  /**
   * Attachments (optional)
   * Supports both regular attachments and inline images.
   */
  attachments?: EmailAttachment[];
};
