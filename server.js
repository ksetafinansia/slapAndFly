// Express server for Railway deployment with in-memory leaderboard
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory leaderboard (destroyed when server stops)
let leaderboard = [];
const MAX_LEADERBOARD = 3;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API: Get top 3 scores
app.get('/api/leaderboard', (req, res) => {
    res.json({
        success: true,
        leaderboard: leaderboard,
        serverStartTime: serverStartTime
    });
});

// API: Submit a score
app.post('/api/score', (req, res) => {
    const { name, distance } = req.body;

    if (!name || typeof distance !== 'number') {
        return res.status(400).json({
            success: false,
            error: 'Invalid data. Requires name (string) and distance (number)'
        });
    }

    const entry = {
        name: name.substring(0, 20), // Limit name length
        distance: Math.floor(distance),
        timestamp: new Date().toISOString()
    };

    // Add to leaderboard
    leaderboard.push(entry);

    // Sort by distance (highest first) and keep only top 3
    leaderboard.sort((a, b) => b.distance - a.distance);
    leaderboard = leaderboard.slice(0, MAX_LEADERBOARD);

    // Check if this score made it to the leaderboard
    const rank = leaderboard.findIndex(e => 
        e.name === entry.name && 
        e.distance === entry.distance && 
        e.timestamp === entry.timestamp
    );

    res.json({
        success: true,
        rank: rank >= 0 ? rank + 1 : null, // 1-indexed rank, null if not in top 3
        leaderboard: leaderboard
    });
});

// API: Server status
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        status: 'running',
        serverStartTime: serverStartTime,
        uptime: Math.floor((Date.now() - new Date(serverStartTime).getTime()) / 1000),
        totalScores: leaderboard.length
    });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Track server start time
const serverStartTime = new Date().toISOString();

app.listen(PORT, () => {
    console.log(`🎮 Slap & Fly server running on port ${PORT}`);
    console.log(`📊 Leaderboard (top ${MAX_LEADERBOARD}) - In-memory only, resets on restart`);
    console.log(`🚀 Server started at: ${serverStartTime}`);
});
