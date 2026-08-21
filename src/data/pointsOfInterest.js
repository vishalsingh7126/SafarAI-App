/**
 * Points of interest — real, individually verifiable places.
 * ---------------------------------------------------------------------------
 * Coordinates are the actual site locations (WGS84). `wiki` is the exact
 * Wikipedia article for that place, used for imagery and further reading.
 * Categories drive the marker iconography on the map.
 */

export const POI_CATEGORIES = {
  landmark: { label: 'Landmark', icon: 'building', color: '#6366f1' },
  museum: { label: 'Museum', icon: 'layers', color: '#a855f7' },
  religious: { label: 'Religious site', icon: 'sparkles', color: '#f59e0b' },
  nature: { label: 'Nature', icon: 'leaf', color: '#10b981' },
  beach: { label: 'Beach', icon: 'camera', color: '#22d3ee' },
  viewpoint: { label: 'Viewpoint', icon: 'mountain', color: '#0ea5e9' },
  market: { label: 'Market', icon: 'utensils', color: '#f97316' },
  airport: { label: 'Airport', icon: 'plane', color: '#64748b' },
  transport: { label: 'Transport hub', icon: 'train', color: '#475569' },
  park: { label: 'Park', icon: 'leaf', color: '#84cc16' },
  hotel: { label: 'Hotel', icon: 'hotel', color: '#ec4899' },
};

const poi = (destination, name, category, lat, lng, wiki = null, note = '') => ({
  id: `${destination}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  destination,
  name,
  category,
  coords: { lat, lng },
  wiki,
  note,
});

export const pointsOfInterest = [
  /* ------------------------------------------------------------------ India */
  poi('agra', 'Taj Mahal', 'landmark', 27.1751, 78.0421, 'Taj_Mahal', 'Open sunrise–sunset, closed Fridays'),
  poi('agra', 'Agra Fort', 'landmark', 27.1795, 78.0211, 'Agra_Fort'),
  poi('agra', 'Fatehpur Sikri', 'landmark', 27.0940, 77.6610, 'Fatehpur_Sikri', '40 km west of Agra'),
  poi('agra', 'Mehtab Bagh', 'park', 27.1795, 78.0421, 'Mehtab_Bagh', 'Sunset view across the Yamuna'),

  poi('delhi', 'Red Fort', 'landmark', 28.6562, 77.2410, 'Red_Fort'),
  poi('delhi', 'India Gate', 'landmark', 28.6129, 77.2295, 'India_Gate'),
  poi('delhi', 'Qutb Minar', 'landmark', 28.5245, 77.1855, 'Qutb_Minar'),
  poi('delhi', "Humayun's Tomb", 'landmark', 28.5933, 77.2507, "Humayun's_Tomb"),
  poi('delhi', 'Lotus Temple', 'religious', 28.5535, 77.2588, 'Lotus_Temple'),
  poi('delhi', 'Chandni Chowk', 'market', 28.6506, 77.2303, 'Chandni_Chowk'),
  poi('delhi', 'Indira Gandhi International Airport', 'airport', 28.5562, 77.1000, 'Indira_Gandhi_International_Airport'),

  poi('mumbai', 'Gateway of India', 'landmark', 18.9220, 72.8347, 'Gateway_of_India'),
  poi('mumbai', 'Marine Drive', 'viewpoint', 18.9440, 72.8230, 'Marine_Drive,_Mumbai'),
  poi('mumbai', 'Elephanta Caves', 'landmark', 18.9633, 72.9315, 'Elephanta_Caves', 'Ferry from the Gateway'),
  poi('mumbai', 'Chhatrapati Shivaji Maharaj Terminus', 'transport', 18.9398, 72.8355, 'Chhatrapati_Shivaji_Maharaj_Terminus'),
  poi('mumbai', 'Chhatrapati Shivaji Maharaj International Airport', 'airport', 19.0896, 72.8656, 'Chhatrapati_Shivaji_Maharaj_International_Airport'),

  poi('jaipur', 'Amer Fort', 'landmark', 26.9855, 75.8513, 'Amer_Fort'),
  poi('jaipur', 'Hawa Mahal', 'landmark', 26.9239, 75.8267, 'Hawa_Mahal'),
  poi('jaipur', 'City Palace', 'landmark', 26.9255, 75.8236, 'City_Palace,_Jaipur'),
  poi('jaipur', 'Jantar Mantar', 'landmark', 26.9247, 75.8246, 'Jantar_Mantar,_Jaipur'),
  poi('jaipur', 'Jal Mahal', 'viewpoint', 26.9535, 75.8460, 'Jal_Mahal'),

  poi('goa', 'Basilica of Bom Jesus', 'religious', 15.5009, 73.9116, 'Basilica_of_Bom_Jesus'),
  poi('goa', 'Fort Aguada', 'landmark', 15.4925, 73.7736, 'Fort_Aguada'),
  poi('goa', 'Dudhsagar Falls', 'nature', 15.3144, 74.3143, 'Dudhsagar_Falls'),
  poi('goa', 'Baga Beach', 'beach', 15.5553, 73.7517, 'Baga,_Goa'),
  poi('goa', 'Palolem Beach', 'beach', 15.0100, 74.0233, 'Palolem_Beach'),
  poi('goa', 'Dabolim Airport', 'airport', 15.3808, 73.8314, 'Dabolim_Airport'),

  poi('kerala', 'Alleppey Backwaters', 'nature', 9.4981, 76.3388, 'Alappuzha'),
  poi('kerala', 'Munnar Tea Estates', 'nature', 10.0889, 77.0595, 'Munnar'),
  poi('kerala', 'Fort Kochi', 'landmark', 9.9658, 76.2422, 'Fort_Kochi'),
  poi('kerala', 'Periyar National Park', 'nature', 9.4667, 77.2333, 'Periyar_National_Park'),

  poi('varanasi', 'Dashashwamedh Ghat', 'religious', 25.3070, 83.0104, 'Dashashwamedh_Ghat'),
  poi('varanasi', 'Kashi Vishwanath Temple', 'religious', 25.3109, 83.0107, 'Kashi_Vishwanath_Temple'),
  poi('varanasi', 'Sarnath', 'landmark', 25.3811, 83.0244, 'Sarnath'),

  /* ------------------------------------------------------------------ Europe */
  poi('paris', 'Eiffel Tower', 'landmark', 48.8584, 2.2945, 'Eiffel_Tower'),
  poi('paris', 'Louvre Museum', 'museum', 48.8606, 2.3376, 'Louvre'),
  poi('paris', 'Notre-Dame de Paris', 'religious', 48.8530, 2.3499, 'Notre-Dame_de_Paris'),
  poi('paris', 'Arc de Triomphe', 'landmark', 48.8738, 2.2950, 'Arc_de_Triomphe'),
  poi('paris', 'Sacré-Cœur', 'religious', 48.8867, 2.3431, 'Sacré-Cœur,_Paris'),
  poi('paris', 'Jardin du Luxembourg', 'park', 48.8462, 2.3372, 'Luxembourg_Garden'),
  poi('paris', 'Charles de Gaulle Airport', 'airport', 49.0097, 2.5479, 'Charles_de_Gaulle_Airport'),

  poi('rome', 'Colosseum', 'landmark', 41.8902, 12.4922, 'Colosseum'),
  poi('rome', "St. Peter's Basilica", 'religious', 41.9022, 12.4539, "St._Peter's_Basilica"),
  poi('rome', 'Trevi Fountain', 'landmark', 41.9009, 12.4833, 'Trevi_Fountain'),
  poi('rome', 'Pantheon', 'landmark', 41.8986, 12.4769, 'Pantheon,_Rome'),
  poi('rome', 'Roman Forum', 'landmark', 41.8925, 12.4853, 'Roman_Forum'),
  poi('rome', 'Vatican Museums', 'museum', 41.9065, 12.4536, 'Vatican_Museums'),
  poi('rome', 'Fiumicino Airport', 'airport', 41.8003, 12.2389, 'Leonardo_da_Vinci–Fiumicino_Airport'),

  poi('london', 'Big Ben', 'landmark', 51.5007, -0.1246, 'Big_Ben'),
  poi('london', 'Tower of London', 'landmark', 51.5081, -0.0759, 'Tower_of_London'),
  poi('london', 'British Museum', 'museum', 51.5194, -0.1270, 'British_Museum'),
  poi('london', 'Buckingham Palace', 'landmark', 51.5014, -0.1419, 'Buckingham_Palace'),
  poi('london', 'London Eye', 'viewpoint', 51.5033, -0.1196, 'London_Eye'),
  poi('london', 'Hyde Park', 'park', 51.5073, -0.1657, 'Hyde_Park,_London'),
  poi('london', 'Heathrow Airport', 'airport', 51.4700, -0.4543, 'Heathrow_Airport'),

  poi('barcelona', 'Sagrada Família', 'religious', 41.4036, 2.1744, 'Sagrada_Família'),
  poi('barcelona', 'Park Güell', 'park', 41.4145, 2.1527, 'Park_Güell'),
  poi('barcelona', 'Casa Batlló', 'landmark', 41.3917, 2.1650, 'Casa_Batlló'),
  poi('barcelona', 'La Rambla', 'market', 41.3797, 2.1746, 'La_Rambla'),
  poi('barcelona', 'Barceloneta Beach', 'beach', 41.3785, 2.1925, 'Barceloneta_Beach'),

  poi('venice', "St Mark's Basilica", 'religious', 45.4345, 12.3397, "St_Mark's_Basilica"),
  poi('venice', 'Rialto Bridge', 'landmark', 45.4380, 12.3358, 'Rialto_Bridge'),
  poi('venice', "Doge's Palace", 'museum', 45.4337, 12.3400, "Doge's_Palace"),
  poi('venice', 'Burano', 'landmark', 45.4853, 12.4167, 'Burano'),

  poi('istanbul', 'Hagia Sophia', 'religious', 41.0086, 28.9802, 'Hagia_Sophia'),
  poi('istanbul', 'Blue Mosque', 'religious', 41.0054, 28.9768, 'Sultan_Ahmed_Mosque'),
  poi('istanbul', 'Topkapı Palace', 'museum', 41.0115, 28.9834, 'Topkapı_Palace'),
  poi('istanbul', 'Grand Bazaar', 'market', 41.0106, 28.9680, 'Grand_Bazaar,_Istanbul'),

  poi('prague', 'Charles Bridge', 'landmark', 50.0865, 14.4114, 'Charles_Bridge'),
  poi('prague', 'Prague Castle', 'landmark', 50.0900, 14.4004, 'Prague_Castle'),
  poi('prague', 'Old Town Square', 'landmark', 50.0875, 14.4213, 'Old_Town_Square'),

  poi('amsterdam', 'Rijksmuseum', 'museum', 52.3600, 4.8852, 'Rijksmuseum'),
  poi('amsterdam', 'Van Gogh Museum', 'museum', 52.3584, 4.8811, 'Van_Gogh_Museum'),
  poi('amsterdam', 'Anne Frank House', 'museum', 52.3752, 4.8840, 'Anne_Frank_House'),
  poi('amsterdam', 'Vondelpark', 'park', 52.3580, 4.8686, 'Vondelpark'),

  /* --------------------------------------------------------------- Americas */
  poi('new-york', 'Statue of Liberty', 'landmark', 40.6892, -74.0445, 'Statue_of_Liberty'),
  poi('new-york', 'Empire State Building', 'viewpoint', 40.7484, -73.9857, 'Empire_State_Building'),
  poi('new-york', 'Central Park', 'park', 40.7829, -73.9654, 'Central_Park'),
  poi('new-york', 'Times Square', 'landmark', 40.7580, -73.9855, 'Times_Square'),
  poi('new-york', 'Metropolitan Museum of Art', 'museum', 40.7794, -73.9632, 'Metropolitan_Museum_of_Art'),
  poi('new-york', 'Brooklyn Bridge', 'landmark', 40.7061, -73.9969, 'Brooklyn_Bridge'),
  poi('new-york', 'John F. Kennedy International Airport', 'airport', 40.6413, -73.7781, 'John_F._Kennedy_International_Airport'),

  poi('san-francisco', 'Golden Gate Bridge', 'landmark', 37.8199, -122.4783, 'Golden_Gate_Bridge'),
  poi('san-francisco', 'Alcatraz Island', 'landmark', 37.8270, -122.4230, 'Alcatraz_Island'),
  poi('san-francisco', 'Fisherman’s Wharf', 'market', 37.8080, -122.4177, "Fisherman's_Wharf,_San_Francisco"),
  poi('san-francisco', 'Muir Woods', 'nature', 37.8927, -122.5716, 'Muir_Woods_National_Monument'),

  poi('grand-canyon', 'Mather Point', 'viewpoint', 36.0616, -112.1077, 'Mather_Point'),
  poi('grand-canyon', 'Bright Angel Trail', 'nature', 36.0575, -112.1435, 'Bright_Angel_Trail'),
  poi('grand-canyon', 'Desert View Watchtower', 'viewpoint', 36.0442, -111.8264, 'Desert_View_Watchtower'),

  poi('machu-picchu', 'Machu Picchu Citadel', 'landmark', -13.1631, -72.5450, 'Machu_Picchu'),
  poi('machu-picchu', 'Huayna Picchu', 'viewpoint', -13.1560, -72.5470, 'Huayna_Picchu'),
  poi('machu-picchu', 'Aguas Calientes', 'transport', -13.1547, -72.5250, 'Aguas_Calientes,_Peru'),

  poi('rio-de-janeiro', 'Christ the Redeemer', 'landmark', -22.9519, -43.2105, 'Christ_the_Redeemer_(statue)'),
  poi('rio-de-janeiro', 'Sugarloaf Mountain', 'viewpoint', -22.9492, -43.1545, 'Sugarloaf_Mountain'),
  poi('rio-de-janeiro', 'Copacabana Beach', 'beach', -22.9711, -43.1822, 'Copacabana,_Rio_de_Janeiro'),
  poi('rio-de-janeiro', 'Ipanema Beach', 'beach', -22.9868, -43.2065, 'Ipanema'),

  poi('mexico-city', 'Teotihuacán', 'landmark', 19.6925, -98.8438, 'Teotihuacan'),
  poi('mexico-city', 'Zócalo', 'landmark', 19.4326, -99.1332, 'Zócalo'),
  poi('mexico-city', 'Frida Kahlo Museum', 'museum', 19.3551, -99.1626, 'Frida_Kahlo_Museum'),
  poi('mexico-city', 'Chapultepec Park', 'park', 19.4204, -99.1819, 'Chapultepec'),

  /* ---------------------------------------------------- Africa & Middle East */
  poi('cairo-giza', 'Great Pyramid of Giza', 'landmark', 29.9792, 31.1342, 'Great_Pyramid_of_Giza'),
  poi('cairo-giza', 'Great Sphinx of Giza', 'landmark', 29.9753, 31.1376, 'Great_Sphinx_of_Giza'),
  poi('cairo-giza', 'Egyptian Museum', 'museum', 30.0478, 31.2336, 'Egyptian_Museum'),
  poi('cairo-giza', 'Khan el-Khalili', 'market', 30.0477, 31.2622, 'Khan_el-Khalili'),

  poi('luxor', 'Karnak Temple', 'landmark', 25.7188, 32.6573, 'Karnak'),
  poi('luxor', 'Valley of the Kings', 'landmark', 25.7402, 32.6014, 'Valley_of_the_Kings'),
  poi('luxor', 'Luxor Temple', 'landmark', 25.6996, 32.6392, 'Luxor_Temple'),

  poi('cape-town', 'Table Mountain', 'viewpoint', -33.9628, 18.4098, 'Table_Mountain'),
  poi('cape-town', 'Cape of Good Hope', 'nature', -34.3568, 18.4740, 'Cape_of_Good_Hope'),
  poi('cape-town', 'Boulders Beach', 'beach', -34.1975, 18.4510, 'Boulders_Beach'),
  poi('cape-town', 'Robben Island', 'landmark', -33.8067, 18.3667, 'Robben_Island'),

  poi('marrakech', 'Jemaa el-Fnaa', 'market', 31.6258, -7.9891, 'Jemaa_el-Fnaa'),
  poi('marrakech', 'Koutoubia Mosque', 'religious', 31.6236, -7.9934, 'Koutoubia_Mosque'),
  poi('marrakech', 'Bahia Palace', 'landmark', 31.6216, -7.9829, 'Bahia_Palace'),
  poi('marrakech', 'Majorelle Garden', 'park', 31.6417, -8.0033, 'Majorelle_Garden'),

  poi('dubai', 'Burj Khalifa', 'viewpoint', 25.1972, 55.2744, 'Burj_Khalifa'),
  poi('dubai', 'Dubai Mall', 'market', 25.1985, 55.2796, 'Dubai_Mall'),
  poi('dubai', 'Palm Jumeirah', 'landmark', 25.1124, 55.1390, 'Palm_Jumeirah'),
  poi('dubai', 'Dubai Frame', 'viewpoint', 25.2356, 55.3003, 'Dubai_Frame'),
  poi('dubai', 'Dubai International Airport', 'airport', 25.2532, 55.3657, 'Dubai_International_Airport'),

  poi('petra', 'The Treasury (Al-Khazneh)', 'landmark', 30.3222, 35.4515, 'Al-Khazneh'),
  poi('petra', 'The Monastery (Ad Deir)', 'landmark', 30.3352, 35.4340, 'Ad_Deir'),

  /* ------------------------------------------------------- Asia & Oceania */
  poi('tokyo', 'Sensō-ji', 'religious', 35.7148, 139.7967, 'Sensō-ji'),
  poi('tokyo', 'Tokyo Skytree', 'viewpoint', 35.7101, 139.8107, 'Tokyo_Skytree'),
  poi('tokyo', 'Shibuya Crossing', 'landmark', 35.6595, 139.7005, 'Shibuya_Crossing'),
  poi('tokyo', 'Meiji Shrine', 'religious', 35.6764, 139.6993, 'Meiji_Shrine'),
  poi('tokyo', 'Tokyo Tower', 'viewpoint', 35.6586, 139.7454, 'Tokyo_Tower'),
  poi('tokyo', 'Ueno Park', 'park', 35.7148, 139.7737, 'Ueno_Park'),
  poi('tokyo', 'Haneda Airport', 'airport', 35.5494, 139.7798, 'Haneda_Airport'),

  poi('kyoto', 'Fushimi Inari-taisha', 'religious', 34.9671, 135.7727, 'Fushimi_Inari-taisha'),
  poi('kyoto', 'Kinkaku-ji', 'religious', 35.0394, 135.7292, 'Kinkaku-ji'),
  poi('kyoto', 'Arashiyama Bamboo Grove', 'nature', 35.0170, 135.6716, 'Arashiyama'),
  poi('kyoto', 'Kiyomizu-dera', 'religious', 34.9949, 135.7850, 'Kiyomizu-dera'),

  poi('singapore', 'Gardens by the Bay', 'park', 1.2816, 103.8636, 'Gardens_by_the_Bay'),
  poi('singapore', 'Merlion Park', 'landmark', 1.2868, 103.8545, 'Merlion'),
  poi('singapore', 'Sentosa', 'beach', 1.2494, 103.8303, 'Sentosa'),
  poi('singapore', 'Singapore Botanic Gardens', 'park', 1.3138, 103.8159, 'Singapore_Botanic_Gardens'),
  poi('singapore', 'Changi Airport', 'airport', 1.3644, 103.9915, 'Singapore_Changi_Airport'),

  poi('bangkok', 'Grand Palace', 'landmark', 13.7500, 100.4913, 'Grand_Palace'),
  poi('bangkok', 'Wat Arun', 'religious', 13.7437, 100.4889, 'Wat_Arun'),
  poi('bangkok', 'Wat Pho', 'religious', 13.7465, 100.4927, 'Wat_Pho'),
  poi('bangkok', 'Chatuchak Weekend Market', 'market', 13.7999, 100.5503, 'Chatuchak_Weekend_Market'),
  poi('bangkok', 'Suvarnabhumi Airport', 'airport', 13.6900, 100.7501, 'Suvarnabhumi_Airport'),

  poi('bali-ubud', 'Tegallalang Rice Terraces', 'nature', -8.4312, 115.2792, 'Tegallalang'),
  poi('bali-ubud', 'Uluwatu Temple', 'religious', -8.8291, 115.0849, 'Uluwatu_Temple'),
  poi('bali-ubud', 'Mount Batur', 'viewpoint', -8.2422, 115.3753, 'Mount_Batur'),
  poi('bali-ubud', 'Tanah Lot', 'religious', -8.6212, 115.0868, 'Tanah_Lot'),

  poi('sydney', 'Sydney Opera House', 'landmark', -33.8568, 151.2153, 'Sydney_Opera_House'),
  poi('sydney', 'Sydney Harbour Bridge', 'landmark', -33.8523, 151.2108, 'Sydney_Harbour_Bridge'),
  poi('sydney', 'Bondi Beach', 'beach', -33.8908, 151.2743, 'Bondi_Beach'),
  poi('sydney', 'Royal Botanic Garden', 'park', -33.8642, 151.2166, 'Royal_Botanic_Garden,_Sydney'),
  poi('sydney', 'Sydney Airport', 'airport', -33.9399, 151.1753, 'Sydney_Airport'),

  poi('queenstown', 'Lake Wakatipu', 'nature', -45.0470, 168.6350, 'Lake_Wakatipu'),
  poi('queenstown', 'Skyline Gondola', 'viewpoint', -45.0290, 168.6533, 'Skyline_Queenstown'),
  poi('queenstown', 'Kawarau Bridge', 'landmark', -45.0000, 168.8000, 'Kawarau_Gorge_Suspension_Bridge'),

  poi('beijing', 'Forbidden City', 'landmark', 39.9163, 116.3972, 'Forbidden_City'),
  poi('beijing', 'Great Wall at Mutianyu', 'landmark', 40.4319, 116.5704, 'Mutianyu'),
  poi('beijing', 'Temple of Heaven', 'religious', 39.8822, 116.4066, 'Temple_of_Heaven'),
  poi('beijing', 'Tiananmen Square', 'landmark', 39.9055, 116.3976, 'Tiananmen_Square'),
];

export const poiByDestination = pointsOfInterest.reduce((acc, item) => {
  if (!acc[item.destination]) acc[item.destination] = [];
  acc[item.destination].push(item);
  return acc;
}, {});

export function poisFor(slug) {
  return poiByDestination[slug] || [];
}

export default pointsOfInterest;
