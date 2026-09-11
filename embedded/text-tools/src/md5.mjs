// RFC 1321：按小端序处理原始字节，不做文本规范化。
export function md5(bytes) {
  const size = Math.ceil((bytes.length + 9) / 64) * 64;
  const buffer = new Uint8Array(size);
  buffer.set(bytes);
  buffer[bytes.length] = 0x80;
  const view = new DataView(buffer.buffer);
  view.setUint32(size - 8, (bytes.length * 8) >>> 0, true);
  view.setUint32(size - 4, Math.floor(bytes.length / 0x20000000), true);
  const shifts = [7,12,17,22, 5,9,14,20, 4,11,16,23, 6,10,15,21];
  const constants = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) | 0);
  const state = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  for (let offset = 0; offset < size; offset += 64) {
    let [a, b, c, d] = state;
    for (let i = 0; i < 64; i++) {
      let f, g;
      if (i < 16) { f = (b & c) | (~b & d); g = i; }
      else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
      else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * i) % 16; }
      const value = (a + f + constants[i] + view.getUint32(offset + g * 4, true)) | 0;
      const shift = shifts[Math.floor(i / 16) * 4 + i % 4];
      [a, b, c, d] = [d, (b + ((value << shift) | (value >>> (32 - shift)))) | 0, b, c];
    }
    [a,b,c,d].forEach((value, i) => { state[i] = (state[i] + value) | 0; });
  }
  return state.flatMap(word => [0,8,16,24].map(shift => ((word >>> shift) & 255).toString(16).padStart(2, '0'))).join('');
}
