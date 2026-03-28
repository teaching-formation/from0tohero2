export function SkeletonPraticienCard() {
  return (
    <div className="skeleton-card" style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
        <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
          <div className="skeleton" style={{ height: 14, width: '60%' }} />
          <div className="skeleton" style={{ height: 11, width: '40%' }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 11, width: '30%' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
        <div className="skeleton" style={{ height: 11, width: '95%' }} />
        <div className="skeleton" style={{ height: 11, width: '80%' }} />
      </div>
      <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
        {[55, 45, 60, 50].map((w, i) => (
          <div key={i} className="skeleton" style={{ height: 20, width: w }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonArticleCard() {
  return (
    <div className="skeleton-card" style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
      <div className="skeleton" style={{ height: 20, width: 60, borderRadius: 4 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
        <div className="skeleton" style={{ height: 15, width: '90%' }} />
        <div className="skeleton" style={{ height: 15, width: '70%' }} />
      </div>
      <div className="skeleton" style={{ height: 11, width: '50%' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
        <div className="skeleton" style={{ height: 11, width: '100%' }} />
        <div className="skeleton" style={{ height: 11, width: '85%' }} />
        <div className="skeleton" style={{ height: 11, width: '60%' }} />
      </div>
    </div>
  );
}
