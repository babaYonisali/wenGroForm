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
const currentUserSpan = document.getElementById('currentUser');
const homeCurrentUserSpan = document.getElementById('homeCurrentUser');
const xHandleInput = document.getElementById('xHandle');
const communityBtn = document.getElementById('communityBtn');
const backToHomeBtn = document.getElementById('backToHomeBtn');
const homeSignoutBtn = document.getElementById('homeSignoutBtn');
const submitThreadBtn = document.getElementById('submitThreadBtn');
const tweetUrlInput = document.getElementById('tweetUrl');
const submissionStatus = document.getElementById('submissionStatus');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if user is already authenticated
    checkAuthStatus();
    
    // Check for OAuth success parameters
    checkOAuthSuccess();
    
    // Add event listeners
    xLoginBtn.addEventListener('click', handleXLogin);
    userEntryForm.addEventListener('submit', handleUserEntry);
    communityBtn.addEventListener('click', showForum);
    backToHomeBtn.addEventListener('click', showHome);
    homeSignoutBtn.addEventListener('click', handleSignout);
    submitThreadBtn.addEventListener('click', handleThreadSubmission);
    
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
    document.querySelector('.main-content').style.display = 'none';
    forumSection.classList.add('hidden');
    
    // Show home section
    homeSection.classList.remove('hidden');
    
    // Update user info
    homeCurrentUserSpan.textContent = `Welcome, @${xUserData.username}!`;
    
    // Check if user has already submitted today
    checkDailySubmissionStatus();
}

async function showForum() {
    // Hide main content and home section
    document.querySelector('.main-content').style.display = 'none';
    homeSection.classList.add('hidden');
    
    // Show forum section
    forumSection.classList.remove('hidden');
    
    // Update user info
    currentUserSpan.textContent = `Welcome, @${xUserData.username}!`;
    
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
        const isCurrentUser = user.xHandle === xUserData.username;
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
                submitThreadBtn.disabled = true;
                submitThreadBtn.querySelector('.btn-text').textContent = 'Already Submitted Today';
            } else {
                submitThreadBtn.disabled = false;
                submitThreadBtn.querySelector('.btn-text').textContent = 'Submit Thread';
            }
        }
    } catch (error) {
        console.error('Error checking submission status:', error);
    }
}

async function handleThreadSubmission() {
    const tweetUrl = tweetUrlInput.value.trim();
    
    if (!tweetUrl) {
        showSubmissionStatus('Please enter a valid thread URL', 'error');
        return;
    }
    
    // Validate Twitter URL format
    const twitterRegex = /^https:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+$/;
    if (!twitterRegex.test(tweetUrl)) {
        showSubmissionStatus('Please enter a valid Twitter/X thread URL', 'error');
        return;
    }
    
    try {
        // Show loading state
        submitThreadBtn.disabled = true;
        const btnText = submitThreadBtn.querySelector('.btn-text');
        btnText.textContent = 'Submitting...';
        
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
            tweetUrlInput.value = '';
            submitThreadBtn.disabled = true;
            btnText.textContent = 'Already Submitted Today';
        } else {
            throw new Error(data.message || 'Failed to submit thread');
        }
        
    } catch (error) {
        console.error('Error submitting thread:', error);
        showSubmissionStatus(error.message || 'Failed to submit thread. Please try again.', 'error');
        
        // Reset button
        submitThreadBtn.disabled = false;
        submitThreadBtn.querySelector('.btn-text').textContent = 'Submit Thread';
    }
}

function extractTweetId(url) {
    const match = url.match(/\/status\/(\d+)/);
    return match ? match[1] : null;
}

function showSubmissionStatus(message, type) {
    submissionStatus.textContent = message;
    submissionStatus.className = `submission-status ${type}`;
    submissionStatus.classList.remove('hidden');
    
    // Auto-hide after 5 seconds for success/info messages
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            submissionStatus.classList.add('hidden');
        }, 5000);
    }
}

function showSubmissionSuccess() {
    // Create particle effect
    createSubmissionParticles();
    
    // Add success glow to button
    submitThreadBtn.style.background = 'linear-gradient(45deg, #00b894, #00a085)';
    submitThreadBtn.style.boxShadow = '0 0 30px rgba(0, 184, 148, 0.6)';
    
    // Reset after animation
    setTimeout(() => {
        submitThreadBtn.style.background = 'linear-gradient(45deg, #ffd700, #ffed4e)';
        submitThreadBtn.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.3)';
    }, 2000);
}

function createSubmissionParticles() {
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