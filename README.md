# 🔍 FindLink

FindLink is an AI-powered Missing & Found Person Matching System designed to help reconnect missing individuals with their families using face recognition, intelligent matching, and location-based search.

## ✨ Features

- 👤 Missing Person Registration
- 📸 Found Person Registration
- 🤖 AI Face Recognition Matching
- 📊 Match Confidence Score
- 📍 Location-Based Search
- 🔎 Search & Filter Records
- 🛡️ Secure Authentication
- 📱 Responsive Design
- 🗄️ MongoDB Database
- ⚡ REST API Backend

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS

### Backend
- Node.js
- Express.js

### Database
- MongoDB
- Mongoose

### AI & Image Processing
- Python
- InsightFace
- OpenCV
- FAISS

## 📂 Project Structure

```text
FindLink/
├── frontend/
├── backend/
├── uploads/
└── README.md
```

## 🚀 Installation

Clone the repository:

```bash
git clone git@github.com:vinitniwalkar804-design/Findlink.git
```

Go to the project:

```bash
cd Findlink
```

Install frontend:

```bash
cd frontend
npm install
npm run dev
```

Install backend:

```bash
cd backend
npm install
npm start
```

## 🔐 Environment Variables

Create a `.env` file inside the backend folder.

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PYTHON_PATH=python
UPLOAD_PATH=uploads
```

## 🤖 AI Face Matching

FindLink uses:

- InsightFace
- FAISS
- OpenCV
- Python

## 📋 Workflow

1. Register/Login
2. Report Missing Person
3. Upload Found Person
4. AI extracts face embeddings
5. Compare with database
6. Display match results
7. Contact authorities or family

## 🚀 Future Improvements

- Live Camera Detection
- CCTV Integration
- SMS Notifications
- Email Alerts
- Mobile App
- Aadhaar Verification
- Police Portal
- Multi-language Support

## 📷 Screenshots

Add screenshots of:

- Login
- Dashboard
- Missing Person Form
- Found Person Form
- Match Results
- Admin Panel

## 🤝 Contributing

```bash
git checkout -b feature-name
git commit -m "Added new feature"
git push origin feature-name
```

Then create a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Vinit Niwalkar**

GitHub: https://github.com/vinitniwalkar804-design

## ⭐ Support

If you like this project, please give it a ⭐ on GitHub.
