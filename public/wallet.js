// Wallet (MetaMask) Module
// Handles EVM wallet connection and first-time linking to backend

(function() {
    async function connectMetaMask() {
        try {
            if (!window.ethereum || !window.ethereum.request) {
                window.showNotification && window.showNotification('MetaMask not detected', 'error');
                return;
            }

            // Request accounts
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const address = (accounts && accounts[0]) ? accounts[0] : null;
            if (!address) {
                window.showNotification && window.showNotification('No account selected', 'error');
                return;
            }

            // Send to backend to save on first connect
            const response = await fetch('/api/wallet/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ walletAddress: address })
            });

            const data = await response.json().catch(() => ({}));

            if (response.status === 201) {
                window.showNotification && window.showNotification('Wallet linked successfully');
                updateButtonLinked(address);
            } else if (response.ok && data.alreadyConnected) {
                window.showNotification && window.showNotification('Wallet already linked');
                updateButtonLinked(data.walletAddress || address);
            } else if (response.status === 409) {
                window.showNotification && window.showNotification('Wallet already linked to another account', 'error');
            } else {
                window.showNotification && window.showNotification(data.message || 'Failed to link wallet', 'error');
            }
        } catch (err) {
            console.error('MetaMask connect error:', err);
            window.showNotification && window.showNotification('Wallet connection failed', 'error');
        }
    }

    function updateButtonLinked(address) {
        const connectBtn = document.getElementById('connectWalletBtn');
        if (!connectBtn) return;
        connectBtn.disabled = true;
        connectBtn.style.opacity = '0.8';
        // Make it shorter to fit the 120px button width
        const short = address.substring(0, 4) + '...' + address.substring(address.length - 3);
        const label = connectBtn.querySelector('.btn-text');
        if (label) label.textContent = short; // Just show the address, not "Connected:"
    }

    function initializeWalletModule() {
        // Get the button each time since it might not exist when this runs
        const connectBtn = document.getElementById('connectWalletBtn');
        if (connectBtn) {
            connectBtn.addEventListener('click', connectMetaMask);
        }
    }

    // Expose for other modules if needed
    window.WalletModule = {
        initializeWalletModule,
        connectMetaMask
    };

    // Initialize after DOM loaded (script is at end of body but be safe)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWalletModule);
    } else {
        initializeWalletModule();
    }
})();


