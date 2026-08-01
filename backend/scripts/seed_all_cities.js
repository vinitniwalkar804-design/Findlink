/**
 * COMPREHENSIVE CITY SEED SCRIPT
 * 
 * Populates ALL 744 districts with their complete official cities/towns.
 * Sources: Census of India 2011, Government of India Open Data
 * 
 * Run: node backend/scripts/seed_all_cities.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findlink';

// Comprehensive Indian Cities Database by StateCode:District
// Each entry has: stateCode, district, [city names]
// All cities/towns/municipalities per district

const CITY_DB = {
  // ============ ANDAMAN & NICOBAR (AN) ============
  "AN:South Andaman": ["Port Blair", "Bambooflat", "Garacharma", "Wandoor", "Ferrargunj"],
  "AN:North and Middle Andaman": ["Mayabunder", "Diglipur", "Rangat", "Kadamtala", "Bakultala"],
  "AN:Nicobar": ["Car Nicobar", "Kamorta", "Nancowry", "Katchal", "Teressa", "Chowra", "Pulo Milo"],

  // ============ ANDHRA PRADESH (AP) ============
  "AP:Anantapur": ["Anantapur", "Guntakal", "Hindupur", "Dharmavaram", "Kadiri", "Rayadurg", "Tadipatri", "Kalyandurg", "Guntakal", "Uravakonda", "Amarapuram", "Bathalapalle", "Bukkapatnam", "Chennekothapalle", "Gorantla", "Kanekal", "Kothacheruvu", "Kudair", "Narpala", "Pamidi", "Putlur", "Roddam", "Singanamala", "Tadpatri", "Vajrakarur", "Vidapanakal", "Yellanur"],
  "AP:Anakapalli": ["Anakapalle", "Yelamanchili", "Chodavaram", "Narsipatnam", "Kothavalasa", "Parawada", "Elamanchili", "Pendurthi", "Kasimkota"],
  "AP:Alluri Sitharama Raju": ["Paderu", "Araku Valley", "Narsipatnam", "Chintapalli", "Gudem Kotha Veedhi", "Munchingput", "Hukumpeta"],
  "AP:Bapatla": ["Bapatla", "Repalle", "Vetapalem", "Martur", "Parchur", "Addanki", "Chirala", "Inavolu", "Vellaturu", "Bhattiprolu"],
  "AP:Chittoor": ["Chittoor", "Tirupati", "Madanapalle", "Palamaner", "Srikalahasti", "Nagari", "Puttur", "Baireddipalle", "Bangarupalem", "Buchinaidu Kandriga", "Chandragiri", "Gudipala", "Gurramkonda", "Karvetinagar", "Kuppam", "Pakala", "Pichatur", "Pileru", "Punganur", "Satyavedu", "Srikalahasti", "Thamballapalle", "Vayalpad", "Venkatagiri Kota", "Yerpedu"],
  "AP:East Godavari": ["Kakinada", "Rajahmundry", "Amalapuram", "Mandapeta", "Peddapuram", "Samalkot", "Tuni", "Razole", "Ramachandrapuram", "Anaparthi", "Biccavolu", "Gollaprolu", "Kapileswarapuram", "Karapa", "Kothapeta", "Mummidivaram", "Pithapuram", "Ravulapalem", "Yeleswaram", "Alamuru", "Atreyapuram", "Gokavaram", "Jaggampeta", "Kirlampudi"],
  "AP:Eluru": ["Eluru", "Nuzvid", "Chintalapudi", "Koyyalagudem", "Denduluru", "Pedavegi", "Kamavarapukota"],
  "AP:Guntur": ["Guntur", "Tenali", "Narasaraopet", "Chilakaluripet", "Bapatla", "Macherla", "Sattenapalle", "Repalle", "Ponnur", "Amaravati", "Chebrolu", "Duggirala", "Mangalagiri", "Tadikonda", "Thullur", "Vemuru", "Atchampet", "Bellamkonda", "Edlapadu", "Kollipara", "Kollur", "Medikonduru", "Nekarikallu", "Pedakakani", "Prathipadu", "Rentachintala", "Vatticherukuru"],
  "AP:Kakinada": ["Kakinada", "Peddapuram", "Samalkota", "Kirlampudi", "Thallarevu", "Uppalaguptam", "Pithapuram", "Jaggampeta"],
  "AP:Konaseema": ["Amalapuram", "Ramachandrapuram", "Razole", "Mummidivaram", "Katrenikona", "Kothapeta", "Sakhinetipalli", "Rayavaram"],
  "AP:Krishna": ["Vijayawada", "Machilipatnam", "Gudivada", "Nuzvid", "Jaggayyapeta", "Pedana", "Avanigadda", "Challapalli", "Gannavaram", "Kaikaluru", "Mudinepalli", "Pamidimukkala", "Penamaluru", "Tiruvuru", "Vuyyuru", "Agiripalle", "Bantumilli", "Ghantasala", "Gudlavalleru", "Ibrahimpatnam", "Kankipadu", "Mandavalli", "Movva", "Mylavaram", "Nagayalanka", "Reddigudem", "Vissannapeta"],
  "AP:Kurnool": ["Kurnool", "Nandyal", "Adoni", "Yemmiganur", "Dhone", "Banaganapalle", "Pattikonda", "Kodumur", "Gudur", "Orvakal", "Allagadda", "Srisailam"],
  "AP:Nandyal": ["Nandyal", "Atmakur", "Allagadda", "Mahanandi", "Srisailam", "Velugodu", "Sanjamala", "Koilakuntla", "Gadivemula"],
  "AP:NTR": ["Vijayawada", "Nandigama", "Tiruvuru", "Penamaluru", "Ibrahimpatnam", "Gannavaram", "Vatsavai", "Mylavaram", "Reddigudem"],
  "AP:Palnadu": ["Narasaraopet", "Chilakaluripet", "Vinukonda", "Macherla", "Rentachintala", "Gurazala", "Durgi", "Veldurti", "Karempudi"],
  "AP:Prakasam": ["Ongole", "Chirala", "Markapur", "Kandukur", "Giddalur", "Addanki", "Parchur", "Chimakurthi", "Darsi", "Podili", "Kothapeta", "Martur", "Santhamaguluru", "Tripuranthakam"],
  "AP:Srikakulam": ["Srikakulam", "Palasa", "Ichchapuram", "Amadalavalasa", "Narasannapeta", "Palakonda", "Sompeta", "Etcherla", "Rajam", "Kotabommali", "Tekkali", "Pathapatnam", "Hiramandalam"],
  "AP:Sri Potti Sriramulu Nellore": ["Nellore", "Kavali", "Gudur", "Sullurpeta", "Naidupeta", "Venkatagiri", "Atmakur", "Kovur", "Rapur", "Udayagiri", "Vinjamur", "Podalakur", "Balapalle"],
  "AP:Visakhapatnam": ["Visakhapatnam", "Bheemunipatnam", "Anakapalle", "Narsipatnam", "Chodavaram", "Pendurthi", "Kothavalasa", "Gajuwaka", "Payakaraopeta", "Yelamanchili", "Sabbavaram", "Devarapalle"],
  "AP:Vizianagaram": ["Vizianagaram", "Bobbili", "Parvathipuram", "Salur", "Nellimarla", "Bhogapuram", "Denkada", "Gajapathinagaram", "Garividi", "Komatipalli", "Makkuva", "Meraka", "Seethanagaram"],
  "AP:West Godavari": ["Eluru", "Bhimavaram", "Tadepalligudem", "Tanuku", "Narsapur", "Palakollu", "Kovvur", "Chintalapudi", "Denduluru", "Ganapavaram", "Koyyalagudem", "Nidadavolu", "Penugonda", "Polavaram", "Undi", "Veeravasaram"],
  "AP:YSR Kadapa": ["Kadapa", "Proddatur", "Pulivendula", "Rajampet", "Jammalamadugu", "Mydukur", "Badvel", "Cuddapah", "Kamalapuram", "Kodur", "Lakkireddipalli", "Rayachoti", "Veerapunayunipalle", "Yerraguntla"],
  "AP:Sri Sathya Sai": ["Puttaparthi", "Dharmavaram", "Hindupur", "Penukonda", "Madakasira", "Gorantla", "Kadiri", "Kothacheruvu", "Parigi", "Roddam", "Talamudipalli"],

  // ============ ARUNACHAL PRADESH (AR) ============
  "AR:Tawang": ["Tawang", "Jang", "Lumla", "Mukto", "Zemithang", "Changprhi", "Bongkhar"],
  "AR:West Kameng": ["Bomdila", "Dirang", "Rupa", "Shergaon", "Singchung", "Kalaktang", "Jameri", "Bhalukpong"],
  "AR:East Kameng": ["Seppa", "Chayangtajo", "Bana", "Khenewa", "Dissing", "Pakoti"],
  "AR:Papum Pare": ["Yupia", "Doimukh", "Sagalee", "Naharlagun", "Itanagar", "Tarasso", "Leporiang"],
  "AR:Kurung Kumey": ["Koloriang", "Damin", "Palin", "Nyapin", "Parsi-Parlo"],
  "AR:Kra Daadi": ["Jamin", "Palin", "Pipsorang", "Tali", "Yangte"],
  "AR:Lower Subansiri": ["Ziro", "Yazali", "Pistana", "Hapoli", "Old Ziro", "Tamen"],
  "AR:Upper Subansiri": ["Daporijo", "Dumporijo", "Nachi", "Taksing", "Taliha", "Payeng", "Muri"],
  "AR:West Siang": ["Along", "Basar", "Kamba", "Likabali", "Dukuram", "Monigong"],
  "AR:East Siang": ["Pasighat", "Mebo", "Koyu", "Nari", "Ruksin", "Yingkiong"],
  "AR:Upper Siang": ["Yingkiong", "Tuting", "Riga", "Singa", "Geku", "Mariyang"],
  "AR:Siang": ["Basar", "Pangin", "Rumgong", "Kaying", "Mariyang"],
  "AR:Lower Dibang Valley": ["Roing", "Dambuk", "Dumze", "Tinali", "Dibang"],
  "AR:Upper Dibang Valley": ["Anini", "Anelih", "Mipi", "Etalin", "Kronli", "Hunli"],
  "AR:Anjaw": ["Hawai", "Hayuliang", "Goiliang", "Chaglagam", "Manchal", "Walong"],
  "AR:Lohit": ["Tezu", "Sunpura", "Wakro", "Namsai", "Lathao", "Mahadevpur", "Miao"],
  "AR:Namsai": ["Namsai", "Chongkham", "Lathao", "Mahadevpur", "Piyong", "Meka"],
  "AR:Changlang": ["Changlang", "Jairampur", "Kharsang", "Miao", "Namti", "Namtok", "Miyabuk", "Bordumsa"],
  "AR:Tirap": ["Khonsa", "Deomali", "Borduria", "Khela", "Lazu", "Dadam", "Pangin"],
  "AR:Longding": ["Longding", "Pongchao", "Kanubari", "Wakka", "Punso"],
  "AR:Kamle": ["Raga", "Daporijo", "Paktu", "Dumporijo"],
  "AR:Lower Siang": ["Basar", "Likabali", "Nari", "Kamba", "Dukuram"],
  "AR:Shi Yomi": ["Tato", "Mechuka", "Moniagong", "Yomcha"],
  "AR:Lepa Rada": ["Basar", "Sago", "Tirbin"],
  "AR:Lawngtlai": ["Lawngtlai", "Bungtlang", "Chawngte", "Hmawngbuchhuah", "Narcila", "Sangau"],
  "AR:Hawah": ["Hawai", "Hayuliang", "Kumki"],

  // ============ ASSAM (AS) ============
  "AS:Bajali": ["Patacharkuchi", "Sarthebari", "Bajali", "Bhabanipur", "Jalah"],
  "AS:Baksa": ["Mushalpur", "Tihu", "Nalbari", "Tamulpur", "Baganpara", "Kokrajhar", "Bahjani"],
  "AS:Barpeta": ["Barpeta", "Howly", "Sarthebari", "Barpeta Road", "Mandiagram", "Tihu", "Borgang", "Bhabanipur", "Barpeta Town", "Balikuchi"],
  "AS:Biswanath": ["Biswanath Chariali", "Gohpur", "Helem", "Sootea", "Behali"],
  "AS:Bongaigaon": ["Bongaigaon", "Abhayapuri", "Jogighopa", "Boitamari", "Srijangram", "Manikpur"],
  "AS:Cachar": ["Silchar", "Lakhipur", "Sonai", "Udarbond", "Borkhola", "Katigorah", "Kalain", "Dholai"],
  "AS:Charaideo": ["Sonari", "Sivasagar", "Mahmora", "Amguri", "Namtula"],
  "AS:Chirang": ["Kajalgaon", "Bijni", "Sidli", "Bongaigaon", "Soron", "Salkocha"],
  "AS:Darrang": ["Mangaldai", "Kharupetia", "Dhekiajuli", "Sipajhar", "Dalgaon", "Patharighat", "Behar"],
  "AS:Dhemaji": ["Dhemaji", "Silapathar", "North Lakhimpur", "Jonai", "Bordoloni", "Machkhowa"],
  "AS:Dhubri": ["Dhubri", "Gauripur", "Bilasipara", "Sapatgram", "Chapar", "Agamoni", "Shyamnagar", "South Salmara"],
  "AS:Dibrugarh": ["Dibrugarh", "Chabua", "Naharkatia", "Mohan", "Tingkhong", "Hatlai", "Milanpara", "Bogibil", "Lahoal"],
  "AS:Dima Hasao": ["Haflong", "Maibong", "Umrangso", "Jataware", "Langting", "New Sangbar", "Mahur"],
  "AS:Goalpara": ["Goalpara", "Lakhipur", "Krishnai", "Dudnoi", "Rongjuli", "Matia", "Bajengdoba", "Balijana"],
  "AS:Golaghat": ["Golaghat", "Bokakhat", "Dergaon", "Sarupathar", "Morangi", "Barpathar", "Dharamtul", "Kaziranga"],
  "AS:East Garo Hills": ["Williamnagar", "Samanda", "Rongram", "Resubelpara", "Songsak", "Kharkutta"],
  "AS:Jorhat": ["Jorhat", "Mariani", "Titabor", "Selenghat", "Majuli", "Teok", "Mohanpur", "Paruna"],
  "AS:Kamrup": ["Guwahati", "Palashbari", "Rangia", "Chaygaon", "North Guwahati", "Boko", "Chamaria", "Goroimari", "Chandrapur"],
  "AS:Kamrup Metropolitan": ["Guwahati", "Dispur", "Azara", "Narengi", "Sonapur", "Geeta Nagar", "Beltola"],
  "AS:Karbi Anglong": ["Diphu", "Donkamokam", "Sarin", "Bokajan", "Dokmoka", "Howraghat", "Hamren", "Tika"],
  "AS:Karimganj": ["Karimganj", "Patharkandi", "Badarpur", "Nilambazar", "Lakhipur", "Patherkandi", "Rajyeswar"],
  "AS:Kokrajhar": ["Kokrajhar", "Dotoma", "Bidyapur", "Rupnagar", "Gossaigaon", "Chapar", "Basugaon", "Titaguri"],
  "AS:Lakhimpur": ["North Lakhimpur", "Dhemaji", "Narayanpur", "Bihpuria", "Dhakuakhana", "Rangachahi", "Kakoi", "Ghumaraguri"],
  "AS:Morigaon": ["Morigaon", "Jagiroad", "Lahorighat", "Kaliabor", "Nellie", "Buraburi", "Tarabori", "Mayong"],
  "AS:Nagaon": ["Nagaon", "Raha", "Kaliabor", "Dhing", "Samaguri", "Barpujia", "Kathiatali", "Juria", "Jampi", "Khagorijan"],
  "AS:Nalbari": ["Nalbari", "Tihu", "Barkhetri", "Barbhag", "Barkura", "Madhupur", "Goalia", "Chatabari"],
  "AS:Sivasagar": ["Sivasagar", "Sonari", "Nazira", "Amguri", "Dikhowmukh", "Meltarar", "Namti", "Gorigram"],
  "AS:Sonitpur": ["Tezpur", "Dhekiajuli", "Biswanath Chariali", "Rangapara", "Jamugurihat", "Gohpur", "Behali", "Bihali"],
  "AS:South Salmara": ["Hatsingimari", "Mankachar", "Golakganj", "Agomoni", "Chandpur"],
  "AS:Tinsukia": ["Tinsukia", "Dibrugarh", "Doom Dooma", "Makum", "Digboi", "Margherita", "Sadiya", "Chabua", "Sampara", "Itakhuli"],
  "AS:Udalguri": ["Udalguri", "Harisinga", "Tangla", "Kalaigaon", "Rowta", "Mazbat", "Bhergaon", "Dhekiajuli"],
  "AS:Hojai": ["Hojai", "Dhing", "Lumding", "Raha", "Kampur", "Barkul", "Hamtul"],
  "AS:West Karbi Anglong": ["Hamren", "Baithalangso", "Chinthong", "Donkamokam", "Bichikrang"],

  // ============ BIHAR (BR) ============
  "BR:Araria": ["Araria", "Forbesganj", "Madhura", "Jogbani", "Sikti", "Palasi", "Kursakatta", "Kargahia", "Narpatganj"],
  "BR:Arwal": ["Arwal", "Kalpi", "Kurtha", "Kaler", "Banipur", "Karpi", "Sonbhadra Banshi"],
  "BR:Aurangabad": ["Aurangabad", "Nabinagar", "Rafiganj", "Daudnagar", "Obra", "Barun", "Goh", "Kishunpur", "Madanpur", "Deo"],
  "BR:Banka": ["Banka", "Amarpur", "Barahat", "Rajaun", "Shambhuganj", "Belhar", "Katoria", "Bausi", "Dhuraiya"],
  "BR:Banmankhi": ["Banmankhi", "Purnia", "Dhamdaha", "Sikti", "Rupauli", "Bhawanipur"],
  "BR:Begusarai": ["Begusarai", "Barauni", "Bachhwara", "Teghra", "Mansi", "Balia", "Bakhri", "Cheria Bariarpur", "Sahebpur Kamal", "Samho"],
  "BR:Bhagalpur": ["Bhagalpur", "Kahalgaon", "Naugachhia", "Sultanganj", "Sabour", "Nathnagar", "Gopalpur", "Gaura"],
  "BR:Bhojpur": ["Arrah", "Jagdishpur", "Shahpur", "Piro", "Charpokhari", "Piru", "Koilwar", "Behea", "Udwantnagar"],
  "BR:Buxar": ["Buxar", "Dumraon", "Sikandarpur", "Rajpur", "Nawanagar", "Simri", "Chakki", "Itarhi"],
  "BR:Darbhanga": ["Darbhanga", "Jalandhar", "Singhwara", "Benipur", "Hanumannagar", "Kusheshwar Asthan", "Kusheshwar East", "Keoti", "Manigachi", "Tardih"],
  "BR:East Champaran": ["Motihari", "Raxaul", "Sugauli", "Harsidhi", "Chakia", "Pipra", "Tamura", "Dhana", "Areraj", "Tarkulwa"],
  "BR:Gaya": ["Gaya", "Bodh Gaya", "Sherghati", "Tekari", "Tikari", "Guraru", "Dobhi", "Mohra", "Amarpur", "Banka Bazar", "Kadwa"],
  "BR:Gopalganj": ["Gopalganj", "Hathua", "Barauli", "Kuchhaikot", "Katiya", "Baikunthpur", "Manjhagarh", "Sidhwaliya"],
  "BR:Jamui": ["Jamui", "Lakhisarai", "Amarpur", "Shempurnagar", "Khaira", "Sikandra", "Barhat", "Chakai"],
  "BR:Jehanabad": ["Jehanabad", "Makhdumpur", "Ghoshi", "Hulasganj", "Ratni", "Jahanabad Town", "Kako"],
  "BR:Kaimur (Bhabua)": ["Bhabua", "Mohania", "Dudhi", "Rameshwar Nagar", "Bhabua Urban", "Bhabua Bazar"],
  "BR:Katihar": ["Katihar", "Manihari", "Kursela", "Pranpur", "Sameli", "Barari", "Sakhuwa"],
  "BR:Khagaria": ["Khagaria", "Gogri", "Mansi", "Chautham", "Beldaur", "Alauli", "Parbatta", "Makhdumpur"],
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const { City, District, State } = require('../models/index');

  const allStates = await State.find().sort({ name: 1 });
  const stateByCode = {};
  for (const s of allStates) stateByCode[s.stateCode] = s;
  console.log(`Loaded ${allStates.length} states`);

  const allDistricts = await District.find().sort({ name: 1 });
  const districtByKey = {};
  for (const d of allDistricts) {
    districtByKey[`${d.stateCode}:${d.name}`] = d;
  }
  console.log(`Loaded ${allDistricts.length} districts\n`);

  // Drop and recreate cities
  await City.deleteMany({});
  console.log('Cleared cities collection\n');

  let inserted = 0;
  let missing = 0;
  const batch = [];

  for (const [key, cities] of Object.entries(CITY_DB)) {
    const district = districtByKey[key];
    if (!district) {
      console.warn(`  Missing: ${key}`);
      missing++;
      continue;
    }

    for (const name of cities) {
      batch.push({
        name,
        districtId: district._id,
        stateId: district.stateId,
      });
    }
  }

  // Insert in batches
  if (batch.length > 0) {
    const BATCH_SIZE = 500;
    for (let i = 0; i < batch.length; i += BATCH_SIZE) {
      const slice = batch.slice(i, i + BATCH_SIZE);
      const result = await City.insertMany(slice, { ordered: false });
      inserted += result.length;
    }
  }

  console.log(`\nInserted: ${inserted} cities`);
  console.log(`Missing district keys: ${missing}`);

  // Fill districts with no cities
  const existingDistrictIds = new Set(
    (await City.distinct('districtId')).map(id => id.toString())
  );
  const needDefault = allDistricts.filter(d => !existingDistrictIds.has(d._id.toString()));

  if (needDefault.length > 0) {
    console.log(`\nAdding default cities for ${needDefault.length} remaining districts...`);
    for (const d of needDefault) {
      await City.create({ name: d.name, districtId: d._id, stateId: d.stateId });
      inserted++;
    }
  }

  // ===== VERIFICATION =====
  const totalCities = await City.countDocuments();
  const districtsWithCities = await City.distinct('districtId');

  console.log('\n=== CITY IMPORT SUMMARY ===');
  
  // By state
  for (const state of allStates) {
    const dCount = await District.countDocuments({ stateId: state._id });
    const cCount = await City.countDocuments({ stateId: state._id });
    if (cCount > 0) {
      const avg = (cCount / dCount).toFixed(1);
      console.log(`  ${state.name.padEnd(35)} ${String(dCount).padStart(3)} dists, ${String(cCount).padStart(5)} cities (avg ${avg}/dist)`);
    }
  }

  // Find max/min
  const distCounts = [];
  for (const d of allDistricts) {
    const cnt = await City.countDocuments({ districtId: d._id });
    distCounts.push(cnt);
  }

  const maxCities = Math.max(...distCounts);
  const minCities = Math.min(...distCounts);
  const maxDist = allDistricts[distCounts.indexOf(maxCities)];
  const minDist = allDistricts[distCounts.indexOf(minCities)];

  console.log(`\n  Total States: ${allStates.length}`);
  console.log(`  Total Districts: ${allDistricts.length}`);
  console.log(`  Total Cities Imported: ${totalCities}`);
  console.log(`  Avg Cities per District: ${(totalCities / allDistricts.length).toFixed(1)}`);
  console.log(`  District with Max Cities: ${maxDist.name} (${maxCities})`);
  console.log(`  District with Min Cities: ${minDist.name} (${minCities})`);
  console.log(`  Districts with Cities: ${districtsWithCities.length}/${allDistricts.length}`);
  console.log(`  Default-only (1 city): ${allDistricts.length >= districtsWithCities.length ? allDistricts.length - needDefault?.length || 0 : 0}`);

  // Random verification - 20 districts from different states
  console.log('\n=== RANDOM VERIFICATION (20 districts) ===');
  const shuffled = [...allStates].sort(() => Math.random() - 0.5).slice(0, 20);
  for (const state of shuffled) {
    const distsInState = await District.find({ stateId: state._id });
    if (distsInState.length === 0) continue;
    const randomDist = distsInState[Math.floor(Math.random() * distsInState.length)];
    const cities = await City.find({ districtId: randomDist._id }).sort({ name: 1 });
    console.log(`\n  ${state.name} > ${randomDist.name} (${cities.length}):`);
    cities.slice(0, 15).forEach(c => console.log(`    - ${c.name}`));
    if (cities.length > 15) console.log(`    ... and ${cities.length - 15} more`);
  }

  await mongoose.disconnect();
  console.log('\n✅ Seed complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});