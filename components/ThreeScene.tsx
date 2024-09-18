"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface Position {
    x: number;
    y: number;
    z: number;
}

interface Rotation {
    x: number;
    y: number;
    z: number;
}

interface ThreeSceneProps {
    onPositionChange: (position: Position) => void;
    onRotationChange: (rotation: Rotation) => void;
    onStarphoreaPositionChange: (position: Position) => void; // 새로운 prop 추가
    onCameraDirectionChange: (direction: Position) => void; // 새로운 prop 추가
}

const ThreeScene: React.FC<ThreeSceneProps> = ({
    onPositionChange,
    onRotationChange,
    onStarphoreaPositionChange,
    onCameraDirectionChange,
}) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const starphoreaRef = useRef<THREE.Object3D | null>(null);
    const keysRef = useRef<{ [key: string]: boolean }>({});
    const starsRef = useRef<THREE.Points | null>(null);
    const velocityRef = useRef<THREE.Vector3>(new THREE.Vector3());
    const maxSpeedRef = useRef<number>(625); // 최대 속도를 25%로 낮춤 (2500의 25%)
    const accelerationRef = useRef<number>(12.5); // 가속도도 25%로 낮춤
    const decelerationRef = useRef<number>(6.25); // 감속도도 25%로 낮춤
    const rotationVelocityRef = useRef<THREE.Vector2>(new THREE.Vector2());
    const maxRotationSpeedRef = useRef<number>(0.01); // 최대 회전 속도
    const rotationAccelerationRef = useRef<number>(0.1); // 회전 가속도
    const rotationDecelerationRef = useRef<number>(0.1); // 회전 감속도
    const starphoreaRotationSpeedRef = useRef<number>(0.001); // Starphorea 회전 속도

    useEffect(() => {
        if (!mountRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000000);
        cameraRef.current = camera;
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000000);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const updateSize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        updateSize();
        window.addEventListener("resize", updateSize);

        mountRef.current.appendChild(renderer.domElement);

        camera.position.set(0, 0, 1000000); // 초기 카메라 위치 조정
        camera.lookAt(0, 0, 0);

        // Ambient Light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);

        // Directional Light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        // Starphorea 로드 및 설정
        const starphoreaLoader = new GLTFLoader();
        starphoreaLoader.load(
            "/Celestial_Enigma_0918053509.glb",
            (gltf) => {
                const starphoreaModel = gltf.scene;

                // 크 조정 (더 크게 만어 멀리서도 보이게)
                const scaleFactor = 5000;
                starphoreaModel.scale.set(scaleFactor, scaleFactor, scaleFactor);
                starphoreaModel.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                // 위치 설정 (예: x축으로 350000 이동)
                starphoreaModel.position.set(350000, 0, 0);
                scene.add(starphoreaModel);

                starphoreaRef.current = starphoreaModel;

                console.log("Starphorea model loaded");

                // Starphorea의 위치를 부모 컴포넌트로 전달
                onStarphoreaPositionChange({
                    x: starphoreaModel.position.x,
                    y: starphoreaModel.position.y,
                    z: starphoreaModel.position.z,
                });

                // 모델 로드 후 즉시 회전 시작
                animate();
            },
            undefined,
            (error) => {
                console.error("An error occurred while loading the GLB model:", error);
            }
        );

        // 운석 효과를 위한 별 생성
        const createStars = () => {
            const starCount = 1000; // 별의 개수
            const geometry = new THREE.BufferGeometry();
            const positions = [];
            const sizes = [];

            for (let i = 0; i < starCount; i++) {
                // 랜덤한 위치 생성 (Starphorea를 중심으로 일정 거리 이상 떨어지게)
                const distance = THREE.MathUtils.randFloat(400000, 600000); // Starphorea의 위치는 350000, 따라서 350000 ±250000 범위 설정
                const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
                const phi = THREE.MathUtils.randFloat(0, Math.PI);

                const x = distance * Math.sin(phi) * Math.cos(theta);
                const y = distance * Math.sin(phi) * Math.sin(theta);
                const z = distance * Math.cos(phi);

                positions.push(x, y, z);
                sizes.push(THREE.MathUtils.randFloat(1, 3)); // 별 크기
            }

            geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
            geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));

            const material = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 1000,
                sizeAttenuation: true,
            });

            const stars = new THREE.Points(geometry, material);
            scene.add(stars);
            starsRef.current = stars;
        };

        createStars();

        // Keyboard controls
        const onKeyDown = (event: KeyboardEvent) => {
            keysRef.current[event.code] = true;
        };
        const onKeyUp = (event: KeyboardEvent) => {
            keysRef.current[event.code] = false;
        };
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);

            // Starphorea 회전
            if (starphoreaRef.current) {
                starphoreaRef.current.rotation.y += starphoreaRotationSpeedRef.current;
            }

            // 운석(별) 애니메이션
            if (starsRef.current) {
                const positions = starsRef.current.geometry.attributes.position.array as Float32Array;
                for (let i = 0; i < positions.length; i += 3) {
                    // 별의 위치를 앞으 이동 (Z축 기준)
                    positions[i + 2] += 1000; // 속도 조절 가능

                    // Starphorea 주변을 벗어나면 다시 뒤쪽으로 이동
                    if (positions[i + 2] > 700000) {
                        const distance = THREE.MathUtils.randFloat(400000, 600000);
                        const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
                        const phi = THREE.MathUtils.randFloat(0, Math.PI);

                        positions[i] = distance * Math.sin(phi) * Math.cos(theta);
                        positions[i + 1] = distance * Math.sin(phi) * Math.sin(theta);
                        positions[i + 2] = -600000; // 뒤쪽에 다시 시작
                    }
                }
                starsRef.current.geometry.attributes.position.needsUpdate = true;
            }

            // 카메라 이동 및 회전
            if (cameraRef.current) {
                const camera = cameraRef.current;
                const moveDirection = new THREE.Vector3();
                const cameraDirection = new THREE.Vector3();
                camera.getWorldDirection(cameraDirection);

                // 이동 로직
                if (keysRef.current["KeyW"]) moveDirection.add(cameraDirection);
                if (keysRef.current["KeyS"]) moveDirection.sub(cameraDirection);
                if (keysRef.current["KeyA"])
                    moveDirection.add(cameraDirection.clone().cross(camera.up).normalize().multiplyScalar(-1));
                if (keysRef.current["KeyD"]) moveDirection.add(cameraDirection.clone().cross(camera.up).normalize());

                // 목표 속도 정규화 및 최대 속도 적용
                if (moveDirection.length() > 0) {
                    moveDirection.normalize().multiplyScalar(maxSpeedRef.current);
                }

                // 현재 속도를 목표 속도로 부드럽게 조정
                const acceleration = moveDirection.length() > 0 ? accelerationRef.current : decelerationRef.current;
                velocityRef.current.lerp(moveDirection, acceleration / 1000);

                // 속도가 매우 작으면 0으로 설정 (미세한 움직임 방지)
                if (velocityRef.current.length() < 0.1) {
                    velocityRef.current.set(0, 0, 0);
                }

                // 카메라 위치 업데이트
                camera.position.add(velocityRef.current);

                // 회전 로직 수정
                const rotationDirection = new THREE.Vector2();
                if (keysRef.current["KeyK"]) rotationDirection.x -= 1;
                if (keysRef.current["KeyL"]) rotationDirection.x += 1;
                if (keysRef.current["Semicolon"]) rotationDirection.y -= 1;
                if (keysRef.current["Quote"]) rotationDirection.y += 1;

                // 목표 회전 속도 계산
                if (rotationDirection.length() > 0) {
                    rotationDirection.normalize().multiplyScalar(maxRotationSpeedRef.current);
                }

                // 현재 회전 속도를 목표 회전 속도로 부드럽게 조정
                const rotationAcceleration =
                    rotationDirection.length() > 0 ? rotationAccelerationRef.current : rotationDecelerationRef.current;
                rotationVelocityRef.current.lerp(rotationDirection, rotationAcceleration);

                // 회전 속도가 매우 작으면 0으로 설정 (미세한 회전 방지)
                if (rotationVelocityRef.current.length() < 0.0001) {
                    rotationVelocityRef.current.set(0, 0);
                }

                // 카메라 회전 적용
                camera.rotateX(rotationVelocityRef.current.x);
                camera.rotateY(rotationVelocityRef.current.y);

                // Update position, rotation, and camera direction
                onPositionChange({
                    x: camera.position.x,
                    y: camera.position.y,
                    z: camera.position.z,
                });
                onRotationChange({
                    x: camera.rotation.x,
                    y: camera.rotation.y,
                    z: camera.rotation.z,
                });

                // 카메라 방향 계산 및 전달
                const lookDirection = new THREE.Vector3();
                camera.getWorldDirection(lookDirection);
                onCameraDirectionChange({
                    x: lookDirection.x,
                    y: lookDirection.y,
                    z: lookDirection.z,
                });
            }

            renderer.render(scene, camera);
        };

        // Clean up
        return () => {
            window.removeEventListener("resize", updateSize);
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
            const mountElement = mountRef.current;
            if (mountElement) {
                mountElement.removeChild(renderer.domElement);
            }
        };
    }, [onPositionChange, onRotationChange, onStarphoreaPositionChange, onCameraDirectionChange]);

    return <div ref={mountRef} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />;
};

export default ThreeScene;
