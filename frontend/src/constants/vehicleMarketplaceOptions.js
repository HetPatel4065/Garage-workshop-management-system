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
    "Alto",
    "Swift",
    "Baleno",
    "Dzire",
    "Ertiga",
    "Brezza",
    "Celerio",
    "WagonR",
    "Fronx",
    "Grand Vitara",
  ],
  Hyundai: [
    "i10",
    "i20",
    "Venue",
    "Creta",
    "Tucson",
    "Alcazar",
    "Verna",
    "Aura",
    "Exter",
  ],
  Tata: [
    "Tiago",
    "Tigor",
    "Nexon",
    "Harrier",
    "Safari",
    "Punch",
    "Altroz",
    "Curvv",
  ],
  Mahindra: ["Thar", "Scorpio", "XUV700", "XUV300", "Bolero", "BE 6", "XEV 9e"],
  Honda: ["Amaze", "City", "Elevate", "WR-V"],
  Toyota: [
    "Innova Crysta",
    "Innova HyCross",
    "Fortuner",
    "Glanza",
    "Urban Cruiser Taisor",
    "Camry",
  ],
  Kia: ["Seltos", "Sonet", "Carens", "EV6", "EV9"],
  MG: ["Hector", "Astor", "Gloster", "Comet EV", "Windsor EV", "ZS EV"],
  Renault: ["Kwid", "Triber", "Kiger", "Duster"],
  Nissan: ["Magnite", "X-Trail"],
  Volkswagen: ["Polo", "Vento", "Taigun", "Virtus"],
  Skoda: ["Rapid", "Octavia", "Superb", "Kushaq", "Slavia", "Kodiaq"],
  Ford: ["EcoSport", "Endeavour", "Figo", "Aspire"],
  Jeep: ["Compass", "Meridian", "Wrangler", "Grand Cherokee"],
  Mercedes: [
    "A-Class",
    "C-Class",
    "E-Class",
    "S-Class",
    "GLA",
    "GLC",
    "GLE",
    "EQS",
  ],
  BMW: ["3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "iX"],
  Audi: ["A3", "A4", "A6", "Q3", "Q5", "Q7", "e-tron"],
  Other: ["Other"],
};

export const CAR_MAKE_OPTIONS = Object.keys(CAR_MAKES_MODELS);

export const YEAR_OPTIONS = Array.from(
  { length: new Date().getFullYear() - 2000 + 1 },
  (_, i) => String(new Date().getFullYear() - i)
);


export const TRANSMISSION_OPTIONS = {
  Manual: ["Manual Transmission (MT)", "Automated Manual Transmission (AMT)"],
  Automatic: ["Torque Converter AT", "CVT", "DCT/DSG", "AMT", "e-CVT"],
};

export const TRANSMISSION_TYPES = Object.keys(TRANSMISSION_OPTIONS);