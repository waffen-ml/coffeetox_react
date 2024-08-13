import { QuickBreadcrumbsButton } from "../CfxBaseComponents"
import { cfxContext, copyText, downloadFile, formatDuration, hostURL} from "../../utils"
import { useContext, useState } from "react"
import PlaylistDependencyDialog from "./PlaylistDependencyDialog"
import Cover from "./Cover"

function prepareActions(actions, soundtrackId) {
    return (actions ?? []).map(a => {
        return {
            ...a,
            action: () => a.action(soundtrackId)
        }
    })
}

export default function Soundtrack({soundtrack, onClick, actions, unavailableActions, isPlayed, disableActions}) {
    const {currentUser} = useContext(cfxContext)
    const [plltDepOpen, setPlltDepOpen] = useState(false)

    const defaultAvailableActions = [
        {label: 'Скопировать ссылку', action: () => {
            copyText(hostURL('/listen_st/' + soundtrack.id))
        }},
        {label: 'Скачать', action: () => {
            downloadFile(soundtrack.music_file.id, soundtrack.name + '.mp3')
        }},
        {label: 'Подробнее...', action: () => {
            location.replace('/listen_st/' + soundtrack.id)
        }}
    ]

    if (currentUser && currentUser.id != -1) {
        defaultAvailableActions.push(
            {label: 'Мои плейлисты...', action: () => setPlltDepOpen(true)}
        )
    }

    const defaultUnavailableActions = []
    const isAvailable = !soundtrack.is_deleted && !soundtrack.no_access
    const currentActions = [
        ...(prepareActions(isAvailable? actions: unavailableActions, soundtrack.id)),
        ...(isAvailable? defaultAvailableActions : defaultUnavailableActions)
    ]
    const duration = !isAvailable? null : (soundtrack.music_file.specifics ?? {}).duration ?? null

    return (
        <div 
            className={"flex items-center gap-2 w-full rounded-lg hover:bg-cfx-box  " + (isPlayed? "bg-cfx-box" : "")}
        >
            <div 
                className="w-full grid grid-rows-[auto_1fr] grid-cols-[auto_1fr] gap-x-2 gap-y-0 cursor-pointer"
                onClick={() => onClick(soundtrack.id)}
            >
                <div className="row-span-2 w-[60px] overflow-hidden rounded-lg">
                    <Cover isPlaylist={false} coverFile={isAvailable? soundtrack.cover_file : null}/>
                </div>

                <span className="truncate text-lg self-center mt-1 select-none">
                    {soundtrack.is_deleted && <>Трек удален.</>}
                    {soundtrack.no_access && <>Нет доступа.</>}
                    {isAvailable && <>{soundtrack.name}</>}
                </span>

                <span className="truncate opacity-80 select-none mt-[-3px]">
                    {!isAvailable || duration === null? '' : formatDuration(duration) + " • "}
                    {!isAvailable? '' : soundtrack.author_name? soundtrack.author_name : '@' + soundtrack.uploaded_by.tag}
                </span>

            </div>

            {!disableActions && currentActions.length > 0 && (
                <QuickBreadcrumbsButton options={currentActions} vertical={true}/>
            )}

            <PlaylistDependencyDialog
                soundtrackId={plltDepOpen? soundtrack.id : null}
                onClose={() => setPlltDepOpen(false)}
            />
        </div>
    )

}