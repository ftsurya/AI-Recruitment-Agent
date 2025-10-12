import React, { useRef, useEffect } from 'react';
import { Renderer, Transform, Program, Mesh, Plane } from 'ogl';

const vertex = `
    attribute vec2 uv;
    attribute vec3 position;
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
    }
`;

const fragment = `
    precision highp float;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec3 uColor;
    uniform float uIntensity;
    uniform float uSpeed;
    varying vec2 vUv;

    // 2D Noise based on Morgan McGuire @morgan3d
    // https://www.shadertoy.com/view/4dS3Wd
    float random (in vec2 st) {
        return fract(sin(dot(st.xy,
                             vec2(12.9898,78.233)))*
            43758.5453123);
    }

    float noise (in vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);

        // Four corners in 2D of a tile
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) +
                (c - a)* u.y * (1.0 - u.x) +
                (d - b)* u.y * u.x;
    }

    #define OCTAVES 6
    float fbm (in vec2 st) {
        float value = 0.0;
        float amplitude = .5;
        for (int i = 0; i < OCTAVES; i++) {
            value += amplitude * noise(st);
            st *= 2.;
            amplitude *= .5;
        }
        return value;
    }

    void main() {
        vec2 st = vUv;
        st.x *= uResolution.x / uResolution.y;

        vec3 color = vec3(0.0);
        float speedFactor = uTime * 0.2 * uSpeed;

        vec2 q = vec2(fbm(st + speedFactor), fbm(st + vec2(1.0)));
        vec2 r = vec2(fbm(st + q + speedFactor), fbm(st + q + vec2(1.0)));

        float f = fbm(st+r);

        color = mix(vec3(0.1, 0.0, 0.2), // Dark purple/blue base
                    uColor, // Vibrant color from props
                    clamp((f*f)*(uIntensity * 0.9), 0.0, 1.0));

        color = mix(color, vec3(0.05, 0.0, 0.1), clamp(length(q), 0.0, 1.0));
        color = mix(color, vec3(0.05, 0.0, 0.1), clamp(length(r.x), 0.0, 1.0));

        color = (f*f*f+.6*f*f+.5*f)*color;

        gl_FragColor = vec4(color, 1.0);
    }
`;

interface DarkVeilBackgroundProps {
    colorScheme?: string;
    intensity?: number;
    speed?: number;
    style?: React.CSSProperties;
}

const DarkVeilBackground: React.FC<DarkVeilBackgroundProps> = ({
    colorScheme = '#6a0dad', // Vibrant purple
    intensity = 4.0,
    speed = 0.5,
    style,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const renderer = new Renderer({ canvas: canvasRef.current, dpr: Math.min(window.devicePixelRatio, 2) });
        const gl = renderer.gl;
        
        const scene = new Transform();
        const geometry = new Plane(gl, { width: 2, height: 2 });
        
        // Convert hex to RGB vec3
        const colorVec = [0.0, 0.0, 0.0];
        if (/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.test(colorScheme)) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorScheme);
            if (result) {
                colorVec[0] = parseInt(result[1], 16) / 255;
                colorVec[1] = parseInt(result[2], 16) / 255;
                colorVec[2] = parseInt(result[3], 16) / 255;
            }
        }

        const program = new Program(gl, {
            vertex,
            fragment,
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: [gl.canvas.width, gl.canvas.height] },
                uColor: { value: colorVec },
                uIntensity: { value: intensity },
                uSpeed: { value: speed },
            },
        });

        const mesh = new Mesh(gl, { geometry, program });
        mesh.setParent(scene);

        function resize() {
            renderer.setSize(window.innerWidth, window.innerHeight);
            program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
        }
        window.addEventListener('resize', resize, false);
        resize();

        let animationFrameId: number;
        function update(t: number) {
            program.uniforms.uTime.value = t * 0.001;
            renderer.render({ scene });
            animationFrameId = requestAnimationFrame(update);
        }
        animationFrameId = requestAnimationFrame(update);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resize);
            try {
                mesh.geometry.remove();
                program.remove();
            } catch (e) {
                console.error("Error cleaning up WebGL resources:", e);
            }
        };
    }, [colorScheme, intensity, speed]);

    const defaultStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
    };

    return <canvas ref={canvasRef} style={{...defaultStyle, ...style}} />;
};

export default DarkVeilBackground;