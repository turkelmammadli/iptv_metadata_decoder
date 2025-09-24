const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Route to handle Xtream codes API requests
app.post('/api/decode', async (req, res) => {
  try {
    const { url, username, password } = req.body;
    
    if (!url || !username || !password) {
      return res.status(400).json({ error: 'URL, username, and password are required' });
    }

    // Parse the URL to ensure it's properly formatted
    let baseUrl = url;
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = 'http://' + baseUrl;
    }
    
    // Remove trailing slash if present
    baseUrl = baseUrl.replace(/\/$/, '');

    // Make request to get account info
    const apiUrl = `${baseUrl}/player_api.php?username=${username}&password=${password}`;
    console.log('Making request to:', apiUrl);
    const response = await axios.get(apiUrl, { timeout: 10000 });
    console.log('Response received:', JSON.stringify(response.data, null, 2));
    
    if (response.data) {
      // Check if authentication was successful
      const isAuthenticated = (response.data.user_info && response.data.user_info.auth === 1) || 
                             (response.data.auth === 1);
      
      // Handle different response formats
      let userData;
      if (response.data.user_info) {
        userData = response.data.user_info;
      } else {
        userData = response.data;
      }
      
      console.log('Authentication status:', isAuthenticated);
      console.log('User data:', userData);
      
      // Get categories and content data
      const contentData = {};
      
      try {
        // Try to get some sample content directly
        console.log('Attempting to get live streams...');
        try {
          const liveStreams = await axios.get(
            `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_live_streams`,
            { timeout: 10000 }
          );
          
          // Check if we got a valid array response
          if (Array.isArray(liveStreams.data)) {
            console.log(`Got ${liveStreams.data.length} live streams`);
            contentData.liveStreams = liveStreams.data.slice(0, 20); // Limit to 20 items
          } else {
            console.log('Live streams response is not an array:', liveStreams.data);
            // If we got an auth error, store it
            if (liveStreams.data && liveStreams.data.user_info && liveStreams.data.user_info.auth === 0) {
              contentData.authError = true;
            }
          }
        } catch (e) {
          console.error('Error getting live streams:', e.message);
        }
        
        // Try to get VOD streams
        console.log('Attempting to get VOD streams...');
        try {
          const vodStreams = await axios.get(
            `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_vod_streams`,
            { timeout: 10000 }
          );
          
          // Check if we got a valid array response
          if (Array.isArray(vodStreams.data)) {
            console.log(`Got ${vodStreams.data.length} VOD streams`);
            contentData.vodStreams = vodStreams.data.slice(0, 20); // Limit to 20 items
          } else {
            console.log('VOD streams response is not an array:', vodStreams.data);
            // If we got an auth error, store it
            if (vodStreams.data && vodStreams.data.user_info && vodStreams.data.user_info.auth === 0) {
              contentData.authError = true;
            }
          }
        } catch (e) {
          console.error('Error getting VOD streams:', e.message);
        }
        
        // Try to get series
        console.log('Attempting to get series...');
        try {
          const series = await axios.get(
            `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_series`,
            { timeout: 10000 }
          );
          
          // Check if we got a valid array response
          if (Array.isArray(series.data)) {
            console.log(`Got ${series.data.length} series`);
            contentData.series = series.data.slice(0, 20); // Limit to 20 items
          } else {
            console.log('Series response is not an array:', series.data);
            // If we got an auth error, store it
            if (series.data && series.data.user_info && series.data.user_info.auth === 0) {
              contentData.authError = true;
            }
          }
        } catch (e) {
          console.error('Error getting series:', e.message);
        }
        
        // Get categories (original code)
        console.log('Attempting to get live categories...');
        try {
          const liveCategories = await axios.get(
            `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_live_categories`,
            { timeout: 10000 }
          );
          contentData.liveCategories = liveCategories.data;
        } catch (e) {
          console.error('Error getting live categories:', e.message);
        }
        
        // Get VOD categories (movies)
        console.log('Attempting to get VOD categories...');
        try {
          const vodCategories = await axios.get(
            `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_vod_categories`,
            { timeout: 10000 }
          );
          contentData.vodCategories = vodCategories.data;
        } catch (e) {
          console.error('Error getting VOD categories:', e.message);
        }
        
        // Get series categories
        console.log('Attempting to get series categories...');
        try {
          const seriesCategories = await axios.get(
            `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_series_categories`,
            { timeout: 10000 }
          );
          contentData.seriesCategories = seriesCategories.data;
        } catch (e) {
          console.error('Error getting series categories:', e.message);
        }
        
        // We've already tried to get content directly above, so we don't need this code anymore
        // Keeping it commented out for reference
        /*
        // Get sample content from each category type
        if (contentData.liveCategories && contentData.liveCategories.length > 0) {
          try {
            const categoryId = contentData.liveCategories[0].category_id;
            const liveStreams = await axios.get(
              `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_live_streams&category_id=${categoryId}`,
              { timeout: 10000 }
            );
            contentData.liveStreams = liveStreams.data.slice(0, 20); // Limit to 20 items
          } catch (e) {
            console.error('Error getting live streams by category:', e.message);
          }
        }
        
        if (contentData.vodCategories && contentData.vodCategories.length > 0) {
          try {
            const categoryId = contentData.vodCategories[0].category_id;
            const vodStreams = await axios.get(
              `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_vod_streams&category_id=${categoryId}`,
              { timeout: 10000 }
            );
            contentData.vodStreams = vodStreams.data.slice(0, 20); // Limit to 20 items
          } catch (e) {
            console.error('Error getting VOD streams by category:', e.message);
          }
        }
        
        if (contentData.seriesCategories && contentData.seriesCategories.length > 0) {
          try {
            const categoryId = contentData.seriesCategories[0].category_id;
            const series = await axios.get(
              `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_series&category_id=${categoryId}`,
              { timeout: 10000 }
            );
            contentData.series = series.data.slice(0, 20); // Limit to 20 items
          } catch (e) {
            console.error('Error getting series by category:', e.message);
          }
        }
        */
      } catch (contentError) {
        console.error('Error fetching content:', contentError.message);
        contentData.error = 'Some content could not be loaded';
      }
      
      return res.json({
        success: true,
        data: userData,
        isAuthenticated: isAuthenticated,
        contentData: contentData
      });
    } else {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid Xtream codes or unable to retrieve data' 
      });
    }
  } catch (error) {
    console.error('Error decoding Xtream codes:', error.message);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to decode Xtream codes. Please check your inputs and try again.' 
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
