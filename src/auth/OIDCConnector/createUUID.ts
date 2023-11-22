// UUID generator required to create a nonce attribute for SSO login
// More efficient than installing the uuid package as we need just a small fragment of the package
// Same as the keycloack-js implementation

function generateRandomData(len: number) {
  // use web crypto APIs if possible
  let array = null;
  const crypto = window.crypto;
  if (crypto && crypto.getRandomValues && window.Uint8Array) {
    array = new Uint8Array(len);
    crypto.getRandomValues(array);
    return array;
  }

  // fallback to Math random
  array = new Array(len);
  for (let j = 0; j < array.length; j++) {
    array[j] = Math.floor(256 * Math.random());
  }
  return array;
}

function generateRandomString(len: number, alphabet: string) {
  const randomData = generateRandomData(len);
  const chars = new Array(len);
  for (let i = 0; i < len; i++) {
    chars[i] = alphabet.charCodeAt(randomData[i] % alphabet.length);
  }
  return String.fromCharCode.apply(null, chars);
}

function createUUID() {
  const hexDigits = '0123456789abcdef';
  const s: (string | number | boolean)[] = generateRandomString(36, hexDigits).split('');
  s[14] = '4';
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
  s[8] = s[13] = s[18] = s[23] = '-';
  const uuid = s.join('');
  return uuid;
}

export default createUUID;
