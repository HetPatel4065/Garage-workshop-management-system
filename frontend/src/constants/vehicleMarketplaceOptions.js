/** Shared with customer marketplace filters — keep values in sync */
export const BODY_TYPE_OPTIONS = [
  "Hatchback",
  "Sedan",
  "SUV",
  "MUV",
  "Minivan",
  "Coupe",
];

export const SEATS_OPTIONS = ["4", "5", "6", "7", "8+"];

export const OWNERSHIP_OPTIONS = [
  "1st Owner",
  "2nd Owner",
  "3rd Owner",
  "4th Owner+",
];

export const COLOR_OPTIONS = [
  "White",
  "Black",
  "Silver",
  "Grey",
  "Red",
  "Blue",
  "Other",
];

export const CAR_MAKES_MODELS = {
  "Maruti Suzuki": [
    "800",
    "Alto",
    "Alto K10",
    "A-Star",
    "Celerio",
    "Celerio X",
    "S-Presso",
    "WagonR",
    "Zen",
    "Zen Estilo",
    "Ritz",
    "Swift",
    "Swift Dzire",
    "Dzire",
    "Baleno",
    "Ignis",
    "Fronx",
    "Ciaz",
    "Eeco",
    "XL6",
    "Ertiga",
    "Brezza",
    "Grand Vitara",
    "Jimny",
    "Kizashi",
  ],

  Hyundai: [
    "Santro",
    "Eon",
    "i10",
    "Grand i10",
    "Grand i10 Nios",
    "i20",
    "Elite i20",
    "i20 N Line",
    "Getz",
    "Xcent",
    "Aura",
    "Verna",
    "Venue",
    "Creta",
    "Alcazar",
    "Tucson",
    "Kona Electric",
    "Exter",
  ],

  Tata: [
    "Indica",
    "Indigo",
    "Manza",
    "Bolt",
    "Zest",
    "Nano",
    "Tiago",
    "Tigor",
    "Altroz",
    "Punch",
    "Nexon",
    "Harrier",
    "Safari",
    "Curvv",
    "Tiago EV",
    "Tigor EV",
    "Nexon EV",
    "Punch EV",
    "Harrier EV",
  ],

  Mahindra: [
    "Bolero",
    "Bolero Neo",
    "Scorpio",
    "Scorpio N",
    "XUV300",
    "XUV3XO",
    "XUV500",
    "XUV700",
    "Thar",
    "Thar Roxx",
    "Marazzo",
    "KUV100",
    "Quanto",
    "TUV300",
    "BE 6",
    "XEV 9e",
  ],

  Honda: [
    "Brio",
    "Jazz",
    "Amaze",
    "City",
    "WR-V",
    "Mobilio",
    "BR-V",
    "Elevate",
    "Civic",
    "Accord",
    "CR-V",
  ],

  Toyota: [
    "Etios",
    "Etios Liva",
    "Glanza",
    "Urban Cruiser",
    "Urban Cruiser Taisor",
    "Hyryder",
    "Innova",
    "Innova Crysta",
    "Innova HyCross",
    "Fortuner",
    "Camry",
    "Corolla Altis",
    "Yaris",
    "Vellfire",
    "Land Cruiser",
  ],

  Kia: ["Sonet", "Seltos", "Carens", "Carnival", "EV6", "EV9"],

  MG: [
    "Astor",
    "Hector",
    "Hector Plus",
    "Gloster",
    "ZS EV",
    "Comet EV",
    "Windsor EV",
  ],

  Renault: ["Kwid", "Triber", "Kiger", "Duster", "Lodgy", "Pulse", "Scala"],

  Nissan: ["Magnite", "Micra", "Sunny", "Terrano", "Kicks", "X-Trail"],

  Volkswagen: [
    "Polo",
    "Vento",
    "Ameo",
    "Virtus",
    "Taigun",
    "Jetta",
    "Passat",
    "Tiguan",
    "T-Roc",
  ],

  Skoda: [
    "Fabia",
    "Rapid",
    "Slavia",
    "Kushaq",
    "Octavia",
    "Superb",
    "Kodiaq",
    "Yeti",
  ],

  Ford: [
    "Figo",
    "Aspire",
    "Freestyle",
    "EcoSport",
    "Endeavour",
    "Fiesta",
    "Ikon",
  ],

  Jeep: ["Compass", "Meridian", "Wrangler", "Grand Cherokee"],

  Mercedes: [
    "A-Class",
    "C-Class",
    "E-Class",
    "S-Class",
    "CLA",
    "GLA",
    "GLB",
    "GLC",
    "GLE",
    "GLS",
    "G-Wagon",
    "EQS",
    "EQE",
  ],

  BMW: [
    "2 Series",
    "3 Series",
    "5 Series",
    "7 Series",
    "X1",
    "X3",
    "X5",
    "X7",
    "XM",
    "i4",
    "i7",
    "iX",
  ],

  Audi: [
    "A3",
    "A4",
    "A6",
    "A8",
    "Q2",
    "Q3",
    "Q5",
    "Q7",
    "Q8",
    "e-tron",
    "Q8 e-tron",
  ],

  Volvo: ["XC40", "XC60", "XC90", "S90", "C40 Recharge"],

  Other: ["Other"],
};

export const CAR_MAKE_OPTIONS = Object.keys(CAR_MAKES_MODELS);

export const YEAR_OPTIONS = Array.from(
  { length: new Date().getFullYear() - 2000 + 1 },
  (_, i) => String(new Date().getFullYear() - i),
);

export const TRANSMISSION_OPTIONS = {
  Manual: ["Manual Transmission (MT)", "Automated Manual Transmission (AMT)"],
  Automatic: ["Torque Converter AT", "CVT", "DCT/DSG", "AMT", "e-CVT"],
};

export const TRANSMISSION_TYPES = Object.keys(TRANSMISSION_OPTIONS);
