# 📚 sdmConnect

**sdmConnect** is a modern, full-stack educational resource management system designed for students and educators. It enables users to upload, organize, download, and interact with academic study materials. 

This project was developed with a focus on clean architecture, secure session management, and robust developer ergonomics (including zero-config local email/password resets and instant guest mode).

---

## 🌟 Key Features

- **Guest Mode Login:** Explore the system instantly with a single click using the built-in guest login option (no database pre-seeding required).
- **User Authentication:** Secure signup, login, and profile updates powered by JWT cookies.
- **Resource Management:** Upload, update, categorize, search, and delete academic study materials (guides, notes, etc.).
- **Ratings & Comments:** Rate resources on a 1-5 star scale and comment to foster academic collaboration.
- **Search & Filters:** Easily find study resources filtered by branch, semester, or keyword search.
- **Admin Dashboard:** Access controls to manage user accounts, block/unblock resources, and view system statistics.
- **Secure Password Reset:** Bypasses Mailgun/SMTP configuration on local environments by directly redirecting to the reset form.

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB (using Mongoose ODM)
- **Templating Engine:** EJS (Embedded JavaScript templates)
- **Styling:** Tailwind CSS (via CDN) & Custom CSS
- **Authentication:** JSON Web Tokens (JWT) & Cookies
- **File Uploads:** Multer (local parsing) & Cloudinary (cloud storage)

---

## ⚙️ Quick Start

Follow these steps to set up and run **sdmConnect** locally:

### 1. Clone the Repository
```bash
git clone https://github.com/such3@users/sdmConnect.git
cd sdmConnect
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy `.env.sample` to `.env`:
```bash
cp .env.sample .env
```
Open `.env` and fill in your connection details (you can run immediately without MongoDB if you just want to test server boot, as the database connects in the background):
```env
PORT=3000
MONGODB_URL=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=10d

# Cloudinary credentials (required for image/avatar uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Run the Development Server
```bash
npm run dev
```
The server will start listening on port `3000` (defaults to `8000` if port 3000 is occupied). Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👤 Guest Mode & Local Testing

- **Guest Account:** On the login page, click the **Login as Guest** button. The server automatically checks and instantiates a guest account on-the-fly inside your database if it does not already exist.
  - **Email:** `guest@sdmconnect.com`
  - **Password:** `guestpassword123`
- **Zero-Config Password Reset:** When testing the "Forgot Password" feature, submitting your email redirects you **directly** to the reset password page on localhost, logging the token details to the terminal. No Mailgun domain or SMTP configuration is required for local development.

---

## 📁 Directory Structure

```
sdmConnect/
├── public/             # Static frontend files (scripts, stylesheets, dist files)
├── src/
│   ├── controllers/    # Route controllers (user actions, resources, password resets)
│   ├── db/             # Database connection setups
│   ├── middlewares/    # Custom middlewares (JWT authentication, Admin authorization)
│   ├── models/         # MongoDB/Mongoose schemas
│   ├── routes/         # Express routing definitions
│   ├── utils/          # Helper classes (API responses, errors, image uploaders)
│   ├── views/          # EJS UI templates
│   ├── app.js          # Express app configurations & global error handling
│   └── index.js        # Server entry point
├── .env.sample         # Sample configuration template
├── package.json        # Dependencies & package scripts
└── Readme.md           # Documentation
```

---

## 🧪 NPM Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `nodemon ...` | Runs the server in development mode with live reloading. |
| `npm run tailwind` | `tailwindcss ...` | Watches and builds Tailwind CSS utility classes. |
| `npm run watch:css` | `postcss ...` | PostCSS compiler watcher. |

---

## 🤝 Contributions

Feel free to open issues or submit pull requests to improve the system.

## 📄 License
This project was created for educational purposes.
