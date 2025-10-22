// Spin Wheel Module
// Handles the spin wheel functionality with animations and result calculations

// Spin Wheel state
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

async function loadLeaderboardForWheel(retryCount = 0, maxRetries = 3) {
    const baseDelay = 1000; // 1 second base delay
    const maxDelay = 10000; // 10 seconds max delay
    
    try {
        console.log(`Attempting to load leaderboard data for wheel... (attempt ${retryCount + 1}/${maxRetries + 1})`);
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
        console.error(`Error loading leaderboard for wheel (attempt ${retryCount + 1}):`, error);
    }
    
    // If we haven't exceeded max retries, retry with exponential backoff
    if (retryCount < maxRetries) {
        const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
        console.log(`Retrying in ${delay}ms... (attempt ${retryCount + 2}/${maxRetries + 1})`);
        
        setTimeout(() => {
            loadLeaderboardForWheel(retryCount + 1, maxRetries);
        }, delay);
        return;
    }
    
    // Fallback to equal sections if all retries failed
    console.log('All retry attempts failed, using fallback: creating equal sections wheel');
    createEqualSectionsWheel();
}

function createProportionalWheel(data) {
    if (!data || data.length === 0) {
        createEqualSectionsWheel();
        return;
    }
    
    // Normalize the data to favor higher performers
    const impressions = data.map(entry => entry.totalImpressions || 0);
    const minImpressions = Math.min(...impressions);
    const maxImpressions = Math.max(...impressions);
    
    console.log('Raw impressions range:', minImpressions, 'to', maxImpressions);
    
    // Apply balanced normalization that moderately favors higher performers
    const normalizedData = data.map(entry => {
        const rawValue = entry.totalImpressions || 0;
        // Use square root for moderate advantage to higher performers
        // This gives some advantage but not too extreme
        const balancedValue = Math.sqrt(rawValue) + Math.sqrt(minImpressions);
        return {
            ...entry,
            normalizedValue: balancedValue
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

// Initialize spin wheel functionality
function initializeSpinWheelModule() {
    initializeSpinWheel();
}

// Export functions that other modules might need
window.SpinWheelModule = {
    initializeSpinWheelModule
};
