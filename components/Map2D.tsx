import React from "react";

interface Map2DProps {
    // ... existing props ...
    onMapClick: (position: Position) => void;
}

const Map2D: React.FC<Map2DProps> = ({
    // ... existing props ...
    onMapClick,
}) => {
    // ... existing code ...

    const handleIndicatorClick = (position: Position) => {
        onMapClick(position);
    };

    return (
        <div>
            {/* ... existing JSX ... */}
            {directions.map((direction, index) => (
                <div
                    key={index}
                    onClick={() => handleIndicatorClick(direction.position)}
                    // ... other props ...
                >
                    {/* ... indicator content ... */}
                </div>
            ))}
            {/* Similar changes for planet indicators */}
        </div>
    );
};

export default Map2D;
