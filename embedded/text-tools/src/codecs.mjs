import { md5 } from './md5.mjs';
export async function hashText(text, algorithm = 'SHA-256', { uppercase = false } = {}) {
  if (!['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'].includes(algorithm)) throw new Error('不支持的摘要算法');
  const bytes = new TextEncoder().encode(text);
  let hex;
  if (algorithm === 'MD5') hex = md5(bytes);
  else {
    if (!globalThis.crypto?.subtle) throw new Error('当前浏览器无法使用 Web Crypto，请通过 HTTPS 或本机地址打开');
    const digest = await crypto.subtle.digest(algorithm, bytes);
    hex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }
  return uppercase ? hex.toUpperCase() : hex;
}
export function encodeBase64Utf8(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
export function decodeBase64Utf8(encoded) {
  const clean = encoded.replace(/[\t\n\f\r ]/g, '');
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(clean)) throw new Error('Base64 字符、长度或补位不合法');
  const binary = atob(clean);
  if (btoa(binary) !== clean) throw new Error('Base64 补位位元不合法');
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
  } catch { throw new Error('解码结果不是有效的 UTF-8 文本'); }
}
