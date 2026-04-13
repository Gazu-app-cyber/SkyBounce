export default function IAPModal({ open, onClose, onPurchaseComplete, processing }) {
  if (!open) return null

  return (
    <div className="modal-overlay">
      <div className="panel modal-panel">
        <div className="panel-header">
          <div>
            <h2>Remover Anuncios</h2>
            <p className="subtle-text">Compra unica permanente</p>
          </div>
          <button className="close-button" onClick={onClose}>Fechar</button>
        </div>
        <div className="item-list">
          <div className="panel section-panel">
            <strong>R$ 4,99</strong>
            <span>Sem banners, sem intersticiais e com restauracao futura.</span>
          </div>
          <button className="button button-primary" onClick={onPurchaseComplete} disabled={processing}>
            {processing ? 'Abrindo Checkout...' : 'Comprar Agora'}
          </button>
          <span className="subtle-text">Pagamento real processado via Stripe Checkout.</span>
        </div>
      </div>
    </div>
  )
}
