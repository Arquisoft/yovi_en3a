const mongoose = require("mongoose")

const historySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    result: {
        type: String,
        enum: ["won", "lost", "resigned"],
        required: true,
    },
    botId: {
        type: String,
        enum: ["random_bot", "beginner_bot", "medium_bot"],
        required: true,
    },
    boardSize: {
        type: Number,
        required: true,
    },
    gameType: {
        type: String,
        required: true,
    },
    playedAt: {
        type: Date,
        default: Date.now,
        immutable: true,
    },
})

module.exports = mongoose.model("History", historySchema)