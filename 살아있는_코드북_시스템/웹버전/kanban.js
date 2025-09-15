// 칸반 스타일 작업 관리 보드
class KanbanBoard {
    constructor(containerId, cards) {
        this.container = document.getElementById(containerId);
        this.cards = cards;
        this.kanbanCards = new Map();
        
        this.columns = {
            'todo': { title: '할 일', element: null },
            'in-progress': { title: '진행 중', element: null },
            'review': { title: '검토 중', element: null },
            'done': { title: '완료', element: null }
        };
        
        this.draggedCard = null;
        this.init();
    }
    
    init() {
        this.createKanbanCards();
        this.setupEventListeners();
        this.renderBoard();
    }
    
    createKanbanCards() {
        const statusMapping = {
            'add': 'done',
            'subtract': 'done', 
            'multiply': 'done',
            'divide': 'review',
            'main': 'in-progress',
            'interactive_calculator': 'todo'
        };
        
        this.cards.forEach(card => {
            const kanbanCard = {
                id: card.id,
                title: card.name,
                description: card.description,
                status: statusMapping[card.id] || 'todo',
                priority: card.priority || 'normal',
                tags: card.tags || [],
                assignee: 'Developer',
                dueDate: this.getRandomDueDate(),
                lineNumber: card.lineNumber,
                filePath: card.filePath,
                estimatedTime: this.estimateTime(card.complexity),
                actualTime: null,
                createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
            };
            
            this.kanbanCards.set(card.id, kanbanCard);
        });
        
        // Add some additional task cards
        const additionalTasks = [
            {
                id: 'input-validation',
                title: '입력값 검증 추가',
                description: '모든 함수에 타입 체크와 입력값 검증 로직 추가',
                status: 'todo',
                priority: 'high',
                tags: ['품질개선', '안정성'],
                assignee: 'QA Team',
                dueDate: this.getFutureDateDays(7),
                lineNumber: 0,
                filePath: '전체 파일',
                estimatedTime: '4시간',
                actualTime: null,
                createdAt: new Date()
            },
            {
                id: 'error-handling',
                title: '에러 처리 개선',
                description: '더 자세한 에러 메시지와 복구 로직 구현',
                status: 'todo',
                priority: 'medium',
                tags: ['안정성', '사용성'],
                assignee: 'Backend Team',
                dueDate: this.getFutureDateDays(14),
                lineNumber: 0,
                filePath: 'simple_calculator.py',
                estimatedTime: '6시간',
                actualTime: null,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                id: 'gui-version',
                title: 'GUI 계산기 구현',
                description: 'tkinter를 사용한 그래픽 사용자 인터페이스 버전 개발',
                status: 'todo',
                priority: 'low',
                tags: ['새기능', 'UI'],
                assignee: 'Frontend Team',
                dueDate: this.getFutureDateDays(30),
                lineNumber: 0,
                filePath: 'calculator_gui.py',
                estimatedTime: '16시간',
                actualTime: null,
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
        ];
        
        additionalTasks.forEach(task => {
            this.kanbanCards.set(task.id, task);
        });
    }
    
    getRandomDueDate() {
        const now = new Date();
        const daysAhead = Math.floor(Math.random() * 21) + 1; // 1-21 days
        return new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    }
    
    getFutureDateDays(days) {
        const now = new Date();
        return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    }
    
    estimateTime(complexity) {
        const timeMap = {
            'low': '2시간',
            'medium': '4시간',
            'high': '8시간'
        };
        return timeMap[complexity] || '2시간';
    }
    
    setupEventListeners() {
        // Add card button (if exists)
        const addButton = document.getElementById('addKanbanCard');
        if (addButton) {
            addButton.addEventListener('click', () => this.showAddCardDialog());
        }
    }
    
    renderBoard() {
        // Clear existing content
        Object.keys(this.columns).forEach(status => {
            const columnElement = document.querySelector(`[data-status="${status}"] .column-content`);
            if (columnElement) {
                this.columns[status].element = columnElement;
                columnElement.innerHTML = '';
                
                // Setup drop zone
                this.setupDropZone(columnElement, status);
            }
        });
        
        // Render cards in their respective columns
        this.kanbanCards.forEach(card => {
            this.renderCard(card);
        });
        
        // Update column counts
        this.updateColumnCounts();
    }
    
    renderCard(card) {
        const columnElement = this.columns[card.status]?.element;
        if (!columnElement) return;
        
        const cardElement = document.createElement('div');
        cardElement.className = 'kanban-card';
        cardElement.draggable = true;
        cardElement.dataset.cardId = card.id;
        
        const priorityIcon = this.getPriorityIcon(card.priority);
        const priorityClass = card.priority;
        const formattedDueDate = this.formatDate(card.dueDate);
        const isOverdue = card.dueDate < new Date();
        
        cardElement.innerHTML = `
            <div class="kanban-card-header">
                <div class="kanban-card-title">${card.title}</div>
                <div class="kanban-priority ${priorityClass}">${priorityIcon}</div>
            </div>
            <div class="kanban-card-body">
                <p class="kanban-card-description">${card.description}</p>
                <div class="kanban-card-meta">
                    <div class="kanban-meta-item">
                        <i class="fas fa-file-code"></i>
                        <span>${card.filePath}${card.lineNumber > 0 ? `:${card.lineNumber}` : ''}</span>
                    </div>
                    <div class="kanban-meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${card.estimatedTime}</span>
                    </div>
                    <div class="kanban-meta-item ${isOverdue ? 'overdue' : ''}">
                        <i class="fas fa-calendar-alt"></i>
                        <span>${formattedDueDate}</span>
                    </div>
                </div>
                <div class="kanban-card-tags">
                    ${card.tags.map(tag => `<span class="kanban-tag">${tag}</span>`).join('')}
                </div>
                <div class="kanban-card-footer">
                    <div class="kanban-assignee">
                        <i class="fas fa-user"></i>
                        <span>${card.assignee}</span>
                    </div>
                    <div class="kanban-actions">
                        <button class="kanban-action-btn" onclick="kanbanBoard.editCard('${card.id}')" title="편집">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="kanban-action-btn" onclick="kanbanBoard.deleteCard('${card.id}')" title="삭제">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add drag event listeners
        cardElement.addEventListener('dragstart', (e) => this.handleDragStart(e, card));
        cardElement.addEventListener('dragend', (e) => this.handleDragEnd(e));
        cardElement.addEventListener('click', (e) => this.handleCardClick(e, card));
        
        columnElement.appendChild(cardElement);
    }
    
    getPriorityIcon(priority) {
        const icons = {
            'low': '↓',
            'normal': '•',
            'medium': '→',
            'high': '↑',
            'critical': '⚠'
        };
        return icons[priority] || '•';
    }
    
    formatDate(date) {
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return `${Math.abs(diffDays)}일 지남`;
        } else if (diffDays === 0) {
            return '오늘';
        } else if (diffDays === 1) {
            return '내일';
        } else if (diffDays <= 7) {
            return `${diffDays}일 후`;
        } else {
            return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
        }
    }
    
    setupDropZone(columnElement, status) {
        columnElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            columnElement.classList.add('drag-over');
        });
        
        columnElement.addEventListener('dragleave', (e) => {
            if (!columnElement.contains(e.relatedTarget)) {
                columnElement.classList.remove('drag-over');
            }
        });
        
        columnElement.addEventListener('drop', (e) => {
            e.preventDefault();
            columnElement.classList.remove('drag-over');
            
            if (this.draggedCard && this.draggedCard.status !== status) {
                this.moveCard(this.draggedCard.id, status);
            }
        });
    }
    
    handleDragStart(e, card) {
        this.draggedCard = card;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
        e.target.style.opacity = '0.5';
    }
    
    handleDragEnd(e) {
        e.target.style.opacity = '1';
        this.draggedCard = null;
        
        // Remove drag-over classes
        document.querySelectorAll('.column-content').forEach(col => {
            col.classList.remove('drag-over');
        });
    }
    
    handleCardClick(e, card) {
        if (e.target.closest('.kanban-actions')) return;
        
        this.showCardDetails(card);
    }
    
    moveCard(cardId, newStatus) {
        const card = this.kanbanCards.get(cardId);
        if (!card) return;
        
        const oldStatus = card.status;
        card.status = newStatus;
        
        // Add activity log
        this.addActivityLog(card, `상태 변경: ${this.columns[oldStatus].title} → ${this.columns[newStatus].title}`);
        
        // Re-render the board
        this.renderBoard();
        
        // Show notification
        this.showNotification(`"${card.title}" 카드가 "${this.columns[newStatus].title}"(으)로 이동되었습니다.`);
        
        // Update progress
        this.updateProgress();
    }
    
    updateColumnCounts() {
        Object.keys(this.columns).forEach(status => {
            const count = Array.from(this.kanbanCards.values()).filter(card => card.status === status).length;
            const countElement = document.querySelector(`[data-status="${status}"] .column-count`);
            if (countElement) {
                countElement.textContent = count;
            }
        });
    }
    
    showCardDetails(card) {
        // Create modal for card details
        const modal = document.createElement('div');
        modal.className = 'card-detail-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${card.title}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="card-detail-section">
                            <h4>설명</h4>
                            <p>${card.description}</p>
                        </div>
                        
                        <div class="card-detail-grid">
                            <div class="card-detail-item">
                                <strong>상태:</strong>
                                <span class="status-badge status-${card.status}">${this.columns[card.status].title}</span>
                            </div>
                            <div class="card-detail-item">
                                <strong>우선순위:</strong>
                                <span class="priority-badge priority-${card.priority}">
                                    ${this.getPriorityIcon(card.priority)} ${card.priority.toUpperCase()}
                                </span>
                            </div>
                            <div class="card-detail-item">
                                <strong>담당자:</strong>
                                <span>${card.assignee}</span>
                            </div>
                            <div class="card-detail-item">
                                <strong>마감일:</strong>
                                <span>${this.formatDate(card.dueDate)}</span>
                            </div>
                            <div class="card-detail-item">
                                <strong>예상 시간:</strong>
                                <span>${card.estimatedTime}</span>
                            </div>
                            <div class="card-detail-item">
                                <strong>파일 위치:</strong>
                                <span>${card.filePath}${card.lineNumber > 0 ? `:${card.lineNumber}` : ''}</span>
                            </div>
                        </div>
                        
                        <div class="card-detail-section">
                            <h4>태그</h4>
                            <div class="tag-list">
                                ${card.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                        </div>
                        
                        <div class="card-detail-actions">
                            <button class="btn btn-primary" onclick="kanbanBoard.editCard('${card.id}')">편집</button>
                            <button class="btn btn-secondary" onclick="kanbanBoard.viewCode('${card.id}')">코드 보기</button>
                            <button class="btn btn-danger" onclick="kanbanBoard.deleteCard('${card.id}')">삭제</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal events
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target === modal.querySelector('.modal-overlay')) {
                document.body.removeChild(modal);
            }
        });
    }
    
    editCard(cardId) {
        const card = this.kanbanCards.get(cardId);
        if (!card) return;
        
        // Simple edit dialog (in a real app, this would be more sophisticated)
        const newTitle = prompt('제목 수정:', card.title);
        if (newTitle && newTitle !== card.title) {
            card.title = newTitle;
            this.renderBoard();
            this.showNotification(`"${card.title}" 카드가 수정되었습니다.`);
        }
    }
    
    deleteCard(cardId) {
        const card = this.kanbanCards.get(cardId);
        if (!card) return;
        
        if (confirm(`"${card.title}" 카드를 삭제하시겠습니까?`)) {
            this.kanbanCards.delete(cardId);
            this.renderBoard();
            this.showNotification(`"${card.title}" 카드가 삭제되었습니다.`);
        }
    }
    
    viewCode(cardId) {
        // Close modal first
        const modal = document.querySelector('.card-detail-modal');
        if (modal) {
            document.body.removeChild(modal);
        }
        
        // Close kanban modal
        document.getElementById('kanbanModal').classList.remove('active');
        
        // Select card in main app
        if (window.codebook) {
            window.codebook.selectCard(cardId);
        }
    }
    
    addActivityLog(card, activity) {
        if (!card.activityLog) {
            card.activityLog = [];
        }
        
        card.activityLog.push({
            timestamp: new Date(),
            activity: activity,
            user: 'Current User'
        });
    }
    
    updateProgress() {
        const total = this.kanbanCards.size;
        const done = Array.from(this.kanbanCards.values()).filter(card => card.status === 'done').length;
        const progress = Math.round((done / total) * 100);
        
        // Update progress indicator if exists
        const progressElement = document.getElementById('kanbanProgress');
        if (progressElement) {
            progressElement.textContent = `${progress}% 완료 (${done}/${total})`;
        }
    }
    
    showNotification(message) {
        // Use main app's toast system if available
        if (window.codebook && window.codebook.showToast) {
            window.codebook.showToast(message, 'info');
        } else {
            // Fallback notification
            console.log('Kanban Notification:', message);
        }
    }
    
    // Public API methods
    addCard(cardData) {
        const newCard = {
            id: 'custom-' + Date.now(),
            title: cardData.title || 'New Task',
            description: cardData.description || '',
            status: cardData.status || 'todo',
            priority: cardData.priority || 'normal',
            tags: cardData.tags || [],
            assignee: cardData.assignee || 'Unassigned',
            dueDate: cardData.dueDate || this.getFutureDateDays(7),
            lineNumber: cardData.lineNumber || 0,
            filePath: cardData.filePath || '',
            estimatedTime: cardData.estimatedTime || '2시간',
            actualTime: null,
            createdAt: new Date()
        };
        
        this.kanbanCards.set(newCard.id, newCard);
        this.renderBoard();
        this.showNotification(`새 카드 "${newCard.title}"가 추가되었습니다.`);
        
        return newCard.id;
    }
    
    filterCards(criteria) {
        // Implementation for filtering cards by various criteria
        // This could be used for search, priority filter, assignee filter, etc.
    }
    
    exportBoard() {
        const exportData = {
            boardName: 'Living Codebook Kanban',
            exportDate: new Date().toISOString(),
            cards: Array.from(this.kanbanCards.values()),
            columnConfig: this.columns
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'kanban-board.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('칸반 보드가 내보내기되었습니다.');
    }
}

// Add CSS for kanban-specific styles
const kanbanCSS = `
.column-content.drag-over {
    background-color: rgba(59, 130, 246, 0.1);
    border: 2px dashed #3b82f6;
}

.kanban-card {
    margin-bottom: 0.75rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kanban-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.kanban-card-body {
    padding: 0.75rem;
}

.kanban-card-description {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 0.75rem;
    line-height: 1.4;
}

.kanban-card-meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
}

.kanban-meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-muted);
}

.kanban-meta-item.overdue {
    color: var(--danger-color);
}

.kanban-meta-item i {
    width: 12px;
    font-size: 0.7rem;
}

.kanban-card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
}

.kanban-tag {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.7rem;
    font-weight: 500;
}

.kanban-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--text-muted);
}

.kanban-assignee {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.kanban-actions {
    display: flex;
    gap: 0.25rem;
}

.kanban-action-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: all 0.2s ease;
}

.kanban-action-btn:hover {
    background: var(--card-hover);
    color: var(--text-primary);
}

.card-detail-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2000;
}

.modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
}

.card-detail-section {
    margin-bottom: 1.5rem;
}

.card-detail-section h4 {
    margin-bottom: 0.5rem;
    color: var(--primary-color);
}

.card-detail-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.card-detail-item strong {
    color: var(--text-primary);
    display: block;
    margin-bottom: 0.25rem;
}

.status-badge, .priority-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
}

.status-todo { background: rgba(107, 114, 128, 0.2); color: var(--text-muted); }
.status-in-progress { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
.status-review { background: rgba(245, 158, 11, 0.2); color: var(--warning-color); }
.status-done { background: rgba(16, 185, 129, 0.2); color: var(--success-color); }

.priority-low { background: rgba(107, 114, 128, 0.2); color: var(--text-muted); }
.priority-normal { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
.priority-medium { background: rgba(245, 158, 11, 0.2); color: var(--warning-color); }
.priority-high { background: rgba(245, 158, 11, 0.2); color: var(--warning-color); }
.priority-critical { background: rgba(239, 68, 68, 0.2); color: var(--danger-color); }

.tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.tag {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.8rem;
}

.card-detail-actions {
    display: flex;
    gap: 0.75rem;
    padding-top: 1rem;
    border-top: 1px solid var(--card-border);
}

.btn-danger {
    background: var(--danger-color);
    color: white;
}

.btn-danger:hover {
    background: #dc2626;
}
`;

// Inject kanban styles
const styleElement = document.createElement('style');
styleElement.textContent = kanbanCSS;
document.head.appendChild(styleElement);

// Initialize kanban when needed
window.KanbanBoard = KanbanBoard;