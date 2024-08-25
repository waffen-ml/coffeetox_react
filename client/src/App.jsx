import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import NewPost from './Pages/NewPost'
import PostView from './Pages/PostView'
import SiteSettings from './Pages/SiteSettings'
import Home from './Pages/Home'
import CFXStandsWithUA from './Pages/CFXStandsWithUA'
import Register from './Pages/Register'
import ConfirmEmail from './Pages/ConfirmEmail'
import Capytaire from './Pages/Capytaire'
import Login from './Pages/Login'
import User from './Pages/User'
import ListenST from './Pages/Music/ListenST'
import NewSoundtrack from './Pages/Music/NewSoundtrack'
import NewPlaylist from './Pages/Music/NewPlaylist'
import ListenPlaylist from './Pages/Music/ListenPlaylist'
import Music from './Pages/Music/Music'
import Ebank from './Pages/Ebank'

import Subscriptions from './Pages/Subscriptions'
import ResetPassword from './Pages/ResetPassword'
import ResetPasswordResult from './Pages/ResetPasswordResult'
import ChangePassword from './Pages/ChangePassword'
import AccountSettings from './Pages/AccountSettings'
import { cfxContext, hostURL, fileURL } from './utils'
import { useEffect, useState, useRef} from 'react'
import SetAvatar from './Pages/SetAvatar'
import FormattedTextTest from './Pages/FormattedTextTest'
import MyFileUploaderTest from './Pages/MyFileUploaderTest'
import { AvatarTagWidget } from './Components/UserWidgets'
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { Avatar, Link, Button, IconButton, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Box} from '@mui/material'
import {ThemeProvider, createTheme} from '@mui/material/styles'


const DARK_THEME = createTheme({
    palette: {
        mode: 'dark'
    }
})

const LIGHT_THEME = createTheme({
    palette: {
        mode: 'light'
    }
})

function getCurrentTheme() {
    let theme = localStorage.getItem('theme') ?? 'LIGHT'
        
    if (theme == 'DEVICE')
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches? 'DARK' : 'LIGHT'

    return theme
}

export default function App() {
    const [appTheme, setAppTheme] = useState(getCurrentTheme())
    const [currentUser, setCurrentUser] = useState(null)
    const [sideMenuOpen, toggleSideMenu] = useState(false)
    const mainContentRef = useRef(null)

    const updateUserData = () => {
        return fetch(hostURL('/who_am_i'), {credentials:'include'})
        .then(r => r.json())
        .then(r => {
            if (!r.success)
                throw Error()
            setCurrentUser(r.you)
        })
        .catch(() => setCurrentUser({ id: -1 }))
    }

    const updateTheme = () => {
        setAppTheme(getCurrentTheme())
    }

    const logout = () => {
        return fetch(hostURL('/logout'), {credentials: 'include'})
        .then(r => r.json())
        .then(r => {
            if(!r.success)
                throw Error()
            location.reload()
        })
        .catch(() => {
            alert('Не удалось выйти из аккаунта.')
        })
    }

    useEffect(() => {
        updateUserData()
    }, [])


    if(appTheme == 'DARK')
        document.documentElement.classList.add('dark')
    else
        document.documentElement.classList.remove('dark')

    return (
        <ThemeProvider theme={appTheme == 'DARK'? DARK_THEME : LIGHT_THEME}>
        <cfxContext.Provider value={{ currentUser, updateUserData, mainContentRef, updateTheme }}>

            <div className="absolute top-0 left-0 w-full h-[55px] shadow-sm z-[-1] bg-cfx-box"></div>

            <div className="w-[768px] max-w-full box-border mx-auto grid grid-cols-[auto_1fr] grid-rows-[auto_1fr] gap-y-3 gap-x-8 h-dvh">
                
                <div className="w-full h-[55px] px-2 md:px-0 col-span-2 flex items-center gap-5 justify-between overflow-hidden">
                    <a href="/" className="text-2xl whitespace-nowrap">
                        ☕tox
                    </a>

                    {/* Mobile version */}
                    <div className="md:hidden">
                        <IconButton onClick={() => toggleSideMenu(true)}><MenuIcon/></IconButton>
                    </div>

                    {/* Desktop version */}
                    <div className="hidden md:block">
                        <div className="flex gap-2 items-center">
                            {currentUser && currentUser.id > 0 && (
                                <>
                                    <AvatarTagWidget user={currentUser} reverse={true} />
                                    <IconButton onClick={logout}><LogoutIcon/></IconButton>
                                </>
                            )}
                            {currentUser && currentUser.id < 0 && (
                                <Button href="/login">Войти</Button>
                            )}
                        </div>
                    </div>

                </div>

                <div className="hidden md:block">
                    <ul className="">
                        <li><Link href="/">Новости</Link></li>
                        <li><Link href="/?subscribed_only=1">Подписки</Link></li>
                        <li><Link href="/new_post">Создать пост</Link></li>
                        <li><Link href="/music">Музыка</Link></li>
                        <li><Link href="/ebank">Ебанк</Link></li>
                        <li><Link href="/settings">Настройки</Link></li>
                        <li><Link href="/capytaire">Каписьянс</Link></li>
                    </ul>
                </div>

                <div ref={mainContentRef} className="w-full h-full px-2 md:p-0 md:pr-1 overflow-y-auto overflow-x-hidden col-span-2 md:col-span-1">

                    <Router>
                        <Routes>
                            <Route path="/user/:tag" element={<User/>} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/confirm_email/:confKey" element={<ConfirmEmail />} />
                            <Route path="/settings" element={<SiteSettings/>}/>
                            <Route exact path="/new_post" element={<NewPost />} />
                            <Route path="/post/:id" element={<PostView />} />
                            <Route exact path="/" element={<Home />} />
                            <Route path="/ua" element={<CFXStandsWithUA />} />
                            <Route path="/capytaire" element={<Capytaire nSuits={4} />} />
                            <Route path="/set_avatar" element={<SetAvatar />} />
                            <Route path="/change_password" element={<ChangePassword/>} />
                            <Route path="/account_settings" element={<AccountSettings/>} />
                            <Route path="/ft_test" element={<FormattedTextTest/>} />
                            <Route path="/fupl_test" element={<MyFileUploaderTest/>} />
                            <Route path="/reset_password_start" element={<ResetPassword/>}/>
                            <Route path="/reset_password_result" element={<ResetPasswordResult/>}/>
                            <Route path="/subscriptions" element={<Subscriptions/>}/>
                            <Route path="/ebank" element={<Ebank/>}/>
                            <Route path="/new_st" element={<NewSoundtrack/>}/>
                            <Route path="/listen_st/:id" element={<ListenST/>}/>
                            <Route path="/new_pllt" element={<NewPlaylist/>}/>
                            <Route path="/listen_pllt/:id" element={<ListenPlaylist/>}/>
                            <Route path="/music" element={<Music/>}/>

                        </Routes>
                    </Router>
                </div>

            </div>

            <Drawer
                open={sideMenuOpen}
                onClose={() => toggleSideMenu(false)}
                anchor="right"
            >   
                <div className="min-w-[200px]">
                    {currentUser && currentUser.id > 0 && (
                        <>
                            <div className="p-2">
                                <AvatarTagWidget user={currentUser}/>
                            </div>
                            <Divider/>
                        </>
                    )}
    
                    <List>
                        {currentUser && currentUser.id < 0 && (
                        <ListItem>
                            <ListItemButton href="/login">
                                <ListItemText>
                                    Войти
                                </ListItemText>
                            </ListItemButton>
                        </ListItem>     
                        )}

                        <ListItem>
                            <ListItemButton href="/">
                                <ListItemText>
                                    Новости
                                </ListItemText>
                            </ListItemButton>
                        </ListItem>

                        <ListItem>
                            <ListItemButton href="/?subscribed_only=1">
                                <ListItemText>
                                    Подписки
                                </ListItemText>
                            </ListItemButton>
                        </ListItem>

                        <ListItem>
                            <ListItemButton href="/new_post">
                                <ListItemText>
                                    Создать пост
                                </ListItemText>
                            </ListItemButton>
                        </ListItem>

                        <ListItem>
                            <ListItemButton href="/music">
                                <ListItemText>
                                    Музыка
                                </ListItemText>
                            </ListItemButton>
                        </ListItem>
                        
                        <ListItem>
                            <ListItemButton href="/settings">
                                <ListItemText>
                                    Настройки
                                </ListItemText>
                            </ListItemButton>
                        </ListItem>

                        {currentUser && currentUser.id > 0 && (
                            <ListItem>
                                <ListItemButton onClick={logout}>
                                    <ListItemText>
                                        Выйти
                                    </ListItemText>
                                </ListItemButton>
                            </ListItem>
                        )}
                    </List>
                </div>

            </Drawer>

        </cfxContext.Provider>
        </ThemeProvider>
    )

}