import { FileUploader } from "react-drag-drop-files"
import { useContext, useState } from "react"
import Cropper from 'react-easy-crop'
import Button from '@mui/material/Button'
import { Avatar } from "@mui/material"
import { blobToBase64, cropImageSrc, hostURL, dataURLtoFile, cfxContext } from "../utils"


export default function SetAvatar() {
    const [imageSrc, setImageSrc] = useState(null)
    const [croppedImageSrc, setCroppedImageSrc] = useState(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [status, setStatus] = useState(null)
    const { updateUserData } = useContext(cfxContext)

    const handleImage = (im) => {
        blobToBase64(im).then(r => setImageSrc(r))
    }

    if (!imageSrc) {
        return (
            <>
                <h1 className="mb-3 text-2xl" >Загрузите изображение</h1>
                <FileUploader
                    handleChange={handleImage}
                    types={['JPG']}
                    maxSize={10}
                    label="Нажмите для обзора или перетащите файл сюда"
                    hoverTitle=" "
                    onSizeError={() => alert('Файл слишком тяжелый!')}
                />
            </>
        )
    }

    const onCropComplete = (_, ca) => {
        cropImageSrc(imageSrc, ca.x, ca.y, ca.width, ca.height)
        .then(r => {
            setCroppedImageSrc(r)
        })
    }

    const submitCroppedImage = () => {
        if (!croppedImageSrc)
            return

        const file = dataURLtoFile(croppedImageSrc, 'avatar.jpg')
        const fd = new FormData()
        fd.append('avatar', file)

        fetch(hostURL('set_avatar'), {
            method: 'POST', 
            credentials: 'include',
            body: fd
        })
        .then(r => r.json())
        .then(r => {
            if (!r.success)
                throw Error()
            setStatus('Успешно!')
            updateUserData()
        })
        .catch(() => {
            setStatus('Не удалось обновить аватар...')
        })
    }

    return (
        <>
            <h1 className="mb-3 text-2xl">Обрежьте аватар</h1>
            <div className="relative w-full h-[400px]">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                    maxZoom={5}
                    zoomSpeed={0.5}
                />
            </div>
            <div className="mt-3">
                <Button 
                    onClick={submitCroppedImage}
                    startIcon={croppedImageSrc && <Avatar src={croppedImageSrc}/>}
                    variant="contained">
                    Сохранить
                </Button>
            </div>
            {status && <span className="block mt-2">{status}</span>}
        </>
    )




}