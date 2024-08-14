import { useContext, useEffect, useState } from "react";
import Page from "../../Components/Page";
import { cfxContext, quickFetch } from "../../utils";
import PlaylistGrid from "../../Components/Music/PlaylistGrid";
import { SoundtrackItem } from "../../Components/Music/SoundtrackComponents";
import { Link } from "@mui/material";

export default function Music() {
    const [myPlaylists, setMyPlaylists] = useState(null)
    const [mySoundtracks, setMySoundtracks] = useState(null)
    const {currentUser} = useContext(cfxContext)

    useEffect(() => {
        if(!currentUser)
            return
        else if (currentUser.id < 0) {
            location.replace('/')
            return
        }

        quickFetch('/get_my_playlists')
        .then(r => {
            setMyPlaylists([...r.created, ...r.added])
        })
        .catch(() => alert('Не удалось загрузить Ваши плейлисты!'))

        quickFetch('/get_my_soundtracks')
        .then(r => {
            setMySoundtracks(r)
        })
        .catch(() => alert('Не удалось загрузить Ваши треки!'))

    }, [currentUser])
    
    return (
        <Page title="Музыка">
            
            <ul className="mb-3">
                <li><Link href="/new_st">Добавить трек</Link></li>
                <li><Link href="/new_pllt">Добавить плейлист</Link></li>
            </ul>


            {myPlaylists && <PlaylistGrid playlists={myPlaylists}/>}

            {mySoundtracks && (
                <ul className="mt-5">
                    {mySoundtracks.map((s, i) => (
                        <li key={i} className="mt-1">
                            <SoundtrackItem 
                                soundtrack={s}
                                onClick={() => location.replace('/listen_st/' + s.id)}
                            />
                        </li>
                    ))} 
                </ul>
            )}
            
        </Page>
    )
}