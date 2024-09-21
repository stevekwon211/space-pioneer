import { useRef, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useFrame } from "@react-three/fiber";

interface PlanetProps {
    path: string;
    position: [number, number, number];
    scale: number;
    name: string;
    rotationSpeed?: number;
    onPositionChange?: (position: THREE.Vector3) => void;
}

const Planet: React.FC<PlanetProps> = ({ path, position, scale, name, rotationSpeed = 0, onPositionChange }) => {
    const planetRef = useRef<THREE.Group>(new THREE.Group());
    const holoRef = useRef<THREE.Mesh>();

    useEffect(() => {
        const loader = new GLTFLoader();
        loader.load(
            path,
            (gltf) => {
                const planetModel = gltf.scene;
                planetModel.scale.set(scale, scale, scale);
                planetModel.position.set(...position);
                planetModel.name = name;

                planetModel.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        const holoMaterial = createHoloMaterial();
                        const holoMesh = child.clone();
                        holoMesh.material = holoMaterial;
                        holoMesh.scale.multiplyScalar(1.01);
                        holoRef.current = holoMesh;
                        child.add(holoMesh);
                    }
                });

                planetRef.current.add(planetModel);
            },
            undefined,
            (error) => {
                console.error("An error occurred while loading the GLB model:", error);
            }
        );
    }, [path, position, scale, name]);

    useFrame(({ clock }) => {
        if (planetRef.current) {
            planetRef.current.rotation.y += rotationSpeed;

            if (onPositionChange) {
                onPositionChange(planetRef.current.position);
            }
        }
        if (holoRef.current) {
            (holoRef.current.material as THREE.ShaderMaterial).uniforms.time.value = clock.getElapsedTime();
        }
    });

    return <primitive object={planetRef.current} />;
};

const createHoloMaterial = () => {
    return new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(0x00ffff) },
            time: { value: 0 },
        },
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            uniform float time;
            varying vec3 vNormal;
            void main() {
                float intensity = pow(0.8 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
                gl_FragColor = vec4(color, 1.0) * intensity * (0.7 + 0.3 * sin(time * 5.0));
            }
        `,
        transparent: true,
        side: THREE.DoubleSide,
    });
};

export default Planet;
