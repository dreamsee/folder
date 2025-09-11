import { useState } from 'react'
import { Plus, Edit2, Trash2, Save, X, Filter, Settings } from 'lucide-react'
import { 캐릭터타입, 캐릭터상세정보타입, 프로파일뷰타입 } from '../타입'
import 캐릭터프로파일 from '../컴포넌트/캐릭터프로파일'
import useGameDataStore from '../스토어/게임데이터스토어'

const 캐릭터관리 = () => {
  const { 
    캐릭터장비얻기, 
    캐릭터스킬얻기
  } = useGameDataStore()

  const [캐릭터목록, 캐릭터목록설정] = useState<캐릭터타입[]>([
    {
      아이디: '1',
      이름: '강철의 전사',
      레벨: 50,
      체력: 1500,
      공격력: 120,
      방어력: 80,
      속도: 60,
      클래스: '전사',
      등급: '영웅',
      특수능력: ['분노', '방어태세'],
      이동범위: 2,
      공격범위: 1,
      설명: '강력한 방어력과 체력을 자랑하는 전선의 수호자'
    },
    {
      아이디: '2',
      이름: '화염 마법사',
      레벨: 45,
      체력: 800,
      공격력: 180,
      방어력: 40,
      속도: 70,
      클래스: '마법사',
      등급: '영웅',
      특수능력: ['화염구', '메테오'],
      이동범위: 1,
      공격범위: 3,
      설명: '강력한 광역 마법으로 적을 소각하는 화염의 지배자'
    },
  ])

  const [편집중인캐릭터, 편집중인캐릭터설정] = useState<string | null>(null)
  const [새캐릭터모드, 새캐릭터모드설정] = useState(false)
  const [임시캐릭터, 임시캐릭터설정] = useState<Partial<캐릭터타입>>({})
  
  // 프로파일 뷰 관련 상태
  const [전역프로파일뷰모드, 전역프로파일뷰모드설정] = useState<프로파일뷰타입 | '테이블'>('테이블')
  
  // 인라인 장비/스킬 편집 상태  
  const [편집중인장비스킬캐릭터, 편집중인장비스킬캐릭터설정] = useState<string | null>(null)

  // 캐릭터별 상세 정보 생성 함수
  const 캐릭터상세정보생성 = (캐릭터: 캐릭터타입): Partial<캐릭터상세정보타입> => {
    const 장비목록 = 캐릭터장비얻기(캐릭터.아이디)
    const 스킬목록 = 캐릭터스킬얻기(캐릭터.아이디)
    
    // 장비 능력치 합계 계산
    const 장비능력치합계 = 장비목록.reduce((합계, 아이템) => {
      return {
        공격력: (합계.공격력 || 0) + (아이템.능력치.공격력 || 0),
        방어력: (합계.방어력 || 0) + (아이템.능력치.방어력 || 0),
        체력: (합계.체력 || 0) + (아이템.능력치.체력 || 0),
        속도: (합계.속도 || 0) + (아이템.능력치.속도 || 0),
      }
    }, { 공격력: 0, 방어력: 0, 체력: 0, 속도: 0 })

    return {
      직업: 캐릭터.클래스 === '전사' ? '팔라딘' : 
             캐릭터.클래스 === '마법사' ? '대마법사' : 
             캐릭터.클래스 === '궁수' ? '레인저' :
             캐릭터.클래스 === '도적' ? '어쌔신' : 캐릭터.클래스,
      장비: 장비목록.map(아이템 => 아이템.이름),
      스킬: 스킬목록.map(스킬 => ({
        이름: 스킬.이름,
        설명: 스킬.설명 || '',
        쿨다운: `${스킬.쿨다운}턴`
      })),
      상세능력치: {
        체력: { 
          현재: 캐릭터.체력 + 장비능력치합계.체력, 
          최대: 캐릭터.체력 + 장비능력치합계.체력 
        },
        마나: { 현재: 100, 최대: 150 },
        공격력: 캐릭터.공격력 + 장비능력치합계.공격력,
        방어력: 캐릭터.방어력 + 장비능력치합계.방어력,
        치명타율: 25,
        치명타피해: 140,
        적중률: 0.85,
        회피율: 15,
        속도: 캐릭터.속도 + 장비능력치합계.속도,
        저항력: 30
      }
    }
  }

  const 캐릭터추가시작 = () => {
    새캐릭터모드설정(true)
    임시캐릭터설정({
      아이디: Date.now().toString(),
      이름: '',
      레벨: 1,
      체력: 100,
      공격력: 10,
      방어력: 10,
      속도: 10,
      클래스: '전사',
      등급: '일반',
      특수능력: [],
      이동범위: 2,
      공격범위: 1
    })
  }

  const 캐릭터저장 = () => {
    if (임시캐릭터.이름) {
      캐릭터목록설정([...캐릭터목록, 임시캐릭터 as 캐릭터타입])
      새캐릭터모드설정(false)
      임시캐릭터설정({})
    }
  }

  const 캐릭터편집시작 = (캐릭터: 캐릭터타입) => {
    편집중인캐릭터설정(캐릭터.아이디)
    임시캐릭터설정({ ...캐릭터 })
  }

  const 캐릭터편집저장 = () => {
    캐릭터목록설정(
      캐릭터목록.map((캐릭터) =>
        캐릭터.아이디 === 편집중인캐릭터 ? (임시캐릭터 as 캐릭터타입) : 캐릭터
      )
    )
    편집중인캐릭터설정(null)
    임시캐릭터설정({})
  }

  const 캐릭터삭제 = (아이디: string) => {
    캐릭터목록설정(캐릭터목록.filter((캐릭터) => 캐릭터.아이디 !== 아이디))
  }

  const 밸런스점수계산 = (캐릭터: 캐릭터타입) => {
    const 총스탯 = 캐릭터.체력 / 10 + 캐릭터.공격력 + 캐릭터.방어력 + 캐릭터.속도
    const 기준값 = 400
    const 점수 = Math.round((총스탯 / 기준값) * 100)
    return 점수
  }

  // 프로파일 뷰 필터 관련 함수들
  const 프로파일뷰모드변경 = (모드: 프로파일뷰타입 | '테이블') => {
    전역프로파일뷰모드설정(모드)
  }
  
  const 인라인장비스킬편집시작 = (캐릭터아이디: string) => {
    편집중인장비스킬캐릭터설정(캐릭터아이디)
  }
  
  const 인라인장비스킬편집완료 = () => {
    편집중인장비스킬캐릭터설정(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">캐릭터 관리</h2>
        <button
          onClick={캐릭터추가시작}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          <span>새 캐릭터</span>
        </button>
      </div>

      {/* 프로파일 뷰 필터 시스템 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">프로파일 뷰 모드</h3>
          </div>
          <div className="text-sm text-gray-600">
            전체 {캐릭터목록.length}개 캐릭터
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            { key: '테이블', label: '기본 테이블', icon: '📋' },
            { key: '상세', label: '상세 보기', icon: '📄' },
            { key: '간단', label: '간단 보기', icon: '📝' },
            { key: 'RPG스타일', label: 'RPG 스타일', icon: '🎮' },
            { key: '카드형', label: '카드형', icon: '🃏' },
            { key: '통계', label: '통계 보기', icon: '📊' }
          ] as { key: 프로파일뷰타입 | '테이블', label: string, icon: string }[]).map((뷰모드) => {
            const 선택됨 = 전역프로파일뷰모드 === 뷰모드.key
            return (
              <button
                key={뷰모드.key}
                onClick={() => 프로파일뷰모드변경(뷰모드.key)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                  선택됨
                    ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{뷰모드.icon}</span>
                <span className="font-medium">{뷰모드.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {새캐릭터모드 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">새 캐릭터 추가</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="캐릭터 이름"
              className="px-3 py-2 border rounded"
              value={임시캐릭터.이름 || ''}
              onChange={(e) => 임시캐릭터설정({ ...임시캐릭터, 이름: e.target.value })}
            />
            <select
              className="px-3 py-2 border rounded"
              value={임시캐릭터.클래스}
              onChange={(e) => 임시캐릭터설정({ ...임시캐릭터, 클래스: e.target.value as any })}
            >
              <option value="전사">전사</option>
              <option value="마법사">마법사</option>
              <option value="궁수">궁수</option>
              <option value="도적">도적</option>
              <option value="기사">기사</option>
            </select>
            <select
              className="px-3 py-2 border rounded"
              value={임시캐릭터.등급}
              onChange={(e) => 임시캐릭터설정({ ...임시캐릭터, 등급: e.target.value as '일반' | '희귀' | '영웅' | '전설' })}
            >
              <option value="일반">일반</option>
              <option value="희귀">희귀</option>
              <option value="영웅">영웅</option>
              <option value="전설">전설</option>
            </select>
            <input
              type="number"
              placeholder="레벨"
              className="px-3 py-2 border rounded"
              value={임시캐릭터.레벨 || ''}
              onChange={(e) => 임시캐릭터설정({ ...임시캐릭터, 레벨: Number(e.target.value) })}
            />
            <input
              type="number"
              placeholder="체력"
              className="px-3 py-2 border rounded"
              value={임시캐릭터.체력 || ''}
              onChange={(e) => 임시캐릭터설정({ ...임시캐릭터, 체력: Number(e.target.value) })}
            />
            <input
              type="number"
              placeholder="공격력"
              className="px-3 py-2 border rounded"
              value={임시캐릭터.공격력 || ''}
              onChange={(e) => 임시캐릭터설정({ ...임시캐릭터, 공격력: Number(e.target.value) })}
            />
            <input
              type="number"
              placeholder="방어력"
              className="px-3 py-2 border rounded"
              value={임시캐릭터.방어력 || ''}
              onChange={(e) => 임시캐릭터설정({ ...임시캐릭터, 방어력: Number(e.target.value) })}
            />
            <input
              type="number"
              placeholder="속도"
              className="px-3 py-2 border rounded"
              value={임시캐릭터.속도 || ''}
              onChange={(e) => 임시캐릭터설정({ ...임시캐릭터, 속도: Number(e.target.value) })}
            />
            <input
              type="number"
              placeholder="이동범위"
              className="px-3 py-2 border rounded"
              value={임시캐릭터.이동범위 || ''}
              onChange={(e) => 임시캐릭터설정({ ...임시캐릭터, 이동범위: Number(e.target.value) })}
            />
            <input
              type="number"
              placeholder="공격범위"
              className="px-3 py-2 border rounded"
              value={임시캐릭터.공격범위 || ''}
              onChange={(e) => 임시캐릭터설정({ ...임시캐릭터, 공격범위: Number(e.target.value) })}
            />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => 새캐릭터모드설정(false)}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              취소
            </button>
            <button
              onClick={캐릭터저장}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              저장
            </button>
          </div>
        </div>
      )}

      {/* 캐릭터 표시 영역 - 선택된 뷰 모드에 따라 다르게 렌더링 */}
      {전역프로파일뷰모드 === '테이블' ? (
        /* 기본 테이블 뷰 */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  캐릭터
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  클래스
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  체력
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  공격력
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  방어력
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  속도
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  밸런스
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {캐릭터목록.map((캐릭터) => (
                <tr key={캐릭터.아이디}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {편집중인캐릭터 === 캐릭터.아이디 ? (
                      <input
                        type="text"
                        className="px-2 py-1 border rounded"
                        value={임시캐릭터.이름}
                        onChange={(e) => 임시캐릭터설정({ ...임시캐릭터, 이름: e.target.value })}
                      />
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{캐릭터.이름}</div>
                        <div className="text-sm text-gray-500">Lv.{캐릭터.레벨}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      캐릭터.등급 === '전설' ? 'bg-purple-100 text-purple-800' :
                      캐릭터.등급 === '영웅' ? 'bg-blue-100 text-blue-800' :
                      캐릭터.등급 === '희귀' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {캐릭터.클래스}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {편집중인캐릭터 === 캐릭터.아이디 ? (
                      <input
                        type="number"
                        className="w-20 px-2 py-1 border rounded"
                        value={임시캐릭터.체력}
                        onChange={(e) => 임시캐릭터설정({ ...임시캐릭터, 체력: Number(e.target.value) })}
                      />
                    ) : (
                      캐릭터.체력
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {편집중인캐릭터 === 캐릭터.아이디 ? (
                      <input
                        type="number"
                        className="w-20 px-2 py-1 border rounded"
                        value={임시캐릭터.공격력}
                        onChange={(e) => 임시캐릭터설정({ ...임시캐릭터, 공격력: Number(e.target.value) })}
                      />
                    ) : (
                      캐릭터.공격력
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {편집중인캐릭터 === 캐릭터.아이디 ? (
                      <input
                        type="number"
                        className="w-20 px-2 py-1 border rounded"
                        value={임시캐릭터.방어력}
                        onChange={(e) => 임시캐릭터설정({ ...임시캐릭터, 방어력: Number(e.target.value) })}
                      />
                    ) : (
                      캐릭터.방어력
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {편집중인캐릭터 === 캐릭터.아이디 ? (
                      <input
                        type="number"
                        className="w-20 px-2 py-1 border rounded"
                        value={임시캐릭터.속도}
                        onChange={(e) => 임시캐릭터설정({ ...임시캐릭터, 속도: Number(e.target.value) })}
                      />
                    ) : (
                      캐릭터.속도
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${
                        밸런스점수계산(캐릭터) > 100 ? 'text-red-600' :
                        밸런스점수계산(캐릭터) > 80 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {밸런스점수계산(캐릭터)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {편집중인캐릭터 === 캐릭터.아이디 ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={캐릭터편집저장}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Save className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            편집중인캐릭터설정(null)
                            임시캐릭터설정({})
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => 캐릭터편집시작(캐릭터)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => 캐릭터삭제(캐릭터.아이디)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* 프로파일 뷰들 */
        <div className="space-y-6">
          {캐릭터목록.map((캐릭터) => (
            <div key={캐릭터.아이디} className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* 캐릭터 헤더 - 편집 버튼들 포함 */}
              <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-semibold text-gray-900">{캐릭터.이름}</h3>
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    캐릭터.등급 === '전설' ? 'bg-purple-100 text-purple-800' :
                    캐릭터.등급 === '영웅' ? 'bg-blue-100 text-blue-800' :
                    캐릭터.등급 === '희귀' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {캐릭터.등급} {캐릭터.클래스}
                  </span>
                  <span className={`text-sm font-medium ${
                    밸런스점수계산(캐릭터) > 100 ? 'text-red-600' :
                    밸런스점수계산(캐릭터) > 80 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    밸런스: {밸런스점수계산(캐릭터)}%
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => 인라인장비스킬편집시작(캐릭터.아이디)}
                    className="text-green-600 hover:text-green-900"
                    title="장비/스킬 편집"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => 캐릭터편집시작(캐릭터)}
                    className="text-blue-600 hover:text-blue-900"
                    title="캐릭터 편집"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => 캐릭터삭제(캐릭터.아이디)}
                    className="text-red-600 hover:text-red-900"
                    title="캐릭터 삭제"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* 프로파일 컨텐츠 */}
              <div className="p-6">
                <캐릭터프로파일 
                  캐릭터데이터={캐릭터} 
                  상세정보={캐릭터상세정보생성(캐릭터)}
                  뷰모드={전역프로파일뷰모드 as 프로파일뷰타입}
                  편집중인장비스킬={편집중인장비스킬캐릭터 === 캐릭터.아이디}
                  장비스킬편집완료={인라인장비스킬편집완료}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default 캐릭터관리