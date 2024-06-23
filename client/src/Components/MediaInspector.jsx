import {useState, useEffect} from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Modal from '@mui/material/Modal'
import { fileURL } from '../utils'
import lArrow from '../assets/larrow.png'
import rArrow from '../assets/rarrow.png'

export default function MediaInspector({ files, at }) {
    const [open, setOpen] = useState(false)
    const [currentIndex, setIndex] = useState(0)
    const numFiles = files.length
    const currentFile = files[currentIndex]

    useEffect(() => {
        setOpen(true)
        setIndex(at ?? 0)
    }, [files, at])

    return (
        <Modal open={open} onClose={() => setOpen(false)}>
            <Box className="max-w-full max-h-full flex flex-row gap-10 outline-none fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                
                {numFiles > 1 && <Button style={{backgroundImage:`url(${lArrow})`}} className="bg-no-repeat bg-center bg-contain" onClick={() => setIndex((numFiles + currentIndex - 1) % numFiles)}></Button>}

                <div className="w-[800px] h-[600px] flex justify-center items-center">
                    {currentFile.primitive_type == 'image' && <img className="h-full object-contain select-none" src={fileURL(currentFile.id)}/>}
                    {currentFile.primitive_type == 'video' && <video autoPlay className="outline-none max-h-full max-w-full" controls src={fileURL(currentFile.id)} type={currentFile.content_type}></video>}
                </div>

                {numFiles > 1 && <Button style={{backgroundImage:`url(${rArrow})`}} className="bg-no-repeat bg-center bg-contain" onClick={() => setIndex((numFiles + currentIndex + 1) % numFiles)}></Button>}
            
            </Box>
        </Modal>
    )
}