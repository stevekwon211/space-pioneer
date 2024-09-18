"use client";

import React, { useRef, useEffect, useState } from "react";
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
}

interface PlanetData {
    orbit: THREE.Object3D;
    planet: THREE.Mesh | THREE.Object3D;
    rotationSpeed: number;
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ onPositionChange, onRotationChange }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const planetsRef = useRef<PlanetData[]>([]);
    const keysRef = useRef<{ [key: string]: boolean }>({});
    const starsRef = useRef<THREE.Points | null>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000000);
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

        camera.position.set(0, 200000, 300000); // 카메라 위치 조정
        camera.lookAt(0, 0, 0);

        // Ambient Light (기본 조명 유지)
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // 강도를 높임
        scene.add(ambientLight);

        // 좌측 상단에서의 강력한 광원 추가
        const topLeftLight = new THREE.DirectionalLight(0xffffff, 2); // 강도 조정 가능
        topLeftLight.position.set(-1, 1, 0.5); // 좌측 상단 위치
        topLeftLight.castShadow = true;
        topLeftLight.shadow.mapSize.width = 4096;
        topLeftLight.shadow.mapSize.height = 4096;
        topLeftLight.shadow.camera.near = 1;
        topLeftLight.shadow.camera.far = 500000;
        scene.add(topLeftLight);

        // Starphorea 로드 및 설정
        const starphoreaLoader = new GLTFLoader();
        starphoreaLoader.load(
            "/Celestial_Enigma_0918053509.glb",
            (gltf) => {
                const starphoreaModel = gltf.scene;

                // 기존 크기 조정
                const originalBoundingBox = new THREE.Box3().setFromObject(starphoreaModel);
                const originalSize = originalBoundingBox.getSize(new THREE.Vector3());
                const originalScaleFactor = 1; // 기본 스케일

                // 크기 10배 증가
                const scaleFactor = 10;
                starphoreaModel.scale.set(scaleFactor, scaleFactor, scaleFactor);
                starphoreaModel.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                const starphoreaOrbit = new THREE.Object3D();
                starphoreaOrbit.add(starphoreaModel);
                scene.add(starphoreaOrbit);

                starphoreaModel.position.x = 350000; // 위치 조정

                planetsRef.current = [
                    { orbit: starphoreaOrbit, planet: starphoreaModel, rotationSpeed: 0.0005 }, // 회전 속도 조정
                ];
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
                size: 2,
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
            planetsRef.current.forEach((planetData) => {
                if (planetData.planet instanceof THREE.Object3D) {
                    planetData.planet.rotation.y += planetData.rotationSpeed; // 천천히 회전
                }
            });

            // 운석(별) 애니메이션
            if (starsRef.current) {
                const positions = starsRef.current.geometry.attributes.position.array as Float32Array;
                for (let i = 0; i < positions.length; i += 3) {
                    // 별의 위치를 앞으로 이동 (Z축 기준)
                    positions[i + 2] += 1000; // 속도 조절 가능

                    // Starphorea 주변을 벗어나면 다시 뒤쪽으로 이동
                    if (positions[i + 2] > 700000) {
                        const distance = THREE.MathUtils.randFloat(400000, 600000);
                        const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
                        const phi = THREE.MathUtils.randFloat(0, Math.PI);

                        positions[i] = distance * Math.sin(phi) * Math.cos(theta);
                        positions[i + 1] = distance * Math.sin(phi) * Math.sin(theta);
                        positions[i + 2] = -600000; // 뒤쪽에서 다시 시작
                    }
                }
                starsRef.current.geometry.attributes.position.needsUpdate = true;
            }

            // 카메라 이동
            if (cameraRef.current) {
                const camera = cameraRef.current;
                const moveSpeed = 1000; // 이동 속도 조절
                const direction = new THREE.Vector3();
                const cameraDirection = new THREE.Vector3();
                camera.getWorldDirection(cameraDirection);

                if (keysRef.current["KeyW"]) {
                    direction.add(cameraDirection.clone().multiplyScalar(moveSpeed));
                }
                if (keysRef.current["KeyS"]) {
                    direction.add(cameraDirection.clone().multiplyScalar(-moveSpeed));
                }

                // Calculate the right vector (perpendicular to both up vector and camera direction)
                const rightVector = new THREE.Vector3().crossVectors(camera.up, cameraDirection).normalize();

                if (keysRef.current["KeyA"]) {
                    direction.add(rightVector.clone().multiplyScalar(-moveSpeed));
                }
                if (keysRef.current["KeyD"]) {
                    direction.add(rightVector.clone().multiplyScalar(moveSpeed));
                }

                // Apply movement
                camera.position.add(direction);

                // Camera rotation (기존 코드 유지)
                const rotationSpeed = 0.02;
                if (keysRef.current["KeyK"]) camera.rotateX(rotationSpeed);
                if (keysRef.current["KeyL"]) camera.rotateX(-rotationSpeed);
                if (keysRef.current["Semicolon"]) camera.rotateY(rotationSpeed);
                if (keysRef.current["Quote"]) camera.rotateY(-rotationSpeed);

                // Update position and rotation
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
            }

            renderer.render(scene, camera);
        };

        animate();

        // Clean up
        return () => {
            window.removeEventListener("resize", updateSize);
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
            mountRef.current?.removeChild(renderer.domElement);
        };
    }, [onPositionChange, onRotationChange]);

    return <div ref={mountRef} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />;
};

export default ThreeScene;
