# 🌱 WenGro Greenhouse

A crypto-native community platform for capturing user information and building the WenGro community.

## ✨ Features

- **Futuristic UI** - Modern, crypto-themed design with yellow and dark blue color scheme
- **User Registration** - Capture X handles, Telegram handles, and referral information
- **Real-time Database** - MongoDB Atlas integration for persistent data storage
- **Member Directory** - View all community members after registration
- **Responsive Design** - Works on desktop and mobile devices
- **Particle Effects** - Engaging animations and visual feedback

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd wenGroForum
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your MongoDB Atlas connection string
   ```

4. **Start the development server**
   ```bash
   node app.js
   ```

5. **Visit the application**
   - Open http://localhost:3001 in your browser

## 🛠️ Tech Stack

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas with Mongoose ODM
- **Deployment:** Vercel (serverless)
- **Styling:** Custom CSS with animations and gradients

## 📁 Project Structure

```
wenGroForum/
├── app.js              # Express server & API routes
├── index.html          # Main HTML page
├── styles.css          # Custom styling
├── script.js           # Frontend JavaScript
├── wengroLogo.jpg      # Project logo
├── package.json        # Dependencies & scripts
├── vercel.json         # Vercel deployment config
├── env.example         # Environment variables template
├── .gitignore          # Git ignore rules
├── README.md           # This file
└── DEPLOYMENT.md       # Deployment guide
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
PORT=3001
NODE_ENV=development
```

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Add your connection string to environment variables
5. Configure IP whitelist to allow connections from anywhere (`0.0.0.0/0`)

## 🌐 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Vercel.

## 📊 API Endpoints

- `GET /api/users` - Retrieve all registered users
- `POST /api/users` - Register a new user
- `GET /api` - API information

## 🎨 Design Features

- **Color Scheme:** Yellow (#ffd700) and Dark Blue (#1a1a2e)
- **Typography:** Orbitron (headings) and Rajdhani (body text)
- **Animations:** Particle effects, glowing borders, smooth transitions
- **Responsive:** Mobile-first design approach

## 🔒 Security

- Environment variables for sensitive data
- Input validation and sanitization
- CORS configuration
- MongoDB connection security

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the deployment logs
2. Verify your MongoDB Atlas connection
3. Ensure environment variables are set correctly
4. Test locally before deploying

---

**Built with ❤️ for the WenGro community** 