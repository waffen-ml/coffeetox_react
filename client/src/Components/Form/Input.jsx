import { useFormContext, Controller, useController } from "react-hook-form"
import { useState, useRef, useEffect } from 'react'
import {Link, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Checkbox, Radio, FormControlLabel, RadioGroup, Select, MenuItem} from '@mui/material'
import FormattedText from "../FormattedText"
import Cropper from 'react-easy-crop'
import { findInputError, isFormInvalid, blobToBase64, cropImageSrc, dataURLtoFile, trimMultilineText, humanFileSize, quickFetch, combineValidations} from "../../utils"
import {CfxBox} from '../CfxBaseComponents'


export const CheckboxInput = ({name, label}) => {
    const { control } = useFormContext()
    const {field} = useController({
        name, control,
        defaultValue: false
    })

    return (
        <FormControlLabel
            control={
                <Checkbox
                    {...field}
                    checked={field.value}
                />
            }
            label={label}
        />
    )
}

export const SelectInput = ({name, label, options, emptyLabel, disableEmpty, onChange, validation}) => {
    const { control } = useFormContext()
    const {field} = useController({
        name, control,
        defaultValue: '',
        onChange,
        rules: validation
    })

    return (
        <InputWrapper 
            name={name}
            label={label}
        >
            <Select
                onChange={(e) => {
                    if (onChange)
                        onChange(e.target.value)
                    field.onChange(e)
                }}
                value={field.value}
                size="small"
                displayEmpty={true}
                sx={{backgroundColor:'white'}}
            >

                {!disableEmpty && (
                    <MenuItem value="">
                        {emptyLabel ?? "Не выбрано"}
                    </MenuItem>
                )}

                {options.map((o, i) => (
                    <MenuItem value={o.value} key={i}>
                        {o.label}
                    </MenuItem>
                ))}

            </Select>
        </InputWrapper>
    )
}

export const RadioGroupInput = ({name, label, options}) => {
    const { control } = useFormContext()
    const {field} = useController({
        name, control
    })

    return (
        <InputWrapper name={name} label={label}>
            <RadioGroup
                {...field}
            >
                {options.map((op, i) => (
                    <FormControlLabel key={i} value={op.value} control={<Radio />} label={op.label} />
                ))}
            </RadioGroup>    
        </InputWrapper>

    )
}

export const NumericInput = ({label, name, placeholder, validation, allowNegative, isFloat, onChange, valueTransform}) => {

    const filter = (ch, value) => {
        if ('0123456789'.includes(ch))
            return true
        if (ch == '.' && isFloat && !value.includes('.'))
            return true
        if (ch == '-' && allowNegative && value.length == 0)
            return true
        return false
    }

    return (
        <SimpleInput
            label={label} 
            name={name}
            type="text"
            onChange={onChange}
            placeholder={placeholder} 
            validation={validation}
            valueTransform={w => {
                const t = !w? 0 : isFloat? parseFloat(w) : parseInt(w)
                return valueTransform? valueTransform(t) : t
            }}
            characterFilter={filter}
        />
    )

}

export const SimpleInput = ({label, type, name, placeholder, validation, valueTransform, onChange, characterFilter}) => {
    const { register } = useFormContext()

    if(valueTransform === undefined && type === 'text')
        valueTransform = trimMultilineText

    return (
        <InputWrapper label={label} name={name}>
            <input
                className="w-full p-4 font-medium border rounded-md border-slate-300 placeholder:opacity-60" 
                type={type}
                placeholder={placeholder}
                {...register(name, {
                    ...validation,
                    setValueAs: valueTransform,
                    onChange: (e) => {
                        const val = valueTransform? valueTransform(e.target.value) : e.target.value
                        if (onChange)
                            onChange(val, e)
                    }
                })}
                onKeyDown={(e) => {
                    if(!e.ctrlKey && e.key.length == 1 && characterFilter && !characterFilter(e.key, e.target.value))
                        e.preventDefault()
                }}
            />
        </InputWrapper>
    )
}

export const AvatarInput = ({label, name, round, validation, maxSizeBytes}) => {
    const {register, setValue} = useFormContext()
    const [imageSrc, setImageSrc] = useState(null)
    const [errorMessage, setErrorMessage] = useState(null)
    const [isDraggedOver, setDraggedOver] = useState(false)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)

    useEffect(() => {

        register(name, {...validation})

    }, [])

    const isJpeg = (f) => f.type == 'image/jpeg'

    const onDragOver = (e) => {
        e.stopPropagation()
        e.preventDefault()

        setErrorMessage(null)
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
        
        const files = [...e.dataTransfer.files]

        setDraggedOver(false)

        if (files.length == 0)
            return
        else if (files.length > 1)
            setErrorMessage({tooMany: true})
        else if(!isJpeg(files[0]))
            setErrorMessage({invalidFormat: true})
        else if(maxSizeBytes && files[0].size > maxSizeBytes)
            setErrorMessage({tooLarge: true})
        else {
            blobToBase64(files[0]).then(setImageSrc)
        }
    }

    const browseFile = () => {
        const inp = document.createElement('input')

        inp.type = 'file'
        inp.multiple = false
        inp.accept = '.jpg,.jpeg'

        inp.addEventListener('change', () => {

            const files = [...inp.files]

            if(maxSizeBytes && files[0].size > maxSizeBytes)
                setErrorMessage({tooLarge: true})
            else
                blobToBase64(files[0]).then(setImageSrc)

        })

        inp.click()
    }

    const onCropComplete = (_, ca) => {
        cropImageSrc(imageSrc, ca.x, ca.y, ca.width, ca.height, 'image/jpeg')
        .then(croppedSrc => {
            const file = dataURLtoFile(croppedSrc, 'avatar.jpg')
            setValue(name, file)
        })
    }

    const resetImage = () => {
        setValue(name, null)
        setImageSrc(null)
    }

    return (
        <InputWrapper label={label} name={name}>
            <CfxBox className="max-w-full max-h-full" style={{width: 'max-content'}}>
                {!imageSrc && (
                    <div
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        className={"max-w-full max-h-full w-[250px] h-[150px] flex flex-col justify-center items-center gap-1 border-2 border-gray-400 " + (isDraggedOver? "border-solid" : "border-dashed")}
                    >
                        {!isDraggedOver && errorMessage && (
                            <>
                                <span className="text-red-600 pointer-events-none text-center">
                                    {errorMessage.tooMany && "Слишком много файлов!"}
                                    {errorMessage.invalidFormat && "Принимаются только JPEG изображения!"}
                                    {errorMessage.tooLarge && `Превышен лимит в ${humanFileSize(maxSizeBytes, true)}!`}
                                </span>

                                <Button onClick={() => setErrorMessage(null)}>ОК</Button>
                            </>
                        )}

                        {!isDraggedOver && !errorMessage && (
                            <>
                                <span className="pointer-events-none">Перетащите файлы сюда</span>
                                <span className="pointer-events-none">или</span>
                                <Button onClick={browseFile}>Нажмите для обзора</Button>                        
                            </>
                        )}

                        {isDraggedOver && (
                            <span className="pointer-events-none">Отпустите</span>
                        )}
                    </div>
                )}

                {imageSrc && (
                    <>
                        <div className="relative max-w-full max-h-full w-[400px] h-[350px]">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape={round? 'round' : 'rect'}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                maxZoom={5}
                                zoomSpeed={0.5}
                            />
                        </div>
                        <Link component="button" underline="hover" onClick={resetImage}>Удалить фото</Link>
                    </>
                )}
            </CfxBox>
        </InputWrapper>
    )


}

export const TextAreaInput = ({label, name, placeholder, validation, valueTransform, onChange}) => {
    const { register } = useFormContext()

    if(valueTransform === undefined)
        valueTransform = trimMultilineText

    return (
        <InputWrapper label={label} name={name}>
            <textarea
                className="w-full p-4 font-medium border rounded-md border-slate-300 placeholder:opacity-60" 
                name={name}
                placeholder={placeholder}
                {...register(
                    name, {
                        ...validation,
                        setValueAs: valueTransform,
                        onChange: (e) => {
                            const val = valueTransform? valueTransform(e.target.value) : e.target.value
                            if (onChange)
                                onChange(val, e)
                        }
                    }
                )}
            >
            </textarea>
        </InputWrapper>
    )
}

export function FormattedTextInput({label, name, placeholder, renderAttachments, validation}) {
    const [isPreviewOpen, togglePreview] = useState(false)
    const {getValues} = useFormContext()

    return (
        <>
            <div className="flex flex-col gap-1 items-start w-full">
                <TextAreaInput name={name} label={label} placeholder={placeholder} validation={validation} valueTransform={trimMultilineText}/>
                <Link component="button" onClick={() => togglePreview(true)} underline="hover">Предпросмотр</Link>
            </div>

            <Dialog
                open={isPreviewOpen}
                onClose={() => togglePreview(false)}
            >
                <DialogTitle>Предпросмотр</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        <FormattedText
                            text={getValues(name)}
                            renderAttachments={renderAttachments}/>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => togglePreview(false)}>Закрыть</Button>
                </DialogActions>
            </Dialog>
        </>
    )

}

export function InputWrapper({name, label, children}) {
    const { formState: { errors } } = useFormContext()
    const inputError = findInputError(errors, name)
    const isInvalid = isFormInvalid(inputError)

    return (
        <div className="flex flex-col w-full gap-2">
            {label && (
                <div className="flex justify-between">
                    <span className="font-semibold">
                        {label}
                    </span>
                </div>
            )}
            {children}
            {isInvalid && <span className="w-full red-800 font-medium font-semibold">{inputError.error.message}</span>}
        </div>
    )
}

export function SmartAccountTagInput({name, label, placeholder, validation}) {
    const [foundUser, setFoundUser] = useState(null)

    const handleChange = (val) => {
        quickFetch('/auth/user/json/' + val)
        .then(u => setFoundUser(u))
        .catch(() => setFoundUser(null))
    }

    const checkFound = (w) => {
        if (w == "")
            return true

        return quickFetch('/auth/user/json/' + w)
            .then(() => true)
            .catch(() => "Не удалось найти пользователя!")
    }

    const v = combineValidations({validate:{checkFound}}, validation)

    return (
        <>
            <SimpleInput 
                name={name}
                label={label}
                placeholder={placeholder}
                validation={v}
                onChange={handleChange}
            />
            {foundUser && (
                <CfxBox>
                    <AvatarTagWidget user={foundUser}/>
                </CfxBox>
            )}
        </>
    )
}

export function EBLInput({name, label, placeholder, validation, onChange, allowZero}) {
    const v = combineValidations({
        validate: {
            is_invalid: (v) => !isNaN(v) && v >= 0 || "Некорректное значение!",
            too_small: (v) => allowZero || v >= 0.01 || "Слишком мало!",
            too_large: (v) => v <= 1e+6 || "Слишком много!"
        },
        required: {
            message: 'Необходимо заполнить!',
            value: true
        }
    }, validation)

    return (
        <NumericInput
            name={name}
            label={label}
            isFloat={true}
            allowNegative={false}
            placeholder={placeholder}
            validation={v}
            onChange={onChange}
            valueTransform={(t) => Math.floor(t * 100) / 100}
        />
    )

}





