const mongoose = require("mongoose")

const statsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true,
    },
    gamesPlayed: {
        type: Number,
        required: true,
        default: 0
    },
    wins: {
        type: Number,
        required: true,
        default: 0
    },
    losses: {
        type: Number,
        required: true,
        default: 0
    },
    winRate: {
        type: Number,
        required: true,
        default: 0
    },
})

module.exports = mongoose.model("Userstats", statsSchema)