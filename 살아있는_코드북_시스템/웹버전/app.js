// 살아있는 코드북 시스템 - 메인 애플리케이션
class InteractiveCodebook {
    constructor() {
        this.cards = new Map();
        this.currentCard = null;
        this.debugMode = false;
        this.searchTerm = '';
        this.isLoading = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadSampleData();
        this.showToast('환영합니다! 샘플 프로젝트가 로드되었습니다.', 'success');
    }
    
    setupEventListeners() {
        // Header buttons
        document.getElementById('loadProjectBtn').addEventListener('click', () => this.loadProject());
        document.getElementById('blueprintBtn').addEventListener('click', () => this.showBlueprint());
        document.getElementById('kanbanBtn').addEventListener('click', () => this.showKanban());
        document.getElementById('welcomeLoadBtn').addEventListener('click', () => this.loadProject());
        
        // Debug mode toggle
        document.getElementById('debugModeToggle').addEventListener('change', (e) => {
            this.toggleDebugMode(e.target.checked);
        });
        
        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
        
        // FAB buttons
        document.getElementById('runCodeFab').addEventListener('click', () => this.runCurrentCode());
        document.getElementById('exportFab').addEventListener('click', () => this.exportProject());
        
        // Modal close buttons
        document.getElementById('closeBlueprintModal').addEventListener('click', () => {
            document.getElementById('blueprintModal').classList.remove('active');
        });
        document.getElementById('closeKanbanModal').addEventListener('click', () => {
            document.getElementById('kanbanModal').classList.remove('active');
        });
        
        // Debug tabs
        document.querySelectorAll('.debug-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchDebugTab(e.target.dataset.tab);
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Click outside modals to close
        document.getElementById('blueprintModal').addEventListener('click', (e) => {
            if (e.target.id === 'blueprintModal') {
                e.target.classList.remove('active');
            }
        });
        document.getElementById('kanbanModal').addEventListener('click', (e) => {
            if (e.target.id === 'kanbanModal') {
                e.target.classList.remove('active');
            }
        });
    }
    
    loadSampleData() {
        const sampleCards = [
            {
                id: 'add',
                name: 'add',
                description: '두 수를 더하는 기본 연산 함수',
                code: `def add(a: float, b: float) -> float:
    """두 수를 더합니다"""
    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        raise TypeError("입력값은 숫자여야 합니다")
    return a + b`,
                lineNumber: 3,
                filePath: 'simple_calculator.py',
                connections: ['main', 'interactive_calculator'],
                tags: ['함수', '기본연산'],
                priority: 'normal',
                expectedOutput: 'add(5, 3) = 8',
                complexity: 'low',
                performance: 'O(1) - 상수시간'
            },
            {
                id: 'subtract',
                name: 'subtract',
                description: '두 수를 빼는 기본 연산 함수',
                code: `def subtract(a: float, b: float) -> float:
    """두 수를 뺍니다"""
    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        raise TypeError("입력값은 숫자여야 합니다")
    return a - b`,
                lineNumber: 9,
                filePath: 'simple_calculator.py',
                connections: ['main', 'interactive_calculator'],
                tags: ['함수', '기본연산'],
                priority: 'normal',
                expectedOutput: 'subtract(5, 3) = 2',
                complexity: 'low',
                performance: 'O(1) - 상수시간'
            },
            {
                id: 'multiply',
                name: 'multiply',
                description: '두 수를 곱하는 기본 연산 함수',
                code: `def multiply(a: float, b: float) -> float:
    """두 수를 곱합니다"""
    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        raise TypeError("입력값은 숫자여야 합니다")
    return a * b`,
                lineNumber: 15,
                filePath: 'simple_calculator.py',
                connections: ['main', 'interactive_calculator'],
                tags: ['함수', '기본연산'],
                priority: 'normal',
                expectedOutput: 'multiply(5, 3) = 15',
                complexity: 'low',
                performance: 'O(1) - 상수시간'
            },
            {
                id: 'divide',
                name: 'divide',
                description: '두 수를 나누는 기본 연산 함수 (0 나누기 방지 포함)',
                code: `def divide(a: float, b: float) -> float:
    """두 수를 나눕니다"""
    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        raise TypeError("입력값은 숫자여야 합니다")
    if b == 0:
        raise ZeroDivisionError("0으로 나눌 수 없습니다")
    return a / b`,
                lineNumber: 21,
                filePath: 'simple_calculator.py',
                connections: ['main', 'interactive_calculator'],
                tags: ['함수', '기본연산', '오류처리'],
                priority: 'high',
                expectedOutput: 'divide(6, 3) = 2.0',
                complexity: 'low',
                performance: 'O(1) - 상수시간'
            },
            {
                id: 'main',
                name: 'main',
                description: '계산기의 메인 실행 함수',
                code: `def main() -> None:
    """메인 실행 함수"""
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--interactive':
        interactive_calculator()
    else:
        print("간단한 계산기")
        print("5 + 3 =", add(5, 3))
        print("5 - 3 =", subtract(5, 3))
        print("5 * 3 =", multiply(5, 3))
        print("5 / 3 =", divide(5, 3))
        print()
        print("대화형 모드를 사용하려면: python simple_calculator.py --interactive")`,
                lineNumber: 29,
                filePath: 'simple_calculator.py',
                connections: ['add', 'subtract', 'multiply', 'divide', 'interactive_calculator'],
                tags: ['진입점', 'CLI'],
                priority: 'high',
                expectedOutput: '계산기 데모 실행 결과 출력',
                complexity: 'medium',
                performance: 'O(1) - 기본 연산들 호출'
            },
            {
                id: 'interactive_calculator',
                name: 'interactive_calculator',
                description: '사용자와 대화형으로 계산을 수행하는 함수',
                code: `def interactive_calculator():
    """대화형 계산기 모드"""
    print("대화형 계산기에 오신 것을 환영합니다!")
    print("언제든지 'q'를 입력하면 종료됩니다.")
    
    while True:
        operation, a, b = get_user_input()
        
        if operation == 'quit':
            print("계산기를 종료합니다!")
            break
            
        try:
            if operation == '+':
                result = add(a, b)
            elif operation == '-':
                result = subtract(a, b)
            elif operation == '*':
                result = multiply(a, b)
            elif operation == '/':
                result = divide(a, b)
            
            print(f"결과: {a} {operation} {b} = {result}")
            
        except ZeroDivisionError as e:
            print(f"오류: {e}")
        except Exception as e:
            print(f"예상치 못한 오류: {e}")
        
        print()  # 빈 줄 추가`,
                lineNumber: 65,
                filePath: 'simple_calculator.py',
                connections: ['get_user_input', 'add', 'subtract', 'multiply', 'divide'],
                tags: ['대화형', 'UI', '반복'],
                priority: 'medium',
                expectedOutput: '대화형 계산 세션',
                complexity: 'medium',
                performance: 'O(n) - 사용자 입력 횟수에 비례'
            }
        ];
        
        sampleCards.forEach(cardData => {
            this.cards.set(cardData.id, cardData);
        });
        
        this.renderCardList();
        this.updateCardCount();
    }
    
    renderCardList() {
        const cardList = document.getElementById('cardList');
        cardList.innerHTML = '';
        
        const filteredCards = this.getFilteredCards();
        
        filteredCards.forEach(card => {
            const cardElement = this.createCardListItem(card);
            cardList.appendChild(cardElement);
        });
    }
    
    getFilteredCards() {
        let filtered = Array.from(this.cards.values());
        
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(card => 
                card.name.toLowerCase().includes(term) ||
                card.description.toLowerCase().includes(term) ||
                card.code.toLowerCase().includes(term) ||
                card.tags.some(tag => tag.toLowerCase().includes(term))
            );
        }
        
        return filtered.sort((a, b) => {
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (a.priority !== 'high' && b.priority === 'high') return 1;
            return a.name.localeCompare(b.name);
        });
    }
    
    createCardListItem(card) {
        const element = document.createElement('div');
        element.className = 'card-item';
        element.dataset.cardId = card.id;
        
        const priorityIcon = {
            'low': '↓',
            'normal': '•',
            'high': '↑',
            'critical': '⚠️'
        }[card.priority] || '•';
        
        element.innerHTML = `
            <div class="card-item-header">
                <span class="card-item-name">${priorityIcon} ${card.name}</span>
                <span class="card-item-line">L${card.lineNumber}</span>
            </div>
            <div class="card-item-description">${card.description}</div>
            <div class="card-item-tags">
                ${card.tags.map(tag => `<span class="card-tag">${tag}</span>`).join('')}
            </div>
        `;
        
        element.addEventListener('click', () => this.selectCard(card.id));
        
        return element;
    }
    
    selectCard(cardId) {
        const card = this.cards.get(cardId);
        if (!card) return;
        
        // Update active state
        document.querySelectorAll('.card-item').forEach(el => el.classList.remove('active'));
        document.querySelector(`[data-card-id="${cardId}"]`).classList.add('active');
        
        this.currentCard = card;
        this.renderCardDisplay(card);
        this.updateDebugInfo(card);
    }
    
    renderCardDisplay(card) {
        const cardDisplay = document.getElementById('cardDisplay');
        
        cardDisplay.innerHTML = `
            <div class="code-card" id="codeCard">
                <div class="code-card-header">
                    <div class="code-card-title">
                        <h2>${card.name}</h2>
                        <span class="code-card-location">${card.filePath}:${card.lineNumber}</span>
                    </div>
                    <button class="flip-button" id="flipButton">
                        <i class="fas fa-sync-alt"></i>
                        <span id="flipButtonText">설명 보기</span>
                    </button>
                </div>
                <div class="code-card-body">
                    <div class="card-face front">
                        <div class="code-content">
                            <pre>${this.highlightSyntax(card.code)}</pre>
                            ${card.expectedOutput ? `<div style="margin-top: 1rem; padding: 0.5rem; background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10b981; border-radius: 0.375rem; color: #10b981;"><strong>예상 출력:</strong><br/>${card.expectedOutput}</div>` : ''}
                        </div>
                    </div>
                    <div class="card-face back">
                        <div class="description-content">
                            <h3>${card.name} 함수</h3>
                            <p>${card.description}</p>
                            
                            <div class="connections-info">
                                <h4>연결된 함수들</h4>
                                <div class="connection-tags">
                                    ${card.connections.map(conn => `<span class="connection-tag">${conn}</span>`).join('')}
                                </div>
                            </div>
                            
                            <div class="connections-info">
                                <h4>기술적 정보</h4>
                                <p><strong>복잡도:</strong> ${card.complexity}</p>
                                <p><strong>성능:</strong> ${card.performance}</p>
                                <p><strong>우선순위:</strong> ${card.priority}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add flip functionality
        document.getElementById('flipButton').addEventListener('click', () => this.flipCard());
    }
    
    flipCard() {
        const codeCard = document.getElementById('codeCard');
        const flipButtonText = document.getElementById('flipButtonText');
        
        codeCard.classList.toggle('flipped');
        
        if (codeCard.classList.contains('flipped')) {
            flipButtonText.textContent = '코드 보기';
        } else {
            flipButtonText.textContent = '설명 보기';
        }
        
        // Add flip animation effect
        const flipButton = document.getElementById('flipButton');
        flipButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            flipButton.style.transform = 'scale(1)';
        }, 150);
    }
    
    highlightSyntax(code) {
        // Simple syntax highlighting
        return code
            .replace(/\b(def|class|if|else|elif|for|while|try|except|finally|with|import|from|return|yield|pass|break|continue|async|await)\b/g, '<span class="keyword">$1</span>')
            .replace(/\b(True|False|None)\b/g, '<span class="keyword">$1</span>')
            .replace(/(".*?"|'.*?')/g, '<span class="string">$1</span>')
            .replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>')
            .replace(/(#.*$)/gm, '<span class="comment">$1</span>')
            .replace(/\b([a-zA-Z_]\w*)\s*\(/g, '<span class="function">$1</span>(');
    }
    
    toggleDebugMode(enabled) {
        this.debugMode = enabled;
        const debugPanel = document.getElementById('debugPanel');
        
        if (enabled) {
            debugPanel.style.display = 'flex';
            if (this.currentCard) {
                this.updateDebugInfo(this.currentCard);
            }
        } else {
            debugPanel.style.display = 'none';
        }
    }
    
    updateDebugInfo(card) {
        if (!this.debugMode) return;
        
        // Debug Info Tab
        const debugInfo = `복잡도: ${card.complexity}
성능: ${card.performance}
우선순위: ${card.priority}
태그: ${card.tags.join(', ')}
연결: ${card.connections.join(', ')}
파일: ${card.filePath}
라인: ${card.lineNumber}`;
        
        document.getElementById('debugInfoContent').textContent = debugInfo;
        
        // Performance Tab
        const perfInfo = `라인 수: ${card.code.split('\n').length}
문자 수: ${card.code.length}
복잡도 점수: ${this.calculateComplexity(card.code)}
메모리 사용량: ~${Math.ceil(card.code.length / 100)} KB
실행 시간: ${card.performance}`;
        
        document.getElementById('debugPerfContent').textContent = perfInfo;
        
        // Results Tab
        const resultsInfo = `예상 출력: ${card.expectedOutput || '없음'}
마지막 실행: 아직 실행되지 않음
상태: 준비됨
오류: 없음`;
        
        document.getElementById('debugResultsContent').textContent = resultsInfo;
    }
    
    calculateComplexity(code) {
        let score = 1;
        const complexityKeywords = ['if', 'for', 'while', 'try', 'except'];
        
        complexityKeywords.forEach(keyword => {
            const matches = (code.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
            score += matches;
        });
        
        return score;
    }
    
    switchDebugTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.debug-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.debug-pane').forEach(pane => pane.classList.remove('active'));
        
        const targetPane = {
            'info': 'debugInfo',
            'performance': 'debugPerformance',
            'results': 'debugResults'
        }[tabName];
        
        if (targetPane) {
            document.getElementById(targetPane).classList.add('active');
        }
    }
    
    handleSearch(term) {
        this.searchTerm = term;
        this.renderCardList();
    }
    
    handleKeyboard(e) {
        // ESC to close modals
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
        
        // Ctrl+F to focus search
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
        
        // F1 for help
        if (e.key === 'F1') {
            e.preventDefault();
            this.showHelp();
        }
    }
    
    loadProject() {
        this.showLoading(true);
        
        setTimeout(() => {
            this.loadSampleData();
            this.showLoading(false);
            this.showToast('프로젝트가 성공적으로 로드되었습니다!', 'success');
        }, 1000);
    }
    
    showBlueprint() {
        document.getElementById('blueprintModal').classList.add('active');
        // Initialize blueprint after modal is shown
        setTimeout(() => {
            if (window.BlueprintVisualizer) {
                window.blueprintViz = new BlueprintVisualizer('blueprintCanvas', this.cards);
            }
        }, 100);
    }
    
    showKanban() {
        document.getElementById('kanbanModal').classList.add('active');
        // Initialize kanban after modal is shown
        setTimeout(() => {
            if (window.KanbanBoard) {
                window.kanbanBoard = new KanbanBoard('kanbanBoard', this.cards);
            }
        }, 100);
    }
    
    runCurrentCode() {
        if (!this.currentCard) {
            this.showToast('실행할 코드를 먼저 선택하세요.', 'warning');
            return;
        }
        
        const card = this.currentCard;
        
        // Simulate code execution
        this.showLoading(true);
        
        setTimeout(() => {
            const mockResult = this.simulateCodeExecution(card);
            
            // Update debug results tab
            if (this.debugMode) {
                const resultsInfo = `함수: ${card.name}
실행 시간: ${new Date().toLocaleTimeString()}
결과: ${mockResult.output}
실행 시간: ${mockResult.executionTime}ms
메모리: ${mockResult.memoryUsed}KB
상태: 성공`;
                
                document.getElementById('debugResultsContent').textContent = resultsInfo;
                
                // Switch to results tab
                this.switchDebugTab('results');
            }
            
            this.showLoading(false);
            this.showToast(`코드 실행 완료: ${mockResult.output}`, 'success');
        }, 1500);
    }
    
    simulateCodeExecution(card) {
        const results = {
            'add': { output: 'add(5, 3) = 8', executionTime: 0.1, memoryUsed: 0.5 },
            'subtract': { output: 'subtract(5, 3) = 2', executionTime: 0.1, memoryUsed: 0.5 },
            'multiply': { output: 'multiply(5, 3) = 15', executionTime: 0.1, memoryUsed: 0.5 },
            'divide': { output: 'divide(6, 3) = 2.0', executionTime: 0.2, memoryUsed: 0.6 },
            'main': { output: '계산기 데모 실행됨', executionTime: 5.0, memoryUsed: 2.1 },
            'interactive_calculator': { output: '대화형 모드 준비됨', executionTime: 1.2, memoryUsed: 1.5 }
        };
        
        return results[card.id] || { output: '실행 결과 없음', executionTime: 0, memoryUsed: 0 };
    }
    
    exportProject() {
        const exportData = {
            name: '살아있는 코드북 프로젝트',
            timestamp: new Date().toISOString(),
            cards: Array.from(this.cards.values())
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'codebook-project.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('프로젝트가 성공적으로 내보내졌습니다!', 'success');
    }
    
    updateCardCount() {
        const count = this.cards.size;
        document.getElementById('cardCount').textContent = `${count}개`;
    }
    
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        this.isLoading = show;
        
        if (show) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Show animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }
    
    showHelp() {
        const helpContent = `
🔧 살아있는 코드북 시스템 도움말

📋 기본 기능:
• 왼쪽 목록에서 코드 카드 선택
• "카드 뒤집기" 버튼으로 코드 ↔ 설명 전환
• 검색창에서 코드, 함수명, 태그 검색

🎛️ 고급 기능:
• 디버그 모드: 상세 정보 및 성능 분석
• 블루프린트: 코드 연결 관계 시각화
• 칸반보드: 작업 진행 상황 관리

⌨️ 키보드 단축키:
• Ctrl+F: 검색 창 포커스
• Esc: 모달 닫기
• F1: 도움말

💡 팁:
• 우선순위가 높은 카드는 ↑ 표시
• 태그로 관련 코드들을 그룹화
• 실행 버튼으로 안전한 코드 테스트
        `;
        
        this.showToast(helpContent.trim(), 'info');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.codebook = new InteractiveCodebook();
});