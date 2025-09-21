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
const leaderboardTableBody = document.getElementById('leaderboardTableBody');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if user is already authenticated
    checkAuthStatus();
    
    // Check for OAuth success parameters
    checkOAuthSuccess();
    
    // Add event listeners with null checks
    if (xLoginBtn) xLoginBtn.addEventListener('click', handleXLogin);
    if (userEntryForm) userEntryForm.addEventListener('submit', handleUserEntry);
    if (communityBtn) communityBtn.addEventListener('click', showForum);
    if (backToHomeBtn) backToHomeBtn.addEventListener('click', showHome);
    if (backFromLeaderboardBtn) backFromLeaderboardBtn.addEventListener('click', showHome);
    if (homeSignoutBtn) homeSignoutBtn.addEventListener('click', handleSignout);
    if (submitThreadBtn) submitThreadBtn.addEventListener('click', handleThreadSubmission);
    if (viewMavrykLeaderboardBtn) viewMavrykLeaderboardBtn.addEventListener('click', showMavrykLeaderboard);
    // submitCotiThreadBtn.addEventListener('click', handleCotiThreadSubmission); // Commented out - COTI contest not yet active
    
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
    
    if (loginSuccess === 'success' && xHandle) {
        // OAuth was successful, check if they've already submitted their data
        checkUserRegistrationStatus(xHandle);
        
        // Clean up the URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }
}

function handleXLogin() {
    // Redirect to the new OAuth start endpoint
    window.location.href = '/auth/x/start';
}

function showXLoginSection() {
    xLoginSection.classList.remove('hidden');
    userDataForm.classList.add('hidden');
    homeSection.classList.add('hidden');
    forumSection.classList.add('hidden');
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
    
    // Show home section
    if (homeSection) homeSection.classList.remove('hidden');
    
    // Update user info
    if (homeCurrentUserSpan && xUserData) {
        homeCurrentUserSpan.textContent = `Welcome, @${xUserData.username}!`;
    }
    
    // Check if user has already submitted today
    checkDailySubmissionStatus();
    // checkCotiDailySubmissionStatus(); // Commented out - COTI contest not yet active
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

// COTI Thread submission functionality - COMMENTED OUT (contest not yet active)
/*
async function checkCotiDailySubmissionStatus() {
    try {
        const response = await fetch('/api/coti-submissions/status', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.hasSubmittedToday) {
                showCotiSubmissionStatus('You have already submitted a COTI thread today. Come back tomorrow!', 'info');
                submitCotiThreadBtn.disabled = true;
                submitCotiThreadBtn.querySelector('.btn-text').textContent = 'Already Submitted Today';
            } else {
                submitCotiThreadBtn.disabled = false;
                submitCotiThreadBtn.querySelector('.btn-text').textContent = 'Submit Thread';
            }
        }
    } catch (error) {
        console.error('Error checking COTI submission status:', error);
    }
}
*/

/*
async function handleCotiThreadSubmission() {
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
        submitCotiThreadBtn.disabled = true;
        const btnText = submitCotiThreadBtn.querySelector('.btn-text');
        btnText.textContent = 'Submitting...';
        
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
            cotiTweetUrlInput.value = '';
            submitCotiThreadBtn.disabled = true;
            btnText.textContent = 'Already Submitted Today';
        } else {
            throw new Error(data.message || 'Failed to submit COTI thread');
        }
        
    } catch (error) {
        console.error('Error submitting COTI thread:', error);
        showCotiSubmissionStatus(error.message || 'Failed to submit COTI thread. Please try again.', 'error');
        
        // Reset button
        submitCotiThreadBtn.disabled = false;
        submitCotiThreadBtn.querySelector('.btn-text').textContent = 'Submit Thread';
    }
}
*/

/*
function showCotiSubmissionStatus(message, type) {
    cotiSubmissionStatus.textContent = message;
    cotiSubmissionStatus.className = `submission-status ${type}`;
    cotiSubmissionStatus.classList.remove('hidden');
    
    // Auto-hide after 5 seconds for success/info messages
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            cotiSubmissionStatus.classList.add('hidden');
        }, 5000);
    }
}

function showCotiSubmissionSuccess() {
    // Create particle effect
    createCotiSubmissionParticles();
    
    // Add success glow to button
    submitCotiThreadBtn.style.background = 'linear-gradient(45deg, #00b894, #00a085)';
    submitCotiThreadBtn.style.boxShadow = '0 0 30px rgba(0, 184, 148, 0.6)';
    
    // Reset after animation
    setTimeout(() => {
        submitCotiThreadBtn.style.background = 'linear-gradient(45deg, #ffd700, #ffed4e)';
        submitCotiThreadBtn.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.3)';
    }, 2000);
}

function createCotiSubmissionParticles() {
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
*/

// Leaderboard functionality
function showMavrykLeaderboard() {
    // Hide main content and other sections
    document.querySelector('.main-content').style.display = 'none';
    homeSection.classList.add('hidden');
    forumSection.classList.add('hidden');
    
    // Show leaderboard section
    leaderboardSection.classList.remove('hidden');
    
    // Load and display leaderboard data
    loadLeaderboardData();
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
                              onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">` : 
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

// Sorting functions removed - headers are now plain text only 