
# SHRL - URL Shortener, File Sharing, Text Sharing, Anonymous Chatting Groups

SHRL is a multi-functional web application that offers a variety of features including a URL shortener, file sharing, text sharing, and anonymous chatting groups. Built to simplify everyday tasks, SHRL allows users to interact and share content efficiently and anonymously.

## Use Cases
1. **URL Shortener**: Shorten long URLs for easier sharing and management.
2. **File Sharing**: Upload and share files securely via the web.
3. **Text Sharing**: Share any text content, including code, notes, or messages.
4. **Anonymous Chatting Groups**: Engage in anonymous group chats without user registration.

## Prerequisites
- **Firebase Storage Setup**: You will need to configure Firebase for file storage in the application. Ensure you have your Firebase credentials ready.

## Installation

1. **Clone the Repository**  
   Clone the repository to your local machine:

   ```bash
   git clone https://github.com/shrl-dev/shrl-frontend.git
   ```

2. **Install Dependencies**  
   Navigate to the project directory and install the required dependencies:

   ```bash
   npm install
   ```

3. **Create `.env` File**  
   Set up your environment variables by creating a `.env` file in the root directory. Use the following template:

   ```env
   REACT_APP_API_ROOM_URL=https://shrl-backend-production.up.railway.app/
   REACT_APP_API_URL=https://shrl.tech/
   REACT_APP_API_KEY=your_api_key_here
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
   REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id_here
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
   REACT_APP_FIREBASE_APP_ID=your_firebase_app_id_here
   REACT_APP_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id_here
   ```

   Replace the placeholder values with your actual Firebase and API credentials.

4. **Start the Application**  
   Run the following command to start the development server:

   ```bash
   npm start
   ```

   The application will be available at `http://localhost:3000`.

