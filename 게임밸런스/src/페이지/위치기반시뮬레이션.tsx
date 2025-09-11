import { useState } from 'react'
import { 
  Play, 
  RotateCcw, 
  Settings, 
  Users, 
  Sword, 
  Move, 
  Target,
  SkipForward
} from 'lucide-react'
import { 배치시뮬레이션스토어 } from '../상태관리/배치시뮬레이션스토어'
import 바둑판설정 from '../컴포넌트/바둑판설정'
import 배치그리드 from '../컴포넌트/배치그리드'
import { 위치타입, 배치캐릭터타입 } from '../타입'

const 위치기반시뮬레이션 = () => {
  const [설정패널열림, 설정패널열림설정] = useState(false)
  const [캐릭터패널열림, 캐릭터패널열림설정] = useState(false)

  const {
    시뮬레이션,
    선택캐릭터,
    현재모드,
    전투결과,
    바둑판크기설정,
    캐릭터배치,
    캐릭터선택,
    캐릭터이동,
    캐릭터공격,
    모드변경,
    턴종료,
    전투시작,
    전투초기화,
    이동범위계산,
    공격범위계산
  } = 배치시뮬레이션스토어()

  if (!시뮬레이션) return <div>로딩 중...</div>

  // 셀 클릭 처리
  const 셀클릭처리 = (위치: 위치타입) => {
    if (현재모드 === '배치') {
      if (선택캐릭터 && !선택캐릭터.위치) {
        캐릭터배치(선택캐릭터, 위치)
        캐릭터선택(null)
      }
    } else if (현재모드 === '이동') {
      if (선택캐릭터 && 선택캐릭터.위치) {
        캐릭터이동(선택캐릭터.아이디, 위치)
        캐릭터선택(null)
        모드변경('배치')
      }
    } else if (현재모드 === '공격') {
      if (선택캐릭터) {
        캐릭터공격(선택캐릭터.아이디, 위치)
        캐릭터선택(null)
        모드변경('배치')
      }
    }
  }

  // 캐릭터 선택 처리
  const 캐릭터선택처리 = (캐릭터: 배치캐릭터타입) => {
    캐릭터선택(캐릭터)
    
    if (시뮬레이션.진행상태 === '진행중' && !캐릭터.행동완료) {
      if (현재모드 === '이동') {
        이동범위계산(캐릭터)
      } else if (현재모드 === '공격') {
        공격범위계산(캐릭터)
      }
    }
  }

  // 모드 변경 처리
  const 모드변경처리 = (새모드: '배치' | '이동' | '공격') => {
    모드변경(새모드)
    if (선택캐릭터) {
      if (새모드 === '이동') {
        이동범위계산(선택캐릭터)
      } else if (새모드 === '공격') {
        공격범위계산(선택캐릭터)
      }
    }
  }

  // 배치되지 않은 캐릭터 목록
  const 미배치캐릭터목록 = 시뮬레이션.배치캐릭터목록.filter(캐릭터 => !캐릭터.위치)
  
  // 팀별 캐릭터 상태
  const 아군생존 = 시뮬레이션.배치캐릭터목록.filter(c => c.팀 === '아군' && c.현재체력 > 0).length
  const 적군생존 = 시뮬레이션.배치캐릭터목록.filter(c => c.팀 === '적군' && c.현재체력 > 0).length

  return (
    <div className="space-y-6">
      {/* 상단 컨트롤 패널 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">위치 기반 전투 시뮬레이션</h2>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => 설정패널열림설정(!설정패널열림)}
              className={`p-2 rounded-lg ${설정패널열림 ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => 캐릭터패널열림설정(!캐릭터패널열림)}
              className={`p-2 rounded-lg ${캐릭터패널열림 ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Users className="w-5 h-5" />
            </button>
            <button
              onClick={전투초기화}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 게임 상태 표시 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">현재 턴</div>
            <div className="text-xl font-bold text-blue-900">{시뮬레이션.현재턴}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-green-600 font-medium">아군 생존</div>
            <div className="text-xl font-bold text-green-900">{아군생존}/2</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-sm text-red-600 font-medium">적군 생존</div>
            <div className="text-xl font-bold text-red-900">{적군생존}/2</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">진행 상태</div>
            <div className="text-xl font-bold text-purple-900">
              {시뮬레이션.진행상태 === '준비중' ? '배치 중' :
               시뮬레이션.진행상태 === '진행중' ? '전투 중' : '완료'}
            </div>
          </div>
        </div>

        {/* 모드 선택 및 액션 버튼 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">모드:</span>
            <button
              onClick={() => 모드변경처리('배치')}
              disabled={시뮬레이션.진행상태 === '진행중'}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                현재모드 === '배치' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } disabled:opacity-50`}
            >
              <Target className="w-4 h-4 inline mr-1" />
              배치
            </button>
            <button
              onClick={() => 모드변경처리('이동')}
              disabled={시뮬레이션.진행상태 !== '진행중'}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                현재모드 === '이동' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } disabled:opacity-50`}
            >
              <Move className="w-4 h-4 inline mr-1" />
              이동
            </button>
            <button
              onClick={() => 모드변경처리('공격')}
              disabled={시뮬레이션.진행상태 !== '진행중'}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                현재모드 === '공격' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } disabled:opacity-50`}
            >
              <Sword className="w-4 h-4 inline mr-1" />
              공격
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {시뮬레이션.진행상태 === '준비중' && (
              <button
                onClick={전투시작}
                disabled={미배치캐릭터목록.length > 0}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                <span>전투 시작</span>
              </button>
            )}
            
            {시뮬레이션.진행상태 === '진행중' && (
              <button
                onClick={턴종료}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <SkipForward className="w-4 h-4" />
                <span>턴 종료</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 왼쪽 사이드바 */}
        <div className="space-y-4">
          {/* 바둑판 설정 */}
          {설정패널열림 && (
            <바둑판설정
              현재가로={시뮬레이션.바둑판.가로}
              현재세로={시뮬레이션.바둑판.세로}
              onChange={바둑판크기설정}
            />
          )}

          {/* 캐릭터 목록 */}
          {캐릭터패널열림 && (
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold text-gray-900 mb-3">캐릭터 목록</h3>
              
              {미배치캐릭터목록.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">미배치 캐릭터</h4>
                  <div className="space-y-2">
                    {미배치캐릭터목록.map((캐릭터) => (
                      <button
                        key={캐릭터.아이디}
                        onClick={() => 캐릭터선택(캐릭터)}
                        className={`w-full p-2 text-left rounded-lg border ${
                          선택캐릭터?.아이디 === 캐릭터.아이디
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{캐릭터.이름}</div>
                            <div className="text-xs text-gray-500">
                              {캐릭터.팀} | {캐릭터.클래스}
                            </div>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${
                            캐릭터.팀 === '아군' ? 'bg-blue-600' : 'bg-red-600'
                          }`} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">배치된 캐릭터</h4>
                <div className="space-y-2">
                  {시뮬레이션.배치캐릭터목록
                    .filter(캐릭터 => 캐릭터.위치)
                    .map((캐릭터) => (
                    <div
                      key={캐릭터.아이디}
                      className={`p-2 rounded-lg border ${
                        선택캐릭터?.아이디 === 캐릭터.아이디
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{캐릭터.이름}</div>
                          <div className="text-xs text-gray-500">
                            ({캐릭터.위치?.x}, {캐릭터.위치?.y}) | HP: {캐릭터.현재체력}/{캐릭터.체력}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className={`w-3 h-3 rounded-full ${
                            캐릭터.팀 === '아군' ? 'bg-blue-600' : 'bg-red-600'
                          }`} />
                          {캐릭터.행동완료 && (
                            <div className="w-3 h-3 bg-gray-500 rounded-full" />
                          )}
                        </div>
                      </div>
                      
                      {/* 체력바 */}
                      <div className="w-full h-1 bg-gray-300 rounded-full mt-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            캐릭터.현재체력 / 캐릭터.체력 > 0.6 ? 'bg-green-500' : 
                            캐릭터.현재체력 / 캐릭터.체력 > 0.3 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(캐릭터.현재체력 / 캐릭터.체력) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 메인 게임 영역 */}
        <div className="lg:col-span-3">
          <배치그리드
            가로={시뮬레이션.바둑판.가로}
            세로={시뮬레이션.바둑판.세로}
            배치정보={시뮬레이션.바둑판.배치정보}
            배치캐릭터목록={시뮬레이션.배치캐릭터목록}
            선택캐릭터={선택캐릭터}
            모드={현재모드}
            onCellClick={셀클릭처리}
            onCharacterSelect={캐릭터선택처리}
            showMovementRange={현재모드 === '이동'}
            showAttackRange={현재모드 === '공격'}
          />
        </div>
      </div>

      {/* 전투 결과 */}
      {전투결과 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold text-gray-900 mb-4">전투 결과</h3>
          {/* 전투 결과 내용 구현 */}
        </div>
      )}
    </div>
  )
}

export default 위치기반시뮬레이션