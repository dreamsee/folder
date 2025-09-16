import React from 'react';

export default function TextRegionManagerDemo() {
  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white">
      <h3 className="text-lg font-bold mb-4">텍스트 영역 관리 시스템 예시</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽: 텍스트 에디터 영역 */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700">텍스트 편집 영역</h4>
          
          <svg width="100%" height="400" className="border border-gray-300 rounded-lg bg-gray-50">
            {/* 배경 */}
            <rect width="100%" height="100%" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1"/>
            
            {/* 줄 번호 영역 */}
            <rect x="0" y="0" width="40" height="400" fill="#e5e7eb"/>
            <line x1="40" y1="0" x2="40" y2="400" stroke="#d1d5db" strokeWidth="1"/>
            
            {/* 줄 번호 */}
            {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map((num, i) => (
              <text key={num} x="20" y={20 + i * 25} textAnchor="middle" 
                    fontSize="12" fill="#6b7280" fontFamily="monospace">
                {num}
              </text>
            ))}
            
            {/* 텍스트 라인들 */}
            <text x="50" y="20" fontSize="13" fontFamily="monospace" fill="#1f2937">
              ; Soldier XP Levels
            </text>
            <text x="50" y="45" fontSize="13" fontFamily="monospace" fill="#1f2937">
              m_iSoldierXPLevels=0     ; PFC
            </text>
            <text x="50" y="70" fontSize="13" fontFamily="monospace" fill="#1f2937">
              m_iSoldierXPLevels=100   ; Specialist  
            </text>
            <text x="50" y="95" fontSize="13" fontFamily="monospace" fill="#1f2937">
              m_iSoldierXPLevels=250   ; Corporal
            </text>
            <text x="50" y="120" fontSize="13" fontFamily="monospace" fill="#1f2937">
              m_iSoldierXPLevels=500   ; Sergeant
            </text>
            
            <text x="50" y="170" fontSize="13" fontFamily="monospace" fill="#1f2937">
              ; Weapon Stats
            </text>
            <text x="50" y="195" fontSize="13" fontFamily="monospace" fill="#1f2937">
              iDamage=25
            </text>
            <text x="50" y="220" fontSize="13" fontFamily="monospace" fill="#1f2937">
              iRange=30
            </text>
            <text x="50" y="245" fontSize="13" fontFamily="monospace" fill="#1f2937">
              iCritical=20
            </text>
            
            {/* 선택된 영역 하이라이트 */}
            {/* 영역 1: PFC 경험치 */}
            <rect x="170" y="35" width="20" height="15" fill="#3b82f6" fillOpacity="0.3" 
                  stroke="#3b82f6" strokeWidth="1" rx="2"/>
            <text x="200" y="47" fontSize="10" fill="#3b82f6" fontWeight="bold">①</text>
            
            {/* 영역 2: Specialist 경험치 */}
            <rect x="170" y="60" width="30" height="15" fill="#10b981" fillOpacity="0.3" 
                  stroke="#10b981" strokeWidth="1" rx="2"/>
            <text x="210" y="72" fontSize="10" fill="#10b981" fontWeight="bold">②</text>
            
            {/* 영역 3: 무기 데미지 */}
            <rect x="115" y="185" width="20" height="15" fill="#f59e0b" fillOpacity="0.3" 
                  stroke="#f59e0b" strokeWidth="1" rx="2"/>
            <text x="145" y="197" fontSize="10" fill="#f59e0b" fontWeight="bold">③</text>
            
            {/* 영역 4: 무기 사거리 */}
            <rect x="115" y="210" width="20" height="15" fill="#ef4444" fillOpacity="0.3" 
                  stroke="#ef4444" strokeWidth="1" rx="2"/>
            <text x="145" y="222" fontSize="10" fill="#ef4444" fontWeight="bold">④</text>
            
            {/* 선택 도구 안내 */}
            <text x="50" y="330" fontSize="12" fill="#6b7280">
              💡 드래그하여 영역 선택 → 이름 지정 → 테이블에서 관리
            </text>
          </svg>
        </div>
        
        {/* 오른쪽: 영역 관리 테이블 */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700">선택된 영역 관리</h4>
          
          <svg width="100%" height="400" className="border border-gray-300 rounded-lg">
            {/* 테이블 헤더 */}
            <rect x="0" y="0" width="100%" height="40" fill="#f3f4f6" stroke="#d1d5db"/>
            <text x="10" y="25" fontSize="12" fontWeight="bold" fill="#374151">영역명</text>
            <text x="120" y="25" fontSize="12" fontWeight="bold" fill="#374151">현재값</text>
            <text x="200" y="25" fontSize="12" fontWeight="bold" fill="#374151">수정값</text>
            <text x="280" y="25" fontSize="12" fontWeight="bold" fill="#374151">위치</text>
            
            {/* 테이블 행들 */}
            {/* 행 1 */}
            <rect x="0" y="40" width="100%" height="35" fill="#ffffff" stroke="#e5e7eb"/>
            <circle cx="20" cy="57" r="6" fill="#3b82f6"/>
            <text x="8" y="61" fontSize="10" fill="white" fontWeight="bold">1</text>
            <text x="35" y="61" fontSize="12" fill="#1f2937">PFC 경험치</text>
            <text x="120" y="61" fontSize="12" fill="#6b7280" fontFamily="monospace">0</text>
            
            {/* 수정 가능한 입력 필드 모양 */}
            <rect x="200" y="47" width="60" height="20" fill="#ffffff" stroke="#d1d5db" rx="3"/>
            <text x="205" y="61" fontSize="12" fill="#1f2937" fontFamily="monospace">50</text>
            
            <text x="280" y="61" fontSize="11" fill="#6b7280">2:19-2:20</text>
            
            {/* 행 2 */}
            <rect x="0" y="75" width="100%" height="35" fill="#f9fafb" stroke="#e5e7eb"/>
            <circle cx="20" cy="92" r="6" fill="#10b981"/>
            <text x="8" y="96" fontSize="10" fill="white" fontWeight="bold">2</text>
            <text x="35" y="96" fontSize="12" fill="#1f2937">상급병 경험치</text>
            <text x="120" y="96" fontSize="12" fill="#6b7280" fontFamily="monospace">100</text>
            
            <rect x="200" y="82" width="60" height="20" fill="#ffffff" stroke="#d1d5db" rx="3"/>
            <text x="205" y="96" fontSize="12" fill="#1f2937" fontFamily="monospace">150</text>
            
            <text x="280" y="96" fontSize="11" fill="#6b7280">3:19-3:22</text>
            
            {/* 행 3 */}
            <rect x="0" y="110" width="100%" height="35" fill="#ffffff" stroke="#e5e7eb"/>
            <circle cx="20" cy="127" r="6" fill="#f59e0b"/>
            <text x="8" y="131" fontSize="10" fill="white" fontWeight="bold">3</text>
            <text x="35" y="131" fontSize="12" fill="#1f2937">무기 데미지</text>
            <text x="120" y="131" fontSize="12" fill="#6b7280" fontFamily="monospace">25</text>
            
            <rect x="200" y="117" width="60" height="20" fill="#ffffff" stroke="#d1d5db" rx="3"/>
            <text x="205" y="131" fontSize="12" fill="#1f2937" fontFamily="monospace">35</text>
            
            <text x="280" y="131" fontSize="11" fill="#6b7280">7:9-7:11</text>
            
            {/* 행 4 */}
            <rect x="0" y="145" width="100%" height="35" fill="#f9fafb" stroke="#e5e7eb"/>
            <circle cx="20" cy="162" r="6" fill="#ef4444"/>
            <text x="8" y="166" fontSize="10" fill="white" fontWeight="bold">4</text>
            <text x="35" y="166" fontSize="12" fill="#1f2937">무기 사거리</text>
            <text x="120" y="166" fontSize="12" fill="#6b7280" fontFamily="monospace">30</text>
            
            <rect x="200" y="152" width="60" height="20" fill="#ffffff" stroke="#d1d5db" rx="3"/>
            <text x="205" y="166" fontSize="12" fill="#1f2937" fontFamily="monospace">40</text>
            
            <text x="280" y="166" fontSize="11" fill="#6b7280">8:8-8:10</text>
            
            {/* 추가 버튼 */}
            <rect x="10" y="200" width="100" height="30" fill="#3b82f6" rx="4"/>
            <text x="35" y="219" fontSize="12" fill="white" fontWeight="bold">+ 영역 추가</text>
            
            <rect x="120" y="200" width="80" height="30" fill="#10b981" rx="4"/>
            <text x="135" y="219" fontSize="12" fill="white" fontWeight="bold">일괄 적용</text>
            
            <rect x="210" y="200" width="80" height="30" fill="#6b7280" rx="4"/>
            <text x="230" y="219" fontSize="12" fill="white" fontWeight="bold">내보내기</text>
            
            {/* 설명 텍스트 */}
            <text x="10" y="260" fontSize="11" fill="#6b7280">
              💡 수정값을 변경하면 왼쪽 텍스트가 실시간 업데이트됩니다
            </text>
            <text x="10" y="280" fontSize="11" fill="#6b7280">
              📍 위치는 자동으로 추적되어 텍스트 변경시에도 정확합니다
            </text>
            <text x="10" y="300" fontSize="11" fill="#6b7280">
              🔧 패턴 기반 매칭으로 안정적인 영역 관리가 가능합니다
            </text>
          </svg>
        </div>
      </div>
      
      {/* 기능 설명 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">주요 기능</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>영역 선택:</strong> 텍스트에서 드래그하여 관리할 영역 지정</li>
          <li>• <strong>이름 지정:</strong> 각 영역에 의미있는 이름 부여</li>
          <li>• <strong>실시간 동기화:</strong> 테이블에서 값 수정시 원본 텍스트 자동 업데이트</li>
          <li>• <strong>위치 추적:</strong> 텍스트 변경시에도 정확한 위치 유지</li>
          <li>• <strong>일괄 관리:</strong> 여러 설정값을 한 번에 수정하고 적용</li>
        </ul>
      </div>
    </div>
  );
}