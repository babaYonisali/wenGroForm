// Leaderboard Module
// Handles leaderboard display and data fetching for both Mavryk and COTI campaigns

// DOM elements for leaderboards
const viewMavrykLeaderboardBtn = document.getElementById('viewMavrykLeaderboardBtn');
const viewCotiLeaderboardBtn = document.getElementById('viewCotiLeaderboardBtn');
const leaderboardTableBody = document.getElementById('leaderboardTableBody');
const cotiLeaderboardSection = document.getElementById('cotiLeaderboardSection');
const cotiLeaderboardTableBody = document.getElementById('cotiLeaderboardTableBody');
const backFromCotiLeaderboardBtn = document.getElementById('backFromCotiLeaderboardBtn');
const leaderboardSection = document.getElementById('leaderboardSection');
const backFromLeaderboardBtn = document.getElementById('backFromLeaderboardBtn');

// Leaderboard functionality
function showMavrykLeaderboard() {
    // Hide main content and other sections
    document.querySelector('.main-content').style.display = 'none';
    document.getElementById('homeSection').classList.add('hidden');
    document.getElementById('forumSection').classList.add('hidden');
    cotiLeaderboardSection.classList.add('hidden');
    
    // Show leaderboard section
    leaderboardSection.classList.remove('hidden');
    
    // Load and display leaderboard data
    loadLeaderboardData();
}

function showCotiLeaderboard() {
    // Hide main content and other sections
    document.querySelector('.main-content').style.display = 'none';
    document.getElementById('homeSection').classList.add('hidden');
    document.getElementById('forumSection').classList.add('hidden');
    leaderboardSection.classList.add('hidden');
    
    // Show COTI leaderboard section
    cotiLeaderboardSection.classList.remove('hidden');
    
    // Load and display COTI leaderboard data
    loadCotiLeaderboardData();
}

async function loadLeaderboardData(retryCount = 0) {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second base delay
    
    try {
        // Show loading state
        if (leaderboardTableBody) {
            const loadingText = retryCount > 0 ? 
                `Loading leaderboard... (attempt ${retryCount + 1}/${maxRetries + 1})` : 
                'Loading leaderboard...';
            
            leaderboardTableBody.innerHTML = `
                <div class="loading-row">
                    <div class="loading-spinner"></div>
                    <span>${loadingText}</span>
                </div>
            `;
        }
        
        // Fetch data from MongoDB via API
        const response = await fetch('/api/mavryk-leaderboard', {
            credentials: 'include'
        });
        
        if (response.status === 503) {
            // Database not ready - retry with exponential backoff
            if (retryCount < maxRetries) {
                console.log(`Database not ready, retrying in ${retryDelay * (retryCount + 1)}ms...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
                return loadLeaderboardData(retryCount + 1);
            } else {
                throw new Error('Database not ready after multiple attempts');
            }
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            displayLeaderboard(result.data);
        } else {
            throw new Error(result.message || 'Failed to load leaderboard data');
        }
        
    } catch (error) {
        console.error('Error loading leaderboard data:', error);
        
        // Show error state with retry option
        if (leaderboardTableBody) {
            const errorMessage = error.message.includes('Database not ready') ? 
                'Database is starting up, please try again' : 
                'Failed to load leaderboard data';
            
            leaderboardTableBody.innerHTML = `
                <div class="error-row">
                    <div class="error-icon">⚠️</div>
                    <span>${errorMessage}</span>
                    <button onclick="loadLeaderboardData()" class="retry-btn">Retry</button>
                </div>
            `;
        }
    }
}

async function loadCotiLeaderboardData(retryCount = 0) {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second base delay
    
    try {
        // Show loading state
        if (cotiLeaderboardTableBody) {
            const loadingText = retryCount > 0 ? 
                `Loading COTI leaderboard... (attempt ${retryCount + 1}/${maxRetries + 1})` : 
                'Loading COTI leaderboard...';
            
            cotiLeaderboardTableBody.innerHTML = `
                <div class="loading-row">
                    <div class="loading-spinner"></div>
                    <span>${loadingText}</span>
                </div>
            `;
        }
        
        // Fetch data from MongoDB via API
        const response = await fetch('/api/coti-leaderboard', {
            credentials: 'include'
        });
        
        if (response.status === 503) {
            // Database not ready - retry with exponential backoff
            if (retryCount < maxRetries) {
                console.log(`Database not ready, retrying in ${retryDelay * (retryCount + 1)}ms...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
                return loadCotiLeaderboardData(retryCount + 1);
            } else {
                throw new Error('Database not ready after multiple attempts');
            }
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            displayCotiLeaderboard(result.data);
        } else {
            throw new Error(result.message || 'Failed to load COTI leaderboard data');
        }
        
    } catch (error) {
        console.error('Error loading COTI leaderboard data:', error);
        
        // Show error state with retry option
        if (cotiLeaderboardTableBody) {
            const errorMessage = error.message.includes('Database not ready') ? 
                'Database is starting up, please try again' : 
                'Failed to load COTI leaderboard data';
            
            cotiLeaderboardTableBody.innerHTML = `
                <div class="error-row">
                    <div class="error-icon">⚠️</div>
                    <span>${errorMessage}</span>
                    <button onclick="loadCotiLeaderboardData()" class="retry-btn">Retry</button>
                </div>
            `;
        }
    }
}

function displayLeaderboard(data) {
    leaderboardTableBody.innerHTML = '';
    
    data.forEach((entry, index) => {
        const row = document.createElement('div');
        row.className = `table-row ${entry.isTopThree ? 'top-three' : ''} ${entry.crownType || ''}`;
        
        let rankDisplay = '';
        if (entry.isTopThree) {
            const crownEmoji = entry.crownType === 'gold' ? '👑' : 
                              entry.crownType === 'silver' ? '🥈' : '🥉';
            rankDisplay = `<span class="crown-icon">${crownEmoji}</span>`;
        } else {
            rankDisplay = `<span class="rank-number">${entry.rank}</span>`;
        }
        
        row.innerHTML = `
            <div class="cell rank-cell">${rankDisplay}</div>
            <div class="cell name-cell">
                <div class="avatar">
                    ${entry.profileImageUrl ? 
                        `<img src="${entry.profileImageUrl}" 
                              alt="@${entry.name}" 
                              class="profile-image"
                              data-fallbacks='${JSON.stringify(entry.profileImageFallbacks || [])}'
                              onerror="handleImageError(this)">` : 
                        ''
                    }
                    <div class="fallback-avatar" style="${entry.profileImageUrl ? 'display:none' : 'display:flex'}">${entry.avatar}</div>
                </div>
                <span class="name">
                    ${entry.twitterUrl ? 
                        `<a href="${entry.twitterUrl}" target="_blank" rel="noopener noreferrer" class="twitter-link">@${entry.name}</a>` : 
                        `@${entry.name}`
                    }
                </span>
            </div>
            <div class="cell mindshare-cell">${entry.mindshare}</div>
        `;
        
        leaderboardTableBody.appendChild(row);
    });
    
    // Sorting functionality removed - headers are now plain text
}

function displayCotiLeaderboard(data) {
    cotiLeaderboardTableBody.innerHTML = '';
    
    data.forEach((entry, index) => {
        const row = document.createElement('div');
        row.className = `table-row ${entry.isTopThree ? 'top-three' : ''} ${entry.crownType || ''}`;
        
        let rankDisplay = '';
        if (entry.isTopThree) {
            const crownEmoji = entry.crownType === 'gold' ? '👑' : 
                              entry.crownType === 'silver' ? '🥈' : '🥉';
            rankDisplay = `<span class="crown-icon">${crownEmoji}</span>`;
        } else {
            rankDisplay = `<span class="rank-number">${entry.rank}</span>`;
        }
        
        row.innerHTML = `
            <div class="cell rank-cell">${rankDisplay}</div>
            <div class="cell name-cell">
                <div class="avatar">
                    ${entry.profileImageUrl ? 
                        `<img src="${entry.profileImageUrl}" 
                              alt="@${entry.name}" 
                              class="profile-image"
                              data-fallbacks='${JSON.stringify(entry.profileImageFallbacks || [])}'
                              onerror="handleImageError(this)">` : 
                        ''
                    }
                    <div class="fallback-avatar" style="${entry.profileImageUrl ? 'display:none' : 'display:flex'}">${entry.avatar}</div>
                </div>
                <span class="name">
                    ${entry.twitterUrl ? 
                        `<a href="${entry.twitterUrl}" target="_blank" rel="noopener noreferrer" class="twitter-link">@${entry.name}</a>` : 
                        `@${entry.name}`
                    }
                </span>
            </div>
            <div class="cell mindshare-cell">${entry.mindshare}</div>
        `;
        
        cotiLeaderboardTableBody.appendChild(row);
    });
    
    // Sorting functionality removed - headers are now plain text
}

// Enhanced image error handling with multiple fallbacks
function handleImageError(img) {
    const fallbacks = JSON.parse(img.getAttribute('data-fallbacks') || '[]');
    const currentSrc = img.src;
    
    // Find current fallback index
    const currentIndex = fallbacks.indexOf(currentSrc);
    
    if (currentIndex < fallbacks.length - 1) {
        // Try next fallback
        img.src = fallbacks[currentIndex + 1];
    } else {
        // All fallbacks failed, show emoji avatar
        img.style.display = 'none';
        const fallbackAvatar = img.nextElementSibling;
        if (fallbackAvatar) {
            fallbackAvatar.style.display = 'flex';
        }
    }
}

// Initialize leaderboard functionality
function initializeLeaderboard() {
    // Add event listeners
    if (viewMavrykLeaderboardBtn) viewMavrykLeaderboardBtn.addEventListener('click', showMavrykLeaderboard);
    if (viewCotiLeaderboardBtn) viewCotiLeaderboardBtn.addEventListener('click', showCotiLeaderboard);
    if (backFromCotiLeaderboardBtn) backFromCotiLeaderboardBtn.addEventListener('click', () => {
        if (window.AuthModule) {
            window.AuthModule.showHome();
        }
    });
    if (backFromLeaderboardBtn) backFromLeaderboardBtn.addEventListener('click', () => {
        if (window.AuthModule) {
            window.AuthModule.showHome();
        }
    });
}

// Export functions that other modules might need
window.LeaderboardModule = {
    initializeLeaderboard,
    loadLeaderboardData,
    loadCotiLeaderboardData,
    showMavrykLeaderboard,
    showCotiLeaderboard
};
