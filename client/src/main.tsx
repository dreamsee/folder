import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// YouTube IFrame API는 index.html에서 로드됨
// window.onYouTubeIframeAPIReady 함수는 API가 준비되면 호출됨

console.log("🔍 main.tsx 로딩 시작");

const root = document.getElementById("root");
console.log("🔍 root 엘리먼트:", root);

if (root) {
  try {
    console.log("🔍 React 앱 렌더링 시작");
    createRoot(root).render(<App />);
    console.log("🔍 React 앱 렌더링 완료");
  } catch (error) {
    console.error("🚨 렌더링 오류:", error);
  }
} else {
  console.error("🚨 root 엘리먼트를 찾을 수 없습니다");
}
