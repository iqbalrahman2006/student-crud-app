import { aggregateData } from './PivotEngine';

describe('Pivot Engine Logic', () => {
    const mockData = [
        { Name: 'Alice', City: 'New York', Sales: 100 },
        { Name: 'Bob', City: 'Los Angeles', Sales: 200 },
        { Name: 'Charlie', City: 'New York', Sales: 150 },
        { Name: 'David', City: 'Chicago', Sales: 300 }
    ];

    test('Aggregates counts correctly by Group', () => {
        // Row: City, Col: (None/Totals), Val: (None)
        const result = aggregateData(mockData, ['City'], [], [], {});

        expect(result.rowKeys).toEqual(['Chicago', 'Los Angeles', 'New York']);
        expect(result.matrix['New York']['Totals'].count).toBe(2);
        expect(result.matrix['Los Angeles']['Totals'].count).toBe(1);
    });

    test('Aggregates sums correctly', () => {
        // Row: City, Val: Sales
        const result = aggregateData(mockData, ['City'], [], ['Sales'], {});

        expect(result.matrix['New York']['Totals'].sum).toBe(250); // 100 + 150
        expect(result.matrix['Chicago']['Totals'].sum).toBe(300);
    });

    test('Handles 2D Pivot (Rows x Cols)', () => {
        const simpleData = [
            { R: 'A', C: 'X', V: 10 },
            { R: 'A', C: 'Y', V: 20 },
            { R: 'B', C: 'X', V: 30 }
        ];

        const result = aggregateData(simpleData, ['R'], ['C'], ['V'], {});

        expect(result.rowKeys).toContain('A');
        expect(result.colKeys).toContain('X');
        expect(result.colKeys).toContain('Y');

        expect(result.matrix['A']['X'].sum).toBe(10);
        expect(result.matrix['A']['Y'].sum).toBe(20);
        expect(result.matrix['B']['X'].sum).toBe(30);
    });

    test('Filters data correctly', () => {
        const result = aggregateData(mockData, ['City'], [], [], { City: 'New York' });

        expect(result.rowKeys).toEqual(['New York']);
        expect(result.rowKeys).not.toContain('Chicago');
    });
});
