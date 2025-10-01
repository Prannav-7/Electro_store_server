const mongoose = require('mongoose');
require('dotenv').config();

// Import the Product model
const Product = require('./models/Product');

// Sample electrical products data
const electricalProducts = [
  // MCBs and Circuit Breakers
  {
    name: "Havells 32A MCB Single Pole",
    description: "High-quality miniature circuit breaker with 32A capacity. Provides excellent protection against overload and short circuit. ISI marked and certified for safety.",
    category: "Electrical Goods",
    subcategory: "Circuit Breakers",
    price: 185,
    mrp: 220,
    stock: 150,
    unit: "piece",
    brand: "Havells",
    model: "DHMGCSPF032",
    imageUrl: "/images/mcb.svg",
    isActive: true,
    isFeatured: true,
    specifications: {
      "voltage": "240V AC",
      "current": "32A",
      "poles": "1",
      "breaking_capacity": "6kA",
      "certification": "ISI",
      "mounting": "DIN Rail"
    },
    tags: ["mcb", "circuit breaker", "havells", "32a", "single pole"],
    supplier: {
      name: "Havells India Ltd",
      contact: "+91-11-4022-4022",
      location: "New Delhi"
    }
  },
  {
    name: "Schneider 63A DP MCB",
    description: "Premium double pole MCB with 63A rating. Advanced magnetic and thermal protection. Suitable for industrial and commercial applications.",
    category: "Electrical Goods",
    subcategory: "Circuit Breakers",
    price: 485,
    mrp: 550,
    stock: 80,
    unit: "piece",
    brand: "Schneider Electric",
    model: "A9F74263",
    imageUrl: "/images/mcb.svg",
    isActive: true,
    isFeatured: false,
    specifications: {
      "voltage": "415V AC",
      "current": "63A",
      "poles": "2",
      "breaking_capacity": "10kA",
      "certification": "ISI, CE",
      "mounting": "DIN Rail"
    },
    tags: ["mcb", "schneider", "63a", "double pole", "industrial"]
  },

  // Switches and Sockets
  {
    name: "Legrand Myrius 6A Switch",
    description: "Premium modular switch with sleek white finish. Superior contact system ensures long life. Perfect for modern homes and offices.",
    category: "Switches & Sockets",
    subcategory: "Modular Switches",
    price: 125,
    mrp: 150,
    stock: 200,
    unit: "piece",
    brand: "Legrand",
    model: "673001",
    imageUrl: "/images/switch.svg",
    isActive: true,
    isFeatured: true,
    specifications: {
      "voltage": "240V AC",
      "current": "6A",
      "color": "White",
      "material": "PC (Polycarbonate)",
      "mounting": "Flush Mount",
      "warranty": "2 Years"
    },
    tags: ["switch", "modular", "legrand", "white", "6a"]
  },
  {
    name: "Anchor Roma 16A Socket",
    description: "Heavy duty 3 pin socket with child protection shutters. ISI marked with superior build quality for long lasting performance.",
    category: "Switches & Sockets",
    subcategory: "Power Sockets",
    price: 165,
    mrp: 190,
    stock: 120,
    unit: "piece",
    brand: "Anchor by Panasonic",
    model: "68716",
    imageUrl: "/images/switch.svg",
    isActive: true,
    isFeatured: false,
    specifications: {
      "voltage": "240V AC",
      "current": "16A",
      "pins": "3 Pin",
      "protection": "Child Safety Shutters",
      "certification": "ISI",
      "material": "ABS Plastic"
    },
    tags: ["socket", "16a", "anchor", "3pin", "child protection"]
  },

  // LED Lights
  {
    name: "Philips 12W LED Bulb Cool White",
    description: "Energy efficient LED bulb with 12W power consumption equivalent to 100W incandescent. Cool white light perfect for workspaces.",
    category: "Lighting Solutions",
    subcategory: "LED Bulbs",
    price: 145,
    mrp: 180,
    stock: 300,
    unit: "piece",
    brand: "Philips",
    model: "929001365717",
    imageUrl: "/images/led-bulb.svg",
    isActive: true,
    isFeatured: true,
    specifications: {
      "wattage": "12W",
      "equivalent": "100W Incandescent",
      "color_temperature": "6500K Cool White",
      "luminous_flux": "1055 Lumens",
      "base": "B22",
      "life": "15000 Hours",
      "voltage": "220-240V"
    },
    tags: ["led", "bulb", "philips", "12w", "cool white", "energy efficient"]
  },
  {
    name: "Syska 9W LED Panel Light",
    description: "Ultra-slim LED panel light with uniform light distribution. Perfect for false ceilings in offices and homes. Flicker-free operation.",
    category: "Lighting Solutions",
    subcategory: "Panel Lights",
    price: 285,
    mrp: 350,
    stock: 85,
    unit: "piece",
    brand: "Syska",
    model: "SRL-P-9W-6500K",
    imageUrl: "/images/led-bulb.svg",
    isActive: true,
    isFeatured: false,
    specifications: {
      "wattage": "9W",
      "size": "6 inch Round",
      "color_temperature": "6500K Cool White",
      "luminous_flux": "810 Lumens",
      "cutout": "155mm",
      "thickness": "12mm",
      "voltage": "85-265V AC"
    },
    tags: ["led", "panel", "syska", "9w", "round", "ceiling"]
  },

  // Ceiling Fans
  {
    name: "Crompton Greaves 48\" Ceiling Fan",
    description: "Premium ceiling fan with aerodynamically designed blades for maximum air delivery. Dual ball bearing motor for silent operation.",
    category: "Fans & Ventilation",
    subcategory: "Ceiling Fans",
    price: 2850,
    mrp: 3200,
    stock: 45,
    unit: "piece",
    brand: "Crompton Greaves",
    model: "Aura Prime 1200mm",
    imageUrl: "/images/ceiling-fan.svg",
    isActive: true,
    isFeatured: true,
    specifications: {
      "sweep": "1200mm (48 inch)",
      "rpm": "380 RPM",
      "air_delivery": "230 CMM",
      "power_consumption": "75W",
      "motor": "Dual Ball Bearing",
      "blades": "3 Blades",
      "warranty": "2 Years"
    },
    tags: ["ceiling fan", "crompton", "48 inch", "premium", "silent"]
  },

  // Power Tools
  {
    name: "Bosch GSB 600 RE Impact Drill",
    description: "Professional impact drill with 600W motor. Suitable for drilling in wood, metal, and masonry. Variable speed control with forward/reverse.",
    category: "Power Tools",
    subcategory: "Drill Machines",
    price: 3850,
    mrp: 4200,
    stock: 25,
    unit: "piece",
    brand: "Bosch",
    model: "GSB 600 RE",
    imageUrl: "/images/drill.svg",
    isActive: true,
    isFeatured: true,
    specifications: {
      "power": "600W",
      "chuck_capacity": "13mm",
      "drilling_capacity_wood": "30mm",
      "drilling_capacity_steel": "13mm",
      "drilling_capacity_masonry": "16mm",
      "no_load_speed": "0-2800 RPM",
      "weight": "1.7 kg"
    },
    tags: ["drill", "bosch", "impact", "600w", "professional"]
  },

  // Cables and Wires
  {
    name: "Polycab 2.5 sq mm House Wire",
    description: "High quality copper house wire with PVC insulation. Suitable for domestic wiring applications. ISI marked and fire retardant.",
    category: "Wiring & Cables",
    subcategory: "House Wires",
    price: 2850,
    mrp: 3100,
    stock: 500,
    unit: "meter",
    brand: "Polycab",
    model: "FR-LSH-2.5",
    imageUrl: "/images/wire.svg",
    isActive: true,
    isFeatured: false,
    specifications: {
      "conductor": "Copper",
      "cross_section": "2.5 sq mm",
      "insulation": "PVC",
      "voltage": "1100V",
      "temperature": "70°C",
      "color": "Red/Yellow/Blue",
      "standard": "IS 694:1990"
    },
    tags: ["wire", "polycab", "2.5 sq mm", "copper", "house wire"]
  },

  // Motors
  {
    name: "Kirloskar 1HP Single Phase Motor",
    description: "High efficiency single phase induction motor. Suitable for water pumps, compressors, and industrial applications. Aluminum body construction.",
    category: "Electrical Motors",
    subcategory: "Single Phase Motors",
    price: 4250,
    mrp: 4800,
    stock: 20,
    unit: "piece",
    brand: "Kirloskar",
    model: "KOC-1440-1F",
    imageUrl: "/images/motor.svg",
    isActive: true,
    isFeatured: false,
    specifications: {
      "power": "1 HP (0.75 kW)",
      "voltage": "230V",
      "frequency": "50 Hz",
      "speed": "1440 RPM",
      "efficiency": "75%",
      "frame": "Aluminum",
      "mounting": "Foot Mounted",
      "insulation": "Class F"
    },
    tags: ["motor", "kirloskar", "1hp", "single phase", "induction"]
  },

  // Tool Boxes and Accessories
  {
    name: "Stanley 19\" Tool Box with Tray",
    description: "Heavy duty tool box with removable tray. Made from high-impact polypropylene. Perfect for organizing electrical tools and accessories.",
    category: "Hardware & Tools",
    subcategory: "Tool Storage",
    price: 1850,
    mrp: 2200,
    stock: 35,
    unit: "piece",
    brand: "Stanley",
    model: "STST19005",
    imageUrl: "/images/toolbox.svg",
    isActive: true,
    isFeatured: false,
    specifications: {
      "size": "19 inch",
      "material": "Polypropylene",
      "features": "Removable Tray",
      "closure": "Metal Latches",
      "handle": "Ergonomic",
      "color": "Black/Yellow",
      "weight": "1.2 kg"
    },
    tags: ["toolbox", "stanley", "19 inch", "storage", "tray"]
  },

  // Extension Boards
  {
    name: "Goldmedal 6 Socket Extension Board",
    description: "Heavy duty extension board with 6 sockets and individual switches. Built-in surge protection and LED indicators. 3 meter cable length.",
    category: "Electrical Goods",
    subcategory: "Extension Boards",
    price: 485,
    mrp: 550,
    stock: 75,
    unit: "piece",
    brand: "Goldmedal",
    model: "206002",
    imageUrl: "/images/electrical-goods.svg",
    isActive: true,
    isFeatured: true,
    specifications: {
      "sockets": "6 Universal Sockets",
      "switches": "Individual Switches",
      "cable_length": "3 Meters",
      "protection": "Surge Protection",
      "indicators": "LED Indicators",
      "rating": "16A",
      "certification": "ISI"
    },
    tags: ["extension board", "goldmedal", "6 socket", "surge protection"]
  },

  // Industrial Items
  {
    name: "L&T 100A Contactor 3 Pole",
    description: "Heavy duty contactor for motor control applications. Suitable for switching and controlling AC motors up to 45kW. Silver alloy contacts.",
    category: "Electrical Goods",
    subcategory: "Contactors",
    price: 1850,
    mrp: 2100,
    stock: 30,
    unit: "piece",
    brand: "L&T",
    model: "CS94105",
    imageUrl: "/images/electrical-goods.svg",
    isActive: true,
    isFeatured: false,
    specifications: {
      "current": "100A",
      "poles": "3 Pole",
      "coil_voltage": "230V AC",
      "motor_power": "45kW at 415V",
      "contacts": "Silver Alloy",
      "auxiliary_contacts": "1NO + 1NC",
      "mounting": "DIN Rail/Panel"
    },
    tags: ["contactor", "l&t", "100a", "3 pole", "motor control"]
  },

  // Safety Equipment
  {
    name: "3M Safety Helmet with Chin Strap",
    description: "High-impact ABS safety helmet with adjustable chin strap. Meets international safety standards. Perfect for electrical work sites.",
    category: "Safety Equipment",
    subcategory: "Head Protection",
    price: 285,
    mrp: 350,
    stock: 100,
    unit: "piece",
    brand: "3M",
    model: "H-701R",
    imageUrl: "/images/safety-equipment.svg",
    isActive: true,
    isFeatured: false,
    specifications: {
      "material": "ABS",
      "color": "White",
      "adjustment": "Ratchet Suspension",
      "chin_strap": "Included",
      "ventilation": "Yes",
      "standard": "IS 2925:1984",
      "weight": "350g"
    },
    tags: ["safety helmet", "3m", "abs", "chin strap", "white"]
  },

  // More LED Products
  {
    name: "Wipro 20W LED Tube Light",
    description: "High efficiency T8 LED tube light. Direct replacement for fluorescent tubes. Instant start with uniform light distribution.",
    category: "Lighting Solutions",
    subcategory: "Tube Lights",
    price: 385,
    mrp: 450,
    stock: 150,
    unit: "piece",
    brand: "Wipro",
    model: "D521120",
    imageUrl: "/images/led-bulb.svg",
    isActive: true,
    isFeatured: false,
    specifications: {
      "wattage": "20W",
      "length": "4 feet (1200mm)",
      "color_temperature": "6500K Cool White",
      "luminous_flux": "2000 Lumens",
      "base": "G13",
      "life": "25000 Hours",
      "voltage": "85-265V AC"
    },
    tags: ["led", "tube light", "wipro", "20w", "4 feet", "t8"]
  },

  // More Switches
  {
    name: "Havells Crabtree Verona 25A DP Switch",
    description: "Premium double pole switch with indicator. Heavy duty contacts suitable for high current applications. Elegant pearl white finish.",
    category: "Switches & Sockets",
    subcategory: "Heavy Duty Switches",
    price: 185,
    mrp: 220,
    stock: 90,
    unit: "piece",
    brand: "Havells Crabtree",
    model: "ACVSXXXW25",
    imageUrl: "/images/switch.svg",
    isActive: true,
    isFeatured: false,
    specifications: {
      "voltage": "240V AC",
      "current": "25A",
      "poles": "Double Pole",
      "indicator": "Neon Indicator",
      "color": "Pearl White",
      "material": "Urea Formaldehyde",
      "mounting": "Surface Mount"
    },
    tags: ["switch", "havells", "25a", "double pole", "indicator"]
  }
];

// Function to seed the database
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully!');

    // Clear existing products (optional - comment out if you want to keep existing products)
    console.log('Clearing existing products...');
    await Product.deleteMany({});
    console.log('Existing products cleared.');

    // Insert new products
    console.log('Inserting new products...');
    const insertedProducts = await Product.insertMany(electricalProducts);
    console.log(`Successfully inserted ${insertedProducts.length} products!`);

    // Display summary
    console.log('\n--- PRODUCT SUMMARY ---');
    const categories = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    categories.forEach(cat => {
      console.log(`${cat._id}: ${cat.count} products`);
    });

    console.log('\n--- FEATURED PRODUCTS ---');
    const featuredProducts = await Product.find({ isFeatured: true }).select('name brand price');
    featuredProducts.forEach(product => {
      console.log(`- ${product.name} by ${product.brand} - ₹${product.price}`);
    });

    console.log('\nDatabase seeding completed successfully! 🎉');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  }
};

// Run the seeding function
console.log('🌱 Starting database seeding process...');
seedDatabase();
