// Application state
let currentUser = null;

// DOM elements
const userEntryForm = document.getElementById('userEntryForm');
const forumSection = document.getElementById('forumSection');
const currentUserSpan = document.getElementById('currentUser');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Add form submission handler
    userEntryForm.addEventListener('submit', handleUserEntry);
    
    // Add input focus effects
    addInputEffects();
}

async function handleUserEntry(e) {
    e.preventDefault();
    
    const formData = new FormData(userEntryForm);
    const xHandle = formData.get('xHandle').trim();
    const telegramHandle = formData.get('telegramHandle').trim();
    const referrerHandle = formData.get('referrerHandle').trim();
    
    // Validate required fields
    if (!xHandle || !telegramHandle) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        // Show loading state
        const submitBtn = userEntryForm.querySelector('.submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        btnText.textContent = 'Registering...';
        submitBtn.disabled = true;
        
        // Send data to backend with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                xHandle: xHandle,
                telegramHandle: telegramHandle,
                xHandleReferral: referrerHandle || null
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }
        
        // Create user object from response
        currentUser = {
            id: data.data._id,
            xHandle: data.data.xHandle,
            telegramHandle: data.data.telegramHandle,
            xHandleReferral: data.data.xHandleReferral,
            joinTime: data.data.joinTime
        };
        
        // Store user data locally
        localStorage.setItem('wengroUser', JSON.stringify(currentUser));
        
        // Show success animation
        showEntryAnimation();
        
        // Switch to forum view
        setTimeout(() => {
            showForum();
        }, 1500);
        
    } catch (error) {
        console.error('Registration error:', error);
        
        let errorMessage = 'Registration failed. Please try again.';
        
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showNotification(errorMessage, 'error');
        
        // Reset button
        const submitBtn = userEntryForm.querySelector('.submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        btnText.textContent = 'Join Greenhouse';
        submitBtn.disabled = false;
    }
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

async function showForum() {
    // Hide main content
    document.querySelector('.main-content').style.display = 'none';
    
    // Show forum section
    forumSection.classList.remove('hidden');
    
    // Update user info
    currentUserSpan.textContent = `Welcome, ${currentUser.xHandle}!`;
    
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
                <div class="message-content">Congratulations! You are now part of the WenGro Greenhouse! 🌱</div>
            </div>
        `;
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
            <div class="message-content">Congratulations! You are now part of the WenGro Greenhouse! 🌱</div>
        </div>
    `;
    
    // Add header for the community
    html += `
        <div class="message">
            <div class="message-header">
                <span class="message-author system-author">Community</span>
                <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="message-content">🌱 <strong>WenGro Greenhouse Members (${users.length})</strong></div>
        </div>
    `;
    
    // Add each user
    users.forEach((user, index) => {
        const joinDate = new Date(user.joinTime).toLocaleDateString();
        const isCurrentUser = user.xHandle === currentUser.xHandle;
        const userClass = isCurrentUser ? 'user-author' : 'message-author';
        const highlight = isCurrentUser ? '⭐ ' : '';
        
        html += `
            <div class="message">
                <div class="message-header">
                    <span class="${userClass}">${highlight}@${user.xHandle}</span>
                    <span class="message-time">${joinDate}</span>
                </div>
                <div class="message-content">
                    📱 @${user.telegramHandle}
                    ${user.xHandleReferral ? `<br>👥 Referred by: @${user.xHandleReferral}` : ''}
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