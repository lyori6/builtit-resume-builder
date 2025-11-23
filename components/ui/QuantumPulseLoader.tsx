import React, { useState } from 'react'
import { cn } from '@/lib/utils'

interface QuantumPulseLoaderProps {
    text?: string
}

export const QuantumPulseLoader = ({ text = "Generating" }: QuantumPulseLoaderProps) => {
    return (
        <div className="generating-loader-wrapper">
            <div className="generating-loader-text">
                {text.split('').map((char, index) => (
                    <span key={index} className="generating-loader-letter" style={{ animationDelay: `${index * 0.1}s` }}>
                        {char}
                    </span>
                ))}
            </div>
            <div className="generating-loader-bar"></div>
        </div>
    )
}

export default QuantumPulseLoader
