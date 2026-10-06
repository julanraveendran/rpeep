/**
 * Building blocks for the HTML emails (PRD section 9B): a single column, 600px wide, table-based so it renders in
 * Outlook desktop, with system fonts, no images and dark text on white. Every user-supplied value goes through
 * `escapeHtml`; nothing from a visitor is ever inserted as markup.
 */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** One line of plain text: line breaks and control characters removed, so a value cannot add headers or lines. */
export function singleLine(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

const FONT = "-apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
export const colours = { ink: '#1F2937', navy: '#0F2A44', muted: '#4B5563', border: '#E5E7EB' } as const;

/** A paragraph. `html` must already be safe. */
export function p(html: string, style = ''): string {
  return `<p style="margin:0 0 16px 0;font-family:${FONT};font-size:16px;line-height:24px;color:${colours.ink};${style}">${html}</p>`;
}

export function link(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="color:${colours.navy};text-decoration:underline;">${escapeHtml(label)}</a>`;
}

/** A two-column table of labels and values, for the founder notifications. Values are escaped here. */
export function detailsTable(rows: readonly (readonly [string, string])[]): string {
  const cells = rows
    .map(
      ([label, value]) =>
        `<tr><td valign="top" style="padding:6px 12px 6px 0;font-family:${FONT};font-size:14px;line-height:20px;color:${colours.muted};white-space:nowrap;border-bottom:1px solid ${colours.border};">${escapeHtml(label)}</td>` +
        `<td valign="top" style="padding:6px 0;font-family:${FONT};font-size:14px;line-height:20px;color:${colours.ink};border-bottom:1px solid ${colours.border};">${escapeHtml(value) || '&nbsp;'}</td></tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px 0;border-collapse:collapse;">${cells}</table>`;
}

/** The page around the content. `preheader` is the hidden preview text. */
export function layout(options: { title: string; bodyHtml: string; footerHtml?: string; preheader?: string }): string {
  const { title, bodyHtml, footerHtml = '', preheader = '' } = options;
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
<tr><td style="font-family:${FONT};font-size:16px;line-height:24px;color:${colours.ink};">
${bodyHtml}
${footerHtml ? `<div style="margin-top:24px;padding-top:16px;border-top:1px solid ${colours.border};">${footerHtml}</div>` : ''}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/** Small print under a line, for the footer. `html` must already be safe. */
export function small(html: string): string {
  return `<p style="margin:0 0 8px 0;font-family:${FONT};font-size:13px;line-height:20px;color:${colours.muted};">${html}</p>`;
}
