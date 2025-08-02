import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// YouTube IFrame API는 index.html에서 로드됨
// window.onYouTubeIframeAPIReady 함수는 API가 준비되면 호출됨

createRoot(document.getElementById("root")!).render(<App />);
