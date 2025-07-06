document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api';
    const userToken = localStorage.getItem('userToken');
    const userData = JSON.parse(localStorage.getItem('userData'));

    const adminAccessMessage = document.getElementById('admin-access-message');
    const actualAdminContent = document.getElementById('actual-admin-content');
    
    const addGameForm = document.getElementById('add-game-form');
    const addGameMessage = document.getElementById('add-game-message');
    
    const adminGamesTable = document.getElementById('admin-games-table-element');
    const adminGamesTbody = document.getElementById('admin-games-tbody');
    const adminGamesListMessage = document.getElementById('admin-games-list-message');

    const profileAdminLink = document.getElementById('profile-admin-link');
    const logoutAdminLink = document.getElementById('logout-admin-link');

    // Check for admin role
    if (!userToken || !userData || userData.role !== 'admin') {
        if (adminAccessMessage) adminAccessMessage.style.display = 'block';
        if (actualAdminContent) actualAdminContent.style.display = 'none';
        // Hide auth links meant for logged-in users if not admin or not logged in
        if (profileAdminLink) profileAdminLink.style.display = 'none';
        if (logoutAdminLink) logoutAdminLink.style.display = 'none';
        
        // Optional: Redirect after a delay or provide a more prominent login link
        // setTimeout(() => { window.location.href = 'index.html'; }, 5000);
        return; // Stop further execution for non-admins
    }

    // If admin, show content and auth links
    if (adminAccessMessage) adminAccessMessage.style.display = 'none';
    if (actualAdminContent) actualAdminContent.style.display = 'block';
    if (profileAdminLink) profileAdminLink.style.display = 'inline'; // or 'block'
    if (logoutAdminLink) {
        logoutAdminLink.style.display = 'inline'; // or 'block'
        logoutAdminLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('userToken');
            localStorage.removeItem('userData');
            window.location.href = 'index.html';
        });
    }

    // Function to display messages
    function displayMessage(element, message, type = 'error') {
        element.textContent = message;
        element.className = `message ${type}`;
        element.style.display = 'block';
        setTimeout(() => { element.style.display = 'none'; }, 5000); // Hide after 5s
    }

    // Add New Game
    if (addGameForm) {
        addGameForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(addGameForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch(`${API_BASE_URL}/games`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userToken}`
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok && result.status === 'success') {
                    displayMessage(addGameMessage, 'بازی با موفقیت اضافه شد!', 'success');
                    addGameForm.reset();
                    fetchAdminGamesList(); // Refresh the games list
                } else {
                    let errorMessage = result.message || 'خطا در افزودن بازی.';
                    if (result.errors) { // From validation errors
                         errorMessage += " " + Object.entries(result.errors).map(([key, val]) => `${val.message || val}`).join(' ');
                    }
                    displayMessage(addGameMessage, errorMessage, 'error');
                }
            } catch (err) {
                displayMessage(addGameMessage, 'خطای شبکه یا سرور در هنگام افزودن بازی.', 'error');
                console.error('Add game error:', err);
            }
        });
    }

    // Fetch and display games list for admin
    async function fetchAdminGamesList() {
        if (!adminGamesTbody) return;

        try {
            const response = await fetch(`${API_BASE_URL}/games`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();

            if (result.status === 'success' && result.data) {
                populateAdminGamesTable(result.data);
                if (result.data.length === 0) {
                    displayMessage(adminGamesListMessage, 'هیچ بازی‌ای هنوز اضافه نشده است.', 'success'); // 'success' for neutral info
                    adminGamesTable.style.display = 'none';
                } else {
                    adminGamesListMessage.style.display = 'none';
                    adminGamesTable.style.display = 'table';
                }
            } else {
                displayMessage(adminGamesListMessage, 'خطا در دریافت لیست بازی‌ها.', 'error');
                 adminGamesTable.style.display = 'none';
            }
        } catch (error) {
            console.error('Error fetching admin games list:', error);
            displayMessage(adminGamesListMessage, 'امکان بارگذاری لیست بازی‌ها وجود ندارد.', 'error');
            adminGamesTable.style.display = 'none';
        }
    }

    function populateAdminGamesTable(games) {
        adminGamesTbody.innerHTML = ''; // Clear existing rows
        games.forEach(game => {
            const row = adminGamesTbody.insertRow();
            row.insertCell().innerHTML = `<img src="${game.imageUrl}" alt="${game.name}" style="width:50px; height:auto; border-radius:3px;">`;
            row.insertCell().textContent = game.name;
            row.insertCell().textContent = game.description.substring(0, 50) + (game.description.length > 50 ? '...' : '');
            row.insertCell().innerHTML = `<a href="${game.gameUrl}" target="_blank">${game.gameUrl.substring(0,30)}...</a>`;
            // Add action buttons (delete/edit) in the future
            // row.insertCell().innerHTML = `<button data-id="${game._id}" class="edit-game-btn">ویرایش</button> <button data-id="${game._id}" class="delete-game-btn">حذف</button>`;
        });
    }

    // Initial load for admin panel
    fetchAdminGamesList();
});
