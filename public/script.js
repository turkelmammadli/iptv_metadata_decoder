document.addEventListener('DOMContentLoaded', () => {
  // Main UI elements
  const form = document.getElementById('decoder-form');
  const decodeBtn = document.getElementById('decode-btn');
  const btnText = decodeBtn.querySelector('.btn-text');
  const spinner = decodeBtn.querySelector('.spinner');
  const results = document.getElementById('results');
  const resultContainer = document.getElementById('result-container');
  const errorMessage = document.getElementById('error-message');
  
  // M3U elements
  const m3uInput = document.getElementById('m3u_url');
  const parseM3uBtn = document.getElementById('parse-m3u-btn');
  
  // Tab navigation
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  // Category and stream containers
  const liveCategoriesList = document.querySelector('#live-categories .category-list');
  const liveStreamsContainer = document.querySelector('#live-streams .content-items');
  const liveStreamsMessage = document.querySelector('#live-streams .streams-message');
  
  const vodCategoriesList = document.querySelector('#vod-categories .category-list');
  const vodStreamsContainer = document.querySelector('#vod-streams .content-items');
  const vodStreamsMessage = document.querySelector('#vod-streams .streams-message');
  
  const seriesCategoriesList = document.querySelector('#series-categories .category-list');
  const seriesStreamsContainer = document.querySelector('#series-streams .content-items');
  const seriesStreamsMessage = document.querySelector('#series-streams .streams-message');
  
  // Video player elements
  const playerModal = document.getElementById('player-modal');
  const videoPlayer = document.getElementById('video-player');
  const playerTitle = document.getElementById('player-title');
  const closePlayerBtn = document.getElementById('close-player');
  const playerError = document.getElementById('player-error');
  
  // Store credentials for reuse
  let currentCredentials = null;
  
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
  
  // We no longer need content navigation as it's now part of the main tabs

  // Add back button to the results container
  const backButton = document.createElement('button');
  backButton.id = 'back-button';
  backButton.innerHTML = '<i class="fas fa-arrow-left"></i> New Search';
  backButton.addEventListener('click', () => {
    // Show form and hide results
    document.querySelector('.form-container').classList.remove('hidden');
    results.classList.add('hidden');
    backButton.classList.add('hidden');
  });
  results.insertBefore(backButton, results.firstChild);
  backButton.classList.add('hidden');
  
  // Player control functions
  function openPlayer(streamUrl, title) {
    playerTitle.textContent = title || 'Stream Player';
    videoPlayer.src = streamUrl;
    playerModal.classList.remove('hidden');
    setTimeout(() => {
      playerModal.classList.add('active');
    }, 10);
    
    // Hide error message if it was shown previously
    playerError.classList.add('hidden');
    
    // Handle video error
    videoPlayer.onerror = () => {
      playerError.classList.remove('hidden');
      console.error('Error playing stream:', streamUrl);
    };
  }
  
  function closePlayer() {
    playerModal.classList.remove('active');
    setTimeout(() => {
      playerModal.classList.add('hidden');
      videoPlayer.pause();
      videoPlayer.src = '';
    }, 300);
  }
  
  // Close player when clicking the close button
  closePlayerBtn.addEventListener('click', closePlayer);
  
  // Close player when clicking outside the player content
  playerModal.addEventListener('click', (e) => {
    if (e.target === playerModal) {
      closePlayer();
    }
  });
  
  // Close player when pressing Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !playerModal.classList.contains('hidden')) {
      closePlayer();
    }
  });
  
  // Parse M3U URL and fill fields
  if (parseM3uBtn) {
    parseM3uBtn.addEventListener('click', () => {
      const raw = (m3uInput?.value || '').trim();
      if (!raw) {
        showInlineError('Please paste an M3U URL to parse.');
        return;
      }
      const parsed = parseM3UUrlSafe(raw);
      if (!parsed) {
        showInlineError('Could not parse M3U URL. Ensure it looks like http(s)://server/get.php?username=...&password=...');
        return;
      }
      const urlEl = document.getElementById('url');
      const userEl = document.getElementById('username');
      const passEl = document.getElementById('password');
      if (parsed.url) urlEl.value = parsed.url.replace(/\/$/, '');
      if (parsed.username) userEl.value = parsed.username;
      if (parsed.password) passEl.value = parsed.password;
    });
  }
  
  function showInlineError(msg) {
    // Prefer showing near results section to keep UX consistent
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
  }
  
  function parseM3UUrlSafe(raw) {
    try {
      // Ensure URL has protocol for parsing
      let candidate = raw;
      if (!/^https?:\/\//i.test(candidate)) candidate = 'http://' + candidate;
      const u = new URL(candidate);
      const username = u.searchParams.get('username') || u.searchParams.get('user') || '';
      const password = u.searchParams.get('password') || u.searchParams.get('pass') || '';
      const base = u.origin; // protocol + host (+ port)
      if (!username || !password) {
        // Some providers embed creds in path e.g., /get.php?u=...&p=...
        const u2 = u.searchParams.get('u');
        const p2 = u.searchParams.get('p');
        return {
          url: base,
          username: u2 || username,
          password: p2 || password
        };
      }
      return { url: base, username, password };
    } catch (e) {
      // Try to salvage basic query parsing without URL()
      try {
        const qIndex = raw.indexOf('?');
        const basePart = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
        const query = qIndex >= 0 ? raw.slice(qIndex + 1) : '';
        const params = new URLSearchParams(query);
        const username = params.get('username') || params.get('user') || params.get('u') || '';
        const password = params.get('password') || params.get('pass') || params.get('p') || '';
        const base = /^https?:\/\//i.test(basePart) ? basePart : 'http://' + basePart;
        if (!username || !password) return null;
        return { url: base.replace(/\/$/, ''), username, password };
      } catch {
        return null;
      }
    }
  }
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Show loading state
    btnText.textContent = 'Decoding...';
    spinner.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    if (results.classList.contains('hidden')) {
      // First time - keep it hidden
    } else {
      // Clear previous results while loading
      resultContainer.innerHTML = '';
    }
    
    // Get form data
    let url = document.getElementById('url').value.trim();
    let username = document.getElementById('username').value.trim();
    let password = document.getElementById('password').value.trim();
    
    // If M3U URL present and any creds missing, try to parse and fill
    const m3uRaw = (m3uInput?.value || '').trim();
    if (m3uRaw && (!url || !username || !password)) {
      const parsed = parseM3UUrlSafe(m3uRaw);
      if (parsed) {
        url = url || parsed.url?.replace(/\/$/, '');
        username = username || parsed.username;
        password = password || parsed.password;
        // Reflect in UI
        if (url) document.getElementById('url').value = url;
        if (username) document.getElementById('username').value = username;
        if (password) document.getElementById('password').value = password;
      }
    }
    
    if (!url || !username || !password) {
      showError('Please provide server URL, username, and password, or paste a valid M3U URL.');
      // Reset button state
      btnText.textContent = 'Decode';
      spinner.classList.add('hidden');
      return;
    }
    
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
        // Store credentials for reuse
        currentCredentials = {
          url: url,
          username: username,
          password: password
        };
        
        // Display formatted account results
        displayResults(data.data, data.isAuthenticated);
        
        // Display IPTV content if available
        if (data.contentData) {
          displayIPTVContent(data.contentData, data.isAuthenticated);
        }
        
        // Hide form and show results with back button
        document.querySelector('.form-container').classList.add('hidden');
        results.classList.remove('hidden');
        backButton.classList.remove('hidden');
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
    // Store credentials for later use
    if (currentCredentials) {
      // Display categories for each content type
      displayCategories('live', contentData.liveCategories, liveCategoriesList);
      displayCategories('vod', contentData.vodCategories, vodCategoriesList);
      displayCategories('series', contentData.seriesCategories, seriesCategoriesList);
      
      // Show the second tab (Live TV) after loading content
      if (contentData.liveCategories && contentData.liveCategories.length > 0) {
        // Select the Live TV tab after a short delay to ensure content is loaded
        setTimeout(() => {
          const liveTab = document.querySelector('.tab-btn[data-tab="live"]');
          if (liveTab && !liveTab.classList.contains('active')) {
            liveTab.click();
          }
        }, 500);
      }
    } else {
      // Handle authentication failure
      const authMessage = '<div class="content-error"><i class="fas fa-exclamation-triangle"></i> Authentication failed. Cannot load content.</div>';
      liveCategoriesList.innerHTML = authMessage;
      vodCategoriesList.innerHTML = authMessage;
      seriesCategoriesList.innerHTML = authMessage;
      
      liveStreamsMessage.textContent = 'Authentication failed';
      vodStreamsMessage.textContent = 'Authentication failed';
      seriesStreamsMessage.textContent = 'Authentication failed';
    }
  }
  
  function displayCategories(type, categories, containerElement) {
    // Clear previous content
    containerElement.innerHTML = '';
    
    if (!categories || categories.length === 0) {
      containerElement.innerHTML = '<div class="content-error">No categories available</div>';
      return;
    }
    
    // Sort categories by category_name
    const sortedCategories = [...categories].sort((a, b) => {
      return a.category_name.localeCompare(b.category_name);
    });
    
    // Create category items
    sortedCategories.forEach(category => {
      const categoryItem = document.createElement('div');
      categoryItem.className = 'category-item';
      categoryItem.textContent = category.category_name;
      categoryItem.dataset.categoryId = category.category_id;
      categoryItem.dataset.type = type;
      
      // Add click event to load streams
      categoryItem.addEventListener('click', handleCategoryClick);
      
      containerElement.appendChild(categoryItem);
    });
  }
  
  function handleCategoryClick(event) {
    if (!currentCredentials) return;
    
    const categoryItem = event.currentTarget;
    const categoryId = categoryItem.dataset.categoryId;
    const type = categoryItem.dataset.type;
    
    // Update active category
    const categoryContainer = categoryItem.closest('.category-container');
    const allCategoryItems = categoryContainer.querySelectorAll('.category-item');
    allCategoryItems.forEach(item => item.classList.remove('active'));
    categoryItem.classList.add('active');
    
    // Determine which containers to update
    let streamsContainer, streamsMessage;
    switch (type) {
      case 'live':
        streamsContainer = liveStreamsContainer;
        streamsMessage = liveStreamsMessage;
        break;
      case 'vod':
        streamsContainer = vodStreamsContainer;
        streamsMessage = vodStreamsMessage;
        break;
      case 'series':
        streamsContainer = seriesStreamsContainer;
        streamsMessage = seriesStreamsMessage;
        break;
    }
    
    // Show loading message
    streamsMessage.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading content...';
    streamsMessage.style.display = 'block';
    streamsContainer.innerHTML = '';
    
    // Fetch streams for the selected category
    fetchStreamsByCategory(type, categoryId, streamsContainer, streamsMessage);
  }
  
  function fetchStreamsByCategory(type, categoryId, streamsContainer, streamsMessage) {
    const { url, username, password } = currentCredentials;
    
    fetch('/api/streams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url, username, password, type, categoryId })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.data && data.data.length > 0) {
        // Hide message
        streamsMessage.style.display = 'none';
        
        // Display streams
        displayStreams(type, data.data, streamsContainer);
      } else {
        // Show no content message
        streamsMessage.textContent = 'No content available in this category';
        streamsMessage.style.display = 'block';
        streamsContainer.innerHTML = '';
      }
    })
    .catch(error => {
      console.error('Error fetching streams:', error);
      streamsMessage.textContent = 'Error loading content';
      streamsMessage.style.display = 'block';
      streamsContainer.innerHTML = '';
    });
  }
  
  function displayStreams(type, streams, containerElement) {
    // Clear previous content
    containerElement.innerHTML = '';
    
    // Create stream items
    streams.forEach(stream => {
      let title, icon, meta;
      
      switch (type) {
        case 'live':
          title = stream.name;
          icon = stream.stream_icon;
          meta = stream.category_name || '';
          break;
        case 'vod':
          title = stream.name;
          icon = stream.stream_icon;
          meta = stream.added || '';
          break;
        case 'series':
          title = stream.name;
          icon = stream.cover;
          meta = stream.genre || '';
          break;
      }
      
      const streamItem = createContentItem({
        title,
        icon,
        type,
        meta,
        url: stream.stream_url,
        id: stream.stream_id || stream.series_id
      });
      
      containerElement.appendChild(streamItem);
    });
  }
  
  function createContentItem({ title, icon, type, meta, url, id }) {
    const item = document.createElement('div');
    item.className = 'content-item';
    
    // Make the item clickable if it has a URL
    if (url) {
      item.classList.add('clickable');
      item.addEventListener('click', () => {
        if (type === 'series') {
          // For series, we need to fetch episodes
          showSeriesEpisodes(id);
        } else {
          // For live and VOD, open the stream in our player
          openPlayer(url, title);
        }
      });
    }
    
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
        if (type === 'live') iconEl.className = 'fas fa-tv';
        else if (type === 'vod') iconEl.className = 'fas fa-film';
        else if (type === 'series') iconEl.className = 'fas fa-video';
        imageContainer.appendChild(iconEl);
      };
      imageContainer.appendChild(img);
    } else {
      // Add icon based on content type
      const iconEl = document.createElement('i');
      if (type === 'live') iconEl.className = 'fas fa-tv';
      else if (type === 'vod') iconEl.className = 'fas fa-film';
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
  
  function showSeriesEpisodes(seriesId) {
    if (!currentCredentials) return;
    
    const { url, username, password } = currentCredentials;
    
    // Show loading message
    const loadingModal = document.createElement('div');
    loadingModal.className = 'modal active';
    loadingModal.innerHTML = `
      <div class="modal-content" style="max-width: 400px;">
        <div class="modal-header">
          <h3>Loading Episodes</h3>
        </div>
        <div class="modal-body" style="padding: 20px; text-align: center;">
          <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 15px;"></i>
          <p>Loading series information...</p>
        </div>
      </div>
    `;
    document.body.appendChild(loadingModal);
    
    // Fetch series info
    fetch('/api/series-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url, username, password, seriesId })
    })
    .then(response => response.json())
    .then(data => {
      // Remove loading modal
      document.body.removeChild(loadingModal);
      
      if (data.success && data.info && data.episodes) {
        displaySeriesEpisodes(data.info, data.episodes);
      } else {
        alert('Unable to load series information. Please try again.');
      }
    })
    .catch(error => {
      console.error('Error fetching series info:', error);
      document.body.removeChild(loadingModal);
      alert('Error loading series information. Please try again.');
    });
  }
  
  function displaySeriesEpisodes(seriesInfo, episodes) {
    // Create a modal to display episodes
    const episodesModal = document.createElement('div');
    episodesModal.className = 'modal active';
    
    // Group episodes by season
    const seasons = {};
    episodes.forEach(episode => {
      const seasonNum = episode.season || '1';
      if (!seasons[seasonNum]) {
        seasons[seasonNum] = [];
      }
      seasons[seasonNum].push(episode);
    });
    
    // Create modal content
    let seasonsHtml = '';
    Object.keys(seasons).sort((a, b) => parseInt(a) - parseInt(b)).forEach(season => {
      seasonsHtml += `<h4>Season ${season}</h4><div class="episodes-grid">`;
      
      seasons[season].forEach(episode => {
        seasonsHtml += `
          <div class="episode-item" data-stream="${episode.stream_url || ''}" data-title="${seriesInfo.name} - S${season}E${episode.episode_num || '?'}">
            <div class="episode-number">E${episode.episode_num || '?'}</div>
            <div class="episode-title">${episode.title || `Episode ${episode.episode_num || '?'}`}</div>
          </div>
        `;
      });
      
      seasonsHtml += '</div>';
    });
    
    episodesModal.innerHTML = `
      <div class="modal-content series-modal">
        <div class="modal-header">
          <h3>${seriesInfo.name}</h3>
          <button class="close-btn"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body series-modal-body">
          <div class="series-info">
            ${seriesInfo.cover ? `<img src="${seriesInfo.cover}" alt="${seriesInfo.name}" class="series-cover">` : ''}
            <div class="series-details">
              ${seriesInfo.plot ? `<p class="series-plot">${seriesInfo.plot}</p>` : ''}
              ${seriesInfo.cast ? `<p><strong>Cast:</strong> ${seriesInfo.cast}</p>` : ''}
              ${seriesInfo.genre ? `<p><strong>Genre:</strong> ${seriesInfo.genre}</p>` : ''}
              ${seriesInfo.rating ? `<p><strong>Rating:</strong> ${seriesInfo.rating}</p>` : ''}
            </div>
          </div>
          <div class="series-episodes">
            ${seasonsHtml || '<p>No episodes available</p>'}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(episodesModal);
    
    // Add close button functionality
    const closeBtn = episodesModal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(episodesModal);
    });
    
    // Add click event to episodes
    const episodeItems = episodesModal.querySelectorAll('.episode-item');
    episodeItems.forEach(item => {
      const streamUrl = item.dataset.stream;
      const title = item.dataset.title;
      
      if (streamUrl) {
        item.addEventListener('click', () => {
          document.body.removeChild(episodesModal);
          openPlayer(streamUrl, title);
        });
      }
    });
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
    if (liveStreamsContainer) liveStreamsContainer.innerHTML = '';
    if (vodStreamsContainer) vodStreamsContainer.innerHTML = '';
    if (seriesStreamsContainer) seriesStreamsContainer.innerHTML = '';
    
    // Switch to formatted tab when showing an error
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabButtons[0].classList.add('active');
    
    tabPanes.forEach(pane => pane.classList.remove('active'));
    tabPanes[0].classList.add('active');
  }
});
