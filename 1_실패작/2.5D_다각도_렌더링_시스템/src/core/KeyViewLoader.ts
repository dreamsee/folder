export interface Layer {
    id: string;
    vertices: Float32Array;
    uvs: Float32Array;
    texture?: ImageBitmap | null;
    color?: number[];
    zIndex: number;
    controlPoints?: Array<[number, number]>;
}

export interface KeyView {
    angle: number;
    layers: Layer[];
}

export class KeyViewLoader {
    private cache: Map<string, KeyView> = new Map();
    
    async loadKeyView(url: string): Promise<KeyView> {
        // 캐시 확인
        if (this.cache.has(url)) {
            return this.cache.get(url)!;
        }

        try {
            // JSON 데이터 로드
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load keyview: ${response.statusText}`);
            }

            const data = await response.json();
            
            // 레이어 처리
            const layers = await Promise.all(data.layers.map(async (layerData: any) => {
                const layer: Layer = {
                    id: layerData.id,
                    vertices: new Float32Array(layerData.vertices || layerData.mesh),
                    uvs: new Float32Array(layerData.uvs || layerData.uv),
                    zIndex: layerData.zIndex || 0,
                    color: layerData.color,
                    controlPoints: layerData.controlPoints
                };

                // 텍스처 로드
                if (layerData.textureUrl) {
                    try {
                        const textureResponse = await fetch(layerData.textureUrl);
                        const blob = await textureResponse.blob();
                        layer.texture = await createImageBitmap(blob);
                    } catch (error) {
                        console.warn(`Failed to load texture for layer ${layer.id}:`, error);
                    }
                }

                return layer;
            }));

            const keyView: KeyView = {
                angle: data.angle,
                layers: layers.sort((a, b) => a.zIndex - b.zIndex)
            };

            // 캐시에 저장
            this.cache.set(url, keyView);
            
            return keyView;
            
        } catch (error) {
            console.error('Error loading keyview:', error);
            throw error;
        }
    }

    async loadKeyViewFromFile(file: File): Promise<KeyView> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target?.result as string);
                    
                    // 파일에서 직접 로드한 경우 텍스처 처리를 다르게
                    const layers = data.layers.map((layerData: any) => ({
                        id: layerData.id,
                        vertices: new Float32Array(layerData.vertices || layerData.mesh),
                        uvs: new Float32Array(layerData.uvs || layerData.uv),
                        zIndex: layerData.zIndex || 0,
                        color: layerData.color,
                        controlPoints: layerData.controlPoints,
                        texture: null
                    }));

                    resolve({
                        angle: data.angle,
                        layers
                    });
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    async loadImageAsLayer(file: File, layerId: string = 'custom'): Promise<Layer> {
        const bitmap = await createImageBitmap(file);
        
        // 이미지 크기에 맞춰 quad 생성
        const aspectRatio = bitmap.width / bitmap.height;
        const size = 0.5;
        
        const vertices = new Float32Array([
            -size * aspectRatio, -size,
             size * aspectRatio, -size,
             size * aspectRatio,  size,
            -size * aspectRatio,  size
        ]);
        
        const uvs = new Float32Array([
            0, 1,
            1, 1,
            1, 0,
            0, 0
        ]);
        
        return {
            id: layerId,
            vertices,
            uvs,
            texture: bitmap,
            zIndex: 0
        };
    }

    clearCache() {
        // 텍스처 메모리 해제
        for (const keyView of this.cache.values()) {
            for (const layer of keyView.layers) {
                if (layer.texture) {
                    // ImageBitmap은 자동으로 가비지 컬렉션됨
                    layer.texture = null;
                }
            }
        }
        
        this.cache.clear();
    }

    getCacheSize(): number {
        return this.cache.size;
    }
}