import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import * as themes from 'react-syntax-highlighter/dist/cjs/styles/prism';

const ThemeSelector = ({ currentTheme, onThemeChange }) => (
    <select
        value={currentTheme}
        onChange={(e) => onThemeChange(e.target.value)}
        className="text-xs bg-gray-700 text-black border border-gray-600 rounded px-2 py-1"
    >
        {Object.keys(themes).map((theme) => (
            <option key={theme} value={theme}>
                {theme}
            </option>
        ))}
    </select>
);

const CodeDisplay = ({
    code,
    language,
    initialStyle = 'vscDarkPlus',
    maxHeight = '450px',
    maxWidth = '650px',
    width,
    height,
    hasHeader = false,
    overflow = 'auto',
}) => {
    const [style, setStyle] = useState(initialStyle);
    const theme = themes[style] || themes.vscDarkPlus;

    return (
        <div className="my-4 rounded-lg overflow-hidden shadow-lg" style={{ maxWidth, width ,height}}>
            {hasHeader ?<div className="bg-black text-black px-4 py-2 font-mono text-sm flex justify-between items-center">
                <span>{language.toUpperCase()} Code</span>
                <ThemeSelector currentTheme={style} onThemeChange={setStyle} />
            </div>: null}
            <div style={{ maxHeight, overflow: overflow }}>
                <SyntaxHighlighter
                    language={language}
                    style={theme}
                    customStyle={{
                        margin: 0,
                        padding: '1rem',
                        fontSize: '0.875rem',
                        lineHeight: '1.0',
                    }}
                >
                    {code}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

export default CodeDisplay;