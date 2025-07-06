document.addEventListener('DOMContentLoaded', () => {
    const gameIframe = document.getElementById('game-iframe');
    const gameTitleElement = document.getElementById('game-title');
    const gameStatusMessage = document.getElementById('game-status-message');
    const API_BASE_URL = '/api';

    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');
    const gameUrl = decodeURIComponent(urlParams.get('url')); // The actual URL of the game's HTML file

    let userToken = localStorage.getItem('userToken');

    // ایجاد سیستم مدیریت امتیاز
    let scoreManager = null;
    if (gameId) {
        scoreManager = new GameScoreManager(gameId, {
            autoSubmit: false, // ارسال دستی امتیاز
            showNotifications: true
        });
    }

    if (!gameId || !gameUrl) {
        gameTitleElement.textContent = 'خطا';
        gameStatusMessage.textContent = 'اطلاعات بازی نامعتبر است. لطفاً به صفحه اصلی بازگردید.';
        gameIframe.style.display = 'none';
        return;
    }

    // Fetch game details to display title (optional, if not passed via URL or for verification)
    // For now, we assume gameUrl is correct and directly load it.
    // A more robust solution might fetch game details from /api/games/:id to confirm existence and get name.
    if (gameTitleElement) {
        // Try to get game name from localStorage or fetch it
        // This part is just for displaying the name, the gameUrl is the critical part.
        // We can enhance this by fetching `/api/games/${gameId}`
        gameTitleElement.textContent = `بازی: ${gameId}`; // Placeholder, replace with actual game name if fetched
    }
    
    if (gameIframe && gameUrl) {
        gameIframe.src = gameUrl;
    } else {
        gameStatusMessage.textContent = 'خطا در بارگذاری فریم بازی.';
    }

    // Listen for messages from the iframe (game sending score and duration)
    window.addEventListener('message', async (event) => {
        // Basic security: check origin if the game is on a different domain
        // if (event.origin !== 'expected_game_origin') {
        //     console.warn('Message received from unexpected origin:', event.origin);
        //     return;
        // }

        const data = event.data;

        if (data && typeof data === 'object' && data.type === 'GAME_EVENT') {
            if (data.action === 'SCORE_SUBMISSION') {
                const { score, playDuration } = data.payload;
                if (score !== undefined && playDuration !== undefined) {
                    if (scoreManager) {
                        await scoreManager.submitScore(score, playDuration);
                    } else {
                        await submitScore(gameId, score, playDuration);
                    }
                } else {
                    gameStatusMessage.textContent = 'اطلاعات امتیاز ارسال شده از بازی ناقص است.';
                    console.warn('Incomplete score data received:', data.payload);
                }
            } else if (data.action === 'GAME_STARTED') {
                if (scoreManager) {
                    scoreManager.startGame();
                }
            } else if (data.action === 'GAME_ENDED') {
                if (scoreManager) {
                    scoreManager.endGame();
                }
            } else if (data.action === 'SCORE_CHANGED') {
                if (scoreManager) {
                    scoreManager.setScore(data.payload.score);
                }
            }
            // Handle other game events if needed
        }
    });

    async function submitScore(gId, score, duration) {
        userToken = localStorage.getItem('userToken'); // Re-check token before submission
        if (!userToken) {
            gameStatusMessage.textContent = 'برای ثبت امتیاز باید ابتدا وارد شوید.';
            // Optionally, redirect to login or show login modal
            return;
        }

        gameStatusMessage.textContent = `در حال ارسال امتیاز: ${score}، زمان: ${duration} ثانیه...`;

        try {
            const response = await fetch(`${API_BASE_URL}/scores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({
                    gameId: gId,
                    score: Number(score),
                    playDuration: Number(duration)
                })
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                gameStatusMessage.textContent = `امتیاز شما (${result.data.score}) با موفقیت ثبت شد!`;
                console.log('Score submitted successfully:', result.data);
                // Optionally, redirect to profile or show a summary
            } else {
                gameStatusMessage.textContent = `خطا در ثبت امتیاز: ${result.message || response.statusText}`;
                console.error('Failed to submit score:', result);
            }
        } catch (error) {
            gameStatusMessage.textContent = 'خطای شبکه یا سرور هنگام ارسال امتیاز.';
            console.error('Error submitting score:', error);
        }
    }

    // Example of how a game in an iframe would send a message:
    // window.parent.postMessage({
    //   type: 'GAME_EVENT',
    //   action: 'SCORE_SUBMISSION',
    //   payload: {
    //     score: 100, // Example score
    //     playDuration: 120 // Example duration in seconds
    //   }
    // }, '*'); // Use targetOrigin in production instead of '*' for security
});
