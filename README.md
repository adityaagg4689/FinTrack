# FinTrack 💰

FinTrack is a modern **personal finance tracker** that helps users manage income, expenses, budgets, and savings goals with real-time analytics and an intuitive dashboard.

The application is **fully containerized using Docker**, ensuring easy setup, consistency across environments, and smooth deployment.

---

## 🚀 Features

- Add, edit, and delete **income & expenses**
- Categorized transactions
- **Monthly analytics** with interactive charts
- **Financial goals** tracking with progress indicators
- Budget management
- Interactive **guided tour**
- Responsive and modern UI

---

## 🛠 Tech Stack

### Frontend
- HTML
- Tailwind CSS
- Vanilla JavaScript
- Chart.js

### Backend
- Node.js
- Express.js

### Database
- PostgreSQL

### DevOps / Tools
- **Docker**
- Docker Compose
- Git & GitHub

---

## 📂 Project Structure

FinTrack/
│── backend/
│ ├── server.js
│ ├── routes/
│ └── database.sql
│
│── frontend/
│ ├── index.html
│ ├── app.js
│ └── styles.css
│
│── Dockerfile
│── docker-compose.yml
│── README.md



## 🐳 Run with Docker (Recommended)

```bash
git clone https://github.com/adityaagg4689/FinTrack.git
cd FinTrack
docker-compose up --build
Backend API → http://localhost:3001

Frontend → http://localhost:3000

⚙️ Run Locally (Without Docker)
npm install
npm start
Ensure PostgreSQL is running and environment variables are properly configured.

📌 Future Improvements
User authentication (JWT)

Multi-currency support

Export reports (PDF / CSV)

Cloud deployment (Render / AWS)

👨‍💻 Author
Aditya Agarwal
Full-stack project built for learning, deployment practice, and resume showcase.










