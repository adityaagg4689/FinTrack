

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/postgres-%23316192.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

![FinTrack Banner](https://via.placeholder.com/800x200/FF6B00/000000?text=FinTrack+-+MODERN+FINANCE+TRACKER)

## 🚀 Overview

**FinTrack** is an advanced personal finance tracker inspired by modern's iconic orange and black design aesthetic. Built with cutting-edge web technologies, it offers a sleek, high-performance dashboard for managing your financial life with style and precision.

### ✨ Key Features

- **🏎️ modern-Inspired Design**: Orange and black color scheme with racing-inspired UI elements
- **💰 Advanced Transaction Management**: Track income and expenses with detailed categorization
- **🎯 Goal Setting & Tracking**: Set financial goals and monitor progress with visual indicators
- **📊 Interactive Charts**: Real-time data visualization with Chart.js
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **🔐 Secure API**: RESTful backend with rate limiting and security measures
- **🐳 Docker Containerized**: Easy deployment with Docker Compose
- **💾 PostgreSQL Database**: Robust data storage with advanced SQL features

## 🛠️ Tech Stack

### Frontend
- **HTML5 & CSS3**: Modern semantic markup and advanced styling
- **JavaScript (ES6+)**: Vanilla JS with modern features
- **Tailwind CSS**: Utility-first CSS framework
- **Chart.js**: Beautiful, responsive charts
- **Google Fonts**: Orbitron & Rajdhani for racing aesthetics

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Fast, minimalist web framework
- **PostgreSQL**: Advanced relational database
- **Helmet**: Security middleware
- **CORS**: Cross-origin resource sharing
- **Express Rate Limit**: API rate limiting

### DevOps
- **Docker & Docker Compose**: Containerization
- **Nginx**: Reverse proxy (production ready)
- **Environment Variables**: Configuration management

## 🏁 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/FinTrack
.git
   cd FinTrack

   ```

2. **Start with Docker Compose**
   ```bash
   # Stop any existing containers
   docker compose down
   
   # Build and start services
   docker compose up --build -d
   
   # Check services status
   docker compose ps
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432

### Manual Setup (Development)

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   # Build Tailwind CSS
   npm run build-css
   npm start
   ```

3. **Database Setup**
   ```bash
   # Make sure PostgreSQL is running
   psql -U postgres -d FinTrack
DB -f backend/init.sql
   ```

### Troubleshooting

#### CORS Issues
If you encounter CORS errors:
- Make sure backend is running on port 3001
- Frontend should be on port 3000
- Check that both services are in the same Docker network

#### Tailwind CSS Issues
- Run `npm run build-css` to rebuild Tailwind
- Check that `tailwind.css` exists in `frontend/src/`

#### Docker Issues
```bash
# Reset everything
docker compose down -v
docker compose up --build -d

# Check logs
docker compose logs backend
docker compose logs frontend
```

## Backend Tests

To run the backend test suite:

```bash
cd backend
npm test
```

## 🎮 Usage Guide

### Adding Transactions
1. Use the **ADD TRANSACTION** form on the left sidebar
2. Select income or expense type
3. Choose appropriate category and payment method
4. Set amount and date
5. Click "⚡ ADD TRANSACTION"

### Setting Financial Goals
1. Click the **+** button in the FINANCIAL GOALS section
2. Enter goal title, target amount, and deadline
3. Track progress and add funds as you save

### Analyzing Your Finances
- **Dashboard Cards**: Quick overview of totals and balance
- **Category Chart**: Visual breakdown of expense categories
- **Monthly Trends**: Income vs expenses over time
- **Transaction Filters**: Filter by income, expenses, or view all

## 🏗️ Architecture

```
FinTrack/
├── 🐳 docker-compose.yml      # Container orchestration
├── 📱 frontend/               # React-like frontend
│   ├── 🎨 src/
│   │   ├── app.js            # Main application logic
│   │   └── styles.css        # modern-inspired styling
│   ├── 🌐 public/
│   │   └── index.html        # Main HTML template
│   └── 📦 package.json       # Frontend dependencies
├── ⚙️ backend/                # Node.js API server
│   ├── 🚀 index.js           # Express server
│   ├── 🗄️ init.sql           # Database schema
│   └── 📦 package.json       # Backend dependencies
└── 📖 README.md              # This file
```

## 🔌 API Endpoints

### Transactions
- `GET /transactions` - List all transactions (with filters)
- `POST /transactions` - Create new transaction
- `PUT /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction

### Analytics
- `GET /analytics/summary` - Financial summary
- `GET /analytics/trends` - Monthly trends data

### Goals
- `GET /goals` - List all goals
- `POST /goals` - Create new goal
- `PUT /goals/:id/progress` - Update goal progress

### Categories
- `GET /categories` - List categories by type

## 🎨 Design System

### Color Palette
```css
/* modern Orange */
--modern-orange: #FF6B00
--modern-dark-orange: #E55A00

/* Racing Black */
--modern-black: #000000
--modern-dark-gray: #1a1a1a
--modern-gray: #2d2d2d

/* Accent Colors */
--accent-green: #00FF88    /* Income */
--accent-red: #FF3366      /* Expenses */
--accent-blue: #00AAFF     /* Savings */
```

### Typography
- **Display Font**: Orbitron (futuristic, digital)
- **Heading Font**: Rajdhani (modern, clean)
- **Body Font**: System fonts for performance

### Animations
- Hover effects with scale transforms
- Loading animations
- Progress bar animations
- Notification slide-ins

## 🔧 Configuration

### Environment Variables
```bash
# Backend
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=FinTrackDB
DB_USER=FinTrackUser
DB_PASSWORD=FinTrackPassword

# Frontend
REACT_APP_API_URL=http://localhost:3001
```

### Docker Compose Override
Create `docker-compose.override.yml` for local customizations:
```yaml
version: '3.8'
services:
  backend:
    environment:
      - DEBUG=true
    volumes:
      - ./backend:/app
```

## 🚀 Production Deployment

### Docker Production
```bash
# Build production images
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale services
docker compose up -d --scale backend=3
```

### Environment Setup
1. Set up SSL certificates
2. Configure reverse proxy (Nginx)
3. Set up database backups
4. Configure monitoring (optional)

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
docker compose -f docker-compose.test.yml up
```

## 📈 Performance Optimizations

- **Lazy Loading**: Charts load on demand
- **Database Indexing**: Optimized queries
- **Asset Compression**: Minified CSS/JS
- **Caching**: Browser and API caching
- **CDN Integration**: External libraries via CDN

## 🔒 Security Features

- **Helmet.js**: Security headers
- **Rate Limiting**: API protection
- **Input Validation**: SQL injection prevention
- **CORS Configuration**: Cross-origin protection
- **Environment Variables**: Secure configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ES6+ JavaScript standards
- Use semantic HTML5 elements
- Maintain responsive design principles
- Write descriptive commit messages
- Add comments for complex logic

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Acknowledgments

- **modern**: Inspiration for the design aesthetic
- **Chart.js**: Beautiful data visualization
- **Tailwind CSS**: Utility-first CSS framework
- **PostgreSQL**: Robust database system
- **Express.js**: Fast web framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/FinTrack/issues)
- **Documentation**: [Wiki](https://github.com/yourusername/FinTrack/wiki)
- **Email**: support@FinTrack.pro

## 🗺️ Roadmap

### Version 2.1
- [ ] User authentication & multi-user support
- [ ] Budget alerts and notifications
- [ ] Export to PDF/Excel
- [ ] Mobile app (React Native)

### Version 2.2
- [ ] Investment tracking
- [ ] Cryptocurrency support
- [ ] AI-powered insights
- [ ] Bank account integration

### Version 3.0
- [ ] Advanced analytics dashboard
- [ ] Financial advisor chatbot
- [ ] Social features (family accounts)
- [ ] API integrations (banks, crypto exchanges)

---

**Built with 🏁 by the FinTrack Team**
*Experience the thrill of financial control with modern-inspired design!*
=======
# FinTrack
