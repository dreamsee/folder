// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    initCollapsible();
    initNavigation();
    initShowMoreButtons();
    initScrollTracking();
});

// 접기/펼치기 기능 초기화
function initCollapsible() {
    const toggleButton = document.querySelector('.toggle-button');
    const collapsibleContent = document.querySelector('.collapsible-content');
    
    if (toggleButton && collapsibleContent) {
        toggleButton.addEventListener('click', function() {
            collapsibleContent.classList.toggle('expanded');
            
            if (collapsibleContent.classList.contains('expanded')) {
                toggleButton.textContent = 'Show less';
            } else {
                toggleButton.textContent = 'Show more';
            }
        });
    }
}

// 네비게이션 기능 초기화
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // 활성 상태 업데이트
            navItems.forEach(navItem => navItem.classList.remove('active'));
            this.classList.add('active');
            
            // 해당 섹션으로 스크롤
            const targetId = this.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Show more 버튼 기능 초기화
function initShowMoreButtons() {
    const showMoreButtons = document.querySelectorAll('.show-more-btn');
    
    showMoreButtons.forEach(button => {
        button.addEventListener('click', function() {
            const moreContent = this.nextElementSibling;
            
            if (moreContent && moreContent.classList.contains('more-content')) {
                moreContent.classList.toggle('show');
                
                if (moreContent.classList.contains('show')) {
                    this.textContent = 'Show less';
                } else {
                    this.textContent = 'Show more';
                }
            }
        });
    });
}

// 스크롤 추적 기능 초기화
function initScrollTracking() {
    const sections = document.querySelectorAll('.content-section');
    const navItems = document.querySelectorAll('.nav-item');
    
    // 스크롤 이벤트에 디바운싱 적용
    let scrollTimer;
    
    window.addEventListener('scroll', function() {
        if (scrollTimer) {
            clearTimeout(scrollTimer);
        }
        
        scrollTimer = setTimeout(function() {
            updateActiveNavItem();
        }, 50);
    });
    
    function updateActiveNavItem() {
        const scrollPos = window.scrollY + 100;
        
        sections.forEach((section, index) => {
            const top = section.offsetTop;
            const bottom = top + section.offsetHeight;
            
            if (scrollPos >= top && scrollPos < bottom) {
                navItems.forEach(item => item.classList.remove('active'));
                
                // data-target 속성과 섹션 ID 매칭
                const sectionId = section.getAttribute('id');
                const correspondingNavItem = document.querySelector(`.nav-item[data-target="${sectionId}"]`);
                
                if (correspondingNavItem) {
                    correspondingNavItem.classList.add('active');
                }
            }
        });
    }
}

// 대화내역 데이터 통합 (추후 구현)
class 대화내역통합 {
    constructor() {
        this.대화내역파일들 = [
            '2025-08-09_001_대화요약파일생성요청.md',
            '2025-08-09_002_Windows명령어에러패턴학습요구.md',
            '2025-08-09_003_GitHub백업목적설명.md',
            '2025-08-09_004_역사서개념제안.md',
            '2025-08-09_005_AI관점코드길이판단메뉴얼화.md'
        ];
    }
    
    async 파일읽기(파일경로) {
        try {
            const 응답 = await fetch(파일경로);
            const 텍스트 = await 응답.text();
            return this.마크다운파싱(텍스트);
        } catch (error) {
            console.error('파일 읽기 오류:', error);
            return null;
        }
    }
    
    마크다운파싱(텍스트) {
        // 간단한 마크다운 파싱 (실제로는 marked.js 같은 라이브러리 사용 권장)
        let html = 텍스트;
        
        // 제목 변환
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // 굵은 글씨
        html = html.replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>');
        
        // 코드 블록
        html = html.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
        
        // 인라인 코드
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // 줄바꿈
        html = html.replace(/\n/g, '<br>');
        
        return html;
    }
    
    섹션생성(제목, 내용) {
        return `
            <section class="content-section">
                <h2>${제목}</h2>
                <div class="feature-card">
                    ${내용}
                </div>
            </section>
        `;
    }
    
    async 대화내역로드() {
        const contentArea = document.querySelector('.content-area');
        
        for (const 파일명 of this.대화내역파일들) {
            const 파일경로 = `../../휴지통/3_read_저장소/${파일명}`;
            const 내용 = await this.파일읽기(파일경로);
            
            if (내용) {
                const 제목 = 파일명.replace('.md', '').replace(/_/g, ' ');
                const 섹션HTML = this.섹션생성(제목, 내용);
                
                // 기존 콘텐츠에 추가
                contentArea.insertAdjacentHTML('beforeend', 섹션HTML);
            }
        }
    }
}

// 대화내역 통합 기능 활성화 (선택적)
// const 통합시스템 = new 대화내역통합();
// 통합시스템.대화내역로드();