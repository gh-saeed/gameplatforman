/**
 * سیستم مدیریت امتیاز برای بازی‌ها
 * این فایل برای استفاده در همه بازی‌های پلتفرم طراحی شده است
 */

class GameScoreManager {
    constructor(gameId, options = {}) {
        this.gameId = gameId;
        this.startTime = Date.now();
        this.score = 0;
        this.isGameActive = false;
        this.userToken = localStorage.getItem('userToken');
        this.userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        // تنظیمات پیش‌فرض
        this.options = {
            autoSubmit: true, // ارسال خودکار امتیاز
            showNotifications: true, // نمایش اعلان‌ها
            apiBaseUrl: '/api',
            ...options
        };

        // رویدادهای قابل استفاده
        this.events = {
            scoreChanged: null,
            gameStarted: null,
            gameEnded: null,
            scoreSubmitted: null,
            error: null
        };

        this.init();
    }

    /**
     * مقداردهی اولیه
     */
    init() {
        if (!this.gameId) {
            this.logError('Game ID is required');
            return;
        }

        // بررسی ورود کاربر
        if (!this.userToken) {
            this.log('User not logged in. Scores will not be saved.', 'warn');
        }

        this.log('Game Score Manager initialized', 'info');
    }

    /**
     * شروع بازی
     */
    startGame() {
        this.startTime = Date.now();
        this.isGameActive = true;
        this.score = 0;
        
        this.log('Game started', 'info');
        this.triggerEvent('gameStarted', { startTime: this.startTime });
    }

    /**
     * پایان بازی
     */
    endGame() {
        if (!this.isGameActive) return;

        this.isGameActive = false;
        const playDuration = Math.floor((Date.now() - this.startTime) / 1000);
        
        this.log(`Game ended. Final score: ${this.score}, Duration: ${playDuration}s`, 'info');
        this.triggerEvent('gameEnded', { 
            finalScore: this.score, 
            playDuration: playDuration 
        });

        // ارسال خودکار امتیاز
        if (this.options.autoSubmit) {
            this.submitScore(this.score, playDuration);
        }
    }

    /**
     * افزایش امتیاز
     */
    addScore(points) {
        if (!this.isGameActive) {
            this.log('Cannot add score: game is not active', 'warn');
            return;
        }

        this.score += points;
        this.log(`Score updated: ${this.score} (+${points})`, 'info');
        this.triggerEvent('scoreChanged', { 
            currentScore: this.score, 
            addedPoints: points 
        });
    }

    /**
     * تنظیم امتیاز
     */
    setScore(points) {
        if (!this.isGameActive) {
            this.log('Cannot set score: game is not active', 'warn');
            return;
        }

        this.score = points;
        this.log(`Score set to: ${this.score}`, 'info');
        this.triggerEvent('scoreChanged', { 
            currentScore: this.score, 
            addedPoints: 0 
        });
    }

    /**
     * دریافت امتیاز فعلی
     */
    getScore() {
        return this.score;
    }

    /**
     * دریافت زمان بازی
     */
    getPlayDuration() {
        if (!this.isGameActive) {
            return Math.floor((Date.now() - this.startTime) / 1000);
        }
        return Math.floor((Date.now() - this.startTime) / 1000);
    }


    /**
     * ارسال امتیاز به سرور
     */
    async submitScore(score = null, playDuration = null) {
        if (!this.userToken) {
            this.log('Cannot submit score: user not logged in', 'error');
            this.triggerEvent('error', { message: 'User not logged in' });
            return false;
        }

        const finalScore = score !== null ? score : this.score;
        const finalDuration = playDuration !== null ? playDuration : this.getPlayDuration();
        
        try {
            const response = await fetch(`${this.options.apiBaseUrl}/scores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.userToken}`
                },
                body: JSON.stringify({
                    gameId: this.gameId,
                    score: finalScore,
                    playDuration: finalDuration
                })
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                this.log(`Score submitted successfully: ${finalScore}`, 'success');
                this.triggerEvent('scoreSubmitted', result.data);
                
                if (this.options.showNotifications) {
                    const message = result.message === 'Score updated successfully' 
                        ? `امتیاز شما (${finalScore}) با موفقیت به‌روزرسانی شد!`
                        : `امتیاز شما (${finalScore}) با موفقیت ثبت شد!`;
                    this.showNotification(message, 'success');
                }
                
                return true;
            } else {
                this.log(`Failed to submit score: ${result.message}`, 'error');
                this.triggerEvent('error', result);
                return false;
            }
        } catch (error) {
            this.log(`Network error: ${error.message}`, 'error');
            this.triggerEvent('error', { message: error.message });
            return false;
        }
    }

    /**
     * دریافت رتبه‌بندی بازی
     */
    async getLeaderboard(limit = 10) {
        try {
            const response = await fetch(`${this.options.apiBaseUrl}/scores/leaderboard?gameId=${this.gameId}&limit=${limit}`);
            const result = await response.json();

            if (response.ok && result.status === 'success') {
                return result.data;
            } else {
                this.log(`Failed to get leaderboard: ${result.message}`, 'error');
                return [];
            }
        } catch (error) {
            this.log(`Network error getting leaderboard: ${error.message}`, 'error');
            return [];
        }
    }

    /**
     * دریافت امتیازات کاربر
     */
    async getUserScores(limit = 10) {
        if (!this.userToken) {
            this.log('Cannot get user scores: user not logged in', 'error');
            return [];
        }

        try {
            const response = await fetch(`${this.options.apiBaseUrl}/scores?gameId=${this.gameId}&limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${this.userToken}`
                }
            });
            const result = await response.json();

            if (response.ok && result.status === 'success') {
                return result.data;
            } else {
                this.log(`Failed to get user scores: ${result.message}`, 'error');
                return [];
            }
        } catch (error) {
            this.log(`Network error getting user scores: ${error.message}`, 'error');
            return [];
        }
    }

    /**
     * دریافت آمار کاربر برای این بازی
     */
    async getUserStats() {
        if (!this.userToken) {
            this.log('Cannot get user stats: user not logged in', 'error');
            return null;
        }

        try {
            const response = await fetch(`${this.options.apiBaseUrl}/scores/user-stats?gameId=${this.gameId}`, {
                headers: {
                    'Authorization': `Bearer ${this.userToken}`
                }
            });
            const result = await response.json();

            if (response.ok && result.status === 'success') {
                return result.data;
            } else {
                this.log(`Failed to get user stats: ${result.message}`, 'error');
                return null;
            }
        } catch (error) {
            this.log(`Network error getting user stats: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * تنظیم رویداد
     */
    on(eventName, callback) {
        if (this.events.hasOwnProperty(eventName)) {
            this.events[eventName] = callback;
        }
    }

    /**
     * اجرای رویداد
     */
    triggerEvent(eventName, data) {
        if (this.events[eventName] && typeof this.events[eventName] === 'function') {
            this.events[eventName](data);
        }
    }

    /**
     * نمایش اعلان
     */
    showNotification(message, type = 'info') {
        if (!this.options.showNotifications) return;

        // ایجاد اعلان ساده
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
        `;

        // تنظیم رنگ بر اساس نوع
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#28a745';
                break;
            case 'error':
                notification.style.backgroundColor = '#dc3545';
                break;
            case 'warning':
                notification.style.backgroundColor = '#ffc107';
                notification.style.color = '#000';
                break;
            default:
                notification.style.backgroundColor = '#17a2b8';
        }

        notification.textContent = message;
        document.body.appendChild(notification);

        // حذف اعلان بعد از 3 ثانیه
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    /**
     * ثبت پیام
     */
    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[GameScoreManager] ${timestamp} ${level.toUpperCase()}: ${message}`;
        
        switch (level) {
            case 'error':
                console.error(logMessage);
                break;
            case 'warn':
                console.warn(logMessage);
                break;
            case 'success':
                console.log(`✅ ${logMessage}`);
                break;
            default:
                console.log(logMessage);
        }
    }

    /**
     * ثبت خطا
     */
    logError(message) {
        this.log(message, 'error');
    }
}

// تابع کمکی برای استفاده آسان
function createGameScoreManager(gameId, options = {}) {
    return new GameScoreManager(gameId, options);
}

// تابع کمکی برای ارسال امتیاز از iframe
function submitScoreFromGame(gameId, score, playDuration) {
    const manager = new GameScoreManager(gameId, { autoSubmit: false });
    return manager.submitScore(score, playDuration);
}

// تابع کمکی برای نمایش رتبه‌بندی
async function showLeaderboard(gameId, containerId) {
    const manager = new GameScoreManager(gameId);
    const leaderboard = await manager.getLeaderboard(10);
    
    const container = document.getElementById(containerId);
    if (!container) return;

    if (leaderboard.length === 0) {
        container.innerHTML = '<p>هنوز هیچ امتیازی ثبت نشده است.</p>';
        return;
    }

    const html = `
        <h3>رتبه‌بندی برترین‌ها</h3>
        <div class="leaderboard">
            ${leaderboard.map((entry, index) => `
                <div class="leaderboard-item">
                    <span class="rank">${index + 1}</span>
                    <span class="username">${entry.username}</span>
                    <span class="score">${entry.score}</span>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = html;
}

// Export برای استفاده در ماژول‌ها
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameScoreManager, createGameScoreManager, submitScoreFromGame, showLeaderboard };
} 