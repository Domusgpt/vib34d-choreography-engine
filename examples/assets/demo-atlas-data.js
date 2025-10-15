export const demoAtlasData = [
    {
        slug: 'final-ultimate.html',
        title: 'Final Ultimate',
        category: 'Production Suites',
        status: 'Primary Showcase',
        summary: 'Flagship immersive experience with full-screen coverage, cinematic camera rails, advanced post-FX, and synchronized palette control.',
        highlights: [
            'Quantum, Holographic, and Polychora engines sharing choreography metadata',
            'VisualizerControlBus macros, gesture capture, and preset blending',
            'Hypercolor palette engine with Lab blending and audio-triggered swaps'
        ],
        tags: ['production', 'cinematic', 'audio-reactive'],
        systems: ['Quantum', 'Holographic', 'Polychora'],
        reactivity: ['Full Spectrum']
    },
    {
        slug: 'ultimate-reactive.html',
        title: 'Ultimate Reactive',
        category: 'Production Suites',
        status: 'Legacy Primary',
        summary: 'Earlier full control deck that retains the extended analyzer routing, layered parameter modulation, and choreography toggles.',
        highlights: [
            'Twelve-parameter rig with base + reactive blend',
            'Geometry, color, and rotation toggles with smoothing',
            'Great for regression-testing the legacy UI surfaces'
        ],
        tags: ['legacy', 'ui'],
        systems: ['Quantum', 'Holographic', 'Polychora'],
        reactivity: ['Full Spectrum']
    },
    {
        slug: 'ultimate-controls.html',
        title: 'Ultimate Controls',
        category: 'Production Suites',
        status: 'Controls Focus',
        summary: 'Control-forward layout for validating parameter wiring without the macro recorder or cinematic rails.',
        highlights: [
            'Per-parameter sliders for geometry, morph, color, and speed',
            'Live spectrum meters and reactivity status readout',
            'Ideal for onboarding collaborators to the parameter stack'
        ],
        tags: ['controls', 'ui'],
        systems: ['Quantum', 'Holographic', 'Polychora'],
        reactivity: ['Layered Reactivity']
    },
    {
        slug: 'bezel-ultimate.html',
        title: 'Bezel Ultimate',
        category: 'Production Suites',
        status: 'Touch Optimized',
        summary: 'Mobile-first touch bezel controls with simplified macro hooks for kiosk or performance tablet setups.',
        highlights: [
            'Adaptive layout with large format sliders and toggles',
            'Pointer + touch gestures flow into the shared control bus',
            'Great for live tweaking on stage or gallery floors'
        ],
        tags: ['mobile', 'touch'],
        systems: ['Quantum', 'Holographic', 'Polychora'],
        reactivity: ['Layered Reactivity']
    },
    {
        slug: 'advanced-reactive.html',
        title: 'Advanced Reactive',
        category: 'Reactive Harnesses',
        status: 'Analyzer Demo',
        summary: 'Seven-band analyzer monitor with beat-synced geometry cycling, palette orbits, and annotated reactivity channels.',
        highlights: [
            'Detailed telemetry overlay for sub/bass/mid/high bands',
            'Auto geometry rotation every measure with onset overrides',
            'Great baseline for inspecting raw analyzer output'
        ],
        tags: ['analyzer', 'telemetry'],
        systems: ['Quantum'],
        reactivity: ['Full Spectrum']
    },
    {
        slug: 'properly-reactive.html',
        title: 'Properly Reactive',
        category: 'Reactive Harnesses',
        status: 'Verification Loop',
        summary: 'Self-contained verification harness with looping demo groove, analyzer injection options, and console telemetry.',
        highlights: [
            'Runs without external audio by default but accepts live input',
            'Displays normalized band frames, onset detection, and BPM pulses',
            'Primary smoke test before validating other demos'
        ],
        tags: ['testing', 'audio'],
        systems: ['Analyzer'],
        reactivity: ['Analyzer Bench']
    },
    {
        slug: 'real-visualizers.html',
        title: 'Real Visualizers',
        category: 'Reactive Harnesses',
        status: 'System Bridge',
        summary: 'Direct bridge into the production visualizers with minimal UI for quick sanity checks against the shared control bus.',
        highlights: [
            'Loads Quantum, Holographic, and Polychora simultaneously',
            'Reflects live camera + color system values in overlays',
            'Useful for checking cross-visualizer synchronization'
        ],
        tags: ['integration', 'sanity-check'],
        systems: ['Quantum', 'Holographic', 'Polychora'],
        reactivity: ['Layered Reactivity']
    },
    {
        slug: 'enhanced-visualizers.html',
        title: 'Enhanced Visualizers',
        category: 'Reactive Harnesses',
        status: 'Legacy Bridge',
        summary: 'Transitional playground highlighting the move from mock to real audio reactivity with simplified overlays.',
        highlights: [
            'Good midpoint between legacy demos and the modern atlas',
            'Hooks into the shared ParameterManager and control bus',
            'Retains toggles for staged rollouts'
        ],
        tags: ['legacy', 'integration'],
        systems: ['Quantum', 'Holographic', 'Polychora'],
        reactivity: ['Layered Reactivity']
    },
    {
        slug: 'auto-test.html',
        title: 'Auto Test',
        category: 'Diagnostics',
        status: 'Automation Harness',
        summary: 'Headless-friendly loop that drives macros, parameter sweeps, and timing assertions for CI pipelines.',
        highlights: [
            'Macro playback validation for the VisualizerControlBus',
            'Camera preset cycling with cooldown enforcement',
            'Console-driven assertions for non-visual verification'
        ],
        tags: ['ci', 'automation'],
        systems: ['Control Bus'],
        reactivity: ['Macro Harness']
    },
    {
        slug: 'debug-visualizer.html',
        title: 'Debug Visualizer',
        category: 'Diagnostics',
        status: 'Developer HUD',
        summary: 'Instrumented view with overlays for internal vector fields, shader uniforms, and easing envelopes.',
        highlights: [
            'Displays camera, lighting, and post-FX uniforms in real time',
            'Highlights palette swaps, onset bursts, and control bus deltas',
            'Switch between geometries quickly for targeted shader debugging'
        ],
        tags: ['debug', 'shader'],
        systems: ['Quantum'],
        reactivity: ['Developer HUD']
    },
    {
        slug: 'test-audio.html',
        title: 'Test Audio',
        category: 'Diagnostics',
        status: 'Input Check',
        summary: 'Minimal audio-only harness for confirming Web Audio permissions, context lifecycle, and onset thresholds.',
        highlights: [
            'Inputs into the shared AudioAnalyzer class directly',
            'Prints onset detection, BPM, and RMS to the console',
            'Great for diagnosing browser microphone sandbox issues'
        ],
        tags: ['audio', 'diagnostics'],
        systems: ['Analyzer'],
        reactivity: ['Analyzer Bench']
    },
    {
        slug: 'test-minimal.html',
        title: 'Test Minimal',
        category: 'Diagnostics',
        status: 'Minimal Repro',
        summary: 'Lowest possible scaffolding to render a WebGL canvas and verify shader compilation after major refactors.',
        highlights: [
            'Single visualizer mount with static parameters',
            'Ideal for regression checking shader helper utilities',
            'Loads fast for iterative development in constrained environments'
        ],
        tags: ['minimal', 'smoke'],
        systems: ['Quantum'],
        reactivity: ['Static Baseline']
    },
    {
        slug: 'basic-choreography.html',
        title: 'Basic Choreography',
        category: 'Legacy Archives',
        status: 'Historical',
        summary: 'Original baseline of the choreography engine showcasing early parameter sequencing with mock data.',
        highlights: [
            'Useful for comparing legacy vs modern smoothing curves',
            'Demonstrates earliest UI + geometry switching concepts',
            'Retained for documentation nostalgia'
        ],
        tags: ['legacy'],
        systems: ['Quantum'],
        reactivity: ['Mock Legacy']
    },
    {
        slug: 'mobile-smart.html',
        title: 'Mobile Smart',
        category: 'Legacy Archives',
        status: 'Historical',
        summary: 'Responsive experiment testing stacked control layouts and condensed status readouts on small screens.',
        highlights: [
            'Precedes the touch bezel but still informative for layout decisions',
            'Highlights early attempts at gesture routing',
            'Compare against Bezel Ultimate for evolution notes'
        ],
        tags: ['legacy', 'mobile'],
        systems: ['Quantum'],
        reactivity: ['Mock Legacy']
    },
    {
        slug: 'ultimate-controls.html#macros',
        title: 'Ultimate Controls – Macro Anchor',
        category: 'Quick Links',
        status: 'Shortcut',
        summary: 'Anchor link into the macro and gesture section of the Ultimate Controls page for fast demos.',
        highlights: [
            'Jumps directly to macro instructions when presenting',
            'Great for onboarding sessions or documentation references',
            'Pairs with macro JSON import/export examples'
        ],
        tags: ['shortcut', 'documentation'],
        systems: ['Quantum', 'Holographic', 'Polychora'],
        reactivity: ['Layered Reactivity']
    }
];
