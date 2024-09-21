"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Position } from "../types";
import Map2D from "../components/Map2D";

const ThreeScene = dynamic(() => import("../components/ThreeScene"), { ssr: false });

export default function Home() {
    const [position, setPosition] = useState<Position>({ x: 0, y: 0, z: 0 });
    const [starphoreaPosition, setStarphoreaPosition] = useState<Position>({ x: 0, y: 0, z: 0 });
    const [cameraDirection, setCameraDirection] = useState<Position>({ x: 0, y: 0, z: -1 });
    const [targetPosition, setTargetPosition] = useState<Position | null>(null);
    const [isMovingToTarget, setIsMovingToTarget] = useState(false);

    const handlePositionChange = useCallback((newPosition: Position) => {
        setPosition(newPosition);
    }, []);

    const handleRotationChange = useCallback(() => {
        // This function is called from ThreeScene, but not used here.
        // We can implement it later if needed.
    }, []);

    const handleStarphoreaPositionChange = useCallback((newPosition: Position) => {
        setStarphoreaPosition(newPosition);
    }, []);

    const handleCameraDirectionChange = useCallback((newDirection: Position) => {
        setCameraDirection(newDirection);
    }, []);

    // Calculate angle for direction display
    const calculateDirectionAngle = () => {
        const angle = Math.atan2(cameraDirection.x, cameraDirection.z);
        return ((angle * (180 / Math.PI) + 180) % 360).toFixed(2);
    };

    const directionAngle = calculateDirectionAngle();

    useEffect(() => {
        if (!targetPosition) {
            setIsMovingToTarget(false);
        }
    }, [targetPosition]);

    const directions = [
        { position: starphoreaPosition, name: "Starphorea" },
        // Add other directions here if needed
    ];

    return (
        <div
            style={{
                position: "relative",
                width: "100vw",
                height: "100vh",
                overflow: "hidden",
                backgroundColor: "#000",
                fontFamily: "'Press Start 2P', cursive",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* ThreeScene - full screen */}
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
                <ThreeScene
                    onPositionChange={handlePositionChange}
                    onRotationChange={handleRotationChange}
                    onStarphoreaPositionChange={handleStarphoreaPositionChange}
                    onCameraDirectionChange={handleCameraDirectionChange}
                    targetPosition={targetPosition}
                    isMovingToTarget={isMovingToTarget}
                />
            </div>

            {/* Top section - Verae Navigation */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    padding: "20px",
                    zIndex: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                }}
            >
                <div
                    style={{
                        width: "200px",
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        border: "2px solid #0f0",
                        borderRadius: "10px",
                        padding: "10px",
                        color: "#0f0",
                        fontSize: "12px",
                    }}
                >
                    <h3 style={{ marginBottom: "10px" }}>Verae Navigation</h3>
                    <p>X: {position.x.toFixed(2)}</p>
                    <p>Y: {position.y.toFixed(2)}</p>
                    <p>Z: {position.z.toFixed(2)}</p>
                    <div style={{ marginTop: "10px" }}>
                        <p>Direction: {directionAngle}°</p>
                    </div>
                </div>
                {/* Space for additional widgets */}
                <div></div>
                <div></div>
            </div>

            {/* Middle section - for future widgets */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    right: 0,
                    transform: "translateY(-50%)",
                    padding: "20px",
                    zIndex: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {/* Space for additional widgets */}
                <div></div>
                <div></div>
                <div></div>
            </div>

            {/* Bottom section - 2D Radar Map */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "20px",
                    zIndex: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                }}
            >
                <Map2D
                    playerPosition={position}
                    directions={directions}
                    onMapClick={(clickedPosition) => {
                        setTargetPosition(clickedPosition);
                        setIsMovingToTarget(true);
                    }}
                />
                {/* Space for additional widgets */}
                <div></div>
                <div></div>
            </div>
        </div>
    );
}
