// 노트 정비소 테스트 페이지 JavaScript

console.log('노트 정비소에 오신 것을 환영합니다! 🚗✨');

// 버튼 클릭 이벤트
function showMessage() {
    const messages = [
        '정비소에서 잘 작동하고 있어요! 🔧',
        'AI에게 이 메시지를 바꿔달라고 해보세요!',
        '색상, 크기, 위치 등 무엇이든 요청해보세요!',
        '노트 정비소가 모든걸 도와드릴게요! 🚀',
        '멋진 페이지가 되고 있네요! ✨'
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    alert(randomMessage);
}

// 변경사항 추적 시스템
class ChangeTracker {
    constructor() {
        this.changes = [];
        this.isTracking = true;
        console.log('📋 변경사항 추적을 시작합니다');
    }
    
    recordChange(type, element, oldValue, newValue, description) {
        if (!this.isTracking) return;
        
        const change = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            type: type,
            element: this.getElementInfo(element),
            before: oldValue,
            after: newValue,
            description: description || this.generateDescription(type, oldValue, newValue)
        };
        
        this.changes.push(change);
        console.log(`📝 변경사항 기록: ${change.description}`);
    }
    
    getElementInfo(element) {
        if (!element) return { selector: 'unknown' };
        
        return {
            tagName: element.tagName ? element.tagName.toLowerCase() : 'unknown',
            selector: this.getSelector(element),
            className: element.className || '',
            id: element.id || ''
        };
    }
    
    getSelector(element) {
        if (!element) return 'unknown';
        if (element.id) return `#${element.id}`;
        if (element.className) return `.${element.className.split(' ')[0]}`;
        return element.tagName ? element.tagName.toLowerCase() : 'unknown';
    }
    
    generateDescription(type, oldValue, newValue) {
        switch (type) {
            case 'backgroundColor':
                return `배경색을 ${oldValue}에서 ${newValue}로 변경`;
            case 'color':
                return `글자색을 ${oldValue}에서 ${newValue}로 변경`;
            case 'fontSize':
                return `글자 크기를 ${oldValue}에서 ${newValue}로 변경`;
            case 'text':
                return `텍스트를 "${oldValue}"에서 "${newValue}"로 변경`;
            default:
                return `${type} 속성 변경`;
        }
    }
    
    generateReport() {
        if (this.changes.length === 0) {
            return {
                success: false,
                message: '변경사항이 없습니다. 먼저 요소를 편집해보세요!'
            };
        }
        
        return {
            success: true,
            meta: {
                totalChanges: this.changes.length,
                generatedAt: new Date().toLocaleString()
            },
            summary: this.generateSummary(),
            changes: this.changes,
            markdown: this.generateMarkdown()
        };
    }
    
    generateSummary() {
        const types = {};
        this.changes.forEach(change => {
            const category = this.categorizeChange(change.type);
            types[category] = (types[category] || 0) + 1;
        });
        
        const summary = [];
        for (const [category, count] of Object.entries(types)) {
            summary.push(`${category} ${count}건`);
        }
        
        return summary.join(', ');
    }
    
    categorizeChange(type) {
        if (['backgroundColor', 'color', 'fontSize'].includes(type)) {
            return '🎨 스타일';
        } else if (type === 'text') {
            return '📝 텍스트';
        } else {
            return '🔧 기타';
        }
    }
    
    generateMarkdown() {
        let markdown = `# 🎨 웹페이지 변경 가이드\\n\\n`;
        markdown += `**생성일시:** ${new Date().toLocaleString()}\\n`;
        markdown += `**총 변경사항:** ${this.changes.length}건\\n`;
        markdown += `**요약:** ${this.generateSummary()}\\n\\n`;
        
        markdown += `## 📋 변경사항 목록\\n\\n`;
        
        this.changes.forEach((change, index) => {
            markdown += `### ${index + 1}. ${change.description}\\n`;
            markdown += `**요소:** \`${change.element.selector}\`\\n`;
            markdown += `**시간:** ${new Date(change.timestamp).toLocaleString()}\\n`;
            
            if (['backgroundColor', 'color', 'fontSize'].includes(change.type)) {
                markdown += `**CSS 코드:**\\n\`\`\`css\\n${change.element.selector} { ${this.camelToKebab(change.type)}: ${change.after}; }\\n\`\`\`\\n\\n`;
            } else if (change.type === 'text') {
                markdown += `**JavaScript 코드:**\\n\`\`\`javascript\\ndocument.querySelector('${change.element.selector}').textContent = '${change.after}';\\n\`\`\`\\n\\n`;
            }
        });
        
        markdown += `## 💡 적용 방법\\n\\n`;
        markdown += `1. 위의 CSS 코드를 웹사이트의 \`<style>\` 태그 안에 추가하세요\\n`;
        markdown += `2. JavaScript 코드는 \`<script>\` 태그 안에 추가하세요\\n`;
        markdown += `3. 변경사항을 확인하고 저장하세요\\n\\n`;
        
        return markdown;
    }
    
    camelToKebab(str) {
        return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    }
    
    generateId() {
        return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// 비주얼 선택 시스템
class VisualSelector {
    constructor() {
        this.isSelectionMode = false;
        this.selectedElement = null;
        this.currentEditPanel = null;
    }
    
    toggleSelectionMode() {
        this.isSelectionMode = !this.isSelectionMode;
        const btn = document.getElementById('visualSelectBtn');
        
        if (this.isSelectionMode) {
            this.enableSelectionMode();
            btn.classList.add('active');
            btn.textContent = '🎯 선택중...';
        } else {
            this.disableSelectionMode();
            btn.classList.remove('active');
            btn.textContent = '🎯 직접선택';
        }
    }
    
    enableSelectionMode() {
        document.body.classList.add('visual-select-mode');
        document.body.style.cursor = 'crosshair';
        
        // 모든 요소에 이벤트 리스너 추가
        document.querySelectorAll('*').forEach(element => {
            element.addEventListener('mouseover', this.handleMouseOver.bind(this));
            element.addEventListener('mouseout', this.handleMouseOut.bind(this));
            element.addEventListener('click', this.handleClick.bind(this));
        });
        
        // 표시기 추가
        this.showSelectionIndicator();
    }
    
    disableSelectionMode() {
        document.body.classList.remove('visual-select-mode');
        document.body.style.cursor = '';
        
        // 이벤트 리스너 제거
        document.querySelectorAll('*').forEach(element => {
            element.removeEventListener('mouseover', this.handleMouseOver.bind(this));
            element.removeEventListener('mouseout', this.handleMouseOut.bind(this));
            element.removeEventListener('click', this.handleClick.bind(this));
        });
        
        // 하이라이트 제거
        document.querySelectorAll('.element-highlight').forEach(el => {
            el.classList.remove('element-highlight');
        });
        
        // 표시기 제거
        this.hideSelectionIndicator();
    }
    
    handleMouseOver(event) {
        if (!this.isSelectionMode) return;
        event.stopPropagation();
        event.target.classList.add('element-highlight');
    }
    
    handleMouseOut(event) {
        if (!this.isSelectionMode) return;
        event.target.classList.remove('element-highlight');
    }
    
    handleClick(event) {
        if (!this.isSelectionMode) return;
        event.preventDefault();
        event.stopPropagation();
        
        this.selectElement(event.target);
        this.showEditPanel(event.target);
    }
    
    selectElement(element) {
        // 이전 선택 제거
        if (this.selectedElement) {
            this.selectedElement.classList.remove('element-selected');
        }
        
        this.selectedElement = element;
        element.classList.add('element-selected');
        
        console.log('✅ 선택된 요소:', element);
    }
    
    showEditPanel(element) {
        // 기존 패널 제거
        if (this.currentEditPanel) {
            this.currentEditPanel.remove();
        }
        
        const panel = document.createElement('div');
        panel.className = 'edit-panel';
        panel.innerHTML = `
            <div class="edit-panel-header">
                <span>🎨 ${element.tagName.toLowerCase()} 편집</span>
                <button onclick="visualSelector.closeEditPanel()">×</button>
            </div>
            <div class="edit-panel-content">
                <div class="edit-group">
                    <label>텍스트 내용:</label>
                    <input type="text" id="editText" value="${element.textContent || ''}" placeholder="텍스트 입력">
                    <button onclick="visualSelector.updateText()">적용</button>
                </div>
                
                <div class="edit-group">
                    <label>배경색:</label>
                    <input type="color" id="editBgColor" value="#ffffff">
                    <button onclick="visualSelector.updateStyle('backgroundColor')">적용</button>
                </div>
                
                <div class="edit-group">
                    <label>글자색:</label>
                    <input type="color" id="editTextColor" value="#000000">
                    <button onclick="visualSelector.updateStyle('color')">적용</button>
                </div>
                
                <div class="edit-group">
                    <label>글자 크기:</label>
                    <input type="range" id="editFontSize" min="10" max="50" value="16">
                    <span id="fontSizeDisplay">16px</span>
                    <button onclick="visualSelector.updateStyle('fontSize')">적용</button>
                </div>
                
                <div class="edit-actions">
                    <button class="primary-btn" onclick="visualSelector.closeEditPanel()">편집 완료</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.currentEditPanel = panel;
        
        // 폰트 크기 슬라이더 이벤트
        document.getElementById('editFontSize').addEventListener('input', (e) => {
            document.getElementById('fontSizeDisplay').textContent = e.target.value + 'px';
        });
        
        // 현재 스타일 값 초기화
        this.initializePanelValues(element);
    }
    
    initializePanelValues(element) {
        const computedStyle = window.getComputedStyle(element);
        
        // 배경색 초기화
        const bgColor = this.rgbToHex(computedStyle.backgroundColor);
        document.getElementById('editBgColor').value = bgColor;
        
        // 글자색 초기화  
        const textColor = this.rgbToHex(computedStyle.color);
        document.getElementById('editTextColor').value = textColor;
        
        // 폰트 크기 초기화
        const fontSize = parseInt(computedStyle.fontSize);
        document.getElementById('editFontSize').value = fontSize;
        document.getElementById('fontSizeDisplay').textContent = fontSize + 'px';
    }
    
    updateText() {
        if (!this.selectedElement) return;
        
        const newText = document.getElementById('editText').value;
        const oldText = this.selectedElement.textContent;
        
        this.selectedElement.textContent = newText;
        
        // 변경사항 기록
        changeTracker.recordChange('text', this.selectedElement, oldText, newText);
    }
    
    updateStyle(property) {
        if (!this.selectedElement) return;
        
        let newValue;
        const oldValue = window.getComputedStyle(this.selectedElement)[property];
        
        switch (property) {
            case 'backgroundColor':
                newValue = document.getElementById('editBgColor').value;
                break;
            case 'color':
                newValue = document.getElementById('editTextColor').value;
                break;
            case 'fontSize':
                newValue = document.getElementById('editFontSize').value + 'px';
                break;
        }
        
        this.selectedElement.style[property] = newValue;
        
        // 변경사항 기록
        changeTracker.recordChange(property, this.selectedElement, oldValue, newValue);
    }
    
    closeEditPanel() {
        if (this.currentEditPanel) {
            this.currentEditPanel.remove();
            this.currentEditPanel = null;
        }
        
        // 선택 모드 종료
        this.disableSelectionMode();
        this.isSelectionMode = false;
        
        const btn = document.getElementById('visualSelectBtn');
        btn.classList.remove('active');
        btn.textContent = '🎯 직접선택';
    }
    
    showSelectionIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'selection-indicator';
        indicator.textContent = '🎯 요소 선택 모드 - 편집할 요소를 클릭하세요';
        document.body.appendChild(indicator);
    }
    
    hideSelectionIndicator() {
        const indicator = document.querySelector('.selection-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    rgbToHex(rgb) {
        if (rgb.indexOf('rgb') === -1) return '#000000';
        
        const result = rgb.match(/\\d+/g);
        if (!result || result.length < 3) return '#000000';
        
        return '#' + result.slice(0, 3).map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
}

// 전역 인스턴스 생성
const changeTracker = new ChangeTracker();
const visualSelector = new VisualSelector();

// 전역 함수들
function toggleVisualSelection() {
    visualSelector.toggleSelectionMode();
}

function generateChangeReport() {
    const report = changeTracker.generateReport();
    
    if (!report.success) {
        alert(report.message);
        return;
    }
    
    // 마크다운 파일 다운로드
    const markdown = report.markdown;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `웹페이지_변경가이드_${new Date().getTime()}.md`;
    downloadLink.click();
    
    alert(`📋 ${report.meta.totalChanges}개의 변경사항이 리포트로 생성되었습니다!\\n${report.summary}`);
}

function resetChanges() {
    if (confirm('모든 변경사항을 초기화하시겠습니까?')) {
        location.reload();
    }
}

// 페이지 로드 시 환영 메시지
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎉 페이지가 성공적으로 로드되었습니다!');
    console.log('💡 팁: 개발자 도구에서 이 메시지들을 확인할 수 있어요.');
    
    // 데모 박스에 클릭 이벤트 추가
    const demoBox = document.querySelector('.demo-box');
    if (demoBox) {
        demoBox.addEventListener('click', function() {
            this.style.background = getRandomColor();
            console.log('🎨 박스 색상이 변경되었습니다!');
        });
    }
    
    // 3초 후 콘솔에 도움말 표시
    setTimeout(() => {
        console.log('📝 도움말: AI 채팅에서 다음과 같이 말해보세요:');
        console.log('   - "배경을 초록색으로 바꿔줘"');
        console.log('   - "제목을 더 크게 만들어줘"');
        console.log('   - "새로운 버튼을 추가해줘"');
    }, 3000);
});

// 랜덤 색상 생성 함수
function getRandomColor() {
    const colors = [
        '#e74c3c', '#3498db', '#2ecc71', 
        '#f39c12', '#9b59b6', '#1abc9c',
        '#e67e22', '#34495e', '#16a085'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// 키보드 이벤트 (숨겨진 기능)
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 'g') {
        event.preventDefault();
        document.body.style.background = getRandomColor();
        console.log('🌈 숨겨진 기능 발동! Ctrl+G로 배경색 변경!');
    }
});

// 스크롤 애니메이션 효과
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;
    
    const container = document.querySelector('.container');
    if (container) {
        container.style.transform = `translateY(${rate * 0.1}px)`;
    }
});

// 현재 시간 표시 (나중에 AI가 수정할 수 있도록)
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ko-KR');
    console.log(`⏰ 현재 시간: ${timeString}`);
}

// 5초마다 시간 업데이트
setInterval(updateTime, 5000);