# JSX 구조 오류 해결 방법 가이드

## 🚨 문제 상황
React/TypeScript 개발 중 JSX 태그 구조 오류로 인한 컴파일 실패

## 🔍 일반적인 JSX 구조 오류 유형

### 1. 태그 중첩 오류
```tsx
// ❌ 잘못된 예시
<div>
  <TabsContent value="tab1">
    <div>내용</div>
  </div>  {/* TabsContent 닫기 태그 누락 */}
</div>

// ✅ 올바른 예시
<div>
  <TabsContent value="tab1">
    <div>내용</div>
  </TabsContent>  {/* 올바른 닫기 태그 */}
</div>
```

### 2. 들여쓰기 불일치
```tsx
// ❌ 잘못된 들여쓰기
<Tabs>
  <TabsContent>
    <div>내용</div>
            </TabsContent>  {/* 잘못된 들여쓰기 */}
</Tabs>

// ✅ 올바른 들여쓰기
<Tabs>
  <TabsContent>
    <div>내용</div>
  </TabsContent>  {/* 일관된 들여쓰기 */}
</Tabs>
```

### 3. 조건부 렌더링에서의 구조 오류
```tsx
// ❌ 잘못된 조건부 렌더링
{condition && (
  <div>
    <TabsContent>
      내용
    </div>  {/* TabsContent 닫기 태그 없음 */}
)}

// ✅ 올바른 조건부 렌더링
{condition && (
  <div>
    <TabsContent>
      내용
    </TabsContent>  {/* 올바른 닫기 태그 */}
  </div>
)}
```

## 🛠️ 해결 방법

### 1. 단계별 디버깅
```bash
# 1. 오류 메시지에서 정확한 라인 번호 확인
# 예: "Expected corresponding JSX closing tag for <TabsContent>. (222:10)"

# 2. 해당 라인과 그 주변 코드 확인
# 3. 태그 쌍 매칭 검사
# 4. 들여쓰기 일관성 확인
```

### 2. IDE 도구 활용
- **VS Code**: JSX/TSX 구문 강조 및 자동 포맷팅
- **Prettier**: 일관된 코드 포맷팅
- **ESLint**: JSX 구문 오류 사전 감지

### 3. 점진적 구현 전략
```tsx
// 1단계: 기본 구조 먼저 구현
<Tabs>
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
  </TabsList>
</Tabs>

// 2단계: 콘텐츠 추가
<Tabs>
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    {/* 기본 내용 */}
  </TabsContent>
</Tabs>

// 3단계: 복잡한 내용 단계적 추가
<Tabs>
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    <div className="space-y-4">
      {/* 상세 내용 */}
    </div>
  </TabsContent>
</Tabs>
```

## 🔧 실제 해결 사례

### 발생한 오류
```
[plugin:vite:react-babel] Expected corresponding JSX closing tag for <TabsContent>. (222:10)
```

### 문제 코드
```tsx
            )}
            </TabsContent>  // 들여쓰기 4칸 더 들어감
```

### 해결 코드
```tsx
            )}
          </TabsContent>    // 올바른 들여쓰기로 수정
```

### 해결 과정
1. **오류 위치 확인**: 222번 라인의 `</TabsContent>` 태그
2. **구조 분석**: 해당 태그가 속한 중첩 구조 파악
3. **들여쓰기 수정**: 상위 태그들과 일관된 들여쓰기로 조정
4. **검증**: 컴파일 오류 해결 확인

## 📋 JSX 구조 체크리스트

### ✅ 개발 전 준비사항
- [ ] IDE에 JSX/TSX 플러그인 설치
- [ ] Prettier 설정으로 자동 포맷팅 활성화
- [ ] ESLint JSX 규칙 설정

### ✅ 코딩 중 확인사항
- [ ] 여는 태그와 닫는 태그 쌍 확인
- [ ] 중첩된 태그의 들여쓰기 일관성
- [ ] 조건부 렌더링에서 완전한 태그 구조
- [ ] Fragment(`<>` 또는 `<React.Fragment>`) 올바른 사용

### ✅ 오류 발생 시 대응방법
1. **오류 메시지 정확히 분석**
2. **해당 라인 주변 코드 점검**
3. **단계적으로 코드 단순화**
4. **IDE의 구문 강조 기능 활용**
5. **필요시 코드 블록별로 주석 처리하여 범위 좁히기**

## 🎯 예방 전략

### 1. 코드 리뷰
- JSX 구조 오류는 코드 리뷰에서 쉽게 발견 가능
- 팀원 간 상호 검토로 오류 사전 방지

### 2. 자동화 도구
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 120,
  "tabWidth": 2,
  "jsxSingleQuote": false
}
```

### 3. 개발 환경 설정
- 실시간 구문 검사 활성화
- 자동 저장 시 포맷팅 적용
- Git pre-commit hook으로 구문 오류 방지

## 📚 추가 리소스
- [React 공식 문서 - JSX 소개](https://reactjs.org/docs/introducing-jsx.html)
- [TypeScript JSX 핸드북](https://www.typescriptlang.org/docs/handbook/jsx.html)
- [VS Code React 개발 환경 설정](https://code.visualstudio.com/docs/nodejs/reactjs-tutorial)