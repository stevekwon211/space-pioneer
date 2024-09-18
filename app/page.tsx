"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";

const ThreeScene = dynamic(() => import("../components/ThreeScene"), { ssr: false });

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

export default function Home() {
    const [position, setPosition] = useState<Position>({ x: 0, y: 0, z: 0 });
    const [rotation, setRotation] = useState<Rotation>({ x: 0, y: 0, z: 0 });

    const handlePositionChange = useCallback((newPosition: Position) => {
        setPosition(newPosition);
    }, []);

    const handleRotationChange = useCallback((newRotation: Rotation) => {
        setRotation(newRotation);
    }, []);

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
                <ThreeScene onPositionChange={handlePositionChange} onRotationChange={handleRotationChange} />
                {/* Minimap */}
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
                    <div
                        style={{
                            width: "100px",
                            height: "100px",
                            border: "1px solid #0f0",
                            margin: "10px auto",
                            position: "relative",
                        }}
                    >
                        {/* Ship indicator */}
                        <div
                            style={{
                                position: "absolute",
                                width: "10px",
                                height: "10px",
                                backgroundColor: "#0f0",
                                borderRadius: "50%",
                                left: "45px",
                                top: "45px",
                                transform: `rotate(${rotation.y}rad)`,
                            }}
                        >
                            <div
                                style={{
                                    width: "0",
                                    height: "0",
                                    borderLeft: "5px solid transparent",
                                    borderRight: "5px solid transparent",
                                    borderBottom: "10px solid #0f0",
                                    position: "absolute",
                                    top: "-10px",
                                    left: "0",
                                }}
                            />
                        </div>
                    </div>
                    {/* Ship status */}
                    <div style={{ marginTop: "10px" }}>
                        <p>
                            Speed:{" "}
                            {Math.sqrt(
                                Math.pow(position.x, 2) + Math.pow(position.y, 2) + Math.pow(position.z, 2)
                            ).toFixed(2)}
                        </p>
                        <p>Direction: {((rotation.y * (180 / Math.PI) + 180) % 360).toFixed(2)}°</p>
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
        </div>
    );
}
