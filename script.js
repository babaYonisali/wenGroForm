// Application state
let currentUser = null;
let xUserData = null;

// DOM elements
const xLoginSection = document.getElementById('xLoginSection');
const userDataForm = document.getElementById('userDataForm');
const xLoginBtn = document.getElementById('xLoginBtn');
const userEntryForm = document.getElementById('userEntryForm');
const homeSection = document.getElementById('homeSection');
const forumSection = document.getElementById('forumSection');
const leaderboardSection = document.getElementById('leaderboardSection');
const currentUserSpan = document.getElementById('currentUser');
const homeCurrentUserSpan = document.getElementById('homeCurrentUser');
const xHandleInput = document.getElementById('xHandle');
const communityBtn = document.getElementById('communityBtn');
const backToHomeBtn = document.getElementById('backToHomeBtn');
const backFromLeaderboardBtn = document.getElementById('backFromLeaderboardBtn');
const homeSignoutBtn = document.getElementById('homeSignoutBtn');
const submitThreadBtn = document.getElementById('submitThreadBtn');
const tweetUrlInput = document.getElementById('tweetUrl');
const submissionStatus = document.getElementById('submissionStatus');
const submitCotiThreadBtn = document.getElementById('submitCotiThreadBtn');
const cotiTweetUrlInput = document.getElementById('cotiTweetUrl');
const cotiSubmissionStatus = document.getElementById('cotiSubmissionStatus');
const viewMavrykLeaderboardBtn = document.getElementById('viewMavrykLeaderboardBtn');
const viewCotiLeaderboardBtn = document.getElementById('viewCotiLeaderboardBtn');
const leaderboardTableBody = document.getElementById('leaderboardTableBody');
const cotiLeaderboardSection = document.getElementById('cotiLeaderboardSection');
const cotiLeaderboardTableBody = document.getElementById('cotiLeaderboardTableBody');
const backFromCotiLeaderboardBtn = document.getElementById('backFromCotiLeaderboardBtn');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check for OAuth success parameters first (before auth status)
    checkOAuthSuccess();
    
    // Only check auth status if we're not in the middle of OAuth flow
    const urlParams = new URLSearchParams(window.location.search);
    const loginSuccess = urlParams.get('login');
    const xHandle = urlParams.get('xHandle');
    
    // If we're not in OAuth flow, check auth status
    if (!loginSuccess && !xHandle) {
        checkAuthStatus();
    }
    
    // Add event listeners with null checks
    if (xLoginBtn) xLoginBtn.addEventListener('click', handleXLogin);
    if (userEntryForm) userEntryForm.addEventListener('submit', handleUserEntry);
    if (communityBtn) communityBtn.addEventListener('click', showForum);
    if (backToHomeBtn) backToHomeBtn.addEventListener('click', showHome);
    if (backFromLeaderboardBtn) backFromLeaderboardBtn.addEventListener('click', showHome);
    if (homeSignoutBtn) homeSignoutBtn.addEventListener('click', handleSignout);
    if (submitThreadBtn) submitThreadBtn.addEventListener('click', handleThreadSubmission);
    if (viewMavrykLeaderboardBtn) viewMavrykLeaderboardBtn.addEventListener('click', showMavrykLeaderboard);
    if (viewCotiLeaderboardBtn) viewCotiLeaderboardBtn.addEventListener('click', showCotiLeaderboard);
    if (backFromCotiLeaderboardBtn) backFromCotiLeaderboardBtn.addEventListener('click', showHome);
    if (submitCotiThreadBtn) submitCotiThreadBtn.addEventListener('click', handleCotiThreadSubmission);
    
    // Add input focus effects
    addInputEffects();
}

async function checkAuthStatus() {
    try {
        // Use the new /api/me endpoint
        const response = await fetch('/api/me', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.authenticated) {
                // User is logged in, check if they've already submitted their data
                await checkUserRegistrationStatus(data.xHandle);
            } else {
                // Not authenticated, show login
                showXLoginSection();
            }
        } else {
            // Not authenticated, show login
            showXLoginSection();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        showXLoginSection();
    }
}

async function checkUserRegistrationStatus(xHandle) {
    try {
        // Check if user already exists in the database
        const response = await fetch(`/api/users/${xHandle}`);
        
        if (response.ok) {
            const userData = await response.json();
            if (userData.data) {
                // User has already submitted their data, show the home page
                xUserData = { username: xHandle };
                showHome();
            } else {
                // User is logged in but hasn't submitted form data yet
                xUserData = { username: xHandle };
                showUserDataForm();
            }
        } else if (response.status === 404) {
            // User doesn't exist yet, show the form
            xUserData = { username: xHandle };
            showUserDataForm();
        } else {
            // Error occurred, show the form as fallback
            xUserData = { username: xHandle };
            showUserDataForm();
        }
    } catch (error) {
        console.error('Error checking user registration status:', error);
        // On error, show the form as fallback
        xUserData = { username: xHandle };
        showUserDataForm();
    }
}

function checkOAuthSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const loginSuccess = urlParams.get('login');
    const xHandle = urlParams.get('xHandle');
    const error = urlParams.get('error');
    
    if (loginSuccess === 'success' && xHandle) {
        // OAuth was successful, check if they've already submitted their data
        checkUserRegistrationStatus(xHandle);
        
        // Clean up the URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    } else if (loginSuccess === 'error') {
        // OAuth failed, show appropriate error message
        if (error === 'rate_limit') {
            showNotification('Twitter API rate limit exceeded. Please try again in a few hours.', 'error');
        } else {
            showNotification('Authorization failed. Please try again.', 'error');
        }
        showXLoginSection();
        
        // Clean up the URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    } else if (loginSuccess || xHandle) {
        // We have OAuth parameters but they're not complete yet
        // Keep showing loading screen while OAuth processes
        showAuthorizationLoading();
    }
}

function handleXLogin() {
    // Show loading state
    showAuthorizationLoading();
    
    // Redirect to the new OAuth start endpoint
    window.location.href = '/auth/x/start';
}

function showXLoginSection() {
    xLoginSection.classList.remove('hidden');
    userDataForm.classList.add('hidden');
    homeSection.classList.add('hidden');
    forumSection.classList.add('hidden');
    
    // Hide loading section if it's visible
    const loadingSection = document.getElementById('authorizationLoading');
    if (loadingSection) {
        loadingSection.classList.add('hidden');
    }
}

function showAuthorizationLoading() {
    // Hide all sections
    xLoginSection.classList.add('hidden');
    userDataForm.classList.add('hidden');
    homeSection.classList.add('hidden');
    forumSection.classList.add('hidden');
    
    // Show loading section
    const loadingSection = document.getElementById('authorizationLoading');
    if (loadingSection) {
        loadingSection.classList.remove('hidden');
    }
}

function showUserDataForm() {
    if (xUserData) {
        // Pre-populate X handle from the new data structure
        xHandleInput.value = `@${xUserData.username}`;
        xHandleInput.setAttribute('readonly', true);
        
        // Show the form
        xLoginSection.classList.add('hidden');
        userDataForm.classList.remove('hidden');
        homeSection.classList.add('hidden');
        forumSection.classList.add('hidden');
        
        // Hide loading section if it's visible
        const loadingSection = document.getElementById('authorizationLoading');
        if (loadingSection) {
            loadingSection.classList.add('hidden');
        }
    }
}

async function handleUserEntry(e) {
    e.preventDefault();
    
    const formData = new FormData(userEntryForm);
    let telegramHandle = formData.get('telegramHandle').trim();
    let referrerHandle = formData.get('referrerHandle').trim();
    const kaitoYaps = formData.get('kaitoYaps') === 'yes';
    
    // X handle is now read-only and comes from the session
    const xHandle = xUserData.username;
    
    // Validate required fields
    if (!telegramHandle) {
        showNotification('Please fill in Telegram handle', 'error');
        return;
    }
    
    if (!telegramHandle.startsWith('@')) {
        telegramHandle = '@' + telegramHandle;
    }
    
    if (referrerHandle && !referrerHandle.startsWith('@')) {
        referrerHandle = '@' + referrerHandle;
    }
    
    try {
        // Show loading state
        const submitBtn = userEntryForm.querySelector('.submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        btnText.textContent = 'Saving...';
        submitBtn.disabled = true;
        
        // Send data to backend (now only needs Telegram, referrer, Kaito Yaps)
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                telegramHandle: telegramHandle,
                xHandleReferral: referrerHandle || null,
                kaitoYaps: kaitoYaps
            }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to save user data');
        }
        
        // Success! Show the forum
        showSuccessAndRedirect();
        
    } catch (error) {
        console.error('Error saving user data:', error);
        showNotification(error.message || 'Failed to save user data', 'error');
        
        // Reset button
        const submitBtn = userEntryForm.querySelector('.submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        btnText.textContent = 'Join Greenhouse';
        submitBtn.disabled = false;
    }
}

function showSuccessAndRedirect() {
    // Show success animation
    showEntryAnimation();
    
    // Switch to home view
    setTimeout(() => {
        showHome();
    }, 1500);
}

function showEntryAnimation() {
    const submitBtn = userEntryForm.querySelector('.submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    
    // Change button text and add loading state
    btnText.textContent = 'Welcome to the Greenhouse!';
    submitBtn.style.background = 'linear-gradient(45deg, #ffed4e, #ffd700)';
    submitBtn.style.transform = 'scale(1.05)';
    
    // Add success glow effect
    submitBtn.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.6)';
    
    // Create particle effect
    createParticleEffect(submitBtn);
}

function createParticleEffect(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            particle.style.width = '4px';
            particle.style.height = '4px';
            particle.style.background = `hsl(${Math.random() * 360}, 100%, 70%)`;
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1000';
            particle.style.transition = 'all 0.8s ease-out';
            
            document.body.appendChild(particle);
            
            // Animate particle
            setTimeout(() => {
                const angle = (Math.PI * 2 * i) / 20;
                const distance = 100 + Math.random() * 50;
                const x = centerX + Math.cos(angle) * distance;
                const y = centerY + Math.sin(angle) * distance;
                
                particle.style.left = x + 'px';
                particle.style.top = y + 'px';
                particle.style.opacity = '0';
                particle.style.transform = 'scale(0)';
            }, 10);
            
            // Remove particle
            setTimeout(() => {
                document.body.removeChild(particle);
            }, 800);
        }, i * 50);
    }
}

function showHome() {
    // Hide main content and other sections
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.style.display = 'none';
    if (forumSection) forumSection.classList.add('hidden');
    if (leaderboardSection) leaderboardSection.classList.add('hidden');
    if (cotiLeaderboardSection) cotiLeaderboardSection.classList.add('hidden');
    
    // Show home section
    if (homeSection) homeSection.classList.remove('hidden');
    
    // Update user info
    if (homeCurrentUserSpan && xUserData) {
        homeCurrentUserSpan.textContent = `Welcome, @${xUserData.username}!`;
    }
    
    // Check if user has already submitted today
    checkDailySubmissionStatus();
    // COTI campaign is complete, no need to check submission status
}

async function showForum() {
    // Hide main content and home section
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.style.display = 'none';
    if (homeSection) homeSection.classList.add('hidden');
    
    // Show forum section
    if (forumSection) forumSection.classList.remove('hidden');
    
    // Update user info
    if (currentUserSpan && xUserData) {
        currentUserSpan.textContent = `Welcome, @${xUserData.username}!`;
    }
    
    // Fetch all users from the database
    try {
        const response = await fetch('/api/users');
        const data = await response.json();
        
        if (response.ok) {
            displayAllUsers(data.data);
        } else {
            throw new Error('Failed to fetch users');
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        const messagesContainer = document.getElementById('messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = `
                <div class="message">
                    <div class="message-header">
                        <span class="message-author system-author">System</span>
                        <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div class="message-content">Congratulations! You are now part of the WenGro Greenhouse!</div>
                </div>
            `;
        }
    }
}

async function handleSignout() {
    try {
        // Call the signout endpoint
        const response = await fetch('/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            // Clear local state
            xUserData = null;
            currentUser = null;
            
            // Show signout notification
            showNotification('Successfully signed out!', 'success');
            
            // Return to login screen
            setTimeout(() => {
                showXLoginSection();
                
                // Show main content again
                document.querySelector('.main-content').style.display = 'block';
            }, 1000);
        } else {
            throw new Error('Failed to sign out');
        }
    } catch (error) {
        console.error('Signout error:', error);
        showNotification('Error signing out. Please try again.', 'error');
    }
}

function displayAllUsers(users) {
    const messagesContainer = document.getElementById('messages');
    
    if (!messagesContainer) {
        console.error('Messages container not found');
        return;
    }
    
    // Add congratulations message first
    let html = `
        <div class="message">
            <div class="message-header">
                <span class="message-author system-author">System</span>
                <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="message-content">Congratulations! You are now part of the WenGro Greenhouse!</div>
        </div>
    `;
    
    // Add header for the community
    html += `
        <div class="message">
            <div class="message-header">
                <span class="message-author system-author">Community</span>
                <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="message-content"><strong>WenGro Greenhouse Members (${users.length})</strong></div>
        </div>
    `;
    
    // Add each user
    users.forEach((user, index) => {
        const joinDate = new Date(user.joinTime).toLocaleDateString();
        const isCurrentUser = user.xHandle === xUserData?.username;
        const userClass = isCurrentUser ? 'user-author' : 'message-author';
        const highlight = isCurrentUser ? '⭐ ' : '';
        
        html += `
            <div class="message">
                <div class="message-header">
                    <span class="${userClass}">${highlight}@${user.xHandle}</span>
                    <span class="message-time">${joinDate}</span>
                </div>
                <div class="message-content">
                    TG: ${user.telegramHandle}
                    ${user.xHandleReferral ? `<br>REF: ${user.xHandleReferral.startsWith('@') ? user.xHandleReferral : '@' + user.xHandleReferral}` : ''}
                    ${user.hasKaitoYaps ? `<br>KY: Yes` : ''}
                </div>
            </div>
        `;
    });
    
    messagesContainer.innerHTML = html;
}

function addInputEffects() {
    const inputs = document.querySelectorAll('.form-input');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
        
        // Add typing animation
        input.addEventListener('input', function() {
            if (this.value.length > 0) {
                this.classList.add('has-content');
            } else {
                this.classList.remove('has-content');
            }
        });
    });
    
    // Add toggle button effects
    const toggleInputs = document.querySelectorAll('.toggle-input');
    toggleInputs.forEach(input => {
        input.addEventListener('change', function() {
            const selectedBtn = this.nextElementSibling;
            
            // Add click animation
            selectedBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                selectedBtn.style.transform = 'scale(1.02)';
            }, 100);
            
            // Add ripple effect
            createRippleEffect(selectedBtn);
        });
    });
}

function createRippleEffect(element) {
    const ripple = document.createElement('div');
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255, 255, 255, 0.3)';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 0.6s linear';
    ripple.style.pointerEvents = 'none';
    ripple.style.zIndex = '2';
    
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = rect.width / 2 - size / 2;
    const y = rect.height / 2 - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    element.appendChild(ripple);
    
    setTimeout(() => {
        element.removeChild(ripple);
    }, 600);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '10px';
    notification.style.color = 'white';
    notification.style.fontWeight = '500';
    notification.style.zIndex = '10000';
    notification.style.transform = 'translateX(100%)';
    notification.style.transition = 'transform 0.3s ease';
    
    if (type === 'error') {
        notification.style.background = 'linear-gradient(45deg, #ff4757, #ff3742)';
    } else {
        notification.style.background = 'linear-gradient(45deg, #ffd700, #ffed4e)';
    }
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add some additional CSS for new elements
const additionalStyles = `
    .system-author {
        color: #ffed4e !important;
    }
    
    .user-author {
        color: #ffd700 !important;
    }
    
    .form-group.focused .form-input {
        border-color: #ffd700;
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
    }
    
    .form-input.has-content {
        border-color: #ffed4e;
    }
    
    .notification {
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
    }
    
    .signout-btn {
        background: linear-gradient(45deg, #ff4757, #ff3742);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-left: 15px;
        box-shadow: 0 4px 15px rgba(255, 71, 87, 0.3);
        width: 120px;
        white-space: nowrap;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
    }
    
    @media (max-width: 768px) {
        .signout-btn {
            margin-left: 0;
        }
        
        #communityBtn {
            margin-right: 0 !important;
        }
    }
    
    .signout-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(255, 71, 87, 0.4);
    }
    
    .signout-btn:active {
        transform: translateY(0);
    }
    
    .signout-btn .btn-text {
        font-size: 14px;
    }
    
    #communityBtn {
        background: linear-gradient(45deg, #00b894, #00a085) !important;
        box-shadow: 0 4px 15px rgba(0, 184, 148, 0.3) !important;
        margin-right: 15px;
        width: 120px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        text-align: center !important;
        color: white !important;
    }
    
    #communityBtn:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 20px rgba(0, 184, 148, 0.4) !important;
        background: linear-gradient(45deg, #00b894, #00a085) !important;
        color: white !important;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Add some crypto-themed easter eggs
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

document.addEventListener('keydown', function(e) {
    konamiCode.push(e.code);
    if (konamiCode.length > konamiSequence.length) {
        konamiCode.shift();
    }
    
    if (konamiCode.join(',') === konamiSequence.join(',')) {
        // Konami code activated!
        createCryptoRain();
        konamiCode = [];
    }
});

function createCryptoRain() {
    const symbols = ['₿', 'Ξ', '💎', '🚀', '⚡', '🌙', '🔥', '💎', '🚀'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            const element = document.createElement('div');
            element.textContent = symbol;
            element.style.position = 'fixed';
            element.style.left = Math.random() * window.innerWidth + 'px';
            element.style.top = '-50px';
            element.style.fontSize = '2rem';
            element.style.color = `hsl(${Math.random() * 360}, 100%, 70%)`;
            element.style.pointerEvents = 'none';
            element.style.zIndex = '9999';
            element.style.transition = 'all 3s ease-in';
            
            document.body.appendChild(element);
            
            setTimeout(() => {
                element.style.top = window.innerHeight + 'px';
                element.style.opacity = '0';
            }, 100);
            
            setTimeout(() => {
                document.body.removeChild(element);
            }, 3100);
        }, i * 100);
    }
}

// Thread submission functionality
async function checkDailySubmissionStatus() {
    try {
        const response = await fetch('/api/thread-submissions/status', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.hasSubmittedToday) {
                showSubmissionStatus('You have already submitted a thread today. Come back tomorrow!', 'info');
                if (submitThreadBtn) {
                    submitThreadBtn.disabled = true;
                    const btnText = submitThreadBtn.querySelector('.btn-text');
                    if (btnText) btnText.textContent = 'Already Submitted Today';
                }
            } else {
                if (submitThreadBtn) {
                    submitThreadBtn.disabled = false;
                    const btnText = submitThreadBtn.querySelector('.btn-text');
                    if (btnText) btnText.textContent = 'Submit Thread';
                }
            }
        }
    } catch (error) {
        console.error('Error checking submission status:', error);
    }
}

async function handleThreadSubmission() {
    if (!tweetUrlInput) {
        console.error('Tweet URL input not found');
        return;
    }
    
    const tweetUrl = tweetUrlInput.value.trim();
    
    if (!tweetUrl) {
        showSubmissionStatus('Please enter a valid thread URL', 'error');
        return;
    }
    
    // Validate Twitter URL format
    const twitterRegex = /^https:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+(\?.*)?$/;
    if (!twitterRegex.test(tweetUrl)) {
        showSubmissionStatus('Please enter a valid Twitter/X thread URL', 'error');
        return;
    }
    
    try {
        // Show loading state
        if (submitThreadBtn) {
            submitThreadBtn.disabled = true;
            const btnText = submitThreadBtn.querySelector('.btn-text');
            if (btnText) btnText.textContent = 'Submitting...';
        }
        
        // Extract tweet ID from URL
        const tweetId = extractTweetId(tweetUrl);
        
        // Submit thread
        const response = await fetch('/api/thread-submissions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tweetUrl: tweetUrl,
                tweetId: tweetId
            }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success animation
            showSubmissionSuccess();
            showSubmissionStatus('Thread submitted successfully!', 'success');
            if (tweetUrlInput) tweetUrlInput.value = '';
            if (submitThreadBtn) {
                submitThreadBtn.disabled = true;
                const btnText = submitThreadBtn.querySelector('.btn-text');
                if (btnText) btnText.textContent = 'Already Submitted Today';
            }
        } else {
            throw new Error(data.message || 'Failed to submit thread');
        }
        
    } catch (error) {
        console.error('Error submitting thread:', error);
        showSubmissionStatus(error.message || 'Failed to submit thread. Please try again.', 'error');
        
        // Reset button
        if (submitThreadBtn) {
            submitThreadBtn.disabled = false;
            const btnText = submitThreadBtn.querySelector('.btn-text');
            if (btnText) btnText.textContent = 'Submit Thread';
        }
    }
}

function extractTweetId(url) {
    const match = url.match(/\/status\/(\d+)/);
    return match ? match[1] : null;
}

function showSubmissionStatus(message, type) {
    if (!submissionStatus) {
        console.error('Submission status element not found');
        return;
    }
    
    submissionStatus.textContent = message;
    submissionStatus.className = `submission-status ${type}`;
    submissionStatus.classList.remove('hidden');
    
    // Auto-hide after 5 seconds for success/info messages
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            if (submissionStatus) {
                submissionStatus.classList.add('hidden');
            }
        }, 5000);
    }
}

function showSubmissionSuccess() {
    // Create particle effect
    createSubmissionParticles();
    
    // Add success glow to button
    if (submitThreadBtn) {
        submitThreadBtn.style.background = 'linear-gradient(45deg, #00b894, #00a085)';
        submitThreadBtn.style.boxShadow = '0 0 30px rgba(0, 184, 148, 0.6)';
        
        // Reset after animation
        setTimeout(() => {
            if (submitThreadBtn) {
                submitThreadBtn.style.background = 'linear-gradient(45deg, #ffd700, #ffed4e)';
                submitThreadBtn.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.3)';
            }
        }, 2000);
    }
}

function createSubmissionParticles() {
    if (!submitThreadBtn) return;
    
    const rect = submitThreadBtn.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            particle.style.width = '6px';
            particle.style.height = '6px';
            particle.style.background = '#00b894';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1000';
            particle.style.transition = 'all 1s ease-out';
            
            document.body.appendChild(particle);
            
            // Animate particle
            setTimeout(() => {
                const angle = (Math.PI * 2 * i) / 15;
                const distance = 80 + Math.random() * 40;
                const x = centerX + Math.cos(angle) * distance;
                const y = centerY + Math.sin(angle) * distance;
                
                particle.style.left = x + 'px';
                particle.style.top = y + 'px';
                particle.style.opacity = '0';
                particle.style.transform = 'scale(0)';
            }, 10);
            
            // Remove particle
            setTimeout(() => {
                if (document.body.contains(particle)) {
                    document.body.removeChild(particle);
                }
            }, 1000);
        }, i * 50);
    }
}

// COTI Thread submission functionality
async function checkCotiDailySubmissionStatus() {
    try {
        const response = await fetch('/api/coti-submissions/status', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.hasSubmittedToday) {
                showCotiSubmissionStatus('You have already submitted a COTI thread today. Come back tomorrow!', 'info');
                if (submitCotiThreadBtn) {
                    submitCotiThreadBtn.disabled = true;
                    const btnText = submitCotiThreadBtn.querySelector('.btn-text');
                    if (btnText) btnText.textContent = 'Already Submitted Today';
                }
            } else {
                if (submitCotiThreadBtn) {
                    submitCotiThreadBtn.disabled = false;
                    const btnText = submitCotiThreadBtn.querySelector('.btn-text');
                    if (btnText) btnText.textContent = 'Submit Thread';
                }
            }
        }
    } catch (error) {
        console.error('Error checking COTI submission status:', error);
    }
}

async function handleCotiThreadSubmission() {
    if (!cotiTweetUrlInput) {
        console.error('COTI tweet URL input not found');
        return;
    }
    
    const tweetUrl = cotiTweetUrlInput.value.trim();
    
    if (!tweetUrl) {
        showCotiSubmissionStatus('Please enter a valid thread URL', 'error');
        return;
    }
    
    // Validate Twitter URL format
    const twitterRegex = /^https:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+(\?.*)?$/;
    if (!twitterRegex.test(tweetUrl)) {
        showCotiSubmissionStatus('Please enter a valid Twitter/X thread URL', 'error');
        return;
    }
    
    try {
        // Show loading state
        if (submitCotiThreadBtn) {
            submitCotiThreadBtn.disabled = true;
            const btnText = submitCotiThreadBtn.querySelector('.btn-text');
            if (btnText) btnText.textContent = 'Submitting...';
        }
        
        // Extract tweet ID from URL
        const tweetId = extractTweetId(tweetUrl);
        
        // Submit thread
        const response = await fetch('/api/coti-submissions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tweetUrl: tweetUrl,
                tweetId: tweetId
            }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success animation
            showCotiSubmissionSuccess();
            showCotiSubmissionStatus('COTI thread submitted successfully!', 'success');
            if (cotiTweetUrlInput) cotiTweetUrlInput.value = '';
            if (submitCotiThreadBtn) {
                submitCotiThreadBtn.disabled = true;
                const btnText = submitCotiThreadBtn.querySelector('.btn-text');
                if (btnText) btnText.textContent = 'Already Submitted Today';
            }
        } else {
            throw new Error(data.message || 'Failed to submit COTI thread');
        }
        
    } catch (error) {
        console.error('Error submitting COTI thread:', error);
        showCotiSubmissionStatus(error.message || 'Failed to submit COTI thread. Please try again.', 'error');
        
        // Reset button
        if (submitCotiThreadBtn) {
            submitCotiThreadBtn.disabled = false;
            const btnText = submitCotiThreadBtn.querySelector('.btn-text');
            if (btnText) btnText.textContent = 'Submit Thread';
        }
    }
}

function showCotiSubmissionStatus(message, type) {
    if (!cotiSubmissionStatus) {
        console.error('COTI submission status element not found');
        return;
    }
    
    cotiSubmissionStatus.textContent = message;
    cotiSubmissionStatus.className = `submission-status ${type}`;
    cotiSubmissionStatus.classList.remove('hidden');
    
    // Auto-hide after 5 seconds for success/info messages
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            if (cotiSubmissionStatus) {
                cotiSubmissionStatus.classList.add('hidden');
            }
        }, 5000);
    }
}

function showCotiSubmissionSuccess() {
    // Create particle effect
    createCotiSubmissionParticles();
    
    // Add success glow to button
    if (submitCotiThreadBtn) {
        submitCotiThreadBtn.style.background = 'linear-gradient(45deg, #00b894, #00a085)';
        submitCotiThreadBtn.style.boxShadow = '0 0 30px rgba(0, 184, 148, 0.6)';
        
        // Reset after animation
        setTimeout(() => {
            if (submitCotiThreadBtn) {
                submitCotiThreadBtn.style.background = 'linear-gradient(45deg, #ffd700, #ffed4e)';
                submitCotiThreadBtn.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.3)';
            }
        }, 2000);
    }
}

function createCotiSubmissionParticles() {
    if (!submitCotiThreadBtn) return;
    
    const rect = submitCotiThreadBtn.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            particle.style.width = '6px';
            particle.style.height = '6px';
            particle.style.background = '#00b894';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1000';
            particle.style.transition = 'all 1s ease-out';
            
            document.body.appendChild(particle);
            
            // Animate particle
            setTimeout(() => {
                const angle = (Math.PI * 2 * i) / 15;
                const distance = 80 + Math.random() * 40;
                const x = centerX + Math.cos(angle) * distance;
                const y = centerY + Math.sin(angle) * distance;
                
                particle.style.left = x + 'px';
                particle.style.top = y + 'px';
                particle.style.opacity = '0';
                particle.style.transform = 'scale(0)';
            }, 10);
            
            // Remove particle
            setTimeout(() => {
                if (document.body.contains(particle)) {
                    document.body.removeChild(particle);
                }
            }, 1000);
        }, i * 50);
    }
}

// Leaderboard functionality
function showMavrykLeaderboard() {
    // Hide main content and other sections
    document.querySelector('.main-content').style.display = 'none';
    homeSection.classList.add('hidden');
    forumSection.classList.add('hidden');
    cotiLeaderboardSection.classList.add('hidden');
    
    // Show leaderboard section
    leaderboardSection.classList.remove('hidden');
    
    // Load and display leaderboard data
    loadLeaderboardData();
}

function showCotiLeaderboard() {
    // Hide main content and other sections
    document.querySelector('.main-content').style.display = 'none';
    homeSection.classList.add('hidden');
    forumSection.classList.add('hidden');
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

// Sorting functions removed - headers are now plain text only

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

// Spin Wheel functionality
let isWheelSpinning = false;
let wheelRotation = 0;
let leaderboardData = null;
let normalizedLeaderboardData = null;

// DOM elements for spin wheel
let spinWheel, spinWheelBtn;

// Initialize DOM elements
function initializeDOMElements() {
    spinWheel = document.getElementById('spinWheel');
    spinWheelBtn = document.getElementById('spinWheelBtn');
    
    console.log('DOM elements initialized:');
    console.log('- spinWheel:', spinWheel);
    console.log('- spinWheelBtn:', spinWheelBtn);
}

// Initialize spin wheel functionality
function initializeSpinWheel() {
    console.log('Initializing spin wheel...');
    
    // Initialize DOM elements first
    initializeDOMElements();
    
    console.log('spinWheel element:', spinWheel);
    console.log('spinWheelBtn element:', spinWheelBtn);
    
    // Check if elements exist
    if (!spinWheel) {
        console.error('spinWheel element not found! Retrying in 100ms...');
        setTimeout(initializeSpinWheel, 100);
        return;
    }
    
    if (!spinWheelBtn) {
        console.error('spinWheelBtn element not found! Retrying in 100ms...');
        setTimeout(initializeSpinWheel, 100);
        return;
    }
    
    // Reset wheel to 0 degrees on initialization
    spinWheel.style.transform = 'rotate(0deg)';
    wheelRotation = 0;
    
    // Add click to wheel for spinning
    spinWheel.addEventListener('click', handleWheelSpin);
    console.log('Added click listener to wheel');
    
    spinWheelBtn.addEventListener('click', handleWheelSpin);
    console.log('Added click listener to button');
    
    // Load leaderboard data and create proportional wheel
    loadLeaderboardForWheel();
    
    // Add a safety timeout to ensure wheel is populated even if API fails silently
    setTimeout(() => {
        if (!spinWheel.style.background || spinWheel.style.background === '') {
            console.log('Safety timeout: Wheel not populated, forcing fallback creation');
            createEqualSectionsWheel();
        }
    }, 2000);
}

async function loadLeaderboardForWheel() {
    try {
        console.log('Attempting to load leaderboard data for wheel...');
        const response = await fetch('/api/coti-leaderboard', {
            credentials: 'include'
        });
        
        console.log('API response status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('API response data:', result);
            if (result.success && result.data) {
                leaderboardData = result.data;
                console.log('Creating proportional wheel with', result.data.length, 'entries');
                createProportionalWheel(result.data);
                return;
            } else {
                console.log('API returned success=false or no data, using fallback');
            }
        } else {
            console.log('API request failed with status:', response.status);
        }
    } catch (error) {
        console.error('Error loading leaderboard for wheel:', error);
    }
    
    // Fallback to equal sections if leaderboard fails
    console.log('Using fallback: creating equal sections wheel');
    createEqualSectionsWheel();
}

function createProportionalWheel(data) {
    if (!data || data.length === 0) {
        createEqualSectionsWheel();
        return;
    }
    
    // Normalize the data to reduce extreme differences
    const impressions = data.map(entry => entry.totalImpressions || 0);
    const minImpressions = Math.min(...impressions);
    const maxImpressions = Math.max(...impressions);
    
    console.log('Raw impressions range:', minImpressions, 'to', maxImpressions);
    
    // Apply logarithmic normalization to compress the range
    const normalizedData = data.map(entry => {
        const rawValue = entry.totalImpressions || 0;
        // Use log scale to compress differences, add 1 to avoid log(0)
        const logValue = Math.log(rawValue + 1);
        return {
            ...entry,
            normalizedValue: logValue
        };
    });
    
    // Calculate total normalized value
    const totalNormalized = normalizedData.reduce((sum, entry) => sum + entry.normalizedValue, 0);
    console.log('Total normalized value:', totalNormalized);
    
    // Create proportional sections
    const sections = [];
    let currentAngle = 0;
    
    normalizedData.forEach((entry, index) => {
        const totalImpressions = entry.totalImpressions || 0;
        const normalizedValue = entry.normalizedValue;
        const angleSize = (normalizedValue / totalNormalized) * 360;
        
        sections.push({
            name: entry.name,
            mindshare: entry.mindshare,
            totalImpressions: totalImpressions,
            normalizedValue: normalizedValue,
            startAngle: currentAngle,
            endAngle: currentAngle + angleSize,
            angleSize: angleSize,
            color: getSectionColor(index)
        });
        console.log(`Section ${index + 1}: ${entry.name}, mindshare: ${entry.mindshare} (${totalImpressions} impressions, normalized: ${normalizedValue.toFixed(2)}), angle: ${currentAngle.toFixed(1)}° - ${(currentAngle + angleSize).toFixed(1)}°`);
        currentAngle += angleSize;
    });
    
    // Store normalized data for result calculation
    normalizedLeaderboardData = normalizedData;
    
    // Update wheel with proportional sections
    updateWheelSections(sections);
}

function createEqualSectionsWheel() {
    console.log('Creating equal sections wheel as fallback...');
    
    // Fallback: create 13 equal sections
    const sections = [];
    const angleSize = 360 / 13;
    
    for (let i = 0; i < 13; i++) {
        sections.push({
            name: `Section ${i + 1}`,
            mindshare: 1,
            startAngle: i * angleSize,
            endAngle: (i + 1) * angleSize,
            angleSize: angleSize,
            color: getSectionColor(i)
        });
    }
    
    console.log('Created', sections.length, 'equal sections for fallback wheel');
    updateWheelSections(sections);
}

function getSectionColor(index) {
    const colors = [
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
        '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
        '#ee5a24', '#a55eea', '#26de81'
    ];
    return colors[index % colors.length];
}

function updateWheelSections(sections) {
    console.log('Updating wheel sections:', sections);
    
    if (!spinWheel) {
        console.error('Spin wheel element not found! Cannot update sections.');
        return;
    }
    
    if (!sections || sections.length === 0) {
        console.error('No sections provided to updateWheelSections!');
        return;
    }
    
    // Create conic gradient based on sections
    let gradientString = 'conic-gradient(from 0deg, ';
    
    sections.forEach((section, index) => {
        gradientString += `${section.color} ${section.startAngle}deg ${section.endAngle}deg`;
        if (index < sections.length - 1) {
            gradientString += ', ';
        }
    });
    
    gradientString += ')';
    
    console.log('Generated gradient string:', gradientString);
    
    // Apply the gradient
    spinWheel.style.background = gradientString;
    
    console.log('Applied gradient to wheel');
    
    // Update section numbers positioning
    updateSectionNumbers(sections);
}

function updateSectionNumbers(sections) {
    console.log('Updating section numbers for', sections.length, 'sections');
    
    if (!spinWheel) {
        console.error('Spin wheel element not found! Cannot update section numbers.');
        return;
    }
    
    if (!sections || sections.length === 0) {
        console.error('No sections provided to updateSectionNumbers!');
        return;
    }
    
    // Remove existing section numbers
    const existingSections = spinWheel.querySelectorAll('.wheel-section');
    console.log('Removing', existingSections.length, 'existing sections');
    existingSections.forEach(section => section.remove());
    
    // Add new section numbers
    sections.forEach((section, index) => {
        const sectionElement = document.createElement('div');
        sectionElement.className = 'wheel-section';
        sectionElement.setAttribute('data-section', index + 1);
        sectionElement.textContent = index + 1;
        
        // Calculate position for this section
        const centerAngle = (section.startAngle + section.endAngle) / 2;
        const radius = 120; // Distance from center
        
        // Position the number
        const x = Math.cos((centerAngle - 90) * Math.PI / 180) * radius;
        const y = Math.sin((centerAngle - 90) * Math.PI / 180) * radius;
        
        sectionElement.style.position = 'absolute';
        sectionElement.style.top = '50%';
        sectionElement.style.left = '50%';
        sectionElement.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        
        spinWheel.appendChild(sectionElement);
        console.log(`Added section ${index + 1} at position (${x.toFixed(1)}, ${y.toFixed(1)})`);
    });
    
    console.log('Finished updating section numbers');
}

function handleWheelSpin() {
    if (isWheelSpinning) return;
    
    isWheelSpinning = true;
    
    // Disable button during spin
    if (spinWheelBtn) {
        spinWheelBtn.disabled = true;
        const btnText = spinWheelBtn.querySelector('.btn-text');
        if (btnText) btnText.textContent = 'SPINNING...';
    }
    
    // Calculate random rotation (multiple full rotations + random angle)
    const baseRotations = 4 + Math.random() * 4; // 4-8 full rotations
    const randomAngle = Math.random() * 360; // Random final angle
    const totalRotation = (baseRotations * 360) + randomAngle;
    
    // Update CSS custom property for animation
    if (spinWheel) {
        spinWheel.style.setProperty('--spin-rotation', `${totalRotation}deg`);
        spinWheel.classList.add('spinning');
        
        // Add some visual effects
        createSpinEffects();
    }
    
    // Reset after animation completes
    setTimeout(() => {
        if (spinWheel) {
            spinWheel.classList.remove('spinning');
            // Always reset wheel to 0 degrees after spin
            wheelRotation = 0;
            spinWheel.style.transform = 'rotate(0deg)';
        }
        
        // Re-enable button
        if (spinWheelBtn) {
            spinWheelBtn.disabled = false;
            const btnText = spinWheelBtn.querySelector('.btn-text');
            if (btnText) btnText.textContent = 'SPIN';
        }
        
        isWheelSpinning = false;
        
        // Show result with the final angle (now that wheel rotates counter-clockwise)
        showWheelResult(totalRotation);
        
    }, 4000); // Match the CSS animation duration
}

function createSpinEffects() {
    // Create particle effects around the wheel
    if (!spinWheel) return;
    
    const rect = spinWheel.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            particle.style.width = '4px';
            particle.style.height = '4px';
            particle.style.background = `hsl(${Math.random() * 360}, 100%, 70%)`;
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1000';
            particle.style.transition = 'all 2s ease-out';
            
            document.body.appendChild(particle);
            
            // Animate particle outward
            setTimeout(() => {
                const angle = (Math.PI * 2 * i) / 20;
                const distance = 150 + Math.random() * 100;
                const x = centerX + Math.cos(angle) * distance;
                const y = centerY + Math.sin(angle) * distance;
                
                particle.style.left = x + 'px';
                particle.style.top = y + 'px';
                particle.style.opacity = '0';
                particle.style.transform = 'scale(0)';
            }, 10);
            
            // Remove particle
            setTimeout(() => {
                if (document.body.contains(particle)) {
                    document.body.removeChild(particle);
                }
            }, 2000);
        }, i * 100);
    }
}

function showWheelResult(finalAngle) {
    if (!normalizedLeaderboardData || normalizedLeaderboardData.length === 0) {
        console.log('No normalized leaderboard data available');
        return;
    }
    
    // Calculate which section the wheel landed on
    const normalizedAngle = 360 - (((finalAngle % 360) + 360) % 360);
    
    // Calculate total normalized value
    const totalNormalized = normalizedLeaderboardData.reduce((sum, entry) => sum + entry.normalizedValue, 0);
    console.log('totalNormalized:', totalNormalized);
    
    // Find which section the angle falls into
    let currentAngle = 0;
    let winningSection = null;
    
    for (let i = 0; i < normalizedLeaderboardData.length; i++) {
        const entry = normalizedLeaderboardData[i];
        const normalizedValue = entry.normalizedValue;
        const sectionSize = (normalizedValue / totalNormalized) * 360;
        const sectionEnd = currentAngle + sectionSize;
        
        console.log(`Checking section ${i + 1}: ${entry.name}, range: ${currentAngle.toFixed(1)}° - ${sectionEnd.toFixed(1)}°`);
        
        if (normalizedAngle >= currentAngle && normalizedAngle < sectionEnd) {
            const totalImpressions = normalizedLeaderboardData.reduce((sum, e) => sum + e.totalImpressions, 0);
            winningSection = {
                index: i + 1,
                name: entry.name,
                mindshare: entry.mindshare,
                percentage: ((entry.totalImpressions / totalImpressions) * 100).toFixed(1)
            };
            console.log('Found winning section:', winningSection);
            break;
        }
        
        currentAngle = sectionEnd;
    }
    
    // Handle edge case for the last section
    if (!winningSection && normalizedAngle >= currentAngle) {
        const lastEntry = normalizedLeaderboardData[normalizedLeaderboardData.length - 1];
        const totalImpressions = normalizedLeaderboardData.reduce((sum, e) => sum + e.totalImpressions, 0);
        winningSection = {
            index: normalizedLeaderboardData.length,
            name: lastEntry.name,
            mindshare: lastEntry.mindshare,
            percentage: ((lastEntry.totalImpressions / totalImpressions) * 100).toFixed(1)
        };
        console.log('Found winning section (edge case):', winningSection);
    }
    
    if (winningSection) {
        console.log(`Wheel landed on ${winningSection.name} (Section ${winningSection.index}, ${winningSection.percentage}% mindshare, angle: ${normalizedAngle.toFixed(1)}°)`);
        
        // Create winning message with cool animation
        createWinningAnimation(winningSection.name);
    } else {
        console.log(`Could not determine winning section for angle: ${normalizedAngle.toFixed(1)}°`);
    }
}

function createWinningAnimation(winnerName) {
    // Create confetti effect first
    createConfettiEffect();
    
    // Create the main winning display
    const winnerDiv = document.createElement('div');
    winnerDiv.style.position = 'fixed';
    winnerDiv.style.top = '50%';
    winnerDiv.style.left = '50%';
    winnerDiv.style.transform = 'translate(-50%, -50%) scale(0)';
    winnerDiv.style.zIndex = '10001';
    winnerDiv.style.textAlign = 'center';
    winnerDiv.style.fontFamily = "'Orbitron', monospace";
    
    // Create the winning message
    const messageDiv = document.createElement('div');
    messageDiv.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57);
            background-size: 400% 400%;
            animation: gradientShift 2s ease-in-out infinite;
            padding: 30px 50px;
            border-radius: 25px;
            box-shadow: 
                0 0 50px rgba(255, 107, 107, 0.6),
                0 0 100px rgba(78, 205, 196, 0.4),
                inset 0 0 20px rgba(255, 255, 255, 0.3);
            border: 3px solid rgba(255, 255, 255, 0.8);
            position: relative;
            overflow: hidden;
        ">
            <div style="
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
                animation: shimmer 3s ease-in-out infinite;
            "></div>
            
            <div style="
                position: relative;
                z-index: 2;
                color: #fff;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            ">
                <div style="
                    font-size: 2.5rem;
                    font-weight: 900;
                    margin-bottom: 10px;
                    animation: bounce 1s ease-in-out infinite alternate;
                ">🎉 WINNER! 🎉</div>
                
                <div style="
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 15px;
                    animation: pulse 1.5s ease-in-out infinite;
                ">${winnerName}</div>
                
                <div style="
                    font-size: 1.2rem;
                    font-weight: 500;
                    opacity: 0.9;
                    animation: fadeInOut 2s ease-in-out infinite;
                ">Congratulations! 🏆</div>
            </div>
        </div>
    `;
    
    winnerDiv.appendChild(messageDiv);
    document.body.appendChild(winnerDiv);
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        @keyframes shimmer {
            0% { transform: rotate(0deg) translate(-50%, -50%); }
            100% { transform: rotate(360deg) translate(-50%, -50%); }
        }
        
        @keyframes bounce {
            0% { transform: translateY(0px); }
            100% { transform: translateY(-10px); }
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        @keyframes fadeInOut {
            0%, 100% { opacity: 0.9; }
            50% { opacity: 0.6; }
        }
        
        @keyframes confettiFall {
            0% { 
                transform: translateY(-100vh) rotate(0deg);
                opacity: 1;
            }
            100% { 
                transform: translateY(100vh) rotate(720deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Animate the winner display
    setTimeout(() => {
        winnerDiv.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        winnerDiv.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        winnerDiv.style.transition = 'all 0.5s ease-in-out';
        winnerDiv.style.transform = 'translate(-50%, -50%) scale(0)';
        winnerDiv.style.opacity = '0';
        
        setTimeout(() => {
            if (document.body.contains(winnerDiv)) {
                document.body.removeChild(winnerDiv);
            }
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
        }, 500);
    }, 5000);
}

function createConfettiEffect() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#ee5a24', '#a55eea', '#26de81'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '-10px';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = '50%';
            confetti.style.zIndex = '10000';
            confetti.style.animation = `confettiFall ${2 + Math.random() * 3}s linear forwards`;
            
            document.body.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                if (document.body.contains(confetti)) {
                    document.body.removeChild(confetti);
                }
            }, 5000);
        }, i * 50);
    }
}

// Initialize spin wheel when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeSpinWheel();
}); 