import { useState, useEffect, useRef} from "react"
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material"
import PlaylistDependencyChecklist from './PlaylistDependencyChecklist'
import Form from '../Form'
import { hostURL, quickFetch } from "../../utils"

export default function PlaylistDependencyDialog({soundtrackId, onClose}) {
    const [open, setOpen] = useState(false)
    const [data, setData] = useState(null)
    const methodsRef = useRef()

    useEffect(() => {
        if(!soundtrackId) {
            handleClose()
            return
        }

        setData({loading: true})
        
        quickFetch('/route_get_pllts_dependency_table/' + soundtrackId)
        .then(r => {
            if(!r.success)
                throw Error()
            
            setOpen(true)
            setData({
                table: r.table
            })
        })
        .catch(() => {
            setData({error: true})
        })

    }, [soundtrackId])


    const handleSubmit = (formData) => {
        const result = {}

        formData.add_to_playlists.forEach((state, i) => {
            result[data.table[i].id.toString()] = state
        })

        fetch(hostURL('/submit_pllts_dependency_table/' + soundtrackId), {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({
                table: result
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(r => r.json())
        .then(r => {
            if(!r.success)
                throw Error()
            handleClose()
            return 'Успех!'
        })
        .catch(() => {
            return 'Не удалось обновить данные!'
        })
    }

    const handleClose = () => {
        if(onClose)
            onClose()
        setOpen(false)
        setData(null)
    }
    
    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogContent>

                {data && data.table && (
                    <Form 
                        disableSubmitButton={true}
                        onSubmit={handleSubmit} 
                        methodsRef={methodsRef}
                        values={{
                            'add_to_playlists': data.table.map(r => r.is_dependent)
                        }}
                    >

                        <div className="max-h-[400px] overflow-y-auto">
                            <PlaylistDependencyChecklist 
                                playlistNames={
                                    data.table.map(r => r.name)
                                }
                            />
                        </div>
                    </Form>
                )}

                {data && data.loading && <span>Загрузка плейлистов...</span>}
                {data && data.error && <span>Не удалось загрузить плейлисты.</span>}
            
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Отмена</Button>
                <Button onClick={() => methodsRef.current.handledSubmit()}>Сохранить</Button>
            </DialogActions>

        </Dialog>
    )

}