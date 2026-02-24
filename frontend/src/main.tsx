import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from "next-themes"
import './index.css'
import App from './App.tsx'
import { SettingsProvider } from './context/SettingsContext'
import { DatasetProvider } from './context/DatasetContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SettingsProvider>
        <DatasetProvider>
          <App />
        </DatasetProvider>
      </SettingsProvider>
    </ThemeProvider>
  </StrictMode>,
)