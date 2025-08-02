import { useState } from 'react'
import { Plus, Minus, Calculator, Package, Sparkles, X } from 'lucide-react'
import { 아이템타입, 스킬타입, 조합레시피타입 } from '../타입'
import useGameDataStore from '../스토어/게임데이터스토어'

// 재료 선택 및 수량 관리 타입
interface 재료선택타입 {
  아이디: string
  이름: string
  종류: 'item' | 'skill'
  수량: number
  아이콘: string
}

// 조합 패턴 타입
interface 조합패턴타입 {
  패턴번호: number
  조합목록: { 재료이름: string; 수량: number; 결과이름: string }[]
  사용된재료수량: Record<string, number>
  그룹정보?: {
    그룹이름: string
    그룹타입: '기존레시피' | '새로운조합' | '남은재료'
    결과설명?: string
  }
}

const 조합 = () => {
  const { 
    조합레시피목록,
    재료아이템목록얻기,
    재료스킬목록얻기,
    아이템추가,
    스킬추가,
    조합레시피추가
  } = useGameDataStore()

  // 선택된 재료 및 수량 관리
  const [선택된재료목록, 선택된재료목록설정] = useState<재료선택타입[]>([])
  const [가능한조합패턴목록, 가능한조합패턴목록설정] = useState<조합패턴타입[]>([])
  const [계산결과메시지, 계산결과메시지설정] = useState<string>('')
  
  // 새 아이템/스킬 생성 모달
  const [새아이템모달열림, 새아이템모달열림설정] = useState(false)
  const [새아이템타입, 새아이템타입설정] = useState<'item' | 'skill'>('item')
  const [새아이템정보, 새아이템정보설정] = useState<Partial<아이템타입>>({})
  const [새스킬정보, 새스킬정보설정] = useState<Partial<스킬타입>>({})
  const [새레시피재료, 새레시피재료설정] = useState<{ 아이디: string; 수량: number }[]>([])
  const [새레시피이름, 새레시피이름설정] = useState('')
  
  // 새 재료 생성 모달
  const [새재료모달열림, 새재료모달열림설정] = useState(false)
  const [새재료타입, 새재료타입설정] = useState<'item' | 'skill'>('item')
  const [새재료아이템정보, 새재료아이템정보설정] = useState<Partial<아이템타입>>({})
  const [새재료스킬정보, 새재료스킬정보설정] = useState<Partial<스킬타입>>({})

  const 재료아이템목록 = 재료아이템목록얻기()
  const 재료스킬목록 = 재료스킬목록얻기()

  // 재료를 선택된 목록에 추가
  const 재료추가 = (재료: 아이템타입 | 스킬타입, 종류: 'item' | 'skill') => {
    const 기존재료 = 선택된재료목록.find(r => r.아이디 === 재료.아이디)
    if (기존재료) {
      // 이미 있는 재료는 수량 증가
      선택된재료목록설정(prev => 
        prev.map(r => r.아이디 === 재료.아이디 ? { ...r, 수량: r.수량 + 1 } : r)
      )
    } else {
      // 새 재료 추가
      const 새재료: 재료선택타입 = {
        아이디: 재료.아이디,
        이름: 재료.이름,
        종류,
        수량: 1,
        아이콘: 종류 === 'item' ? '🧩' : '✨'
      }
      선택된재료목록설정(prev => [...prev, 새재료])
    }
  }

  // 재료 수량 직접 변경
  const 재료수량변경 = (재료아이디: string, 새수량: number) => {
    if (새수량 <= 0) {
      선택된재료목록설정(prev => prev.filter(r => r.아이디 !== 재료아이디))
    } else {
      선택된재료목록설정(prev => 
        prev.map(r => r.아이디 === 재료아이디 ? { ...r, 수량: 새수량 } : r)
      )
    }
  }

  // 조합 결과 그룹 타입
  interface 조합그룹타입 {
    그룹이름: string
    그룹타입: '기존레시피' | '새로운조합' | '남은재료'
    조합목록: {
      재료조합: string
      결과이름: string
      결과설명?: string
      최대제작수: number
      사용재료: Record<string, number>
    }[]
  }

  // 가능한 모든 조합 패턴 계산 (개선된 버전)
  const 가능한조합계산 = () => {
    if (선택된재료목록.length === 0) {
      계산결과메시지설정('선택된 재료가 없습니다.')
      return
    }

    const 조합그룹목록: 조합그룹타입[] = []
    
    // 1. 기존 레시피 기반 조합
    const 만들수있는레시피목록 = 조합레시피목록.filter(레시피 => {
      return 레시피.필요재료.every(필요재료 => {
        const 선택된재료 = 선택된재료목록.find(r => r.아이디 === 필요재료.아이디)
        return 선택된재료 && 선택된재료.수량 >= 필요재료.수량
      })
    })

    // 기존 레시피 그룹 생성
    if (만들수있는레시피목록.length > 0) {
      const 기존레시피그룹: 조합그룹타입 = {
        그룹이름: '기존 레시피 조합',
        그룹타입: '기존레시피',
        조합목록: []
      }

      만들수있는레시피목록.forEach((레시피) => {
        const 최대제작횟수 = Math.min(
          ...레시피.필요재료.map(필요재료 => {
            const 선택된재료 = 선택된재료목록.find(r => r.아이디 === 필요재료.아이디)
            return Math.floor((선택된재료?.수량 || 0) / 필요재료.수량)
          })
        )

        // 각 제작 횟수별로 추가
        for (let 제작횟수 = 1; 제작횟수 <= 최대제작횟수; 제작횟수++) {
          const 사용재료 = 레시피.필요재료.reduce((맵, 필요재료) => {
            맵[필요재료.아이디] = 필요재료.수량 * 제작횟수
            return 맵
          }, {} as Record<string, number>)

          기존레시피그룹.조합목록.push({
            재료조합: 레시피.필요재료.map(r => {
              const 재료 = 선택된재료목록.find(sel => sel.아이디 === r.아이디)
              return `${재료?.이름} x${r.수량 * 제작횟수}`
            }).join(' + '),
            결과이름: 레시피.이름 + (제작횟수 > 1 ? ` x${제작횟수}` : ''),
            결과설명: 레시피.설명,
            최대제작수: 제작횟수,
            사용재료
          })
        }
      })

      조합그룹목록.push(기존레시피그룹)
    }

    // 2. 새로운 조합 패턴 생성 (같은 재료 여러개 포함)
    const 새로운조합그룹: 조합그룹타입 = {
      그룹이름: '새로운 조합 가능성',
      그룹타입: '새로운조합',
      조합목록: []
    }

    // 2-1. 같은 재료 여러 개 조합
    선택된재료목록.forEach(재료 => {
      if (재료.수량 >= 2) {
        for (let 사용수량 = 2; 사용수량 <= 재료.수량; 사용수량++) {
          const 사용재료 = { [재료.아이디]: 사용수량 }
          새로운조합그룹.조합목록.push({
            재료조합: `${재료.이름} x${사용수량}`,
            결과이름: `강화된 ${재료.이름}`,
            결과설명: `${재료.이름}을 ${사용수량}개 조합하여 만든 강화 아이템`,
            최대제작수: 1,
            사용재료
          })
        }
      }
    })

    // 2-2. 서로 다른 재료 2개 조합
    for (let i = 0; i < 선택된재료목록.length; i++) {
      for (let j = i + 1; j < 선택된재료목록.length; j++) {
        const 재료1 = 선택된재료목록[i]
        const 재료2 = 선택된재료목록[j]
        
        // 각 재료를 1-2개씩 사용하는 조합들
        for (let count1 = 1; count1 <= Math.min(3, 재료1.수량); count1++) {
          for (let count2 = 1; count2 <= Math.min(3, 재료2.수량); count2++) {
            const 사용재료 = {
              [재료1.아이디]: count1,
              [재료2.아이디]: count2
            }

            새로운조합그룹.조합목록.push({
              재료조합: `${재료1.이름} x${count1} + ${재료2.이름} x${count2}`,
              결과이름: `${재료1.이름}+${재료2.이름} 융합체`,
              결과설명: `${재료1.이름}과 ${재료2.이름}의 특성을 결합한 새로운 아이템`,
              최대제작수: 1,
              사용재료
            })
          }
        }
      }
    }

    // 2-3. 3개 이상 재료 조합
    if (선택된재료목록.length >= 3) {
      for (let i = 0; i < 선택된재료목록.length; i++) {
        for (let j = i + 1; j < 선택된재료목록.length; j++) {
          for (let k = j + 1; k < 선택된재료목록.length; k++) {
            const 재료1 = 선택된재료목록[i]
            const 재료2 = 선택된재료목록[j]
            const 재료3 = 선택된재료목록[k]
            
            if (재료1.수량 >= 1 && 재료2.수량 >= 1 && 재료3.수량 >= 1) {
              const 사용재료 = {
                [재료1.아이디]: 1,
                [재료2.아이디]: 1,
                [재료3.아이디]: 1
              }

              새로운조합그룹.조합목록.push({
                재료조합: `${재료1.이름} x1 + ${재료2.이름} x1 + ${재료3.이름} x1`,
                결과이름: `삼원소 ${재료1.이름}+${재료2.이름}+${재료3.이름}`,
                결과설명: `세 가지 재료의 힘을 하나로 모은 고급 아이템`,
                최대제작수: 1,
                사용재료
              })
            }
          }
        }
      }
    }

    if (새로운조합그룹.조합목록.length > 0) {
      조합그룹목록.push(새로운조합그룹)
    }

    // 3. 남은 재료 그룹 (모든 조합 후 남는 재료들)
    const 남은재료그룹: 조합그룹타입 = {
      그룹이름: '조합 후 남은 재료',
      그룹타입: '남은재료',
      조합목록: []
    }

    // 각 조합 옵션에 대해 남은 재료 계산
    조합그룹목록.forEach(그룹 => {
      그룹.조합목록.forEach(조합 => {
        const 남은재료맵 = { ...선택된재료목록.reduce((맵, 재료) => {
          맵[재료.아이디] = 재료.수량
          return 맵
        }, {} as Record<string, number>) }

        Object.entries(조합.사용재료).forEach(([재료아이디, 사용수량]) => {
          남은재료맵[재료아이디] -= 사용수량
        })

        const 남은재료목록 = Object.entries(남은재료맵)
          .filter(([, 수량]) => 수량 > 0)
          .map(([재료아이디, 수량]) => {
            const 재료정보 = 선택된재료목록.find(r => r.아이디 === 재료아이디)
            return `${재료정보?.이름} x${수량}`
          })

        if (남은재료목록.length > 0) {
          남은재료그룹.조합목록.push({
            재료조합: `${조합.결과이름} 제작 후`,
            결과이름: 남은재료목록.join(', '),
            결과설명: '조합 후 남은 재료들',
            최대제작수: 1,
            사용재료: {}
          })
        }
      })
    })

    if (남은재료그룹.조합목록.length > 0) {
      조합그룹목록.push(남은재료그룹)
    }

    // UI 표시용으로 변환
    const UI표시용패턴: 조합패턴타입[] = []
    let 패턴번호 = 1

    조합그룹목록.forEach(그룹 => {
      그룹.조합목록.forEach(조합 => {
        UI표시용패턴.push({
          패턴번호: 패턴번호++,
          조합목록: [{
            재료이름: 조합.재료조합,
            수량: 조합.최대제작수,
            결과이름: 조합.결과이름
          }],
          사용된재료수량: 선택된재료목록.reduce((맵, 재료) => {
            맵[재료.아이디] = 재료.수량 - (조합.사용재료[재료.아이디] || 0)
            return 맵
          }, {} as Record<string, number>),
          그룹정보: {
            그룹이름: 그룹.그룹이름,
            그룹타입: 그룹.그룹타입,
            결과설명: 조합.결과설명
          }
        })
      })
    })

    가능한조합패턴목록설정(UI표시용패턴)
    
    const 총조합수 = 조합그룹목록.reduce((합계, 그룹) => 합계 + 그룹.조합목록.length, 0)
    계산결과메시지설정(`총 ${총조합수}개의 조합을 찾았습니다. (기존 레시피: ${만들수있는레시피목록.length}개, 새로운 조합: ${새로운조합그룹.조합목록.length}개)`)
  }

  // 새 조합 생성 시작 (정의되지 않은 레시피)
  const 새조합생성시작 = (재료조합: { 아이디: string; 수량: number }[], 레시피이름: string) => {
    새아이템모달열림설정(true)
    새레시피재료설정(재료조합)
    새레시피이름설정(레시피이름)
    새아이템타입설정('item')
    새아이템정보설정({
      아이디: Date.now().toString(),
      이름: '',
      종류: '무기',
      등급: '일반',
      능력치: {},
      가격: 0,
      설명: '',
      사용가능클래스: ['전체'],
      재료여부: false
    })
    새스킬정보설정({
      아이디: Date.now().toString(),
      이름: '',
      종류: '공격',
      데미지: 0,
      쿨다운: 1,
      마나소비: 0,
      사거리: 1,
      효과범위: '단일',
      설명: '',
      사용가능클래스: ['전체'],
      재료여부: false
    })
  }

  // 새 아이템/스킬 저장
  const 새조합저장 = () => {
    if (새아이템타입 === 'item' && 새아이템정보.이름) {
      // 새 아이템 추가
      const 완성아이템 = 새아이템정보 as 아이템타입
      아이템추가(완성아이템)
      
      // 새 레시피 추가
      const 새레시피: 조합레시피타입 = {
        아이디: `recipe_${Date.now()}`,
        이름: 새레시피이름,
        결과아이템아이디: 완성아이템.아이디,
        필요재료: 새레시피재료,
        조합비용: 100, // 기본 조합 비용
        필요클래스: 완성아이템.사용가능클래스,
        설명: `${완성아이템.이름}을(를) 제작하는 레시피입니다.`
      }
      조합레시피추가(새레시피)
      
    } else if (새아이템타입 === 'skill' && 새스킬정보.이름) {
      // 새 스킬 추가
      const 완성스킬 = 새스킬정보 as 스킬타입
      스킬추가(완성스킬)
      
      // 새 레시피 추가
      const 새레시피: 조합레시피타입 = {
        아이디: `recipe_${Date.now()}`,
        이름: 새레시피이름,
        결과스킬아이디: 완성스킬.아이디,
        필요재료: 새레시피재료,
        조합비용: 150, // 기본 조합 비용
        필요클래스: 완성스킬.사용가능클래스,
        설명: `${완성스킬.이름}을(를) 습득하는 레시피입니다.`
      }
      조합레시피추가(새레시피)
    }
    
    // 모달 닫기
    새아이템모달열림설정(false)
    새아이템정보설정({})
    새스킬정보설정({})
    새레시피재료설정([])
    새레시피이름설정('')
  }

  // 새 재료 생성 시작
  const 새재료생성시작 = () => {
    새재료모달열림설정(true)
    새재료타입설정('item')
    새재료아이템정보설정({
      아이디: Date.now().toString(),
      이름: '',
      종류: '재료',
      등급: '일반',
      능력치: {},
      가격: 0,
      설명: '',
      사용가능클래스: ['전체'],
      재료여부: true
    })
    새재료스킬정보설정({
      아이디: Date.now().toString(),
      이름: '',
      종류: '재료',
      데미지: 0,
      쿨다운: 0,
      마나소비: 0,
      사거리: 0,
      효과범위: '단일',
      설명: '',
      사용가능클래스: ['전체'],
      재료여부: true
    })
  }

  // 새 재료 저장
  const 새재료저장 = () => {
    if (새재료타입 === 'item' && 새재료아이템정보.이름) {
      const 완성재료아이템 = 새재료아이템정보 as 아이템타입
      아이템추가(완성재료아이템)
    } else if (새재료타입 === 'skill' && 새재료스킬정보.이름) {
      const 완성재료스킬 = 새재료스킬정보 as 스킬타입
      스킬추가(완성재료스킬)
    }
    
    // 모달 닫기
    새재료모달열림설정(false)
    새재료아이템정보설정({})
    새재료스킬정보설정({})
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Calculator className="w-8 h-8 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-900">고급 조합 시스템</h2>
      </div>

      {/* 재료 선택 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 사용 가능한 재료 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">사용 가능한 재료</h3>
            <button
              onClick={새재료생성시작}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>새 재료</span>
            </button>
          </div>
          
          <div className="space-y-6">
            {/* 재료 아이템 */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3 flex items-center space-x-2">
                <Package className="w-4 h-4" />
                <span>재료 아이템</span>
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {재료아이템목록.map((아이템) => (
                  <div key={아이템.아이디} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">🧩</span>
                      <div>
                        <span className="text-sm font-medium">{아이템.이름}</span>
                        <p className="text-xs text-gray-500">{아이템.설명}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => 재료추가(아이템, 'item')}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 재료 스킬 */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3 flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>재료 스킬</span>
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {재료스킬목록.map((스킬) => (
                  <div key={스킬.아이디} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">✨</span>
                      <div>
                        <span className="text-sm font-medium">{스킬.이름}</span>
                        <p className="text-xs text-gray-500">{스킬.설명}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => 재료추가(스킬, 'skill')}
                      className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 선택된 재료 및 계산 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">선택된 재료</h3>
            <button
              onClick={가능한조합계산}
              disabled={선택된재료목록.length === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${
                선택된재료목록.length > 0
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>가능한 조합</span>
            </button>
          </div>

          {선택된재료목록.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>재료를 선택해주세요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {선택된재료목록.map((재료) => (
                <div key={재료.아이디} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{재료.아이콘}</span>
                    <span className="font-medium">{재료.이름}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => 재료수량변경(재료.아이디, 재료.수량 - 1)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={재료.수량}
                      onChange={(e) => 재료수량변경(재료.아이디, Number(e.target.value))}
                      className="w-16 px-2 py-1 border rounded text-center"
                    />
                    <button
                      onClick={() => 재료수량변경(재료.아이디, 재료.수량 + 1)}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {계산결과메시지 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800">
              {계산결과메시지}
            </div>
          )}
        </div>
      </div>

      {/* 조합 결과 그룹별 표시 */}
      {가능한조합패턴목록.length > 0 && (
        <div className="space-y-6">
          {/* 그룹별로 분리하여 표시 */}
          {['기존레시피', '새로운조합', '남은재료'].map(그룹타입 => {
            const 그룹패턴목록 = 가능한조합패턴목록.filter(패턴 => 패턴.그룹정보?.그룹타입 === 그룹타입)
            
            if (그룹패턴목록.length === 0) return null

            const 그룹색상 = 그룹타입 === '기존레시피' ? 'blue' : 그룹타입 === '새로운조합' ? 'purple' : 'gray'
            const 그룹아이콘 = 그룹타입 === '기존레시피' ? '📋' : 그룹타입 === '새로운조합' ? '✨' : '📦'
            
            return (
              <div key={그룹타입} className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">{그룹아이콘}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {그룹패턴목록[0]?.그룹정보?.그룹이름 || '조합 결과'}
                    </h3>
                    <p className="text-sm text-gray-600">{그룹패턴목록.length}개의 조합 옵션</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {그룹패턴목록.map((패턴) => (
                    <div key={패턴.패턴번호} className={`border-2 rounded-lg p-4 hover:shadow-md transition-shadow ${
                      그룹색상 === 'blue' ? 'border-blue-200 hover:border-blue-300' :
                      그룹색상 === 'purple' ? 'border-purple-200 hover:border-purple-300' :
                      'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="mb-3">
                        {패턴.조합목록.map((조합, 인덱스) => (
                          <div key={인덱스} className="mb-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-600 mb-1">{조합.재료이름}</p>
                                <p className={`font-medium text-sm ${
                                  그룹색상 === 'blue' ? 'text-blue-600' :
                                  그룹색상 === 'purple' ? 'text-purple-600' :
                                  'text-gray-600'
                                }`}>
                                  → {조합.결과이름}
                                </p>
                                {패턴.그룹정보?.결과설명 && (
                                  <p className="text-xs text-gray-500 mt-1">{패턴.그룹정보.결과설명}</p>
                                )}
                              </div>
                              
                              {/* 새 조합 생성 버튼 (새로운조합 그룹에만 표시) */}
                              {그룹타입 === '새로운조합' && (
                                <button
                                  onClick={() => {
                                    // 실제 사용된 재료 조합 계산
                                    const 현재패턴재료 = 조합.재료이름.split(' + ').map(재료문자열 => {
                                      const 매치 = 재료문자열.match(/(.+) x(\d+)/)
                                      if (매치) {
                                        const 재료이름 = 매치[1]
                                        const 수량 = parseInt(매치[2])
                                        const 재료정보 = 선택된재료목록.find(r => r.이름 === 재료이름)
                                        return { 아이디: 재료정보?.아이디 || '', 수량 }
                                      }
                                      return { 아이디: '', 수량: 0 }
                                    }).filter(재료 => 재료.아이디 !== '')
                                    
                                    새조합생성시작(현재패턴재료, 조합.결과이름)
                                  }}
                                  className="ml-2 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 flex-shrink-0"
                                  title="새 조합 만들기"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 남은 재료 표시 (남은재료 그룹이 아닌 경우에만) */}
                      {그룹타입 !== '남은재료' && (
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">이 조합 후 남은 재료:</p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(패턴.사용된재료수량).map(([재료아이디, 수량]) => {
                              const 재료정보 = 선택된재료목록.find(r => r.아이디 === 재료아이디)
                              return 수량 > 0 ? (
                                <span key={재료아이디} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  {재료정보?.이름} x{수량}
                                </span>
                              ) : null
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 새 아이템/스킬 생성 모달 */}
      {새아이템모달열림 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">새 조합 생성</h3>
              <button
                onClick={() => 새아이템모달열림설정(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">조합 이름: <span className="font-medium">{새레시피이름}</span></p>
              <p className="text-sm text-gray-600 mb-4">
                필요 재료: {새레시피재료.map((재료) => {
                  const 재료정보 = 선택된재료목록.find(r => r.아이디 === 재료.아이디)
                  return `${재료정보?.이름} x${재료.수량}`
                }).join(', ')}
              </p>
              
              {/* 아이템/스킬 타입 선택 */}
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => 새아이템타입설정('item')}
                  className={`flex-1 py-2 px-4 rounded border ${
                    새아이템타입 === 'item'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  아이템 생성
                </button>
                <button
                  onClick={() => 새아이템타입설정('skill')}
                  className={`flex-1 py-2 px-4 rounded border ${
                    새아이템타입 === 'skill'
                      ? 'bg-purple-500 text-white border-purple-500'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  스킬 생성
                </button>
              </div>
            </div>

            {새아이템타입 === 'item' ? (
              /* 아이템 생성 폼 */
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="아이템 이름"
                  className="w-full px-3 py-2 border rounded"
                  value={새아이템정보.이름 || ''}
                  onChange={(e) => 새아이템정보설정({ ...새아이템정보, 이름: e.target.value })}
                />
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={새아이템정보.종류}
                  onChange={(e) => 새아이템정보설정({ ...새아이템정보, 종류: e.target.value as any })}
                >
                  <option value="무기">무기</option>
                  <option value="방어구">방어구</option>
                  <option value="소모품">소모품</option>
                  <option value="기타">기타</option>
                </select>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={새아이템정보.등급}
                  onChange={(e) => 새아이템정보설정({ ...새아이템정보, 등급: e.target.value as any })}
                >
                  <option value="일반">일반</option>
                  <option value="희귀">희귀</option>
                  <option value="영웅">영웅</option>
                  <option value="전설">전설</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="공격력"
                    className="px-3 py-2 border rounded"
                    value={새아이템정보.능력치?.공격력 || ''}
                    onChange={(e) => 새아이템정보설정({ 
                      ...새아이템정보, 
                      능력치: { ...새아이템정보.능력치, 공격력: Number(e.target.value) || 0 }
                    })}
                  />
                  <input
                    type="number"
                    placeholder="방어력"
                    className="px-3 py-2 border rounded"
                    value={새아이템정보.능력치?.방어력 || ''}
                    onChange={(e) => 새아이템정보설정({ 
                      ...새아이템정보, 
                      능력치: { ...새아이템정보.능력치, 방어력: Number(e.target.value) || 0 }
                    })}
                  />
                </div>
                <textarea
                  placeholder="아이템 설명"
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                  value={새아이템정보.설명 || ''}
                  onChange={(e) => 새아이템정보설정({ ...새아이템정보, 설명: e.target.value })}
                />
              </div>
            ) : (
              /* 스킬 생성 폼 */
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="스킬 이름"
                  className="w-full px-3 py-2 border rounded"
                  value={새스킬정보.이름 || ''}
                  onChange={(e) => 새스킬정보설정({ ...새스킬정보, 이름: e.target.value })}
                />
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={새스킬정보.종류}
                  onChange={(e) => 새스킬정보설정({ ...새스킬정보, 종류: e.target.value as any })}
                >
                  <option value="공격">공격</option>
                  <option value="방어">방어</option>
                  <option value="버프">버프</option>
                  <option value="디버프">디버프</option>
                  <option value="치유">치유</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="데미지"
                    className="px-3 py-2 border rounded"
                    value={새스킬정보.데미지 || ''}
                    onChange={(e) => 새스킬정보설정({ ...새스킬정보, 데미지: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    placeholder="쿨다운"
                    className="px-3 py-2 border rounded"
                    value={새스킬정보.쿨다운 || ''}
                    onChange={(e) => 새스킬정보설정({ ...새스킬정보, 쿨다운: Number(e.target.value) })}
                  />
                </div>
                <textarea
                  placeholder="스킬 설명"
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                  value={새스킬정보.설명 || ''}
                  onChange={(e) => 새스킬정보설정({ ...새스킬정보, 설명: e.target.value })}
                />
              </div>
            )}

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => 새아이템모달열림설정(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={새조합저장}
                disabled={새아이템타입 === 'item' ? !새아이템정보.이름 : !새스킬정보.이름}
                className={`px-4 py-2 rounded ${
                  (새아이템타입 === 'item' ? 새아이템정보.이름 : 새스킬정보.이름)
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 새 재료 생성 모달 */}
      {새재료모달열림 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">새 재료 생성</h3>
              <button
                onClick={() => 새재료모달열림설정(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 재료 타입 선택 */}
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => 새재료타입설정('item')}
                className={`flex-1 py-2 px-4 rounded border ${
                  새재료타입 === 'item'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                재료 아이템
              </button>
              <button
                onClick={() => 새재료타입설정('skill')}
                className={`flex-1 py-2 px-4 rounded border ${
                  새재료타입 === 'skill'
                    ? 'bg-purple-500 text-white border-purple-500'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                재료 스킬
              </button>
            </div>

            {새재료타입 === 'item' ? (
              /* 재료 아이템 생성 폼 */
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="재료 아이템 이름"
                  className="w-full px-3 py-2 border rounded"
                  value={새재료아이템정보.이름 || ''}
                  onChange={(e) => 새재료아이템정보설정({ ...새재료아이템정보, 이름: e.target.value })}
                />
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={새재료아이템정보.등급}
                  onChange={(e) => 새재료아이템정보설정({ ...새재료아이템정보, 등급: e.target.value as any })}
                >
                  <option value="일반">일반</option>
                  <option value="희귀">희귀</option>
                  <option value="영웅">영웅</option>
                  <option value="전설">전설</option>
                </select>
                <textarea
                  placeholder="재료 설명"
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                  value={새재료아이템정보.설명 || ''}
                  onChange={(e) => 새재료아이템정보설정({ ...새재료아이템정보, 설명: e.target.value })}
                />
              </div>
            ) : (
              /* 재료 스킬 생성 폼 */
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="재료 스킬 이름"
                  className="w-full px-3 py-2 border rounded"
                  value={새재료스킬정보.이름 || ''}
                  onChange={(e) => 새재료스킬정보설정({ ...새재료스킬정보, 이름: e.target.value })}
                />
                <textarea
                  placeholder="재료 설명"
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                  value={새재료스킬정보.설명 || ''}
                  onChange={(e) => 새재료스킬정보설정({ ...새재료스킬정보, 설명: e.target.value })}
                />
              </div>
            )}

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => 새재료모달열림설정(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={새재료저장}
                disabled={새재료타입 === 'item' ? !새재료아이템정보.이름 : !새재료스킬정보.이름}
                className={`px-4 py-2 rounded ${
                  (새재료타입 === 'item' ? 새재료아이템정보.이름 : 새재료스킬정보.이름)
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default 조합