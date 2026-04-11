import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/predictions/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load stats");
        return r.json();
      })
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="pageContent"><p>Loading dashboard...</p></div>;
  if (error) return <div className="pageContent"><p className="errorText">{error}</p></div>;

  const cards = [
    { label: "Total Predictions", value: stats.total_predictions, color: "#2563eb" },
    { label: "Average Price", value: stats.avg_price ? `$${stats.avg_price.toFixed(2)}` : "—", color: "#059669" },
    { label: "Min Price", value: stats.min_price ? `$${stats.min_price.toFixed(2)}` : "—", color: "#d97706" },
    { label: "Max Price", value: stats.max_price ? `$${stats.max_price.toFixed(2)}` : "—", color: "#dc2626" },
  ];

  const chartData = [...(stats.daily || [])].reverse();

  return (
    <div className="pageContent">
      <h2 className="pageTitle">Dashboard</h2>

      <div className="statsGrid">
        {cards.map((c) => (
          <div key={c.label} className="statCard">
            <span className="statLabel">{c.label}</span>
            <span className="statValue" style={{ color: c.color }}>{c.value}</span>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="chartCard">
          <h3 className="chartTitle">Daily Average Price</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
              <Bar dataKey="avg_price" fill="#2563eb" radius={[4, 4, 0, 0]} name="Avg Price" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="recentCard">
        <h3 className="chartTitle">Recent Predictions</h3>
        {stats.recent.length === 0 ? (
          <p className="emptyText">No predictions yet. Go to the Predict page to make your first prediction!</p>
        ) : (
          <table className="dataTable">
            <thead>
              <tr>
                <th>#</th>
                <th>Rooms</th>
                <th>Crime Rate</th>
                <th>Tax Rate</th>
                <th>Predicted Price</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.features.rm}</td>
                  <td>{p.features.crim}</td>
                  <td>{p.features.tax}</td>
                  <td className="priceCell">${p.predicted_price.toFixed(2)}</td>
                  <td>{new Date(p.created_at + "Z").toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
