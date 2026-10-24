import { useState, useEffect } from 'react';
import api from '../api';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get('/messages');
        if (res.data.success) {
          setMessages(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching messages', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, []);

  if (loading) return <div>Loading messages...</div>;

  return (
    <div>
      <h1>Messages & Communication</h1>
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((msg) => (
          <div key={msg._id} style={{ background: 'var(--card-bg)', padding: '12px 16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <p><strong>{msg.sender?.name || 'User'}:</strong> {msg.content}</p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(msg.createdAt).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Messages;