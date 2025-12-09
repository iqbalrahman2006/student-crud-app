const autoTagBook = (title, department, isbn) => {
    const tags = new Set();

    // 1. Department Tags
    if (department) tags.add(department);

    // 2. Keyword Parsing
    const lowerTitle = title.toLowerCase();

    // Tech/CS
    if (lowerTitle.includes('algorithm') || lowerTitle.includes('code') || lowerTitle.includes('programming')) tags.add('Programming');
    if (lowerTitle.includes('data') || lowerTitle.includes('database')) tags.add('Data Science');
    if (lowerTitle.includes('ai ') || lowerTitle.includes('intelligence')) tags.add('AI/ML');
    if (lowerTitle.includes('network') || lowerTitle.includes('security')) tags.add('Networking');

    // Engineering
    if (lowerTitle.includes('circuit') || lowerTitle.includes('electric')) tags.add('Electronics');
    if (lowerTitle.includes('mechanic') || lowerTitle.includes('thermo')) tags.add('Core Engineering');

    // Science
    if (lowerTitle.includes('physics') || lowerTitle.includes('quantum')) tags.add('Physics');
    if (lowerTitle.includes('bio') || lowerTitle.includes('anatomy')) tags.add('Biology');

    // General
    if (lowerTitle.includes('history') || lowerTitle.includes('civilization')) tags.add('History');
    if (lowerTitle.includes('novel') || lowerTitle.includes('story')) tags.add('Fiction');

    // 3. ISBN Meta (Mock)
    if (isbn && isbn.startsWith('978-0')) tags.add('English Edition');
    if (isbn && isbn.startsWith('978-1')) tags.add('International Edition');

    return Array.from(tags);
};

module.exports = autoTagBook;
