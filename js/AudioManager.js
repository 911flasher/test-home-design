export class AudioManager {
    constructor() {
        this.masterVolume = 0.5;
        this.soundsEnabled = true;
        this.themeAudio = null;
        this.soundMap = {
            click: './sounds/click_003.mp3',
            theme: './sounds/theme.mp3',
            cow: './sounds/cow.mp3',
            sheep: './sounds/sheep.mp3',
            chicken: './sounds/chicken.mp3',
            place: './sounds/popup_chest.mp3'
        };

        this.initTheme();
    }

    initTheme() {
        this.themeAudio = new Audio(this.soundMap.theme);
        this.themeAudio.loop = true;
        this.themeAudio.preload = 'auto';
        this.themeAudio.volume = this.masterVolume * 0.22;

        document.addEventListener('click', () => {
            if (this.soundsEnabled) {
                this.playTheme();
            }
        }, { once: true });
    }

    playSound(soundPath, volumeMultiplier = 1) {
        if (!this.soundsEnabled) return;

        const audio = new Audio(soundPath);
        audio.preload = 'auto';
        audio.volume = Math.min(1, this.masterVolume * volumeMultiplier);
        audio.play().catch(() => {});
    }

    playClick() {
        this.playSound(this.soundMap.click, 0.8);
    }

    playPlacement(type) {
        const sound = this.soundMap[type] || this.soundMap.place;
        this.playSound(sound, 1);
    }

    playTheme() {
        if (!this.soundsEnabled || !this.themeAudio) return;

        this.themeAudio.volume = this.masterVolume * 0.22;
        this.themeAudio.play().catch(() => {});
    }

    toggleMute() {
        this.soundsEnabled = !this.soundsEnabled;

        if (this.themeAudio) {
            if (this.soundsEnabled) {
                this.playTheme();
            } else {
                this.themeAudio.pause();
                this.themeAudio.currentTime = 0;
            }
        }

        return !this.soundsEnabled;
    }

    isMuted() {
        return !this.soundsEnabled;
    }
}
