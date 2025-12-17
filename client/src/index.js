import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import 'semantic-ui-css/semantic.min.css'; // Added for UI components
import "./App.css";

import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

ReactDOM.render(
    <AuthProvider>
        <Router>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </Router>
    </AuthProvider>,
    document.getElementById("root")
);
