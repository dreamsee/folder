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
                        <div class="header-column">
                            <input type="text" class="header-cell" placeholder="열 제목 1">
                            <div class="column-bottom">
                                <input type="number" class="width-input" placeholder="비율" value="1" min="1" max="10" oninput="applyManualWidths()">
                                <div class="column-controls">
                                    <button class="column-btn" onclick="moveColumnLeft(this)">◀</button>
                                    <button class="column-btn" onclick="moveColumnRight(this)">▶</button>
                                    <button class="column-btn delete" onclick="deleteColumn(this)">×</button>
                                </div>
                            </div>
                        </div>
                        <button class="add-column-btn" onclick="addColumn(this)">+ 열 추가</button>
                    </div>
                </div>
                <div class="input-fields">
                    <div class="data-rows-container">
                        <div class="data-row">
                            <textarea class="data-cell" placeholder="데이터 1"></textarea>
                        </div>
                    </div>
                    <div class="add-row-wrapper">
                        <button class="add-row-btn" onclick="addDataRow(this)">+ 행 추가</button>
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

    // 헤더에 새 열 추가
    const newColumn = document.createElement('div');
    newColumn.className = 'header-column';
    newColumn.innerHTML = `
        <input type="text" class="header-cell" placeholder="열 제목 ${currentColumns + 1}">
        <div class="column-bottom">
            <input type="number" class="width-input" placeholder="비율" value="1" min="1" max="10" oninput="applyManualWidths()">
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
        row.appendChild(newCell);
    });

    applyManualWidths();

    if (currentColumns + 1 >= 10) {
        button.disabled = true;
    }
}

// 데이터 행 추가
function addDataRow(button) {
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
        newRow.appendChild(cell);
    }

    container.appendChild(newRow);
    applyManualWidths();
}

// 수동 너비 비율 적용
function applyManualWidths() {
    if (!currentModal) return;

    const modal = currentModal.querySelector('.modal-content');
    const headerColumns = modal.querySelectorAll('.header-column');
    const dataRows = modal.querySelectorAll('.data-row');
    const widthInputs = modal.querySelectorAll('.width-input');

    // 비율 값 수집
    const ratios = Array.from(widthInputs).map(input => {
        const value = parseInt(input.value) || 1;
        return Math.max(1, Math.min(10, value)); // 1~10 사이로 제한
    });

    const totalRatio = ratios.reduce((sum, ratio) => sum + ratio, 0);

    // 헤더 열에 너비 적용
    headerColumns.forEach((column, index) => {
        column.style.flex = `${ratios[index]} 1 0`;
    });

    // 데이터 셀에 너비 적용
    dataRows.forEach(row => {
        const cells = row.querySelectorAll('.data-cell');
        cells.forEach((cell, index) => {
            cell.style.flex = `${ratios[index]} 1 0`;
        });
    });
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

    applyManualWidths();
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
    const widthInputs = modal.querySelectorAll('.width-input');
    const dataRows = modal.querySelectorAll('.data-row');

    const headers = Array.from(headerCells).map(cell => cell.value);
    const widths = Array.from(widthInputs).map(input => parseInt(input.value) || 1);
    const rows = Array.from(dataRows).map(row => {
        return Array.from(row.querySelectorAll('.data-cell')).map(cell => cell.value);
    });

    modalDataStore[buttonName] = {
        headers: headers,
        widths: widths,
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
    inputFields.innerHTML = '<div class="data-rows-container"></div><div class="add-row-wrapper"><button class="add-row-btn" onclick="addDataRow(this)">+ 행 추가</button></div>';

    // 헤더 복원
    data.headers.forEach((headerText, index) => {
        const column = document.createElement('div');
        column.className = 'header-column';
        column.innerHTML = `
            <input type="text" class="header-cell" value="${headerText}" placeholder="열 제목 ${index + 1}">
            <div class="column-bottom">
                <input type="number" class="width-input" placeholder="비율" value="${data.widths ? data.widths[index] : 1}" min="1" max="10" oninput="applyManualWidths()">
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
    addColumnBtn.textContent = '+ 열 추가';
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
            row.appendChild(cell);
        });

        container.appendChild(row);
    });

    applyManualWidths();
}
