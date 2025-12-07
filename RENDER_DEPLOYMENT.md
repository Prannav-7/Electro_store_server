# 🚀 Render Deployment Guide - ElectroStore Server

## Prerequisites
✅ MongoDB Atlas account with database created  
✅ GitHub repository: `Prannav-7/Electro_store_server`  
✅ Render account (free tier works)

---

## Step-by-Step Deployment Instructions

### 1. **Prepare MongoDB Atlas**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Navigate to **Database Access** → Verify user exists with correct password
   - Navigate to **Network Access** → Add `0.0.0.0/0` (Allow from anywhere)
   - Copy your connection string

### 2. **Deploy on Render**
   
   #### A. Create New Web Service
   1. Go to [Render Dashboard](https://dashboard.render.com/)
   2. Click **"New +"** → **"Web Service"**
   3. Connect your GitHub account if not already connected
   4. Select repository: `Prannav-7/Electro_store_server`
   5. Click **"Connect"**

   #### B. Configure Service Settings
   ```
   Name: electro-store-server (or your preferred name)
   Region: Choose closest to you
   Branch: main
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```

   #### C. **Add Environment Variables** (CRITICAL!)
   Click **"Advanced"** → **"Add Environment Variable"**
   
   Add these **EXACT** variables:
   
   ```bash
   NODE_ENV=production
   PORT=5000
   
   # MongoDB - Replace with YOUR credentials
   MONGO_URI=mongodb+srv://prannavp803_db_user:Prannav%402005@cluster0.xgscvbf.mongodb.net/Electro?retryWrites=true&w=majority&appName=Cluster0
   
   # JWT Secret - Use a strong random string
   JWT_SECRET=your_super_secret_jwt_key_here_change_in_production_12345
   
   # Email Configuration
   EMAIL_USER=prannavp803@gmail.com
   EMAIL_PASS=gcrjlesttwgkuxcg
   EMAIL_TO=info.jaimaaruthi@gmail.com
   
   # Razorpay
   RAZORPAY_KEY_ID=rzp_live_RJWCTmk27IKagd
   RAZORPAY_KEY_SECRET=wYnOO3WfQnMXzJKmz7HNwJd1
   RAZORPAY_PAYMENT_LINK=https://razorpay.me/@jaimaaruthi
   
   # UPI
   MERCHANT_UPI_ID=prannav2511@okhdfcbank
   MERCHANT_NAME=Prannav P
   MERCHANT_PHONE=+91-8838686407
   
   # WhatsApp
   WHATSAPP_PROVIDER=simulation
   
   # Frontend URL (add after deploying frontend)
   REACT_URL=https://your-frontend-url.vercel.app
   ```

### 3. **Deploy!**
   - Click **"Create Web Service"**
   - Wait 5-10 minutes for deployment
   - Watch the logs for any errors

### 4. **Verify Deployment**
   Once deployed, your service will be at:
   ```
   https://electro-store-server-XXXX.onrender.com
   ```
   
   Test these endpoints:
   - `GET /` → Should return "API running"
   - `GET /health` → Should return database status
   - `GET /api/products` → Should return products list

---

## 🔧 Troubleshooting Common Issues

### ❌ "Exited with status 1"
**Cause:** Missing environment variables or MongoDB connection failure

**Fix:**
1. Verify all environment variables are added in Render dashboard
2. Check MongoDB Atlas Network Access allows `0.0.0.0/0`
3. Verify MongoDB credentials are correct
4. Check Render logs for specific error

### ❌ "Cannot find module"
**Cause:** Dependencies not installed

**Fix:**
- Ensure Build Command is: `npm install`
- Check `package.json` exists in repository

### ❌ "Port already in use"
**Cause:** PORT environment variable not set

**Fix:**
- Add `PORT=5000` in environment variables
- Render automatically sets `PORT`, but we default to 5000

### ❌ "MongoDB connection timeout"
**Cause:** Network access restrictions

**Fix:**
1. MongoDB Atlas → Network Access → Add IP Address
2. Add: `0.0.0.0/0` (Allow from anywhere)
3. Wait 2-3 minutes for MongoDB to apply changes

---

## 📊 Monitoring

### View Logs
1. Go to Render Dashboard
2. Click your service
3. Click **"Logs"** tab
4. Look for:
   - ✅ "MongoDB connected successfully"
   - ✅ "Server started on port 5000"
   - ✅ "Database status: ✅ Connected"

### Health Check
Render automatically pings: `GET /health`
- Returns 200 if healthy
- Returns 503 if database disconnected

---

## 🔄 Auto-Deploy

Your service is configured for **Auto-Deploy**:
- Every push to `main` branch triggers automatic deployment
- Check **"Events"** tab in Render dashboard for deployment status

---

## 🔐 Security Notes

1. **Never commit `.env` file** (already in `.gitignore`)
2. Change `JWT_SECRET` to a strong random string
3. Use MongoDB Atlas IP whitelist in production
4. Rotate API keys regularly

---

## 📝 Environment Variables Template

Copy this template to add in Render:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<generate-strong-secret>
EMAIL_USER=<your-email>
EMAIL_PASS=<app-password>
EMAIL_TO=<recipient-email>
RAZORPAY_KEY_ID=<your-key>
RAZORPAY_KEY_SECRET=<your-secret>
RAZORPAY_PAYMENT_LINK=<your-payment-link>
MERCHANT_UPI_ID=<your-upi-id>
MERCHANT_NAME=<your-name>
MERCHANT_PHONE=<your-phone>
WHATSAPP_PROVIDER=simulation
REACT_URL=<your-frontend-url>
```

---

## 🎯 Next Steps After Deployment

1. ✅ Test all API endpoints
2. ✅ Note down your Render URL
3. ✅ Deploy frontend (Vercel/Netlify)
4. ✅ Update `REACT_URL` in Render environment variables
5. ✅ Update frontend API base URL to your Render URL

---

## 📞 Support

If deployment fails:
1. Check Render logs
2. Verify MongoDB Atlas connection
3. Ensure all environment variables are set
4. Check GitHub repository has latest code

**Render Service URL:** `https://electro-store-server.onrender.com` (or your custom name)

Good luck! 🚀
