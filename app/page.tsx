"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";

const ThreeScene = dynamic(() => import("../components/ThreeScene"), { ssr: false });

interface Position {
    x: number;
    y: number;
    z: number;
}

interface IndicatorPosition {
    x: number;
    y: number;
    angle: number;
}

export default function Home() {
    const [position, setPosition] = useState<Position>({ x: 0, y: 0, z: 0 });
    const [starphoreaPosition, setStarphoreaPosition] = useState<Position>({ x: 0, y: 0, z: 0 });
    const [cameraDirection, setCameraDirection] = useState<Position>({ x: 0, y: 0, z: -1 });
    const [indicatorPosition, setIndicatorPosition] = useState<IndicatorPosition>({ x: 75, y: 75, angle: 0 });

    const handlePositionChange = useCallback((newPosition: Position) => {
        setPosition(newPosition);
    }, []);

    const handleRotationChange = useCallback(() => {
        // 이 함수는 ThreeScene에서 호출되지만, 여기서는 사용하지 않습니다.
        // 필요하다면 나중에 구현할 수 있습니다.
    }, []);

    const handleStarphoreaPositionChange = useCallback((newPosition: Position) => {
        setStarphoreaPosition(newPosition);
    }, []);

    const handleCameraDirectionChange = useCallback((newDirection: Position) => {
        setCameraDirection(newDirection);
    }, []);

    // Function to calculate relative position for radar
    const calculateRadarPosition = useCallback(
        (objectPosition: Position) => {
            const relativeX = objectPosition.x - position.x;
            const relativeZ = objectPosition.z - position.z;
            const maxDistance = 500000; // Maximum radar range
            const radarSize = 150; // Radar size in pixels

            const x = (relativeX / maxDistance) * (radarSize / 2) + radarSize / 2;
            const y = (relativeZ / maxDistance) * (radarSize / 2) + radarSize / 2;

            return { x, y, isOutOfBounds: x < 0 || x > radarSize || y < 0 || y > radarSize };
        },
        [position]
    );

    // Calculate angle and position for direction indicator
    const calculateIndicatorPosition = useCallback(
        (objectPosition: Position) => {
            const relativeX = objectPosition.x - position.x;
            const relativeZ = objectPosition.z - position.z;

            // Calculate angle relative to camera direction
            const cameraAngle = Math.atan2(cameraDirection.x, cameraDirection.z);
            const objectAngle = Math.atan2(relativeX, relativeZ);
            let relativeAngle = objectAngle - cameraAngle;

            // Normalize the angle to be between -π and π
            relativeAngle = ((relativeAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;

            const radarSize = 150;
            const radius = radarSize / 2;
            const centerX = radius;
            const centerY = radius;

            // Calculate the position on the edge of the radar
            let edgeX = centerX - radius * Math.sin(relativeAngle);
            let edgeY = centerY - radius * Math.cos(relativeAngle);

            // Ensure the indicator stays within the radar
            const margin = 10; // Increased margin from the edge of the radar
            edgeX = Math.max(margin, Math.min(radarSize - margin, edgeX));
            edgeY = Math.max(margin, Math.min(radarSize - margin, edgeY));

            // The angle for the indicator should point towards the object
            const indicatorAngle = -relativeAngle * (180 / Math.PI) + 180;

            return { x: edgeX, y: edgeY, angle: indicatorAngle };
        },
        [position, cameraDirection]
    );

    useEffect(() => {
        const newIndicatorPosition = calculateIndicatorPosition(starphoreaPosition);
        setIndicatorPosition(newIndicatorPosition);
    }, [position, cameraDirection, starphoreaPosition, calculateIndicatorPosition]);

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
                    zIndex: 10,
                    overflow: "hidden",
                    padding: "5px", // Add padding to prevent indicator from being cut off
                }}
            >
                {/* Player indicator */}
                <div
                    style={{
                        position: "absolute",
                        width: "6px",
                        height: "6px",
                        backgroundColor: "#0f0",
                        left: "72px",
                        top: "72px",
                    }}
                />
                {radarPosition.isOutOfBounds && (
                    // Direction indicator for out-of-bounds object
                    <div
                        style={{
                            position: "absolute",
                            width: "0",
                            height: "0",
                            borderLeft: "4px solid transparent",
                            borderRight: "4px solid transparent",
                            borderTop: "8px solid #f00",
                            transformOrigin: "top center",
                            transform: `translate(-50%, -50%) rotate(${indicatorPosition.angle}deg)`,
                            left: `${indicatorPosition.x}px`,
                            top: `${indicatorPosition.y}px`,
                        }}
                    />
                )}
                {!radarPosition.isOutOfBounds && (
                    // Starphorea indicator
                    <div
                        style={{
                            position: "absolute",
                            width: "6px",
                            height: "6px",
                            backgroundColor: "#f00",
                            left: `${radarPosition.x}px`,
                            top: `${radarPosition.y}px`,
                        }}
                    />
                )}
            </div>
        </div>
    );
}
