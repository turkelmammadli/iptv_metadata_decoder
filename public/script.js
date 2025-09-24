document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('decoder-form');
  const decodeBtn = document.getElementById('decode-btn');
  const btnText = decodeBtn.querySelector('.btn-text');
  const spinner = decodeBtn.querySelector('.spinner');
  const results = document.getElementById('results');
  const resultContainer = document.getElementById('result-container');
  const errorMessage = document.getElementById('error-message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Show loading state
    btnText.textContent = 'Decoding...';
    spinner.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    
    // Don't hide results container in side-by-side layout if it was already visible
    if (results.classList.contains('hidden')) {
      // First time - keep it hidden
    } else {
      // Clear previous results while loading
      resultContainer.innerHTML = '';
    }
    
    // Get form data
    const url = document.getElementById('url').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    try {
      const response = await fetch('/api/decode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url, username, password })
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        displayResults(data.data);
        results.classList.remove('hidden');
      } else {
        showError(data.error || 'Failed to decode Xtream codes');
      }
    } catch (error) {
      showError('An error occurred while processing your request');
      console.error('Error:', error);
    } finally {
      // Reset button state
      btnText.textContent = 'Decode';
      spinner.classList.add('hidden');
    }
  });
  
  function displayResults(data) {
    resultContainer.innerHTML = '';
    
    // Format and display the data
    const fields = [
      { key: 'username', label: 'Username' },
      { key: 'password', label: 'Password' },
      { key: 'status', label: 'Account Status' },
      { key: 'exp_date', label: 'Expiration Date', formatter: formatDate },
      { key: 'active_cons', label: 'Active Connections' },
      { key: 'max_connections', label: 'Maximum Connections' },
      { key: 'created_at', label: 'Created At', formatter: formatDate },
      { key: 'is_trial', label: 'Trial Account', formatter: formatBoolean },
      { key: 'allowed_output_formats', label: 'Allowed Output Formats' }
    ];
    
    fields.forEach(field => {
      if (data[field.key] !== undefined) {
        const value = field.formatter ? field.formatter(data[field.key]) : data[field.key];
        addResultItem(field.label, value);
      }
    });
    
    // Add any additional fields that might be present
    Object.keys(data).forEach(key => {
      if (!fields.some(f => f.key === key) && data[key] !== undefined) {
        addResultItem(formatLabel(key), data[key]);
      }
    });
  }
  
  function addResultItem(label, value) {
    const item = document.createElement('div');
    item.className = 'result-item';
    
    const labelEl = document.createElement('div');
    labelEl.className = 'result-label';
    labelEl.textContent = label;
    
    const valueEl = document.createElement('div');
    valueEl.className = 'result-value';
    
    if (label === 'Account Status') {
      if (value === 'Active') {
        valueEl.className += ' status-active';
      } else if (value === 'Expired') {
        valueEl.className += ' status-expired';
      } else {
        valueEl.className += ' status-warning';
      }
    }
    
    valueEl.textContent = value;
    
    item.appendChild(labelEl);
    item.appendChild(valueEl);
    resultContainer.appendChild(item);
  }
  
  function formatDate(timestamp) {
    if (!timestamp || timestamp === 0) return 'Never';
    
    // Check if timestamp is in seconds (Xtream codes typically use Unix timestamps)
    const date = new Date(timestamp * 1000);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return timestamp;
    }
    
    return date.toLocaleString();
  }
  
  function formatBoolean(value) {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'number') {
      return value === 1 ? 'Yes' : 'No';
    }
    return value;
  }
  
  function formatLabel(key) {
    // Convert snake_case to Title Case
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    results.classList.remove('hidden');
    resultContainer.innerHTML = '';
  }
});
