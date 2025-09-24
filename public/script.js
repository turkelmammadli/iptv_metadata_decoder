document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('decoder-form');
  const decodeBtn = document.getElementById('decode-btn');
  const btnText = decodeBtn.querySelector('.btn-text');
  const spinner = decodeBtn.querySelector('.spinner');
  const results = document.getElementById('results');
  const resultContainer = document.getElementById('result-container');
  const errorMessage = document.getElementById('error-message');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  // Content containers
  const liveChannelsList = document.getElementById('live-channels-list');
  const vodList = document.getElementById('vod-list');
  const seriesList = document.getElementById('series-list');
  
  // Tab switching functionality
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update active tab pane
      tabPanes.forEach(pane => pane.classList.remove('active'));
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });

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
        // Display formatted account results
        displayResults(data.data);
        
        // Display content data if available
        if (data.contentData) {
          displayContentData(data.contentData);
        }
        
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
  
  function displayContentData(contentData) {
    // Display Live TV Channels
    displayLiveChannels(contentData.liveCategories, contentData.sampleLiveStreams);
    
    // Display VOD (Movies)
    displayVodCategories(contentData.vodCategories);
    
    // Display Series
    displaySeriesCategories(contentData.seriesCategories);
  }
  
  function displayLiveChannels(categories, streams) {
    liveChannelsList.innerHTML = '';
    
    if (!categories || categories.length === 0) {
      liveChannelsList.innerHTML = '<div class="content-empty">No live TV channels available</div>';
      return;
    }
    
    if (!streams || streams.length === 0) {
      // Show categories only
      categories.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'channel-item';
        categoryItem.innerHTML = `
          <div class="channel-name">${category.category_name}</div>
          <div class="channel-category">Category ID: ${category.category_id}</div>
        `;
        liveChannelsList.appendChild(categoryItem);
      });
      return;
    }
    
    // Show sample streams
    streams.forEach(stream => {
      const streamItem = document.createElement('div');
      streamItem.className = 'channel-item';
      
      // Find category name
      let categoryName = 'Unknown';
      if (categories) {
        const category = categories.find(c => c.category_id === stream.category_id);
        if (category) categoryName = category.category_name;
      }
      
      streamItem.innerHTML = `
        <div class="channel-name">${stream.name}</div>
        <div class="channel-category">${categoryName}</div>
      `;
      liveChannelsList.appendChild(streamItem);
    });
  }
  
  function displayVodCategories(categories) {
    vodList.innerHTML = '';
    
    if (!categories || categories.length === 0) {
      vodList.innerHTML = '<div class="content-empty">No VOD content available</div>';
      return;
    }
    
    categories.forEach(category => {
      const categoryItem = document.createElement('div');
      categoryItem.className = 'vod-item';
      categoryItem.innerHTML = `
        <div class="vod-name">${category.category_name}</div>
        <div class="vod-category">Category ID: ${category.category_id}</div>
      `;
      vodList.appendChild(categoryItem);
    });
  }
  
  function displaySeriesCategories(categories) {
    seriesList.innerHTML = '';
    
    if (!categories || categories.length === 0) {
      seriesList.innerHTML = '<div class="content-empty">No series content available</div>';
      return;
    }
    
    categories.forEach(category => {
      const categoryItem = document.createElement('div');
      categoryItem.className = 'series-item';
      categoryItem.innerHTML = `
        <div class="series-name">${category.category_name}</div>
        <div class="series-category">Category ID: ${category.category_id}</div>
      `;
      seriesList.appendChild(categoryItem);
    });
  }
  
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
    
    // Clear content containers
    liveChannelsList.innerHTML = '';
    vodList.innerHTML = '';
    seriesList.innerHTML = '';
    
    // Switch to formatted tab when showing an error
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabButtons[0].classList.add('active');
    
    tabPanes.forEach(pane => pane.classList.remove('active'));
    tabPanes[0].classList.add('active');
  }
});
