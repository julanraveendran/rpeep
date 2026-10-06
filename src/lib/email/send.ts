import { Resend } from 'resend';
import { renderPilotConfirmation, renderPilotNotification, renderReportEmail, renderReportNotification, type RenderedEmail } from '@/lib/email/templates';
import type { Mailer } from '@/lib/api/types';
import { absoluteUrl } from '@/lib/site-url';
import { createUnsubscribeToken } from '@/lib/tokens';

/** One outgoing message, independent of the email provider. */
export type OutgoingEmail = {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  attachments?: { filename: string; content: Uint8Array; contentType: string }[];
  headers?: Record<string, string>;
};

export type EmailTransport = { send(message: OutgoingEmail): Promise<void> };

/** Resend as a transport. Resend returns an error object instead of throwing, so it is turned into a throw here. */
export function createResendTransport(apiKey: string): EmailTransport {
  const resend = new Resend(apiKey);
  return {
    async send(message) {
      const { error } = await resend.emails.send({
        from: message.from,
        to: message.to,
        ...(message.replyTo ? { replyTo: message.replyTo } : {}),
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.headers ? { headers: message.headers } : {}),
        ...(message.attachments
          ? { attachments: message.attachments.map((a) => ({ filename: a.filename, content: Buffer.from(a.content), contentType: a.contentType })) }
          : {}),
      });
      if (error) throw new Error(`Resend error: ${error.name}: ${error.message}`);
    },
  };
}

export type MailerConfig = {
  transport: EmailTransport;
  /** `Brand <hello@domain>` */
  from: string;
  replyTo: string;
  founderEmail: string;
  unsubscribeSecret: string;
  /** Used to build links. Defaults to NEXT_PUBLIC_SITE_URL. */
  siteEnv?: Record<string, string | undefined>;
};

export function createMailer(config: MailerConfig): Mailer {
  const { transport, from, replyTo, founderEmail, unsubscribeSecret, siteEnv } = config;
  const toMessage = (to: string, email: RenderedEmail, extra: Partial<OutgoingEmail> = {}): OutgoingEmail => ({
    from,
    to,
    replyTo,
    subject: email.subject,
    html: email.html,
    text: email.text,
    ...extra,
  });

  return {
    async sendReportEmail({ report, to, pdf, fileName, suppressed }) {
      const unsubscribeUrl = absoluteUrl(`/api/unsubscribe?token=${createUnsubscribeToken(to, unsubscribeSecret)}`, siteEnv);
      const pilotUrl = absoluteUrl('/pilot?utm_source=report_email', siteEnv);
      const email = renderReportEmail({ report, unsubscribeUrl, pilotUrl, suppressed });
      await transport.send(
        toMessage(to, email, {
          attachments: [{ filename: fileName, content: pdf, contentType: 'application/pdf' }],
          // One-click unsubscribe (RFC 8058).
          headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
        }),
      );
    },

    async sendReportNotification(input) {
      await transport.send(toMessage(founderEmail, renderReportNotification(input)));
    },

    async sendPilotConfirmation({ to, firstName }) {
      await transport.send(toMessage(to, renderPilotConfirmation({ firstName, createdAt: new Date() })));
    },

    async sendPilotNotification(input) {
      await transport.send(toMessage(founderEmail, renderPilotNotification(input)));
    },
  };
}
