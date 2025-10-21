import { useState, useEffect, useCallback } from "react";

export const useCustomSpeeds = () => {
  // 커스텀 속도값 관리
  const [customSpeeds, setCustomSpeeds] = useState<number[]>([0.5, 0.75, 1.25, 1.5, 1.75]);
  const [isEditingSpeeds, setIsEditingSpeeds] = useState<boolean>(false);
  const [tempSpeedValues, setTempSpeedValues] = useState<string[]>(["0.5", "0.75", "1.25", "1.5", "1.75"]);

  // 컴포넌트 마운트시 localStorage에서 커스텀 속도값 로드
  useEffect(() => {
    const savedCustomSpeeds = localStorage.getItem('customPlaybackSpeeds');
    if (savedCustomSpeeds) {
      try {
        const speeds = JSON.parse(savedCustomSpeeds);
        setCustomSpeeds(speeds);
        setTempSpeedValues(speeds.map((s: number) => s.toString()));
      } catch (error) {
        console.error('커스텀 속도값 로드 실패:', error);
      }
    }
  }, []);

  // 커스텀 속도값 저장
  const saveCustomSpeeds = useCallback((speeds: number[]) => {
    setCustomSpeeds(speeds);
    localStorage.setItem('customPlaybackSpeeds', JSON.stringify(speeds));
  }, []);

  // 속도 편집 시작
  const startEditingSpeeds = useCallback(() => {
    setIsEditingSpeeds(true);
    setTempSpeedValues(customSpeeds.map(s => s.toString()));
  }, [customSpeeds]);

  // 속도 편집 완료
  const finishEditingSpeeds = useCallback(() => {
    const newSpeeds = tempSpeedValues.map(value => {
      const speed = parseFloat(value);
      if (!isNaN(speed) && speed > 0 && speed <= 5) {
        return Math.round(speed * 20) / 20; // 0.05 단위로 반올림
      }
      return 1; // 기본값
    }).sort((a, b) => a - b); // 오름차순 정렬 (낮은 숫자 → 높은 숫자)

    saveCustomSpeeds(newSpeeds);
    setIsEditingSpeeds(false);
  }, [tempSpeedValues, saveCustomSpeeds]);

  // 속도 편집 취소
  const cancelEditingSpeeds = useCallback(() => {
    setIsEditingSpeeds(false);
    setTempSpeedValues(customSpeeds.map(s => s.toString()));
  }, [customSpeeds]);

  // 임시 속도값 업데이트
  const updateTempSpeedValue = useCallback((index: number, value: string) => {
    setTempSpeedValues(prev => {
      const newValues = [...prev];
      newValues[index] = value;
      return newValues;
    });
  }, []);

  // 마우스 휠로 속도값 조정
  const handleSpeedWheel = useCallback((index: number, event: React.WheelEvent) => {
    event.preventDefault();
    const currentValue = parseFloat(tempSpeedValues[index]) || 0;
    const delta = event.deltaY > 0 ? -0.05 : 0.05; // 휠 아래: 감소, 휠 위: 증가
    const newValue = Math.max(0.05, Math.min(5, currentValue + delta));
    const roundedValue = Math.round(newValue * 20) / 20; // 0.05 단위로 반올림
    updateTempSpeedValue(index, roundedValue.toString());
  }, [tempSpeedValues, updateTempSpeedValue]);

  return {
    customSpeeds,
    isEditingSpeeds,
    tempSpeedValues,
    startEditingSpeeds,
    finishEditingSpeeds,
    cancelEditingSpeeds,
    updateTempSpeedValue,
    handleSpeedWheel,
  };
};
