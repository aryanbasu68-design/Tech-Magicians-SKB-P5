# 🌊 GeoPlastic Shield — Backend API
## SKB_P5 | Autonomous Sub-Pixel Detection & Trajectory Mapping
### Team TECH MAGICIANS | SVPCET Nagpur | Sankalp Bharat 2026

---

## 🚀 HOW TO RUN

```bash
# Step 1: Install dependencies
pip install -r requirements.txt

# Step 2: Run the server
python main.py

# Server starts at: http://localhost:8000
# API Docs (Swagger): http://localhost:8000/docs
```

---

## 📡 ALL API ENDPOINTS

### Core Detection
| Method | Endpoint | What it does |
|--------|----------|-------------|
| POST | `/api/detect/pixel` | Full pipeline on single pixel |
| POST | `/api/detect/area` | Scan entire geographic area |
| POST | `/api/trajectory/forecast` | Predict plastic drift trajectory |
| GET  | `/api/detections` | Get all detections |
| GET  | `/api/hotspots` | Get plastic accumulation hotspots |

### Alerts & Dashboard
| Method | Endpoint | What it does |
|--------|----------|-------------|
| POST | `/api/alert/send` | Send cleanup alert to coast guard |
| GET  | `/api/alerts` | Get all sent alerts |
| GET  | `/api/dashboard/stats` | Dashboard statistics |
| GET  | `/api/fdi/explain` | Learn about FDI formula |

---

## 🧪 EXAMPLE API CALLS

### 1. Detect a single pixel
```bash
curl -X POST http://localhost:8000/api/detect/pixel \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 19.23,
    "longitude": 72.85,
    "band_red": 0.08,
    "band_nir": 0.35,
    "band_swir": 0.12,
    "band_green": 0.10,
    "band_blue": 0.07,
    "days_at_sea": 15
  }'
```

### 2. Scan an area
```bash
curl -X POST http://localhost:8000/api/detect/area \
  -H "Content-Type: application/json" \
  -d '{
    "lat_min": 18.0,
    "lat_max": 20.0,
    "lon_min": 71.0,
    "lon_max": 74.0,
    "apply_biofouling_correction": true,
    "forecast_hours": 72
  }'
```

### 3. Get trajectory forecast
```bash
curl -X POST http://localhost:8000/api/trajectory/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 19.23,
    "longitude": 72.85,
    "detection_confidence": 89.5,
    "forecast_hours": 72
  }'
```

---

## 🧠 CORE ALGORITHMS

### FDI Formula
```
FDI = R_NIR - (R_RED + (R_SWIR - R_RED) × α)
```
- FDI > 0.15 → Strong plastic signal
- FDI 0.05–0.15 → Possible plastic (CNN verifies)
- FDI < 0.05 → Water / Algae / Foam

### Biofouling Correction
```
decay = 1 - e^(-days/30)
corrected_FDI = FDI × (1 + biofouling_severity × 0.4)
```

### Trajectory Physics
```
u_total = u_ocean_current + 0.03 × wind_speed × sin(wind_dir)
v_total = v_ocean_current + 0.03 × wind_speed × cos(wind_dir)
```

---

## 👥 TEAM MEMBERS
Aryan Basu | Arya Bhagwat | Praneet Balapure
Swara Nimbalkar | Prachi Nandekar | Ujwal Dhargave

---
**Sankalp Bharat 2026 | SVPCET Nagpur | SKB_P5**
## 🌐 Live Demo

Check out the live application here:  
👉 https://geo-plastic-frontend.preview.emergentagent.com/
