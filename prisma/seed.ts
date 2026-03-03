import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Global aircraft — seeded into GlobalAircraft table (shared, not per-user)
const GLOBAL_AIRCRAFT = [
  { name: 'Cessna 182', sortOrder: 0 },
  { name: 'Cessna 208 Caravan', sortOrder: 1 },
  { name: 'DHC-6 Twin Otter', sortOrder: 2 },
  { name: 'PAC 750XL', sortOrder: 3 },
  { name: 'CASA 212', sortOrder: 4 },
  { name: 'Pilatus PC-6 Porter', sortOrder: 5 },
  { name: 'Beechcraft King Air', sortOrder: 6 },
  { name: 'Shorts Skyvan', sortOrder: 7 },
  { name: 'Dornier 228', sortOrder: 8 },
  { name: 'Let L-410 Turbolet', sortOrder: 9 },
  { name: 'Antonov An-28', sortOrder: 10 },
  { name: 'Douglas DC-3', sortOrder: 11 },
]

// Global jump types — seeded into GlobalJumpType table (shared, not per-user)
const GLOBAL_JUMP_TYPES = [
  { name: 'Freefall', sortOrder: 0 },
  { name: 'AFF (Level)', sortOrder: 1 },
  { name: 'Belly Flying', sortOrder: 2 },
  { name: 'Freefly', sortOrder: 3 },
  { name: 'Wingsuit', sortOrder: 4 },
  { name: 'Tracking', sortOrder: 5 },
  { name: 'Angle', sortOrder: 6 },
  { name: 'Canopy Piloting / Swooping', sortOrder: 7 },
  { name: 'BASE', sortOrder: 8 },
  { name: 'Water Jump', sortOrder: 9 },
  { name: 'Demo Jump', sortOrder: 10 },
]

// Default aircraft types - sorted alphabetically
const DEFAULT_AIRCRAFT = [
  'Antonov AN-2',
  'Beechcraft King Air',
  'Bell 206 JetRanger',
  'Bell 407',
  'CASA C-212',
  'Cessna 172 Skyhawk',
  'Cessna 180',
  'Cessna 182',
  'Cessna 185',
  'Cessna 206',
  'Cessna 208 Caravan',
  'Dornier G92',
  'Eurocopter AS350',
  'Hot Air Balloon',
  'PAC 750XL',
  'Pilatus PC-6 Porter',
  'Quest Kodiak 100',
  'Robinson R44',
  'Short SC.7 Skyvan',
  'SMG-92 Turbo Finist',
  'Twin Otter',
  'Vulcanair P68',
  'Yakovlev Yak-12',
]

// Default jump types - sorted alphabetically
const DEFAULT_JUMP_TYPES = [
  'AFF',
  'Angle / Tracking',
  'CRW',
  'Freefly',
  'High Pull',
  'Hop & Pop',
  'Hybrid',
  'Relative Work',
  'Speed',
  'Tandem',
  'Wingsuit',
]

// Default dropzones - comprehensive worldwide list
const DEFAULT_DROPZONES = [
  { name: 'Above The Poconos Skydivers PA Skydive Center', country: 'United States', city: 'Wilkes-Barre PA', address: 'Hazleton Regional Airport 22 miles south of Wilkes-Barre', currency: 'USD' },
  { name: 'Abu Dhabi Skydive', country: 'United Arab Emirates', city: 'Abu Dhabi', address: 'Abu Dhabi Sports Aviation Club Airport 45 km northeast of Abu Dhabi', currency: 'AED' },
  { name: 'Aerohio Skydiving Center', country: 'United States', city: 'Ashland OH', address: 'Ashland County Airport 5 miles northeast of Ashland', currency: 'USD' },
  { name: 'Air Bears - Skydiving Club at Berkeley', country: 'United States', city: 'Berkeley CA', address: 'Yolo County Airport (530) 775-1437', currency: 'USD' },
  { name: 'Air Play Parachutisme', country: 'France', city: 'Cannes', address: 'Fayence-Tourettes Airfield 24 km northwest of Cannes', currency: 'EUR' },
  { name: 'Airborne Petawawa', country: 'Canada', city: 'Petawawa', address: 'Pembroke Area Airport 2 km south of Petawawa', currency: 'CAD' },
  { name: 'Aircrew & Airfox Skydiving Academy', country: 'Germany', city: 'Frankfurt', address: '60 km south of Mainz', currency: 'EUR' },
  { name: 'Aire Skydive', country: 'Colombia', city: 'Medellin', address: 'EOH Airport Yolombo Antioquia 50 km northeast of Medellin', currency: 'COP' },
  { name: 'Alaska Skydive Center', country: 'United States', city: 'Anchorage AK', address: 'Palmer Municipal Airport 44 miles north of Anchorage', currency: 'USD' },
  { name: 'Alberta Skydive Central', country: 'Canada', city: 'Edmonton', address: 'Westlock Airport 100 km north of Edmonton', currency: 'CAD' },
  { name: 'Alliance Sport Parachute Club', country: 'United States', city: 'Pittsburgh PA', address: 'Petersburg Airport 30 miles northwest of Pittsburgh', currency: 'USD' },
  { name: 'Bay Area Skydiving', country: 'United States', city: 'San Francisco CA', address: 'Byron Airport 46 miles east of San Francisco', currency: 'USD' },
  { name: 'Beni Mellal DZ', country: 'Morocco', city: 'Beni Mellal', address: 'Beni Mellal Airport 5 km west of Beni Mellal', currency: 'MAD' },
  { name: 'Big Island Gravity', country: 'United States', city: 'Kailua Kona HI', address: 'Upolu Airport Hawi 46 miles north of Kailua Kona', currency: 'USD' },
  { name: 'Blue Skies Skydiving Club', country: 'United States', city: 'Indianapolis IN', address: 'Frankfort Municipal Airport 25 miles north of Indianapolis', currency: 'USD' },
  { name: 'Blue Sky Ranch', country: 'United States', city: 'New York NY', address: 'Gardiner Airport 65 miles north of New York City', currency: 'USD' },
  { name: 'Body Fly University', country: 'Italy', city: 'Reggio Emilia', address: 'Teodore Airport 10 km east of Reggio Emilia', currency: 'EUR' },
  { name: 'Boston Skydive Center', country: 'United States', city: 'Providence RI', address: 'North Central State Airport Smithfield 10 miles north of Providence', currency: 'USD' },
  { name: 'BT Chengdu Skydive', country: 'China', city: 'Chengdu', address: 'Chengzhou Haoyun Airport Chengdu Chongzhou 40 km west of Chengdu', currency: 'CNY' },
  { name: 'Canton Air Sports', country: 'United States', city: 'Akron OH', address: 'Barber Airport Alliance 26 miles east of Akron', currency: 'USD' },
  { name: 'Chattanooga Skydiving Company', country: 'United States', city: 'Chattanooga TN', address: 'Marion County Airport Jasper 20 miles west of Chattanooga', currency: 'USD' },
  { name: 'Chicagoland Skydiving Center', country: 'United States', city: 'Rochelle IL', address: 'Rochelle Municipal Airport 61 miles south of Chicago', currency: 'USD' },
  { name: 'Chicagoland Skydiving Center', country: 'United States', city: 'Chicago IL', address: 'Krentz Field Rochelle 70 miles west of Chicago', currency: 'USD' },
  { name: 'China Skydivers-Yingfei', country: 'China', city: 'Guangzhou', address: 'Tiantang Airport Guangdong 130 km west of Guangzhou', currency: 'CNY' },
  { name: 'Cleveland Skydiving Center', country: 'United States', city: 'Cleveland OH', address: 'Gates Airport Garrettsville 30 miles southeast of Cleveland', currency: 'USD' },
  { name: 'Cloud Chasers', country: 'United States', city: 'Slidell LA', address: 'Slidell Municipal Airport 4.6 miles west of Slidell', currency: 'USD' },
  { name: 'Complete Parachute Solutions Bishop', country: 'United States', city: 'Bishop CA', address: 'Bishop Airport Mobile (760) 872-1194', currency: 'USD' },
  { name: 'Complete Parachute Solutions Tactical Training Facility', country: 'United States', city: 'Coolidge AZ', address: 'Coolidge Municipal Airport 50 miles south of Phoenix', currency: 'USD' },
  { name: 'Condor de los Andes', country: 'Ecuador', city: 'Quito', address: 'Pista La Celeste Airport La Concordia 150 km northwest of Quito', currency: 'USD' },
  { name: 'Connecticut Parachutists Inc.', country: 'United States', city: 'Hartford CT', address: 'Ellington Airport 23 miles northeast of Hartford', currency: 'USD' },
  { name: 'Crystal Coast Skydiving', country: 'United States', city: 'Beaufort NC', address: 'Michael J Smith Field Beaufort 1 mile north of Beaufort', currency: 'USD' },
  { name: 'Des Moines Skydivers', country: 'United States', city: 'Des Moines IA', address: 'Knoxville Municipal Airport 35 miles southeast of Des Moines', currency: 'USD' },
  { name: 'Desafio Vertical', country: 'Costa Rica', city: 'Jaco', address: 'Tambor 12 km southwest of Jaco', currency: 'CRC' },
  { name: 'Dropzone Denmark', country: 'Denmark', city: 'Aarhus', address: 'Herning Airport 60 km west of Aarhus', currency: 'DKK' },
  { name: 'Dropzone Prostejov', country: 'Czech Republic', city: 'Brno', address: 'Prostejov Airport 60 km north of Brno', currency: 'CZK' },
  { name: 'Dropzone Thailand Co. Ltd', country: 'Thailand', city: 'Bangkok', address: 'Dropzone Airfield Klaeng District 8 km southwest of Rayong District', currency: 'THB' },
  { name: 'DZ Pribram', country: 'Czech Republic', city: 'Prague', address: 'Pribram 40 km south of Prague', currency: 'CZK' },
  { name: 'DZONE Skydiving-Boise', country: 'United States', city: 'Boise ID', address: 'Parma Municipal Airport 30 miles west of Boise', currency: 'USD' },
  { name: 'DZONE Skydiving-Bozeman', country: 'United States', city: 'Bozeman MT', address: 'Fairfield Airport Three Forks 17 miles west of Bozeman', currency: 'USD' },
  { name: 'Eagles Skydive Sri Lanka-Koggala', country: 'Sri Lanka', city: 'Koggala', address: 'Air Force Station Koggala Galle 2.2 km south of Koggala', currency: 'LKR' },
  { name: 'Ecole de Parachutisme de Chateau-d\'Oex', country: 'Switzerland', city: 'Geneva', address: 'Aerodrome de la Gruyere 120 km northeast of Geneva', currency: 'CHF' },
  { name: 'Elevate Skydive', country: 'Mexico', city: 'Cuautla', address: 'Elevate Private Airstrip Cuauhtemoc 9 km south of Colima', currency: 'MXN' },
  { name: 'Epico Skydive', country: 'Colombia', city: 'Barranquilla', address: 'Aeropuerto Las Campanos Barranquilla 20 km west of Barranquilla', currency: 'COP' },
  { name: 'Eugene Skydive', country: 'United States', city: 'Eugene OR', address: 'Hobby Field Airport Creswell 10 miles south of Eugene', currency: 'USD' },
  { name: 'Falcon Skydiving', country: 'United States', city: 'Kansas City MO', address: 'Mauhs Ark Airport Kansas City 15 miles northwest of Kansas City', currency: 'USD' },
  { name: 'Fano Sky Team S.S.D.', country: 'Italy', city: 'Ancona', address: 'Fano Airport 40 km north of Ancona Airport', currency: 'EUR' },
  { name: 'Federacao Paulista De Paraquedismo', country: 'Brazil', city: 'Boituva', address: 'Aeroporto De Boituva 117 km south of Boituva', currency: 'BRL' },
  { name: 'Flight Providers LLC', country: 'United States', city: 'Springfield MO', address: 'M Graham Clark Niorth of Springfield', currency: 'USD' },
  { name: 'Florida Skydive', country: 'United States', city: 'Coleman FL', address: 'Central Florida Airpark Coleman 54 miles southeast of Orlando', currency: 'USD' },
  { name: 'Fly 974 Tandem', country: 'France', city: 'Saint Pierre Reunion', address: 'Aeroport de Pierrefonds Saint Pierre Reunion 80 km south of Saint Denis', currency: 'EUR' },
  { name: 'Flying Tigers Sport Parachute Center', country: 'United States', city: 'Anderson SC', address: 'Anderson Regional Airport 2 miles west of Anderson', currency: 'USD' },
  { name: 'FSC Suedpfalz E.V.', country: 'Germany', city: 'Frankfurt', address: 'Schweighofen Airport Rheinland-Pfalz 140 km southwest of Frankfurt', currency: 'EUR' },
  { name: 'Fyrosity', country: 'United States', city: 'Overton NV', address: 'Perkins Field Airport Overton 60 miles northeast of Las Vegas', currency: 'USD' },
  { name: 'Go Jump Kenya', country: 'Kenya', city: 'Mombasa', address: 'Vipingo Ridge Airport Mombasa 26 km north of Mombasa', currency: 'KES' },
  { name: 'GoJump Hawaii', country: 'United States', city: 'Honolulu HI', address: 'Kawaihapai Airfield Honolulu 40 miles north of Honolulu', currency: 'USD' },
  { name: 'GoJump Las Vegas', country: 'United States', city: 'Las Vegas NV', address: 'Jean Airport 20 miles south of Las Vegas', currency: 'USD' },
  { name: 'GoJump Oceanside', country: 'United States', city: 'Oceanside CA', address: 'Oceanside Airport 38 miles north of San Diego', currency: 'USD' },
  { name: 'GoJump Oceanside', country: 'United States', city: 'San Diego CA', address: 'Oceanside Airport 38 miles north of San Diego', currency: 'USD' },
  { name: 'Hellenic Skydivers', country: 'Greece', city: 'Athens', address: 'Thiva Perneri Airfield Athens 65 km north of Athens', currency: 'EUR' },
  { name: 'High Sky Adventure Parachute Club', country: 'United States', city: 'Canon City CO', address: 'Fremont County Airport Penrose 8 miles west of Canon City', currency: 'USD' },
  { name: 'iJump Gran Canaria', country: 'Spain', city: 'Las Palmas de Gran Canaria', address: 'Aerodromo El Berriel Las Palmas de Gran Canaria 47 km south of Las Palmas de Gran Canaria', currency: 'EUR' },
  { name: 'International Pink Parachute Club', country: 'Czech Republic', city: 'Prague', address: 'Skydive Pink Klatovy 60 km west of Prague', currency: 'CZK' },
  { name: 'Irish Parachute Club Ltd.', country: 'Ireland', city: 'Dublin', address: 'Clonbullogue Airfield Offaly 64 km southwest of Dublin', currency: 'EUR' },
  { name: 'iSkydive America - Charlevoix', country: 'United States', city: 'Traverse City MI', address: 'Charlevoix Municipal Airport 37 miles north of Traverse City', currency: 'USD' },
  { name: 'iSkydive America - Dallas', country: 'United States', city: 'Dallas TX', address: 'Ennis Municipal Airport 30 miles south of Dallas', currency: 'USD' },
  { name: 'iSkydive America - Detroit', country: 'United States', city: 'East Lansing MI', address: 'Maple Grove Airport Fowlerville 20 miles east of East Lansing', currency: 'USD' },
  { name: 'iSkydive America - Los Angeles', country: 'United States', city: 'Los Angeles CA', address: 'Helendale Airport 30 miles east of Los Angeles', currency: 'USD' },
  { name: 'iSkydive America - New York City', country: 'United States', city: 'New York City NY', address: 'Greenwood Lake Airport West Milford 35 miles north of New York City', currency: 'USD' },
  { name: 'iSkydive America - Washington D.C.', country: 'United States', city: 'Washington DC', address: 'Warrenton Fauquier County Airport Midland 50 miles southwest of Warrenton', currency: 'USD' },
  { name: 'Jump Florida Skydiving', country: 'United States', city: 'Orlando FL', address: 'Lake Wales Airport 39 miles southwest of Orlando', currency: 'USD' },
  { name: 'Jump Georgia Skydiving', country: 'United States', city: 'Savannah GA', address: 'Plantation Airpark Sylvania 42 miles northwest of Savannah', currency: 'USD' },
  { name: 'Jump Omaha', country: 'United States', city: 'Plattsmouth NE', address: 'Plattsmouth Municipal Airport Plattsmouth 20 miles south of Omaha', currency: 'USD' },
  { name: 'Jump TN', country: 'United States', city: 'Greeneville TN', address: 'Greeneville Municipal Airport 2 miles north of Greeneville', currency: 'USD' },
  { name: 'Jumptown/MSRC Inc.', country: 'United States', city: 'Boston MA', address: 'Orange Municipal Airport 75 miles west of Boston', currency: 'USD' },
  { name: 'Just Jump Skydiving', country: 'United States', city: 'Norwich NY', address: 'Lt Warren Eaton Airport Norwich 4 miles south of Norwich', currency: 'USD' },
  { name: 'Kansas State University Parachute Club', country: 'United States', city: 'Salina KS', address: 'Abilene Municipal Airport 20 miles east of Salina', currency: 'USD' },
  { name: 'Kapowsin Air Sports', country: 'United States', city: 'Olympia WA', address: 'Sanderson Field Shelton 26 miles north of Olympia', currency: 'USD' },
  { name: 'Krutitcy', country: 'Russia', city: 'Moscow', address: 'Krutitcy Airbase Shilovo 300 km southeast of Moscow', currency: 'RUB' },
  { name: 'Kuwait Skydive & Fly', country: 'Kuwait', city: 'Kuwait City', address: 'Al Khiran 60 km south of Kuwait City', currency: 'KWD' },
  { name: 'Lincoln Sport Parachute Club', country: 'United States', city: 'Lincoln NE', address: 'Browne Airport Weeping Water 40 miles south of Omaha', currency: 'USD' },
  { name: 'Long Island Skydiving Center', country: 'United States', city: 'New York NY', address: 'Brookhaven Airport Shirley 50 miles east of New York City', currency: 'USD' },
  { name: 'Los Garrapateros Paracaidismo', country: 'Ecuador', city: 'Guayaquil', address: 'Los Bancos-San Vicente 362 km north of Guayaquil', currency: 'USD' },
  { name: 'Malone Parachute Club', country: 'United States', city: 'Burlington VT', address: 'Franklin County Airport 30 miles north of Burlington', currency: 'USD' },
  { name: 'Maui Skydiving', country: 'United States', city: 'Kahului HI', address: 'Hana Airport 3 miles east of Kahului', currency: 'USD' },
  { name: 'Maytown Sport Parachute Club', country: 'United States', city: 'Harrisburg PA', address: 'Donegal Springs Airport Marietta 20 miles east of Harrisburg', currency: 'USD' },
  { name: 'Meadow Peak Skydiving', country: 'United States', city: 'Kalispell MT', address: 'Glacier Field Airport 29 miles southwest of Kalispell', currency: 'USD' },
  { name: 'Miami Skydiving Center', country: 'United States', city: 'Miami FL', address: 'Tamiami Airport Miami 15 miles south of Miami International Airport', currency: 'USD' },
  { name: 'Mid-America Sport Parachute Club', country: 'United States', city: 'Springfield IL', address: 'Taylorville Municipal Airport 30 miles south of Springfield', currency: 'USD' },
  { name: 'Midwest Freefall Sport Parachute Club Inc.', country: 'United States', city: 'Detroit MI', address: 'Kuntzmans Airfield Ray 20 miles northeast of Detroit', currency: 'USD' },
  { name: 'Mile-Hi Skydiving Center Inc.', country: 'United States', city: 'Denver CO', address: 'Vance Brand Airport Longmont 25 miles northwest of Denver', currency: 'USD' },
  { name: 'Military Freefall Solutions Inc.', country: 'United States', city: 'Yuma AZ', address: 'Blythe 100 miles east of Yuma AZ', currency: 'USD' },
  { name: 'Music City Skydiving', country: 'United States', city: 'Nashville TN', address: 'Humphreys County Airport Waverly 60 miles west of Nashville', currency: 'USD' },
  { name: 'No Limits Skydiving - Victoria', country: 'United States', city: 'Victoria TX', address: 'Luening County Airport Victoria 42 miles south of Charlottesville', currency: 'USD' },
  { name: 'No Limits Skydiving - West Point', country: 'United States', city: 'Richmond VA', address: 'Middle Peninsula Regional Airport Mattaponi 35 miles east of Richmond', currency: 'USD' },
  { name: 'NorCal Skydiving', country: 'United States', city: 'San Francisco CA', address: 'Cloverdale Municipal Airport 80 miles north of San Francisco', currency: 'USD' },
  { name: 'Ogden Skydiving Center', country: 'United States', city: 'Salt Lake City UT', address: 'Ogden-Hinckley Airport 30 miles north of Salt Lake City', currency: 'USD' },
  { name: 'Oklahoma Skydiving Center', country: 'United States', city: 'Oklahoma City OK', address: 'Cushing Municipal Airport 45 miles northeast of Oklahoma City', currency: 'USD' },
  { name: 'Olimpic Skydive', country: 'Poland', city: 'Wroclaw', address: 'Mirosławice Airport 25 km south of Wroclaw', currency: 'PLN' },
  { name: 'Orange Skies Free Fall Center', country: 'United States', city: 'Denver CO', address: 'Fort Morgan Municipal Airport 80 miles northeast of Denver', currency: 'USD' },
  { name: 'Ozarks Skydive Center', country: 'United States', city: 'Springfield MO', address: 'Kingsley Field Miller 30 miles west of Springfield', currency: 'USD' },
  { name: 'Pacific Coast Skydiving', country: 'United States', city: 'San Diego CA', address: 'Brown Field 10 miles south of downtown San Diego', currency: 'USD' },
  { name: 'Pacific Northwest Skydiving Center', country: 'United States', city: 'Portland OR', address: 'Mulino State Airport 20 miles south of Portland', currency: 'USD' },
  { name: 'Paracaidismo Alta Gracia', country: 'Argentina', city: 'Cordoba', address: 'Alta Gracia Municipal Airport Cordoba 2 km east of Alta Gracia', currency: 'ARS' },
  { name: 'Paracaidismo Paracondor Peru', country: 'Peru', city: 'Lima', address: 'Lib Mandi Lima 49 km south of Lima', currency: 'PEN' },
  { name: 'Paracentrum Texel', country: 'Netherlands', city: 'Amsterdam', address: 'Texel Airport de Cocksdorp 100 km north of Amsterdam', currency: 'EUR' },
  { name: 'Parachute Montreal Rive-Nord', country: 'Canada', city: 'Montreal', address: 'Saint-Esprit Airport 18 km north of Montreal', currency: 'CAD' },
  { name: 'Parachute Montreal Rive-Sud', country: 'Canada', city: 'Montreal', address: 'Farnham Airport 53 km south of Montreal', currency: 'CAD' },
  { name: 'Parachute Victoriaville', country: 'Canada', city: 'Montreal', address: 'Victoriaville Andre Fortin Airport 8 km south of Victoriaville', currency: 'CAD' },
  { name: 'Parachutisme Adrenaline Trois-Rivieres', country: 'Canada', city: 'Quebec', address: 'Trois-Rivieres Airport Quebec 12 km west of Trois-Rivieres', currency: 'CAD' },
  { name: 'Parachutisme Atmosphair', country: 'Canada', city: 'Quebec', address: 'Pintendre Levis 10 km south of Quebec', currency: 'CAD' },
  { name: 'Paradise Valley Skydiving', country: 'United States', city: 'Clarksville AR', address: 'Clarksville Municipal Airport 2 miles east of Clarksville', currency: 'USD' },
  { name: 'Paris-Jump', country: 'France', city: 'Paris', address: 'Aerodrome de St Florentin Cheu 170 km southeast of Paris', currency: 'EUR' },
  { name: 'Pegasus Skydive Center', country: 'United States', city: 'Allentown PA', address: 'Pegasus Air Park Stroudsburg 75 miles west of Allentown', currency: 'USD' },
  { name: 'Pepperell Skydiving Center', country: 'United States', city: 'Boston MA', address: 'Pepperell Airport 40 miles northwest of Boston', currency: 'USD' },
  { name: 'Phoenix Skydive Center', country: 'United States', city: 'Phoenix AZ', address: 'Casa Grande Municipal Airport 40 miles south of Phoenix', currency: 'USD' },
  { name: 'Piedmont Skydiving', country: 'United States', city: 'Charlotte NC', address: 'Mid-Carolina Regional Airport Salisbury 35 miles north of Charlotte', currency: 'USD' },
  { name: 'Porterville Training Facility', country: 'United States', city: 'Bakersfield CA', address: 'Porterville Municipal Airport 48 miles north of Bakersfield', currency: 'USD' },
  { name: 'Rattlesnake Mountain Skydiving', country: 'United States', city: 'Yakima WA', address: 'Prosser Airport 30 miles west of Tri-Cities', currency: 'USD' },
  { name: 'Rochester Skydivers', country: 'United States', city: 'Rochester NY', address: 'Berry-Warsaw Airport Perry 45 miles southwest of Rochester', currency: 'USD' },
  { name: 'SEMO Skydiving', country: 'United States', city: 'Cape Girardeau IL', address: 'Cairo Regional Airport 30 miles southeast of Cape Girardeau', currency: 'USD' },
  { name: 'SEMO Skydiving', country: 'United States', city: 'Cape Girardeau MO', address: 'Cairo Regional Airport 30 miles southeast of Cape Girardeau', currency: 'USD' },
  { name: 'Seven Hills Skydivers of Madison WI', country: 'United States', city: 'Madison WI', address: 'York Corners Airport 5 miles north of Madison', currency: 'USD' },
  { name: 'Silicon Valley Skydiving', country: 'United States', city: 'San Jose CA', address: 'San Martin Airport 25 miles south of San Jose', currency: 'USD' },
  { name: 'Sin City Skydiving', country: 'United States', city: 'Las Vegas NV', address: 'Jean Sport Aviation Center 20 miles south of Las Vegas', currency: 'USD' },
  { name: 'Sky Kef', country: 'Israel', city: 'Beer Sheva', address: 'Ramat Airport Beer Sheva 3 km west of Beer Sheva', currency: 'ILS' },
  { name: 'Sky-High Skydiving', country: 'United Kingdom', city: 'Newcastle', address: 'Shotton International 20 miles north of Newcastle-Upon-Tyne', currency: 'GBP' },
  { name: 'SkyDance SkyDiving', country: 'United States', city: 'Davis CA', address: 'Yolo County Airport 15 miles west of Sacramento', currency: 'USD' },
  { name: 'Skydive Adventures', country: 'United States', city: 'Luverne MN', address: 'Quentin Aanenson Airport Luverne 20 miles east of Sioux Falls SD', currency: 'USD' },
  { name: 'Skydive Airtight', country: 'United States', city: 'Tulsa OK', address: 'Skiatook Municipal Airport 20 miles north of Tulsa', currency: 'USD' },
  { name: 'Skydive Alabama', country: 'United States', city: 'Vinemont AL', address: 'Cullman Regional Airport-Folsom Field 40 miles north of Birmingham', currency: 'USD' },
  { name: 'Skydive Algarve', country: 'Portugal', city: 'Alvor', address: 'Aerodromo Municipal de Portimao Alvor 5 km west of Alvor-Portimao', currency: 'EUR' },
  { name: 'Skydive Aloha El Tapihue', country: 'Chile', city: 'Santiago', address: 'Casablanco 67 km west of Santiago', currency: 'CLP' },
  { name: 'Skydive Amelia Island', country: 'United States', city: 'Fernandina Beach FL', address: 'Fernandina Beach Municipal Airport 30 miles northeast of Jacksonville', currency: 'USD' },
  { name: 'Skydive America - Miami', country: 'United States', city: 'Miami FL', address: 'Homestead General Aviation Airport 20 miles southwest of Miami Beach', currency: 'USD' },
  { name: 'Skydive Andes', country: 'Chile', city: 'Santiago', address: 'San Enrique Quillota Diablos Melipilla 64 km west Santiago City', currency: 'CLP' },
  { name: 'Skydive Angola', country: 'Angola', city: 'Aeroporto de Cabóledo', address: '', currency: 'AOA' },
  { name: 'Skydive Arizona', country: 'United States', city: 'Eloy AZ', address: '4900 N Taylor St', currency: 'USD' },
  { name: 'Skydive Armheli', country: 'Armenia', city: 'Yerevan', address: 'Jrvezh Helipad 7.2 miles east of Yerevan', currency: 'AMD' },
  { name: 'Skydive Aros', country: 'Sweden', city: 'Stockholm', address: 'Johannsbergs Flygplats Airport Stockholm Vasteras 90 km west of Stockholm', currency: 'SEK' },
  { name: 'Skydive Athens', country: 'Greece', city: 'Athens', address: 'Korinthi Airfield Kleiston 105 km north of Athens', currency: 'EUR' },
  { name: 'Skydive Atlanta', country: 'United States', city: 'Atlanta GA', address: 'Thomaston Upson County Airport 50 miles south of Atlanta', currency: 'USD' },
  { name: 'Skydive Attica', country: 'Greece', city: 'Athens', address: 'Megara General Aviation Airport 40 km southwest of Athens', currency: 'EUR' },
  { name: 'Skydive BCN', country: 'Spain', city: 'Barcelona', address: 'Aerodromo Barcelona Bages Sant Fruitos de Bages 50 km northwest of Barcelona', currency: 'EUR' },
  { name: 'Skydive Beijing', country: 'China', city: 'Beijing', address: 'Beijing Shifosi Airport 53 km northeast of Beijing', currency: 'CNY' },
  { name: 'Skydive Bend', country: 'United States', city: 'Bend OR', address: 'Madras Municipal Airport Madras 46 miles north of Bend', currency: 'USD' },
  { name: 'Skydive Botswana', country: 'Botswana', city: 'Gaborone', address: 'Sir Seretse Khama International Gaborone 1.5 km northwest of Gaborone', currency: 'BWP' },
  { name: 'Skydive Bovec', country: 'Slovenia', city: 'Nova Gorica', address: 'Bovec Airport 40 miles north of Nova Gorica', currency: 'EUR' },
  { name: 'Skydive Broncos at Western Michigan University', country: 'United States', city: 'Ann Arbor MI', address: 'Skydive Tecumseh 25 miles west of Ann Arbor', currency: 'USD' },
  { name: 'Skydive Buckeye', country: 'United States', city: 'Phoenix AZ', address: 'Buckeye Municipal Airport 30 miles west of Phoenix', currency: 'USD' },
  { name: 'Skydive Burnaby', country: 'Canada', city: 'Vancouver', address: 'Port Colborne Airport Wainfleet 45 km south of Toronto', currency: 'CAD' },
  { name: 'Skydive California', country: 'United States', city: 'Tracy CA', address: 'Skydive California Airport 50 miles east of San Francisco', currency: 'USD' },
  { name: 'Skydive Caribbean', country: 'Venezuela', city: 'Caracas', address: 'Higuerote Airport 99 km west of Caracas', currency: 'VES' },
  { name: 'Skydive Carolina!', country: 'United States', city: 'Charlotte NC', address: 'Chester Municipal Airport 35 miles south of Charlotte NC', currency: 'USD' },
  { name: 'Skydive Castroville', country: 'United States', city: 'San Antonio TX', address: 'Castroville Municipal Airport 15 miles southwest of San Antonio', currency: 'USD' },
  { name: 'Skydive Central New York', country: 'United States', city: 'Syracuse NY', address: 'Whitfords Airport Weedsport 20 miles west of Syracuse', currency: 'USD' },
  { name: 'Skydive Central North Carolina LLC', country: 'United States', city: 'Charlotte NC', address: 'Laceys Airport Maiden 42 miles northwest of Charlotte', currency: 'USD' },
  { name: 'Skydive Chascomus', country: 'Argentina', city: 'Buenos Aires', address: 'Aeroclub Chascomus 110 km south of Buenos Aires', currency: 'ARS' },
  { name: 'Skydive Chelan', country: 'United States', city: 'Wenatchee WA', address: 'Lake Chelan Airport Chelan 40 miles north of Wenatchee', currency: 'USD' },
  { name: 'Skydive Cherokee', country: 'United States', city: 'Muskogee OK', address: 'Davis Field Airport 5 miles south of Muskogee', currency: 'USD' },
  { name: 'Skydive Chesapeake', country: 'United States', city: 'Annapolis MD', address: 'Coolen Airpark Ridgely 43 miles east of Annapolis', currency: 'USD' },
  { name: 'Skydive Chiang Mai', country: 'Thailand', city: 'Chiang Mai', address: 'Phuanfah Airfield Mae Taeng Chiang Mai 42 km north of Chiang Mai', currency: 'THB' },
  { name: 'Skydive Chicago Inc.', country: 'United States', city: 'Chicago IL', address: 'Skydive Chicago Airport Ottawa 70 miles southwest of Chicago', currency: 'USD' },
  { name: 'Skydive Cincinnati', country: 'United States', city: 'Cincinnati OH', address: 'Red Stewart Airfield Waynesville 38 miles northeast of Cincinnati', currency: 'USD' },
  { name: 'Skydive City Zephyrhills', country: 'United States', city: 'Zephyrhills FL', address: 'Zephyrhills Municipal Airport 22 miles northeast of Tampa', currency: 'USD' },
  { name: 'Skydive Coastal Carolinas', country: 'United States', city: 'Wilmington NC', address: 'Cape Fear Regional Jetport Oak Island 25 miles south of Wilmington', currency: 'USD' },
  { name: 'Skydive Coastal Maine', country: 'United States', city: 'Portland ME', address: 'Biddeford Municipal Airport 18 miles southwest of Portland', currency: 'USD' },
  { name: 'Skydive Colorado', country: 'United States', city: 'Denver CO', address: 'Limon Municipal Airport 90 miles east of Denver', currency: 'USD' },
  { name: 'Skydive Colorado Springs', country: 'United States', city: 'Colorado Springs CO', address: 'Fremont County Airport Penrose 45 miles west of Colorado Springs', currency: 'USD' },
  { name: 'Skydive Costa D\'Argento', country: 'Italy', city: 'Rome', address: 'Avioaperficie Costa DArgento Orbetello 130 km north of Rome', currency: 'EUR' },
  { name: 'Skydive Croatia', country: 'Croatia', city: 'Zagreb', address: 'Airport Lucko Zagreb 15 km southwest of Zagreb', currency: 'EUR' },
  { name: 'Skydive Cross Keys', country: 'United States', city: 'Philadelphia PA', address: 'Cross Keys Airport Williamstown 15 miles south of Philadelphia', currency: 'USD' },
  { name: 'Skydive Cuautla', country: 'Mexico', city: 'Mexico City', address: 'Aeropuerto de Huitzililla Morelos 95 miles south Mexico City', currency: 'MXN' },
  { name: 'Skydive Danielson', country: 'United States', city: 'Providence RI', address: 'Danielson Airport 28 miles west of Providence RI', currency: 'USD' },
  { name: 'Skydive Deland', country: 'United States', city: 'DeLand FL', address: '1600 Flightline Blvd', currency: 'USD' },
  { name: 'Skydive DeLand Inc.', country: 'United States', city: 'Orlando FL', address: 'DeLand Municipal Airport 45 miles north of Orlando', currency: 'USD' },
  { name: 'Skydive Dubai Desert Campus', country: 'United Arab Emirates', city: 'Dubai', address: 'Skydive Dubai Airport 48 km southeast of Dubai', currency: 'AED' },
  { name: 'Skydive Duluth', country: 'United States', city: 'Duluth MN', address: 'Richard I Bong Airport 5 miles south of Duluth MN', currency: 'USD' },
  { name: 'Skydive East Coast', country: 'United States', city: 'Atlantic City NJ', address: 'Eagles Nest Airport West Creek 21 miles north of Atlantic City', currency: 'USD' },
  { name: 'Skydive East Tennessee', country: 'United States', city: 'Knoxville TN', address: 'Dumplin Field Airport Dandridge 22 miles east of Knoxville', currency: 'USD' },
  { name: 'Skydive East Texas', country: 'United States', city: 'Longview TX', address: 'Gladewater Municipal Airport 13 miles northeast of Longview', currency: 'USD' },
  { name: 'Skydive Egypt - Jump Like a Pharaoh', country: 'Egypt', city: 'Cairo', address: 'Cairo International Airport 3 km west of New Capital Administration', currency: 'EGP' },
  { name: 'Skydive Elsinore', country: 'United States', city: 'Lake Elsinore CA', address: '20701 Cereal St', currency: 'USD' },
  { name: 'Skydive Elsinore', country: 'United States', city: 'Lake Elsinore CA', address: 'Skylark Airport 75 miles southeast of Los Angeles', currency: 'USD' },
  { name: 'Skydive Empuriabrava', country: 'Spain', city: 'Barcelona', address: 'Empuriabrava Airport 150 km north of Barcelona', currency: 'EUR' },
  { name: 'Skydive Estonia', country: 'Estonia', city: 'Tallinn', address: 'Rapla Airfield 60 km south of Tallinn', currency: 'EUR' },
  { name: 'Skydive Fargo Inc.', country: 'United States', city: 'Fargo ND', address: 'West Fargo Airport 1.5 miles west of Fargo', currency: 'USD' },
  { name: 'Skydive Fayetteville', country: 'United States', city: 'Fayetteville AR', address: 'Drake Field Airport 7 miles south of Fayetteville', currency: 'USD' },
  { name: 'Skydive FlyGang F4F DZone', country: 'Italy', city: 'Bologna', address: 'Aviosuperficie Modenese 35 km northeast of Bologna', currency: 'EUR' },
  { name: 'Skydive Freefall Adventure LLC', country: 'United States', city: 'Green Bay WI', address: 'Carter Airport Pulaski 15 miles northeast of Green Bay', currency: 'USD' },
  { name: 'Skydive Front Royal', country: 'United States', city: 'Washington DC', address: 'Warren County Airport 70 miles west of Washington DC', currency: 'USD' },
  { name: 'Skydive Fujioka', country: 'Japan', city: 'Tokyo', address: 'Skyfield Watanuse Fujioka 80 km north of Tokyo', currency: 'JPY' },
  { name: 'Skydive Fyrosity', country: 'United States', city: 'Overton NV', address: '', currency: 'USD' },
  { name: 'Skydive Georgia', country: 'United States', city: 'Cedartown GA', address: 'Cornelius Moore Airport Cedartown 42 miles northwest of Atlanta', currency: 'USD' },
  { name: 'Skydive Golden', country: 'Colombia', city: 'Girardot', address: 'Santiago Vila Airport Flandes 3.1 km south of Girardot', currency: 'COP' },
  { name: 'Skydive Golden Gate', country: 'United States', city: 'Novato CA', address: 'Marin County Airport 25 miles north of San Francisco', currency: 'USD' },
  { name: 'Skydive Grand Haven', country: 'United States', city: 'Grand Haven MI', address: 'Grand Haven Memorial Airpark 4 miles south of Grand Haven', currency: 'USD' },
  { name: 'Skydive Greece', country: 'Greece', city: 'Athens', address: 'General Aviation Airport of Pachi Megara 40 km west of Athens', currency: 'EUR' },
  { name: 'Skydive Hailing Island', country: 'China', city: 'Yangjiang', address: 'Hailing Airport Yangjiang 50 km south of Yangjiang', currency: 'CNY' },
  { name: 'Skydive Hainan', country: 'China', city: 'Danzhou', address: 'Danzhou Heqing General Aviation Hainan Danzhou 10 km southwest of Danzhou City', currency: 'CNY' },
  { name: 'Skydive Indianapolis', country: 'United States', city: 'Indianapolis IN', address: 'Frankfort Municipal Airport 25 miles north of Indianapolis', currency: 'USD' },
  { name: 'Skydive Iowa', country: 'United States', city: 'Des Moines IA', address: 'Skydive Iowa Airport Brooklyn 70 miles east of Des Moines', currency: 'USD' },
  { name: 'Skydive Kapowsin', country: 'United States', city: 'Shelton WA', address: '', currency: 'USD' },
  { name: 'Skydive Karjala', country: 'Finland', city: 'Imatra', address: 'Immola Airport 10 km east of Imatra', currency: 'EUR' },
  { name: 'Skydive Kentucky', country: 'United States', city: 'Louisville KY', address: 'Addington Field Elizabethtown 50 miles south of Louisville', currency: 'USD' },
  { name: 'Skydive Key West', country: 'United States', city: 'Key West FL', address: 'Sugarloaf Shores Airport 13 miles north of Key West', currency: 'USD' },
  { name: 'Skydive Klaipeda', country: 'Lithuania', city: 'Klaipeda', address: 'Klaipedos Aerodromas 10 km east of Klaipeda', currency: 'EUR' },
  { name: 'Skydive Korea', country: 'Republic of Korea', city: 'Yeoju Station', address: 'Chung-Ju Airport 14 km southeast of Yeoju Station', currency: 'KRW' },
  { name: 'Skydive La Celeste', country: 'Ecuador', city: 'La Concordia', address: 'Pista Aerea La Celeste La Concordia 118 miles west of La Concordia', currency: 'USD' },
  { name: 'Skydive Lake Tahoe', country: 'United States', city: 'South Lake Tahoe NV', address: 'Minden-Tahoe Airport 34 miles west of South Lake Tahoe', currency: 'USD' },
  { name: 'Skydive Las Vegas', country: 'United States', city: 'Las Vegas NV', address: 'Boulder City Municipal Airport 30 miles southeast of Las Vegas', currency: 'USD' },
  { name: 'Skydive Latvia', country: 'Latvia', city: 'Riga', address: 'Langaci-Limbazi Airport 90 km northeast of Riga', currency: 'EUR' },
  { name: 'Skydive Lucca', country: 'Italy', city: 'Lucca', address: 'Aeroporto Capannori Lucca Capannori 5 km east of Lucca', currency: 'EUR' },
  { name: 'Skydive Madera', country: 'United States', city: 'Fresno CA', address: 'Madera Municipal Airport 17 miles north of Fresno', currency: 'USD' },
  { name: 'Skydive Madrid', country: 'Spain', city: 'Madrid', address: 'El Quijote&Lillo 100 km south of Madrid', currency: 'EUR' },
  { name: 'Skydive Manavgat', country: 'Turkey', city: 'Antalya', address: 'Antalya 70 km east of Antalya', currency: 'TRY' },
  { name: 'Skydive Marana', country: 'United States', city: 'Tucson AZ', address: 'Marana Regional Airport 18 miles north of Tucson', currency: 'USD' },
  { name: 'Skydive Mesquite', country: 'United States', city: 'Las Vegas NV', address: 'Mesquite Municipal Airport 77 miles northeast of Las Vegas', currency: 'USD' },
  { name: 'Skydive Midwest', country: 'United States', city: 'Chicago IL', address: 'Sylvanie Airport Sturtevant 50 miles north of Chicago', currency: 'USD' },
  { name: 'Skydive Milwaukee/Sky Knights Sport Parachute Club', country: 'United States', city: 'Milwaukee WI', address: 'East Troy Municipal Airport 40 miles southwest of Milwaukee', currency: 'USD' },
  { name: 'Skydive Missoula', country: 'United States', city: 'Missoula MT', address: 'Stevensville Airport 30 miles south of Missoula', currency: 'USD' },
  { name: 'Skydive Moab', country: 'United States', city: 'Grand Junction CO', address: 'Moab Airport 60 miles west of Grand Junction', currency: 'USD' },
  { name: 'Skydive Monkey Head', country: 'Mexico', city: 'Mexico City', address: 'Aeropuerto de Cuernavaca 90 km southeast of Mexico City', currency: 'MXN' },
  { name: 'Skydive Monroe', country: 'United States', city: 'Atlanta GA', address: 'Monroe-Walton County Airport 41 miles east of Atlanta', currency: 'USD' },
  { name: 'Skydive Monterrey', country: 'Mexico', city: 'Monterrey', address: 'Aerodromo Iturbide Roberto Chavez General Teran 90 km northwest of Monterrey', currency: 'MXN' },
  { name: 'Skydive Mt. Whitney', country: 'United States', city: 'Lone Pine CA', address: 'Lone Pine Death Valley Airport 140 miles north of Lancaster', currency: 'USD' },
  { name: 'Skydive NEPA', country: 'United States', city: 'Scranton PA', address: 'Seamans Airport Factoryville 16 miles north of Scranton', currency: 'USD' },
  { name: 'Skydive New England', country: 'United States', city: 'Lebanon ME', address: 'Skydive New England Airport Lebanon 75 miles north of Boston', currency: 'USD' },
  { name: 'Skydive Newport', country: 'United States', city: 'Newport RI', address: 'Newport State Airport Middletown 25 miles southeast of Newport', currency: 'USD' },
  { name: 'Skydive Northstar', country: 'United States', city: 'Twin Cities MN', address: 'Waseca Municipal Airport 60 miles southwest of Twin Cities', currency: 'USD' },
  { name: 'Skydive OBX', country: 'United States', city: 'Norfolk VA', address: 'Dare County Regional Airport Manteo 70 miles south of Norfolk VA', currency: 'USD' },
  { name: 'Skydive Ocean City', country: 'United States', city: 'Ocean City MD', address: 'Ocean City Municipal Airport Berlin one mile southwest of Ocean City', currency: 'USD' },
  { name: 'Skydive Ontario', country: 'Canada', city: 'Toronto', address: 'Cayuga East Airport 70 km southwest of Toronto', currency: 'CAD' },
  { name: 'Skydive Orange Inc.', country: 'United States', city: 'Washington DC', address: 'Orange County Airport 80 miles southwest of Washington DC', currency: 'USD' },
  { name: 'Skydive Oregon Inc.', country: 'United States', city: 'Molalla OR', address: 'Skydive Oregon Airport Molalla 20 miles south of Portland', currency: 'USD' },
  { name: 'Skydive Palatka', country: 'United States', city: 'Jacksonville FL', address: 'Kay Larkin Field 50 miles south of Jacksonville', currency: 'USD' },
  { name: 'Skydive Palm Beach', country: 'United States', city: 'Wellington FL', address: 'Palm Beach County Glades Airport Pahokee 32 miles east of Wellington', currency: 'USD' },
  { name: 'Skydive Panama City', country: 'United States', city: 'Panama City FL', address: 'Tri County Airport Bonifay 60 miles north of Panama City', currency: 'USD' },
  { name: 'Skydive Panda - Chongqing', country: 'China', city: 'Chongqing', address: 'Chongqing Liangang Airport 153 km southeast of Chongqing Area', currency: 'CNY' },
  { name: 'Skydive Paracaidismo Nuevo Leon', country: 'Mexico', city: 'Monterrey', address: 'Aeropuerto Del Norte Nuevo Leon 67.7 km south of Monterrey Centro', currency: 'MXN' },
  { name: 'Skydive Paraclete XP', country: 'United States', city: 'Fayetteville NC', address: 'PK Airpark Raeford 14 miles southwest of Fayetteville', currency: 'USD' },
  { name: 'Skydive Pennsylvania', country: 'United States', city: 'Pittsburgh PA', address: 'Grove City Airport Mercer 50 miles north of Pittsburgh', currency: 'USD' },
  { name: 'Skydive Perris', country: 'United States', city: 'Perris CA', address: '2091 Goetz Rd', currency: 'USD' },
  { name: 'Skydive Perris', country: 'United States', city: 'Los Angeles CA', address: 'Perris Valley Airport 90 miles east of Los Angeles', currency: 'USD' },
  { name: 'Skydive Pharaohs', country: 'Egypt', city: 'Cairo', address: 'New Capital Airport 50 km SW of New Administrative Capital', currency: 'EGP' },
  { name: 'Skydive Philadelphia', country: 'United States', city: 'Philadelphia PA', address: 'Pennridge Airport Perkasie 10 miles north of Philadelphia', currency: 'USD' },
  { name: 'Skydive Phoenix', country: 'United States', city: 'Maricopa AZ', address: 'Hidden Valley Airport 12 miles south of Phoenix', currency: 'USD' },
  { name: 'Skydive Portugal', country: 'Portugal', city: 'Evora', address: 'Aerodromo Municipal de Evora 4 km south of Evora', currency: 'EUR' },
  { name: 'Skydive Puebla', country: 'Mexico', city: 'Puebla', address: 'Aerodromo de Atloaco 30 km southwest of Puebla', currency: 'MXN' },
  { name: 'Skydive Puerto Rico', country: 'United States', city: 'San Juan PR', address: 'Antonio Juarbe Pol Airport Arecibo 44 miles west of San Juan', currency: 'USD' },
  { name: 'Skydive Riyue Bay', country: 'China', city: 'Wanning', address: 'Qiong An Airport Wanning 15 km southeast of Wanning', currency: 'CNY' },
  { name: 'Skydive Saar (FSZ - Saar)', country: 'Germany', city: 'Saarlouis', address: 'Saarlouis-Dueren 10 km east of Saarlouis', currency: 'EUR' },
  { name: 'Skydive San Diego', country: 'United States', city: 'San Diego CA', address: 'Nichols Field Jamul 6 miles south of San Diego', currency: 'USD' },
  { name: 'Skydive San Joaquin Valley', country: 'United States', city: 'Los Angeles CA', address: '218 Cooper Field Bakersfield 75 miles north of Los Angeles', currency: 'USD' },
  { name: 'Skydive San Miguel', country: 'El Salvador', city: 'San Miguel', address: 'Usulatan El Placatel 5 km northeast of San Miguel', currency: 'USD' },
  { name: 'Skydive Santa Barbara', country: 'United States', city: 'Santa Barbara CA', address: 'Lompoc Airport 45 miles north of Santa Barbara', currency: 'USD' },
  { name: 'Skydive Santa Fe - Cebu', country: 'Philippines', city: 'Cebu', address: 'Bantayan Island Airport 140 km north of Cebu', currency: 'PHP' },
  { name: 'Skydive Saratoga', country: 'United States', city: 'Saratoga Springs NY', address: 'Heber Airport Gansevoort 8 miles north of Saratoga Springs', currency: 'USD' },
  { name: 'Skydive Sardegna', country: 'Italy', city: 'Cagliari', address: 'Sardegna Airfield 30 km northeast of Cagliari Airport', currency: 'EUR' },
  { name: 'Skydive Saulgau', country: 'Germany', city: 'Ulm', address: 'Bad Saulgau Airport 75 km southwest of Ulm', currency: 'EUR' },
  { name: 'Skydive Sebastian', country: 'United States', city: 'Orlando FL', address: 'Sebastian Municipal Airport 70 miles southeast of Orlando', currency: 'USD' },
  { name: 'Skydive Seneca Lake', country: 'United States', city: 'Geneva NY', address: 'Ovid Airport 22 miles north of Geneva', currency: 'USD' },
  { name: 'Skydive Shamrat (Sky-Jump)', country: 'Israel', city: 'Tamar', address: 'Bar Yehuda Airfield Tamar Regional Council 95 km from Jerusalem', currency: 'ILS' },
  { name: 'Skydive Shenandoah', country: 'United States', city: 'Washington DC', address: 'New Market Airport 75 miles southwest of Washington DC', currency: 'USD' },
  { name: 'Skydive Siquijor', country: 'Philippines', city: 'Dumaguete', address: 'Siquijor Airport 20 miles west of Dumaguete', currency: 'PHP' },
  { name: 'Skydive Skydown', country: 'United States', city: 'Caldwell ID', address: 'Caldwell Executive Airport 3 miles southeast of Caldwell', currency: 'USD' },
  { name: 'Skydive Slavnica', country: 'Slovakia', city: 'Trencin', address: 'Slavnica Airport 25 km east of Trencin', currency: 'EUR' },
  { name: 'Skydive Snohomish Inc.', country: 'United States', city: 'Seattle WA', address: 'Harvey Field Snohomish 20 miles north of Seattle', currency: 'USD' },
  { name: 'Skydive Sofia', country: 'Bulgaria', city: 'Sofia', address: 'Airfield of Ihtiman Ihtiman 5 km east of Sofia', currency: 'BGN' },
  { name: 'Skydive South Atlanta', country: 'United States', city: 'Atlanta GA', address: 'Spaceland Airport Rockmart 45 miles northwest of Atlanta', currency: 'USD' },
  { name: 'Skydive Spa', country: 'Belgium', city: 'Liege', address: 'Aerodrome de la Sauveniere 45 km southeast of Liege', currency: 'EUR' },
  { name: 'Skydive Space Center Inc.', country: 'United States', city: 'Titusville FL', address: 'Arthur Dunn Airpark Titusville 36 miles east of Orlando', currency: 'USD' },
  { name: 'Skydive Spaceland-Clewiston', country: 'United States', city: 'Ft. Lauderdale FL', address: 'Airglades Airport Clewiston 50 miles west of Ft. Lauderdale', currency: 'USD' },
  { name: 'Skydive Spaceland-Dallas', country: 'United States', city: 'Dallas TX', address: 'Tri-County Aerodrome Whitewright 60 miles northeast of Dallas', currency: 'USD' },
  { name: 'Skydive Spaceland-Houston', country: 'United States', city: 'Houston TX', address: 'BB Airpark Rosharon 25 miles south of Houston', currency: 'USD' },
  { name: 'Skydive Spaceland-San Marcos', country: 'United States', city: 'Austin TX', address: 'Fentress Airpark 25 miles southwest of Austin', currency: 'USD' },
  { name: 'Skydive Spain', country: 'Spain', city: 'Seville', address: 'Aerodromo La Juliana Sevilla 11 km southwest of Seville', currency: 'EUR' },
  { name: 'Skydive STL', country: 'United States', city: 'St. Louis MO', address: 'Sullivan Airport 60 miles west of St. Louis', currency: 'USD' },
  { name: 'Skydive Suffolk', country: 'United States', city: 'Virginia Beach VA', address: 'Suffolk Airport 22 miles southwest of Virginia Beach', currency: 'USD' },
  { name: 'Skydive Sussex', country: 'United States', city: 'New York City NY', address: 'Sussex County Airport 39 miles northwest of New York City', currency: 'USD' },
  { name: 'Skydive SW Florida Club', country: 'United States', city: 'Punta Gorda FL', address: 'Shell Creek Airport Punta Gorda 25 miles north of Fort Myers', currency: 'USD' },
  { name: 'Skydive Switzerland', country: 'Switzerland', city: 'Interlaken', address: 'Reichenbach Airport 20 km west of Interlaken', currency: 'CHF' },
  { name: 'Skydive Taiwan', country: 'China', city: 'Taitung', address: 'Taitung Airport 4 km east of Taitung', currency: 'TWD' },
  { name: 'Skydive Taiwan', country: 'Republic of China', city: 'Taitung', address: 'Taitung Airport 4 km east of Taitung', currency: 'TWD' },
  { name: 'Skydive Tanger', country: 'Morocco', city: 'Tangier', address: 'Boukhalef Tangier 12 km southwest of Tangier', currency: 'MAD' },
  { name: 'Skydive Taroudant', country: 'Morocco', city: 'Taroudant', address: 'Aeroport Taroudant 4 km east of Taroudant', currency: 'MAD' },
  { name: 'Skydive TC', country: 'United States', city: 'Traverse City MI', address: 'Cherry Capital Airport Traverse City 250 miles northwest of Detroit', currency: 'USD' },
  { name: 'Skydive Tecumseh', country: 'United States', city: 'Jackson MI', address: 'Napoleon Airport 10 miles southeast of Jackson', currency: 'USD' },
  { name: 'Skydive Thailand', country: 'Thailand', city: 'Bangkok', address: 'Khanong Phra Airport Nakhon Ratchasima 200 miles northeast of Bangkok', currency: 'THB' },
  { name: 'Skydive The Bahamas', country: 'Bahamas', city: 'Freeport', address: 'Grand Bahama International Airport Freeport', currency: 'BSD' },
  { name: 'Skydive The Falls', country: 'United States', city: 'Niagara Falls NY', address: 'Windsor Shear Airport Youngstown 9 miles north of Niagara Falls', currency: 'USD' },
  { name: 'Skydive The Farm', country: 'United States', city: 'Atlanta GA', address: 'Cornelius Moore Airport Cedartown 42 miles northwest of Atlanta', currency: 'USD' },
  { name: 'Skydive the Gulf', country: 'United States', city: 'Elberta AL', address: 'Perdido Winds Airpark 22 miles west of Pensacola', currency: 'USD' },
  { name: 'Skydive The Ranch', country: 'United States', city: 'New York NY', address: 'Gardner Airport Gardiner 69 miles north of New York City', currency: 'USD' },
  { name: 'Skydive the Wasatch', country: 'United States', city: 'Salt Lake City UT', address: 'Nephi Municipal Airport 60 miles south of Salt Lake City', currency: 'USD' },
  { name: 'Skydive Thessaloniki', country: 'Greece', city: 'Thessaloniki', address: 'Giannitsa Airport 45 km north of Thessaloniki', currency: 'EUR' },
  { name: 'Skydive Thiene', country: 'Italy', city: 'Vicenza', address: 'Aeroporto A Ferrarin 15 km south of Vicenza', currency: 'EUR' },
  { name: 'Skydive Thru Quero Saltar', country: 'China', city: 'São Paulo', address: 'Airfield Boituva 110 km south of São Paulo', currency: 'BRL' },
  { name: 'Skydive Toledo', country: 'United States', city: 'Toledo OH', address: 'Ed Carlson Memorial Field/Winlock Airport 60 miles north of Portland OR', currency: 'USD' },
  { name: 'Skydive Transilvania', country: 'Romania', city: 'Cluj-Napoca', address: 'Campia Airfield 50 km south of Cluj-Napoca', currency: 'RON' },
  { name: 'Skydive Twin Cities', country: 'United States', city: 'St. Paul MN', address: 'Baldwin International Airport 40 miles east of St. Paul MN', currency: 'USD' },
  { name: 'Skydive UC Davis', country: 'United States', city: 'Davis CA', address: 'Yolo County Airport Davis (530) 601-8661', currency: 'USD' },
  { name: 'Skydive Unique Clouds', country: 'Saudi Arabia', city: 'Riyadh', address: 'Mulhm Airport 40 km north of Riyadh', currency: 'SAR' },
  { name: 'Skydive Utah', country: 'United States', city: 'Salt Lake City UT', address: 'Tooele Valley Airport Erda 20 miles west of Salt Lake City', currency: 'USD' },
  { name: 'Skydive Vancouver', country: 'Canada', city: 'Vancouver', address: 'Skydive Vancouver Airport British Columbia 35 miles east of Vancouver', currency: 'CAD' },
  { name: 'Skydive Vancouver Island', country: 'Canada', city: 'Nanaimo', address: 'Qualicum Beach Airport 30 km west of Nanaimo', currency: 'CAD' },
  { name: 'Skydive Vatulino', country: 'Russia', city: 'Moscow', address: 'Vatulino Airfield Ruza 100 km west of Moscow', currency: 'RUB' },
  { name: 'Skydive Weiand', country: 'China', city: 'Haikou', address: 'Xi Qing Airport Ding Zhou 120 km south of Haikou', currency: 'CNY' },
  { name: 'Skydive West Plains', country: 'United States', city: 'Spokane WA', address: 'Ritzville Aero Recreation 50 miles west of Spokane', currency: 'USD' },
  { name: 'Skydive Whitefish', country: 'United States', city: 'Whitefish MT', address: 'Whitefish Airport 1 mile east of Whitefish', currency: 'USD' },
  { name: 'Skydive Wissota/Indianhead SPC', country: 'United States', city: 'Chippewa Falls WI', address: 'Lake Wissota Airport Chippewa Falls 20 miles east of Minneapolis', currency: 'USD' },
  { name: 'Skydive Yosemite', country: 'United States', city: 'Yosemite CA', address: 'Mariposa-Yosemite Airport 18 miles west of Yosemite Valley', currency: 'USD' },
  { name: 'Skydive Zadar', country: 'Croatia', city: 'Zadar', address: 'Zadar Airport Botsanac 24 km north of Zadar', currency: 'EUR' },
  { name: 'Skydive Zanzibar', country: 'Tanzania', city: 'Zanzibar City', address: 'Nungwi Airport 2 km south of Zanzibar City', currency: 'TZS' },
  { name: 'Skydive ZhuHai', country: 'China', city: 'Zhuhai', address: 'Yanguan Airport Zhuitan City 1 km west of Zuhai', currency: 'CNY' },
  { name: 'Skydiving Kansai', country: 'Japan', city: 'Kyoto', address: 'Tajima Kansai 110 km northwest of Kyoto', currency: 'JPY' },
  { name: 'Skyhigh India', country: 'India', city: 'Narnaul', address: 'Narnaul Airport 140 km southwest of Narnaul', currency: 'INR' },
  { name: 'Skylark Skydive', country: 'United States', city: 'Austin TX', address: 'Skylark Airfield Killeen 60 miles north of Austin', currency: 'USD' },
  { name: 'Start Skydiving', country: 'United States', city: 'Cincinnati OH', address: 'Middletown Regional Airport 29 miles northeast of Cincinnati', currency: 'USD' },
  { name: 'Sun City Skydive', country: 'United States', city: 'Santa Teresa NM', address: 'Dona Ana County International Airport Santa Teresa 9 miles west of El Paso', currency: 'USD' },
  { name: 'Texas Skydiving', country: 'United States', city: 'Austin TX', address: 'Lexington Airfield 35 miles east of Austin', currency: 'USD' },
  { name: 'Thai Sky Adventures Ltd.', country: 'Thailand', city: 'Bangkok', address: 'Nong Khao Airfield Chon Buri Pattaya 96 km south of Bangkok', currency: 'THB' },
  { name: 'The California Parachute Club', country: 'United States', city: 'Livermore CA', address: '(650) 834-3975', currency: 'USD' },
  { name: 'Timisoara Parachute Club Sportiv', country: 'Romania', city: 'Timisoara', address: 'Sannihaiu German Aerodrome 15 km southwest of Timisoara', currency: 'RON' },
  { name: 'TNT-Brothers Dropzone', country: 'Romania', city: 'Bucharest', address: 'Clinceni Airport 16 km southwest of Bucharest', currency: 'RON' },
  { name: 'TNT-Brothers Seaside', country: 'Romania', city: 'Constanta', address: 'Aeroport International Tulsa 20 km south of Constanta', currency: 'RON' },
  { name: 'Tokyo Skydiving Club', country: 'Japan', city: 'Tokyo', address: 'Honda Airport Saitama 40 km north of Tokyo', currency: 'JPY' },
  { name: 'UConn Skydiving Club', country: 'United States', city: 'Ellington CT', address: 'Ellington Airport (603) 913-0418 (weekday)', currency: 'USD' },
  { name: 'Upstate Skydiving LLC', country: 'United States', city: 'Union SC', address: 'Union County Airport 1 mile southwest of Union', currency: 'USD' },
  { name: 'Vermont Skydiving Adventures Inc.', country: 'United States', city: 'Burlington VT', address: 'Two Farm Acres Airport 20 miles north of Burlington', currency: 'USD' },
  { name: 'Viva Skydive', country: 'United States', city: 'Albuquerque NM', address: 'Belen Regional Airport 33 miles south of Albuquerque', currency: 'USD' },
  { name: 'Vizone S.S.D.', country: 'Italy', city: 'Milan', address: 'Carlo de Martino Vercelli 80 km southwest of Milan', currency: 'EUR' },
  { name: 'West Tennessee Skydiving', country: 'United States', city: 'Memphis TN', address: 'Wings Field Whiteville 20 miles east of Memphis', currency: 'USD' },
  { name: 'West Virginia Skydivers Inc.', country: 'United States', city: 'Huntington WV', address: 'Robert Newlon Field Airport Lesage 6 miles northeast of Huntington', currency: 'USD' },
  { name: 'WNYSkydiving', country: 'United States', city: 'Buffalo NY', address: 'Pine Hill Airport Albion 30 miles northeast of Buffalo', currency: 'USD' },
  { name: 'Xielo Skydive', country: 'Colombia', city: 'Girardot', address: 'Santiago Vila Flandes 12 km south of Girardot', currency: 'COP' },
  { name: 'Yan Huang Skydive', country: 'China', city: 'Zhengzhou', address: 'Liaoyang Beijiao Airport An Yang 140 km east of Zhengzhou', currency: 'CNY' },
]

async function main() {
  console.log('🌱 Starting seed...')

  // Get all users to seed data for them
  const users = await prisma.user.findMany()

  if (users.length === 0) {
    console.log('⚠️  No users found. Create a user account first.')
    return
  }

  for (const user of users) {
    console.log(`\n👤 Seeding data for user: ${user.email}`)

    // Check if user already has dropzones
    const existingDropzones = await prisma.dropzone.count({
      where: { userId: user.id },
    })

    if (existingDropzones === 0) {
      console.log('  📍 Creating default dropzones...')
      for (const dz of DEFAULT_DROPZONES) {
        await prisma.dropzone.create({
          data: {
            ...dz,
            userId: user.id,
          },
        })
      }
      console.log(`  ✅ Created ${DEFAULT_DROPZONES.length} dropzones`)
    } else {
      console.log(`  ⏭️  User already has ${existingDropzones} dropzones, skipping...`)
    }

    // Check if user already has aircraft
    const existingAircraft = await prisma.userAircraft.count({
      where: { userId: user.id },
    })

    if (existingAircraft === 0) {
      console.log('  ✈️  Creating default aircraft...')
      for (const aircraft of DEFAULT_AIRCRAFT) {
        await prisma.userAircraft.create({
          data: {
            name: aircraft,
            userId: user.id,
            isDefault: aircraft === 'Cessna 208 Caravan',
          },
        })
      }
      console.log(`  ✅ Created ${DEFAULT_AIRCRAFT.length} aircraft`)
    } else {
      console.log(`  ⏭️  User already has ${existingAircraft} aircraft, skipping...`)
    }

    // Check if user already has jump types
    const existingJumpTypes = await prisma.userJumpType.count({
      where: { userId: user.id },
    })

    if (existingJumpTypes === 0) {
      console.log('  🪂 Creating default jump types...')
      for (const jumpType of DEFAULT_JUMP_TYPES) {
        await prisma.userJumpType.create({
          data: {
            name: jumpType,
            userId: user.id,
            isDefault: jumpType === 'Relative Work',
          },
        })
      }
      console.log(`  ✅ Created ${DEFAULT_JUMP_TYPES.length} jump types`)
    } else {
      console.log(`  ⏭️  User already has ${existingJumpTypes} jump types, skipping...`)
    }
  }

  // ---- Backfill onboarding flags for all seed users ----
  // Any user created before onboarding was added should be considered as having completed it
  await prisma.user.updateMany({
    where: { hasCompletedOnboarding: false },
    data: { hasCompletedOnboarding: true },
  })
  console.log('\n  ✅ Backfilled hasCompletedOnboarding for all seed users')

  // ---- Global Aircraft ----
  const existingGlobalAircraft = await prisma.globalAircraft.count()
  if (existingGlobalAircraft === 0) {
    console.log('\n✈️  Seeding global aircraft...')
    await prisma.globalAircraft.createMany({ data: GLOBAL_AIRCRAFT })
    console.log(`  ✅ Created ${GLOBAL_AIRCRAFT.length} global aircraft`)
  } else {
    console.log(`\n  ⏭️  Global aircraft already seeded (${existingGlobalAircraft} records), skipping...`)
  }

  // ---- Global Jump Types ----
  const existingGlobalJumpTypes = await prisma.globalJumpType.count()
  if (existingGlobalJumpTypes === 0) {
    console.log('🪂 Seeding global jump types...')
    await prisma.globalJumpType.createMany({ data: GLOBAL_JUMP_TYPES })
    console.log(`  ✅ Created ${GLOBAL_JUMP_TYPES.length} global jump types`)
  } else {
    console.log(`  ⏭️  Global jump types already seeded (${existingGlobalJumpTypes} records), skipping...`)
  }

  console.log('\n✅ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
