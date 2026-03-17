export class UIController {
    constructor(itemManager) {
        this.itemManager = itemManager;
        this.currentCategory = null;
        this.selectedItem = null;
        this.itemCount = 0;
        this.notificationContainer = document.getElementById('pointerNotifications');
        
        this.onItemSelect = null;
    }
    
    showCategory(category, i18n) {
        this.currentCategory = category;
        const items = this.itemManager.getItemsByCategory(category);
        this.renderItemButtons(items, category, i18n);
    }
    
    renderItemButtons(items, category, i18n) {
        const container = document.getElementById('itemsContainer');
        container.innerHTML = '';
        container.classList.add('active');
        
        const emojis = {
            corn: '🌽',
            grape: '🍇',
            strawberry: '🍓',
            tomato: '🍅',
            bench: '🪑',
            fence: '🚧',
            pot: '🪴',
            cow: '🐄',
            sheep: '🐑',
            chicken: '🐔'
        };
        
        items.forEach(item => {
            const button = document.createElement('button');
            button.className = 'item-btn';
            button.title = i18n.get(item.type);
            button.textContent = emojis[item.type] || '🌳';
            button.style.fontSize = '40px';
            
            button.addEventListener('click', (event) => {
                document.querySelectorAll('.item-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });
                button.classList.add('selected');
                this.selectedItem = item;

                this.showPointerNotification(
                    event.clientX,
                    event.clientY,
                    `${emojis[item.type] || '✨'} ${i18n.get(item.type)}`,
                    'success'
                );
                
                if (this.onItemSelect) {
                    this.onItemSelect(category, item.type);
                }
            });
            
            container.appendChild(button);
        });
    }
    
    updateItemCount() {
        this.itemCount++;
        const label = document.getElementById('infoLabel');
        if (label) {
            label.textContent = `Items placed: ${this.itemCount}`;
        }
    }
    
    getSelectedItem() {
        return this.selectedItem;
    }

    showPointerNotification(x, y, message, type = 'info') {
        if (!this.notificationContainer) return;

        const note = document.createElement('div');
        note.className = `pointer-note ${type}`;
        note.textContent = message;
        note.style.left = `${x}px`;
        note.style.top = `${y}px`;

        this.notificationContainer.appendChild(note);

        window.setTimeout(() => {
            note.remove();
        }, 1000);
    }

    setMuteButtonState(isMuted, i18n) {
        const muteBtn = document.getElementById('muteBtn');
        if (!muteBtn) return;

        muteBtn.textContent = isMuted ? '🔇' : '🔊';
        muteBtn.classList.toggle('muted', isMuted);
        muteBtn.setAttribute('aria-label', isMuted ? i18n.get('unmute') : i18n.get('mute'));
        muteBtn.title = isMuted ? i18n.get('unmute') : i18n.get('mute');
    }
}
