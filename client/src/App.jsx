import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import NewPost from './Pages/NewPost'
import PostView from './Pages/PostView'
import MediaInspector from './Components/MediaInspector'
import Home from './Pages/Home'
import CFXStandsWithUA from './Pages/CFXStandsWithUA'
import Register from './Pages/Register'
import ConfirmEmail from './Pages/ConfirmEmail'
import Capytaire from './Pages/Capytaire'
import { cfxContext } from './utils'
import { useState } from 'react'


export default function App() {
  const [inspectedMedia, inspectMedia] = useState(null)

  return (
    <cfxContext.Provider value={{inspectMedia}}>
      <div className="bg-gray-200 w-full h-[55px] shadow-sm">
        <div className="w-[700px] max-w-full h-full mx-auto flex justify-between items-center">
          <a href="/" className="text-2xl">
            🏳️‍🌈tox
          </a>
          <ul className="flex gap-3 text-base">
            <li><a href="/ua">CoffeeTox stands with 🇺🇦</a></li>
            <li><a href="/">Новости</a></li>
            <li><a href="/new_post">Создать пост</a></li>
          </ul>
        </div>
      </div>
      <div className="w-[700px] max-w-full mx-auto mt-3">
        <Router>
          <Routes>
            <Route path="/register" element={<Register/>}/>
            <Route path="/confirm_email/:confKey" element={<ConfirmEmail/>}/>
            <Route exact path="/new_post"  element={<NewPost/>}/>
            <Route path="/post/:id" element={<PostView/>} />
            <Route exact path="/" element={<Home/>} />
            <Route path="/ua" element={<CFXStandsWithUA/>} />
            <Route path="/capytaire" element={<Capytaire nSuits={4} />} />
          </Routes>
        </Router>
      </div>

      {inspectedMedia && <MediaInspector files={inspectedMedia.files} at={inspectedMedia.at}/>}
    </cfxContext.Provider>
  )

}