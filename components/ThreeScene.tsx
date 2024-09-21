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
    onStarphoreaPositionChange: (position: Position) => void;
    onCameraDirectionChange: (direction: Position) => void;
    targetPosition: Position | null;
    isMovingToTarget: boolean;
}

const ThreeScene: React.FC<ThreeSceneProps> = ({
    onPositionChange,
    onRotationChange,
    onStarphoreaPositionChange,
    onCameraDirectionChange,
    targetPosition,
    isMovingToTarget,
}) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const starphoreaRef = useRef<THREE.Object3D | null>(null);
    const keysRef = useRef<{ [key: string]: boolean }>({});
    const starsRef = useRef<THREE.Points | null>(null);
    const velocityRef = useRef<THREE.Vector3>(new THREE.Vector3());
    const maxSpeedRef = useRef<number>(625);
    const accelerationRef = useRef<number>(12.5);
    const decelerationRef = useRef<number>(6.25);
    const rotationVelocityRef = useRef<THREE.Vector2>(new THREE.Vector2());
    const maxRotationSpeedRef = useRef<number>(0.01);
    const rotationAccelerationRef = useRef<number>(0.1);
    const rotationDecelerationRef = useRef<number>(0.1);
    const starphoreaRotationSpeedRef = useRef<number>(0.001);
    const targetPositionRef = useRef<Position | null>(null);
    const isMovingToTargetRef = useRef(false);

    // 카메라 회전 보간을 위한 레퍼런스 추가
    const isCameraTransitioningRef = useRef(false);
    const cameraTransitionProgressRef = useRef(0);
    const cameraTransitionDuration = 1; // 카메라 전환에 걸리는 시간 (초)
    const cameraStartQuaternionRef = useRef(new THREE.Quaternion());
    const cameraTargetQuaternionRef = useRef(new THREE.Quaternion());

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

                const scaleFactor = 5000;
                starphoreaModel.scale.set(scaleFactor, scaleFactor, scaleFactor);
                starphoreaModel.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                starphoreaModel.position.set(350000, 0, 0);
                scene.add(starphoreaModel);

                starphoreaRef.current = starphoreaModel;

                console.log("Starphorea model loaded");

                onStarphoreaPositionChange({
                    x: starphoreaModel.position.x,
                    y: starphoreaModel.position.y,
                    z: starphoreaModel.position.z,
                });

                // 모델 로드 후 애니메이션 시작
                animate();
            },
            undefined,
            (error) => {
                console.error("An error occurred while loading the GLB model:", error);
            }
        );

        // 운석 효과를 위한 별 생성
        const createStars = () => {
            const starCount = 1000;
            const geometry = new THREE.BufferGeometry();
            const positions = [];
            const sizes = [];

            for (let i = 0; i < starCount; i++) {
                const distance = THREE.MathUtils.randFloat(400000, 600000);
                const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
                const phi = THREE.MathUtils.randFloat(0, Math.PI);

                const x = distance * Math.sin(phi) * Math.cos(theta);
                const y = distance * Math.sin(phi) * Math.sin(theta);
                const z = distance * Math.cos(phi);

                positions.push(x, y, z);
                sizes.push(THREE.MathUtils.randFloat(1, 3));
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

        const clock = new THREE.Clock();

        const moveTowardsTarget = () => {
            if (targetPositionRef.current && cameraRef.current && isMovingToTargetRef.current) {
                const camera = cameraRef.current;
                const target = new THREE.Vector3(
                    targetPositionRef.current.x,
                    targetPositionRef.current.y,
                    targetPositionRef.current.z
                );
                const direction = new THREE.Vector3().subVectors(target, camera.position).normalize();
                const distance = camera.position.distanceTo(target);

                if (distance > 1) {
                    // Move towards target
                    const moveSpeed = Math.min(maxSpeedRef.current, distance);
                    velocityRef.current.copy(direction.multiplyScalar(moveSpeed));

                    // Update position
                    camera.position.add(velocityRef.current);
                    onPositionChange({
                        x: camera.position.x,
                        y: camera.position.y,
                        z: camera.position.z,
                    });
                } else {
                    // Arrived at target
                    isMovingToTargetRef.current = false;
                    targetPositionRef.current = null;
                    velocityRef.current.set(0, 0, 0);
                    onPositionChange({
                        x: camera.position.x,
                        y: camera.position.y,
                        z: camera.position.z,
                    });
                }
            }
        };

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);

            const deltaTime = clock.getDelta();

            // Starphorea 회전
            if (starphoreaRef.current) {
                starphoreaRef.current.rotation.y += starphoreaRotationSpeedRef.current;
            }

            // 운석(별) 애니메이션
            if (starsRef.current) {
                const positions = starsRef.current.geometry.attributes.position.array as Float32Array;
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i + 2] += 1000;

                    if (positions[i + 2] > 700000) {
                        const distance = THREE.MathUtils.randFloat(400000, 600000);
                        const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
                        const phi = THREE.MathUtils.randFloat(0, Math.PI);

                        positions[i] = distance * Math.sin(phi) * Math.cos(theta);
                        positions[i + 1] = distance * Math.sin(phi) * Math.sin(theta);
                        positions[i + 2] = -600000;
                    }
                }
                starsRef.current.geometry.attributes.position.needsUpdate = true;
            }

            // Handle movement
            if (cameraRef.current) {
                const camera = cameraRef.current;

                let isUserInteracting = false;

                if (isMovingToTargetRef.current) {
                    moveTowardsTarget();
                } else {
                    // Manual movement using keyboard controls
                    const moveDirection = new THREE.Vector3();
                    const cameraDirection = new THREE.Vector3();
                    camera.getWorldDirection(cameraDirection);

                    if (keysRef.current["KeyW"]) {
                        moveDirection.add(cameraDirection);
                        isUserInteracting = true;
                    }
                    if (keysRef.current["KeyS"]) {
                        moveDirection.sub(cameraDirection);
                        isUserInteracting = true;
                    }
                    if (keysRef.current["KeyA"]) {
                        moveDirection.add(cameraDirection.clone().cross(camera.up).normalize().multiplyScalar(-1));
                        isUserInteracting = true;
                    }
                    if (keysRef.current["KeyD"]) {
                        moveDirection.add(cameraDirection.clone().cross(camera.up).normalize());
                        isUserInteracting = true;
                    }

                    if (moveDirection.length() > 0) {
                        moveDirection.normalize().multiplyScalar(maxSpeedRef.current);
                    }

                    const acceleration = moveDirection.length() > 0 ? accelerationRef.current : decelerationRef.current;
                    velocityRef.current.lerp(moveDirection, acceleration / 1000);

                    if (velocityRef.current.length() < 0.1) {
                        velocityRef.current.set(0, 0, 0);
                    }

                    camera.position.add(velocityRef.current);

                    // Rotation logic
                    const rotationDirection = new THREE.Vector2();
                    if (keysRef.current["KeyK"]) {
                        rotationDirection.x -= 1;
                        isUserInteracting = true;
                    }
                    if (keysRef.current["KeyL"]) {
                        rotationDirection.x += 1;
                        isUserInteracting = true;
                    }
                    if (keysRef.current["Semicolon"]) {
                        rotationDirection.y -= 1;
                        isUserInteracting = true;
                    }
                    if (keysRef.current["Quote"]) {
                        rotationDirection.y += 1;
                        isUserInteracting = true;
                    }

                    if (rotationDirection.length() > 0) {
                        rotationDirection.normalize().multiplyScalar(maxRotationSpeedRef.current);
                    }

                    const rotationAcceleration =
                        rotationDirection.length() > 0
                            ? rotationAccelerationRef.current
                            : rotationDecelerationRef.current;
                    rotationVelocityRef.current.lerp(rotationDirection, rotationAcceleration);

                    if (rotationVelocityRef.current.length() < 0.0001) {
                        rotationVelocityRef.current.set(0, 0);
                    }

                    camera.rotateX(rotationVelocityRef.current.x);
                    camera.rotateY(rotationVelocityRef.current.y);

                    // 유저 입력이 있으면 카메라 전환 중단
                    if (isUserInteracting && isCameraTransitioningRef.current) {
                        isCameraTransitioningRef.current = false;
                    }

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

                    const lookDirection = new THREE.Vector3();
                    camera.getWorldDirection(lookDirection);
                    onCameraDirectionChange({
                        x: lookDirection.x,
                        y: lookDirection.y,
                        z: lookDirection.z,
                    });
                }

                // 카메라 회전 보간 처리
                if (isCameraTransitioningRef.current) {
                    cameraTransitionProgressRef.current += deltaTime / cameraTransitionDuration;
                    if (cameraTransitionProgressRef.current >= 1) {
                        // 보간 완료
                        cameraTransitionProgressRef.current = 1;
                        isCameraTransitioningRef.current = false;
                        // 카메라 회전을 정확히 목표 회전으로 설정
                        camera.quaternion.copy(cameraTargetQuaternionRef.current);
                    } else {
                        // 카메라 회전을 보간
                        camera.quaternion.slerpQuaternions(
                            cameraStartQuaternionRef.current,
                            cameraTargetQuaternionRef.current,
                            cameraTransitionProgressRef.current
                        );
                    }
                }
            }

            renderer.render(scene, cameraRef.current!);
        };

        // Clean up
        return () => {
            window.removeEventListener("resize", updateSize);
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);

            const currentMount = mountRef.current;
            if (currentMount) {
                currentMount.removeChild(renderer.domElement);
            }
        };
    }, [onPositionChange, onRotationChange, onStarphoreaPositionChange, onCameraDirectionChange]);

    // targetPosition과 isMovingToTarget이 변경될 때 레퍼런스 업데이트
    useEffect(() => {
        targetPositionRef.current = targetPosition;
        isMovingToTargetRef.current = isMovingToTarget;

        if (isMovingToTarget && targetPosition && cameraRef.current) {
            // 카메라 회전 보간 시작 설정
            isCameraTransitioningRef.current = true;
            cameraTransitionProgressRef.current = 0;

            // 카메라의 현재 회전 저장
            cameraStartQuaternionRef.current.copy(cameraRef.current.quaternion);

            // 목표 회전 계산 (목표 위치를 바라보도록)
            const camera = cameraRef.current;
            const target = new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z);
            camera.lookAt(target);
            cameraTargetQuaternionRef.current.copy(camera.quaternion);

            // 카메라의 회전을 원래대로 복원 (보간을 통해 회전할 것이므로)
            camera.quaternion.copy(cameraStartQuaternionRef.current);
        }
    }, [targetPosition, isMovingToTarget]);

    return <div ref={mountRef} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />;
};

export default ThreeScene;
