const AVATAR_POOL = [
  '🦊', '🐼', '🐸', '🦄', '🐙', '🤖', '👾', '🐯', '🦁', '🐵',
  '🦉', '🐨', '🐺', '🐗', '🦝', '🦔', '🦩', '🦚', '🦜', '🐲',
  '🦖', '🦕', '🐬', '🦈', '🐳', '🦀', '🦞', '🦋', '🐝', '🐞',
  '🐢', '🐍', '🦎', '🦅', '🦇', '🦓', '🦒', '🦘', '🦙', '🦥',
  '🦨', '🦡', '🦦', '🚀', '⚡', '🔥', '🌟', '🍕', '🌮', '🍩'
];

/**
 * Assigns an avatar from the pool that is not currently taken by any player in the room.
 * @param {Array<string>} usedAvatars - List of avatar emojis already in use
 * @returns {string} - Available avatar emoji
 */
function assignUniqueAvatar(usedAvatars = []) {
  const usedSet = new Set(usedAvatars);
  const available = AVATAR_POOL.filter(avatar => !usedSet.has(avatar));

  if (available.length > 0) {
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  }

  // Fallback if all 50 are taken (extremely large room): pick random from pool
  const randomIndex = Math.floor(Math.random() * AVATAR_POOL.length);
  return AVATAR_POOL[randomIndex];
}

module.exports = {
  AVATAR_POOL,
  assignUniqueAvatar,
};
