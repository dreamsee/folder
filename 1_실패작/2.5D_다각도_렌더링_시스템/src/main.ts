import { WebGLRenderer } from './renderer/WebGLRenderer';
import { KeyViewLoader } from './core/KeyViewLoader';
import { LinearInterpolator } from './interpolation/LinearInterpolator';
import { AnimationController } from './animation/AnimationController';
import { UIController } from './ui/UIController';
import { PerformanceMonitor } from './utils/PerformanceMonitor';

class Render2D5System {
    private renderer: WebGLRenderer;
    private loader: KeyViewLoader;
    private interpolator: LinearInterpolator;
    private animationController: AnimationController;
    private uiController: UIController;
    private performanceMonitor: PerformanceMonitor;
    
    private currentAngle: number = 0;
    private keyViews: Map<number, any> = new Map();
    private isInitialized: boolean = false;

    constructor() {
        this.initialize();
    }

    private async initialize() {
        try {
            // 로딩 표시
            this.showLoading(true);

            // Canvas 가져오기
            const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
            if (!canvas) {
                throw new Error('Canvas element not found');
            }

            // 렌더러 초기화
            this.renderer = new WebGLRenderer(canvas);
            
            // 모듈 초기화
            this.loader = new KeyViewLoader();
            this.interpolator = new LinearInterpolator();
            this.animationController = new AnimationController(this);
            this.performanceMonitor = new PerformanceMonitor();
            
            // UI 컨트롤러 초기화
            this.uiController = new UIController(this);
            this.uiController.initialize();

            // 기본 키뷰 로드
            await this.loadDefaultKeyViews();

            // 초기 렌더링
            this.render();

            this.isInitialized = true;
            this.showLoading(false);

            // 렌더링 루프 시작
            this.startRenderLoop();

        } catch (error) {
            console.error('Initialization failed:', error);
            this.showError('초기화 실패: ' + error.message);
        }
    }

    private async loadDefaultKeyViews() {
        try {
            // 실제 키뷰 파일 로드 시도
            const angles = [0, 90, 180, 270];
            
            for (const angle of angles) {
                try {
                    const keyView = await this.loader.loadKeyView(`/assets/keyviews/keyview-${angle}.json`);
                    this.keyViews.set(angle, keyView);
                    console.log(`키뷰 ${angle}도 로드 성공`);
                } catch (error) {
                    console.warn(`키뷰 ${angle}도 로드 실패, 더미 데이터 사용:`, error);
                    // 더미 데이터 폴백
                    const keyView = this.createDummyKeyView(angle);
                    this.keyViews.set(angle, keyView);
                }
            }
        } catch (error) {
            console.error('키뷰 로딩 실패:', error);
            // 전체 폴백
            const angles = [0, 90, 180, 270];
            for (const angle of angles) {
                const keyView = this.createDummyKeyView(angle);
                this.keyViews.set(angle, keyView);
            }
        }
    }

    private createDummyKeyView(angle: number) {
        // 테스트용 더미 키뷰 생성
        const colors = {
            0: [1, 0, 0, 1],    // 빨강 (정면)
            90: [0, 1, 0, 1],   // 초록 (우측)
            180: [0, 0, 1, 1],  // 파랑 (후면)
            270: [1, 1, 0, 1]   // 노랑 (좌측)
        };

        return {
            angle,
            layers: [
                {
                    id: 'body',
                    vertices: this.createQuadVertices(),
                    uvs: this.createQuadUVs(),
                    color: colors[angle] || [1, 1, 1, 1],
                    zIndex: 0
                },
                {
                    id: 'head',
                    vertices: this.createQuadVertices(0.5, 0.3, 0.3),
                    uvs: this.createQuadUVs(),
                    color: [colors[angle][0] * 0.8, colors[angle][1] * 0.8, colors[angle][2] * 0.8, 1],
                    zIndex: 1
                }
            ]
        };
    }

    private createQuadVertices(scale = 1.0, offsetX = 0, offsetY = 0): Float32Array {
        return new Float32Array([
            -0.5 * scale + offsetX, -0.5 * scale + offsetY,
             0.5 * scale + offsetX, -0.5 * scale + offsetY,
             0.5 * scale + offsetX,  0.5 * scale + offsetY,
            -0.5 * scale + offsetX,  0.5 * scale + offsetY
        ]);
    }

    private createQuadUVs(): Float32Array {
        return new Float32Array([
            0, 1,
            1, 1,
            1, 0,
            0, 0
        ]);
    }

    public setAngle(angle: number) {
        this.currentAngle = angle % 360;
        if (this.currentAngle < 0) this.currentAngle += 360;
        this.render();
    }

    public getAngle(): number {
        return this.currentAngle;
    }

    private findAdjacentKeyViews(angle: number): [any, any, number] {
        const sortedAngles = Array.from(this.keyViews.keys()).sort((a, b) => a - b);
        
        // 가장 가까운 두 키뷰 찾기
        let lowerAngle = 0;
        let upperAngle = 360;
        
        for (let i = 0; i < sortedAngles.length; i++) {
            if (sortedAngles[i] <= angle) {
                lowerAngle = sortedAngles[i];
            }
            if (sortedAngles[i] > angle && upperAngle === 360) {
                upperAngle = sortedAngles[i];
                break;
            }
        }

        // 순환 처리
        if (upperAngle === 360) {
            upperAngle = sortedAngles[0] + 360;
        }

        const t = (angle - lowerAngle) / (upperAngle - lowerAngle);
        
        return [
            this.keyViews.get(lowerAngle % 360),
            this.keyViews.get(upperAngle % 360),
            t
        ];
    }

    public render() {
        if (!this.isInitialized) return;

        // 인접 키뷰 찾기
        const [keyView1, keyView2, t] = this.findAdjacentKeyViews(this.currentAngle);
        
        // 보간
        const interpolated = this.interpolator.interpolate(keyView1, keyView2, t);
        
        // 렌더링
        this.renderer.render(interpolated);
        
        // 성능 모니터 업데이트
        this.performanceMonitor.update({
            angle: this.currentAngle,
            layerCount: interpolated.layers.length,
            drawCalls: this.renderer.getDrawCalls()
        });
    }

    private startRenderLoop() {
        const loop = () => {
            if (this.animationController.isPlaying()) {
                this.render();
            }
            requestAnimationFrame(loop);
        };
        loop();
    }

    private showLoading(show: boolean) {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = show ? 'block' : 'none';
        }
    }

    private showError(message: string) {
        console.error(message);
        alert(message);
    }

    public getRenderer(): WebGLRenderer {
        return this.renderer;
    }

    public getAnimationController(): AnimationController {
        return this.animationController;
    }
    
    public get loader(): KeyViewLoader {
        return this.loader;
    }
    
    public get keyViews(): Map<number, any> {
        return this.keyViews;
    }
}

// 시스템 시작
window.addEventListener('DOMContentLoaded', () => {
    (window as any).renderSystem = new Render2D5System();
});