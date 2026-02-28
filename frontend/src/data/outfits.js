// Outfit catalog for Petr customization
// Types: hat, shirt, accessory, pants

export const outfits = [
  // Hats
  {
    id: 1,
    name: 'Baseball Cap',
    type: 'hat',
    cost: 15,
    imageUrl: '/outfits/baseball-cap.png',
  },
  {
    id: 2,
    name: 'Beanie',
    type: 'hat',
    cost: 12,
    imageUrl: '/outfits/beanie.png',
  },
  {
    id: 3,
    name: 'Crown',
    type: 'hat',
    cost: 30,
    imageUrl: '/outfits/crown.png',
  },
  {
    id: 4,
    name: 'Bucket Hat',
    type: 'hat',
    cost: 18,
    imageUrl: '/outfits/bucket-hat.png',
  },
  {
    id: 5,
    name: 'Visor',
    type: 'hat',
    cost: 10,
    imageUrl: '/outfits/visor.png',
  },

  // Shirts
  {
    id: 6,
    name: 'UCI Jersey',
    type: 'shirt',
    cost: 25,
    imageUrl: '/outfits/uci-jersey.png',
  },
  {
    id: 7,
    name: 'Hoodie',
    type: 'shirt',
    cost: 20,
    imageUrl: '/outfits/hoodie.png',
  },
  {
    id: 8,
    name: 'T-Shirt',
    type: 'shirt',
    cost: 15,
    imageUrl: '/outfits/tshirt.png',
  },
  {
    id: 9,
    name: 'Suit Jacket',
    type: 'shirt',
    cost: 35,
    imageUrl: '/outfits/suit.png',
  },
  {
    id: 10,
    name: 'Tank Top',
    type: 'shirt',
    cost: 12,
    imageUrl: '/outfits/tank.png',
  },

  // Accessories
  {
    id: 11,
    name: 'Sunglasses',
    type: 'accessory',
    cost: 15,
    imageUrl: '/outfits/sunglasses.png',
  },
  {
    id: 12,
    name: 'Scarf',
    type: 'accessory',
    cost: 18,
    imageUrl: '/outfits/scarf.png',
  },
  {
    id: 13,
    name: 'Necklace',
    type: 'accessory',
    cost: 22,
    imageUrl: '/outfits/necklace.png',
  },
  {
    id: 14,
    name: 'Backpack',
    type: 'accessory',
    cost: 25,
    imageUrl: '/outfits/backpack.png',
  },
  {
    id: 15,
    name: 'Watch',
    type: 'accessory',
    cost: 20,
    imageUrl: '/outfits/watch.png',
  },

  // Pants
  {
    id: 16,
    name: 'Jeans',
    type: 'pants',
    cost: 18,
    imageUrl: '/outfits/jeans.png',
  },
  {
    id: 17,
    name: 'Shorts',
    type: 'pants',
    cost: 15,
    imageUrl: '/outfits/shorts.png',
  },
  {
    id: 18,
    name: 'Joggers',
    type: 'pants',
    cost: 20,
    imageUrl: '/outfits/joggers.png',
  },
];

// Helper to get random shop items
export const getRandomShopItems = (count = 3, ownedOutfitIds = []) => {
  const availableOutfits = outfits.filter(o => !ownedOutfitIds.includes(o.id));
  
  if (availableOutfits.length === 0) {
    return [];
  }
  
  const shuffled = [...availableOutfits].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, availableOutfits.length));
};

// Helper to get outfit by ID
export const getOutfitById = (id) => {
  return outfits.find(o => o.id === id);
};

// Helper to get outfits by type
export const getOutfitsByType = (type) => {
  return outfits.filter(o => o.type === type);
};
