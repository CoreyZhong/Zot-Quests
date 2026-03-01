const clothingImage = (fileName) => new URL(`../assets/clothing/${fileName}`, import.meta.url).href;

export const outfits = [
  {
    id: 1,
    name: 'Baseball Cap',
    cost: 15,
    imageUrl: clothingImage('baseball_cap.png'),
  },
  {
    id: 2,
    name: 'Jersey',
    cost: 25,
    imageUrl: clothingImage('jersey.png'),
  },
  {
    id: 3,
    name: 'Scarf',
    cost: 18,
    imageUrl: clothingImage('scarf.png'),
  },
  {
    id: 4,
    name: 'Sun Glasses',
    cost: 15,
    imageUrl: clothingImage('sunglasses.png'),
  },
  {
    id: 5,
    name: 'Tuxedo',
    cost: 75,
    imageUrl: clothingImage('tuxedo.png'),
  }
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
