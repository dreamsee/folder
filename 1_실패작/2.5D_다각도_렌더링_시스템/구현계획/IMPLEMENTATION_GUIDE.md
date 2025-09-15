# 2.5D 다각도 렌더링 시스템 구현 가이드

## 🎯 MVP 구현 (Phase 1 - 2주)

### Week 1: 기초 시스템 구축
```javascript
// Day 1-2: 프로젝트 셋업
npm init vite@latest render-2.5d -- --template vanilla-ts
npm install gl-matrix hammerjs

// Day 3-4: 키뷰 로더 구현
class KeyViewLoader {
    async loadKeyView(angle: number): Promise<KeyView> {
        const response = await fetch(`/assets/keyviews/${angle}.json`);
        const data = await response.json();
        
        return {
            angle,
            layers: await Promise.all(data.layers.map(async layer => ({
                ...layer,
                texture: await createImageBitmap(
                    await fetch(layer.textureUrl).then(r => r.blob())
                ),
                mesh: new Float32Array(layer.mesh),
                uv: new Float32Array(layer.uv)
            })))
        };
    }
}

// Day 5-7: WebGL 렌더러 기초
class WebGLRenderer {
    private gl: WebGL2RenderingContext;
    private program: WebGLProgram;
    
    constructor(canvas: HTMLCanvasElement) {
        this.gl = canvas.getContext('webgl2')!;
        this.program = this.createShaderProgram();
    }
    
    private createShaderProgram(): WebGLProgram {
        const vertexShader = `#version 300 es
            in vec2 a_position;
            in vec2 a_texCoord;
            
            uniform mat3 u_matrix;
            
            out vec2 v_texCoord;
            
            void main() {
                gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
                v_texCoord = a_texCoord;
            }
        `;
        
        const fragmentShader = `#version 300 es
            precision highp float;
            
            in vec2 v_texCoord;
            
            uniform sampler2D u_texture;
            uniform float u_alpha;
            
            out vec4 fragColor;
            
            void main() {
                fragColor = texture(u_texture, v_texCoord);
                fragColor.a *= u_alpha;
            }
        `;
        
        return this.compileProgram(vertexShader, fragmentShader);
    }
}
```

### Week 2: 보간 시스템
```javascript
// Day 8-10: 선형 보간 구현
class LinearInterpolator {
    interpolate(keyView1: KeyView, keyView2: KeyView, t: number): InterpolatedView {
        const result: InterpolatedView = {
            layers: []
        };
        
        for (let i = 0; i < keyView1.layers.length; i++) {
            const layer1 = keyView1.layers[i];
            const layer2 = keyView2.layers[i];
            
            // 메쉬 보간
            const interpolatedMesh = new Float32Array(layer1.mesh.length);
            for (let j = 0; j < layer1.mesh.length; j++) {
                interpolatedMesh[j] = lerp(layer1.mesh[j], layer2.mesh[j], t);
            }
            
            result.layers.push({
                mesh: interpolatedMesh,
                texture1: layer1.texture,
                texture2: layer2.texture,
                blendFactor: t,
                zIndex: Math.round(lerp(layer1.zIndex, layer2.zIndex, t))
            });
        }
        
        return result;
    }
}

// Day 11-12: Z-순서 시스템
class ZOrderManager {
    private rules = new Map<string, string[]>();
    
    constructor() {
        this.rules.set('0-90', ['bg', 'body', 'arm_back', 'leg', 'head', 'arm_front']);
        this.rules.set('90-180', ['bg', 'arm_left', 'body', 'leg', 'head', 'arm_right']);
        // ... 더 많은 규칙
    }
    
    getZOrder(angle: number): string[] {
        const range = Math.floor(angle / 90) * 90;
        const key = `${range}-${range + 90}`;
        return this.rules.get(key) || [];
    }
}

// Day 13-14: 통합 및 테스트
class Render2D5System {
    private loader: KeyViewLoader;
    private renderer: WebGLRenderer;
    private interpolator: LinearInterpolator;
    private zOrderManager: ZOrderManager;
    
    async render(targetAngle: number) {
        // 인접 키뷰 찾기
        const [kv1, kv2, t] = this.findAdjacentKeyViews(targetAngle);
        
        // 보간
        const interpolated = this.interpolator.interpolate(kv1, kv2, t);
        
        // Z-순서 적용
        const zOrder = this.zOrderManager.getZOrder(targetAngle);
        interpolated.layers.sort((a, b) => 
            zOrder.indexOf(a.id) - zOrder.indexOf(b.id)
        );
        
        // 렌더링
        this.renderer.render(interpolated);
    }
}
```

## 🔨 핵심 알고리즘 구현

### ARAP (As-Rigid-As-Possible) 변형
```typescript
class ARAPDeformer {
    private controlPoints: vec2[];
    private cells: Cell[];
    
    deform(
        sourceMesh: Float32Array,
        targetControlPoints: vec2[],
        t: number
    ): Float32Array {
        // Step 1: 제어점 보간
        const interpolatedCP = this.controlPoints.map((cp, i) => 
            vec2.lerp(vec2.create(), cp, targetControlPoints[i], t)
        );
        
        // Step 2: 각 셀의 최적 회전 계산
        const rotations = this.cells.map(cell => 
            this.computeOptimalRotation(cell, interpolatedCP)
        );
        
        // Step 3: 전역 최적화 (Gauss-Seidel)
        const deformedMesh = new Float32Array(sourceMesh);
        for (let iter = 0; iter < 5; iter++) {
            for (let i = 0; i < deformedMesh.length / 2; i++) {
                const vertex = this.optimizeVertex(
                    i, 
                    deformedMesh, 
                    rotations,
                    interpolatedCP
                );
                deformedMesh[i * 2] = vertex[0];
                deformedMesh[i * 2 + 1] = vertex[1];
            }
        }
        
        return deformedMesh;
    }
    
    private computeOptimalRotation(cell: Cell, controlPoints: vec2[]): mat2 {
        // SVD를 통한 최적 회전 행렬 계산
        const S = mat2.create(); // 공분산 행렬
        
        for (const edge of cell.edges) {
            const e = vec2.sub(vec2.create(), 
                controlPoints[edge.v2], 
                controlPoints[edge.v1]
            );
            const e0 = edge.restVector;
            
            // S += w * e * e0^T
            mat2.add(S, S, mat2.fromValues(
                edge.weight * e[0] * e0[0],
                edge.weight * e[0] * e0[1],
                edge.weight * e[1] * e0[0],
                edge.weight * e[1] * e0[1]
            ));
        }
        
        // SVD(S) = U * Σ * V^T
        // R = U * V^T
        return this.extractRotation(S);
    }
}
```

### RBF (Radial Basis Function) 보간
```typescript
class RBFInterpolator {
    private kernelType: 'gaussian' | 'thinPlate' | 'multiquadric';
    private epsilon: number = 1.0;
    
    interpolate(
        sourcePoints: vec2[],
        targetPoints: vec2[],
        queryPoint: vec2,
        t: number
    ): vec2 {
        // RBF 행렬 구성
        const n = sourcePoints.length;
        const Phi = new Array(n).fill(0).map(() => new Array(n));
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const r = vec2.distance(sourcePoints[i], sourcePoints[j]);
                Phi[i][j] = this.kernel(r);
            }
        }
        
        // 가중치 계산 (Φw = y)
        const weights = this.solveLinearSystem(Phi, targetPoints);
        
        // 쿼리 포인트에서 보간
        let result = vec2.create();
        for (let i = 0; i < n; i++) {
            const r = vec2.distance(queryPoint, sourcePoints[i]);
            const phi = this.kernel(r);
            vec2.scaleAndAdd(result, result, weights[i], phi * t);
        }
        
        // 원본과 블렌딩
        return vec2.lerp(vec2.create(), queryPoint, result, t);
    }
    
    private kernel(r: number): number {
        switch (this.kernelType) {
            case 'gaussian':
                return Math.exp(-(this.epsilon * r) ** 2);
            case 'thinPlate':
                return r === 0 ? 0 : r * r * Math.log(r);
            case 'multiquadric':
                return Math.sqrt(1 + (this.epsilon * r) ** 2);
        }
    }
}
```

## 🎨 커스터마이징 UI 구현

### 드래그 앤 드롭 시스템
```typescript
class CustomizationUI {
    private draggedLayer: Layer | null = null;
    private colorPicker: HTMLInputElement;
    
    constructor(private renderSystem: Render2D5System) {
        this.setupDragDrop();
        this.setupColorPicker();
        this.setupLayerControls();
    }
    
    private setupDragDrop() {
        const dropZone = document.getElementById('layer-drop-zone');
        
        dropZone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone?.addEventListener('drop', async (e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer?.files || []);
            
            for (const file of files) {
                if (file.type.startsWith('image/')) {
                    const layer = await this.processImageFile(file);
                    this.renderSystem.addLayer(layer);
                }
            }
            
            dropZone.classList.remove('drag-over');
        });
    }
    
    private async processImageFile(file: File): Promise<Layer> {
        const bitmap = await createImageBitmap(file);
        
        // 자동 메쉬 생성 (간단한 quad)
        const mesh = new Float32Array([
            -1, -1,  1, -1,  1, 1,
            -1, -1,  1, 1,  -1, 1
        ]);
        
        const uv = new Float32Array([
            0, 1,  1, 1,  1, 0,
            0, 1,  1, 0,  0, 0
        ]);
        
        return {
            id: `custom_${Date.now()}`,
            texture: bitmap,
            mesh,
            uv,
            zIndex: this.renderSystem.getLayerCount()
        };
    }
}
```

## 📱 모바일 최적화 전략

### 적응형 품질 시스템
```typescript
class AdaptiveQuality {
    private qualityLevels = {
        low: { textureSize: 256, meshDensity: 0.3, fps: 30 },
        medium: { textureSize: 512, meshDensity: 0.6, fps: 30 },
        high: { textureSize: 1024, meshDensity: 1.0, fps: 60 },
        ultra: { textureSize: 2048, meshDensity: 1.0, fps: 60 }
    };
    
    private currentQuality: keyof typeof this.qualityLevels = 'medium';
    private frameTimeHistory: number[] = [];
    
    autoAdjust() {
        const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) 
                           / this.frameTimeHistory.length;
        
        const targetFrameTime = 1000 / this.qualityLevels[this.currentQuality].fps;
        
        if (avgFrameTime > targetFrameTime * 1.2) {
            // 품질 낮추기
            this.decreaseQuality();
        } else if (avgFrameTime < targetFrameTime * 0.7) {
            // 품질 높이기
            this.increaseQuality();
        }
    }
    
    private getDeviceProfile(): 'mobile' | 'tablet' | 'desktop' {
        const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
        const screenSize = Math.min(window.screen.width, window.screen.height);
        
        if (!isMobile) return 'desktop';
        if (screenSize < 768) return 'mobile';
        return 'tablet';
    }
}
```

## 🚀 배포 및 번들링

### Vite 설정
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        glsl(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,jpg,json,wasm}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1년
                            }
                        }
                    }
                ]
            }
        })
    ],
    build: {
        target: 'es2020',
        rollupOptions: {
            output: {
                manualChunks: {
                    'math': ['gl-matrix'],
                    'ui': ['hammerjs']
                }
            }
        }
    },
    optimizeDeps: {
        include: ['gl-matrix', 'hammerjs']
    }
});
```

## 📊 성능 모니터링

### 실시간 성능 대시보드
```typescript
class PerformanceMonitor {
    private stats = {
        fps: 0,
        frameTime: 0,
        drawCalls: 0,
        triangles: 0,
        textureMemory: 0,
        jsHeapUsed: 0
    };
    
    private gui: HTMLElement;
    
    constructor() {
        this.createGUI();
        this.startMonitoring();
    }
    
    private createGUI() {
        this.gui = document.createElement('div');
        this.gui.style.cssText = `
            position: fixed;
            top: 0;
            right: 0;
            background: rgba(0,0,0,0.8);
            color: #0f0;
            font-family: monospace;
            padding: 10px;
            font-size: 12px;
            z-index: 10000;
        `;
        document.body.appendChild(this.gui);
    }
    
    private startMonitoring() {
        let lastTime = performance.now();
        let frames = 0;
        
        const update = () => {
            const now = performance.now();
            frames++;
            
            if (now >= lastTime + 1000) {
                this.stats.fps = Math.round((frames * 1000) / (now - lastTime));
                this.stats.jsHeapUsed = Math.round(
                    (performance as any).memory?.usedJSHeapSize / 1048576
                ) || 0;
                
                this.updateGUI();
                
                frames = 0;
                lastTime = now;
            }
            
            requestAnimationFrame(update);
        };
        
        update();
    }
    
    private updateGUI() {
        this.gui.innerHTML = `
            FPS: ${this.stats.fps}<br>
            Frame: ${this.stats.frameTime.toFixed(2)}ms<br>
            Draw Calls: ${this.stats.drawCalls}<br>
            Triangles: ${this.stats.triangles}<br>
            Texture: ${this.stats.textureMemory}MB<br>
            JS Heap: ${this.stats.jsHeapUsed}MB
        `;
    }
}
```

## 📝 테스트 전략

### 단위 테스트
```typescript
// interpolator.test.ts
describe('LinearInterpolator', () => {
    it('should interpolate mesh vertices correctly', () => {
        const interpolator = new LinearInterpolator();
        const mesh1 = new Float32Array([0, 0, 1, 0]);
        const mesh2 = new Float32Array([1, 1, 2, 1]);
        
        const result = interpolator.interpolateMesh(mesh1, mesh2, 0.5);
        
        expect(result).toEqual(new Float32Array([0.5, 0.5, 1.5, 0.5]));
    });
});
```

### E2E 테스트
```typescript
// e2e/render.spec.ts
import { test, expect } from '@playwright/test';

test('should render at target angle', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // 45도 회전
    await page.evaluate(() => {
        window.renderSystem.setTargetAngle(45);
    });
    
    await page.waitForTimeout(100);
    
    // 스크린샷 비교
    await expect(page).toHaveScreenshot('angle-45.png');
});
```

## 🎯 체크리스트

### MVP 완성 기준
- [ ] 4방향 키뷰 로딩 가능
- [ ] 0-360도 회전 지원
- [ ] 30fps 이상 렌더링
- [ ] 기본 파츠 분리
- [ ] 선형 보간 구현
- [ ] Z-순서 기본 처리

### 프로덕션 준비
- [ ] 60fps 안정적 유지
- [ ] 모바일 지원
- [ ] 오류 처리
- [ ] 로딩 상태 표시
- [ ] 프로그레시브 로딩
- [ ] 캐싱 전략

### 품질 보증
- [ ] 단위 테스트 커버리지 80%
- [ ] E2E 테스트 시나리오
- [ ] 성능 벤치마크
- [ ] 접근성 검증
- [ ] 보안 감사