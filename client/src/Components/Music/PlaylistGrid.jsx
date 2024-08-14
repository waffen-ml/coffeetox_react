import Cover from "./Cover"
import { nItemsLabel } from "../../utils"


function PlaylistTile({playlist}) {


    return (
        <a href={`/listen_pllt/` + playlist.id} className="rounded-lg overflow-hidden w-full relative text-black">
            
            <Cover isPlaylist={true} coverFile={playlist.cover_file}/>

            <div className="absolute bg-gray-300/50 w-full bottom-0 left-0 flex flex-col gap-0 px-1 py-0.5">
                <span className="truncate font-bold">{playlist.name}</span>
                <span className="truncate text-sm">
                    {playlist.soundtracks.length == 0? 'Нет треков' :
                    nItemsLabel(playlist.soundtracks.length, 'трек', 'трека', 'треков')}
                    {' • @' + playlist.creator.tag}
                </span>
            </div>

        </a>
    )

}


export default function PlaylistGrid({playlists}) {

    return (
        <div className="grid gap-1" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))'}}>
            {playlists.map((pllt, i) => (
                <PlaylistTile playlist={pllt} key={i}/>
            ))}
        </div>
    )

}