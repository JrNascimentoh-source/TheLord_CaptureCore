export const PLATFORMS = Object.freeze({
  "7a7": { id: "7a7", label: "7a7", shortLabel: "7A7", games: ["aviator"] },
  betdopovo: { id: "betdopovo", label: "BetDoPovo", shortLabel: "BDP", games: ["aviator2"] }
});
export const GAMES = Object.freeze({
  aviator: { id: "aviator", label: "Aviator", platform: "7a7", databaseKey: "aviator" },
  aviator2: { id: "aviator2", label: "Aviator (BetDoPovo)", platform: "betdopovo", databaseKey: "aviator2" }
});
export function getPlatform(id) { return PLATFORMS[id] ?? null; }
export function getGame(id) { return GAMES[id] ?? null; }
export function isValidPair(platformId, gameId) {
  const platform = getPlatform(platformId), game = getGame(gameId);
  return Boolean(platform && game && game.platform === platformId && platform.games.includes(gameId));
}