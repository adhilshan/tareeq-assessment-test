import { useNavigate } from 'react-router-dom';

export default function RequestsTabs({ active }) {
  const navigate = useNavigate();

  return (
    <div className="requests-tabs">
      <button
        type="button"
        className={`requests-tab ${active === 'new' ? 'requests-tab-active' : ''}`}
        onClick={() => navigate('/requests/new')}
      >
        New Tow Request
      </button>
      <button
        type="button"
        className={`requests-tab ${active === 'past' ? 'requests-tab-active' : ''}`}
        onClick={() => navigate('/requests')}
      >
        Past Tows
      </button>
    </div>
  );
}

