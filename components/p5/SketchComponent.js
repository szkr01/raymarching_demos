import dynamic from "next/dynamic";
import React from "react";
import { P5WrapperProps } from "react-p5-wrapper";

export default function SketchComponent({sketch}) {
    return (
        <>
            <P5WrapperProps sketch={sketch} />
        </>
    );
}