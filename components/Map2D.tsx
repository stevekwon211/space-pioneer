import React from "react";
import { Position } from "../types"; // Adjust the import path as necessary

interface Direction {
    position: Position;
    name: string;
}

interface Map2DProps {
    playerPosition: Position;
    directions: Direction[];
    onMapClick: (position: Position) => void;
}

const Map2D: React.FC<Map2DProps> = ({ playerPosition, directions, onMapClick }) => {
    const handleIndicatorClick = (position: Position) => {
        onMapClick(position);
    };

    return (
        <div
            style={{
                width: "150px",
                height: "150px",
                backgroundColor: "rgba(0, 255, 0, 0.1)",
                border: "2px solid #0f0",
                borderRadius: "10px",
                overflow: "hidden",
                padding: "5px",
                position: "relative",
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

            {directions.map((direction, index) => {
                const relativeX = direction.position.x - playerPosition.x;
                const relativeZ = direction.position.z - playerPosition.z;
                const maxDistance = 500000; // Maximum radar range
                const radarSize = 150; // Radar size in pixels

                const x = (relativeX / maxDistance) * (radarSize / 2) + radarSize / 2;
                const y = (relativeZ / maxDistance) * (radarSize / 2) + radarSize / 2;

                const isOutOfBounds = x < 0 || x > radarSize || y < 0 || y > radarSize;

                if (isOutOfBounds) {
                    // Direction indicator for out-of-bounds object
                    return (
                        <div
                            key={index}
                            onClick={() => handleIndicatorClick(direction.position)}
                            style={{
                                position: "absolute",
                                width: "0",
                                height: "0",
                                borderLeft: "3px solid transparent",
                                borderRight: "3px solid transparent",
                                borderBottom: "6px solid #f00",
                                transformOrigin: "bottom center",
                                transform: `translate(-50%, -50%) rotate(${
                                    Math.atan2(relativeZ, relativeX) * (180 / Math.PI)
                                }deg)`,
                                left: `${Math.max(0, Math.min(radarSize, x))}px`,
                                top: `${Math.max(0, Math.min(radarSize, y))}px`,
                                cursor: "pointer",
                            }}
                        />
                    );
                } else {
                    // In-bounds indicator
                    return (
                        <div
                            key={index}
                            onClick={() => handleIndicatorClick(direction.position)}
                            style={{
                                position: "absolute",
                                width: "6px",
                                height: "6px",
                                backgroundColor: "#f00",
                                left: `${x}px`,
                                top: `${y}px`,
                                cursor: "pointer",
                            }}
                        />
                    );
                }
            })}
        </div>
    );
};

export default Map2D;
