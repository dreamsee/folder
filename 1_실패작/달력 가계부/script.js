// 전역 변수
let currentDate = new Date();
let expenses = JSON.parse(localStorage.getItem('expenses')) || {};
let specialPurchases = JSON.parse(localStorage.getItem('specialPurchases')) || [];

// 날짜 포맷팅 함수
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function formatMonth(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// 숫자 포맷팅 (천단위 콤마)
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 달력 초기화
function initCalendar() {
    updateCalendarHeader();
    generateCalendar();
    updateExpenseSummary();
}

// 달력 헤더 업데이트
function updateCalendarHeader() {
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', 
                       '7월', '8월', '9월', '10월', '11월', '12월'];
    document.getElementById('currentMonth').textContent = 
        `${currentDate.getFullYear()}년 ${monthNames[currentDate.getMonth()]}`;
}

// 달력 생성
function generateCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    // 요일 헤더 추가
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    weekdays.forEach(day => {
        const weekdayElement = document.createElement('div');
        weekdayElement.className = 'weekday-header';
        weekdayElement.textContent = day;
        calendar.appendChild(weekdayElement);
    });

    // 현재 월의 첫째 날과 마지막 날 계산
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // 달력 날짜 생성 (6주)
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // 다른 월의 날짜 표시
        if (date.getMonth() !== currentDate.getMonth()) {
            dayElement.classList.add('other-month');
        }
        
        // 오늘 날짜 표시
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // 지출이 있는 날짜 표시
        const dateKey = formatDate(date);
        if (expenses[dateKey] && expenses[dateKey].length > 0) {
            dayElement.classList.add('has-expense');
        }
        
        dayElement.innerHTML = `
            <div class="day-number">${date.getDate()}</div>
            <div class="day-expenses">${getDayExpensesText(dateKey)}</div>
        `;
        
        calendar.appendChild(dayElement);
    }
}

// 특정 날짜의 지출 텍스트 가져오기
function getDayExpensesText(dateKey) {
    if (!expenses[dateKey] || expenses[dateKey].length === 0) {
        return '';
    }
    
    const totalAmount = expenses[dateKey].reduce((sum, expense) => sum + expense.amount, 0);
    return `${formatNumber(totalAmount)}원`;
}

// 지출 추가
function addExpense() {
    const name = document.getElementById('expenseName').value.trim();
    const category = document.getElementById('expenseCategory').value;
    const amount = parseInt(document.getElementById('expenseAmount').value);
    const date = document.getElementById('expenseDate').value;
    
    if (!name || !amount || !date) {
        alert('모든 필드를 입력해주세요.');
        return;
    }
    
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
    
    // 폼 초기화
    document.getElementById('expenseName').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseDate').value = '';
    
    // 화면 업데이트
    generateCalendar();
    updateExpenseSummary();
    updateMonthlyList();
}

// 특정 물품 구입 추가
function addPurchase() {
    const itemName = document.getElementById('itemName').value.trim();
    const itemPrice = parseInt(document.getElementById('itemPrice').value);
    const purchaseDate = document.getElementById('purchaseDate').value;
    
    if (!itemName || !itemPrice || !purchaseDate) {
        alert('모든 필드를 입력해주세요.');
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
    document.getElementById('itemName').value = '';
    document.getElementById('itemPrice').value = '';
    document.getElementById('purchaseDate').value = '';
    
    // 화면 업데이트
    updatePurchaseList();
}

// 카테고리 토글
function toggleCategory(categoryId) {
    const details = document.getElementById(`${categoryId}-details`);
    const toggle = document.getElementById(`${categoryId}-toggle`);
    
    if (details.classList.contains('hidden')) {
        details.classList.remove('hidden');
        toggle.textContent = '▼';
    } else {
        details.classList.add('hidden');
        toggle.textContent = '▶';
    }
}

// 서브카테고리 토글
function toggleSubcategory(subcategoryId) {
    const details = document.getElementById(`${subcategoryId}-details`);
    const toggle = document.getElementById(`${subcategoryId}-toggle`);
    
    if (details.classList.contains('hidden')) {
        details.classList.remove('hidden');
        toggle.textContent = '▼';
    } else {
        details.classList.add('hidden');
        toggle.textContent = '▶';
    }
}

// 지출 요약 업데이트
function updateExpenseSummary() {
    const currentMonth = formatMonth(currentDate);
    const monthlyExpenses = getMonthlyExpenses(currentMonth);
    
    // 카테고리별 총액 계산
    const categoryTotals = {
        food: 0,
        transport: 0,
        parking: 0,
        insurance: 0,
        other: 0
    };
    
    const categoryDetails = {
        food: [],
        transport: [],
        parking: [],
        insurance: [],
        other: []
    };
    
    Object.keys(monthlyExpenses).forEach(date => {
        monthlyExpenses[date].forEach(expense => {
            categoryTotals[expense.category] += expense.amount;
            categoryDetails[expense.category].push({
                ...expense,
                date: date
            });
        });
    });
    
    // 총액 업데이트
    document.getElementById('food-total').textContent = `(${formatNumber(categoryTotals.food)}원)`;
    document.getElementById('transport-total').textContent = `(${formatNumber(categoryTotals.transport)}원)`;
    document.getElementById('parking-total').textContent = `(${formatNumber(categoryTotals.parking)}원)`;
    document.getElementById('insurance-total').textContent = `(${formatNumber(categoryTotals.insurance)}원)`;
    
    // 상세 내역 업데이트
    updateCategoryDetails('food', categoryDetails.food);
    updateCategoryDetails('parking', categoryDetails.parking);
    updateCategoryDetails('insurance', categoryDetails.insurance);
}

// 카테고리 상세 내역 업데이트
function updateCategoryDetails(categoryId, expenses) {
    const container = document.getElementById(`${categoryId}-details`);
    container.innerHTML = '';
    
    expenses.forEach(expense => {
        const expenseElement = document.createElement('div');
        expenseElement.className = 'expense-item';
        expenseElement.innerHTML = `
            <span>${expense.date.split('-')[2]}일 ${expense.name}</span>
            <span>${formatNumber(expense.amount)}원</span>
        `;
        container.appendChild(expenseElement);
    });
}

// 현재 월의 지출 가져오기
function getMonthlyExpenses(monthKey) {
    const monthlyExpenses = {};
    Object.keys(expenses).forEach(date => {
        if (date.startsWith(monthKey)) {
            monthlyExpenses[date] = expenses[date];
        }
    });
    return monthlyExpenses;
}

// 월별 목록 업데이트
function updateMonthlyList() {
    const currentMonth = formatMonth(currentDate);
    const monthlyExpenses = getMonthlyExpenses(currentMonth);
    const container = document.getElementById('monthlyList');
    container.innerHTML = '';
    
    const allExpenses = [];
    Object.keys(monthlyExpenses).forEach(date => {
        monthlyExpenses[date].forEach(expense => {
            allExpenses.push({...expense, date});
        });
    });
    
    // 날짜순 정렬
    allExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    allExpenses.forEach(expense => {
        const expenseElement = document.createElement('div');
        expenseElement.className = 'expense-list-item';
        expenseElement.innerHTML = `
            <div class="item-name">${expense.name}</div>
            <div class="item-details">
                ${expense.date} | ${expense.category} | ${formatNumber(expense.amount)}원
            </div>
        `;
        container.appendChild(expenseElement);
    });
}

// 특정 물품 구입 목록 업데이트
function updatePurchaseList() {
    const container = document.getElementById('purchaseList');
    container.innerHTML = '';
    
    // 날짜순 정렬
    const sortedPurchases = specialPurchases.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedPurchases.forEach(purchase => {
        const purchaseElement = document.createElement('div');
        purchaseElement.className = 'purchase-list-item';
        purchaseElement.innerHTML = `
            <div class="item-name">${purchase.name}</div>
            <div class="item-details">
                ${purchase.date} | ${formatNumber(purchase.price)}원
            </div>
        `;
        container.appendChild(purchaseElement);
    });
}

// 이벤트 리스너
document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    initCalendar();
    updateMonthlyList();
});

document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    initCalendar();
    updateMonthlyList();
});

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    initCalendar();
    updateMonthlyList();
    updatePurchaseList();
    
    // 오늘 날짜를 기본값으로 설정
    const today = formatDate(new Date());
    document.getElementById('expenseDate').value = today;
    document.getElementById('purchaseDate').value = today;
});