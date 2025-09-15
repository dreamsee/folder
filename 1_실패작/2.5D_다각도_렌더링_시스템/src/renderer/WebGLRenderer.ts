export class WebGLRenderer {
    private gl: WebGL2RenderingContext;
    private program: WebGLProgram;
    private vao: WebGLVertexArrayObject | null = null;
    
    private positionBuffer: WebGLBuffer | null = null;
    private uvBuffer: WebGLBuffer | null = null;
    private indexBuffer: WebGLBuffer | null = null;
    
    private uniforms: {
        matrix: WebGLUniformLocation | null;
        color: WebGLUniformLocation | null;
        useTexture: WebGLUniformLocation | null;
        texture: WebGLUniformLocation | null;
        blendFactor: WebGLUniformLocation | null;
    };
    
    private drawCalls: number = 0;
    private renderMode: 'wireframe' | 'textured' | 'combined' = 'textured';

    constructor(canvas: HTMLCanvasElement) {
        const gl = canvas.getContext('webgl2', {
            alpha: true,
            antialias: true,
            premultipliedAlpha: false
        });

        if (!gl) {
            throw new Error('WebGL2 not supported');
        }

        this.gl = gl;
        
        // Canvas 크기 설정
        this.resizeCanvas(canvas);
        
        // WebGL 초기 설정
        this.setupWebGL();
        
        // 셰이더 프로그램 생성
        this.program = this.createShaderProgram();
        
        // 유니폼 위치 가져오기
        this.uniforms = {
            matrix: this.gl.getUniformLocation(this.program, 'u_matrix'),
            color: this.gl.getUniformLocation(this.program, 'u_color'),
            useTexture: this.gl.getUniformLocation(this.program, 'u_useTexture'),
            texture: this.gl.getUniformLocation(this.program, 'u_texture'),
            blendFactor: this.gl.getUniformLocation(this.program, 'u_blendFactor')
        };
        
        // 버퍼 초기화
        this.initBuffers();
    }

    private resizeCanvas(canvas: HTMLCanvasElement) {
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;

        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            this.gl.viewport(0, 0, displayWidth, displayHeight);
        }
    }

    private setupWebGL() {
        const gl = this.gl;
        
        // 블렌딩 설정
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        // 깊이 테스트 비활성화 (2D 렌더링)
        gl.disable(gl.DEPTH_TEST);
        
        // 배경색 설정
        gl.clearColor(0.95, 0.95, 0.95, 1.0);
    }

    private createShaderProgram(): WebGLProgram {
        const vertexShaderSource = `#version 300 es
            in vec2 a_position;
            in vec2 a_texCoord;
            
            uniform mat3 u_matrix;
            
            out vec2 v_texCoord;
            
            void main() {
                vec3 position = u_matrix * vec3(a_position, 1.0);
                gl_Position = vec4(position.xy, 0.0, 1.0);
                v_texCoord = a_texCoord;
            }
        `;

        const fragmentShaderSource = `#version 300 es
            precision highp float;
            
            in vec2 v_texCoord;
            
            uniform vec4 u_color;
            uniform bool u_useTexture;
            uniform sampler2D u_texture;
            uniform float u_blendFactor;
            
            out vec4 fragColor;
            
            void main() {
                if (u_useTexture) {
                    vec4 texColor = texture(u_texture, v_texCoord);
                    fragColor = mix(u_color, texColor, u_blendFactor);
                } else {
                    fragColor = u_color;
                }
            }
        `;

        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

        const program = this.gl.createProgram();
        if (!program) throw new Error('Failed to create program');

        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const error = this.gl.getProgramInfoLog(program);
            throw new Error('Program link failed: ' + error);
        }

        return program;
    }

    private compileShader(type: number, source: string): WebGLShader {
        const shader = this.gl.createShader(type);
        if (!shader) throw new Error('Failed to create shader');

        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const error = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error('Shader compilation failed: ' + error);
        }

        return shader;
    }

    private initBuffers() {
        // VAO 생성
        this.vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.vao);

        // 위치 버퍼
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        
        const positionLoc = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.enableVertexAttribArray(positionLoc);
        this.gl.vertexAttribPointer(positionLoc, 2, this.gl.FLOAT, false, 0, 0);

        // UV 버퍼
        this.uvBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.uvBuffer);
        
        const uvLoc = this.gl.getAttribLocation(this.program, 'a_texCoord');
        this.gl.enableVertexAttribArray(uvLoc);
        this.gl.vertexAttribPointer(uvLoc, 2, this.gl.FLOAT, false, 0, 0);

        // 인덱스 버퍼
        this.indexBuffer = this.gl.createBuffer();
        
        // VAO 해제
        this.gl.bindVertexArray(null);
    }

    public render(interpolatedView: any) {
        const gl = this.gl;
        
        // 화면 클리어
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // 프로그램 사용
        gl.useProgram(this.program);
        
        // VAO 바인딩
        gl.bindVertexArray(this.vao);
        
        this.drawCalls = 0;

        // 각 레이어 렌더링
        for (const layer of interpolatedView.layers) {
            this.renderLayer(layer);
            this.drawCalls++;
        }

        // VAO 해제
        gl.bindVertexArray(null);
    }

    private renderLayer(layer: any) {
        const gl = this.gl;

        // 버텍스 데이터 업로드
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, layer.vertices || layer.mesh, gl.DYNAMIC_DRAW);

        // UV 데이터 업로드
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, layer.uvs || new Float32Array([0,0, 1,0, 1,1, 0,1]), gl.DYNAMIC_DRAW);

        // 인덱스 데이터
        const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        // 변환 행렬 설정 (단위 행렬)
        const matrix = new Float32Array([
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ]);
        gl.uniformMatrix3fv(this.uniforms.matrix, false, matrix);

        // 색상 설정
        const color = layer.color || [1, 1, 1, 1];
        gl.uniform4fv(this.uniforms.color, color);

        // 텍스처 처리
        let useTexture = false;
        if (layer.texture || layer.texture1) {
            const texture = this.createTextureFromBitmap(layer.texture || layer.texture1);
            if (texture) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.uniform1i(this.uniforms.texture, 0);
                useTexture = true;
            }
        }
        
        gl.uniform1i(this.uniforms.useTexture, useTexture ? 1 : 0);
        gl.uniform1f(this.uniforms.blendFactor, layer.blendFactor || (useTexture ? 1.0 : 0.0));

        // 렌더링 모드에 따른 그리기
        if (this.renderMode === 'wireframe') {
            gl.drawElements(gl.LINE_LOOP, 6, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        }
    }
    
    private createTextureFromBitmap(bitmap: ImageBitmap): WebGLTexture | null {
        if (!bitmap) return null;
        
        const gl = this.gl;
        const texture = gl.createTexture();
        
        if (!texture) return null;
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // ImageBitmap을 텍스처로 업로드
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
        
        // 텍스처 필터링 설정
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        
        return texture;
    }

    public setRenderMode(mode: 'wireframe' | 'textured' | 'combined') {
        this.renderMode = mode;
    }

    public getDrawCalls(): number {
        return this.drawCalls;
    }

    public dispose() {
        const gl = this.gl;
        
        if (this.vao) gl.deleteVertexArray(this.vao);
        if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
        if (this.uvBuffer) gl.deleteBuffer(this.uvBuffer);
        if (this.indexBuffer) gl.deleteBuffer(this.indexBuffer);
        if (this.program) gl.deleteProgram(this.program);
    }
}