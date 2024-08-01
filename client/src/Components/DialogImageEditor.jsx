import {useState, useRef, useReducer, useEffect} from 'react'
import { Button, Link, IconButton, Dialog, DialogContent, DialogTitle, DialogActions } from "@mui/material";
import { humanFileSize, loadVideoMetadata, loadImage, cropImage, cropImageSrc, dataURLtoFile } from "../utils";
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'



function rotateImage(img, delta) {
    const dir = delta > 0? 1 : -1
    const num90 = Math.abs(delta % 4)

    const canvas = document.createElement('canvas')
    
    canvas.width = num90 % 2 == 0? img.naturalWidth : img.naturalHeight
    canvas.height = num90 % 2 == 0? img.naturalHeight : img.naturalWidth

    const ctx = canvas.getContext('2d')

    const halfW = Math.floor(canvas.width / 2)
    const halfH = Math.floor(canvas.height / 2)

    ctx.translate(halfW, halfH)
    ctx.rotate(dir * num90 * Math.PI / 2)

    if(num90 % 2 == 1)
        ctx.drawImage(img, -halfH, -halfW)
    else
        ctx.drawImage(img, -halfW, -halfH)

    return canvas.toDataURL()
}

function rotateCrop(crop, delta) {

    const rotateOneTime = (crop, dir) => {
        return {
            unit: '%',
            x: dir == -1? crop.y : 100 - (crop.y + crop.height),
            y: dir == -1? 100 - (crop.x + crop.width) :crop.x,
            width: crop.height,
            height: crop.width
        }
    }

    delta = delta % 4

    for(let i = 0; i < Math.abs(delta); i++)
        crop = rotateOneTime(crop, delta > 0? 1 : -1)

    return crop

}

export default function DialogImageEditor({imageSrc, onClose, onSubmit,
    minWidth, minHeight, initialCrop, initialRotations}) {
    
    const [editedImageSrc, setEditedImageSrc] = useState(null)
    const editedImageRef = useRef(null)
    const [open, setOpen] = useState(false)
    const [crop, setCrop] = useState(null)
    const [rotations, setRotations] = useState(0)

    useEffect(() => {

        if(!imageSrc)
            return

        setRotations(initialRotations ?? 0)

        let crop = initialCrop ?? {
            unit: '%',
            x: 25,
            y: 25,
            width: 50,
            height: 50
        }
        
        setCrop(crop)

        if (initialRotations) {
            loadImage(imageSrc)
            .then(img => {
                setEditedImageSrc(rotateImage(img, initialRotations))
                setOpen(true)
            })
        } else {
            setEditedImageSrc(imageSrc)
            setOpen(true)
        }
    }, [imageSrc, initialCrop, initialRotations])

    const handleClose = () => {
        if (onClose)
            onClose()
        setOpen(false)
    }

    const handleSubmit = () => {
        const img = editedImageRef.current
        const cropPX = {
            x: Math.floor(img.naturalWidth * crop.x / 100),
            y: Math.floor(img.naturalHeight * crop.y / 100),
            width: Math.floor(img.naturalWidth * crop.width / 100),
            height: Math.floor(img.naturalHeight * crop.height / 100)
        }

        const finalSrc = cropImage(img, cropPX.x, cropPX.y, cropPX.width, cropPX.height)

        const result = {
            src: finalSrc,
            rotations,
            crop,
            cropPX
        }

        setOpen(false)

        if(onSubmit)
            onSubmit(result)
    }

    const handleRotation = (dir) => {
        const rotatedSrc = rotateImage(editedImageRef.current, dir)
        const rotatedCrop = rotateCrop(crop, dir)

        setEditedImageSrc(rotatedSrc)
        setCrop(rotatedCrop)
        setRotations(rotations + dir)
    }

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogContent>
                <ReactCrop
                    crop={crop} 
                    onChange={(_, c) => {
                        setCrop(c)
                    }}
                    onComplete={(c) => {}}
                    minWidth={minWidth}
                    minHeight={minHeight}
                    className="max-h-[550px]"
                >
                    <img
                        ref={editedImageRef}
                        src={editedImageSrc}
                    />
                </ReactCrop>

            </DialogContent>
            <DialogActions>
                <IconButton onClick={() => handleRotation(-1)}><RotateLeftIcon/></IconButton>
                <IconButton onClick={() => handleRotation(1)}><RotateRightIcon/></IconButton>
                <Button onClick={handleClose}>Отмена</Button>
                <Button onClick={handleSubmit}>Применить</Button>
            </DialogActions>
        </Dialog>
    )
}
