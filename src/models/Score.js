const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    game: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game',
        required: true
    },
    // امتیاز فعلی این دست
    currentScore: {
        type: Number,
        required: true,
        default: 0
    },
    // بالاترین امتیاز در این بازی
    highestScore: {
        type: Number,
        required: true,
        default: 0
    },
    // کل امتیازات جمع شده
    totalScore: {
        type: Number,
        required: true,
        default: 0
    },
    // زمان بازی این دست
    currentPlayDuration: {
        type: Number,
        required: true,
        default: 0
    },
    // کل زمان بازی
    totalPlayDuration: {
        type: Number,
        required: true,
        default: 0
    },
    // تعداد دست‌های بازی شده
    gameSessions: {
        type: Number,
        required: true,
        default: 0
    },
    // آخرین 5 امتیاز
    recentScores: [{
        score: Number,
        playDuration: Number,
        playedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // آخرین به‌روزرسانی
    lastPlayedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// ایجاد compound index برای user و game
scoreSchema.index({ user: 1, game: 1 }, { unique: true });

// متد برای به‌روزرسانی امتیاز
scoreSchema.methods.updateScore = function(newScore, newPlayDuration) {
    // به‌روزرسانی امتیاز فعلی
    this.currentScore = newScore;
    
    // به‌روزرسانی بالاترین امتیاز
    if (newScore > this.highestScore) {
        this.highestScore = newScore;
    }
    
    // جمع کل امتیازات
    this.totalScore += newScore;
    
    // به‌روزرسانی زمان بازی
    this.currentPlayDuration = newPlayDuration;
    this.totalPlayDuration += newPlayDuration;
    
    // افزایش تعداد دست‌ها
    this.gameSessions += 1;
    
    // به‌روزرسانی آخرین 5 امتیاز
    this.recentScores.push({
        score: newScore,
        playDuration: newPlayDuration,
        playedAt: new Date()
    });
    
    // نگه داشتن فقط آخرین 5 امتیاز
    if (this.recentScores.length > 5) {
        this.recentScores = this.recentScores.slice(-5);
    }
    
    // به‌روزرسانی زمان آخرین بازی
    this.lastPlayedAt = new Date();
    
    return this.save();
};

module.exports = mongoose.model('Score', scoreSchema);
