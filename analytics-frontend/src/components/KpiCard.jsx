function KpiCard({ title, value }) {
  return (
    <div className="card shadow-sm border-0">
      <div className="card-body">
        <h6 className="text-muted">
          {title}
        </h6>

        <h2 className="fw-bold">
          {value}
        </h2>
      </div>
    </div>
  );
}

export default KpiCard;