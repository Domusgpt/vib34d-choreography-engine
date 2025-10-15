import { demoAtlasData } from './demo-atlas-data.js';

function normalizeBaseHref(baseHref) {
    if (!baseHref) {
        return './';
    }
    return baseHref.endsWith('/') ? baseHref : `${baseHref}/`;
}

function createCard(doc, demo, makeHref) {
    const card = doc.createElement('article');
    card.className = 'card';
    card.dataset.title = demo.title.toLowerCase();
    card.dataset.tags = demo.tags.join(' ').toLowerCase();
    card.dataset.category = demo.category;

    const badge = doc.createElement('span');
    badge.className = 'status-badge';
    badge.textContent = demo.status;
    card.appendChild(badge);

    const title = doc.createElement('h4');
    title.textContent = demo.title;
    card.appendChild(title);

    const summary = doc.createElement('p');
    summary.textContent = demo.summary;
    card.appendChild(summary);

    if (demo.highlights && demo.highlights.length) {
        const list = doc.createElement('ul');
        demo.highlights.forEach(point => {
            const li = doc.createElement('li');
            li.textContent = point;
            list.appendChild(li);
        });
        card.appendChild(list);
    }

    const meta = doc.createElement('div');
    meta.className = 'meta';
    demo.systems.forEach(system => {
        const span = doc.createElement('span');
        span.textContent = system;
        meta.appendChild(span);
    });
    demo.reactivity.forEach(mode => {
        const span = doc.createElement('span');
        span.textContent = mode;
        meta.appendChild(span);
    });
    card.appendChild(meta);

    const link = doc.createElement('a');
    link.href = makeHref(demo.slug);
    link.textContent = 'Launch →';
    card.appendChild(link);

    return card;
}

function createQuickIndexRow(doc, demo, index, makeHref) {
    const row = doc.createElement('tr');

    const indexCell = doc.createElement('td');
    indexCell.textContent = index + 1;
    row.appendChild(indexCell);

    const titleCell = doc.createElement('td');
    titleCell.textContent = demo.title;
    row.appendChild(titleCell);

    const categoryCell = doc.createElement('td');
    categoryCell.textContent = demo.category;
    row.appendChild(categoryCell);

    const statusCell = doc.createElement('td');
    statusCell.textContent = demo.status;
    row.appendChild(statusCell);

    const highlightsCell = doc.createElement('td');
    highlightsCell.textContent = demo.highlights.join(' • ');
    row.appendChild(highlightsCell);

    const linkCell = doc.createElement('td');
    const anchor = doc.createElement('a');
    anchor.href = makeHref(demo.slug);
    anchor.textContent = 'Open';
    linkCell.appendChild(anchor);
    row.appendChild(linkCell);

    row.dataset.category = demo.category;
    row.dataset.title = demo.title.toLowerCase();
    row.dataset.tags = demo.tags.join(' ').toLowerCase();

    return row;
}

function setStat(doc, key, value) {
    const target = doc.querySelector(`[data-stat="${key}"]`);
    if (target) {
        target.textContent = value;
    }
}

export function initDemoAtlas(options = {}) {
    const doc = options.document ?? (typeof window !== 'undefined' ? window.document : undefined);
    if (!doc) {
        throw new Error('initDemoAtlas requires a document reference.');
    }

    const data = options.data ?? demoAtlasData;
    const baseHref = normalizeBaseHref(options.baseHref ?? doc.body?.dataset.baseHref ?? './');
    const makeHref = slug => `${baseHref}${slug}`;

    const quickIndex = doc.getElementById('quick-index');
    const categorySections = doc.getElementById('category-sections');
    const searchInput = doc.getElementById('search');
    const categoryFilter = doc.getElementById('category-filter');

    if (!quickIndex || !categorySections || !searchInput || !categoryFilter) {
        console.warn('Demo atlas markup missing required elements.');
        return null;
    }

    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }

    const uniqueCategories = Array.from(new Set(data.map(d => d.category))).sort((a, b) => a.localeCompare(b));
    uniqueCategories.forEach(cat => {
        const option = doc.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option);
    });

    const demoCount = data.length;
    const systems = new Set();
    const reactivityModes = new Set();
    let macroHarnesses = 0;

    data.forEach(demo => {
        demo.systems.forEach(system => systems.add(system));
        demo.reactivity.forEach(mode => {
            const normalized = mode.toLowerCase();
            reactivityModes.add(mode);
            if (normalized.includes('macro')) {
                macroHarnesses += 1;
            }
        });
    });

    setStat(doc, 'demo-count', demoCount);
    setStat(doc, 'system-count', systems.size);
    setStat(doc, 'reactivity-count', reactivityModes.size);
    setStat(doc, 'macro-count', macroHarnesses);

    function populateQuickIndex(filtered) {
        quickIndex.textContent = '';
        filtered.forEach((demo, index) => {
            quickIndex.appendChild(createQuickIndexRow(doc, demo, index, makeHref));
        });
    }

    function populateCategories(filtered) {
        categorySections.textContent = '';
        const grouped = filtered.reduce((acc, demo) => {
            acc[demo.category] = acc[demo.category] || [];
            acc[demo.category].push(demo);
            return acc;
        }, {});

        Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([category, items]) => {
                const section = doc.createElement('section');
                section.className = 'category';

                const heading = doc.createElement('h3');
                heading.textContent = category;
                section.appendChild(heading);

                const cardGrid = doc.createElement('div');
                cardGrid.className = 'cards';
                items.forEach(item => cardGrid.appendChild(createCard(doc, item, makeHref)));
                section.appendChild(cardGrid);

                categorySections.appendChild(section);
            });
    }

    function applyFilters() {
        const term = searchInput.value.trim().toLowerCase();
        const category = categoryFilter.value;

        const filtered = data.filter(demo => {
            const matchesCategory = category === 'all' || demo.category === category;
            const haystack = [
                demo.title,
                demo.category,
                demo.status,
                demo.summary,
                demo.tags.join(' '),
                demo.highlights.join(' ')
            ].join(' ').toLowerCase();
            const matchesTerm = !term || haystack.includes(term);
            return matchesCategory && matchesTerm;
        });

        populateQuickIndex(filtered);
        populateCategories(filtered);
    }

    searchInput.addEventListener('input', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);

    applyFilters();

    return {
        applyFilters,
        baseHref,
        data
    };
}
