import { useState } from 'react'
import NavBar from '../src/components/NavBar.tsx'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <NavBar/> 
    </>
  )
}

export default App
