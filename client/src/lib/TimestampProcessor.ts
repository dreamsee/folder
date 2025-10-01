/**
 * TimestampProcessor.ts
 *
 * 타임스탬프 자동 실행 시스템의 핵심 로직
 * 작동로직.txt의 6단계 파이프라인을 구현한 순수 TypeScript 클래스
 *
 * 주요 기능:
 * - 노트 순서 우선순위 시스템 (시간순 아님)
 * - lastActiveIndex 기반 순차 실행
 * - 시간 검증으로 지나간 타임스탬프 건너뛰기
 * - 자동점프 (-> 액션) 처리
 * - 진입/이탈 감지 및 설정 적용/복원
 */

// 타임스탬프 데이터 인터페이스
export interface ParsedTimestamp {
  startTime: number;      // 시작시간 (초)
  endTime: number;        // 종료시간 (초)
  volume: number;         // 볼륨 (0-100)
  speed: number;          // 속도 (0.25-2.0)
  action?: string;        // 액션 (-> 또는 |숫자)
  raw: string;           // 원본 텍스트
  index: number;         // 노트 순서 인덱스
}

// 처리 상태 인터페이스
export interface ProcessingState {
  activeTimestamp: ParsedTimestamp | null;
  lastActiveIndex: number;
  isProcessingEntry: boolean;
  isProcessingExit: boolean;
  autoJumpTimeoutId: number | null;
  autoJumpInfo: {
    isWaiting: boolean;
    targetIndex: number | null;
    remainingSeconds: number;
  } | null;
  originalSettings: {
    volume: number;
    speed: number;
  } | null;
}

// 플레이어 인터페이스 (YouTube 플레이어 추상화)
export interface PlayerInterface {
  getCurrentTime(): number;
  getVolume(): number;
  getPlaybackRate(): number;
  setVolume(volume: number): void;
  setPlaybackRate(rate: number): void;
  seekTo(time: number, allowSeekAhead?: boolean): void;
  pauseVideo(): void;
  playVideo(): void;
  getPlayerState(): number;
}

// 알림 콜백 타입
export type NotificationCallback = (message: string, type: "info" | "success" | "warning" | "error") => void;

export class TimestampProcessor {
  private state: ProcessingState;
  private player: PlayerInterface | null = null;
  private showNotification: NotificationCallback | null = null;
  private currentTimestamps: ParsedTimestamp[] = []; // 현재 타임스탬프 배열 저장

  // 타임스탬프 정규식 (작동로직.txt에서 가져옴)
  private readonly TIMESTAMP_REGEX = /\[(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?)-(\d{1,2}):(\d{2}):(\d{1,2}(?:\.\d{1,3})?),\s*(\d+)%,\s*([\d.]+)x(?:,\s*(->|\|\d+))?\]/g;

  // 시간 허용 오차 (0.01초)
  private readonly TIME_MARGIN = 0.01;
  // 자동점프 예측 실행 시간 (0.5초 전에 미리 점프)
  private readonly JUMP_PREDICTION_TIME = 0.5;
  // 고속 감지 모드 플래그
  private highSpeedDetection: boolean = false;
  private highSpeedAnimationId: number | null = null;

  constructor() {
    this.state = {
      activeTimestamp: null,
      lastActiveIndex: -1,
      isProcessingEntry: false,
      isProcessingExit: false,
      autoJumpTimeoutId: null,
      autoJumpInfo: null,
      originalSettings: null
    };
  }

  /**
   * 플레이어와 알림 콜백 설정
   */
  public setPlayer(player: PlayerInterface): void {
    this.player = player;
  }

  public setNotificationCallback(callback: NotificationCallback): void {
    this.showNotification = callback;
  }

  /**
   * 단계 1: 파싱 (Parsing)
   * noteText에서 타임스탬프 추출 및 노트 순서로 정렬
   */
  public parseTimestamps(noteText: string): ParsedTimestamp[] {
    const timestamps: ParsedTimestamp[] = [];
    let match;
    let index = 0;

    // 정규식으로 모든 타임스탬프 매칭
    this.TIMESTAMP_REGEX.lastIndex = 0; // 정규식 초기화

    while ((match = this.TIMESTAMP_REGEX.exec(noteText)) !== null) {
      // 시간을 초 단위로 변환
      const startTime = this.parseTimeToSeconds(
        parseInt(match[1]), // 시
        parseInt(match[2]), // 분
        parseFloat(match[3]) // 초
      );

      const endTime = this.parseTimeToSeconds(
        parseInt(match[4]), // 시
        parseInt(match[5]), // 분
        parseFloat(match[6]) // 초
      );

      const volume = parseInt(match[7]);
      const speed = parseFloat(match[8]);
      const action = match[9]; // -> 또는 |숫자

      timestamps.push({
        startTime,
        endTime,
        volume,
        speed,
        action,
        raw: match[0],
        index: index++
      });

      // 디버깅: 파싱된 타임스탬프 정보 출력
      this.log(`[파싱] ${index-1}: ${match[0]} → action: "${action || '없음'}"`);
    }

    // 노트 순서(index) 기준으로 정렬 (시간순 아님!)
    return timestamps.sort((a, b) => a.index - b.index);
  }

  /**
   * 시간을 초 단위로 변환
   */
  private parseTimeToSeconds(hours: number, minutes: number, seconds: number): number {
    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * 단계 2: 감지 (Detection)
   * 현재 재생 시간에서 활성화될 타임스탬프 찾기
   * 노트 순서 우선순위 + 시간 검증 적용
   */
  public detectActiveTimestamp(timestamps: ParsedTimestamp[], currentTime: number): ParsedTimestamp | null {
    if (!timestamps.length) return null;

    // 현재 activeTimestamp가 있는 경우: 해당 구간 내에 있는지만 확인
    if (this.state.activeTimestamp) {
      const active = this.state.activeTimestamp;
      if (currentTime >= active.startTime - this.TIME_MARGIN &&
          currentTime <= active.endTime + this.TIME_MARGIN) {
        return active; // 현재 구간 유지
      } else {
        return null; // 구간 이탈
      }
    }

    // activeTimestamp가 없을 때: 노트 순서 우선순위로 검색
    // lastActiveIndex + 1 이후의 타임스탬프만 검색
    for (let i = this.state.lastActiveIndex + 1; i < timestamps.length; i++) {
      const stamp = timestamps[i];

      // 시간 범위 내에 있는지 확인
      if (currentTime >= stamp.startTime - this.TIME_MARGIN &&
          currentTime <= stamp.endTime + this.TIME_MARGIN) {
        return stamp; // 조건 만족하는 첫 번째 타임스탬프 반환
      }
    }

    return null;
  }

  /**
   * 단계 3: 진입 (Entry)
   * 타임스탬프 구간에 진입했을 때 설정 적용
   */
  public processEntry(timestamp: ParsedTimestamp): void {
    if (!this.player || this.state.isProcessingEntry) return;

    this.state.isProcessingEntry = true;

    try {
      // originalSettings 백업 (현재 설정 저장)
      this.state.originalSettings = {
        volume: this.player.getVolume(),
        speed: this.player.getPlaybackRate()
      };

      // 정지 액션이 있는 경우: 감지 지연 상쇄를 위해 0.5초 앞으로 점프 후 0.25x 속도 재생
      if (timestamp.action?.startsWith('|')) {
        // 감지 지연 0.5초를 상쇄하기 위해 0.5초 앞으로 점프
        const jumpPosition = Math.max(0, timestamp.startTime - 0.5);
        this.player.seekTo(jumpPosition);
        this.player.setVolume(timestamp.volume);
        this.player.setPlaybackRate(0.25);
        this.log(`[정지전환] 타임스탬프 ${timestamp.index} ${this.formatTime(jumpPosition)}로 점프 후 0.25x 속도 (지연 상쇄)`);
      } else {
        // 일반 타임스탬프 또는 자동점프: 원래 설정대로 적용
        this.player.setVolume(timestamp.volume);
        this.player.setPlaybackRate(timestamp.speed);
      }

      // activeTimestamp 설정
      this.state.activeTimestamp = timestamp;
      this.state.lastActiveIndex = timestamp.index;

      // 액션 실행 (정지 액션은 지연된 재생 처리)
      this.executeAction(timestamp);

      // 로그 출력
      this.log(`[진입] 타임스탬프 ${timestamp.index}: ${this.formatTime(timestamp.startTime)}-${this.formatTime(timestamp.endTime)}, ${timestamp.volume}%, ${timestamp.speed}x`);

    } finally {
      this.state.isProcessingEntry = false;
    }
  }

  /**
   * 단계 4: 이탈 (Exit)
   * 타임스탬프 구간에서 이탈했을 때 설정 복원
   */
  public processExit(): void {
    if (!this.player || this.state.isProcessingExit || !this.state.activeTimestamp) return;

    this.state.isProcessingExit = true;

    try {
      const exitedTimestamp = this.state.activeTimestamp;
      const hasAutoJump = exitedTimestamp?.action === '->';

      // 자동점프가 예정된 경우 타이머는 유지 (-> 액션 실행)
      // 수동 이탈이나 다른 이유로 이탈한 경우에만 타이머 취소
      if (this.state.autoJumpTimeoutId && !hasAutoJump) {
        clearTimeout(this.state.autoJumpTimeoutId);
        this.state.autoJumpTimeoutId = null;
        this.state.autoJumpInfo = null;
      }

      // -> 액션이 있는 경우: 자동점프 상태는 유지하고 타이머도 계속 실행

      // 설정 복원
      if (this.state.originalSettings) {
        this.player.setVolume(this.state.originalSettings.volume);
        this.player.setPlaybackRate(this.state.originalSettings.speed);
      }

      // -> 액션이 있는 경우 activeTimestamp를 유지하여 자동점프가 정상 실행되도록 함
      if (!hasAutoJump) {
        this.state.activeTimestamp = null;
      }
      this.state.originalSettings = null;

      // 로그 출력
      this.log(`[이탈] 타임스탬프 ${exitedTimestamp.index} 종료`);

    } finally {
      this.state.isProcessingExit = false;
    }
  }

  /**
   * 단계 5: 자동점프 (Auto Jump)
   * -> 액션이 있는 타임스탬프에서 다음 타임스탬프로 이동
   */
  private executeAction(timestamp: ParsedTimestamp): void {
    this.log(`[액션] 타임스탬프 ${timestamp.index} 액션 실행: "${timestamp.action || '없음'}"`);

    if (!timestamp.action) return;

    if (timestamp.action === '->') {
      // 자동점프: 속도 보정 계산 적용 (유노 방식)
      const currentTime = this.player?.getCurrentTime() || timestamp.startTime;
      const timeToEnd = timestamp.endTime - currentTime;
      // 실제 재생 속도를 고려한 실시간 계산
      const realTimeToEnd = (timeToEnd / timestamp.speed) * 1000;
      const nextTimestamp = this.currentTimestamps.find(ts => ts.index === timestamp.index + 1);

      // 자동점프 상태 설정
      this.state.autoJumpInfo = {
        isWaiting: true,
        targetIndex: nextTimestamp ? nextTimestamp.index : null,
        remainingSeconds: Math.ceil(realTimeToEnd / 1000)
      };

      this.state.autoJumpTimeoutId = window.setTimeout(() => {
        this.executeAutoJump(timestamp, this.currentTimestamps);
      }, realTimeToEnd);

      this.log(`[자동점프] 속도보정: ${timeToEnd.toFixed(2)}초 구간, ${timestamp.speed}x 속도 → 실제 ${(realTimeToEnd/1000).toFixed(2)}초 후 점프 → #${nextTimestamp?.index || '없음'}`);

    } else if (timestamp.action.startsWith('|')) {
      // 정지 액션: |3 = 3초간 정지
      const pauseSeconds = parseInt(timestamp.action.substring(1));

      // 0.25x 재생 중 약간의 지연 후 정지 (부드러운 전환)
      setTimeout(() => {
        this.player?.pauseVideo();
        this.log(`[정지] 0.25x에서 완전 정지로 전환`);
      }, 300); // 0.3초 후 정지 (느린 재생 효과)

      this.log(`[정지대기] ${pauseSeconds}초 대기 후 자동 재생 예약`);

      // 정지 시간 후 재생 재개 및 원래 속도 복원
      setTimeout(() => {
        if (this.player && this.state.activeTimestamp) {
          // 원래 설정된 속도로 복원
          this.player.setPlaybackRate(this.state.activeTimestamp.speed);
          this.player.playVideo();
          this.log(`[재생] ${pauseSeconds}초 정지 후 ${this.state.activeTimestamp.speed}x 속도로 재생 재개`);
        }
      }, (pauseSeconds * 1000) + 300); // 정지 시간 + 0.3초 (정지 전환 시간 포함)
    }
  }

  /**
   * 다음 타임스탬프로 자동 점프 실행
   */
  private executeAutoJump(currentTimestamp: ParsedTimestamp, allTimestamps: ParsedTimestamp[]): void {
    if (!this.player) return;

    this.log(`[자동점프] 현재 타임스탬프 ${currentTimestamp.index}에서 다음 찾기 (전체 ${allTimestamps.length}개)`);

    // 현재 타임스탬프 다음 순서의 타임스탬프 찾기
    const nextTimestamp = allTimestamps.find(ts => ts.index === currentTimestamp.index + 1);

    if (nextTimestamp) {
      // 간단 방식: 그냥 점프
      this.player.seekTo(nextTimestamp.startTime, true);
      this.log(`[자동점프] ${this.formatTime(nextTimestamp.startTime)} → #${nextTimestamp.index}`);
    } else {
      // 다음 타임스탬프가 없으면 정지
      this.player.pauseVideo();
      this.log(`[자동점프] index ${currentTimestamp.index + 1} 타임스탬프가 없어 정지`);

      // 디버깅: 모든 타임스탬프 index 출력
      const allIndexes = allTimestamps.map(ts => ts.index).join(', ');
      this.log(`[자동점프] 현재 모든 타임스탬프 index: [${allIndexes}]`);
    }

    // 자동점프 완료 후 상태 초기화
    this.state.autoJumpInfo = null;
    this.state.activeTimestamp = null; // 자동점프 후 activeTimestamp 정리
  }

  /**
   * 수동 이동 감지 및 우선순위 재설정
   * 사용자가 수동으로 영상을 이동했을 때 lastActiveIndex 재계산
   */
  public handleManualSeek(timestamps: ParsedTimestamp[], currentTime: number): void {
    if (!timestamps.length) return;

    // 수동 이동시 기존 자동점프 타이머와 상태 초기화
    if (this.state.autoJumpTimeoutId) {
      clearTimeout(this.state.autoJumpTimeoutId);
      this.state.autoJumpTimeoutId = null;
      this.log(`[수동이동] 기존 자동점프 타이머 취소`);
    }
    this.state.autoJumpInfo = null;
    this.state.activeTimestamp = null;

    // 가장 가까운 타임스탬프 찾기 (시작시간 기준)
    let closestTimestamp: ParsedTimestamp | null = null;
    let minDistance = Infinity;

    for (const timestamp of timestamps) {
      const distance = Math.abs(currentTime - timestamp.startTime);
      if (distance < minDistance) {
        minDistance = distance;
        closestTimestamp = timestamp;
      }
    }

    if (closestTimestamp) {
      // 가장 가까운 타임스탬프의 이전 인덱스로 설정
      this.state.lastActiveIndex = closestTimestamp.index - 1;
      this.log(`[수동이동] 우선순위 재설정 - lastActiveIndex: ${this.state.lastActiveIndex}`);
    }
  }

  /**
   * 더블클릭 처리 (시작/종료시간 구분)
   */
  public handleDoubleClick(timestamp: ParsedTimestamp, isEndTimeClick: boolean): void {
    if (!this.player) return;

    if (isEndTimeClick) {
      // 종료시간 클릭: activeTimestamp 설정하지 않음 (자동 이탈 로직 작동)
      this.player.seekTo(timestamp.endTime, false);
      this.log(`[더블클릭] 종료시간으로 이동 - 자동 이탈 대기`);
    } else {
      // 시작시간 클릭: activeTimestamp 설정 (중복 실행 방지)
      this.player.seekTo(timestamp.startTime, false);
      this.state.activeTimestamp = timestamp;
      this.state.lastActiveIndex = timestamp.index - 1; // 자동 감지가 해당 인덱스부터 시작하도록

      // 설정 즉시 적용
      this.processEntry(timestamp);
      this.log(`[더블클릭] 시작시간으로 이동 - 설정 적용`);
    }
  }

  /**
   * 메인 처리 함수
   * 0.5초마다 호출되어 전체 파이프라인 실행
   */
  public process(timestamps: ParsedTimestamp[], currentTime: number): void {
    if (!this.player || !timestamps.length) return;

    // 현재 타임스탬프 배열 저장 (자동점프에서 사용)
    this.currentTimestamps = timestamps;

    // 유노 방식: 실시간 체크 제거, 순수 타이머 기반으로 동작

    // 단계 2: 감지
    const detectedTimestamp = this.detectActiveTimestamp(timestamps, currentTime);

    // 단계 3: 진입 조건 확인
    if (detectedTimestamp && !this.state.activeTimestamp) {
      this.processEntry(detectedTimestamp);
    }

    // 단계 4: 이탈 조건 확인
    if (!detectedTimestamp && this.state.activeTimestamp) {
      this.processExit();
    }
  }

  /**
   * 상태 조회 메서드들
   */
  public getActiveTimestamp(): ParsedTimestamp | null {
    return this.state.activeTimestamp;
  }

  public getLastActiveIndex(): number {
    return this.state.lastActiveIndex;
  }

  public isProcessing(): boolean {
    return this.state.isProcessingEntry || this.state.isProcessingExit;
  }

  public getAutoJumpInfo(): { isWaiting: boolean; targetIndex: number | null; remainingSeconds: number } | null {
    return this.state.autoJumpInfo;
  }

  /**
   * 고속 감지 모드 시작 (자동점프 직후 재생 방지)
   */
  private startHighSpeedDetection(): void {
    this.highSpeedDetection = true;
    let checkCount = 0;
    const maxChecks = 30; // 약 0.5초간 고속 체크

    const highSpeedCheck = () => {
      if (!this.player || !this.highSpeedDetection || checkCount >= maxChecks) {
        this.highSpeedDetection = false;
        this.highSpeedAnimationId = null;
        return;
      }

      // 재생 중이면 즉시 정지
      const playerState = this.player.getPlayerState();
      if (playerState === 1) { // 재생 중
        this.player.pauseVideo();
        this.log(`[고속차단] 재생 감지 - 즉시 정지 (${checkCount}번째 체크)`);
      }

      checkCount++;
      this.highSpeedAnimationId = requestAnimationFrame(highSpeedCheck);
    };

    highSpeedCheck();
  }

  /**
   * 상태 초기화
   */
  public reset(): void {
    if (this.state.autoJumpTimeoutId) {
      clearTimeout(this.state.autoJumpTimeoutId);
    }

    if (this.highSpeedAnimationId) {
      cancelAnimationFrame(this.highSpeedAnimationId);
    }

    this.highSpeedDetection = false;
    this.highSpeedAnimationId = null;

    this.state = {
      activeTimestamp: null,
      lastActiveIndex: -1,
      isProcessingEntry: false,
      isProcessingExit: false,
      autoJumpTimeoutId: null,
      autoJumpInfo: null,
      originalSettings: null
    };
  }

  /**
   * 유틸리티 메서드들
   */
  private formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  private log(message: string): void {
    console.log(`[TimestampProcessor] ${message}`);

    // 정지 관련 로그는 알림 표시하지 않음 (재생 지연 방지)
    const isPauseRelated = message.includes('[정지') || message.includes('[재생]');

    if (this.showNotification && !isPauseRelated) {
      this.showNotification(message, 'info');
    }
  }

}