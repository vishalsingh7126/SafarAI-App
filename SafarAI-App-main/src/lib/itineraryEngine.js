/**
 * Itinerary engine — destination/style templates preserved verbatim from
 * the original Trip Planner implementation, extracted so the planner UI and
 * other surfaces (assistant, dashboard) can share one generator.
 */

export const STYLE_OPTIONS = [
  { value: 'adventure', label: 'Adventure' },
  { value: 'relaxation', label: 'Relaxation' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'food', label: 'Food' },
  { value: 'nature', label: 'Nature' },
];


export const STYLE_ICONS = {
  adventure: '🏔️',
  relaxation: '🌊',
  cultural: '🏛️',
  food: '🍜',
  nature: '🌿',
};

// Mock itinerary database keyed by destination keyword + style + days
export function generateItinerary(destination, days, style) {
  const dest = destination.trim().toLowerCase();
  const num = parseInt(days, 10);

  // Destination-specific templates
  const templates = {
    goa: {
      adventure: [
        'Water sports at Baga Beach — parasailing, jet skiing, and banana boat rides',
        'Trek through Cotigao Wildlife Sanctuary and night camping',
        'Scuba diving at Grande Island and kayaking at Mandovi River',
        'ATV trail ride through Bondla Wildlife Sanctuary',
        'Rock climbing at Dudhsagar Falls base and rafting on Mhadei River',
        'Surfing lessons at Ashwem Beach and cliff jumping at Cola Beach',
        'Mountain biking through spice plantation backroads to Tambdi Surla',
      ],
      relaxation: [
        'Sunrise yoga at Anjuna Beach and spa session at a beach resort',
        'Lazy afternoon at Palolem Beach with sunset cruise on the backwaters',
        'Ayurvedic wellness treatment and evening stroll at Candolim Beach',
        'Silent beach day at Cabo de Rama and candlelight dinner by the sea',
        'Hammock day at Agonda Beach and meditation at a beachside retreat',
        'Houseboat stay on Sal River and floating breakfast experience',
        'Day spa at Vagator cliffs and moonlit walk on Morjim Beach',
      ],
      cultural: [
        'Se Cathedral, Basilica of Bom Jesus, and the Chapel of St. Francis of Assisi in Old Goa',
        'Walking tour of Fontainhas Latin Quarter and Goa State Museum in Panaji',
        'Ancestral Goa museum in Loutolim and Shantadurga Temple visit',
        'Spice plantation tour with traditional Goan lunch and folk performance',
        'Goa Carnival parade and street art walk through Siolim village',
        'Tile painting workshop and visit to Goa Chitra ethnographic museum',
        'Attending a Konkani theatre show and heritage walk through Chandor mansions',
      ],
      food: [
        "Breakfast at Cafe Bhosle for poha and xacuti, fish curry rice at Martin's Corner",
        'Seafood trail — crab xec xec at Ritz Classic and prawn balchão at Vinayak Family Restaurant',
        'Goan sausage pão at Mapusa market and bebinca tasting at local bakeries',
        'Cashew feni distillery tour with local tasting session at Sal Valley',
        'Cooking class — fish recheado and sol kadhi at a homestay in Benaulim',
        'Street food crawl through Anjuna flea market and Goa Velha village feast',
        'Breakfast at Cafe Tato, lunch at Fisherman\'s Wharf, dinner at Caravela',
      ],
      nature: [
        'Dudhsagar Falls day trip through Bhagwan Mahavir Wildlife Sanctuary',
        'Cotigao Wildlife Sanctuary birdwatching walk and mangrove kayaking at Chorao Island',
        'Butterfly conservatory at Bondla and nature trail at Netravali Wildlife Sanctuary',
        'Sunrise hike to Sada viewpoint and boat safari on Zuari mangroves',
        'Wetland birding at Carambolim Lake and spice farm nature walk',
        'Night safari at Bhagwan Mahavir Sanctuary and firefly trek near Valpoi',
        'Forest walk at Mollem National Park and dusk photography at Anjuna headland',
      ],
    },
    delhi: {
      adventure: [
        'Rock climbing at Aravalli foothills and go-karting at Leisure Valley, Gurgaon',
        'Cycling tour of Old Delhi narrow lanes and rooftop parkour at Hauz Khas Village',
        'Zipline and rappelling at Adventure Island, Rohini',
        'Trekking trail at Asola Bhatti Wildlife Sanctuary and bouldering at Delhi Rock',
        'White-water rafting day trip to Rishikesh from Delhi',
        'Archery range at Karnataka Sangha and martial arts experience at Siri Fort',
        'Hot air balloon over Qutub Minar area at dawn',
      ],
      relaxation: [
        'Morning walk at Lodhi Garden and afternoon tea at The Imperial hotel',
        'Meditation session at Lotus Temple and leisurely row boat at Garden of Five Senses',
        'Khan Market café hopping and sunset at India Gate lawns',
        'Spa day at a Hauz Khas boutique hotel and evening jazz at Piano Man',
        'Sunday morning book market at Daryaganj and lazy afternoon at Sunder Nursery',
        'Saket mall aromatherapy and foot massage at Connaught Place wellness studio',
        'Early morning Yamuna Biodiversity Park walk followed by rooftop brunch',
      ],
      cultural: [
        'Red Fort, Jama Masjid, and Chandni Chowk heritage walk',
        'Humayun\'s Tomb, Purana Qila, and Crafts Museum exploration',
        'Qutub Minar complex and Mehrauli Archaeological Park',
        'National Museum and Gandhi Smriti memorial visit',
        'Akshardham Temple evening and National Rail Museum',
        'Agrasen ki Baoli, Jantar Mantar, and Rashtrapati Bhavan gardens',
        'Partition Museum at Town Hall and Lodi Colony street art walk',
      ],
      food: [
        'Paranthe Wali Gali breakfast, butter chicken at Moti Mahal, and chaat at Bengali Market',
        'Karim\'s lunch in Old Delhi and Punjabi by Nature dinner in Connaught Place',
        'INA market food exploration and Japanese at Shiro',
        'Sarojini Nagar street food and dinner at Bukhara, ITC Maurya',
        'Sunday ke chole bhature at Sita Ram Dhiyan Chand and kebabs at Al Jawahar',
        'Delhi food walk through Lajpat Nagar and gol gappa challenge at Chandni Chowk',
        'Breakfast at Wenger\'s, lunch at Gulati in Pandara Road, and dessert at Roshan di Kulfi',
      ],
      nature: [
        'Sunrise birdwatching at Okhla Bird Sanctuary and Sunder Nursery nature walk',
        'Yamuna Biodiversity Park trail and Deer Park stroll in Hauz Khas',
        'Tughlaqabad nature trails and Asola Bhatti Wildlife Sanctuary',
        'Aravalli Biodiversity Park cycling and Lodhi Garden picnic',
        'Delhi Ridge Forest walk and rose garden at Nehru Park',
        'Butterfly Park at Bhalswa and wetland walk near Sultanpur Bird Sanctuary',
        'Dawn fog walk at Mehrauli Archaeological Park and tree photography tour',
      ],
    },
    mumbai: {
      adventure: [
        'Sea kayaking from Versova Beach to Gorai and cliff walk at Sanjay Gandhi park',
        'Rock climbing at Vihar Lake sector and night cycling on Bandra sea link approach',
        'Trekking to Karnala Bird Sanctuary and rappelling at Matheran day trip',
        'Scuba diving off Alibag coast and windsurfing at Manori',
        'Urban parkour in Dharavi rooftop area and bouldering at Borivali',
        'Paragliding at Kamshet day trip and jet skiing at Aksa Beach',
        'Night fishing adventure with local fishermen at Versova',
      ],
      relaxation: [
        'Marine Drive sunrise walk and breakfast at Kyani & Co. in Dhobi Talao',
        'Juhu Beach sunset and foot massage at a Bandra wellness studio',
        'Afternoon at the rooftop pool of Taj Lands End and high tea at Dome',
        'Sanjay Gandhi National Park butterfly trail and Powai lake cafés',
        'Lazy day at Carter Road promenade and jazz evening at Blue Frog',
        'Ayurvedic spa at Colaba boutique hotel and moon walk on Gorai Beach',
        'Sunrise at Bandstand and leisurely Bandra–Worli cycling along the sea link view',
      ],
      cultural: [
        'Chhatrapati Shivaji Maharaj Vastu Sangrahalaya and Elephanta Caves ferry trip',
        'Dharavi slum art tour and Chor Bazaar antique walk',
        'Knesset Eliyahoo Synagogue, St. Thomas Cathedral, and CST heritage architecture walk',
        'Dr. Bhau Daji Lad Museum in Byculla and Banganga Tank village',
        'Bollywood studio tour at Film City, Goregaon',
        'Prithvi Theatre evening and Juhu temple trail',
        'East Indian village walk at Manori and Koli fishing community visit at Versova',
      ],
      food: [
        'Vada pav trail — from Ashok Vada Pav to Shivaji Park, ending at Café Madras idli',
        'Lunch at Britannia & Co. for berry pulao, evening at Leopold Café',
        'Kebab walk in Mohammed Ali Road and Khau Galli at Ghatkopar',
        'Brunch at The Table, Colaba and seafood dinner at Trishna',
        'Sunday Khotachiwadi homestay breakfast and Mangalorean lunch at Hotel Deluxe',
        'Irani café tour — Café Irani Chaii, Lucky, and Stadium Café near Churchgate',
        'Maharashtra thali at Aaswad in Dadar and kokum sherbet at Crawford Market',
      ],
      nature: [
        'Sanjay Gandhi National Park lion and leopard safari and Kanheri Caves hike',
        'Flamingo watching at Sewri mudflats and Thane creek mangroves',
        'Powai Lake birdwatching and Aarey Colony butterfly trail',
        'Elephanta Island nature walk and tide pool exploration at Versova',
        'Tungareshwar Wildlife Sanctuary trek and waterfall photography season',
        'Mangrove boardwalk at Vikhroli and migratory bird counting at Bhandup pumping station',
        'Dawn walk at Goregaon Film City lake and dusk photography at Bandra fort shoreline',
      ],
    },
  };

  // Generic fallback itinerary based on style
  const genericByStyle = {
    adventure: [
      `Arrive in ${destination} — check in and orientation trek to local viewpoint`,
      `White-water rafting on the nearest river followed by zip-line canopy tour`,
      `Rock climbing and rappelling at a nearby valley; evening bonfire`,
      `Mountain biking trail through scenic countryside and wildlife spotting`,
      `Paragliding at sunrise launch site and waterfall hike in the afternoon`,
      `Kayaking and canyoning full-day excursion outside ${destination}`,
      `Departure day — sunrise hike to a panoramic summit before check-out`,
    ],
    relaxation: [
      `Check in, spa welcome ritual, and sunset stroll through ${destination} old town`,
      `Yoga at dawn, leisurely breakfast, and afternoon at a wellness retreat`,
      `Hot spring soak or hammam and a curated garden walk`,
      `Lazy lake or beach day with a book; candlelight dinner`,
      `Guided meditation session followed by a rooftop dinner experience`,
      `Leisure cruise or boat ride and evening live acoustic music`,
      `Breakfast in bed, slow morning market visit, and farewell high tea`,
    ],
    cultural: [
      `Arrive in ${destination} — walking tour of the historic old quarter and local museum`,
      `Visit heritage temples or colonial architecture; traditional craft workshop`,
      `Guided archaeological site tour and local performing arts evening`,
      `Regional cuisine cooking class and visit to the central bazaar`,
      `Cultural centre tour and meeting a local artisan community`,
      `Folklore storytelling experience and visit to a heritage mansion`,
      `Morning at a weekly market; farewell cultural show or concert`,
    ],
    food: [
      `Arrive in ${destination} — street food welcome walk and iconic snack tasting`,
      `Breakfast at the best local café; seafood or regional feast for lunch`,
      `Cooking class learning two traditional dishes; local spice market visit`,
      `Food truck crawl or night market; craft brewery or winery tour`,
      `Farm-to-table lunch experience; fine dining at a top-rated local restaurant`,
      `Chaat and roadside delicacies tour; visit to the wholesale food market at dawn`,
      `Final breakfast at the most iconic local eatery; sweet treat souvenir shopping`,
    ],
    nature: [
      `Arrive in ${destination} — evening nature walk and birdwatching at the nearby sanctuary`,
      `Guided wildlife safari or forest trail at sunrise; butterfly garden visit`,
      `Waterfall hike and river swim; campfire cooking under the stars`,
      `Botanical garden tour and endemic plant identification walk`,
      `River kayaking and wetland photography golden hour session`,
      `Mountain or valley trek with packed lunch; star-gazing at night`,
      `Departure day — sunrise at a scenic viewpoint with local naturalist guide`,
    ],
  };

  // Pick template or fallback
  let dayPool;
  const destKey = Object.keys(templates).find((k) => dest.includes(k));
  if (destKey && templates[destKey][style]) {
    dayPool = templates[destKey][style];
  } else {
    dayPool = genericByStyle[style] || genericByStyle.cultural;
  }

  return Array.from({ length: num }, (_, i) => ({
    day: i + 1,
    title: `Day ${i + 1}`,
    activities: dayPool[i] || `Explore ${destination} at your own pace — visit local markets and hidden gems.`,
  }));
}

export const DAY_COLORS = [
  'from-brand-600 to-accent-500',
  'from-accent-500 to-brand-500',
  'from-brand-500 to-brand-700',
  'from-accent-600 to-accent-400',
  'from-brand-700 to-accent-600',
  'from-accent-400 to-brand-600',
  'from-brand-600 to-brand-400',
];

export const DAY_PART_LABELS = ['Morning', 'Afternoon', 'Evening'];

export function formatTimelineActivities(activityText) {
  const cleaned = (activityText || '').trim();
  if (!cleaned) return [{ label: 'Plan', text: 'Explore local highlights.' }];

  const parts = cleaned
    .split(/\s*—\s*|\s*;\s*|,\s*|\s+and\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (parts.length <= 1) {
    return [{ label: 'Plan', text: parts[0] || cleaned }];
  }

  return parts.map((part, index) => ({
    label: DAY_PART_LABELS[index] || `Part ${index + 1}`,
    text: part.charAt(0).toUpperCase() + part.slice(1),
  }));
}
