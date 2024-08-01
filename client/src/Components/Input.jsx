import { useFormContext, Controller, useController } from "react-hook-form"
import { findInputError, isFormInvalid } from "../utils"
import { useState, useRef, useEffect } from 'react'
import {Link, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Checkbox, FormControlLabel} from '@mui/material'
import FormattedText from "./FormattedText"

export const SimpleInput = ({label, type, name, placeholder, validation}) => {
    const { control } = useFormContext()
    const {field} = useController({
        name, control,
        rules: validation,
        defaultValue: ''
    })

    return (
        <InputWrapper label={label} name={name}>
            <input
                className="w-full p-5 font-medium border rounded-md border-slate-300 placeholder:opacity-60" 
                type={type}
                placeholder={placeholder}
                {...field}
            />
        </InputWrapper>
    )
}

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

export const TextAreaInput = ({label, name, placeholder, validation}) => {
    const { control } = useFormContext()
    const {field} = useController({
        name, control,
        rules: validation,
        defaultValue: ''
    })

    return (
        <InputWrapper label={label} name={name}>
            <textarea
                className="w-full p-5 font-medium border rounded-md border-slate-300 placeholder:opacity-60" 
                name={name}
                placeholder={placeholder}
                {...field}
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
                <TextAreaInput name={name} label={label} placeholder={placeholder} validation={validation}/>
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
                    <span className="font-semibold capitalize">
                        {label}
                    </span>
                </div>
            )}
            {children}
            {isInvalid && <span className="w-full red-800 font-medium font-semibold">{inputError.error.message}</span>}
        </div>
    )
}
