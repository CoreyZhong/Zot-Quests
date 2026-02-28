import { createContext, useContext, useState, useEffect } from 'react';
import { getRandomQuests } from '../data/quests';
import { getRandomShopItems } from '../data/outfits';

const GameContext = createContext();

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }) => {
  // Load initial auth state from localStorage or use defaults
  const loadAuthState = () => {
    try {
      const saved = localStorage.getItem('zotQuestsAuth');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    }
    return { isLoggedIn: false, currentUser: null };
  };

  // Load initial game state from localStorage or use defaults
  const loadGameState = () => {
    try {
      const saved = localStorage.getItem('zotQuestsState');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          currentPage: 'landing',
          coins: parsed.coins || 0,
          completedQuests: parsed.completedQuests || [],
          activeQuest: null,
          ownedOutfits: parsed.ownedOutfits || [],
          equippedOutfits: parsed.equippedOutfits || {},
          shopInventory: getRandomShopItems(3, parsed.ownedOutfits || []),
          questStartTime: null,
          uploadedImage: null,
        };
      }
    } catch (error) {
      console.error('Error loading saved state:', error);
    }
    
    return {
      currentPage: 'landing',
      coins: 0,
      completedQuests: [],
      activeQuest: null,
      ownedOutfits: [],
      equippedOutfits: {},
      shopInventory: getRandomShopItems(3, []),
      questStartTime: null,
      uploadedImage: null,
    };
  };

  const [auth, setAuth] = useState(loadAuthState);
  const [state, setState] = useState(loadGameState);

  // Save game state to localStorage
  useEffect(() => {
    const toSave = {
      coins: state.coins,
      completedQuests: state.completedQuests,
      ownedOutfits: state.ownedOutfits,
      equippedOutfits: state.equippedOutfits,
    };
    localStorage.setItem('zotQuestsState', JSON.stringify(toSave));
  }, [state.coins, state.completedQuests, state.ownedOutfits, state.equippedOutfits]);

  // Save auth state to localStorage
  useEffect(() => {
    localStorage.setItem('zotQuestsAuth', JSON.stringify(auth));
  }, [auth]);

  // Authentication Methods
  const login = (username, password) => {
    // Mock authentication - in future, this will call Supabase
    if (!username || !password) {
      return { success: false, error: 'Username and password are required' };
    }
    
    try {
      const users = JSON.parse(localStorage.getItem('zotQuestsUsers') || '{}');
      const user = users[username];
      
      if (user && user.password === password) {
        setAuth({ isLoggedIn: true, currentUser: { username } });
        return { success: true };
      }
      return { success: false, error: 'Invalid username or password' };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  const signup = (username, password) => {
    // Mock signup - in future, this will call Supabase
    if (!username || !password) {
      return { success: false, error: 'Username and password are required' };
    }
    
    if (username.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }
    
    try {
      const users = JSON.parse(localStorage.getItem('zotQuestsUsers') || '{}');
      
      if (users[username]) {
        return { success: false, error: 'Username already exists' };
      }
      
      users[username] = { password };
      localStorage.setItem('zotQuestsUsers', JSON.stringify(users));
      
      setAuth({ isLoggedIn: true, currentUser: { username } });
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Signup failed' };
    }
  };

  const logout = () => {
    setAuth({ isLoggedIn: false, currentUser: null });
    setState(prev => ({ ...prev, currentPage: 'login' }));
  };

  // Navigation
  const navigateTo = (page) => {
    setState(prev => ({ ...prev, currentPage: page }));
  };

  // Quest Management
  const acceptQuest = (quest) => {
    setState(prev => ({
      ...prev,
      activeQuest: quest,
      questStartTime: Date.now(),
      uploadedImage: null,
      currentPage: 'proof',
    }));
  };

  const completeQuest = () => {
    if (!state.activeQuest) return;

    const newCompletedQuest = {
      ...state.activeQuest,
      completedAt: new Date().toISOString(),
      imageUrl: state.uploadedImage,
    };

    setState(prev => ({
      ...prev,
      coins: prev.coins + prev.activeQuest.coinReward,
      completedQuests: [...prev.completedQuests, newCompletedQuest],
      activeQuest: null,
      questStartTime: null,
      uploadedImage: null,
      currentPage: 'landing',
    }));
  };

  const setUploadedImage = (imageDataUrl) => {
    setState(prev => ({ ...prev, uploadedImage: imageDataUrl }));
  };

  // Shop & Outfit Management
  const purchaseOutfit = (outfit) => {
    if (state.coins < outfit.cost) {
      alert('Not enough coins!');
      return false;
    }

    if (state.ownedOutfits.includes(outfit.id)) {
      alert('You already own this outfit!');
      return false;
    }

    setState(prev => ({
      ...prev,
      coins: prev.coins - outfit.cost,
      ownedOutfits: [...prev.ownedOutfits, outfit.id],
      shopInventory: prev.shopInventory.filter(item => item.id !== outfit.id),
    }));

    return true;
  };

  const equipOutfit = (outfit) => {
    setState(prev => {
      const newEquipped = { ...prev.equippedOutfits };
      
      // If already equipped, unequip it
      if (newEquipped[outfit.type] === outfit.id) {
        delete newEquipped[outfit.type];
      } else {
        // Otherwise, equip it (replacing any existing item of that type)
        newEquipped[outfit.type] = outfit.id;
      }

      return { ...prev, equippedOutfits: newEquipped };
    });
  };

  const rerollShop = () => {
    if (state.coins < 2) {
      alert('Not enough coins! Reroll costs 2 coins.');
      return false;
    }
    
    const newInventory = getRandomShopItems(3, state.ownedOutfits);
    setState(prev => ({ 
      ...prev, 
      coins: prev.coins - 2,
      shopInventory: newInventory 
    }));
    return true;
  };

  const value = {
    // Auth State
    isLoggedIn: auth.isLoggedIn,
    currentUser: auth.currentUser,
    
    // Game State
    currentPage: state.currentPage,
    coins: state.coins,
    completedQuests: state.completedQuests,
    activeQuest: state.activeQuest,
    ownedOutfits: state.ownedOutfits,
    equippedOutfits: state.equippedOutfits,
    shopInventory: state.shopInventory,
    questStartTime: state.questStartTime,
    uploadedImage: state.uploadedImage,
    
    // Auth Actions
    login,
    signup,
    logout,
    navigateTo,
    acceptQuest,
    completeQuest,
    setUploadedImage,
    purchaseOutfit,
    equipOutfit,
    rerollShop,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
