import { cleanHtml, normalizeWhitespace, stripHtmlToText, tableToMarkdown } from './text-tools.mjs';
import { hashText, encodeBase64Utf8, decodeBase64Utf8 } from './codecs.mjs';
import { createLatestResult } from './latest-result.mjs';

const input = document.querySelector('#input');
const output = document.querySelector('#output');
const status = document.querySelector('#status');
const algorithm = document.querySelector('#algorithm');
const uppercase = document.querySelector('#uppercase');
const direction = document.querySelector('#direction');
const tools = { normalize: normalizeWhitespace, strip: stripHtmlToText, clean: cleanHtml, table: tableToMarkdown };
let active = 'hash';
const runner = createLatestResult(value => { output.value = value; status.textContent = '处理完成'; }, error => { output.value = ''; status.textContent = error.message; });
function run() {
  output.value = '';
  status.textContent = '正在处理…';
  document.querySelectorAll('[data-tool]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tool === active)));
  document.querySelector('#hash-options').hidden = active !== 'hash';
  document.querySelector('#base64-options').hidden = active !== 'base64';
  const text = input.value;
  runner.run(() => active === 'hash' ? hashText(text, algorithm.value, { uppercase: uppercase.checked }) : active === 'base64' ? (direction.value === 'encode' ? encodeBase64Utf8(text) : decodeBase64Utf8(text)) : tools[active](text));
}
document.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => { active = button.dataset.tool; run(); }));
input.addEventListener('input', run);
for (const control of [algorithm, uppercase, direction]) control.addEventListener('change', run);
document.querySelector('#clear').addEventListener('click', () => { runner.invalidate(); input.value = ''; output.value = ''; status.textContent = '已清空'; input.focus(); });
document.querySelector('#copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(output.value); status.textContent = '已复制'; }
  catch { status.textContent = '无法访问剪贴板，请选中输出后手动复制'; output.focus(); output.select(); }
});
run();
