import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import AuthProvider from "./state/AuthProvider"
import GameProvider from "./state/GameProvider"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GameProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </GameProvider>
  </React.StrictMode>,
)
