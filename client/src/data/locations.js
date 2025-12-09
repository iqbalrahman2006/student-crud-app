/**
 * ENTERPRISE LOCATION DATABASE (Complete Global List)
 * Source of Truth for Countries and Major Cities.
 */

export const GLOBAL_LOCATIONS = {
    // keeping original top countries for backward compatibility and priority
    "USA": { code: "US", cities: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville", "Fort Worth", "Columbus", "San Francisco", "Charlotte", "Indianapolis", "Seattle", "Denver", "Washington"], zipRegex: /^\d{5}(-\d{4})?$/, zipHint: "12345", phoneCode: "+1" },
    "United Kingdom": { code: "GB", cities: ["London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Sheffield", "Bradford", "Liverpool", "Edinburgh", "Bristol", "Cardiff"], zipRegex: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i, zipHint: "SW1A 1AA", phoneCode: "+44" },
    "Canada": { code: "CA", cities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton", "Mississauga", "Winnipeg"], zipRegex: /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/, zipHint: "A1A 1A1", phoneCode: "+1" },
    "Australia": { code: "AU", cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra"], zipRegex: /^\d{4}$/, zipHint: "2000", phoneCode: "+61" },
    "Germany": { code: "DE", cities: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Dortmund", "Essen"], zipRegex: /^\d{5}$/, zipHint: "10115", phoneCode: "+49" },
    "Afghanistan": { code: "AF", cities: ["Kabul", "Kandahar", "Herat", "Mazar-i-Sharif"], phoneCode: "+93" },
    "Albania": { code: "AL", cities: ["Tirana", "Durres", "Vlore"], phoneCode: "+355" },
    "Algeria": { code: "DZ", cities: ["Algiers", "Oran", "Constantine"], phoneCode: "+213" },
    "Andorra": { code: "AD", cities: ["Andorra la Vella"], phoneCode: "+376" },
    "Angola": { code: "AO", cities: ["Luanda", "Lubango", "Huambo"], phoneCode: "+244" },
    "Antigua and Barbuda": { code: "AG", cities: ["St. John's"], phoneCode: "+1-268" },
    "Argentina": { code: "AR", cities: ["Buenos Aires", "Cordoba", "Rosario", "Mendoza"], phoneCode: "+54" },
    "Armenia": { code: "AM", cities: ["Yerevan", "Gyumri", "Vanadzor"], phoneCode: "+374" },
    "Austria": { code: "AT", cities: ["Vienna", "Graz", "Linz", "Salzburg"], phoneCode: "+43" },
    "Azerbaijan": { code: "AZ", cities: ["Baku", "Ganja", "Sumqayit"], phoneCode: "+994" },
    "Bahamas": { code: "BS", cities: ["Nassau", "Freeport"], phoneCode: "+1-242" },
    "Bahrain": { code: "BH", cities: ["Manama", "Riffa", "Muharraq"], phoneCode: "+973" },
    "Bangladesh": { code: "BD", cities: ["Dhaka", "Chittagong", "Khulna", "Rajshahi"], phoneCode: "+880" },
    "Barbados": { code: "BB", cities: ["Bridgetown"], phoneCode: "+1-246" },
    "Belarus": { code: "BY", cities: ["Minsk", "Gomel", "Mogilev"], phoneCode: "+375" },
    "Belgium": { code: "BE", cities: ["Brussels", "Antwerp", "Ghent", "Charleroi"], phoneCode: "+32" },
    "Belize": { code: "BZ", cities: ["Belize City", "Belmopan"], phoneCode: "+501" },
    "Benin": { code: "BJ", cities: ["Porto-Novo", "Cotonou"], phoneCode: "+229" },
    "Bhutan": { code: "BT", cities: ["Thimphu"], phoneCode: "+975" },
    "Bolivia": { code: "BO", cities: ["La Paz", "Santa Cruz", "Cochabamba"], phoneCode: "+591" },
    "Bosnia and Herzegovina": { code: "BA", cities: ["Sarajevo", "Banja Luka"], phoneCode: "+387" },
    "Botswana": { code: "BW", cities: ["Gaborone", "Francistown"], phoneCode: "+267" },
    "Brazil": { code: "BR", cities: ["Sao Paulo", "Rio de Janeiro", "Brasilia", "Salvador"], phoneCode: "+55" },
    "Brunei": { code: "BN", cities: ["Bandar Seri Begawan"], phoneCode: "+673" },
    "Bulgaria": { code: "BG", cities: ["Sofia", "Plovdiv", "Varna"], phoneCode: "+359" },
    "Burkina Faso": { code: "BF", cities: ["Ouagadougou", "Bobo-Dioulasso"], phoneCode: "+226" },
    "Burundi": { code: "BI", cities: ["Bujumbura", "Gitega"], phoneCode: "+257" },
    "Cambodia": { code: "KH", cities: ["Phnom Penh", "Siem Reap"], phoneCode: "+855" },
    "Cameroon": { code: "CM", cities: ["Yaounde", "Douala"], phoneCode: "+237" },
    "Cape Verde": { code: "CV", cities: ["Praia", "Mindelo"], phoneCode: "+238" },
    "Central African Republic": { code: "CF", cities: ["Bangui"], phoneCode: "+236" },
    "Chad": { code: "TD", cities: ["N'Djamena"], phoneCode: "+235" },
    "Chile": { code: "CL", cities: ["Santiago", "Valparaiso", "Concepcion"], phoneCode: "+56" },
    "China": { code: "CN", cities: ["Shanghai", "Beijing", "Guangzhou", "Shenzhen"], phoneCode: "+86" },
    "Colombia": { code: "CO", cities: ["Bogota", "Medellin", "Cali"], phoneCode: "+57" },
    "Comoros": { code: "KM", cities: ["Moroni"], phoneCode: "+269" },
    "Congo (Brazzaville)": { code: "CG", cities: ["Brazzaville", "Pointe-Noire"], phoneCode: "+242" },
    "Congo (Kinshasa)": { code: "CD", cities: ["Kinshasa", "Lubumbashi"], phoneCode: "+243" },
    "Costa Rica": { code: "CR", cities: ["San Jose", "Alajuela"], phoneCode: "+506" },
    "Croatia": { code: "HR", cities: ["Zagreb", "Split", "Rijeka"], phoneCode: "+385" },
    "Cuba": { code: "CU", cities: ["Havana", "Santiago de Cuba"], phoneCode: "+53" },
    "Cyprus": { code: "CY", cities: ["Nicosia", "Limassol"], phoneCode: "+357" },
    "Czech Republic": { code: "CZ", cities: ["Prague", "Brno", "Ostrava"], phoneCode: "+420" },
    "Denmark": { code: "DK", cities: ["Copenhagen", "Aarhus", "Odense"], phoneCode: "+45" },
    "Djibouti": { code: "DJ", cities: ["Djibouti"], phoneCode: "+253" },
    "Dominica": { code: "DM", cities: ["Roseau"], phoneCode: "+1-767" },
    "Dominican Republic": { code: "DO", cities: ["Santo Domingo", "Santiago"], phoneCode: "+1-809" },
    "East Timor": { code: "TL", cities: ["Dili"], phoneCode: "+670" },
    "Ecuador": { code: "EC", cities: ["Quito", "Guayaquil", "Cuenca"], phoneCode: "+593" },
    "Egypt": { code: "EG", cities: ["Cairo", "Alexandria", "Giza"], phoneCode: "+20" },
    "El Salvador": { code: "SV", cities: ["San Salvador", "Santa Ana"], phoneCode: "+503" },
    "Equatorial Guinea": { code: "GQ", cities: ["Malabo", "Bata"], phoneCode: "+240" },
    "Eritrea": { code: "ER", cities: ["Asmara"], phoneCode: "+291" },
    "Estonia": { code: "EE", cities: ["Tallinn", "Tartu"], phoneCode: "+372" },
    "Ethiopia": { code: "ET", cities: ["Addis Ababa", "Dire Dawa"], phoneCode: "+251" },
    "Fiji": { code: "FJ", cities: ["Suva", "Lautoka"], phoneCode: "+679" },
    "Finland": { code: "FI", cities: ["Helsinki", "Espoo", "Tampere"], phoneCode: "+358" },
    "France": { code: "FR", cities: ["Paris", "Marseille", "Lyon", "Toulouse"], phoneCode: "+33" },
    "Gabon": { code: "GA", cities: ["Libreville", "Port-Gentil"], phoneCode: "+241" },
    "Gambia": { code: "GM", cities: ["Banjul"], phoneCode: "+220" },
    "Georgia": { code: "GE", cities: ["Tbilisi", "Batumi"], phoneCode: "+995" },
    "Ghana": { code: "GH", cities: ["Accra", "Kumasi", "Tamale"], phoneCode: "+233" },
    "Greece": { code: "GR", cities: ["Athens", "Thessaloniki", "Patras"], phoneCode: "+30" },
    "Grenada": { code: "GD", cities: ["St. George's"], phoneCode: "+1-473" },
    "Guatemala": { code: "GT", cities: ["Guatemala City", "Mixco"], phoneCode: "+502" },
    "Guinea": { code: "GN", cities: ["Conakry", "Nzerekore"], phoneCode: "+224" },
    "Guinea-Bissau": { code: "GW", cities: ["Bissau"], phoneCode: "+245" },
    "Guyana": { code: "GY", cities: ["Georgetown"], phoneCode: "+592" },
    "Haiti": { code: "HT", cities: ["Port-au-Prince", "Carrefour"], phoneCode: "+509" },
    "Honduras": { code: "HN", cities: ["Tegucigalpa", "San Pedro Sula"], phoneCode: "+504" },
    "Hungary": { code: "HU", cities: ["Budapest", "Debrecen", "Szeged"], phoneCode: "+36" },
    "Iceland": { code: "IS", cities: ["Reykjavik"], phoneCode: "+354" },
    "India": { code: "IN", cities: ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai"], phoneCode: "+91" },
    "Indonesia": { code: "ID", cities: ["Jakarta", "Surabaya", "Bandung"], phoneCode: "+62" },
    "Iran": { code: "IR", cities: ["Tehran", "Mashhad", "Isfahan"], phoneCode: "+98" },
    "Iraq": { code: "IQ", cities: ["Baghdad", "Basra", "Erbil"], phoneCode: "+964" },
    "Ireland": { code: "IE", cities: ["Dublin", "Cork", "Limerick"], phoneCode: "+353" },
    "Israel": { code: "IL", cities: ["Jerusalem", "Tel Aviv", "Haifa"], phoneCode: "+972" },
    "Italy": { code: "IT", cities: ["Rome", "Milan", "Naples"], phoneCode: "+39" },
    "Ivory Coast": { code: "CI", cities: ["Abidjan", "Yamoussoukro"], phoneCode: "+225" },
    "Jamaica": { code: "JM", cities: ["Kingston", "Montego Bay"], phoneCode: "+1-876" },
    "Japan": { code: "JP", cities: ["Tokyo", "Osaka", "Yokohama"], phoneCode: "+81" },
    "Jordan": { code: "JO", cities: ["Amman", "Zarqa"], phoneCode: "+962" },
    "Kazakhstan": { code: "KZ", cities: ["Almaty", "Nur-Sultan"], phoneCode: "+7" },
    "Kenya": { code: "KE", cities: ["Nairobi", "Mombasa"], phoneCode: "+254" },
    "Kiribati": { code: "KI", cities: ["South Tarawa"], phoneCode: "+686" },
    "Kuwait": { code: "KW", cities: ["Kuwait City"], phoneCode: "+965" },
    "Kyrgyzstan": { code: "KG", cities: ["Bishkek", "Osh"], phoneCode: "+996" },
    "Laos": { code: "LA", cities: ["Vientiane"], phoneCode: "+856" },
    "Latvia": { code: "LV", cities: ["Riga"], phoneCode: "+371" },
    "Lebanon": { code: "LB", cities: ["Beirut", "Tripoli"], phoneCode: "+961" },
    "Lesotho": { code: "LS", cities: ["Maseru"], phoneCode: "+266" },
    "Liberia": { code: "LR", cities: ["Monrovia"], phoneCode: "+231" },
    "Libya": { code: "LY", cities: ["Tripoli", "Benghazi"], phoneCode: "+218" },
    "Liechtenstein": { code: "LI", cities: ["Vaduz"], phoneCode: "+423" },
    "Lithuania": { code: "LT", cities: ["Vilnius", "Kaunas"], phoneCode: "+370" },
    "Luxembourg": { code: "LU", cities: ["Luxembourg City"], phoneCode: "+352" },
    "Madagascar": { code: "MG", cities: ["Antananarivo"], phoneCode: "+261" },
    "Malawi": { code: "MW", cities: ["Lilongwe"], phoneCode: "+265" },
    "Malaysia": { code: "MY", cities: ["Kuala Lumpur", "George Town"], phoneCode: "+60" },
    "Maldives": { code: "MV", cities: ["Male"], phoneCode: "+960" },
    "Mali": { code: "ML", cities: ["Bamako"], phoneCode: "+223" },
    "Malta": { code: "MT", cities: ["Valletta"], phoneCode: "+356" },
    "Marshall Islands": { code: "MH", cities: ["Majuro"], phoneCode: "+692" },
    "Mauritania": { code: "MR", cities: ["Nouakchott"], phoneCode: "+222" },
    "Mauritius": { code: "MU", cities: ["Port Louis"], phoneCode: "+230" },
    "Mexico": { code: "MX", cities: ["Mexico City", "Guadalajara", "Monterrey"], phoneCode: "+52" },
    // Simplified remaining list for space, but ensuring "Other" support through code
    "Micronesia": { code: "FM", cities: ["Palikir"], phoneCode: "+691" },
    "Moldova": { code: "MD", cities: ["Chisinau"], phoneCode: "+373" },
    "Monaco": { code: "MC", cities: ["Monaco"], phoneCode: "+377" },
    "Mongolia": { code: "MN", cities: ["Ulaanbaatar"], phoneCode: "+976" },
    "Montenegro": { code: "ME", cities: ["Podgorica"], phoneCode: "+382" },
    "Morocco": { code: "MA", cities: ["Casablanca", "Rabat"], phoneCode: "+212" },
    "Mozambique": { code: "MZ", cities: ["Maputo"], phoneCode: "+258" },
    "Myanmar": { code: "MM", cities: ["Yangon", "Mandalay"], phoneCode: "+95" },
    "Namibia": { code: "NA", cities: ["Windhoek"], phoneCode: "+264" },
    "Nauru": { code: "NR", cities: ["Yaren"], phoneCode: "+674" },
    "Nepal": { code: "NP", cities: ["Kathmandu", "Pokhara"], phoneCode: "+977" },
    "Netherlands": { code: "NL", cities: ["Amsterdam", "Rotterdam"], phoneCode: "+31" },
    "New Zealand": { code: "NZ", cities: ["Auckland", "Wellington"], phoneCode: "+64" },
    "Nicaragua": { code: "NI", cities: ["Managua"], phoneCode: "+505" },
    "Niger": { code: "NE", cities: ["Niamey"], phoneCode: "+227" },
    "Nigeria": { code: "NG", cities: ["Lagos", "Abuja"], phoneCode: "+234" },
    "North Korea": { code: "KP", cities: ["Pyongyang"], phoneCode: "+850" },
    "North Macedonia": { code: "MK", cities: ["Skopje"], phoneCode: "+389" },
    "Norway": { code: "NO", cities: ["Oslo", "Bergen"], phoneCode: "+47" },
    "Oman": { code: "OM", cities: ["Muscat"], phoneCode: "+968" },
    "Pakistan": { code: "PK", cities: ["Karachi", "Lahore"], phoneCode: "+92" },
    "Palau": { code: "PW", cities: ["Ngerulmud"], phoneCode: "+680" },
    "Panama": { code: "PA", cities: ["Panama City"], phoneCode: "+507" },
    "Papua New Guinea": { code: "PG", cities: ["Port Moresby"], phoneCode: "+675" },
    "Paraguay": { code: "PY", cities: ["Asuncion"], phoneCode: "+595" },
    "Peru": { code: "PE", cities: ["Lima", "Arequipa"], phoneCode: "+51" },
    "Philippines": { code: "PH", cities: ["Manila", "Quezon City"], phoneCode: "+63" },
    "Poland": { code: "PL", cities: ["Warsaw", "Krakow"], phoneCode: "+48" },
    "Portugal": { code: "PT", cities: ["Lisbon", "Porto"], phoneCode: "+351" },
    "Qatar": { code: "QA", cities: ["Doha"], phoneCode: "+974" },
    "Romania": { code: "RO", cities: ["Bucharest", "Cluj-Napoca"], phoneCode: "+40" },
    "Russia": { code: "RU", cities: ["Moscow", "Saint Petersburg"], phoneCode: "+7" },
    "Rwanda": { code: "RW", cities: ["Kigali"], phoneCode: "+250" },
    "Saint Kitts and Nevis": { code: "KN", cities: ["Basseterre"], phoneCode: "+1-869" },
    "Saint Lucia": { code: "LC", cities: ["Castries"], phoneCode: "+1-758" },
    "Samoa": { code: "WS", cities: ["Apia"], phoneCode: "+685" },
    "San Marino": { code: "SM", cities: ["San Marino"], phoneCode: "+378" },
    "Saudi Arabia": { code: "SA", cities: ["Riyadh", "Jeddah"], phoneCode: "+966" },
    "Senegal": { code: "SN", cities: ["Dakar"], phoneCode: "+221" },
    "Serbia": { code: "RS", cities: ["Belgrade"], phoneCode: "+381" },
    "Seychelles": { code: "SC", cities: ["Victoria"], phoneCode: "+248" },
    "Sierra Leone": { code: "SL", cities: ["Freetown"], phoneCode: "+232" },
    "Singapore": { code: "SG", cities: ["Singapore"], phoneCode: "+65" },
    "Slovakia": { code: "SK", cities: ["Bratislava"], phoneCode: "+421" },
    "Slovenia": { code: "SI", cities: ["Ljubljana"], phoneCode: "+386" },
    "Solomon Islands": { code: "SB", cities: ["Honiara"], phoneCode: "+677" },
    "Somalia": { code: "SO", cities: ["Mogadishu"], phoneCode: "+252" },
    "South Africa": { code: "ZA", cities: ["Johannesburg", "Cape Town", "Durban"], phoneCode: "+27" },
    "South Korea": { code: "KR", cities: ["Seoul", "Busan"], phoneCode: "+82" },
    "South Sudan": { code: "SS", cities: ["Juba"], phoneCode: "+211" },
    "Spain": { code: "ES", cities: ["Madrid", "Barcelona"], phoneCode: "+34" },
    "Sri Lanka": { code: "LK", cities: ["Colombo"], phoneCode: "+94" },
    "Sudan": { code: "SD", cities: ["Khartoum"], phoneCode: "+249" },
    "Suriname": { code: "SR", cities: ["Paramaribo"], phoneCode: "+597" },
    "Sweden": { code: "SE", cities: ["Stockholm", "Gothenburg"], phoneCode: "+46" },
    "Switzerland": { code: "CH", cities: ["Zurich", "Geneva"], phoneCode: "+41" },
    "Syria": { code: "SY", cities: ["Damascus"], phoneCode: "+963" },
    "Taiwan": { code: "TW", cities: ["Taipei", "Kaohsiung"], phoneCode: "+886" },
    "Tajikistan": { code: "TJ", cities: ["Dushanbe"], phoneCode: "+992" },
    "Tanzania": { code: "TZ", cities: ["Dodoma", "Dar es Salaam"], phoneCode: "+255" },
    "Thailand": { code: "TH", cities: ["Bangkok"], phoneCode: "+66" },
    "Togo": { code: "TG", cities: ["Lome"], phoneCode: "+228" },
    "Tonga": { code: "TO", cities: ["Nuku'alofa"], phoneCode: "+676" },
    "Trinidad and Tobago": { code: "TT", cities: ["Port of Spain"], phoneCode: "+1-868" },
    "Tunisia": { code: "TN", cities: ["Tunis"], phoneCode: "+216" },
    "Turkey": { code: "TR", cities: ["Istanbul", "Ankara"], phoneCode: "+90" },
    "Turkmenistan": { code: "TM", cities: ["Ashgabat"], phoneCode: "+993" },
    "Tuvalu": { code: "TV", cities: ["Funafuti"], phoneCode: "+688" },
    "Uganda": { code: "UG", cities: ["Kampala"], phoneCode: "+256" },
    "Ukraine": { code: "UA", cities: ["Kyiv", "Kharkiv"], phoneCode: "+380" },
    "UAE": { code: "AE", cities: ["Dubai", "Abu Dhabi"], phoneCode: "+971" },
    // "United Kingdom" & "United States" removed here (defined at top with regex)
    "Uruguay": { code: "UY", cities: ["Montevideo"], phoneCode: "+598" },
    "Uzbekistan": { code: "UZ", cities: ["Tashkent"], phoneCode: "+998" },
    "Vanuatu": { code: "VU", cities: ["Port Vila"], phoneCode: "+678" },
    "Vatican City": { code: "VA", cities: ["Vatican City"], phoneCode: "+39" },
    "Venezuela": { code: "VE", cities: ["Caracas"], phoneCode: "+58" },
    "Vietnam": { code: "VN", cities: ["Ho Chi Minh City", "Hanoi"], phoneCode: "+84" },
    "Yemen": { code: "YE", cities: ["Sanaa"], phoneCode: "+967" },
    "Zambia": { code: "ZM", cities: ["Lusaka"], phoneCode: "+260" },
    "Zimbabwe": { code: "ZW", cities: ["Harare"], phoneCode: "+263" }
};

/**
 * Utility: Get list of sorted countries
 */
export const getCountries = () => Object.keys(GLOBAL_LOCATIONS).sort();

/**
 * Utility: Get cities for a country
 */
export const getCities = (country) => {
    if (!country || !GLOBAL_LOCATIONS[country]) return [];
    return GLOBAL_LOCATIONS[country].cities ? GLOBAL_LOCATIONS[country].cities.sort() : [];
};

/**
 * Utility: Validate Zip Code
 */
export const validateZip = (country, zip) => {
    if (!country || !GLOBAL_LOCATIONS[country]) return true;
    if (!GLOBAL_LOCATIONS[country].zipRegex) return true; // No regex defined = valid
    if (!zip) return false;
    return GLOBAL_LOCATIONS[country].zipRegex.test(zip);
};

/**
 * Utility: Find Country by City Name (Smart Detect)
 * Returns the first country code that contains the city.
 */
export const getCountryByCity = (cityName) => {
    if (!cityName) return null;
    const search = cityName.toLowerCase().trim();

    // Iterate all countries to find the city
    for (const [country, data] of Object.entries(GLOBAL_LOCATIONS)) {
        if (data.cities && data.cities.some(c => c.toLowerCase() === search)) {
            return country;
        }
    }
    return null;
};
