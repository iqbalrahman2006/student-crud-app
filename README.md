# Student CRUD Application

This is a simple CRUD application for managing student records using React for the frontend and Node.js with MongoDB for the backend.

## Project Structure

```
student-crud-app
├── client                # React frontend
│   ├── package.json      # Client dependencies and scripts
│   ├── public
│   │   └── index.html    # Main HTML file
│   └── src
│       ├── index.js      # Entry point for React
│       ├── App.js        # Main App component
│       ├── components     # Reusable components
│       │   ├── StudentList.js   # Displays list of students
│       │   ├── StudentForm.js    # Form for adding/editing students
│       │   └── StudentItem.js    # Represents a single student
│       ├── pages         # Page components
│       │   ├── Home.js   # Landing page
│       │   └── StudentDetail.js  # Detailed view of a student
│       ├── services       # API service functions
│       │   └── api.js    # Functions for CRUD operations
│       └── styles        # CSS styles
│           └── App.css   # Styles for the application
├── server                # Node.js backend
│   ├── package.json      # Server dependencies and scripts
│   ├── .env.example      # Example environment variables
│   └── src
│       ├── app.js        # Entry point for the server
│       ├── controllers    # Controller functions
│       │   └── studentController.js # Handles student CRUD operations
│       ├── models        # Mongoose models
│       │   └── Student.js # Student model
│       ├── routes        # API routes
│       │   └── students.js # Routes for student operations
│       └── config        # Configuration files
│           └── db.js     # MongoDB connection
├── .gitignore            # Git ignore file
├── package.json          # Overall project dependencies and scripts
└── README.md             # Project documentation
```

## Getting Started

### Prerequisites

- Node.js and npm installed
- MongoDB installed and running

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd student-crud-app
   ```

2. Install server dependencies:
   ```
   cd server
   npm install
   ```

3. Install client dependencies:
   ```
   cd client
   npm install
   ```

### Configuration

1. Create a `.env` file in the `server` directory based on the `.env.example` file and set your MongoDB connection string.

### Running the Application

1. Start the server:
   ```
   cd server
   npm start
   ```

2. Start the client:
   ```
   cd client
   npm start
   ```

### Usage

- Navigate to `http://localhost:3000` to access the application.
- You can add, edit, and delete student records through the interface.

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.

## License

This project is licensed under the MIT License.