const VALID_GAMES = new Set([
    'standard',
    'master',
    'fortune',
    'tabu',
    'holey',
    'whynot',
    'poly',
    'pie',
]);

class GameFactory {
    static isValid(gameName) {
        return VALID_GAMES.has(gameName);
    }

    static getValidGames() {
        return Array.from(VALID_GAMES);
    }
}

module.exports = { GameFactory };