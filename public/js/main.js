document.addEventListener('DOMContentLoaded', () => {
    const gamesListContainer = document.getElementById('games-list');
    const API_BASE_URL = '/api'; // Assuming your API is served from the same domain

    // Auth elements
    const loginLink = document.getElementById('login-link');
    const signupLink = document.getElementById('signup-link');
    const profileLink = document.getElementById('profile-link');
    const logoutLink = document.getElementById('logout-link');
    const adminLink = document.getElementById('admin-link'); // Added Admin link
    const leaderboardLink = document.getElementById('leaderboard-link');

    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');
    const closeButtons = document.querySelectorAll('.close-button');

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginMessage = document.getElementById('login-message');
    const signupMessage = document.getElementById('signup-message');

    let userToken = localStorage.getItem('userToken');
    let games = []; // Store games data

    if (profileLink) {
        profileLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'profile.html';
        });
    }

    // --- Authentication UI and Logic ---

    function updateAuthUI() {
        userToken = localStorage.getItem('userToken'); // Re-check token
        if (userToken) {
            loginLink.style.display = 'none';
            signupLink.style.display = 'none';
            profileLink.style.display = 'block'; // Or 'inline'
            leaderboardLink.style.display = 'block'; // Show leaderboard link
            logoutLink.style.display = 'block'; // Or 'inline'

            // Show admin link if user is admin
            const userData = JSON.parse(localStorage.getItem('userData'));
            if (userData && userData.role === 'admin' && adminLink) {
                adminLink.style.display = 'block'; // Or 'inline'
            } else if (adminLink) {
                adminLink.style.display = 'none';
            }
        } else {
            loginLink.style.display = 'block';
            signupLink.style.display = 'block';
            profileLink.style.display = 'none';
            leaderboardLink.style.display = 'none'; // Hide leaderboard link
            logoutLink.style.display = 'none';
            if (adminLink) {
                adminLink.style.display = 'none';
            }
        }
    }

    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.style.display = 'block';
    });

    signupLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupModal.style.display = 'block';
    });

    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData'); // Also remove user data if stored
        updateAuthUI();
        // Optionally redirect or show a message
        displayMessage(loginMessage, 'با موفقیت خارج شدید.', 'success'); // Or a general message area
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modalId = button.getAttribute('data-modal');
            document.getElementById(modalId).style.display = 'none';
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target == loginModal) {
            loginModal.style.display = 'none';
        }
        if (event.target == signupModal) {
            signupModal.style.display = 'none';
        }
    });

    function displayMessage(element, message, type = 'error') {
        element.textContent = message;
        element.className = `message ${type}`;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginMessage.textContent = ''; // Clear previous messages
        const formData = new FormData(loginForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (response.ok && result.token) {
                localStorage.setItem('userToken', result.token);
                localStorage.setItem('userData', JSON.stringify(result.user)); // Store user data
                displayMessage(loginMessage, 'ورود با موفقیت انجام شد!', 'success');
                updateAuthUI();
                setTimeout(() => {
                    loginModal.style.display = 'none';
                    loginForm.reset();
                }, 1500);
            } else {
                displayMessage(loginMessage, result.message || 'خطا در ورود.');
            }
        } catch (err) {
            displayMessage(loginMessage, 'خطای شبکه یا سرور.');
            console.error('Login error:', err);
        }
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        signupMessage.textContent = ''; // Clear previous messages
        const formData = new FormData(signupForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (response.status === 201 && result.token) {
                localStorage.setItem('userToken', result.token);
                localStorage.setItem('userData', JSON.stringify(result.user));
                displayMessage(signupMessage, 'ثبت‌نام با موفقیت انجام شد! اکنون وارد شده‌اید.', 'success');
                updateAuthUI();
                setTimeout(() => {
                    signupModal.style.display = 'none';
                    signupForm.reset();
                }, 1500);
            } else {
                let errorMessage = result.message || 'خطا در ثبت‌نام.';
                if (result.errors) {
                    errorMessage += " " + Object.values(result.errors).join(' ');
                }
                displayMessage(signupMessage, errorMessage);
            }
        } catch (err) {
            displayMessage(signupMessage, 'خطای شبکه یا سرور.');
            console.error('Signup error:', err);
        }
    });


    // --- Game Loading Logic ---

    async function fetchGames() {
        try {
            const response = await fetch(`${API_BASE_URL}/games`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            if (result.status === 'success' && result.data) {
                games = result.data; // Store games data
                displayGames(result.data);
            } else {
                gamesListContainer.innerHTML = '<p>خطا در دریافت لیست بازی‌ها.</p>';
            }
        } catch (error) {
            console.error('Error fetching games:', error);
            gamesListContainer.innerHTML = '<p>امکان بارگذاری بازی‌ها وجود ندارد. لطفاً بعداً تلاش کنید.</p>';
        }
    }

    function displayGames(games) {
        const gamesContainer = document.getElementById('games-list');
        
        if (games.length === 0) {
            gamesContainer.innerHTML = '<p style="text-align: center; color: white; font-size: 1.2rem;">هیچ بازی‌ای موجود نیست.</p>';
            return;
        }
        
        const gamesHTML = games.map(game => `
            <div class="game-card" onclick="loadGame('${game._id}')">
                <img src="${game.imageUrl}" alt="${game.name}" loading="lazy">
                <div class="game-card-content">
                    <h3>${game.name}</h3>
                    <p>${game.description}</p>
                </div>
            </div>
        `).join('');
        
        gamesContainer.innerHTML = gamesHTML;
    }

    // Make loadGame function global so it can be called from onclick
    window.loadGame = function(gameId) {
        // Find the game by ID
        const game = games.find(g => g._id === gameId);
        if (game) {
            window.location.href = `game.html?id=${gameId}&url=${encodeURIComponent(game.gameUrl)}`;
        } else {
            console.error('Game not found:', gameId);
        }
    };

    // Initial setup
    updateAuthUI();
    if (gamesListContainer) { // Only fetch games if the container exists
        fetchGames();
    }
});
