const CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generate a 6-character uppercase alphanumeric room code.
 * Excludes ambiguous characters (0, O, 1, I).
 */
function generateRoomCode(length = 6) {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * CHARS.length);
    result += CHARS[randomIndex];
  }
  return result;
}

module.exports = {
  generateRoomCode,
};
