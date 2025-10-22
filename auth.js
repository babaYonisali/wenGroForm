// Authentication and User Management Module
// Handles X/Twitter OAuth, user registration, and session management

// Global state for authentication
let currentUser = null;
let xUserData = null;

// DOM elements for authentication
const xLoginSection = document.getElementById('xLoginSection');
const userDataForm = document.getElementById('userDataForm');
const xLoginBtn = document.getElementById('xLoginBtn');
const userEntryForm = document.getElementById('userEntryForm');
const homeSection = document.getElementById('homeSection');
const currentUserSpan = document.getElementById('currentUser');
const homeCurrentUserSpan = document.getElementById('homeCurrentUser');
const xHandleInput = document.getElementById('xHandle');
const homeSignoutBtn = document.getElementById('homeSignoutBtn');

// Authentication functions
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
    // Show loading state
    showAuthorizationLoading();
    
    // Redirect to the new OAuth start endpoint
    window.location.href = '/auth/x/start';
}

function showXLoginSection() {
    xLoginSection.classList.remove('hidden');
    userDataForm.classList.add('hidden');
    homeSection.classList.add('hidden');
    
    const forumSection = document.getElementById('forumSection');
    if (forumSection) forumSection.classList.add('hidden');
    
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
    
    const forumSection = document.getElementById('forumSection');
    if (forumSection) forumSection.classList.add('hidden');
    
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
        
        const forumSection = document.getElementById('forumSection');
        if (forumSection) forumSection.classList.add('hidden');
        
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
    // Show main content and hide other sections
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.style.display = 'block';
    
    const forumSection = document.getElementById('forumSection');
    if (forumSection) forumSection.classList.add('hidden');
    
    // Hide leaderboard sections
    const leaderboardSection = document.getElementById('leaderboardSection');
    if (leaderboardSection) leaderboardSection.classList.add('hidden');
    
    const cotiLeaderboardSection = document.getElementById('cotiLeaderboardSection');
    if (cotiLeaderboardSection) cotiLeaderboardSection.classList.add('hidden');
    
    // Show home section
    if (homeSection) homeSection.classList.remove('hidden');
    
    // Update user info
    if (homeCurrentUserSpan && xUserData) {
        homeCurrentUserSpan.textContent = `Welcome, @${xUserData.username}!`;
    }
    
    // Check if user has already submitted today
    if (window.ThreadSubmissionModule) {
        window.ThreadSubmissionModule.checkDailySubmissionStatus();
    }
    // COTI campaign is complete, no need to check submission status
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

// Initialize authentication
function initializeAuth() {
    // Check if user is already authenticated
    checkAuthStatus();
    
    // Check for OAuth success parameters
    checkOAuthSuccess();
    
    // Add event listeners with null checks
    if (xLoginBtn) xLoginBtn.addEventListener('click', handleXLogin);
    if (userEntryForm) userEntryForm.addEventListener('submit', handleUserEntry);
    if (homeSignoutBtn) homeSignoutBtn.addEventListener('click', handleSignout);
}

// Export functions that other modules might need
window.AuthModule = {
    initializeAuth,
    showHome,
    showXLoginSection,
    getUserData: () => xUserData,
    getCurrentUser: () => currentUser
};
