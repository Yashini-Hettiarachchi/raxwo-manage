import React from 'react';
import './ChangeHistory.css';

const ChangeHistory = ({ changes, darkMode }) => {
  if (!changes || !Array.isArray(changes) || changes.length === 0) {
    return (
      <div className={`change-history-container ${darkMode ? 'dark' : ''}`}>
        <p className="no-changes">No changes recorded</p>
      </div>
    );
  }

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value);
    return value.toString();
  };

  return (
    <div className={`change-history-container ${darkMode ? 'dark' : ''}`}>
      <h3 className="change-history-title">Change History</h3>
      <div className="change-history-list">
        {changes.map((change, index) => (
          <div key={index} className="change-history-item">
            <div className="change-header">
              <div className="change-meta">
                <span className="change-user">Changed by: {change.changedBy}</span>
                <span className="change-date">{new Date(change.changedAt).toLocaleString()}</span>
              </div>
              <span className={`change-type ${change.changeType}`}>
                {change.changeType.toUpperCase()}
              </span>
            </div>
            <div className="change-details">
              <div className="change-field">
                <strong>Field:</strong> {change.field}
              </div>
              <div className="change-values">
                <div className="old-value">
                  <strong>Old Value:</strong>
                  <div className="value-content">{formatValue(change.oldValue)}</div>
                </div>
                <div className="new-value">
                  <strong>New Value:</strong>
                  <div className="value-content">{formatValue(change.newValue)}</div>
                </div>
              </div>
              {change.repairInvoice && (
                <div className="repair-info">
                  <strong>Repair:</strong> {change.repairInvoice} - {change.customerName}
                  {change.deviceType && ` (${change.deviceType})`}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChangeHistory; 