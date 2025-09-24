document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('decoder-form');
  const decodeBtn = document.getElementById('decode-btn');
  const btnText = decodeBtn.querySelector('.btn-text');
  const spinner = decodeBtn.querySelector('.spinner');
  const results = document.getElementById('results');
  const resultContainer = document.getElementById('result-container');
  const contentContainer = document.getElementById('content-container');
  const liveChannelsContainer = document.querySelector('#live-channels .content-items');
  const moviesContainer = document.querySelector('#movies .content-items');
  const seriesContainer = document.querySelector('#series .content-items');
  const errorMessage = document.getElementById('error-message');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
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
        displayResults(data.data, data.isAuthenticated);
        
        // Display IPTV content if available
        if (data.contentData) {
          displayIPTVContent(data.contentData, data.isAuthenticated);
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
  
  function displayIPTVContent(contentData, isAuthenticated) {
    // Clear previous content
    liveChannelsContainer.innerHTML = '';
    moviesContainer.innerHTML = '';
    seriesContainer.innerHTML = '';
    
    // Handle authentication failure
    if (isAuthenticated === false) {
      const authMessage = '<div class="content-error"><i class="fas fa-exclamation-triangle"></i> Authentication failed. Cannot load content.</div>';
      liveChannelsContainer.innerHTML = authMessage;
      moviesContainer.innerHTML = authMessage;
      seriesContainer.innerHTML = authMessage;
      return;
    }
    
    // Show loading indicators
    liveChannelsContainer.innerHTML = '<div class="content-loading"><i class="fas fa-spinner fa-spin"></i> Loading channels...</div>';
    moviesContainer.innerHTML = '<div class="content-loading"><i class="fas fa-spinner fa-spin"></i> Loading movies...</div>';
    seriesContainer.innerHTML = '<div class="content-loading"><i class="fas fa-spinner fa-spin"></i> Loading series...</div>';
    
    // Process and display live channels
    if (contentData.liveStreams && contentData.liveStreams.length > 0) {
      liveChannelsContainer.innerHTML = '';
      contentData.liveStreams.forEach(channel => {
        const channelItem = createContentItem({
          title: channel.name,
          icon: channel.stream_icon || null,
          type: 'channel',
          meta: channel.category_name || ''
        });
        liveChannelsContainer.appendChild(channelItem);
      });
    } else {
      liveChannelsContainer.innerHTML = '<div class="content-error">No live channels available</div>';
    }
    
    // Process and display movies
    if (contentData.vodStreams && contentData.vodStreams.length > 0) {
      moviesContainer.innerHTML = '';
      contentData.vodStreams.forEach(movie => {
        const movieItem = createContentItem({
          title: movie.name,
          icon: movie.stream_icon || null,
          type: 'movie',
          meta: movie.added || ''
        });
        moviesContainer.appendChild(movieItem);
      });
    } else {
      moviesContainer.innerHTML = '<div class="content-error">No movies available</div>';
    }
    
    // Process and display series
    if (contentData.series && contentData.series.length > 0) {
      seriesContainer.innerHTML = '';
      contentData.series.forEach(series => {
        const seriesItem = createContentItem({
          title: series.name,
          icon: series.cover || null,
          type: 'series',
          meta: series.genre || ''
        });
        seriesContainer.appendChild(seriesItem);
      });
    } else {
      seriesContainer.innerHTML = '<div class="content-error">No series available</div>';
    }
  }
  
  function createContentItem({ title, icon, type, meta }) {
    const item = document.createElement('div');
    item.className = 'content-item';
    
    const imageContainer = document.createElement('div');
    imageContainer.className = 'item-image';
    
    if (icon) {
      const img = document.createElement('img');
      img.src = icon;
      img.alt = title;
      img.onerror = function() {
        this.onerror = null;
        this.remove();
        // Add icon based on content type
        const iconEl = document.createElement('i');
        if (type === 'channel') iconEl.className = 'fas fa-tv';
        else if (type === 'movie') iconEl.className = 'fas fa-film';
        else if (type === 'series') iconEl.className = 'fas fa-video';
        imageContainer.appendChild(iconEl);
      };
      imageContainer.appendChild(img);
    } else {
      // Add icon based on content type
      const iconEl = document.createElement('i');
      if (type === 'channel') iconEl.className = 'fas fa-tv';
      else if (type === 'movie') iconEl.className = 'fas fa-film';
      else if (type === 'series') iconEl.className = 'fas fa-video';
      imageContainer.appendChild(iconEl);
    }
    
    const infoContainer = document.createElement('div');
    infoContainer.className = 'item-info';
    
    const titleEl = document.createElement('div');
    titleEl.className = 'item-title';
    titleEl.textContent = title;
    
    const metaEl = document.createElement('div');
    metaEl.className = 'item-meta';
    metaEl.textContent = meta;
    
    infoContainer.appendChild(titleEl);
    infoContainer.appendChild(metaEl);
    
    item.appendChild(imageContainer);
    item.appendChild(infoContainer);
    
    return item;
  }
  
  function displayResults(data, isAuthenticated) {
    resultContainer.innerHTML = '';
    
    // Add authentication status message if authentication failed
    if (isAuthenticated === false) {
      const authWarning = document.createElement('div');
      authWarning.className = 'error';
      authWarning.innerHTML = '<strong>Authentication Failed</strong><br>The provided credentials were not accepted by the server. Some features may be limited.';
      resultContainer.appendChild(authWarning);
    }
    
    // Add message for auth=0 specific case
    if (data.auth === 0) {
      const authInfo = document.createElement('div');
      authInfo.className = 'info';
      authInfo.innerHTML = '<strong>Server Response</strong><br>The server returned limited information. This may be due to incorrect credentials or server configuration.';
      resultContainer.appendChild(authInfo);
    }
    
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
    liveChannelsContainer.innerHTML = '';
    moviesContainer.innerHTML = '';
    seriesContainer.innerHTML = '';
    
    // Switch to formatted tab when showing an error
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabButtons[0].classList.add('active');
    
    tabPanes.forEach(pane => pane.classList.remove('active'));
    tabPanes[0].classList.add('active');
  }
});
