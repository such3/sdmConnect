

# 📚 sdmConnect

**sdmConnect** is a full-stack educational resource management system developed as part of a Software Engineering course. It allows users to upload, manage, and interact with study materials through features like user authentication, resource sharing, ratings, reviews, and administrative controls.

This project was designed to practice the **Software Development Life Cycle (SDLC)**, including **requirements gathering**, **DFDs**, **sequence diagrams**, **testing**, and **deployment practices**.

---

## 🚀 Features

- **User Authentication & Profile Management**  
  Register, log in, log out, and manage user profiles using JWT for secure access.

- **Educational Resource Management**  
  Upload, update, view, delete resources (study guides, notes, etc.).

- **Ratings & Comments**  
  Users can rate resources (1–5 stars) and provide feedback.

- **Search Functionality**  
  Search resources by keywords in the title or description.

- **Admin Capabilities**  
  Admins can block/unblock resources, delete users, and view system stats.

- **Profile Picture Uploads** via **Cloudinary**

- **Forgot Password** functionality via **Mailgun**

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js  
- **Database:** MongoDB (with Mongoose ODM)  
- **Authentication:** JSON Web Tokens (JWT)  
- **Media Storage:** Cloudinary  
- **Email Service:** Mailgun  
- **Environment Management:** dotenv  
- **Development Tools:** Nodemon, PostCSS, Tailwind (in UI-related branches)

---

## 🧾 Prerequisites

- Node.js (v18+ recommended)  
- MongoDB (local or cloud instance)  
- Mailgun & Cloudinary accounts for media and email services

---

## ⚙️ Installation

1. **Clone the repository:**

```bash
git clone https://github.com/such3/sdmConnect.git
cd sdmConnect
````

2. **Install dependencies:**

```bash
npm install
```

3. **Setup environment variables:**

Rename `.env.sample` to `.env` and update the placeholders with your credentials:

```bash
cp .env.sample .env
```

4. **Start the development server:**

```bash
npm run dev
```

---

## 📁 Project Structure (Backend)

```
src/
│
├── controllers/        # Logic for handling requests
├── middlewares/        # Custom auth & error handling
├── models/             # MongoDB schemas
├── routes/             # Express route definitions
├── utils/              # Utility functions
├── config/             # Cloudinary, DB, Mailgun configs
└── index.js            # Entry point
```

---

## 🧪 Scripts

| Script              | Purpose                             |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Run development server with nodemon |
| `npm run test`      | Placeholder for future testing      |
| `npm run tailwind`  | Tailwind CSS build (if applicable)  |
| `npm run watch:css` | Watch CSS using PostCSS             |

> Note: Tailwind and CSS scripts are included for UI development if frontend integration is added later.

---

## 🔐 Environment Variables

You’ll need to configure the following in your `.env` file:

```env
PORT=3000
MONGODB_URL=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain

CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

---

## ✍️ Contributions

This project was developed as a collaborative academic exercise.
Pull requests are welcome if you're interested in contributing!

---

## 📚 License

This project is for educational purposes and not intended for commercial use. Licensing can be added later as needed.

---

## 🙌 Acknowledgements

Thanks to our instructors and peers for guidance during the Software Engineering course!

---

## 📎 Related Tags

`#NodeJS` `#MongoDB` `#JWT` `#Cloudinary` `#Mailgun` `#RESTAPI` `#BackendDevelopment` `#SDLC` `#AcademicProject`
