# 🇮🇳 PehchanAI — Indian Traditional Dress Virtual Try-On

> Experience India's cultural heritage through AI. Try on traditional dresses from **28+ Indian states** using just your webcam.

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Flask](https://img.shields.io/badge/Flask-3.1-green)
![AI](https://img.shields.io/badge/AI-IDM--VTON-orange)
![Cost](https://img.shields.io/badge/Cost-FREE-brightgreen)

## ✨ Features

- 📸 **Webcam Capture** — Take a photo directly from your browser
- 📁 **Photo Upload** — Or upload an existing photo
- 👗 **40+ Traditional Dresses** — From all 28 Indian states
- 🤖 **AI-Powered Try-On** — Photorealistic results (>95% realistic)
- 📚 **Cultural Education** — Learn about each dress's history & significance
- 🔍 **Search & Filter** — Find dresses by state, region, or name
- 💾 **Download Results** — Save your try-on images
- 🆓 **100% Free** — Uses HuggingFace Spaces (no GPU needed!)
- ⚡ **Smart Caching** — Instant results for repeat try-ons

## 🚀 Quick Start

### Prerequisites
- Python 3.10 or higher
- pip (Python package manager)
- Internet connection (for AI processing)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/face-recognition.git
cd face-recognition

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run the application
python app.py
```

### Open in Browser
Navigate to: **http://localhost:5000**

## 🎯 How It Works

1. **Capture/Upload Photo** — Use webcam or upload a full/half-body photo
2. **Browse & Select** — Choose a traditional dress from any Indian state
3. **AI Magic** — Our AI generates a photorealistic try-on image
4. **Download & Share** — Save your traditional look!

## 🏗️ Architecture

```
You (Browser) → Flask Server (CPU) → HuggingFace Spaces (Free GPU)
                                    → IDM-VTON AI Model
                                    → Result Image
```

- **Frontend**: HTML5 + CSS3 + JavaScript (Premium Light Mode UI)
- **Backend**: Python Flask
- **AI Model**: IDM-VTON via HuggingFace Spaces (free, no API key needed)
- **Caching**: File-based result caching for instant repeat requests

## 📁 Project Structure

```
face-recognition/
├── app.py              # Flask application entry point
├── config.py           # Configuration
├── requirements.txt    # Python dependencies
├── RESEARCH.md         # Detailed research document
├── api/
│   └── routes.py       # API endpoints
├── services/
│   └── tryon_service.py # AI try-on service
├── templates/
│   └── index.html      # Main page
├── static/
│   ├── css/style.css   # Premium light mode styles
│   └── js/app.js       # Frontend application
└── data/
    └── dresses.json    # Complete dress catalog (28+ states)
```

## 🧵 Supported States & Dresses

| Region | States |
|--------|--------|
| **North** | Himachal Pradesh, Punjab, Rajasthan, Haryana, Uttarakhand, Uttar Pradesh, J&K |
| **South** | Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, Telangana |
| **East** | West Bengal, Bihar, Odisha, Jharkhand |
| **West** | Gujarat, Maharashtra, Goa |
| **Northeast** | Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura, Arunachal Pradesh |
| **Central** | Madhya Pradesh, Chhattisgarh |

## 📄 License

This project is for educational purposes. The IDM-VTON model is licensed under CC BY-NC-SA 4.0 (non-commercial use).

## 🙏 Acknowledgements

- [IDM-VTON](https://github.com/yisol/IDM-VTON) — KAIST & OMNIOUS.AI
- [HuggingFace Spaces](https://huggingface.co/) — Free GPU inference
- India's artisan communities — for centuries of textile heritage
