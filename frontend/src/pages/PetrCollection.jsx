import { useGame } from '../context/GameContext';
import { outfits, getOutfitById } from '../data/outfits';
import petrLogo from '../assets/petr.png';
import './pages.css';
import './PetrCollection.css';

const PetrCollection = () => {
  const { 
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
          <button 
            className="reroll-button" 
            onClick={rerollShop}
            disabled={coins < 2}
          >
            Reroll (2 coins)
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
              <img src={petrLogo} alt="Petr the Anteater" className="petr-character" />
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
