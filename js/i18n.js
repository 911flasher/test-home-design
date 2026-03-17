export class I18n {
    constructor() {
        this.currentLanguage = localStorage.getItem('gardenMakeover_language') || 'en';
        this.translations = {
            en: {
                title: 'GardenMakeover',
                day: '☀️ Day',
                night: '🌙 Night',
                clickToPlace: 'Click on garden area to place items',
                selected: 'Selected: {type} - Click garden to place',
                tutorial_title: 'Welcome to GardenMakeover! 🌻',
                tutorial_line1: '1. Choose a category (Plants, Furniture, Animals)',
                tutorial_line2: '2. Select an item',
                tutorial_line3: '3. Click on the garden area to place it',
                tutorial_line4: '4. Try the Day/Night toggle!',
                tutorial_button: 'Start!',
                plants: '🌱 Plants',
                furniture: '🪑 Furniture',
                animals: '🐄 Animals',
                download: '📥 Download App',
                downloadMessage: 'Thank you for your interest! Download GardenMakeover on App Store or Google Play!',
                items: '📊 Items',
                plantsCount: '🌱 Plants',
                furnitureCount: '🪑 Furniture',
                animalsCount: '🐄 Animals',
                language: '🌐 Language',
                mute: 'Mute sound',
                unmute: 'Unmute sound',
                cameraReady: 'Camera updated',
                categorySelected: '{category} opened',
                placed: '{type} placed',
                selectItemHint: 'Choose an item first',
                soundMuted: 'Sound muted',
                soundUnmuted: 'Sound on',
                modeDay: 'Day mode',
                modeNight: 'Night mode',
                langChangedEn: 'English selected',
                langChangedRu: 'Russian selected',
                // Item names
                corn: 'Corn',
                grape: 'Grape',
                strawberry: 'Strawberry',
                tomato: 'Tomato',
                bench: 'Bench',
                fence: 'Fence',
                pot: 'Pot',
                cow: 'Cow',
                sheep: 'Sheep',
                chicken: 'Chicken'
            },
            ru: {
                title: 'ГарденМакeover',
                day: '☀️ День',
                night: '🌙 Ночь',
                clickToPlace: 'Нажмите на комнату сада, чтобы разместить предметы',
                selected: 'Выбран: {type} - Щелкните сад для размещения',
                tutorial_title: 'Добро пожаловать в GardenMakeover! 🌻',
                tutorial_line1: '1. Выберите категорию (Растения, Мебель, Животные)',
                tutorial_line2: '2. Выберите предмет',
                tutorial_line3: '3. Нажмите на садовую зону, чтобы разместить его',
                tutorial_line4: '4. Попробуйте переключатель День/Ночь!',
                tutorial_button: 'Начать!',
                plants: '🌱 Растения',
                furniture: '🪑 Мебель',
                animals: '🐄 Животные',
                download: '📥 Скачать Приложение',
                downloadMessage: 'Спасибо за ваш интерес! Скачайте GardenMakeover из App Store или Google Play!',
                items: '📊 Предметы',
                plantsCount: '🌱 Растения',
                furnitureCount: '🪑 Мебель',
                animalsCount: '🐄 Животные',
                language: '🌐 Язык',
                mute: 'Выключить звук',
                unmute: 'Включить звук',
                cameraReady: 'Камера обновлена',
                categorySelected: 'Открыто: {category}',
                placed: '{type} размещен',
                selectItemHint: 'Сначала выберите объект',
                soundMuted: 'Звук выключен',
                soundUnmuted: 'Звук включен',
                modeDay: 'Дневной режим',
                modeNight: 'Ночной режим',
                langChangedEn: 'Выбран английский',
                langChangedRu: 'Выбран русский',
                // Item names
                corn: 'Кукуруза',
                grape: 'Виноград',
                strawberry: 'Клубника',
                tomato: 'Помидор',
                bench: 'Скамья',
                fence: 'Забор',
                pot: 'Горшок',
                cow: 'Корова',
                sheep: 'Овца',
                chicken: 'Курица'
            }
        };
    }
    
    get(key, params = {}) {
        const translation = this.translations[this.currentLanguage][key] || key;
        
        // Replace parameters
        let result = translation;
        Object.entries(params).forEach(([param, value]) => {
            result = result.replace(`{${param}}`, value);
        });
        
        return result;
    }
    
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            localStorage.setItem('gardenMakeover_language', lang);
            return true;
        }
        return false;
    }
    
    getLanguage() {
        return this.currentLanguage;
    }
    
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }
}
