document.addEventListener('DOMContentLoaded', () => {
    const leaderboardContainer = document.getElementById('leaderboard-container');
    const gameSelect = document.getElementById('game-select');
    const loadingElement = document.getElementById('loading');
    
    // بارگذاری لیست بازی‌ها
    loadGames();
    
    // بارگذاری رتبه‌بندی پیش‌فرض
    loadLeaderboard();
    
    // رویداد تغییر بازی
    if (gameSelect) {
        gameSelect.addEventListener('change', () => {
            loadLeaderboard();
        });
    }
    
    async function loadGames() {
        try {
            const response = await fetch('/api/games');
            const result = await response.json();
            
            if (response.ok && result.status === 'success') {
                displayGameSelect(result.data);
            }
        } catch (error) {
            console.error('Error loading games:', error);
        }
    }
    
    function displayGameSelect(games) {
        if (!gameSelect) return;
        
        gameSelect.innerHTML = '<option value="">انتخاب بازی</option>';
        games.forEach(game => {
            const option = document.createElement('option');
            option.value = game._id;
            option.textContent = game.name;
            gameSelect.appendChild(option);
        });
    }
    
    async function loadLeaderboard() {
        const selectedGameId = gameSelect ? gameSelect.value : '';
        if (!selectedGameId) {
            leaderboardContainer.innerHTML = '<p>لطفاً یک بازی انتخاب کنید</p>';
            return;
        }
        loadingElement.style.display = 'block';
        leaderboardContainer.innerHTML = '';
        try {
            const [bestRes, totalRes] = await Promise.all([
                fetch(`/api/scores/leaderboard?gameId=${selectedGameId}&limit=20`).then(r => r.json()),
                fetch(`/api/scores/total-leaderboard?gameId=${selectedGameId}&limit=20`).then(r => r.json())
            ]);
            if (bestRes.status === 'success' && totalRes.status === 'success') {
                displayDualLeaderboard(bestRes.data, totalRes.data, selectedGameId);
            } else {
                leaderboardContainer.innerHTML = '<p>خطا در بارگذاری رتبه‌بندی</p>';
            }
        } catch (error) {
            leaderboardContainer.innerHTML = '<p>خطا در بارگذاری رتبه‌بندی</p>';
        } finally {
            loadingElement.style.display = 'none';
        }
    }

    function displayDualLeaderboard(best, total, gameId) {
        const gameName = gameSelect ? gameSelect.options[gameSelect.selectedIndex].text : 'بازی';
        leaderboardContainer.innerHTML = `
        <div class="dual-leaderboard">
            <div class="leaderboard-table-wrap">
                <div class="leaderboard-header"><h2>برترین‌ها (بالاترین امتیاز)</h2></div>
                ${renderLeaderboardTable(best, 'highestScore')}
            </div>
            <div class="leaderboard-table-wrap">
                <div class="leaderboard-header"><h2>برترین‌ها (مجموع امتیاز)</h2></div>
                ${renderLeaderboardTable(total, 'totalScore')}
            </div>
        </div>
        `;
    }

    function renderLeaderboardTable(data, scoreField) {
        if (!data || data.length === 0) return '<p>هنوز هیچ امتیازی ثبت نشده است.</p>';
        return `
        <div class="leaderboard-table">
            <div class="leaderboard-header-row">
                <div class="rank">رتبه</div>
                <div class="username">نام کاربری</div>
                <div class="score">${scoreField === 'highestScore' ? 'بالاترین امتیاز' : 'مجموع امتیاز'}</div>
                <div class="sessions">تعداد دست‌ها</div>
                <div class="play-time">زمان بازی</div>
            </div>
            ${data.map((entry, index) => `
                <div class="leaderboard-row">
                    <div class="rank">${index + 1}</div>
                    <div class="username">${entry.username}</div>
                    <div class="score">${entry[scoreField].toLocaleString()}</div>
                    <div class="sessions">${entry.gameSessions}</div>
                    <div class="play-time">${Math.floor(entry.totalPlayDuration / 60)} دقیقه</div>
                </div>
            `).join('')}
        </div>
        `;
    }
});
