import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Metronome from './Metronome.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Metronome />
  </StrictMode>
)
