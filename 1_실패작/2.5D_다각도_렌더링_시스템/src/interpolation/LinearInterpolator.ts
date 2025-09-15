import { KeyView, Layer } from '../core/KeyViewLoader';

export interface InterpolatedView {
    layers: InterpolatedLayer[];
}

export interface InterpolatedLayer {
    id: string;
    vertices: Float32Array;
    mesh?: Float32Array;
    uvs: Float32Array;
    texture1?: ImageBitmap | null;
    texture2?: ImageBitmap | null;
    color?: number[];
    blendFactor: number;
    zIndex: number;
}

export class LinearInterpolator {
    private gammaCorrection: number = 2.2;
    
    interpolate(keyView1: KeyView, keyView2: KeyView, t: number): InterpolatedView {
        // 감마 보정 적용
        const correctedT = this.applyGammaCorrection(t);
        
        const interpolatedLayers: InterpolatedLayer[] = [];
        
        // 각 레이어 보간
        for (let i = 0; i < keyView1.layers.length; i++) {
            const layer1 = keyView1.layers[i];
            const layer2 = keyView2.layers.find(l => l.id === layer1.id);
            
            if (!layer2) {
                // 매칭되는 레이어가 없으면 페이드 아웃
                interpolatedLayers.push(this.createFadeLayer(layer1, 1 - t));
                continue;
            }
            
            // 버텍스 보간
            const interpolatedVertices = this.interpolateVertices(
                layer1.vertices, 
                layer2.vertices, 
                correctedT
            );
            
            // UV 보간 (일반적으로 동일하지만 혹시 다를 경우 대비)
            const interpolatedUVs = this.interpolateVertices(
                layer1.uvs,
                layer2.uvs,
                correctedT
            );
            
            // 색상 보간
            const interpolatedColor = layer1.color && layer2.color
                ? this.interpolateColor(layer1.color, layer2.color, correctedT)
                : layer1.color || layer2.color;
            
            // Z-인덱스 보간 (반올림)
            const interpolatedZIndex = Math.round(
                this.lerp(layer1.zIndex, layer2.zIndex, t)
            );
            
            interpolatedLayers.push({
                id: layer1.id,
                vertices: interpolatedVertices,
                mesh: interpolatedVertices,
                uvs: interpolatedUVs,
                texture1: layer1.texture,
                texture2: layer2.texture,
                color: interpolatedColor,
                blendFactor: correctedT,
                zIndex: interpolatedZIndex
            });
        }
        
        // layer2에만 있는 레이어 처리 (페이드 인)
        for (const layer2 of keyView2.layers) {
            if (!keyView1.layers.find(l => l.id === layer2.id)) {
                interpolatedLayers.push(this.createFadeLayer(layer2, t));
            }
        }
        
        // Z-인덱스로 정렬
        interpolatedLayers.sort((a, b) => a.zIndex - b.zIndex);
        
        return { layers: interpolatedLayers };
    }
    
    private interpolateVertices(
        vertices1: Float32Array, 
        vertices2: Float32Array, 
        t: number
    ): Float32Array {
        const length = Math.min(vertices1.length, vertices2.length);
        const result = new Float32Array(length);
        
        for (let i = 0; i < length; i++) {
            result[i] = this.lerp(vertices1[i], vertices2[i], t);
        }
        
        return result;
    }
    
    private interpolateColor(
        color1: number[], 
        color2: number[], 
        t: number
    ): number[] {
        return [
            this.lerp(color1[0], color2[0], t),
            this.lerp(color1[1], color2[1], t),
            this.lerp(color1[2], color2[2], t),
            this.lerp(color1[3] || 1, color2[3] || 1, t)
        ];
    }
    
    private createFadeLayer(layer: Layer, alpha: number): InterpolatedLayer {
        return {
            id: layer.id,
            vertices: layer.vertices,
            mesh: layer.vertices,
            uvs: layer.uvs,
            texture1: layer.texture,
            texture2: null,
            color: layer.color ? [...layer.color.slice(0, 3), layer.color[3] * alpha] : [1, 1, 1, alpha],
            blendFactor: 0,
            zIndex: layer.zIndex
        };
    }
    
    private lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }
    
    private applyGammaCorrection(t: number): number {
        // 감마 보정으로 더 자연스러운 보간
        return Math.pow(t, 1 / this.gammaCorrection);
    }
    
    public setGammaCorrection(gamma: number) {
        this.gammaCorrection = Math.max(0.1, Math.min(10, gamma));
    }
    
    public getGammaCorrection(): number {
        return this.gammaCorrection;
    }
}