export class UIController {
    private system: any;
    private isDragging: boolean = false;
    private lastMouseX: number = 0;
    private dragSensitivity: number = 0.5;
    private addToCurrentOnly: boolean = true; // 기본값: 현재 각도에만 추가
    
    constructor(system: any) {
        this.system = system;
    }
    
    initialize() {
        this.setupAngleSlider();
        this.setupQualitySlider();
        this.setupRenderModeButtons();
        this.setupAnimationControls();
        this.setupCanvasInteraction();
        this.setupImageControls();
        this.setupDragDrop();
        this.setupLayerList();
    }
    
    private setupAngleSlider() {
        const slider = document.getElementById('angleSlider') as HTMLInputElement;
        const valueDisplay = document.getElementById('angleValue');
        
        if (slider && valueDisplay) {
            slider.addEventListener('input', (e) => {
                const angle = parseFloat((e.target as HTMLInputElement).value);
                this.system.setAngle(angle);
                valueDisplay.textContent = `${angle}°`;
                this.updateCurrentViewAngle(angle);
            });
        }
    }
    
    private setupQualitySlider() {
        const slider = document.getElementById('qualitySlider') as HTMLInputElement;
        const valueDisplay = document.getElementById('qualityValue');
        
        if (slider && valueDisplay) {
            slider.addEventListener('input', (e) => {
                const quality = parseFloat((e.target as HTMLInputElement).value);
                valueDisplay.textContent = quality.toFixed(1);
                // 품질 설정 적용
                if (this.system.interpolator) {
                    this.system.interpolator.setGammaCorrection(quality * 2.2);
                }
            });
        }
    }
    
    private setupRenderModeButtons() {
        const wireframeBtn = document.getElementById('modeWireframe');
        const texturedBtn = document.getElementById('modeTextured');
        const combinedBtn = document.getElementById('modeCombined');
        
        if (wireframeBtn) {
            wireframeBtn.addEventListener('click', () => {
                this.system.getRenderer().setRenderMode('wireframe');
                this.system.render();
            });
        }
        
        if (texturedBtn) {
            texturedBtn.addEventListener('click', () => {
                this.system.getRenderer().setRenderMode('textured');
                this.system.render();
            });
        }
        
        if (combinedBtn) {
            combinedBtn.addEventListener('click', () => {
                this.system.getRenderer().setRenderMode('combined');
                this.system.render();
            });
        }
    }
    
    private setupAnimationControls() {
        const playBtn = document.getElementById('animPlay');
        const pauseBtn = document.getElementById('animPause');
        const resetBtn = document.getElementById('animReset');
        
        const animController = this.system.getAnimationController();
        
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                animController.play();
            });
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                animController.pause();
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                animController.reset();
                const slider = document.getElementById('angleSlider') as HTMLInputElement;
                if (slider) slider.value = '0';
                const valueDisplay = document.getElementById('angleValue');
                if (valueDisplay) valueDisplay.textContent = '0°';
            });
        }
    }
    
    private setupImageControls() {
        const currentBtn = document.getElementById('addToCurrentView');
        const allBtn = document.getElementById('addToAllViews');
        
        if (currentBtn) {
            currentBtn.addEventListener('click', () => {
                this.addToCurrentOnly = true;
                currentBtn.style.background = '#667eea';
                if (allBtn) allBtn.style.background = '#ccc';
                console.log('모드: 현재 각도에만 추가');
            });
        }
        
        if (allBtn) {
            allBtn.addEventListener('click', () => {
                this.addToCurrentOnly = false;
                allBtn.style.background = '#667eea';
                if (currentBtn) currentBtn.style.background = '#ccc';
                console.log('모드: 모든 각도에 추가');
            });
        }
        
        // 초기 상태 설정
        if (currentBtn) currentBtn.style.background = '#667eea';
        if (allBtn) allBtn.style.background = '#ccc';
    }
    
    private updateCurrentViewAngle(angle: number) {
        const angleDisplay = document.getElementById('currentViewAngle');
        if (angleDisplay) {
            const nearestAngle = this.findNearestKeyViewAngle(angle);
            angleDisplay.textContent = `${Math.round(angle)}° (키뷰: ${nearestAngle}°)`;
        }
    }
    
    private setupCanvasInteraction() {
        const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
        
        if (!canvas) return;
        
        // 마우스 드래그로 회전
        canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            canvas.style.cursor = 'grabbing';
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const deltaX = e.clientX - this.lastMouseX;
            const currentAngle = this.system.getAngle();
            const newAngle = currentAngle + (deltaX * this.dragSensitivity);
            
            this.system.setAngle(newAngle);
            
            // 슬라이더 업데이트
            const slider = document.getElementById('angleSlider') as HTMLInputElement;
            if (slider) slider.value = String(newAngle % 360);
            const valueDisplay = document.getElementById('angleValue');
            if (valueDisplay) valueDisplay.textContent = `${Math.round(newAngle % 360)}°`;
            
            this.lastMouseX = e.clientX;
        });
        
        canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            canvas.style.cursor = 'grab';
        });
        
        canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            canvas.style.cursor = 'grab';
        });
        
        // 터치 지원
        let touchStartX = 0;
        
        canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touchX = e.touches[0].clientX;
            const deltaX = touchX - touchStartX;
            
            const currentAngle = this.system.getAngle();
            const newAngle = currentAngle + (deltaX * this.dragSensitivity);
            
            this.system.setAngle(newAngle);
            
            // 슬라이더 업데이트
            const slider = document.getElementById('angleSlider') as HTMLInputElement;
            if (slider) slider.value = String(newAngle % 360);
            const valueDisplay = document.getElementById('angleValue');
            if (valueDisplay) valueDisplay.textContent = `${Math.round(newAngle % 360)}°`;
            
            touchStartX = touchX;
        });
    }
    
    private setupDragDrop() {
        const dropZone = document.getElementById('dropZone');
        
        if (!dropZone) {
            console.error('Drop zone element not found!');
            return;
        }
        
        console.log('Drop zone setup complete');
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            console.log('Files dropped!', e.dataTransfer?.files);
            const files = Array.from(e.dataTransfer?.files || []);
            console.log('Processing files:', files.map(f => f.name));
            
            for (const file of files) {
                if (file.type.startsWith('image/')) {
                    try {
                        // 이미지를 레이어로 추가
                        console.log('Adding image layer:', file.name);
                        await this.addImageAsLayer(file);
                        dropZone.innerHTML = `✅ "${file.name}" 추가됨<br>더 많은 이미지를 드래그하세요`;
                        setTimeout(() => {
                            dropZone.innerHTML = '이미지를 드래그하여 추가';
                        }, 2000);
                    } catch (error) {
                        console.error('이미지 추가 실패:', error);
                        dropZone.innerHTML = `❌ 추가 실패: ${error.message}`;
                        setTimeout(() => {
                            dropZone.innerHTML = '이미지를 드래그하여 추가';
                        }, 2000);
                    }
                } else if (file.type === 'application/json') {
                    try {
                        // JSON 키뷰 파일 로드
                        console.log('Loading keyview:', file.name);
                        await this.loadKeyViewFile(file);
                        dropZone.innerHTML = `✅ 키뷰 "${file.name}" 로드됨`;
                        setTimeout(() => {
                            dropZone.innerHTML = '이미지를 드래그하여 추가';
                        }, 2000);
                    } catch (error) {
                        console.error('키뷰 로드 실패:', error);
                        dropZone.innerHTML = `❌ 로드 실패: ${error.message}`;
                        setTimeout(() => {
                            dropZone.innerHTML = '이미지를 드래그하여 추가';
                        }, 2000);
                    }
                }
            }
        });
    }
    
    private setupLayerList() {
        this.updateLayerList();
    }
    
    public updateLayerList() {
        const layerList = document.getElementById('layerList');
        if (!layerList) return;
        
        // 현재 레이어 목록 표시
        layerList.innerHTML = `
            <div class="layer-item">
                <input type="checkbox" class="layer-visibility" checked>
                <span>Body</span>
            </div>
            <div class="layer-item">
                <input type="checkbox" class="layer-visibility" checked>
                <span>Head</span>
            </div>
        `;
    }
    
    private async addImageAsLayer(file: File) {
        try {
            // KeyViewLoader를 통해 이미지를 레이어로 변환
            const layer = await this.system.loader.loadImageAsLayer(file, `custom_${Date.now()}`);
            
            if (this.addToCurrentOnly) {
                // 현재 보고 있는 각도에만 추가
                const currentAngle = Math.round(this.system.getAngle()) % 360;
                const targetAngle = this.findNearestKeyViewAngle(currentAngle);
                
                console.log(`이미지를 ${targetAngle}도 키뷰에만 추가`);
                
                const keyView = this.system.keyViews.get(targetAngle);
                if (keyView) {
                    // 랜덤한 위치에 추가 (겹치지 않도록)
                    const randomOffset = (Math.random() - 0.5) * 0.4;
                    const scaledLayer = {
                        ...layer,
                        id: `${layer.id}_${targetAngle}`,
                        vertices: this.offsetVertices(layer.vertices, randomOffset, 0, 0.4), // 크기 조정
                        zIndex: keyView.layers.length
                    };
                    
                    keyView.layers.push(scaledLayer);
                    console.log(`레이어 추가됨: ${scaledLayer.id}, 총 레이어 수: ${keyView.layers.length}`);
                }
            } else {
                // 모든 키뷰에 추가
                console.log('이미지를 모든 키뷰에 추가');
                
                for (const [angle, keyView] of this.system.keyViews) {
                    // 각 키뷰마다 약간씩 다른 위치에 추가
                    const randomOffset = (Math.random() - 0.5) * 0.3;
                    const scaledLayer = {
                        ...layer,
                        id: `${layer.id}_${angle}`,
                        vertices: this.offsetVertices(layer.vertices, randomOffset, 0, 0.4),
                        zIndex: keyView.layers.length
                    };
                    
                    keyView.layers.push(scaledLayer);
                    console.log(`레이어 추가됨 (${angle}도): ${scaledLayer.id}`);
                }
            }
            
            // 즉시 렌더링
            this.system.render();
            
            // 레이어 목록 업데이트
            this.updateLayerList();
            
            console.log('이미지 레이어 추가 성공:', file.name);
            
        } catch (error) {
            console.error('이미지 레이어 추가 실패:', error);
            throw error;
        }
    }
    
    private findNearestKeyViewAngle(angle: number): number {
        const keyViewAngles = [0, 90, 180, 270];
        let nearest = 0;
        let minDiff = Math.abs(angle - 0);
        
        for (const kvAngle of keyViewAngles) {
            const diff = Math.abs(angle - kvAngle);
            if (diff < minDiff) {
                minDiff = diff;
                nearest = kvAngle;
            }
        }
        
        return nearest;
    }
    
    private offsetVertices(vertices: Float32Array, offsetX: number, offsetY: number, scale: number = 1): Float32Array {
        const result = new Float32Array(vertices.length);
        
        for (let i = 0; i < vertices.length; i += 2) {
            result[i] = vertices[i] * scale + offsetX;     // x
            result[i + 1] = vertices[i + 1] * scale + offsetY; // y
        }
        
        return result;
    }
    
    private async loadKeyViewFile(file: File) {
        try {
            const keyView = await this.system.loader.loadKeyViewFromFile(file);
            this.system.keyViews.set(keyView.angle, keyView);
            
            // 렌더링 업데이트
            this.system.render();
            
            console.log('키뷰 파일 로드 성공:', file.name);
            
        } catch (error) {
            console.error('키뷰 파일 로드 실패:', error);
            throw error;
        }
    }
}