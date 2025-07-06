document.addEventListener('DOMContentLoaded', () => {
    const userStatsContainer = document.getElementById('user-stats');
    const userToken = localStorage.getItem('userToken');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    if (!userToken) {
        window.location.href = '/';
        return;
    }

    // نمایش اطلاعات کاربر
    if (userData.username) {
        document.getElementById('username').textContent = userData.username;
    }

    // بارگذاری آمار کاربر
    loadUserStats();

    async function loadUserStats() {
        try {
            const response = await fetch('/api/scores?userId=' + userData._id, {
                headers: {
                    'Authorization': `Bearer ${userToken}`
                }
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                displayUserStats(result.data);
            } else {
                userStatsContainer.innerHTML = '<p>خطا در بارگذاری آمار</p>';
            }
        } catch (error) {
            console.error('Error loading user stats:', error);
            userStatsContainer.innerHTML = '<p>خطا در بارگذاری آمار</p>';
        }
    }

    function displayUserStats(scores) {
        if (!scores || scores.length === 0) {
            userStatsContainer.innerHTML = '<p>هنوز هیچ امتیازی ثبت نکرده‌اید.</p>';
            return;
        }

        let totalGames = 0;
        let totalScore = 0;
        let totalPlayTime = 0;
        let totalSessions = 0;
        let highestScore = 0;
        let favoriteGame = null;
        let gameStats = {};

        // محاسبه آمار کلی
        scores.forEach(score => {
            totalGames++;
            totalScore += score.totalScore || 0;
            totalPlayTime += score.totalPlayDuration || 0;
            totalSessions += score.gameSessions || 0;
            
            if ((score.highestScore || 0) > highestScore) {
                highestScore = score.highestScore || 0;
            }

            // آمار هر بازی
            if (score.game && score.game.name) {
                if (!gameStats[score.game.name]) {
                    gameStats[score.game.name] = {
                        highestScore: 0,
                        totalScore: 0,
                        sessions: 0,
                        playTime: 0
                    };
                }
                
                gameStats[score.game.name].highestScore = Math.max(
                    gameStats[score.game.name].highestScore, 
                    score.highestScore || 0
                );
                gameStats[score.game.name].totalScore += score.totalScore || 0;
                gameStats[score.game.name].sessions += score.gameSessions || 0;
                gameStats[score.game.name].playTime += score.totalPlayDuration || 0;
            }
        });

        // پیدا کردن بازی مورد علاقه
        let maxSessions = 0;
        for (const [gameName, stats] of Object.entries(gameStats)) {
            if (stats.sessions > maxSessions) {
                maxSessions = stats.sessions;
                favoriteGame = gameName;
            }
        }

        // نمایش آمار کلی
        const overallStats = `
            <div class="stats-section">
                <h3>آمار کلی</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">تعداد بازی‌ها:</span>
                        <span class="stat-value">${totalGames}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">کل امتیازات:</span>
                        <span class="stat-value">${totalScore.toLocaleString()}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">بالاترین امتیاز:</span>
                        <span class="stat-value">${highestScore.toLocaleString()}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">تعداد دست‌ها:</span>
                        <span class="stat-value">${totalSessions}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">کل زمان بازی:</span>
                        <span class="stat-value">${Math.floor(totalPlayTime / 60)} دقیقه</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">بازی مورد علاقه:</span>
                        <span class="stat-value">${favoriteGame || 'نامشخص'}</span>
                    </div>
                </div>
            </div>
        `;

        // نمایش آمار هر بازی
        const gameStatsHTML = `
            <div class="stats-section">
                <h3>آمار هر بازی</h3>
                ${Object.entries(gameStats).map(([gameName, stats]) => `
                    <div class="game-stat">
                        <h4>${gameName}</h4>
                        <div class="game-stats-grid">
                            <div class="stat-item">
                                <span class="stat-label">بالاترین امتیاز:</span>
                                <span class="stat-value">${stats.highestScore.toLocaleString()}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">کل امتیازات:</span>
                                <span class="stat-value">${stats.totalScore.toLocaleString()}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">تعداد دست‌ها:</span>
                                <span class="stat-value">${stats.sessions}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">زمان بازی:</span>
                                <span class="stat-value">${Math.floor(stats.playTime / 60)} دقیقه</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        userStatsContainer.innerHTML = overallStats + gameStatsHTML;
    }

    // خروج از حساب کاربری
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        window.location.href = '/';
    });
});
