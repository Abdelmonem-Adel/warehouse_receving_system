# Warehouse Receiving Management System

A complete MVP for managing warehouse docks, storekeepers, and incoming shipments with Web Push Notifications.

## Setup Instructions

> [!IMPORTANT]
> Please run the following commands in your terminal to initialize the project, as the automated installation might have timed out.

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Generate VAPID Keys** (For Push Notifications)
    ```bash
    node generate_keys_file.js
    ```
    This will create a `keys.json` file.

3.  **Seed Database** (Initialize Docks & Storekeepers)
    Make sure MongoDB is running locally.
    ```bash
    node seeder.js
    ```

4.  **Start the Server**
    ```bash
    npm run dev
    ```

## Usage

1.  Open [http://localhost:5000](http://localhost:5000) in your browser.
2.  **Gate Employee**: Go to "موظف البوابة". Register companies.
3.  **Storekeeper**: Open a new tab (or incognito). Login with:
    - Username: `sk1` (up to `sk8`)
    - Password: `123`
4.  **Test Flow**:
    - Register a company at the Gate.
    - If a Dock and Storekeeper are available, they get assigned immediately.
    - The Storekeeper receives a notification.
    - Click "Finish" on Storekeeper dashboard to free up resources.
    - Queue processes automatically.

## Tech Stack
- **Backend**: Node.js, Express, Mongoose.
- **Frontend**: HTML, Tailwind CSS, Vanilla JS.
- **Database**: MongoDB.
- **Notifications**: Web Push + Service Workers.
