// Leaderboard API client
class Leaderboard {
    constructor() {
        // Use relative path for API calls (works on same origin)
        this.apiBase = '';
    }

    // Get top 3 scores
    async getLeaderboard() {
        try {
            const response = await fetch(`${this.apiBase}/api/leaderboard`);
            const data = await response.json();
            return data.success ? data.leaderboard : [];
        } catch (error) {
            console.warn('Failed to fetch leaderboard:', error);
            return [];
        }
    }

    // Submit a score
    async submitScore(name, distance) {
        try {
            const response = await fetch(`${this.apiBase}/api/score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, distance })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.warn('Failed to submit score:', error);
            return { success: false, error: 'Network error' };
        }
    }

    // Get server status
    async getStatus() {
        try {
            const response = await fetch(`${this.apiBase}/api/status`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.warn('Failed to get status:', error);
            return { success: false, status: 'offline' };
        }
    }
}

export default new Leaderboard();
