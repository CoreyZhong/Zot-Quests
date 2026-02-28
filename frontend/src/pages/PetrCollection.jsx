import { useGame } from '../context/GameContext';
import { outfits, getOutfitById } from '../data/outfits';
import './pages.css';
import './PetrCollection.css';

const PetrCollection = () => {
  const { 
    navigateTo, 
    coins, 
    ownedOutfits, 
    equippedOutfits, 
    shopInventory,
    purchaseOutfit,
    equipOutfit,
    rerollShop 
  } = useGame();

  const handlePurchase = (outfit) => {
    const success = purchaseOutfit(outfit);
    if (success) {
      alert(`Successfully purchased ${outfit.name}!`);
    }
  };

  const handleEquip = (outfitId) => {
    const outfit = getOutfitById(outfitId);
    if (outfit) {
      equipOutfit(outfit);
    }
  };

  const isEquipped = (outfitId, type) => {
    return equippedOutfits[type] === outfitId;
  };

  return (
    <div className="page-container petr-collection-page">
      <button className="back-button" onClick={() => navigateTo('landing')}>
        <div className="back-icon">🐜</div>
        <span>Back</span>
      </button>

      <h1 className="page-title">Petr Collection</h1>

      <div className="petr-collection-layout">
        {/* Left: Shop */}
        <div className="shop-section">
          <h2>Shop</h2>
          <div className="shop-items">
            {shopInventory.length === 0 ? (
              <p className="empty-shop">All items owned!</p>
            ) : (
              shopInventory.map(outfit => (
                <div key={outfit.id} className="shop-item">
                  <div className="shop-item-info">
                    <h4>{outfit.name}</h4>
                    <p>{outfit.type}</p>
                    <p className="outfit-cost">{outfit.cost} coins</p>
                  </div>
                  <div className="shop-item-actions">
                    <button 
                      className="buy-button"
                      onClick={() => handlePurchase(outfit)}
                      disabled={coins < outfit.cost}
                    >
                      Buy
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <button className="reroll-button" onClick={rerollShop}>
            Reroll
          </button>
          <div className="coins-display">
            <strong>Coins: {coins}</strong>
          </div>
        </div>

        {/* Center: Petr Display */}
        <div className="petr-display-section">
          <h2>Petr</h2>
          <div className="petr-display">
            {/* Base anteater */}
            <div className="petr-base">
              <svg width="300" height="300" viewBox="0 0 300 300">
                <ellipse cx="150" cy="200" rx="80" ry="100" fill="#7B9CB5" />
                <ellipse cx="120" cy="120" rx="50" ry="60" fill="#7B9CB5" />
                <circle cx="110" cy="110" r="8" fill="#333" />
                <circle cx="140" cy="110" r="8" fill="#333" />
                <ellipse cx="125" cy="135" rx="15" ry="8" fill="#555" />
                <line x1="125" y1="80" x2="125" y2="50" stroke="#7B9CB5" strokeWidth="15" />
                <line x1="115" y1="60" x2="95" y2="50" stroke="#7B9CB5" strokeWidth="12" />
                <line x1="135" y1="60" x2="155" y2="50" stroke="#7B9CB5" strokeWidth="12" />
              </svg>
            </div>
            
            {/* Display equipped outfits */}
            <div className="equipped-items">
              {Object.entries(equippedOutfits).map(([type, outfitId]) => {
                const outfit = getOutfitById(outfitId);
                return outfit ? (
                  <div key={type} className="equipped-badge">
                    {outfit.name}
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>

        {/* Right: Locker */}
        <div className="locker-section">
          <h2>Locker</h2>
          <div className="locker-grid">
            {outfits.slice(0, 12).map(outfit => {
              const isOwned = ownedOutfits.includes(outfit.id);
              const equipped = isEquipped(outfit.id, outfit.type);
              
              return (
                <div 
                  key={outfit.id} 
                  className={`locker-slot ${isOwned ? 'owned' : 'locked'} ${equipped ? 'equipped' : ''}`}
                  onClick={() => isOwned && handleEquip(outfit.id)}
                >
                  {isOwned ? (
                    <>
                      <div className="outfit-name">{outfit.name}</div>
                      {equipped && <div className="equipped-indicator">✓</div>}
                    </>
                  ) : (
                    <div className="locked-indicator">🔒</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetrCollection;
