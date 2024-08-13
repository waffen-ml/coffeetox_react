import { useState, useReducer, useEffect, useRef } from "react";
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { Button, Link, IconButton, Dialog, DialogContent, DialogTitle, DialogActions } from "@mui/material";
import { humanFileSize, loadVideoMetadata, loadImage, cropImage, cropImageSrc, dataURLtoFile } from "../utils";
import { PSWP_obj } from "./Pswp";
import PhotoSwipeVideoPlugin from '../photoswipe-video-plugin.esm.js';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DialogImageEditor from "./DialogImageEditor.jsx";
import { useFormContext } from "react-hook-form"
import {InputWrapper} from "./Input.jsx"
import {CfxBox} from './CfxBaseComponents.jsx'


function getPrimitiveType(file) {
    const w = file.type.split('/')[0]

    if (['video', 'image', 'audio'].includes(w))
        return w

    return 'other'
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
    })
}

async function prepareFile(f) {
    const base64 = await fileToBase64(f)
    let obj = {
        current: f,
        original: f,
        primitiveType: getPrimitiveType(f),
        originalBase64: base64,
        currentBase64: base64
    }

    if (obj.primitiveType == 'image') {
        const img = await loadImage(base64)
        obj = {
            ...obj,
            originalWidth: img.width,
            originalHeight: img.height,
            currentWidth: img.width,
            currentHeight: img.height
        }
    }

    if (obj.primitiveType == 'video') {
        const video = await loadVideoMetadata(base64)
        obj = {
            ...obj,
            currentWidth: video.videoWidth, 
            currentHeight: video.videoHeight
        }
    }

    return obj
}

function DialogAudioPlayer({audio, onClose}) {
    const [open, setOpen] = useState(false)

    useEffect(() => {

        setOpen(audio !== null)

    }, [audio])

    return (
        <Dialog open={open} onClose={onClose}>
            {audio !== null && (
                <>
                    <DialogTitle>
                        {audio.original.name}
                    </DialogTitle>
                    <DialogContent>
                        <audio controls autoPlay>
                            <source src={audio.originalBase64}/>
                        </audio>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onClose}>Закрыть</Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    )
}


function FileBar({ file, playAudio, deleteFile, editImage}) {

    const f = file

    return (
        <div className="grid w-full grid-cols-[auto_1fr_auto] grid-rows-[1fr_1fr] h-[50px] gap-y-0 gap-x-2 rounded-lg p-1">

            <div className="row-span-2 w-[50px] h-full overflow-hidden flex items-center justify-center bg-gray-300 rounded-lg">
                {f.primitiveType == 'image' && (
                    <PSWP_obj src={f.currentBase64} width={f.currentWidth} height={f.currentHeight} isVideo={false} isCropped={true} innersx={{'objectFit': 'cover'}}/>
                )}
                {f.primitiveType == 'video' && (
                    <PSWP_obj src={f.currentBase64} width={f.currentWidth} height={f.currentHeight} isVideo={true} isCropped={true} innersx={{'objectFit': 'cover'}}/>
                )}
                {f.primitiveType == 'audio' && (
                    <AudioFileIcon
                        className="cursor-pointer" 
                        sx={{width: 35, height: 35, color: 'gray'}}
                        onClick={playAudio}
                    />
                )}
                {f.primitiveType == 'other' && (
                    <InsertDriveFileIcon sx={{width: 35, height: 35, color: 'gray'}}/>
                )}
            </div>

            <Link 
                className="truncate cursor-pointer select-none self-end" 
                component="span"
                target='_blank'
                sx={{marginBottom:'-3px'}}
            >{f.current.name}</Link>

            <ul className="row-span-2 self-center">
                {f.primitiveType == 'image' && <IconButton onClick={editImage}><EditIcon/></IconButton>}
                <IconButton onClick={deleteFile}><DeleteIcon/></IconButton>
            </ul>

            <span >{humanFileSize(f.current.size, true)}</span>

        </div>
    )
}


export default function MyFileUploader({maxFiles, maxSizeBytes, onChange, width, name, required, label, validation}) {

    const {register, setValue} = useFormContext()

    useEffect(() => {
        register(name, {
            validate: {
                'file_limit_exceeded': (val) => !maxFiles || val.length <= maxFiles || `Слишком много файлов`,
                'no_files': (val) => !required || val.length > 0 || 'Нужен хотя бы один файл',
                'memory_limit_exceeded': (val) => {
                    let s = 0
                    val.forEach(v => s += v.size)
                    return !maxSizeBytes || s <= maxSizeBytes || `Превышен лимит памяти`
                },
                ...validation
            }
        })
        setValue(name, [])
    }, [])

    const [files, dispatchFiles] = useReducer((files, action) => {

        switch(action.type) {
            case 'APPEND':
                files = [...files, ...action.newFiles]
                break
            case 'DELETE':
                files = [...files.slice(0, action.index), ...files.slice(action.index + 1)]
                break
            case 'MODIFY':
                files = [
                    ...files.slice(0, action.index),
                    {
                        ...files[action.index],
                        ...action.mod
                    },
                    ...files.slice(action.index + 1)
                ]
                break
        }

        const rawFiles = files.map(f => f.current)

        if(onChange)
            onChange(rawFiles)
        
        setValue(name, rawFiles)

        return files
    }, [])

    const [playedAudio, setPlayedAudio] = useState(null)
    const [editedIdx, setEditedIdx] = useState(null)
    const [draggedOver, setDraggedOver] = useState(false)

    const isObserving = () => editedIdx !== null || playedAudio !== null

    const addRawFiles = (rawFiles) => {
        rawFiles.forEach(raw => {
            prepareFile(raw)
            .then(f => {
                dispatchFiles({type: 'APPEND', newFiles: [f]})
            })
        })
    }

    const browseFiles = () => {
        const inp = document.createElement('input')
        inp.type = 'file'
        inp.multiple = true
        inp.addEventListener('change', () => {
            addRawFiles([...inp.files])
        })
        inp.click()
    }

    const playAudio = (idx) => {
        if(!isObserving() && files[idx].primitiveType == 'audio')
            setPlayedAudio(files[idx])
    }

    const editImage = (idx) => {
        if(!isObserving() && files[idx].primitiveType == 'image')
            setEditedIdx(idx)
    }

    const deleteFile = (idx) => {
        if(!isObserving() && idx >= 0 && idx < files.length)
            dispatchFiles({type: 'DELETE', index: idx})
    }

    const onDragOver = (e) => {
        e.stopPropagation()
        e.preventDefault()
        setDraggedOver(true)
    }

    const onDragLeave = (e) => {
        e.stopPropagation()
        e.preventDefault()
        setDraggedOver(false)
    }

    const onDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDraggedOver(false)
        addRawFiles([...e.dataTransfer.files])
    }

    useEffect(() => {
        const lightbox = new PhotoSwipeLightbox({
            gallery: '#uploader_gallery',
            children: 'a',
            pswpModule: () => import('photoswipe'),

            padding: {
                top: 50,
                bottom: 50,
                left: 0,
                right: 0
            },
              
            allowPanToNext: false,
            allowMouseDrag: true,
            wheelToZoom: true,
            zoom: false
        })

        const videoPlugin = new PhotoSwipeVideoPlugin(lightbox, {});
    
        lightbox.init()
        
        return () => {
            lightbox.destroy()
        }
    }, [files])

    let totalSizeBytes = 0

    files.forEach(f => {
        totalSizeBytes += f.current.size
    })

    return (
        <InputWrapper label={label} name={name}>
        <CfxBox
            className="flex flex-col relative gap-2 items-start w-full min-w-[250px] max-w-full h-full min-h-[100px] overflow-y-auto"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            style={{width: width? `${width}px` : ''}}
        >

            {draggedOver && (
                <div className="flex flex-col items-center justify-center gap-1 absolute top-0 left-0 w-full h-full rounded-lg bg-gray-100 pointer-events-none z-50 border-dashed border-gray-400 border-4">
                    <span>Перетащите файлы сюда</span>
                    <span>и отпустите</span>
                </div>
            )}

            <div className="flex gap-2">
                {maxFiles && files.length > maxFiles && (
                    <span>
                        Количество: <span className="text-red-500">{files.length} </span>
                        / {maxFiles}
                    </span>
                )}
                {maxSizeBytes && totalSizeBytes > maxSizeBytes && (
                    <span>
                        Общий размер: <span className="text-red-500">{humanFileSize(totalSizeBytes, true)} </span>/ {humanFileSize(maxSizeBytes, true)}
                    </span>
                )}
            </div>

            {files.length == 0 && (
                <span>Нет файлов.</span>
            )}

            {files.length > 0 && (
                <ul id="uploader_gallery" className="flex flex-col gap-0 w-full [&>*:nth-child(odd)]:bg-white/30">
                    
                    {files.length > 0 && files.map((f, i) => (
                        <FileBar
                            file={f}
                            key={i}
                            playAudio={() => playAudio(i)}
                            deleteFile={() => deleteFile(i)}
                            editImage={() => editImage(i)}
                        />
                    ))}
                </ul>
            )}

            <Button onClick={browseFiles} startIcon={<NoteAddIcon/>}>Добавить</Button>
        
            <DialogAudioPlayer 
                audio={playedAudio}
                onClose={() => setPlayedAudio(null)}
            />

            <DialogImageEditor
                imageSrc={editedIdx !== null? files[editedIdx].originalBase64 : null}
                initialCrop={editedIdx !== null? files[editedIdx].crop : null}
                initialRotations={editedIdx !== null? files[editedIdx].rotations : null}
                onClose={() => setEditedIdx(null)}
                onSubmit={(result) => {
                    dispatchFiles({
                        type: 'MODIFY',
                        index: editedIdx,
                        mod: {
                            crop: result.crop,
                            rotations: result.rotations,
                            currentBase64: result.src,
                            current: dataURLtoFile(result.src, files[editedIdx].original.name),
                            currentWidth: result.cropPX.width,
                            currentHeight: result.cropPX.height
                        }
                    })
                    setEditedIdx(null)
                }}
                minWidth={50}
                minHeight={50}
            />
        </CfxBox>  
        </InputWrapper>
    )


    



}