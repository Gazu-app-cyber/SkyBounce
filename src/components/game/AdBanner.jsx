export default function AdBanner({ show }) {
  if (!show) {
    return null
  }

  return (
    <div className="ad-banner">
      <div className="ad-badge">AD</div>
      <span>Espaco para anuncio</span>
      <strong>Remova na loja</strong>
    </div>
  )
}
