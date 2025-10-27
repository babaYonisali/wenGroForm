// Main Application Script
// Coordinates all modules and handles shared functionality

// Make showNotification available globally for other modules
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

// Make it available globally immediately
window.showNotification = showNotification;

// DOM elements for navigation and shared UI
const communityBtn = document.getElementById('communityBtn');
const backToHomeBtn = document.getElementById('backToHomeBtn');
const forumSection = document.getElementById('forumSection');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Add a small delay to ensure all modules are loaded
    setTimeout(initializeApp, 100);
});

function initializeApp() {
    console.log('Initializing app...');
    
    // Initialize all modules with better error handling
    if (window.AuthModule) {
        console.log('Initializing AuthModule...');
        window.AuthModule.initializeAuth();
    } else {
        console.error('AuthModule not found!');
    }
    
    if (window.ThreadSubmissionModule) {
        console.log('Initializing ThreadSubmissionModule...');
        window.ThreadSubmissionModule.initializeThreadSubmission();
    } else {
        console.error('ThreadSubmissionModule not found!');
    }
    
    if (window.LeaderboardModule) {
        console.log('Initializing LeaderboardModule...');
        window.LeaderboardModule.initializeLeaderboard();
    } else {
        console.error('LeaderboardModule not found!');
    }
    
    if (window.SpinWheelModule) {
        console.log('Initializing SpinWheelModule...');
        window.SpinWheelModule.initializeSpinWheelModule();
    } else {
        console.error('SpinWheelModule not found!');
    }
    
    // Add shared event listeners
    if (communityBtn) communityBtn.addEventListener('click', showForum);
    if (backToHomeBtn) backToHomeBtn.addEventListener('click', () => {
        if (window.AuthModule) {
            window.AuthModule.showHome();
        }
    });
    
    // Add input focus effects
    addInputEffects();
    
    // Add crypto-themed easter eggs
    initializeEasterEggs();
}

async function showForum() {
    // Hide main content and home section
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.style.display = 'none';
    if (window.AuthModule && window.AuthModule.getUserData()) {
        const homeSection = document.getElementById('homeSection');
        if (homeSection) homeSection.classList.add('hidden');
    }
    
    // Show forum section
    if (forumSection) forumSection.classList.remove('hidden');
    
    // Update user info
    const currentUserSpan = document.getElementById('currentUser');
    if (currentUserSpan && window.AuthModule) {
        const userData = window.AuthModule.getUserData();
        if (userData) {
            currentUserSpan.textContent = `Welcome, @${userData.username}!`;
        }
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
        const isCurrentUser = window.AuthModule && window.AuthModule.getUserData() && 
                             user.xHandle === window.AuthModule.getUserData().username;
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
function initializeEasterEggs() {
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
}

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
