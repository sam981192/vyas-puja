# Vyas Puja Offerings Management System

A full-featured application to manage devotee offerings with dynamic forms, file uploads, auto-renaming, zip generation, and an admin dashboard.

## Features

- **Dynamic Submission Form**: Form adjusts based on selected offering format (Text vs Files).
- **Auto File Renaming**: Files are automatically renamed based on `language-state-city-name-contact-fileIndex.ext`.
- **File Processing**: Multiple file uploads are automatically zipped for easy downloading.
- **Proper Database Integration**: Uses SQLite for structured storage of all offerings and metadata.
- **Admin Dashboard**: View submissions, filter, search, and export all data to Excel (`.xlsx`).
- **REST APIs**: Backend handled by Node.js, Express, and Multer for efficient processing.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm (Node Package Manager)

## Setup & Run Locally

1. **Install Dependencies**
   Open your terminal in the project directory and run:
   ```bash
   npm install
   ```

2. **Run the Application**
   Start the full stack application (Vite frontend + Express backend):
   ```bash
   npm run dev
   ```

3. **Access the Application**
   - The app will be available at: `http://localhost:3000`
   - Use the **Admin Panel** to view submissions. The default password is `admin123`.

## Database and File Storage
- **Database**: `database.sqlite` will be automatically generated in the root directory.
- **Uploads**: Individual files will be stored in the `/uploads` folder.
- **Exports/Zips**: Generated ZIP files and exported Excel files will be stored in the `/exports` folder.

## Technologies Used
- Frontend: React, TailwindCSS, Lucide Icons, Vite
- Backend: Node.js, Express.js
- Database: SQLite (`sqlite` & `sqlite3`)
- Utilities: `multer` (file handling), `archiver` (zipping), `xlsx` (Excel exports)
