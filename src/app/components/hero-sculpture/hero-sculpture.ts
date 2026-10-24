import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
/**
 * Kis méretű, függőségmentes WebGL-objektum a főoldalhoz.
 * A dekoráció nem blokkolhatja a főoldalt WebGL-támogatás hiányában sem.
 */
@Component({
    selector: 'app-hero-sculpture',
    standalone: true,
    templateUrl: './hero-sculpture.html',
    styleUrl: './hero-sculpture.scss'
})
export class HeroSculpture implements AfterViewInit, OnDestroy {
    @ViewChild('sceneCanvas', { static: true })
    private canvas!: ElementRef<HTMLCanvasElement>;
    private gl: WebGLRenderingContext | null = null;
    private frame = 0;
    private resizeObserver?: ResizeObserver;
    private visibilityObserver?: IntersectionObserver;
    private visible = true;
    private reducedMotion = false;
    private startTime = 0;
    private program: WebGLProgram | null = null;
    private indexCount = 0;
    private pointer = { x: 0, y: 0 };
    private pointerTarget = { x: 0, y: 0 };
    private uniforms: {
        angle: WebGLUniformLocation | null;
        aspect: WebGLUniformLocation | null;
        pointer: WebGLUniformLocation | null;
    } | null = null;
    setPointer(x: number, y: number): void {
        if (this.reducedMotion) return;
        this.pointerTarget = { x, y };
    }
    ngAfterViewInit(): void {
        const canvas = this.canvas.nativeElement;
        const gl = canvas.getContext('webgl', {
            alpha: true,
            antialias: true,
            depth: true,
            premultipliedAlpha: false
        });
        if (!gl) {
            return;
        }
        this.gl = gl;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        try {
            this.initialize(gl);
        }
        catch {
            this.gl = null;
            return;
        }
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(canvas);
        this.visibilityObserver = new IntersectionObserver(entries => {
            this.visible = entries[0]?.isIntersecting ?? false;
            if (this.visible) {
                this.requestFrame();
            }
            else {
                cancelAnimationFrame(this.frame);
                this.frame = 0;
            }
        });
        this.visibilityObserver.observe(canvas);
        document.addEventListener('visibilitychange', this.onPageVisibility);
        this.resize();
        this.requestFrame();
    }
    ngOnDestroy(): void {
        cancelAnimationFrame(this.frame);
        document.removeEventListener('visibilitychange', this.onPageVisibility);
        this.resizeObserver?.disconnect();
        this.visibilityObserver?.disconnect();
        if (this.gl && this.program) {
            this.gl.deleteProgram(this.program);
        }
    }
    private readonly onPageVisibility = (): void => {
        if (document.hidden) {
            cancelAnimationFrame(this.frame);
            this.frame = 0;
        }
        else {
            this.requestFrame();
        }
    };
    private initialize(gl: WebGLRenderingContext): void {
        const vertexSource = `
      attribute vec3 aPosition;
      attribute vec3 aNormal;
      uniform float uAngle;
      uniform float uAspect;
      uniform vec2 uPointer;
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        float a = uAngle + uPointer.x * 0.26;
        mat3 ry = mat3(
          cos(a), 0.0, sin(a),
          0.0, 1.0, 0.0,
          -sin(a), 0.0, cos(a)
        );
        mat3 rx = mat3(
          1.0, 0.0, 0.0,
          0.0, cos(-0.32 + uPointer.y * 0.24), -sin(-0.32 + uPointer.y * 0.24),
          0.0, sin(-0.32 + uPointer.y * 0.24), cos(-0.32 + uPointer.y * 0.24)
        );

        vec3 position = rx * ry * aPosition;
        vNormal = normalize(rx * ry * aNormal);
        vPosition = position;
        float depth = 5.1 - position.z;

        gl_Position = vec4(
          position.x * 2.7 / uAspect,
          position.y * 2.7,
          depth - 0.75,
          depth
        );
      }
    `;
        const fragmentSource = `
      precision mediump float;
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vec3 n = normalize(vNormal);
        vec3 light = normalize(vec3(-0.65, 0.9, 1.0));
        vec3 viewDir = normalize(vec3(0.0, 0.0, 5.0) - vPosition);
        float diffuse = max(dot(n, light), 0.0);
        float rim = pow(1.0 - abs(dot(n, viewDir)), 3.0);
        float specular = pow(max(dot(reflect(-light, n), viewDir), 0.0), 36.0);
        float accent = 0.5 + 0.5 * n.y;

        vec3 steel = mix(vec3(0.055, 0.10, 0.21), vec3(0.30, 0.37, 0.58), diffuse);
        vec3 violet = vec3(0.42, 0.34, 0.89);
        vec3 cyan = vec3(0.22, 0.73, 0.84);
        vec3 metal = mix(steel, mix(violet, cyan, accent), 0.28 + rim * 0.55);
        metal += vec3(0.74, 0.83, 0.95) * specular * 0.72;
        metal += vec3(0.24, 0.40, 0.72) * rim * 0.45;

        gl_FragColor = vec4(metal, 0.98);
      }
    `;
        const vertexShader = this.compile(gl, gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
        const program = gl.createProgram();
        if (!program) {
            throw new Error('A WebGL-program nem hozható létre.');
        }
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(program) ?? 'WebGL kapcsolási hiba');
        }
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.useProgram(program);
        this.program = program;
        const { vertices, indices } = this.buildSculpture();
        this.indexCount = indices.length;
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        const stride = 6 * Float32Array.BYTES_PER_ELEMENT;
        const position = gl.getAttribLocation(program, 'aPosition');
        const normal = gl.getAttribLocation(program, 'aNormal');
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 3, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(normal);
        gl.vertexAttribPointer(normal, 3, gl.FLOAT, false, stride, 3 * 4);
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        gl.enable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.clearColor(0, 0, 0, 0);
        this.uniforms = {
            angle: gl.getUniformLocation(program, 'uAngle'),
            aspect: gl.getUniformLocation(program, 'uAspect'),
            pointer: gl.getUniformLocation(program, 'uPointer')
        };
    }
    private compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
        const shader = gl.createShader(type);
        if (!shader) {
            throw new Error('Shader létrehozási hiba');
        }
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader) ?? 'Shader fordítási hiba');
        }
        return shader;
    }
    /** Finom holografikus tórusz: letisztult gyűrű a Hero hátteréhez. */
    private buildSculpture(): {
        vertices: number[];
        indices: number[];
    } {
        const segments = 192;
        const sides = 24;
        const majorRadius = 1.2;
        const tubeRadius = 0.24;
        const vertices: number[] = [];
        const indices: number[] = [];
        for (let i = 0; i <= segments; i++) {
            const t = (i / segments) * Math.PI * 2;
            const ct = Math.cos(t);
            const st = Math.sin(t);
            for (let j = 0; j <= sides; j++) {
                const a = (j / sides) * Math.PI * 2;
                const ca = Math.cos(a);
                const sa = Math.sin(a);
                const radial = majorRadius + tubeRadius * ca;
                vertices.push(radial * ct, radial * st, tubeRadius * sa, ca * ct, ca * st, sa);
            }
        }
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < sides; j++) {
                const a = i * (sides + 1) + j;
                const b = a + sides + 1;
                indices.push(a, b, a + 1, b, b + 1, a + 1);
            }
        }
        return { vertices, indices };
    }
    private resize(): void {
        const gl = this.gl;
        if (!gl || !this.uniforms) {
            return;
        }
        const canvas = this.canvas.nativeElement;
        const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
        const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
        const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
        gl.uniform1f(this.uniforms.aspect, width / height);
        this.render(this.reducedMotion ? 0.22 : (performance.now() - this.startTime) * 0.00017);
    }
    private requestFrame(): void {
        if (this.frame || !this.gl || !this.visible || document.hidden) {
            return;
        }
        if (!this.startTime) {
            this.startTime = performance.now();
        }
        this.frame = requestAnimationFrame(this.animate);
    }
    private readonly animate = (time: number): void => {
        this.frame = 0;
        this.render(this.reducedMotion ? 0.22 : (time - this.startTime) * 0.00017);
        if (!this.reducedMotion) {
            this.requestFrame();
        }
    };
    private render(angle: number): void {
        if (!this.gl || !this.uniforms) {
            return;
        }
        this.pointer.x += (this.pointerTarget.x - this.pointer.x) * .065;
        this.pointer.y += (this.pointerTarget.y - this.pointer.y) * .065;
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.uniform1f(this.uniforms.angle, angle);
        this.gl.uniform2f(this.uniforms.pointer, this.pointer.x, this.pointer.y);
        this.gl.drawElements(this.gl.TRIANGLES, this.indexCount, this.gl.UNSIGNED_SHORT, 0);
    }
}
