"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import Planet from "./Planet";
import { planetsData } from "./planetsData";

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

    const planetRefs = useRef<Array<{ original: THREE.Mesh; holo: THREE.Mesh }>>([]);

    const Controls = () => {
        const { camera } = useThree();
        const clock = new THREE.Clock();

        const moveTowardsTarget = () => {
            if (targetPositionRef.current && cameraRef.current && isMovingToTargetRef.current) {
                const camera = cameraRef.current;
                const target = new THREE.Vector3(
                    targetPositionRef.current.x,
                    targetPositionRef.current.y,
                    targetPositionRef.current.z + 15000 // Add 15000 to the Z coordinate
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

        useFrame(() => {
            // Reset visibility of holographic meshes
            planetRefs.current.forEach((meshPair) => {
                meshPair.holo.visible = false;
            });

            // Set up frustum
            const frustum = new THREE.Frustum();
            const cameraViewProjectionMatrix = new THREE.Matrix4();

            camera.updateMatrixWorld();
            cameraViewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
            frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);

            // Get planets in camera view
            const planetsInView = planetRefs.current.filter(
                (meshPair) => meshPair.original && frustum.intersectsObject(meshPair.original)
            );

            if (planetsInView.length > 0) {
                let closestPlanet = planetsInView[0];
                let minDistance = camera.position.distanceTo(
                    closestPlanet.original.getWorldPosition(new THREE.Vector3())
                );

                planetsInView.forEach((meshPair) => {
                    const distance = camera.position.distanceTo(
                        meshPair.original.getWorldPosition(new THREE.Vector3())
                    );
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestPlanet = meshPair;
                    }
                });

                // Make the holographic mesh of the closest planet visible
                closestPlanet.holo.visible = true;
                (closestPlanet.holo.material as THREE.ShaderMaterial).uniforms.time.value = clock.getElapsedTime();

                console.log("Applying holo effect to:", closestPlanet.original.name, "Distance:", minDistance);
            } else {
                console.log("No planets in view");
            }

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
                    cameraTransitionProgressRef.current += clock.getDelta() / cameraTransitionDuration;
                    if (cameraTransitionProgressRef.current >= 1) {
                        // 보간 완료
                        cameraTransitionProgressRef.current = 1;
                        isCameraTransitioningRef.current = false;
                        // 카라 회전을 정확히 목표 회전으로 설정
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
        });

        return null;
    };

    const Stars = () => {
        const { scene } = useThree();

        useEffect(() => {
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

            return () => {
                window.removeEventListener("keydown", onKeyDown);
                window.removeEventListener("keyup", onKeyUp);
            };
        }, [scene]);

        return null;
    };

    // targetPosition과 isMovingToTarget이 변경될 때 레퍼런스 업데이트
    useEffect(() => {
        targetPositionRef.current = targetPosition;
        isMovingToTargetRef.current = isMovingToTarget;

        if (isMovingToTarget && targetPosition && cameraRef.current) {
            // 카메라 회전 보간 시작 설정
            isCameraTransitioningRef.current = true;
            cameraTransitionProgressRef.current = 0;

            // 카메라의 현 회전 저장
            cameraStartQuaternionRef.current.copy(cameraRef.current.quaternion);

            // 목표 회전 계산 (목표 위치를 바라보도록)
            const camera = cameraRef.current;
            const target = new THREE.Vector3(
                targetPosition.x,
                targetPosition.y,
                targetPosition.z + 20000 // Add 15000 to the Z coordinate
            );
            camera.lookAt(target);
            cameraTargetQuaternionRef.current.copy(camera.quaternion);

            // 카메라의 회전을 원래대로 복원 (보간을 통해 회전할 것이므로)
            camera.quaternion.copy(cameraStartQuaternionRef.current);
        }
    }, [targetPosition, isMovingToTarget]);

    const handlePlanetPositionChange = (planetName: string, position: THREE.Vector3) => {
        if (planetName === "starphorea") {
            onStarphoreaPositionChange({
                x: position.x,
                y: position.y,
                z: position.z,
            });
        }
    };

    return (
        <Canvas
            camera={{ position: [0, 0, 500000], fov: 75, near: 0.1, far: 10000000 }}
            style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
        >
            <ambientLight intensity={0.5} />
            <directionalLight position={[1, 1, 1]} intensity={1} />

            {planetsData.map((planet, index) => (
                <Planet
                    key={index}
                    {...planet}
                    onPositionChange={(position) => handlePlanetPositionChange(planet.name, position)}
                />
            ))}

            <Controls />
            <Stars />
        </Canvas>
    );
};

export default ThreeScene;
