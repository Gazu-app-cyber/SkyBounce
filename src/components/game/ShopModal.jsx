import { IAP_PRODUCTS, MAP_THEMES, SHOP_ITEMS, SKINS } from '../../lib/gameConfig'

const TABS = [
  { key: 'skins', label: 'Bolas' },
  { key: 'maps', label: 'Mapas' },
  { key: 'items', label: 'Itens' },
]

export default function ShopModal({
  open,
  onClose,
  profile,
  activeTab,
  onTabChange,
  onPurchaseSkin,
  onPurchaseMapTheme,
  onPurchaseItem,
  onSelectSkin,
  onSelectMap,
  onOpenIAP,
}) {
  if (!open || !profile) {
    return null
  }

  return (
    <div className="modal-overlay">
      <div className="panel modal-panel">
        <div className="panel-header">
          <div>
            <h2>Loja</h2>
            <p className="subtle-text">🪙 {profile.coins} moedas</p>
          </div>
          <button className="close-button" onClick={onClose}>Fechar</button>
        </div>

        <div className="tabs-row">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => onTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'skins' ? (
          <div className="shop-grid">
            {Object.values(SKINS).map((skin) => {
              const owned = profile.ownedSkins.includes(skin.id)
              const active = profile.selectedSkin === skin.id
              return (
                <button key={skin.id} className={`shop-card ${active ? 'active' : ''}`} onClick={() => owned ? onSelectSkin(skin.id) : onPurchaseSkin(skin.id)}>
                  <div className="emoji-big">{skin.emoji}</div>
                  <div className="skin-circle" style={{ background: skin.gradient ? 'linear-gradient(135deg,#ef4444,#f59e0b,#10b981,#3b82f6,#8b5cf6)' : skin.color }} />
                  <strong>{skin.name}</strong>
                  <span>{owned ? (active ? 'Selecionada' : 'Selecionar') : `🪙 ${skin.price}`}</span>
                </button>
              )
            })}
          </div>
        ) : null}

        {activeTab === 'maps' ? (
          <div className="shop-grid">
            {Object.values(MAP_THEMES).map((theme) => {
              const owned = profile.ownedMaps.includes(theme.id) || theme.price === 0
              const active = profile.selectedMap === theme.id
              return (
                <button key={theme.id} className={`shop-card ${active ? 'active' : ''}`} onClick={() => owned ? onSelectMap(theme.id) : onPurchaseMapTheme(theme.id)}>
                  <div className="map-preview" style={{ background: `linear-gradient(180deg, ${theme.bgTop}, ${theme.bgMid}, ${theme.bgBottom})` }}>
                    <span>{theme.emoji}</span>
                  </div>
                  <strong>{theme.name}</strong>
                  <span>{owned ? (active ? 'Selecionado' : 'Selecionar') : `🪙 ${theme.price}`}</span>
                </button>
              )
            })}
          </div>
        ) : null}

        {activeTab === 'items' ? (
          <div className="item-list">
            {!profile.adFree ? (
              <button className="item-card premium" onClick={onOpenIAP}>
                <div>
                  <strong>{IAP_PRODUCTS.remove_ads.name}</strong>
                  <span>Compra unica permanente</span>
                </div>
                <strong>{IAP_PRODUCTS.remove_ads.priceLabel}</strong>
              </button>
            ) : null}
            {Object.values(SHOP_ITEMS).map((item) => (
              <button key={item.id} className="item-card" onClick={() => onPurchaseItem(item.id, item.isAdReward)}>
                <div>
                  <strong>{item.emoji} {item.name}</strong>
                  <span>{item.description}</span>
                </div>
                <strong>{item.isAdReward ? '📺 Gratis' : `🪙 ${item.price}`}</strong>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
