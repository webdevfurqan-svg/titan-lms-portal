import { useState, useEffect } from 'react';
import api from '../api';

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await api.get('/certificates');
        if (res.data.success) {
          setCertificates(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching certificates', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, []);

  if (loading) return <div>Loading certificates...</div>;

  return (
    <div>
      <h1>My Certificates</h1>
      <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {certificates.map((cert) => (
          <div key={cert._id} style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '8px', border: '2px solid var(--border-color)', textAlign: 'center' }}>
            <h3>{cert.course?.title || 'Course Certificate'}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '8px 0' }}>Code: {cert.certificateCode}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Issued on: {new Date(cert.issuedAt).toLocaleDateString()}</p>
            {cert.pdfUrl && (
              <a href={cert.pdfUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '12px', padding: '6px 12px', background: '#28a745', color: '#fff', borderRadius: '4px', textDecoration: 'none', fontSize: '0.9rem' }}>
                Download Certificate
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Certificates;