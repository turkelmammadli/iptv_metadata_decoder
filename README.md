# IPTV Metadata Decoder

A simple web application that decodes IPTV Xtream codes and displays account information such as expiration date, maximum allowed connections, active connections, and more.

## Features

- Decode Xtream codes (URL, username, password)
- Display account information:
  - Expiration date
  - Maximum allowed connections
  - Active connections
  - Account status
  - Creation date
  - Trial status
  - And more...
- Clean and responsive user interface
- Error handling and validation

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/iptv_metadata_decoder.git
   cd iptv_metadata_decoder
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the application:
   ```
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Usage

1. Enter your Xtream codes information:
   - Server URL (e.g., example.com:8080)
   - Username
   - Password

2. Click the "Decode" button

3. View the decoded account information

## How It Works

The application makes a request to the Xtream codes API using the provided credentials and retrieves account information. The data is then displayed in a user-friendly format.

## Security Considerations

- This application runs locally on your machine
- No data is stored or sent to any third-party servers
- Your credentials are only used to make direct API requests to the server you specify

## License

This project is licensed under the ISC License.

## Disclaimer

This tool is for educational purposes only. Users are responsible for ensuring they have the right to access the IPTV services they connect to.
