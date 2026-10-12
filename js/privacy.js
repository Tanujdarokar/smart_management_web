const CONSENT_KEY = 'smarttask_privacy_consent';

function appendLegalFooter() {
    if (document.querySelector('.site-legal-footer')) return;

    const footer = document.createElement('footer');
    footer.className = 'site-legal-footer';
    footer.innerHTML = '<a href="privacy.html">Privacy Policy</a><a href="terms.html">Terms and Conditions</a><button class="site-privacy-manage" type="button">Privacy choices</button>';
    const manageButton = footer.querySelector('.site-privacy-manage');
    manageButton.addEventListener('click', () => {
        try {
            localStorage.removeItem(CONSENT_KEY);
        } catch (error) {
            console.error('Unable to reset privacy preferences.', error);
            manageButton.textContent = 'Could not reset privacy choices';
            return;
        }
        document.querySelector('.consent-banner')?.remove();
        document.body.classList.remove('has-consent-banner');
        showConsentBanner();
    });
    document.body.append(footer);
}

function saveConsent(analytics) {
    try {
        localStorage.setItem(CONSENT_KEY, JSON.stringify({
            necessary: true,
            analytics,
            updatedAt: new Date().toISOString()
        }));
        return true;
    } catch (error) {
        console.error('Unable to save privacy preferences.', error);
        return false;
    }
}

function showConsentBanner() {
    let consent;
    try {
        consent = localStorage.getItem(CONSENT_KEY);
    } catch (error) {
        console.error('Unable to read privacy preferences.', error);
    }
    if (consent) return;

    const banner = document.createElement('section');
    banner.className = 'consent-banner';
    banner.setAttribute('aria-label', 'Privacy preferences');
    banner.innerHTML = `
        <p>Your workspace stays in this browser. No tracking cookies are active, and optional analytics are not configured. <a href="privacy.html">Privacy Policy</a></p>
        <p class="consent-error" role="alert" hidden></p>
        <div class="consent-actions">
            <button type="button" data-analytics="false">Reject optional</button>
            <button type="button" data-analytics="true">Allow analytics</button>
        </div>`;

    banner.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-analytics]');
        if (!button) return;
        if (saveConsent(button.dataset.analytics === 'true')) {
            banner.remove();
            document.body.classList.remove('has-consent-banner');
        } else {
            const errorMessage = banner.querySelector('.consent-error');
            errorMessage.hidden = false;
            errorMessage.textContent = 'Your choice could not be saved. Please enable browser storage and try again.';
        }
    });

    document.body.append(banner);
    document.body.classList.add('has-consent-banner');
}

function initPrivacyControls() {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'css/privacy.css';
    document.head.append(stylesheet);

    appendLegalFooter();
    showConsentBanner();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPrivacyControls, { once: true });
} else {
    initPrivacyControls();
}
