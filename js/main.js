// 전역 변수
let currentModal = null;
let modalDataStore = {};

// 페이지 로드시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 입력 필드에 이벤트 리스너 추가
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`title${i}`).addEventListener('input', updateLayout);
        document.getElementById(`buttons${i}`).addEventListener('input', updateLayout);
    }

    // 자동 저장된 데이터 불러오기
    loadAutoSave();
    updateLayout();

    // 5초마다 자동 저장
    setInterval(autoSave, 5000);

    // 사이드바 토글 기능
    initSidebarToggle();

    // 메모장 초기화
    initNotePad();
});

// 레이아웃 업데이트 함수
function updateLayout() {
    // 각 영역의 데이터 수집
    const areas = [];
    for (let i = 1; i <= 4; i++) {
        const title = document.getElementById(`title${i}`).value.trim();
        const buttonsText = document.getElementById(`buttons${i}`).value.trim();

        if (title) {
            areas.push({
                id: i,
                title: title,
                buttons: parseButtons(buttonsText)
            });
        }
    }

    // 레이아웃 계산 및 적용
    calculateLayout(areas);
    renderAreas(areas);
}

// 버튼 텍스트 파싱
function parseButtons(text) {
    if (!text) return [];

    // 줄 단위로 분리
    const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-'))
        .map(line => line.substring(1))  // trim 제거
        .filter(line => line.length > 0);

    // 각 줄을 쉼표로 분리 (띄어쓰기 포함)
    return lines.map(line => {
        return line.split(',')
            .filter(btn => btn.length > 0);
    });
}

// 레이아웃 계산
function calculateLayout(areas) {
    const mainContent = document.getElementById('mainContent');
    const contentAreas = mainContent.querySelectorAll('.content-area');

    // 모든 영역 숨김
    contentAreas.forEach(area => {
        area.classList.remove('active');
        area.style.width = '';
        area.style.height = '';
    });

    if (areas.length === 0) return;

    const areaIds = areas.map(a => a.id);

    // 1개 영역
    if (areas.length === 1) {
        const area = document.getElementById(`area${areas[0].id}`);
        area.style.width = '100%';
        area.style.height = '100%';
        area.classList.add('active');
    }
    // 2개 영역
    else if (areas.length === 2) {
        if (areaIds.includes(1) && areaIds.includes(2)) {
            // 1,2: 세로 2등분
            document.getElementById('area1').style.width = '50%';
            document.getElementById('area1').style.height = '100%';
            document.getElementById('area2').style.width = '50%';
            document.getElementById('area2').style.height = '100%';
            document.getElementById('area1').classList.add('active');
            document.getElementById('area2').classList.add('active');
        }
        else if (areaIds.includes(1) && areaIds.includes(3)) {
            // 1,3: 가로 2등분
            document.getElementById('area1').style.width = '100%';
            document.getElementById('area1').style.height = '50%';
            document.getElementById('area3').style.width = '100%';
            document.getElementById('area3').style.height = '50%';
            document.getElementById('area1').classList.add('active');
            document.getElementById('area3').classList.add('active');
        }
    }
    // 3개 영역
    else if (areas.length === 3) {
        if (areaIds.includes(1) && areaIds.includes(3) && areaIds.includes(4)) {
            // 1,3,4: 상단 100% / 하단 좌50% 우50%
            document.getElementById('area1').style.width = '100%';
            document.getElementById('area1').style.height = '50%';
            document.getElementById('area3').style.width = '50%';
            document.getElementById('area3').style.height = '50%';
            document.getElementById('area4').style.width = '50%';
            document.getElementById('area4').style.height = '50%';
            document.getElementById('area1').classList.add('active');
            document.getElementById('area3').classList.add('active');
            document.getElementById('area4').classList.add('active');
        }
        else if (areaIds.includes(1) && areaIds.includes(2) && areaIds.includes(3)) {
            // 1,2,3: 좌50% 우50% / 하단 100%
            document.getElementById('area1').style.width = '50%';
            document.getElementById('area1').style.height = '50%';
            document.getElementById('area2').style.width = '50%';
            document.getElementById('area2').style.height = '50%';
            document.getElementById('area3').style.width = '100%';
            document.getElementById('area3').style.height = '50%';
            document.getElementById('area1').classList.add('active');
            document.getElementById('area2').classList.add('active');
            document.getElementById('area3').classList.add('active');
        }
        else if (areaIds.includes(1) && areaIds.includes(2) && areaIds.includes(4)) {
            // 1,2,4: 좌50% 우50% / 하단 100%
            document.getElementById('area1').style.width = '50%';
            document.getElementById('area1').style.height = '50%';
            document.getElementById('area2').style.width = '50%';
            document.getElementById('area2').style.height = '50%';
            document.getElementById('area4').style.width = '100%';
            document.getElementById('area4').style.height = '50%';
            document.getElementById('area1').classList.add('active');
            document.getElementById('area2').classList.add('active');
            document.getElementById('area4').classList.add('active');
        }
    }
    // 4개 영역
    else if (areas.length === 4) {
        contentAreas.forEach(area => {
            area.style.width = '50%';
            area.style.height = '50%';
            area.classList.add('active');
        });
    }
}

// 영역 렌더링
function renderAreas(areas) {
    areas.forEach(areaData => {
        const areaElement = document.getElementById(`area${areaData.id}`);
        const titleElement = areaElement.querySelector('.area-title');
        const buttonContainer = areaElement.querySelector('.button-container');

        // 제목 설정
        titleElement.textContent = areaData.title;

        // 버튼 생성 (2차원 배열)
        buttonContainer.innerHTML = '';
        areaData.buttons.forEach(buttonRow => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'button-row';

            buttonRow.forEach(buttonName => {
                const button = document.createElement('button');
                button.className = 'area-button';
                button.textContent = buttonName;
                button.onclick = () => openModal(buttonName);
                rowDiv.appendChild(button);
            });

            buttonContainer.appendChild(rowDiv);
        });
    });
}

// 모달 열기
function openModal(buttonName) {
    // 기존 모달이 있으면 제거
    if (currentModal) {
        document.body.removeChild(currentModal);
    }

    // 모달 생성
    const modal = document.createElement('div');
    modal.className = 'modal active';

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">${buttonName}</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="fixed-rows">
                    <div class="header-row">
                        <div class="header-column" data-width-mode="ratio">
                            <input type="text" class="header-cell" placeholder="열 제목 1" oninput="updatePlaceholders()">
                            <div class="column-bottom">
                                <input type="number" class="width-input" placeholder="비율" value="1" min="0.1" step="0.1" oninput="applyManualWidths()">
                                <button class="width-mode-toggle" onclick="toggleWidthMode(this)">비율</button>
                                <div class="column-controls">
                                    <button class="column-btn" onclick="moveColumnLeft(this)">◀</button>
                                    <button class="column-btn" onclick="moveColumnRight(this)">▶</button>
                                    <button class="column-btn delete" onclick="deleteColumn(this)">×</button>
                                </div>
                            </div>
                        </div>
                        <button class="add-column-btn" onclick="addColumn(this)">+열</button>
                    </div>
                </div>
                <div class="input-fields">
                    <div class="data-rows-container">
                        <div class="data-row">
                            <textarea class="data-cell" placeholder=""></textarea>
                            <div class="row-controls">
                                <button class="row-move-btn" onclick="moveRowUp(this)">▲</button>
                                <button class="row-move-btn" onclick="moveRowDown(this)">▼</button>
                                <button class="voice-input-btn" onclick="startVoiceInput(this)">🎤</button>
                            </div>
                        </div>
                    </div>
                    <div class="add-row-wrapper">
                        <button class="add-row-btn top" onclick="addDataRowTop(this)">▲ 위로 행 추가</button>
                        <button class="add-row-btn bottom" onclick="addDataRowBottom(this)">▼ 아래로 행 추가</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    currentModal = modal;

    // 저장된 데이터 불러오기
    const modalContent = modal.querySelector('.modal-content');
    loadModalData(buttonName, modalContent);

    // 초기 textarea에 자동 높이 조절 이벤트 추가
    const initialTextareas = modal.querySelectorAll('.data-cell');
    initialTextareas.forEach(textarea => attachAutoResize(textarea));

    // 초기 placeholder 업데이트
    updatePlaceholders();

    // 초기 너비 적용
    setTimeout(() => applyManualWidths(), 100);

    // 배경 클릭시 닫기
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

// 모달 닫기
function closeModal() {
    if (currentModal) {
        const title = currentModal.querySelector('.modal-title').textContent;
        saveModalData(title);
        document.body.removeChild(currentModal);
        currentModal = null;
    }
}

// 열 추가 (헤더에 열 추가 + 모든 데이터 행에도 열 추가)
function addColumn(button) {
    const modal = button.closest('.modal-content');
    const headerRow = modal.querySelector('.header-row');
    const currentColumns = headerRow.querySelectorAll('.header-column').length;

    if (currentColumns >= 10) {
        button.disabled = true;
        return;
    }

    // 새로운 기본값 계산 (10 ÷ 새 열 개수)
    const newColumnCount = currentColumns + 1;
    const newDefaultValue = (10 / newColumnCount).toFixed(1);

    // 기존 열들의 값도 업데이트
    const existingInputs = modal.querySelectorAll('.width-input');
    existingInputs.forEach(input => {
        input.value = newDefaultValue;
    });

    // 헤더에 새 열 추가
    const newColumn = document.createElement('div');
    newColumn.className = 'header-column';
    newColumn.setAttribute('data-width-mode', 'ratio');
    newColumn.innerHTML = `
        <input type="text" class="header-cell" placeholder="열 제목 ${newColumnCount}" oninput="updatePlaceholders()">
        <div class="column-bottom">
            <input type="number" class="width-input" placeholder="비율" value="${newDefaultValue}" min="0.1" step="0.1" oninput="applyManualWidths()">
            <button class="width-mode-toggle" onclick="toggleWidthMode(this)">비율</button>
            <div class="column-controls">
                <button class="column-btn" onclick="moveColumnLeft(this)">◀</button>
                <button class="column-btn" onclick="moveColumnRight(this)">▶</button>
                <button class="column-btn delete" onclick="deleteColumn(this)">×</button>
            </div>
        </div>
    `;
    headerRow.insertBefore(newColumn, button);

    // 모든 데이터 행에 새 셀 추가
    const dataRows = modal.querySelectorAll('.data-row');
    dataRows.forEach(row => {
        const newCell = document.createElement('textarea');
        newCell.className = 'data-cell';
        newCell.placeholder = `데이터 ${currentColumns + 1}`;
        attachAutoResize(newCell);  // 자동 높이 조절 추가
        // row-controls 이전에 삽입
        const rowControls = row.querySelector('.row-controls');
        if (rowControls) {
            row.insertBefore(newCell, rowControls);
        } else {
            row.appendChild(newCell);
        }
    });

    applyManualWidths();
    updatePlaceholders();

    if (currentColumns + 1 >= 10) {
        button.disabled = true;
    }
}

// 데이터 행 위로 추가
function addDataRowTop(button) {
    const modal = button.closest('.modal-content');
    const container = modal.querySelector('.data-rows-container');
    const currentRows = container.querySelectorAll('.data-row').length;
    const columnCount = modal.querySelectorAll('.header-column').length;

    if (currentRows >= 50) {
        return;
    }

    // 새 데이터 행 생성
    const newRow = document.createElement('div');
    newRow.className = 'data-row';

    // 현재 열 개수만큼 셀 추가
    for (let i = 0; i < columnCount; i++) {
        const cell = document.createElement('textarea');
        cell.className = 'data-cell';
        cell.placeholder = `데이터 ${i + 1}`;
        attachAutoResize(cell);  // 자동 높이 조절 추가
        newRow.appendChild(cell);
    }

    // 행 이동 버튼 추가
    const rowControls = document.createElement('div');
    rowControls.className = 'row-controls';
    rowControls.innerHTML = `
        <button class="row-move-btn" onclick="moveRowUp(this)">▲</button>
        <button class="row-move-btn" onclick="moveRowDown(this)">▼</button>
        <button class="voice-input-btn" onclick="startVoiceInput(this)">🎤</button>
    `;
    newRow.appendChild(rowControls);

    // 맨 위에 추가
    container.insertBefore(newRow, container.firstChild);
    applyManualWidths();
    updatePlaceholders();
}

// 데이터 행 아래로 추가
function addDataRowBottom(button) {
    const modal = button.closest('.modal-content');
    const container = modal.querySelector('.data-rows-container');
    const currentRows = container.querySelectorAll('.data-row').length;
    const columnCount = modal.querySelectorAll('.header-column').length;

    if (currentRows >= 50) {
        return;
    }

    // 새 데이터 행 생성
    const newRow = document.createElement('div');
    newRow.className = 'data-row';

    // 현재 열 개수만큼 셀 추가
    for (let i = 0; i < columnCount; i++) {
        const cell = document.createElement('textarea');
        cell.className = 'data-cell';
        cell.placeholder = `데이터 ${i + 1}`;
        attachAutoResize(cell);  // 자동 높이 조절 추가
        newRow.appendChild(cell);
    }

    // 행 이동 버튼 추가
    const rowControls = document.createElement('div');
    rowControls.className = 'row-controls';
    rowControls.innerHTML = `
        <button class="row-move-btn" onclick="moveRowUp(this)">▲</button>
        <button class="row-move-btn" onclick="moveRowDown(this)">▼</button>
        <button class="voice-input-btn" onclick="startVoiceInput(this)">🎤</button>
    `;
    newRow.appendChild(rowControls);

    // 맨 아래에 추가
    container.appendChild(newRow);
    applyManualWidths();
    updatePlaceholders();
}

// 행 위로 이동
function moveRowUp(button) {
    const row = button.closest('.data-row');
    const prevRow = row.previousElementSibling;

    if (prevRow) {
        // 이동하기 전에 row에 focus 클래스 임시 추가
        row.classList.add('keep-focus');
        row.parentNode.insertBefore(row, prevRow);
        // 이동 후 버튼에 포커스
        button.focus();
        // 클래스 제거
        setTimeout(() => row.classList.remove('keep-focus'), 100);
    }
}

// 행 아래로 이동
function moveRowDown(button) {
    const row = button.closest('.data-row');
    const nextRow = row.nextElementSibling;

    if (nextRow) {
        row.parentNode.insertBefore(nextRow, row);
    }
}

// Textarea 자동 높이 조절
function autoResizeTextarea(textarea) {
    // 빈 값이면 height를 설정하지 않고 CSS min-height 사용
    if (!textarea.value) {
        textarea.style.height = '';
        textarea.style.padding = '13px 8px 4px';
        return;
    }

    textarea.style.height = 'auto';
    const newHeight = Math.max(textarea.scrollHeight, 30);  // 최소 30px 보장
    textarea.style.height = newHeight + 'px';

    // 줄 수에 따라 padding 조절
    const lineCount = (textarea.value.match(/\n/g) || []).length + 1;
    if (lineCount >= 2) {
        textarea.style.padding = '7px 8px 9px';
    } else {
        textarea.style.padding = '13px 8px 4px';
    }
}

// Placeholder 업데이트 (열 제목으로)
function updatePlaceholders() {
    if (!currentModal) return;

    const modal = currentModal.querySelector('.modal-content');
    const headerCells = modal.querySelectorAll('.header-cell');
    const dataRows = modal.querySelectorAll('.data-row');

    // 각 행의 셀에 대해 placeholder 업데이트
    dataRows.forEach(row => {
        const cells = row.querySelectorAll('.data-cell');
        cells.forEach((cell, index) => {
            if (headerCells[index]) {
                cell.placeholder = headerCells[index].value || '';
            }
        });
    });
}

// Textarea에 자동 높이 조절 이벤트 추가
function attachAutoResize(textarea) {
    // 초기 높이 설정
    autoResizeTextarea(textarea);

    // input 이벤트로 자동 높이 조절
    textarea.addEventListener('input', function() {
        autoResizeTextarea(this);
    });
}

// 음성 입력 시작
function startVoiceInput(button) {
    const row = button.closest('.data-row');
    const cells = row.querySelectorAll('.data-cell');

    // 어떤 셀에 입력할지 결정 (비어있는 첫 번째 셀 또는 마지막 셀)
    let targetCell = null;
    for (let cell of cells) {
        if (!cell.value.trim()) {
            targetCell = cell;
            break;
        }
    }
    if (!targetCell) {
        targetCell = cells[cells.length - 1]; // 모두 차있으면 마지막 셀
    }

    // Web Speech API 지원 확인
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert('이 브라우저는 음성 인식을 지원하지 않습니다.');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.continuous = false;
    recognition.interimResults = false;

    // 녹음 시작
    button.classList.add('recording');

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;

        // 기존 텍스트에 추가 (비어있으면 그냥 입력)
        if (targetCell.value.trim()) {
            targetCell.value += ' ' + transcript;
        } else {
            targetCell.value = transcript;
        }

        // textarea 높이 재조정
        autoResizeTextarea(targetCell);
        button.classList.remove('recording');
    };

    recognition.onerror = function(event) {
        console.error('음성 인식 오류:', event.error);
        button.classList.remove('recording');

        if (event.error === 'no-speech') {
            alert('음성이 감지되지 않았습니다.');
        } else if (event.error === 'not-allowed') {
            alert('마이크 권한이 필요합니다.');
        } else {
            alert('음성 인식 중 오류가 발생했습니다: ' + event.error);
        }
    };

    recognition.onend = function() {
        button.classList.remove('recording');
    };

    try {
        recognition.start();
    } catch (error) {
        console.error('음성 인식 시작 오류:', error);
        button.classList.remove('recording');
        alert('음성 인식을 시작할 수 없습니다.');
    }
}

// 너비 모드 토글 (비율 ↔ px)
function toggleWidthMode(button) {
    const column = button.closest('.header-column');
    const currentMode = column.getAttribute('data-width-mode');
    const input = column.querySelector('.width-input');

    if (currentMode === 'ratio') {
        // 비율 → px
        column.setAttribute('data-width-mode', 'px');
        button.textContent = 'px';
        input.placeholder = 'px';
        input.value = '100'; // 기본값 100px
        input.removeAttribute('max');
        input.setAttribute('min', '50');
        input.setAttribute('step', '10');
    } else {
        // px → 비율
        column.setAttribute('data-width-mode', 'ratio');
        button.textContent = '비율';
        input.placeholder = '비율';
        input.value = '1';
        input.setAttribute('min', '0.1');
        input.removeAttribute('max');
        input.setAttribute('step', '0.1');
    }

    applyManualWidths();
}

// 수동 너비 비율 적용
function applyManualWidths() {
    if (!currentModal) return;

    const modal = currentModal.querySelector('.modal-content');
    const headerColumns = modal.querySelectorAll('.header-column');
    const dataRows = modal.querySelectorAll('.data-row');

    // 헤더 열에 너비 적용
    headerColumns.forEach((column, index) => {
        const mode = column.getAttribute('data-width-mode');
        const input = column.querySelector('.width-input');
        const value = parseFloat(input.value) || (mode === 'px' ? 200 : 1);

        if (mode === 'px') {
            // px 모드: 고정 너비
            column.style.flex = `0 0 ${value}px`;
        } else {
            // 비율 모드: 유연한 너비
            column.style.flex = `${value} 1 0`;
        }
    });

    // 데이터 셀에 너비 적용
    dataRows.forEach(row => {
        const cells = row.querySelectorAll('.data-cell');
        cells.forEach((cell, index) => {
            const column = headerColumns[index];
            if (!column) return;

            const mode = column.getAttribute('data-width-mode');
            const input = column.querySelector('.width-input');
            const value = parseFloat(input.value) || (mode === 'px' ? 200 : 1);

            if (mode === 'px') {
                cell.style.flex = `0 0 ${value}px`;
            } else {
                cell.style.flex = `${value} 1 0`;
            }
        });
    });

    // 너비 변경 후 모든 textarea 높이 재계산
    setTimeout(() => {
        const allCells = modal.querySelectorAll('.data-cell');
        allCells.forEach(cell => {
            autoResizeTextarea(cell);
        });
    }, 0);
}

// 열 삭제
function deleteColumn(button) {
    const modal = button.closest('.modal-content');
    const headerRow = modal.querySelector('.header-row');
    const column = button.closest('.header-column');
    const columnIndex = Array.from(headerRow.children).indexOf(column);

    // 최소 1개 열은 유지
    if (headerRow.querySelectorAll('.header-column').length <= 1) {
        alert('최소 1개의 열은 필요합니다.');
        return;
    }

    // 헤더 열 삭제
    column.remove();

    // 모든 데이터 행에서 해당 열 삭제
    const dataRows = modal.querySelectorAll('.data-row');
    dataRows.forEach(row => {
        const cells = row.querySelectorAll('.data-cell');
        if (cells[columnIndex]) {
            cells[columnIndex].remove();
        }
    });

    // 남은 열 개수로 기본값 재계산
    const remainingColumns = headerRow.querySelectorAll('.header-column').length;
    const newDefaultValue = (10 / remainingColumns).toFixed(1);
    const existingInputs = modal.querySelectorAll('.width-input');
    existingInputs.forEach(input => {
        input.value = newDefaultValue;
    });

    applyManualWidths();
    updatePlaceholders();
}

// 열 왼쪽으로 이동
function moveColumnLeft(button) {
    const modal = button.closest('.modal-content');
    const headerRow = modal.querySelector('.header-row');
    const column = button.closest('.header-column');
    const columnIndex = Array.from(headerRow.children).indexOf(column);

    if (columnIndex === 0) return; // 이미 첫 번째

    // 헤더 열 이동
    headerRow.insertBefore(column, headerRow.children[columnIndex - 1]);

    // 모든 데이터 행에서 셀 이동
    const dataRows = modal.querySelectorAll('.data-row');
    dataRows.forEach(row => {
        const cells = row.querySelectorAll('.data-cell');
        if (cells[columnIndex]) {
            row.insertBefore(cells[columnIndex], cells[columnIndex - 1]);
        }
    });

    applyManualWidths();
}

// 열 오른쪽으로 이동
function moveColumnRight(button) {
    const modal = button.closest('.modal-content');
    const headerRow = modal.querySelector('.header-row');
    const column = button.closest('.header-column');
    const columns = Array.from(headerRow.children);
    const columnIndex = columns.indexOf(column);

    if (columnIndex === columns.length - 1) return; // 이미 마지막

    // 헤더 열 이동
    if (columnIndex + 2 < columns.length) {
        headerRow.insertBefore(column, columns[columnIndex + 2]);
    } else {
        headerRow.appendChild(column);
    }

    // 모든 데이터 행에서 셀 이동
    const dataRows = modal.querySelectorAll('.data-row');
    dataRows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('.data-cell'));
        if (cells[columnIndex]) {
            if (columnIndex + 2 < cells.length) {
                row.insertBefore(cells[columnIndex], cells[columnIndex + 2]);
            } else {
                row.appendChild(cells[columnIndex]);
            }
        }
    });

    applyManualWidths();
}

// JSON 저장
function saveToJSON() {
    const data = {
        areas: [],
        modalData: modalDataStore
    };

    // 영역 데이터 수집
    for (let i = 1; i <= 4; i++) {
        const title = document.getElementById(`title${i}`).value;
        const buttons = document.getElementById(`buttons${i}`).value;
        if (title || buttons) {
            data.areas.push({
                id: i,
                title: title,
                buttons: buttons
            });
        }
    }

    // JSON 파일 다운로드
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard_data.json';
    a.click();
    URL.revokeObjectURL(url);
}

// JSON 불러오기 트리거
function loadFromJSON() {
    document.getElementById('fileInput').click();
}

// 파일 로드 처리
function handleFileLoad(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            // 영역 데이터 복원
            for (let i = 1; i <= 4; i++) {
                document.getElementById(`title${i}`).value = '';
                document.getElementById(`buttons${i}`).value = '';
            }

            if (data.areas) {
                data.areas.forEach(area => {
                    document.getElementById(`title${area.id}`).value = area.title || '';
                    document.getElementById(`buttons${area.id}`).value = area.buttons || '';
                });
            }

            // 모달 데이터 복원
            if (data.modalData) {
                modalDataStore = data.modalData;
            }

            updateLayout();
            alert('데이터를 불러왔습니다.');
        } catch (error) {
            alert('파일을 읽는 중 오류가 발생했습니다.');
        }
    };
    reader.readAsText(file);
}

// 자동 저장 (LocalStorage)
function autoSave() {
    // 현재 열려있는 모달이 있으면 먼저 저장
    if (currentModal) {
        const title = currentModal.querySelector('.modal-title').textContent;
        saveModalData(title);
    }

    const data = {
        areas: [],
        modalData: modalDataStore
    };

    for (let i = 1; i <= 4; i++) {
        const title = document.getElementById(`title${i}`).value;
        const buttons = document.getElementById(`buttons${i}`).value;
        data.areas.push({
            id: i,
            title: title,
            buttons: buttons
        });
    }

    localStorage.setItem('dashboard_autosave', JSON.stringify(data));
}

// 자동 저장 데이터 불러오기
function loadAutoSave() {
    const saved = localStorage.getItem('dashboard_autosave');
    if (!saved) return;

    try {
        const data = JSON.parse(saved);

        if (data.areas) {
            data.areas.forEach(area => {
                document.getElementById(`title${area.id}`).value = area.title || '';
                document.getElementById(`buttons${area.id}`).value = area.buttons || '';
            });
        }

        if (data.modalData) {
            modalDataStore = data.modalData;
        }
    } catch (error) {
        console.error('자동 저장 데이터 복원 실패:', error);
    }
}

// 모달 데이터 저장
function saveModalData(buttonName) {
    if (!currentModal) return;

    const modal = currentModal.querySelector('.modal-content');
    const headerCells = modal.querySelectorAll('.header-cell');
    const headerColumns = modal.querySelectorAll('.header-column');
    const dataRows = modal.querySelectorAll('.data-row');

    const headers = Array.from(headerCells).map(cell => cell.value);

    // 너비와 모드 함께 저장
    const widthsData = Array.from(headerColumns).map(column => {
        const input = column.querySelector('.width-input');
        const mode = column.getAttribute('data-width-mode');
        return {
            value: parseFloat(input.value) || (mode === 'px' ? 200 : 1),
            mode: mode || 'ratio'
        };
    });

    const rows = Array.from(dataRows).map(row => {
        return Array.from(row.querySelectorAll('.data-cell')).map(cell => cell.value);
    });

    modalDataStore[buttonName] = {
        headers: headers,
        widthsData: widthsData,
        rows: rows
    };
}

// 모달 데이터 복원
function loadModalData(buttonName, modal) {
    if (!modalDataStore[buttonName]) return;

    const data = modalDataStore[buttonName];
    const headerRow = modal.querySelector('.header-row');
    const inputFields = modal.querySelector('.input-fields');

    // 기존 내용 삭제
    headerRow.innerHTML = '';
    inputFields.innerHTML = '<div class="data-rows-container"></div><div class="add-row-wrapper"><button class="add-row-btn top" onclick="addDataRowTop(this)">▲ 위로 행 추가</button><button class="add-row-btn bottom" onclick="addDataRowBottom(this)">▼ 아래로 행 추가</button></div>';

    // 헤더 복원
    data.headers.forEach((headerText, index) => {
        const column = document.createElement('div');
        column.className = 'header-column';

        // widthsData가 있으면 사용, 없으면 구 형식(widths) 호환
        let widthData = { value: 1, mode: 'ratio' };
        if (data.widthsData && data.widthsData[index]) {
            widthData = data.widthsData[index];
        } else if (data.widths && data.widths[index]) {
            widthData = { value: data.widths[index], mode: 'ratio' };
        }

        column.setAttribute('data-width-mode', widthData.mode);

        const modeText = widthData.mode === 'px' ? 'px' : '비율';
        const placeholder = widthData.mode === 'px' ? 'px' : '비율';
        const minValue = widthData.mode === 'px' ? '50' : '0.1';
        const stepValue = widthData.mode === 'px' ? '10' : '0.1';

        column.innerHTML = `
            <input type="text" class="header-cell" value="${headerText}" placeholder="열 제목 ${index + 1}" oninput="updatePlaceholders()">
            <div class="column-bottom">
                <input type="number" class="width-input" placeholder="${placeholder}" value="${widthData.value}" min="${minValue}" step="${stepValue}" oninput="applyManualWidths()">
                <button class="width-mode-toggle" onclick="toggleWidthMode(this)">${modeText}</button>
                <div class="column-controls">
                    <button class="column-btn" onclick="moveColumnLeft(this)">◀</button>
                    <button class="column-btn" onclick="moveColumnRight(this)">▶</button>
                    <button class="column-btn delete" onclick="deleteColumn(this)">×</button>
                </div>
            </div>
        `;
        headerRow.appendChild(column);
    });

    // + 열 추가 버튼 추가
    const addColumnBtn = document.createElement('button');
    addColumnBtn.className = 'add-column-btn';
    addColumnBtn.textContent = '+열';
    addColumnBtn.onclick = function() { addColumn(this); };
    headerRow.appendChild(addColumnBtn);

    // 데이터 행 복원
    const container = modal.querySelector('.data-rows-container');
    data.rows.forEach((rowData, rowIndex) => {
        const row = document.createElement('div');
        row.className = 'data-row';

        rowData.forEach((cellText, cellIndex) => {
            const cell = document.createElement('textarea');
            cell.className = 'data-cell';
            cell.value = cellText;
            cell.placeholder = `데이터 ${cellIndex + 1}`;
            attachAutoResize(cell);  // 자동 높이 조절 추가
            row.appendChild(cell);
        });

        // 행 이동 버튼 추가
        const rowControls = document.createElement('div');
        rowControls.className = 'row-controls';
        rowControls.innerHTML = `
            <button class="row-move-btn" onclick="moveRowUp(this)">▲</button>
            <button class="row-move-btn" onclick="moveRowDown(this)">▼</button>
            <button class="voice-input-btn" onclick="startVoiceInput(this)">🎤</button>
        `;
        row.appendChild(rowControls);

        container.appendChild(row);
    });

    applyManualWidths();
    updatePlaceholders();
}

// 사이드바 토글 초기화
function initSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');

    // 스와이프 제스처 감지
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, false);

    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, false);

    function handleSwipe() {
        // 모달창이 열려있으면 스와이프 무시
        if (currentModal) return;

        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        // 가로 스와이프가 세로 스와이프보다 더 커야 함
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // 최소 스와이프 거리 (50px)
            if (Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    // 오른쪽으로 스와이프 -> 사이드바 보이기
                    sidebar.classList.remove('hidden');
                    mainContent.classList.remove('full');
                } else {
                    // 왼쪽으로 스와이프 -> 사이드바 숨기기
                    sidebar.classList.add('hidden');
                    mainContent.classList.add('full');
                }
            }
        }
    }
}

// 메모장 초기화
function initNotePad() {
    const notePad = document.getElementById('notePad');
    const handle = document.querySelector('.note-handle');
    const textarea = notePad.querySelector('.note-textarea');
    const content = notePad.querySelector('.note-content');

    let isDragging = false;
    let startY = 0;
    let startHeight = 0;
    let dragDistance = 0;
    let dragStartTime = 0;

    // 저장된 메모 불러오기
    const savedNote = localStorage.getItem('notepad_content');
    if (savedNote) {
        textarea.value = savedNote;
    }

    // 메모 내용 자동 저장
    textarea.addEventListener('input', function() {
        localStorage.setItem('notepad_content', textarea.value);
    });

    // 마우스 드래그 시작
    handle.addEventListener('mousedown', function(e) {
        e.preventDefault();
        isDragging = true;
        startY = e.clientY;
        startHeight = notePad.offsetHeight;
        dragDistance = 0;
        dragStartTime = Date.now();
        notePad.style.transition = 'none';
        handle.style.transition = 'none';
    });

    // 터치 드래그 시작
    handle.addEventListener('touchstart', function(e) {
        isDragging = true;
        startY = e.touches[0].clientY;
        startHeight = notePad.offsetHeight;
        dragDistance = 0;
        dragStartTime = Date.now();
        notePad.style.transition = 'none';
        handle.style.transition = 'none';
    }, { passive: true });

    // 마우스 드래그 중
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;

        const currentY = e.clientY;
        const diff = currentY - startY;
        dragDistance = Math.abs(diff);

        let newHeight = startHeight + diff;
        newHeight = Math.max(0, Math.min(newHeight, window.innerHeight - 50));

        notePad.style.height = newHeight + 'px';
        handle.style.top = newHeight + 'px';
        textarea.style.minHeight = (newHeight - 40) + 'px';

        if (newHeight > 0) {
            notePad.style.pointerEvents = 'auto';
        }
    });

    // 터치 드래그 중
    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY;
        dragDistance = Math.abs(diff);

        let newHeight = startHeight + diff;
        newHeight = Math.max(0, Math.min(newHeight, window.innerHeight - 50));

        notePad.style.height = newHeight + 'px';
        handle.style.top = newHeight + 'px';
        textarea.style.minHeight = (newHeight - 40) + 'px';

        if (newHeight > 0) {
            notePad.style.pointerEvents = 'auto';
        }
    }, { passive: true });

    // 마우스 드래그 종료
    document.addEventListener('mouseup', function(e) {
        if (!isDragging) return;

        isDragging = false;
        notePad.style.transition = 'height 0.3s ease';
        handle.style.transition = 'top 0.3s ease';

        const dragTime = Date.now() - dragStartTime;

        // 클릭으로 판단 (이동 거리 < 5px 그리고 시간 < 200ms)
        if (dragDistance < 5 && dragTime < 200) {
            // 클릭: 내용 지우고 접기
            textarea.value = '';
            localStorage.removeItem('notepad_content');
            notePad.style.height = '0';
            handle.style.top = '0';
            textarea.style.minHeight = '';
            notePad.style.pointerEvents = 'none';
        } else {
            // 드래그: 높이가 50px 미만이면 접기 (내용은 유지)
            const currentHeight = notePad.offsetHeight;
            if (currentHeight < 50) {
                notePad.style.height = '0';
                handle.style.top = '0';
                textarea.style.minHeight = '';
                notePad.style.pointerEvents = 'none';
            } else {
                notePad.style.pointerEvents = 'auto';
            }
        }
    });

    // 터치 드래그 종료
    document.addEventListener('touchend', function(e) {
        if (!isDragging) return;

        isDragging = false;
        notePad.style.transition = 'height 0.3s ease';
        handle.style.transition = 'top 0.3s ease';

        const dragTime = Date.now() - dragStartTime;

        // 클릭으로 판단
        if (dragDistance < 5 && dragTime < 200) {
            // 클릭: 내용 지우고 접기
            textarea.value = '';
            localStorage.removeItem('notepad_content');
            notePad.style.height = '0';
            handle.style.top = '0';
            textarea.style.minHeight = '';
            notePad.style.pointerEvents = 'none';
        } else {
            // 드래그: 높이가 50px 미만이면 접기 (내용은 유지)
            const currentHeight = notePad.offsetHeight;
            if (currentHeight < 50) {
                notePad.style.height = '0';
                handle.style.top = '0';
                textarea.style.minHeight = '';
                notePad.style.pointerEvents = 'none';
            } else {
                notePad.style.pointerEvents = 'auto';
            }
        }
    });
}
