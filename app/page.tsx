"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";

const ThreeScene = dynamic(() => import("../components/ThreeScene"), { ssr: false });

interface Position {
    x: number;
    y: number;
    z: number;
}

export default function Home() {
    const [position, setPosition] = useState<Position>({ x: 0, y: 0, z: 0 });
    const [starphoreaPosition, setStarphoreaPosition] = useState<Position>({ x: 0, y: 0, z: 0 });
    const [cameraDirection, setCameraDirection] = useState<Position>({ x: 0, y: 0, z: -1 });

    const handlePositionChange = useCallback((newPosition: Position) => {
        setPosition(newPosition);
    }, []);

    const handleRotationChange = useCallback((newRotation: Position) => {
        // 이 함수는 ThreeScene에서 호출되지만, 여기서는 사용하지 않습니다.
        // 필요하다면 나중에 사용할 수 있습니다.
    }, []);

    const handleStarphoreaPositionChange = useCallback((newPosition: Position) => {
        setStarphoreaPosition(newPosition);
    }, []);

    const handleCameraDirectionChange = useCallback((newDirection: Position) => {
        setCameraDirection(newDirection);
    }, []);

    // Function to calculate relative position for radar
    const calculateRadarPosition = (objectPosition: Position) => {
        const relativeX = objectPosition.x - position.x;
        const relativeZ = objectPosition.z - position.z;
        const maxDistance = 500000; // Maximum radar range
        const radarSize = 150; // Radar size in pixels

        const x = (relativeX / maxDistance) * (radarSize / 2) + radarSize / 2;
        const y = (relativeZ / maxDistance) * (radarSize / 2) + radarSize / 2;

        return { x, y };
    };

    const radarPosition = calculateRadarPosition(starphoreaPosition);

    // Calculate angle for direction display
    const calculateDirectionAngle = () => {
        const angle = Math.atan2(cameraDirection.x, cameraDirection.z);
        return ((angle * (180 / Math.PI) + 180) % 360).toFixed(2);
    };

    const directionAngle = calculateDirectionAngle();

    return (
        <div
            style={{
                position: "relative",
                width: "100vw",
                height: "100vh",
                overflow: "hidden",
                backgroundColor: "#000",
                display: "flex",
                flexDirection: "column",
                fontFamily: "'Press Start 2P', cursive",
            }}
        >
            {/* Window to view exterior */}
            <div
                style={{
                    flex: "1 1 70%",
                    position: "relative",
                    border: "10px solid #444",
                    borderRadius: "10px 10px 0 0",
                    overflow: "hidden",
                }}
            >
                <ThreeScene
                    onPositionChange={handlePositionChange}
                    onRotationChange={handleRotationChange}
                    onStarphoreaPositionChange={handleStarphoreaPositionChange}
                    onCameraDirectionChange={handleCameraDirectionChange}
                />
                {/* Verae Navigation */}
                <div
                    style={{
                        position: "absolute",
                        top: "20px",
                        left: "20px",
                        width: "200px",
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        border: "2px solid #0f0",
                        borderRadius: "10px",
                        padding: "10px",
                        color: "#0f0",
                        fontSize: "12px",
                        zIndex: 10,
                    }}
                >
                    <h3 style={{ marginBottom: "10px" }}>Verae Navigation</h3>
                    <p>X: {position.x.toFixed(2)}</p>
                    <p>Y: {position.y.toFixed(2)}</p>
                    <p>Z: {position.z.toFixed(2)}</p>
                    {/* Ship status */}
                    <div style={{ marginTop: "10px" }}>
                        <p>Direction: {directionAngle}°</p>
                    </div>
                </div>
                {/* Spaceship interior overlay */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "30%",
                        background: "linear-gradient(to bottom, rgba(50,50,50,0) 0%, rgba(50,50,50,0.8) 100%)",
                        zIndex: 2,
                    }}
                ></div>
            </div>

            {/* Control Pad (unchanged) */}
            {/* ... */}

            {/* 2D Radar Map */}
            <div
                style={{
                    position: "absolute",
                    bottom: "20px",
                    left: "20px",
                    width: "150px",
                    height: "150px",
                    backgroundColor: "rgba(0, 255, 0, 0.1)",
                    border: "2px solid #0f0",
                    borderRadius: "50%",
                    zIndex: 10,
                }}
            >
                {/* Player indicator (now just a dot) */}
                <div
                    style={{
                        position: "absolute",
                        width: "6px",
                        height: "6px",
                        backgroundColor: "#0f0",
                        borderRadius: "50%",
                        left: "72px",
                        top: "72px",
                    }}
                />
                {/* Starphorea indicator */}
                <div
                    style={{
                        position: "absolute",
                        width: "8px",
                        height: "8px",
                        backgroundColor: "#f00",
                        borderRadius: "50%",
                        left: `${radarPosition.x}px`,
                        top: `${radarPosition.y}px`,
                    }}
                />
            </div>
        </div>
    );
}
