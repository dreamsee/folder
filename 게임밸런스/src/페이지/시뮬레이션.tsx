import { useState } from 'react'
import { Swords, RefreshCw } from 'lucide-react'
import { 캐릭터타입 } from '../타입'

const 시뮬레이션 = () => {
  const [선택캐릭터1, 선택캐릭터1설정] = useState<캐릭터타입 | null>(null)
  const [선택캐릭터2, 선택캐릭터2설정] = useState<캐릭터타입 | null>(null)
  const [전투결과, 전투결과설정] = useState<any>(null)
  const [전투중, 전투중설정] = useState(false)

  // 샘플 캐릭터
  const 캐릭터목록: 캐릭터타입[] = [
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
      이동범위: 2,
      공격범위: 1,
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
      이동범위: 1,
      공격범위: 3,
    },
    {
      아이디: '3',
      이름: '그림자 암살자',
      레벨: 48,
      체력: 900,
      공격력: 200,
      방어력: 50,
      속도: 95,
      클래스: '도적',
      등급: '영웅',
      이동범위: 3,
      공격범위: 1,
    },
  ]

  const 전투시뮬레이션 = () => {
    if (!선택캐릭터1 || !선택캐릭터2) return

    전투중설정(true)
    전투결과설정(null)

    // 간단한 전투 시뮬레이션
    setTimeout(() => {
      let 캐릭터1체력 = 선택캐릭터1.체력
      let 캐릭터2체력 = 선택캐릭터2.체력
      const 전투로그 = []
      let 턴 = 0

      while (캐릭터1체력 > 0 && 캐릭터2체력 > 0 && 턴 < 50) {
        턴++
        
        // 속도에 따른 선공 결정
        const 캐릭터1선공 = 선택캐릭터1.속도 >= 선택캐릭터2.속도

        if (캐릭터1선공) {
          // 캐릭터1 공격
          const 데미지1 = Math.max(1, 선택캐릭터1.공격력 - 선택캐릭터2.방어력)
          캐릭터2체력 -= 데미지1
          전투로그.push(`[턴 ${턴}] ${선택캐릭터1.이름}이(가) ${데미지1} 데미지를 입혔습니다!`)
          
          if (캐릭터2체력 <= 0) break
          
          // 캐릭터2 반격
          const 데미지2 = Math.max(1, 선택캐릭터2.공격력 - 선택캐릭터1.방어력)
          캐릭터1체력 -= 데미지2
          전투로그.push(`[턴 ${턴}] ${선택캐릭터2.이름}이(가) ${데미지2} 데미지를 입혔습니다!`)
        } else {
          // 캐릭터2 공격
          const 데미지2 = Math.max(1, 선택캐릭터2.공격력 - 선택캐릭터1.방어력)
          캐릭터1체력 -= 데미지2
          전투로그.push(`[턴 ${턴}] ${선택캐릭터2.이름}이(가) ${데미지2} 데미지를 입혔습니다!`)
          
          if (캐릭터1체력 <= 0) break
          
          // 캐릭터1 반격
          const 데미지1 = Math.max(1, 선택캐릭터1.공격력 - 선택캐릭터2.방어력)
          캐릭터2체력 -= 데미지1
          전투로그.push(`[턴 ${턴}] ${선택캐릭터1.이름}이(가) ${데미지1} 데미지를 입혔습니다!`)
        }
      }

      const 승자 = 캐릭터1체력 > 0 ? 선택캐릭터1.이름 : 선택캐릭터2.이름
      전투로그.push(`\n🏆 ${승자}의 승리!`)

      전투결과설정({
        승자,
        캐릭터1최종체력: Math.max(0, 캐릭터1체력),
        캐릭터2최종체력: Math.max(0, 캐릭터2체력),
        총턴수: 턴,
        전투로그,
      })

      전투중설정(false)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">전투 시뮬레이션</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 캐릭터1 선택 */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">캐릭터 1 선택</h3>
            <div className="space-y-2">
              {캐릭터목록.map((캐릭터) => (
                <button
                  key={캐릭터.아이디}
                  onClick={() => 선택캐릭터1설정(캐릭터)}
                  className={`w-full p-3 text-left rounded-lg border ${
                    선택캐릭터1?.아이디 === 캐릭터.아이디
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  disabled={선택캐릭터2?.아이디 === 캐릭터.아이디}
                >
                  <div className="font-medium">{캐릭터.이름}</div>
                  <div className="text-sm text-gray-500">
                    {캐릭터.클래스} | HP: {캐릭터.체력} | ATK: {캐릭터.공격력}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* VS */}
          <div className="flex items-center justify-center">
            <div className="text-center">
              <Swords className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <span className="text-2xl font-bold text-gray-600">VS</span>
            </div>
          </div>

          {/* 캐릭터2 선택 */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">캐릭터 2 선택</h3>
            <div className="space-y-2">
              {캐릭터목록.map((캐릭터) => (
                <button
                  key={캐릭터.아이디}
                  onClick={() => 선택캐릭터2설정(캐릭터)}
                  className={`w-full p-3 text-left rounded-lg border ${
                    선택캐릭터2?.아이디 === 캐릭터.아이디
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  disabled={선택캐릭터1?.아이디 === 캐릭터.아이디}
                >
                  <div className="font-medium">{캐릭터.이름}</div>
                  <div className="text-sm text-gray-500">
                    {캐릭터.클래스} | HP: {캐릭터.체력} | ATK: {캐릭터.공격력}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={전투시뮬레이션}
            disabled={!선택캐릭터1 || !선택캐릭터2 || 전투중}
            className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {전투중 ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>전투 중...</span>
              </>
            ) : (
              <>
                <Swords className="w-5 h-5" />
                <span>전투 시작!</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 전투 결과 */}
      {전투결과 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold text-gray-900 mb-4">전투 결과</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className={`p-4 rounded-lg ${
              전투결과.승자 === 선택캐릭터1?.이름 ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <h4 className="font-medium mb-2">{선택캐릭터1?.이름}</h4>
              <div className="text-sm space-y-1">
                <div>최종 체력: {전투결과.캐릭터1최종체력} / {선택캐릭터1?.체력}</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${(전투결과.캐릭터1최종체력 / (선택캐릭터1?.체력 || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${
              전투결과.승자 === 선택캐릭터2?.이름 ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <h4 className="font-medium mb-2">{선택캐릭터2?.이름}</h4>
              <div className="text-sm space-y-1">
                <div>최종 체력: {전투결과.캐릭터2최종체력} / {선택캐릭터2?.체력}</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${(전투결과.캐릭터2최종체력 / (선택캐릭터2?.체력 || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">전투 로그</h4>
            <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-line">
                {전투결과.전투로그.join('\n')}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default 시뮬레이션