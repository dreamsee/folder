// EUC-KR 인코딩 유틸리티

// EUC-KR 인코딩 감지
export function detectEncoding(data: ArrayBuffer): string {
  const uint8 = new Uint8Array(data);

  // BOM 확인
  if (uint8.length >= 2) {
    if (uint8[0] === 0xFF && uint8[1] === 0xFE) return 'UTF-16LE';
    if (uint8[0] === 0xFE && uint8[1] === 0xFF) return 'UTF-16BE';
    if (uint8.length >= 3 && uint8[0] === 0xEF && uint8[1] === 0xBB && uint8[2] === 0xBF) return 'UTF-8';
  }

  // EUC-KR vs UTF-8 판별
  let eucKrScore = 0;
  let utf8Score = 0;
  let i = 0;

  while (i < uint8.length) {
    const byte = uint8[i];

    // ASCII 범위
    if (byte < 0x80) {
      i++;
      continue;
    }

    // UTF-8 멀티바이트 시퀀스 확인
    if (byte >= 0xC0 && byte <= 0xDF && i + 1 < uint8.length) {
      // 2바이트 UTF-8
      if ((uint8[i + 1] & 0xC0) === 0x80) {
        utf8Score += 2;
        i += 2;
        continue;
      }
    } else if (byte >= 0xE0 && byte <= 0xEF && i + 2 < uint8.length) {
      // 3바이트 UTF-8 (한글 포함)
      if ((uint8[i + 1] & 0xC0) === 0x80 && (uint8[i + 2] & 0xC0) === 0x80) {
        utf8Score += 3;
        i += 3;
        continue;
      }
    } else if (byte >= 0xF0 && byte <= 0xF7 && i + 3 < uint8.length) {
      // 4바이트 UTF-8
      if ((uint8[i + 1] & 0xC0) === 0x80 && (uint8[i + 2] & 0xC0) === 0x80 && (uint8[i + 3] & 0xC0) === 0x80) {
        utf8Score += 4;
        i += 4;
        continue;
      }
    }

    // EUC-KR 2바이트 시퀀스 확인
    // EUC-KR: 첫 바이트 0x81-0xFE, 두번째 바이트 0x41-0xFE
    if (byte >= 0x81 && byte <= 0xFE && i + 1 < uint8.length) {
      const nextByte = uint8[i + 1];
      if ((nextByte >= 0x41 && nextByte <= 0x5A) ||
          (nextByte >= 0x61 && nextByte <= 0x7A) ||
          (nextByte >= 0x81 && nextByte <= 0xFE)) {
        eucKrScore += 2;
        i += 2;
        continue;
      }
    }

    // 알 수 없는 바이트
    i++;
  }

  // 점수 비교하여 인코딩 결정
  if (eucKrScore > utf8Score && eucKrScore > 0) {
    return 'EUC-KR';
  }

  return 'UTF-8';
}

// 텍스트를 EUC-KR 바이트 배열로 인코딩
export function encodeToEucKr(text: string): Uint8Array {
  // 테이블이 준비되지 않았으면 경고
  if (!isEucKrTableReady()) {
    console.warn('[EUC-KR] 매핑 테이블이 충분히 빌드되지 않았습니다. 일부 한글이 깨질 수 있습니다.');
  }

  const bytes: number[] = [];

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);

    // ASCII 범위
    if (code < 0x80) {
      bytes.push(code);
      continue;
    }

    // 한글 완성형 (가-힣: U+AC00-U+D7A3)
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const eucKrBytes = unicodeToEucKr(code);
      if (eucKrBytes) {
        bytes.push(eucKrBytes[0], eucKrBytes[1]);
      } else {
        // 변환 실패시 ? 출력
        bytes.push(0x3F);
      }
      continue;
    }

    // 한글 자모 (ㄱ-ㅎ, ㅏ-ㅣ: U+3131-U+3163)
    if (code >= 0x3131 && code <= 0x3163) {
      const eucKrBytes = unicodeJamoToEucKr(code);
      if (eucKrBytes) {
        bytes.push(eucKrBytes[0], eucKrBytes[1]);
      } else {
        bytes.push(0x3F);
      }
      continue;
    }

    // 기타 특수문자 (일부 지원)
    const specialBytes = unicodeSpecialToEucKr(code);
    if (specialBytes) {
      bytes.push(specialBytes[0], specialBytes[1]);
      continue;
    }

    // 변환 불가능한 문자
    bytes.push(0x3F); // ?
  }

  return new Uint8Array(bytes);
}

// 유니코드 한글 완성형을 EUC-KR로 변환
function unicodeToEucKr(unicode: number): [number, number] | null {
  // 한글 완성형 범위 확인
  if (unicode < 0xAC00 || unicode > 0xD7A3) return null;

  // KS X 1001 한글 영역 매핑
  // EUC-KR 한글 영역: 0xB0A1-0xC8FE (2,350자)
  // 유니코드 한글: 0xAC00-0xD7A3 (11,172자)

  // 완성형 한글 테이블 인덱스 계산
  const index = unicode - 0xAC00;

  // KS X 1001에 정의된 2,350자만 직접 매핑 가능
  // 나머지는 조합형으로 처리해야 하지만, 간단히 처리

  // 간단한 근사 매핑 (완벽하지 않음)
  // 실제로는 완전한 매핑 테이블이 필요
  const eucKrIndex = UNICODE_TO_EUCKR_MAP[unicode];
  if (eucKrIndex !== undefined) {
    const row = Math.floor(eucKrIndex / 94);
    const col = eucKrIndex % 94;
    return [0xB0 + row, 0xA1 + col];
  }

  // 매핑 테이블에 없는 경우 근사값 사용
  // 한글 음절을 초성/중성/종성으로 분해하여 가장 가까운 완성형 찾기
  const cho = Math.floor(index / 588);
  const jung = Math.floor((index % 588) / 28);
  const _jong = index % 28; // 종성 (미사용, 대표 음절로 매핑)

  // 대표 음절로 매핑 (종성 없는 형태로)
  const baseIndex = cho * 588 + jung * 28;
  const baseUnicode = 0xAC00 + baseIndex;

  const baseEucKr = UNICODE_TO_EUCKR_MAP[baseUnicode];
  if (baseEucKr !== undefined) {
    const row = Math.floor(baseEucKr / 94);
    const col = baseEucKr % 94;
    return [0xB0 + row, 0xA1 + col];
  }

  return null;
}

// 유니코드 한글 자모를 EUC-KR로 변환
function unicodeJamoToEucKr(unicode: number): [number, number] | null {
  // 한글 호환 자모 (U+3131-U+3163)
  const jamoMap: { [key: number]: [number, number] } = {
    0x3131: [0xA4, 0xA1], // ㄱ
    0x3132: [0xA4, 0xA2], // ㄲ
    0x3133: [0xA4, 0xA3], // ㄳ
    0x3134: [0xA4, 0xA4], // ㄴ
    0x3135: [0xA4, 0xA5], // ㄵ
    0x3136: [0xA4, 0xA6], // ㄶ
    0x3137: [0xA4, 0xA7], // ㄷ
    0x3138: [0xA4, 0xA8], // ㄸ
    0x3139: [0xA4, 0xA9], // ㄹ
    0x313A: [0xA4, 0xAA], // ㄺ
    0x313B: [0xA4, 0xAB], // ㄻ
    0x313C: [0xA4, 0xAC], // ㄼ
    0x313D: [0xA4, 0xAD], // ㄽ
    0x313E: [0xA4, 0xAE], // ㄾ
    0x313F: [0xA4, 0xAF], // ㄿ
    0x3140: [0xA4, 0xB0], // ㅀ
    0x3141: [0xA4, 0xB1], // ㅁ
    0x3142: [0xA4, 0xB2], // ㅂ
    0x3143: [0xA4, 0xB3], // ㅃ
    0x3144: [0xA4, 0xB4], // ㅄ
    0x3145: [0xA4, 0xB5], // ㅅ
    0x3146: [0xA4, 0xB6], // ㅆ
    0x3147: [0xA4, 0xB7], // ㅇ
    0x3148: [0xA4, 0xB8], // ㅈ
    0x3149: [0xA4, 0xB9], // ㅉ
    0x314A: [0xA4, 0xBA], // ㅊ
    0x314B: [0xA4, 0xBB], // ㅋ
    0x314C: [0xA4, 0xBC], // ㅌ
    0x314D: [0xA4, 0xBD], // ㅍ
    0x314E: [0xA4, 0xBE], // ㅎ
    0x314F: [0xA4, 0xBF], // ㅏ
    0x3150: [0xA4, 0xC0], // ㅐ
    0x3151: [0xA4, 0xC1], // ㅑ
    0x3152: [0xA4, 0xC2], // ㅒ
    0x3153: [0xA4, 0xC3], // ㅓ
    0x3154: [0xA4, 0xC4], // ㅔ
    0x3155: [0xA4, 0xC5], // ㅕ
    0x3156: [0xA4, 0xC6], // ㅖ
    0x3157: [0xA4, 0xC7], // ㅗ
    0x3158: [0xA4, 0xC8], // ㅘ
    0x3159: [0xA4, 0xC9], // ㅙ
    0x315A: [0xA4, 0xCA], // ㅚ
    0x315B: [0xA4, 0xCB], // ㅛ
    0x315C: [0xA4, 0xCC], // ㅜ
    0x315D: [0xA4, 0xCD], // ㅝ
    0x315E: [0xA4, 0xCE], // ㅞ
    0x315F: [0xA4, 0xCF], // ㅟ
    0x3160: [0xA4, 0xD0], // ㅠ
    0x3161: [0xA4, 0xD1], // ㅡ
    0x3162: [0xA4, 0xD2], // ㅢ
    0x3163: [0xA4, 0xD3], // ㅣ
  };

  return jamoMap[unicode] || null;
}

// 특수문자 매핑
function unicodeSpecialToEucKr(unicode: number): [number, number] | null {
  const specialMap: { [key: number]: [number, number] } = {
    // 일부 특수문자
    0x00A0: [0xA1, 0xA1], // NBSP
    0x2018: [0xA1, 0xAE], // '
    0x2019: [0xA1, 0xAF], // '
    0x201C: [0xA1, 0xB0], // "
    0x201D: [0xA1, 0xB1], // "
    0x2026: [0xA1, 0xA6], // …
    0x2014: [0xA1, 0xAA], // —
    0x00B7: [0xA1, 0xA4], // ·
    0x3000: [0xA1, 0xA1], // 전각 공백
  };

  return specialMap[unicode] || null;
}

// 유니코드 -> EUC-KR 매핑 테이블 (자주 사용되는 한글 2,350자)
// 완전한 테이블은 매우 크므로 기본 매핑만 포함
const UNICODE_TO_EUCKR_MAP: { [key: number]: number } = {};

// 테이블 빌드 완료 플래그
let eucKrTableBuilt = false;

// 테이블이 충분히 빌드되었는지 확인
export function isEucKrTableReady(): boolean {
  return eucKrTableBuilt || Object.keys(UNICODE_TO_EUCKR_MAP).length >= 2000;
}

// 테이블 초기화 (KS X 1001 한글 영역)
(function initEucKrTable() {
  // KS X 1001 한글 2,350자 매핑
  // 행: 0xB0-0xC8 (25행), 열: 0xA1-0xFE (94열)
  // 실제 한글 영역: B0A1-C8FE

  // 완성형 한글 매핑 데이터 (간소화된 버전)
  // 실제로는 2,350자 전체를 매핑해야 함
  const hangulStart = [
    '가각간갈감갑값갓강갖갗같갚갛개객갠갤갬갭갯갰갱갸갹갼걀걋걍걔걘걜거걱건걷걸걺검겁것겄겅겆겉겊겋게겐겔겜겝겟겠겡겨격겪견겯결겸겹겻겼경곁계곈곌곕곗고곡곤곧골곪곬곯곰곱곳공곶과곽관괄괆',
    '괌괍괏광괘괜괠괩괬괭괴괵괸괼굄굅굇굉교굔굘굡굣구국군굳굴굵굶굻굼굽굿궁궂궈궉권궐궜궝궤궷귀귁귄귈귐귑귓규균귤그극근귿글긁금급긋긍긔기긱긴긷길긺김깁깃깅깆깊까깍깎깐깔깖깜깝깟깠깡깥깨깩깬깰깸',
    '깹깻깼깽꺄꺅꺌꺼꺽꺾껀껄껌껍껏껐껑께껙껜껨껫껭껴껸껼꼇꼈꼍꼐꼬꼭꼰꼲꼴꼼꼽꼿꽁꽂꽃꽈꽉꽐꽜꽝꽤꽥꽹꾀꾄꾈꾐꾑꾕꾜꾸꾹꾼꿀꿇꿈꿉꿋꿍꿎꿔꿜꿨꿩꿰꿱꿴꿸뀀뀁뀄뀌뀐뀔뀜뀝뀨끄끅끈끊끌끎끓끔끕끗끙끝끼끽낀낄낌낍낏낑나낙낚난낟날낡낢남납',
  ];

  let eucKrIndex = 0;
  for (const line of hangulStart) {
    for (const char of line) {
      const unicode = char.charCodeAt(0);
      UNICODE_TO_EUCKR_MAP[unicode] = eucKrIndex++;
    }
  }
})();

// 전체 KS X 1001 한글 매핑을 위한 확장 테이블
// 이 함수는 런타임에 EUC-KR 디코딩을 통해 매핑 테이블을 생성
export async function buildFullEucKrTable(): Promise<void> {
  // 이미 빌드되었으면 스킵
  if (eucKrTableBuilt) return;

  // EUC-KR 바이트 시퀀스를 생성하고 디코딩하여 매핑 구축
  for (let high = 0xB0; high <= 0xC8; high++) {
    for (let low = 0xA1; low <= 0xFE; low++) {
      const bytes = new Uint8Array([high, low]);
      try {
        const decoder = new TextDecoder('euc-kr');
        const char = decoder.decode(bytes);
        if (char && char.length === 1 && char.charCodeAt(0) >= 0xAC00) {
          const unicode = char.charCodeAt(0);
          const index = (high - 0xB0) * 94 + (low - 0xA1);
          UNICODE_TO_EUCKR_MAP[unicode] = index;
        }
      } catch (e) {
        // 무시
      }
    }
  }

  eucKrTableBuilt = true;
  console.log('[EUC-KR] 매핑 테이블 빌드 완료:', Object.keys(UNICODE_TO_EUCKR_MAP).length, '문자');
}

// 디코딩 함수 (인코딩에 따라 적절한 디코더 사용)
export function decodeWithEncoding(data: ArrayBuffer, encoding: string): string {
  const decoder = new TextDecoder(encoding);
  return decoder.decode(data);
}
