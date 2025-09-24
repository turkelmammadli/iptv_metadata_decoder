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
    const response = await axios.get(apiUrl, { timeout: 10000 });
    
    if (response.data && response.data.user_info) {
      return res.json({
        success: true,
        data: response.data.user_info
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
