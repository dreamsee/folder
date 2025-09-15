export class PerformanceMonitor {
    private fps: number = 0;
    private frameCount: number = 0;
    private lastTime: number = performance.now();
    private updateInterval: number = 1000; // 1초마다 업데이트
    
    constructor() {
        this.startMonitoring();
    }
    
    private startMonitoring() {
        const measure = () => {
            const now = performance.now();
            this.frameCount++;
            
            if (now - this.lastTime >= this.updateInterval) {
                this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
                this.frameCount = 0;
                this.lastTime = now;
                this.updateDisplay();
            }
            
            requestAnimationFrame(measure);
        };
        
        measure();
    }
    
    public update(stats: {
        angle?: number;
        layerCount?: number;
        drawCalls?: number;
    }) {
        // 추가 통계 업데이트
        if (stats.angle !== undefined) {
            const angleEl = document.getElementById('currentAngle');
            if (angleEl) angleEl.textContent = Math.round(stats.angle).toString();
        }
        
        if (stats.layerCount !== undefined) {
            const layerEl = document.getElementById('layerCount');
            if (layerEl) layerEl.textContent = stats.layerCount.toString();
        }
        
        if (stats.drawCalls !== undefined) {
            const drawCallsEl = document.getElementById('drawCalls');
            if (drawCallsEl) drawCallsEl.textContent = stats.drawCalls.toString();
        }
    }
    
    private updateDisplay() {
        const fpsEl = document.getElementById('fps');
        if (fpsEl) {
            fpsEl.textContent = this.fps.toString();
            
            // FPS에 따른 색상 변경
            if (this.fps >= 55) {
                fpsEl.style.color = '#0f0';
            } else if (this.fps >= 30) {
                fpsEl.style.color = '#ff0';
            } else {
                fpsEl.style.color = '#f00';
            }
        }
    }
    
    public getFPS(): number {
        return this.fps;
    }
}