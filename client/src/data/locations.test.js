import { getCountries, getCities, validateZip } from './locations';

describe('Location Data Logic', () => {

    test('getCountries returns a list of country names', () => {
        const countries = getCountries();
        expect(Array.isArray(countries)).toBe(true);
        expect(countries).toContain('USA');
        expect(countries).toContain('India');
        expect(countries).toContain('United Kingdom');
        // Ensure expanded list is present
        expect(countries).toContain('China');
        expect(countries).toContain('Brazil');
    });

    test('getCities returns cities for a valid country', () => {
        const cities = getCities('USA');
        expect(Array.isArray(cities)).toBe(true);
        expect(cities).toContain('New York');
        expect(cities).toContain('Los Angeles');
    });

    test('getCities returns empty array for invalid country', () => {
        const cities = getCities('Narnia');
        expect(cities).toEqual([]);
    });

    test('validateZip validates correct US zip codes', () => {
        expect(validateZip('USA', '10001')).toBe(true);
        expect(validateZip('USA', '12345-6789')).toBe(true);
    });

    test('validateZip invalidates incorrect US zip codes', () => {
        expect(validateZip('USA', '123')).toBe(false);
        expect(validateZip('USA', 'abcde')).toBe(false);
    });

    test('validateZip handles countries with generic regex (fallback)', () => {
        // If a country isn't in the list or has no regex, it defaults to true
        const res = validateZip('India', '12345');
        expect(typeof res).toBe('boolean');
    });
});
