
import { useState } from 'react';
import { Logo } from '../components/Logo';
import type { Theme } from '../types';

interface LogoTestPageProps {
    theme: Theme;
    onThemeToggle: () => void;
}

export function LogoTestPage({ theme }: LogoTestPageProps) {
    // Local theme state for testing both modes without changing app global state if desired
    // But we passed theme prop, so let's use that to test app integration. 
    // actually, let's allow overriding locally for comparison.
    const [localTheme, setLocalTheme] = useState<Theme>(theme);

    return (
        <div
            className="min-h-screen flex flex-col p-8 transition-colors duration-300"
            style={{
                background: localTheme === 'light' ? '#F8F8E8' : '#1A1A1A', // Using app background colors
                color: localTheme === 'light' ? '#2C2C2C' : '#F8F8F8'
            }}
        >
            <header className="flex justify-between items-center mb-12">
                <h1 className="text-2xl font-bold">Logo Test Bench</h1>
                <div className="flex gap-4">
                    <button
                        onClick={() => setLocalTheme('light')}
                        className={`px-4 py-2 rounded ${localTheme === 'light' ? 'bg-gray-300' : 'bg-gray-700 text-white'}`}
                    >
                        Light Mode
                    </button>
                    <button
                        onClick={() => setLocalTheme('dark')}
                        className={`px-4 py-2 rounded ${localTheme === 'dark' ? 'bg-gray-600 text-white' : 'bg-gray-200'}`}
                    >
                        Dark Mode
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto w-full">

                {/* Scenario 1: Header / Navbar usage */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold opacity-50 uppercase tracking-widest text-sm">Header Simulation</h2>
                    <div
                        className="h-16 px-6 flex items-center border rounded-lg"
                        style={{
                            background: localTheme === 'light' ? 'var(--color-bg-primary)' : 'var(--color-bg-primary)',
                            borderColor: 'var(--glass-border)'
                        }}
                    >
                        {/* Header Content */}
                        <div className="flex items-center gap-3">
                            <Logo className="w-8 h-8" />
                            <span className="text-[1.4rem] font-semibold tracking-tight"
                                style={{
                                    fontFamily: 'var(--font-display)',
                                    color: 'var(--color-text-primary)'
                                }}
                            >
                                Yidhan
                            </span>
                        </div>
                    </div>
                    <p className="text-sm opacity-70">Simulating the main app header (h-16).</p>
                </section>

                {/* Scenario 2: Large Hero Usage */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold opacity-50 uppercase tracking-widest text-sm">Large Hero</h2>
                    <div className="p-12 flex flex-col items-center justify-center border rounded-lg border-dashed opacity-80"
                        style={{ borderColor: 'var(--glass-border)' }}
                    >
                        <Logo className="w-32 h-32 mb-6" />
                        <span className="text-4xl font-light" style={{ fontFamily: 'var(--font-display)' }}>
                            Yidhan
                        </span>
                    </div>
                </section>

                {/* Scenario 3: Icon Only */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold opacity-50 uppercase tracking-widest text-sm">Icon Sizes</h2>
                    <div className="flex items-end gap-8 border p-8 rounded-lg" style={{ borderColor: 'var(--glass-border)' }}>
                        <div className="flex flex-col items-center gap-2">
                            <Logo className="w-4 h-4" />
                            <span className="text-xs opacity-50">16px</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Logo className="w-6 h-6" />
                            <span className="text-xs opacity-50">24px</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Logo className="w-8 h-8" />
                            <span className="text-xs opacity-50">32px</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Logo className="w-12 h-12" />
                            <span className="text-xs opacity-50">48px</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Logo className="w-16 h-16" />
                            <span className="text-xs opacity-50">64px</span>
                        </div>
                    </div>
                </section>

                {/* Scenario 4: Contrast Check */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold opacity-50 uppercase tracking-widest text-sm">Contrast Check</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-white text-black rounded flex items-center justify-center">
                            <Logo className="w-12 h-12" />
                        </div>
                        <div className="p-6 bg-black text-white rounded flex items-center justify-center">
                            <Logo className="w-12 h-12" />
                        </div>
                        <div className="p-6 rounded flex items-center justify-center" style={{ background: '#BE6A41' }}>
                            <Logo className="w-12 h-12" />
                        </div>
                        <div className="p-6 rounded flex items-center justify-center" style={{ background: '#F8F8E8' }}>
                            <Logo className="w-12 h-12" />
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
