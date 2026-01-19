# 🏭 Warehouse Receiving Management System (WMS)

A modern, full-stack Warehouse Management System designed to streamline dock assignment, reception processing, and storekeeper management. Built with performance, real-time interactivity, and security in mind.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)
![Status](https://img.shields.io/badge/Status-Beta-orange.svg)

## 🚀 Key Features

### 🔐 Authentication & Security
- **JWT-Based Authentication**: Secure, stateless session management.
- **Role-Based Access Control (RBAC)**: Distinct portals for:
    - 🛡️ **Admin**: User management (CRUD), System oversight.
    - 👀 **Supervisor**: Real-time dock monitoring, Manual overriding, Performance tracking.
    - 🚛 **Gate**: Truck registration, Queue management.
    - 👷 **Storekeeper**: Job reception, status toggling.

### 📦 Core Functionality
- **Smart Assignment Logic**: Automatically assigns incoming shipments to available docks and storekeepers based on priority and FIFO queue.
- **Real-Time Docks**: 9 Docks managed dynamically (Busy/Available states).
- **Manual Override**: Supervisors can force-assign or re-assign jobs manually.
- **Queue System**: Automatic queuing when resources are unavailable.

### 🔔 Notifications & Real-Time Updates
- **Push Notifications (VAPID)**: Storekeepers receive instant alerts for new assignments even when the app is in the background.
- **Live Status**: Real-time dashboard updates for Supervisors to monitor warehouse flow.

## 🛠️ Technology Stack

- **Backend**: Node.js (ES Modules), Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Frontend**: Vanilla JavaScript (ES6+), TailwindCSS (CDN)
- **Security**: `jsonwebtoken`, `bcrypt` (planned), `cors`, `helmet` concepts
- **Notifications**: `web-push`, Service Workers

## 📂 Project Structure

```bash
warehouse_receving_system/
├── public/                 # Frontend Assets
│   ├── js/                 # Client-side Logic (Auth, API wrappers)
│   ├── css/                # Custom Styles
│   └── *.html              # Role-specific Dashboards
├── src/
│   ├── config/             # DB & App Configuration
│   ├── controllers/        # Route Logic (User, Dock, Company)
│   ├── middleware/         # Auth & Role Verification
│   ├── models/             # Mongoose Schemas
│   ├── routes/             # API Endpoints
│   ├── services/           # Business Logic (Assignment, notification)
│   └── server.js           # Entry Point
├── .env                    # Environment Variables
└── README.md               # Documentation
```

## 🔧 Installation & Setup

> [!IMPORTANT]
> Ensure you have **Node.js** and **MongoDB** installed and running.

1.  **Clone & Install Dependencies**
    ```bash
    git clone <repo-url>
    cd warehouse_receving_system
    npm install
    ```

2.  **Environment Setup**
    Create a `.env` file in the root directory:
    ```env
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/warehouse_db
    JWT_SECRET=your_super_secret_key_here
    # Public/Private VAPID keys generated via script
    PUBLIC_VAPID_KEY=...
    PRIVATE_VAPID_KEY=...
    ```

3.  **Generate Keys & Seed Data**
    ```bash
    # Generate VAPID Keys for Notifications
    node generate_keys_file.js
    
    # Initialize Database (Create Admin, Docks, default Storekeepers)
    node seeder.js
    ```

4.  **Run the Application**
    ```bash
    npm run dev
    ```
    Access the app at: `http://localhost:5000`

## 📖 Usage Guide

### 1. 🛡️ Admin Portal (`/admin.html`)
- **Login**: `admin` / `123`
- **Actions**: Create new users, delete users, view system-wide user lists.

### 2. 👀 Supervisor Portal (`/supervisor.html`)
- **Login**: `sup1` / `123`
- **Actions**:
    - Monitor all 9 Docks.
    - View "Waiting Queue".
    - **Manual Assign**: Force assign a specific Storekeeper to a specific Dock/Company.
    - **Re-Order**: Change Storekeeper priority.

### 3. 🚛 Gate Portal (`/gate.html`)
- **Login**: `gate` / `123`
- **Actions**: Register incoming trucks. System automatically assigns them or queues them.

### 4. 👷 Storekeeper Portal (`/storekeeper.html`)
- **Login**: `sk1` ... `sk8` / `123`
- **Actions**:
    - **Subscribe**: Enable Push Notifications.
    - **Receive Job**: View assignment details.
    - **Finish Job**: Mark job as done (frees up Dock & Storekeeper).
    - **Break Mode**: Set status to "Break" (prevents new assignments).

## 📡 API Endpoints (Core)

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/login` | User Authentication | Public |
| `GET` | `/api/docks` | List all docks status | Supervisor/Gate |
| `POST` | `/api/companies` | Register new shipment | Gate/Supervisor |
| `POST` | `/api/supervisor/assign` | Manual Assignment | Supervisor |
| `POST` | `/api/storekeepers/:id/finish` | Complete active job | Storekeeper |

---
**Developed for Advanced Warehouse Operations.**
