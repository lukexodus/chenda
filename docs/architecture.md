# Adjusted Recommendations: Proof of Concept (Single Machine)

## 🗄️ Database & Spatial

### **PostgreSQL + PostGIS** (Essential)
**Why**: Core algorithm dependency
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib postgis

# macOS
brew install postgresql postgis

# Enable PostGIS
psql -d chenda -c "CREATE EXTENSION postgis;"
```

**Setup**: Local installation, no cloud needed
- Connection: `postgresql://localhost:5432/chenda`
- Store: Users, Products, ProductTypes, Categories

---

## 🗺️ Maps & Geocoding

### **OpenStreetMap + Nominatim** (Free)
**Why**: Zero cost, respects rate limits

**Implementation**:
```bash
npm install axios
```

```javascript
// geocoding_service.js
const axios = require('axios');

async function geocodeAddress(address) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        limit: 1,
        countrycodes: 'ph' // Philippines only
      },
      headers: {
        'User-Agent': 'Chenda-POC/1.0' // Required by Nominatim
      }
    });
    
    if (response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lng: parseFloat(response.data[0].lon),
        display_name: response.data[0].display_name
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Reverse geocoding (lat/lng -> address)
async function reverseGeocode(lat, lng) {
  const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
    params: {
      lat,
      lon: lng,
      format: 'json'
    },
    headers: {
      'User-Agent': 'Chenda-POC/1.0'
    }
  });
  
  return response.data.display_name;
}
```

**Rate Limit**: 1 request/second (add 1s delay between requests)
```javascript
// Simple rate limiter
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Usage
await geocodeAddress(address);
await sleep(1000); // Wait 1 second
```

### **Leaflet.js** (Free Map Display)
**Why**: Open-source, no API keys needed
```bash
npm install leaflet
```

```html
<!-- In your HTML -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<div id="map" style="height: 400px;"></div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  // Display map with products
  const map = L.map('map').setView([14.5995, 120.9842], 11); // Quezon City
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  
  // Add product markers
  products.forEach(product => {
    L.marker([product.location.lat, product.location.lng])
      .addTo(map)
      .bindPopup(`${product.name} - ₱${product.price}`);
  });
</script>
```

---

## 🔐 Authentication (Simple)

### **Passport.js + Local Strategy** (Self-hosted)
**Why**: Full control, no external dependencies
```bash
npm install passport passport-local bcrypt express-session
```

**Implementation**:
```javascript
// auth.js
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (!user.rows[0]) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      
      const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
      
      if (!validPassword) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      
      return done(null, user.rows[0]);
    } catch (err) {
      return done(err);
    }
  }
));

// Registration
async function registerUser(email, password, name, type) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await db.query(
    'INSERT INTO users (email, password_hash, name, type, email_verified) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [email, hashedPassword, name, type, false]
  );
  return result.rows[0];
}
```

### **Optional: Email Verification** (Toggle Feature)
```bash
npm install nodemailer
```

```javascript
// email_service.js
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Use local SMTP for testing (or Ethereal Email for fake SMTP)
const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 1025, // MailHog or similar local SMTP server
  secure: false
});

async function sendVerificationEmail(email, token) {
  const verificationUrl = `http://localhost:3000/verify-email?token=${token}`;
  
  await transporter.sendMail({
    from: 'noreply@chenda.local',
    to: email,
    subject: 'Verify your Chenda account',
    html: `
      <h2>Welcome to Chenda!</h2>
      <p>Click the link below to verify your email:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
    `
  });
}

// Generate verification token
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}
```

**Local SMTP Testing**:
```bash
# Install MailHog (local email testing)
# macOS
brew install mailhog
mailhog

# Ubuntu
wget https://github.com/mailhog/MailHog/releases/download/v1.0.1/MailHog_linux_amd64
chmod +x MailHog_linux_amd64
./MailHog_linux_amd64
```
View emails at: `http://localhost:8025`

---

## 💳 Payment (Placeholder UI)

### **Mock Payment Interface**
```javascript
// payment_service.js (mock)
class PaymentService {
  async processPayment(orderId, amount, method = 'cash') {
    console.log(`[MOCK] Processing payment: Order ${orderId}, Amount ₱${amount}, Method: ${method}`);
    
    // Simulate payment delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      transaction_id: `MOCK_${Date.now()}`,
      order_id: orderId,
      amount: amount,
      method: method,
      timestamp: new Date().toISOString()
    };
  }
  
  async refundPayment(transactionId) {
    console.log(`[MOCK] Refunding transaction: ${transactionId}`);
    return { success: true, refund_id: `REF_${Date.now()}` };
  }
}

module.exports = new PaymentService();
```

**UI Component** (React):
```jsx
// PaymentModal.jsx
function PaymentModal({ orderId, amount, onSuccess }) {
  const [method, setMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  
  const handlePayment = async () => {
    setLoading(true);
    const result = await fetch('/api/payment/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, amount, method })
    }).then(r => r.json());
    
    if (result.success) {
      onSuccess(result);
    }
    setLoading(false);
  };
  
  return (
    <div className="payment-modal">
      <h3>Payment - ₱{amount}</h3>
      <select value={method} onChange={e => setMethod(e.target.value)}>
        <option value="cash">Cash on Delivery [MOCK]</option>
        <option value="gcash">GCash [MOCK]</option>
        <option value="card">Credit Card [MOCK]</option>
      </select>
      <button onClick={handlePayment} disabled={loading}>
        {loading ? 'Processing...' : 'Complete Payment'}
      </button>
      <p className="text-muted">⚠️ Mock payment - no actual transaction</p>
    </div>
  );
}
```

---

## 📦 File Storage (Local)

### **Local File System** (Simple)
```bash
npm install multer
```

```javascript
// file_upload.js
const multer = require('multer');
const path = require('path');

// Store in project directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/products'); // Create this folder
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    cb(null, isValid);
  }
});

// Usage in Express route
app.post('/api/products', upload.single('image'), async (req, res) => {
  const imagePath = req.file ? `/uploads/products/${req.file.filename}` : null;
  
  // Save to database
  const product = await db.query(
    'INSERT INTO products (..., image_url) VALUES (..., $1)',
    [imagePath]
  );
  
  res.json(product);
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));
```

**Directory Structure**:
```
chenda/
├── uploads/
│   ├── products/
│   │   ├── 1706634567-abc123.jpg
│   │   └── 1706634789-xyz456.png
│   └── users/
│       └── avatars/
```

---

## 📊 Analytics (Free, Local)

### **Plausible Analytics (Self-hosted, Free)**
**Why**: Privacy-focused, lightweight, open-source

**Installation** (Docker):
```bash
# Clone Plausible
git clone https://github.com/plausible/hosting
cd hosting

# Configure
cp plausible-conf.env.example plausible-conf.env
# Edit plausible-conf.env with your settings

# Run
docker-compose up -d
```

**Add to Frontend**:
```html
<script defer data-domain="localhost" src="http://localhost:8000/js/script.js"></script>
```

**Track Custom Events**:
```javascript
// Track algorithm usage
plausible('Algorithm Search', {
  props: {
    proximity_weight: 60,
    freshness_weight: 40,
    results_count: 15
  }
});

// Track user preferences
plausible('Preference Update', {
  props: {
    max_radius: 30,
    min_freshness: 70
  }
});
```

**Dashboard**: `http://localhost:8000`

### **Alternative: Simple Custom Analytics**
**Why**: No external dependency
```javascript
// analytics.js (custom)
class Analytics {
  constructor() {
    this.events = [];
  }
  
  track(eventName, properties = {}) {
    const event = {
      name: eventName,
      properties,
      timestamp: new Date().toISOString(),
      session_id: this.getSessionId()
    };
    
    this.events.push(event);
    
    // Persist to database
    db.query(
      'INSERT INTO analytics_events (name, properties, timestamp) VALUES ($1, $2, $3)',
      [eventName, JSON.stringify(properties), event.timestamp]
    );
  }
  
  getSessionId() {
    // Simple session tracking
    return localStorage.getItem('session_id') || this.generateSessionId();
  }
  
  generateSessionId() {
    const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('session_id', id);
    return id;
  }
  
  async getStats(eventName, dateRange) {
    const result = await db.query(
      `SELECT 
        COUNT(*) as count,
        properties,
        DATE(timestamp) as date
      FROM analytics_events 
      WHERE name = $1 AND timestamp >= $2
      GROUP BY DATE(timestamp), properties
      ORDER BY date DESC`,
      [eventName, dateRange]
    );
    
    return result.rows;
  }
}

// Usage
const analytics = new Analytics();
analytics.track('Product Search', {
  query: 'milk',
  results: 10,
  avg_freshness: 78.5,
  avg_distance: 5.2
});
```

**Simple Dashboard Query**:
```sql
-- Most used preference weights
SELECT 
  properties->>'proximity_weight' as proximity_weight,
  properties->>'freshness_weight' as freshness_weight,
  COUNT(*) as searches
FROM analytics_events
WHERE name = 'Algorithm Search'
GROUP BY proximity_weight, freshness_weight
ORDER BY searches DESC
LIMIT 10;
```

---

## 📱 Frontend Framework

### **Next.js 14** (Recommended for POC)
**Why**: Simple setup, built-in API routes
```bash
npx create-next-app@latest chenda-app
cd chenda-app
npm install pg bcrypt passport passport-local express-session leaflet axios multer
```

**Alternative**: **Express.js + EJS** (Simpler, server-rendered)
```bash
npm init -y
npm install express ejs pg bcrypt passport passport-local express-session
```

```javascript
// app.js (Express + EJS)
const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.render('index', { user: req.user });
});

app.get('/search', async (req, res) => {
  const products = await searchProducts(req.query);
  res.render('search', { products });
});

app.listen(3000, () => console.log('Chenda POC running on http://localhost:3000'));
```

---

## 🔧 Development Tools

### **Database Management**
```bash
# pgAdmin (GUI for PostgreSQL)
# Ubuntu
sudo apt install pgadmin4

# macOS
brew install --cask pgadmin4
```

### **API Testing**
```bash
# HTTPie (better than curl)
sudo apt install httpie

# Test endpoints
http POST localhost:3000/api/auth/login email=maria@test.com password=test123
```

### **Live Reload**
```bash
npm install --save-dev nodemon

# package.json
"scripts": {
  "dev": "nodemon app.js"
}
```

---

## 🎯 Minimal POC Tech Stack

```
Frontend:   Next.js 14 OR Express + EJS
Backend:    Next.js API Routes OR Express.js
Database:   PostgreSQL 16 + PostGIS (local)
Auth:       Passport.js (local strategy)
Maps:       OpenStreetMap + Nominatim + Leaflet.js
Storage:    Local filesystem (multer)
Email:      Nodemailer + MailHog (local SMTP)
Analytics:  Custom (PostgreSQL table) OR Plausible self-hosted
Payment:    Mock implementation (placeholder UI)
```

**Total Cost**: $0 (everything runs locally)

---

## 📋 Setup Checklist

### Initial Setup (30 minutes)
```bash
# 1. Install PostgreSQL + PostGIS
sudo apt install postgresql postgis

# 2. Create database
sudo -u postgres psql
CREATE DATABASE chenda;
\c chenda
CREATE EXTENSION postgis;

# 3. Initialize project
npx create-next-app@latest chenda-app
cd chenda-app
npm install pg bcrypt passport passport-local express-session leaflet axios multer

# 4. Create uploads directory
mkdir -p uploads/products uploads/users/avatars

# 5. Setup MailHog (optional, for email testing)
wget https://github.com/mailhog/MailHog/releases/download/v1.0.1/MailHog_linux_amd64
chmod +x MailHog_linux_amd64
./MailHog_linux_amd64 &

# 6. Run migrations (create tables)
node scripts/migrate.js

# 7. Seed mock data
node scripts/seed.js

# 8. Start dev server
npm run dev
```

---

## 🚀 Feature Toggle System

### **Environment Variables** (.env)
```env
# Feature flags
ENABLE_EMAIL_VERIFICATION=false
ENABLE_PAYMENTS=false
ENABLE_ANALYTICS=true
ENABLE_MAP_DISPLAY=true

# Database
DATABASE_URL=postgresql://localhost:5432/chenda

# Email (if verification enabled)
SMTP_HOST=localhost
SMTP_PORT=1025

# Nominatim
GEOCODING_USER_AGENT=Chenda-POC/1.0
```

### **Feature Flag Usage**
```javascript
// features.js
const features = {
  emailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
  payments: process.env.ENABLE_PAYMENTS === 'true',
  analytics: process.env.ENABLE_ANALYTICS === 'true',
  mapDisplay: process.env.ENABLE_MAP_DISPLAY === 'true'
};

// Usage
if (features.emailVerification) {
  await sendVerificationEmail(user.email, token);
}

// In UI
{features.payments && <PaymentSection />}
```

---

## 📊 Expected Performance (Single Machine)

**Hardware**: Modern laptop (8GB RAM, SSD)
- **Concurrent users**: 10-50 (sufficient for POC demo)
- **Database size**: ~100MB (10,000 products)
- **Search latency**: <100ms (with PostGIS indexes)
- **Image uploads**: ~2s per 2MB image

**Bottlenecks** (for future scale):
- Nominatim rate limit (1 req/s) - cache geocoded addresses
- Local storage (100GB+ images) - migrate to Cloudinary later
- PostgreSQL connections (100 max) - add pgBouncer if needed

---

## 🎓 Learning Resources

**PostgreSQL + PostGIS**:
- [PostGIS Tutorial](https://postgis.net/workshops/postgis-intro/)
- [Spatial Queries Guide](https://postgis.net/docs/using_postgis_dbmanagement.html)

**OpenStreetMap**:
- [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/)
- [Leaflet.js Docs](https://leafletjs.com/reference.html)

**Passport.js**:
- [Local Strategy Guide](http://www.passportjs.org/tutorials/password/)

---

## ✅ Summary: Zero-Cost POC Stack

| Component | Solution | Cost |
|-----------|----------|------|
| Database | PostgreSQL + PostGIS (local) | $0 |
| Auth | Passport.js + Local Strategy | $0 |
| Geocoding | Nominatim (OSM) | $0 |
| Maps | Leaflet.js + OSM tiles | $0 |
| Storage | Local filesystem | $0 |
| Email | MailHog (local SMTP) | $0 |
| Analytics | Custom or Plausible self-hosted | $0 |
| Payment | Mock implementation | $0 |
| Hosting | localhost | $0 |
| **TOTAL** | | **$0/month** |

**Next Steps**: 
1. Set up PostgreSQL + PostGIS
2. Implement Nominatim geocoding with rate limiting
3. Build simple Passport.js authentication
4. Create Leaflet.js map view
5. Integrate your existing algorithm code

**Ready to start implementation?**