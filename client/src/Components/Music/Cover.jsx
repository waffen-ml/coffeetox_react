import MusicNoteIcon from '@mui/icons-material/MusicNote';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import { fileURL } from "../../utils";

export default function Cover({coverFile, isPlaylist}) {

    return (
        <div className="w-full aspect-square overflow-hidden bg-cfx-box flex items-center justify-center row-span-2">
            {coverFile && <img className="w-full h-full object-cover" src={fileURL(coverFile.id)}/>}
            {!coverFile && (
                <div className="bg-cfx-box rounded-full p-3">
                    {!isPlaylist && <MusicNoteIcon sx={{opacity:0.5}} fontSize="large"/>}
                    {isPlaylist && <LibraryMusicIcon sx={{opacity:0.5}} fontSize="large"/>}
                </div>
            )}
        </div>
    )

}