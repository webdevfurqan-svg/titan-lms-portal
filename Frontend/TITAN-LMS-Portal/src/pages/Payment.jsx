import { useState, useEffect } from "react";
import api from "../api";

function Payment({ user }) {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [uploadingFee, setUploadingFee] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFees();
  }, []);

  async function fetchFees() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/fees/my");
      setFees(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Error loading fee records.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadProof(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!file) {
      setError("Please select a payment screenshot or receipt.");
      return;
    }

    const formData = new FormData();
    formData.append("proof", file);

    setUploading(true);
    try {
      await api.post(`/fees/${uploadingFee._id}/proof`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Payment proof submitted. Awaiting admin verification.");
      setUploadingFee(null);
      setFile(null);
      fetchFees();
    } catch (err) {
      setError(err.response?.data?.message || "Error uploading proof.");
    } finally {
      setUploading(false);
    }
  }

  function statusBadge(status) {
    const map = {
      UNPAID: "bg-secondary",
      PENDING: "bg-warning text-dark",
      PAID: "bg-success",
      REJECTED: "bg-danger",
    };
    return <span className={"badge " + (map[status] || "bg-secondary")}>{status}</span>;
  }

  if (loading) {
    return <div className="container mt-4">Loading fee records...</div>;
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Fee Payment — {user?.name || "Student"}</h2>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {fees.length === 0 ? (
        <div className="alert alert-info">No fee vouchers have been issued to you yet.</div>
      ) : (
        <table className="table table-bordered bg-white">
          <thead>
            <tr>
              <th>Month</th>
              <th>Course</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Due Date</th>
              <th>Voucher ID</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((f) => (
              <tr key={f._id}>
                <td>{f.month}</td>
                <td>{f.course?.title || "N/A"}</td>
                <td>Rs. {f.amount}/-</td>
                <td>{f.type}</td>
                <td>{new Date(f.dueDate).toLocaleDateString()}</td>
                <td>{f.voucherId}</td>
                <td>
                  {statusBadge(f.status)}
                  {f.status === "REJECTED" && f.rejectionReason && (
                    <div className="small text-danger mt-1">{f.rejectionReason}</div>
                  )}
                </td>
                <td>
                  {(f.status === "UNPAID" || f.status === "REJECTED") && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        setUploadingFee(f);
                        setError("");
                        setMessage("");
                      }}
                    >
                      Upload Proof
                    </button>
                  )}
                  {f.status === "PENDING" && (
                    <span className="text-muted small">Awaiting verification</span>
                  )}
                  {f.status === "PAID" && (
                    <span className="text-success small">✓ Paid</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {uploadingFee && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Submit Payment Proof — {uploadingFee.month}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setUploadingFee(null)}
                ></button>
              </div>
              <form onSubmit={handleUploadProof}>
                <div className="modal-body">
                  <p className="text-muted small">
                    Voucher ID: <strong>{uploadingFee.voucherId}</strong> — Amount: Rs.{" "}
                    {uploadingFee.amount}/-
                  </p>
                  <label className="form-label">Upload Screenshot / Receipt</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*,.pdf"
                    onChange={(e) => setFile(e.target.files[0])}
                    required
                  />
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setUploadingFee(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success" disabled={uploading}>
                    {uploading ? "Uploading..." : "Submit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payment;