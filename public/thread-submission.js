// Thread Submission Module
// Handles thread submission for both Mavryk and COTI campaigns

// DOM elements for thread submission
const submitThreadBtn = document.getElementById('submitThreadBtn');
const tweetUrlInput = document.getElementById('tweetUrl');
const submissionStatus = document.getElementById('submissionStatus');
const submitCotiThreadBtn = document.getElementById('submitCotiThreadBtn');
const cotiTweetUrlInput = document.getElementById('cotiTweetUrl');
const cotiSubmissionStatus = document.getElementById('cotiSubmissionStatus');

// Thread submission functions
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

// Initialize thread submission functionality
function initializeThreadSubmission() {
    // Add event listeners
    if (submitThreadBtn) submitThreadBtn.addEventListener('click', handleThreadSubmission);
    if (submitCotiThreadBtn) submitCotiThreadBtn.addEventListener('click', handleCotiThreadSubmission);
}

// Export functions that other modules might need
window.ThreadSubmissionModule = {
    initializeThreadSubmission,
    checkDailySubmissionStatus,
    checkCotiDailySubmissionStatus
};
