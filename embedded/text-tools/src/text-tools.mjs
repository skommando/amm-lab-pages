const ENTITY_MAP = new Map([
  ['nbsp', ' '],
  ['amp', '&'],
  ['lt', '<'],
  ['gt', '>'],
  ['quot', '"'],
]);

function decodeEntities(value) {
  return value.replace(/&([a-z]+);/gi, (_, entity) => ENTITY_MAP.get(entity.toLowerCase()) ?? `&${entity};`);
}

function normalizeInput(input) {
  return String(input ?? '').replace(/\\n/g, '\n');
}

export function normalizeWhitespace(input) {
  return normalizeInput(input)
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

export function stripHtmlToText(input) {
  return normalizeWhitespace(
    decodeEntities(
      String(input ?? '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<(h[1-6]|p|div|br|li)\b[^>]*>/gi, '\n')
        .replace(/<[^>]+>/g, ''),
    ),
  );
}

export function tableToMarkdown(input) {
  const lines = normalizeInput(input).trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return '';
  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const rows = lines.map((line) => line.split(delimiter).map((cell) => cell.trim()));
  const [header, ...body] = rows;
  const divider = header.map(() => '---');
  return [header, divider, ...body]
    .map((row) => `| ${row.join(' | ')} |`)
    .join('\n');
}

export function cleanHtml(input) {
  return String(input ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
