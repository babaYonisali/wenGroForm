// Server-side token storage
// Tokens are stored in memory on the server, NOT in cookies

const tokenStore = new Map(); // userId -> { accessToken, refreshToken, expiresAt }

function storeToken(userId, tokenData) {
  tokenStore.set(userId, {
    accessToken: tokenData.accessToken,
    refreshToken: tokenData.refreshToken,
    expiresAt: tokenData.expiresAt
  });
}

function getToken(userId) {
  return tokenStore.get(userId);
}

function deleteToken(userId) {
  tokenStore.delete(userId);
}

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, data] of tokenStore.entries()) {
    if (data.expiresAt && data.expiresAt < now) {
      deleteToken(userId);
    }
  }
}, 60000); // Clean up every minute

module.exports = {
  storeToken,
  getToken,
  deleteToken
};

