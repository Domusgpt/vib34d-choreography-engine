const clamp01 = (value) => Math.min(1, Math.max(0, value || 0));

function hexToRgb(hex) {
    if (typeof hex !== 'string') {
        return [0, 0, 0];
    }

    const normalized = hex.trim().replace('#', '');
    if (normalized.length === 3) {
        const r = parseInt(normalized[0] + normalized[0], 16);
        const g = parseInt(normalized[1] + normalized[1], 16);
        const b = parseInt(normalized[2] + normalized[2], 16);
        return [r / 255, g / 255, b / 255];
    }

    if (normalized.length !== 6) {
        return [0, 0, 0];
    }

    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return [r / 255, g / 255, b / 255];
}

function createPalette({ base, mid, highlight, accent, shadow }) {
    return {
        base: hexToRgb(base),
        mid: hexToRgb(mid),
        highlight: hexToRgb(highlight),
        accent: hexToRgb(accent),
        shadow: hexToRgb(shadow)
    };
}

const HEX_PALETTES = [
    {
        // 0 - Legacy Hypercolor
        base: '#352257',
        mid: '#50338B',
        highlight: '#C27CFF',
        accent: '#FF6FD4',
        shadow: '#0D0616'
    },
    {
        // 1 - Aurora Bloom
        base: '#0A1F33',
        mid: '#15486B',
        highlight: '#5BC4E5',
        accent: '#9FF8FF',
        shadow: '#04101E'
    },
    {
        // 2 - Solar Inferno
        base: '#2A0F00',
        mid: '#7A2D05',
        highlight: '#FF8C3C',
        accent: '#FFBC6A',
        shadow: '#130600'
    },
    {
        // 3 - Midnight Prism
        base: '#120A1F',
        mid: '#2A1F4D',
        highlight: '#6F5CD6',
        accent: '#8FA0FF',
        shadow: '#070511'
    },
    {
        // 4 - Neon Mirage
        base: '#011C26',
        mid: '#0C3C4B',
        highlight: '#29D8F5',
        accent: '#FA55FF',
        shadow: '#031018'
    },
    {
        // 5 - Monochrome Bloom
        base: '#1B1B1D',
        mid: '#3C3D42',
        highlight: '#9FA0A8',
        accent: '#D8D9DF',
        shadow: '#0A0A0B'
    },
    {
        // 6 - Luxe Ember
        base: '#231205',
        mid: '#4C2A0D',
        highlight: '#F1A446',
        accent: '#5CC6B0',
        shadow: '#120903'
    },
    {
        // 7 - Biolumens
        base: '#021A16',
        mid: '#0B4239',
        highlight: '#28C19C',
        accent: '#6DF7D5',
        shadow: '#04100E'
    },
    {
        // 8 - Cyber Noir
        base: '#13071D',
        mid: '#311046',
        highlight: '#7D45BF',
        accent: '#38C7F8',
        shadow: '#05020B'
    },
    {
        // 9 - Aurora Cascade
        base: '#091428',
        mid: '#15366B',
        highlight: '#6D9BFF',
        accent: '#B3A4FF',
        shadow: '#040A15'
    },
    {
        // 10 - Glacier Mono
        base: '#0A1927',
        mid: '#143048',
        highlight: '#6FA3D5',
        accent: '#C8E4FF',
        shadow: '#030A13'
    },
    {
        // 11 - Amber Drift
        base: '#1C0F07',
        mid: '#3A2414',
        highlight: '#D38B3A',
        accent: '#F4C57A',
        shadow: '#0B0503'
    },
    {
        // 12 - Sakura Veil
        base: '#180D12',
        mid: '#3A1F2C',
        highlight: '#D28CAA',
        accent: '#F5C6DA',
        shadow: '#0A0509'
    },
    {
        // 13 - Verdant Pulse
        base: '#0B140F',
        mid: '#193628',
        highlight: '#3FA56F',
        accent: '#76D9B0',
        shadow: '#050A07'
    },
    {
        // 14 - Indigo Drift
        base: '#0A0E1C',
        mid: '#152241',
        highlight: '#3C5A8A',
        accent: '#6F8FC8',
        shadow: '#04070F'
    },
    {
        // 15 - Emerald Still
        base: '#0A130E',
        mid: '#183126',
        highlight: '#2E6B4F',
        accent: '#58A989',
        shadow: '#030806'
    },
    {
        // 16 - Copper Pulse
        base: '#1A0F0C',
        mid: '#3B251F',
        highlight: '#B86D3D',
        accent: '#E8B07A',
        shadow: '#0B0604'
    },
    {
        // 17 - Obsidian Film
        base: '#0C0C0E',
        mid: '#1D1B1A',
        highlight: '#4B3C32',
        accent: '#C07F4F',
        shadow: '#050505'
    },
    {
        // 18 - Nordic Dawn
        base: '#0C1418',
        mid: '#1F3037',
        highlight: '#8DB4C9',
        accent: '#E1C4B6',
        shadow: '#050A0D'
    },
    {
        // 19 - Sepia Glass
        base: '#18100C',
        mid: '#2C1E18',
        highlight: '#B48767',
        accent: '#E3C9B3',
        shadow: '#080504'
    }
];

const UNIFORM_PALETTES = HEX_PALETTES.map(createPalette);

export function getUniformPalette(index = 0) {
    if (!Number.isFinite(index)) {
        return UNIFORM_PALETTES[0];
    }
    const count = UNIFORM_PALETTES.length;
    const wrapped = ((Math.floor(index) % count) + count) % count;
    return UNIFORM_PALETTES[wrapped];
}

export function getUniformPaletteCount() {
    return UNIFORM_PALETTES.length;
}

export function lerpColor(a, b, t) {
    if (!a || !b) {
        return a || b || [0, 0, 0];
    }
    const clamped = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0));
    return [
        clamp01(a[0] + (b[0] - a[0]) * clamped),
        clamp01(a[1] + (b[1] - a[1]) * clamped),
        clamp01(a[2] + (b[2] - a[2]) * clamped)
    ];
}

export function applyVibrance(color, vibrance = 1) {
    if (!color) {
        return [0, 0, 0];
    }
    const strength = Math.min(3, Math.max(0.2, Number.isFinite(vibrance) ? vibrance : 1));
    const gray = (color[0] + color[1] + color[2]) / 3;
    return [
        clamp01(gray + (color[0] - gray) * strength),
        clamp01(gray + (color[1] - gray) * strength),
        clamp01(gray + (color[2] - gray) * strength)
    ];
}

export function clampColor(color) {
    if (!color) {
        return [0, 0, 0];
    }
    return [clamp01(color[0]), clamp01(color[1]), clamp01(color[2])];
}

export default {
    getUniformPalette,
    getUniformPaletteCount,
    lerpColor,
    applyVibrance,
    clampColor
};
