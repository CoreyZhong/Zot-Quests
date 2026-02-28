// Hardcoded quest data for Zot Quests
// Categories: color, anteater, plants/trees, clothing

export const quests = [
  // Color Quests
  {
    id: 1,
    category: 'color',
    description: 'Find something purple on campus',
    timeLimit: 15, // minutes
    coinReward: 10,
  },
  {
    id: 2,
    category: 'color',
    description: 'Take a picture of something yellow',
    timeLimit: 10,
    coinReward: 8,
  },
  {
    id: 3,
    category: 'color',
    description: 'Find a red object near Aldrich Park',
    timeLimit: 20,
    coinReward: 12,
  },
  {
    id: 4,
    category: 'color',
    description: 'Capture something blue at the campus center',
    timeLimit: 15,
    coinReward: 10,
  },
  {
    id: 5,
    category: 'color',
    description: 'Find an orange item in the student center',
    timeLimit: 12,
    coinReward: 9,
  },

  // Anteater Quests
  {
    id: 6,
    category: 'anteater',
    description: 'Find Peter the Anteater statue',
    timeLimit: 30,
    coinReward: 15,
  },
  {
    id: 7,
    category: 'anteater',
    description: 'Get a photo with someone wearing UCI gear',
    timeLimit: 20,
    coinReward: 12,
  },
  {
    id: 8,
    category: 'anteater',
    description: 'Find 3 people wearing Zot merchandise',
    timeLimit: 25,
    coinReward: 18,
  },
  {
    id: 9,
    category: 'anteater',
    description: 'Visit the Anteater Recreation Center',
    timeLimit: 35,
    coinReward: 20,
  },

  // Plants/Trees Quests
  {
    id: 10,
    category: 'plants',
    description: 'Find a palm tree on campus',
    timeLimit: 15,
    coinReward: 10,
  },
  {
    id: 11,
    category: 'plants',
    description: 'Take a photo of a succulent plant',
    timeLimit: 20,
    coinReward: 11,
  },
  {
    id: 12,
    category: 'plants',
    description: 'Find 5 different types of trees in Aldrich Park',
    timeLimit: 30,
    coinReward: 20,
  },
  {
    id: 13,
    category: 'plants',
    description: 'Photograph a flowering plant',
    timeLimit: 18,
    coinReward: 12,
  },
  {
    id: 14,
    category: 'plants',
    description: 'Find the biggest tree on campus',
    timeLimit: 25,
    coinReward: 15,
  },

  // Clothing Quests
  {
    id: 15,
    category: 'clothing',
    description: 'Find someone wearing a backwards hat',
    timeLimit: 15,
    coinReward: 10,
  },
  {
    id: 16,
    category: 'clothing',
    description: 'Get a photo with someone in sunglasses',
    timeLimit: 12,
    coinReward: 8,
  },
  {
    id: 17,
    category: 'clothing',
    description: 'Find someone wearing a hoodie',
    timeLimit: 10,
    coinReward: 7,
  },
  {
    id: 18,
    category: 'clothing',
    description: 'Take a pic with someone in sneakers',
    timeLimit: 12,
    coinReward: 9,
  },
  {
    id: 19,
    category: 'clothing',
    description: 'Find 3 people wearing the same color shirt',
    timeLimit: 25,
    coinReward: 16,
  },
  {
    id: 20,
    category: 'clothing',
    description: 'Get a photo of someone in a flannel',
    timeLimit: 18,
    coinReward: 11,
  },
];

// Helper function to get random quests
export const getRandomQuests = (count = 3, excludeIds = []) => {
  const availableQuests = quests.filter(q => !excludeIds.includes(q.id));
  const shuffled = [...availableQuests].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper function to get quest by ID
export const getQuestById = (id) => {
  return quests.find(q => q.id === id);
};
