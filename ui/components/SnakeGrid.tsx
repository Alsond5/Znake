"use client";
import React from "react";

type Props = {
    width: number;
    height: number;
}

const SnakeGrid: React.FC<Props> = ({ width, height }) => {
    return (
        <div>{width}</div>
    );
}

export default SnakeGrid;