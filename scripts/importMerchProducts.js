import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhc29maWdzdm5uYXFzcXJqZW5rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjg3ODY3MiwiZXhwIjoyMDUyNDU0NjcyfQ.TlZfRaC_mJdXg6hcELv0_Hzxb3oy1-d_rLf8RxZOBGI'
);

const products = [
  {
    id: "f1b2476d-590a-415c-aa76-60c19dfb45ba",
    name: "T-Shirt",
    description: "Premium t-shirts available in Cotton or Performance fabric",
    price: 38,
    base_price: 38,
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "tops",
    in_stock: true,
    display_order: 1,
    designs: [
      {
        type: "Cotton",
        colors: [
          { name: "Bone", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Shirts/Cotton_BoneT.png" },
          { name: "Black", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Shirts/Cotton_BlackT.png" },
          { name: "White", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Shirts/Cotton_WhiteT.png" },
          { name: "Grey", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Shirts/Cotton_GrayT.png" },
          { name: "Green", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Shirts/Cotton_GreenT.png" }
        ]
      },
      {
        type: "Performance",
        colors: [
          { name: "Black", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Shirts/Perform_BlackT.png" },
          { name: "Grey", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Shirts/Perform_GrayT.png" },
          { name: "Green", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Shirts/Perform_GreenT.png" },
          { name: "White", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Shirts/Perform_WhiteT.png" }
        ]
      }
    ]
  },
  {
    id: "9f0bb676-b4b2-4bd4-a322-8cdde1be02c0",
    name: "Crew Neck",
    description: "Soft cotton crew neck sweatshirt with premium designs",
    price: 55,
    base_price: 55,
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "tops",
    in_stock: true,
    display_order: 2,
    designs: [
      {
        type: "Cloud Logo",
        colors: [
          { name: "Navy", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Crew%20Neck/Cloud/CC_Navy.png" },
          { name: "Black", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Crew%20Neck/Cloud/CC_Black.png" },
          { name: "Gray", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Crew%20Neck/Cloud/CC_Gray.png" },
          { name: "White", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Crew%20Neck/Cloud/CC_White.png" }
        ]
      },
      {
        type: "Regular Logo",
        colors: [
          { name: "Navy", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Crew%20Neck/Logo/Crew_Navy.png" },
          { name: "Black", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Crew%20Neck/Logo/Crew_Black.png" }
        ]
      }
    ]
  },
  {
    id: "3fbe7550-6081-4af8-bf1d-37b8d1c7a0be",
    name: "Hat",
    description: "Premium performance adjustable hat",
    price: 35,
    base_price: 35,
    sizes: ["One Size"],
    category: "hats",
    in_stock: true,
    display_order: 3,
    designs: [
      {
        type: "Performance",
        colors: [
          { name: "Blue", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Performance%20Hats/PHatLogo_Blue.png" },
          { name: "Black", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Performance%20Hats/PHatLogo_Black.png" },
          { name: "Grey", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Performance%20Hats/PHatLogo_Grey.png" },
          { name: "Bone", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/BoneGreenHat.png" }
        ]
      }
    ]
  },
  {
    id: "1c993333-330f-4181-b3c8-3a3a6247cdae",
    name: "Two Tone Hat",
    description: "Stylish two-tone adjustable hat",
    price: 35,
    base_price: 35,
    sizes: ["One Size"],
    category: "hats",
    in_stock: true,
    display_order: 4,
    designs: [
      {
        type: "Two-Tone",
        colors: [
          { name: "Walnut", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/WalnutPCap.png" },
          { name: "Blue", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/TwoTone_Blue.png" },
          { name: "Green", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/TwoTone_Green.png" },
          { name: "Navy", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/NavyPCap.png" }
        ]
      }
    ]
  },
  {
    id: "c3237336-da27-40c1-a6e3-2610aa84b6b5",
    name: "Jacket",
    description: "Premium zip-up jacket available in Cloud Logo or Regular Logo design",
    price: 75,
    base_price: 75,
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "outerwear",
    in_stock: true,
    display_order: 5,
    designs: [
      {
        type: "Cloud Logo",
        colors: [
          { name: "Gray", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Jacket/Cloud/C_Jacket_Gray.png" },
          { name: "Black", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Jacket/Cloud/C_Jacket_Black.png" },
          { name: "Navy", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Jacket/Cloud/C_Jacket_Navy.png" }
        ]
      },
      {
        type: "Regular Logo",
        colors: [
          { name: "Gray", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Jacket/Logo/Jacket_Gray.png" },
          { name: "Black", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Jacket/Logo/Jacket_Black.png" },
          { name: "Navy", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/Jacket/Logo/Jacket_Navy.png" }
        ]
      }
    ]
  },
  {
    id: "155abbe1-8874-4ce9-b144-7d37d5c1a616",
    name: "Sweatshirt",
    description: "Premium hooded sweatshirt available in Regular Logo or Cloud Logo design",
    price: 65,
    base_price: 65,
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "tops",
    in_stock: true,
    display_order: 6,
    designs: [
      {
        type: "Regular Logo",
        colors: [
          { name: "Black", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/BlackSS.png" },
          { name: "White", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/WhiteSS.png" },
          { name: "Navy", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/NavySS.png" },
          { name: "Green", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/GreenSS.png" }
        ]
      },
      {
        type: "Cloud Logo",
        colors: [
          { name: "Black", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/C_BlackSS.png" },
          { name: "White", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/C_WhiteSS.png" },
          { name: "Navy", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/C_NavySS.png" },
          { name: "Green", image: "https://fzbgwtitjutjogaqkvkp.supabase.co/storage/v1/object/public/merch/C_GreenSS.png" }
        ]
      }
    ]
  },
  {
    id: "94351b9d-3723-4fb0-a54b-d388fcdc7f56",
    name: "Duffel Bag",
    description: "Perfect for carrying all your pickleball gear to the courts",
    price: 70,
    base_price: 70,
    sizes: [],
    category: "accessories",
    in_stock: false,
    display_order: 7,
    designs: []
  },
  {
    id: "fb708451-9648-4150-ab8c-66eae0a83abb",
    name: "Backpack",
    description: "Spacious backpack perfect for carrying all your pickleball essentials",
    price: 70,
    base_price: 70,
    sizes: ["One Size"],
    category: "accessories",
    in_stock: false,
    display_order: 8,
    designs: []
  }
];

async function importProducts() {
  console.log('📦 Importing merch products...\n');

  const { data, error } = await supabase
    .from('merch_products')
    .upsert(products, { onConflict: 'id' })
    .select();

  if (error) {
    console.error('❌ Error importing products:', error);
    process.exit(1);
  }

  console.log(`✅ Successfully imported ${data.length} products!\n`);
  data.forEach(p => console.log(`  - ${p.name} ($${p.price})`));
}

importProducts();
