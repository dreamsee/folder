// UX 전문가 수준 인터랙션 스크립트

// 온보딩 시스템
let onboardingStep = 1;
const maxOnboardingSteps = 3;

function nextOnboardingStep() {
    if (onboardingStep < maxOnboardingSteps) {
        // 현재 스텝 숨기기
        document.querySelector(`[data-step="${onboardingStep}"]`).classList.add('hidden');
        
        // 다음 스텝 보이기
        onboardingStep++;
        document.querySelector(`[data-step="${onboardingStep}"]`).classList.remove('hidden');
    }
}

function closeOnboarding() {
    // 온보딩 완료 표시
    localStorage.setItem('onboardingCompleted', 'true');
    
    // 온보딩 오버레이 숨기기
    const overlay = document.getElementById('onboarding-overlay');
    overlay.style.opacity = '0';
    
    setTimeout(() => {
        overlay.style.display = 'none';
        showToast('환영합니다! 지출 관리를 시작해보세요 🎉');
    }, 300);
}

// 페이지 로드시 온보딩 체크
document.addEventListener('DOMContentLoaded', () => {
    const onboardingCompleted = localStorage.getItem('onboardingCompleted');
    if (onboardingCompleted) {
        document.getElementById('onboarding-overlay').style.display = 'none';
    }
});

// 사이드 패널 관리
let currentPanelContent = 'quickInput';

function openSidePanel(contentType = 'quickInput') {
    const sidePanel = document.getElementById('sidePanel');
    const sidePanelOverlay = document.getElementById('sidePanelOverlay');
    const panelTitle = document.getElementById('panelTitle');
    const panelContent = document.getElementById('panelContent');
    
    // 패널 제목 설정
    const titles = {
        quickInput: '빠른 지출 입력',
        monthlyExpenses: '이번 달 지출',
        specialPurchases: '특별 구매 기록'
    };
    
    panelTitle.textContent = titles[contentType] || '지출 관리';
    
    // 컨텐츠 보이기/숨기기
    const allForms = panelContent.querySelectorAll('[id$="Form"], [id$="List"]');
    allForms.forEach(form => form.style.display = 'none');
    
    const targetForm = document.getElementById(contentType + 'Form') || 
                      document.getElementById(contentType + 'List') ||
                      document.getElementById('quickInputForm');
    
    if (targetForm) {
        targetForm.style.display = 'block';
    }
    
    // 패널 및 오버레이 열기
    sidePanelOverlay.classList.add('active');
    sidePanel.classList.add('open');
    currentPanelContent = contentType;
    
    // body 스크롤 방지 (모바일에서)
    document.body.style.overflow = 'hidden';
    
    // 오늘 날짜 기본 설정
    const dateInputs = targetForm.querySelectorAll('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];
    dateInputs.forEach(input => {
        if (!input.value) input.value = today;
    });
}

function closeSidePanel() {
    const sidePanel = document.getElementById('sidePanel');
    const sidePanelOverlay = document.getElementById('sidePanelOverlay');
    
    // 패널 및 오버레이 닫기
    sidePanel.classList.remove('open');
    sidePanelOverlay.classList.remove('active');
    
    // body 스크롤 복원
    document.body.style.overflow = '';
}

// 퀵 액션 함수들
function quickAddExpense() {
    openSidePanel('quickInput');
}

function showThisMonth() {
    openSidePanel('monthlyExpenses');
    updateMonthlyExpensesList();
}

function showInsights() {
    updateInsights();
    // 인사이트 패널로 스크롤
    document.querySelector('.insights-panel').scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
    });
}

function showSettings() {
    showToast('설정 기능은 준비 중입니다 ⚙️');
}

// 카테고리 선택 관리
function setupCategorySelection() {
    const categoryBtns = document.querySelectorAll('.category-btn');
    let selectedCategory = 'food'; // 기본값
    
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 이전 선택 해제
            categoryBtns.forEach(b => b.classList.remove('selected'));
            
            // 현재 버튼 선택
            btn.classList.add('selected');
            selectedCategory = btn.dataset.category;
        });
    });
    
    // 기본 카테고리 선택
    if (categoryBtns.length > 0) {
        categoryBtns[0].classList.add('selected');
    }
    
    return () => selectedCategory;
}

// 빠른 지출 저장
function saveQuickExpense() {
    const name = document.getElementById('quickExpenseName').value.trim();
    const amount = parseInt(document.getElementById('quickExpenseAmount').value);
    const date = document.getElementById('quickExpenseDate').value;
    const selectedCategoryBtn = document.querySelector('.category-btn.selected');
    
    if (!name || !amount || !date) {
        showToast('모든 필드를 입력해주세요', 'error');
        return;
    }
    
    if (!selectedCategoryBtn) {
        showToast('카테고리를 선택해주세요', 'error');
        return;
    }
    
    const category = selectedCategoryBtn.dataset.category;
    
    // 기존 시스템과 연동
    if (!expenses[date]) {
        expenses[date] = [];
    }
    
    expenses[date].push({
        name: name,
        category: category,
        amount: amount,
        timestamp: new Date().getTime()
    });
    
    // 로컬스토리지에 저장
    localStorage.setItem('expenses', JSON.stringify(expenses));
    
    // UI 업데이트
    generateCalendar();
    updateExpenseSummary();
    updateMonthlyTotal();
    updateInsights();
    
    // 폼 초기화
    document.getElementById('quickExpenseName').value = '';
    document.getElementById('quickExpenseAmount').value = '';
    
    // 성공 피드백
    showToast(`${formatNumber(amount)}원 지출이 저장되었습니다 ✅`);
    
    // 패널 닫기 (선택사항)
    setTimeout(() => closeSidePanel(), 1000);
}

// 특별 구매 저장
function saveSpecialPurchase() {
    const itemName = document.getElementById('specialItemName').value.trim();
    const itemPrice = parseInt(document.getElementById('specialItemPrice').value);
    const purchaseDate = document.getElementById('specialPurchaseDate').value;
    
    if (!itemName || !itemPrice || !purchaseDate) {
        showToast('모든 필드를 입력해주세요', 'error');
        return;
    }
    
    specialPurchases.push({
        name: itemName,
        price: itemPrice,
        date: purchaseDate,
        timestamp: new Date().getTime()
    });
    
    // 로컬스토리지에 저장
    localStorage.setItem('specialPurchases', JSON.stringify(specialPurchases));
    
    // 폼 초기화
    document.getElementById('specialItemName').value = '';
    document.getElementById('specialItemPrice').value = '';
    
    // 목록 업데이트
    updateSpecialPurchasesList();
    
    // 성공 피드백
    showToast(`${itemName} 구매가 기록되었습니다 🛍️`);
}

// 월별 총액 업데이트
function updateMonthlyTotal() {
    const currentMonth = formatMonth(currentDate);
    const monthlyExpenses = getMonthlyExpenses(currentMonth);
    
    let total = 0;
    Object.keys(monthlyExpenses).forEach(date => {
        monthlyExpenses[date].forEach(expense => {
            total += expense.amount;
        });
    });
    
    document.getElementById('monthlyTotal').textContent = formatNumber(total) + '원';
}

// 인사이트 업데이트
function updateInsights() {
    const currentMonth = formatMonth(currentDate);
    const monthlyExpenses = getMonthlyExpenses(currentMonth);
    
    // 카테고리별 총액 계산
    const categoryTotals = {};
    let totalAmount = 0;
    let dayCount = 0;
    
    Object.keys(monthlyExpenses).forEach(date => {
        if (monthlyExpenses[date].length > 0) {
            dayCount++;
        }
        monthlyExpenses[date].forEach(expense => {
            if (!categoryTotals[expense.category]) {
                categoryTotals[expense.category] = 0;
            }
            categoryTotals[expense.category] += expense.amount;
            totalAmount += expense.amount;
        });
    });
    
    // 가장 많이 쓴 카테고리 찾기
    let topCategory = '없음';
    let maxAmount = 0;
    
    Object.keys(categoryTotals).forEach(category => {
        if (categoryTotals[category] > maxAmount) {
            maxAmount = categoryTotals[category];
            topCategory = getCategoryName(category);
        }
    });
    
    // 평균 일일 지출 계산
    const dailyAverage = dayCount > 0 ? Math.round(totalAmount / dayCount) : 0;
    
    // UI 업데이트
    document.getElementById('topCategory').textContent = topCategory;
    document.getElementById('dailyAverage').textContent = formatNumber(dailyAverage) + '원';
    
    // 지난 달 대비 계산 (추후 구현)
    document.getElementById('monthlyTrend').textContent = '계산 중...';
}

// 카테고리 이름 변환
function getCategoryName(category) {
    const names = {
        food: '식비',
        transport: '교통',
        shopping: '쇼핑',
        entertainment: '여가',
        health: '건강',
        other: '기타'
    };
    return names[category] || category;
}

// 이번 달 지출 목록 업데이트
function updateMonthlyExpensesList() {
    const currentMonth = formatMonth(currentDate);
    const monthlyExpenses = getMonthlyExpenses(currentMonth);
    const container = document.getElementById('expenseBreakdown');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    // 카테고리별 그룹화
    const categoryGroups = {};
    Object.keys(monthlyExpenses).forEach(date => {
        monthlyExpenses[date].forEach(expense => {
            if (!categoryGroups[expense.category]) {
                categoryGroups[expense.category] = [];
            }
            categoryGroups[expense.category].push({...expense, date});
        });
    });
    
    // 카테고리별 표시
    Object.keys(categoryGroups).forEach(category => {
        const categoryExpenses = categoryGroups[category];
        const totalAmount = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'expense-category-summary';
        categoryDiv.innerHTML = `
            <div class="category-summary-header">
                <span class="category-name">${getCategoryName(category)}</span>
                <span class="category-amount">${formatNumber(totalAmount)}원</span>
            </div>
            <div class="category-items">
                ${categoryExpenses.slice(0, 3).map(exp => `
                    <div class="expense-item-mini">
                        <span>${exp.name}</span>
                        <span>${formatNumber(exp.amount)}원</span>
                    </div>
                `).join('')}
                ${categoryExpenses.length > 3 ? `
                    <div class="expense-more">외 ${categoryExpenses.length - 3}건</div>
                ` : ''}
            </div>
        `;
        
        container.appendChild(categoryDiv);
    });
}

// 특별 구매 목록 업데이트
function updateSpecialPurchasesList() {
    const container = document.getElementById('specialPurchasesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    const sortedPurchases = specialPurchases
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5); // 최근 5개만 표시
    
    sortedPurchases.forEach(purchase => {
        const purchaseDiv = document.createElement('div');
        purchaseDiv.className = 'special-purchase-item';
        purchaseDiv.innerHTML = `
            <div class="purchase-name">${purchase.name}</div>
            <div class="purchase-details">
                ${purchase.date} | ${formatNumber(purchase.price)}원
            </div>
        `;
        container.appendChild(purchaseDiv);
    });
}

// 토스트 알림 시스템
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = toast.querySelector('.toast-icon');
    
    // 아이콘 설정
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toastIcon.textContent = icons[type] || icons.success;
    toastMessage.textContent = message;
    
    // 스타일 설정
    if (type === 'error') {
        toast.style.background = 'var(--red-600)';
    } else if (type === 'warning') {
        toast.style.background = 'var(--amber-600)';
    } else {
        toast.style.background = 'var(--gray-800)';
    }
    
    // 토스트 표시
    toast.classList.add('show');
    
    // 3초 후 자동 숨기기
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 인사이트 토글
function toggleInsights() {
    const insightContent = document.getElementById('insightContent');
    const toggle = document.querySelector('.insight-toggle');
    
    if (insightContent.style.display === 'none') {
        insightContent.style.display = 'grid';
        toggle.textContent = '📊';
        updateInsights();
    } else {
        insightContent.style.display = 'none';
        toggle.textContent = '👁️';
    }
}

// 초기화 함수
function initializeUXFeatures() {
    // 카테고리 선택 기능 초기화
    setupCategorySelection();
    
    // 월별 총액 업데이트
    updateMonthlyTotal();
    
    // 인사이트 업데이트
    updateInsights();
    
    // ESC 키로 사이드 패널 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSidePanel();
        }
    });
    
    // 사이드 패널 외부 클릭으로 닫기
    document.addEventListener('click', (e) => {
        const sidePanel = document.getElementById('sidePanel');
        const floatingBtn = document.querySelector('.floating-action-btn');
        const quickActionBtns = document.querySelectorAll('.quick-action-btn');
        
        if (sidePanel.classList.contains('open') && 
            !sidePanel.contains(e.target) && 
            !floatingBtn.contains(e.target) &&
            ![...quickActionBtns].some(btn => btn.contains(e.target))) {
            closeSidePanel();
        }
    });
}

// DOM 로드 완료 후 UX 기능 초기화
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initializeUXFeatures();
    }, 100);
});