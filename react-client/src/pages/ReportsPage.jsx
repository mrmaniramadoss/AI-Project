import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function ReportsPage() {
  const { token } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const perPage = 10;

  const fetchPredictions = useCallback(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    if (priceMin) params.set("price_min", priceMin);
    if (priceMax) params.set("price_max", priceMax);

    fetch(`${API}/predictions?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load predictions");
        return r.json();
      })
      .then((data) => {
        setPredictions(data.items);
        setTotal(data.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, page, dateFrom, dateTo, priceMin, priceMax]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPredictions();
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    if (priceMin) params.set("price_min", priceMin);
    if (priceMax) params.set("price_max", priceMax);

    fetch(`${API}/predictions/export?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "predictions.csv";
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  const totalPages = Math.ceil(total / perPage);

  const featureLabels = {
    crim: "Crime Rate",
    zn: "Land Zone %",
    indus: "Non-Retail %",
    chas: "Charles River",
    nox: "NOx",
    rm: "Rooms",
    age: "Older Homes %",
    dis: "Distance",
    rad: "Highway Idx",
    tax: "Tax Rate",
    ptratio: "PT Ratio",
    b: "B Score",
    lstat: "Lower Status %",
  };

  return (
    <div className="pageContent">
      <div className="pageHeader">
        <h2 className="pageTitle">Prediction Reports</h2>
        <button className="exportButton" onClick={handleExport}>Export CSV</button>
      </div>

      <form className="filterBar" onSubmit={handleFilter}>
        <label className="filterGroup">
          <span className="filterLabel">From</span>
          <input type="date" className="filterInput" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label className="filterGroup">
          <span className="filterLabel">To</span>
          <input type="date" className="filterInput" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        <label className="filterGroup">
          <span className="filterLabel">Min Price</span>
          <input type="number" step="any" className="filterInput" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
        </label>
        <label className="filterGroup">
          <span className="filterLabel">Max Price</span>
          <input type="number" step="any" className="filterInput" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
        </label>
        <button type="submit" className="filterButton">Apply</button>
      </form>

      {error && <p className="errorText">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : predictions.length === 0 ? (
        <p className="emptyText">No predictions found. Make some predictions first!</p>
      ) : (
        <>
          <div className="reportsTableWrapper">
            <table className="dataTable">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Price</th>
                  <th>Date</th>
                  {Object.keys(featureLabels).map((k) => (
                    <th key={k} title={featureLabels[k]}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {predictions.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td className="priceCell">${p.predicted_price.toFixed(2)}</td>
                    <td>{new Date(p.created_at + "Z").toLocaleDateString()}</td>
                    {Object.keys(featureLabels).map((k) => (
                      <td key={k}>{p.features[k]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span>Page {page} of {totalPages} ({total} total)</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}
