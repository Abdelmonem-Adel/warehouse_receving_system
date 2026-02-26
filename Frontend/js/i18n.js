const i18n = {
    currentLang: localStorage.getItem('lang') || 'ar',
    translations: {},

    async init() {
        await this.loadTranslations(this.currentLang);
        this.updateDOM();
        this.updateLayout();
    },

    async loadTranslations(lang) {
        try {
            const response = await fetch(`./i18n/${lang}.json`);
            this.translations = await response.json();
        } catch (error) {
            console.error('Error loading translations:', error);
        }
    },

    updateDOM() {
        // Update document title
        if (this.translations.title) {
            document.title = this.translations.title;
        }

        // Update elements with data-i18n key
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (this.translations[key]) {
                if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'password' || el.type === 'email')) {
                    el.placeholder = this.translations[key];
                } else {
                    el.textContent = this.translations[key];
                }
            }
        });
    },

    updateLayout() {
        const html = document.documentElement;
        if (this.currentLang === 'ar') {
            html.setAttribute('lang', 'ar');
            html.setAttribute('dir', 'rtl');
            document.body.style.fontFamily = "'Cairo', sans-serif";
        } else {
            html.setAttribute('lang', 'en');
            html.setAttribute('dir', 'ltr');
            document.body.style.fontFamily = "'Inter', sans-serif";
        }
    },

    async switchLanguage(lang) {
        if (lang === this.currentLang) return;
        this.currentLang = lang;
        localStorage.setItem('lang', lang);
        await this.loadTranslations(lang);
        this.updateDOM();
        this.updateLayout();
    },

    t(key) {
        return this.translations[key] || key;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    i18n.init();
});
