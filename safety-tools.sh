#!/bin/bash

# 안전장치: 로컬 파일 삭제 시 실수로 git commit하지 않도록 보호

# 색깔 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 로컬 파일만 삭제하는 안전한 함수
safe_local_delete() {
    local target_folder="$1"
    
    if [ -z "$target_folder" ]; then
        echo -e "${RED}❌ 오류: 삭제할 폴더를 지정해주세요${NC}"
        echo "사용법: safe_local_delete <폴더명>"
        return 1
    fi
    
    if [ ! -d "$target_folder" ]; then
        echo -e "${RED}❌ 오류: '$target_folder' 폴더가 존재하지 않습니다${NC}"
        return 1
    fi
    
    # 경고 메시지
    echo -e "${YELLOW}⚠️  경고: 로컬에서만 '$target_folder' 폴더를 삭제합니다${NC}"
    echo -e "${YELLOW}   Git 저장소에서는 삭제되지 않습니다${NC}"
    
    # 확인 요청
    read -p "계속하시겠습니까? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}✅ 삭제가 취소되었습니다${NC}"
        return 0
    fi
    
    # git에서 추적 중지 (하지만 원격 저장소에서는 유지)
    echo -e "${GREEN}🔄 Git 추적에서 제외 중...${NC}"
    git rm -r --cached "$target_folder" 2>/dev/null
    
    # .gitignore에 추가
    echo "$target_folder/" >> .gitignore
    echo -e "${GREEN}✅ .gitignore에 추가됨${NC}"
    
    # 로컬 파일 삭제
    echo -e "${GREEN}🗑️  로컬 파일 삭제 중...${NC}"
    rm -rf "$target_folder"
    
    echo -e "${GREEN}✅ 로컬에서 '$target_folder' 삭제 완료${NC}"
    echo -e "${YELLOW}💡 참고: Git 저장소에서는 여전히 유지됩니다${NC}"
}

# 위험한 git 명령어 차단 함수
block_dangerous_git() {
    local command="$1"
    
    # 대량 삭제가 포함된 커밋 차단
    local deleted_files=$(git status --porcelain | grep -c "^D")
    
    if [ "$deleted_files" -gt 10 ]; then
        echo -e "${RED}🚫 위험한 작업 차단!${NC}"
        echo -e "${RED}   $deleted_files 개의 파일이 삭제 예정입니다${NC}"
        echo -e "${YELLOW}   정말로 이 많은 파일을 삭제하시겠습니까?${NC}"
        
        read -p "위험한 커밋을 강행하시겠습니까? (type 'CONFIRM' to proceed): " confirm
        if [ "$confirm" != "CONFIRM" ]; then
            echo -e "${GREEN}✅ 위험한 커밋이 차단되었습니다${NC}"
            return 1
        fi
    fi
    
    return 0
}

# 안전한 git commit 래퍼
safe_git_commit() {
    local message="$1"
    
    if ! block_dangerous_git "commit"; then
        return 1
    fi
    
    git add .
    git commit -m "$message"
    
    echo -e "${GREEN}✅ 안전하게 커밋되었습니다${NC}"
}

# 복구 함수
recover_deleted_files() {
    local commit_hash="$1"
    
    if [ -z "$commit_hash" ]; then
        echo -e "${RED}❌ 복구할 커밋 해시를 입력해주세요${NC}"
        echo "사용법: recover_deleted_files <커밋해시>"
        echo "예시: recover_deleted_files HEAD~1"
        return 1
    fi
    
    echo -e "${YELLOW}🔄 파일 복구 중...${NC}"
    git revert "$commit_hash" --no-edit
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 파일이 성공적으로 복구되었습니다${NC}"
        git push
    else
        echo -e "${RED}❌ 복구 실패${NC}"
    fi
}

# 도움말
show_help() {
    echo -e "${GREEN}🛡️  안전장치 도구 사용법${NC}"
    echo ""
    echo -e "${YELLOW}로컬 파일 삭제:${NC}"
    echo "  safe_local_delete <폴더명>    # 로컬에서만 삭제"
    echo ""
    echo -e "${YELLOW}안전한 커밋:${NC}"
    echo "  safe_git_commit \"메시지\"      # 위험한 커밋 차단"
    echo ""
    echo -e "${YELLOW}파일 복구:${NC}"
    echo "  recover_deleted_files <해시>   # 삭제된 파일 복구"
    echo ""
    echo -e "${YELLOW}도움말:${NC}"
    echo "  safety_help                   # 이 도움말 표시"
}

# 별칭 설정
alias safety_help='show_help'
alias safe_delete='safe_local_delete'
alias safe_commit='safe_git_commit'
alias git_recover='recover_deleted_files'

echo -e "${GREEN}🛡️  안전장치가 로드되었습니다${NC}"
echo -e "${YELLOW}💡 'safety_help' 명령어로 사용법을 확인하세요${NC}"