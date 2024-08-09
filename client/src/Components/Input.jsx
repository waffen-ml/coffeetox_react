import { useFormContext, Controller, useController } from "react-hook-form"
import { findInputError, isFormInvalid } from "../utils"
import { useState, useRef, useEffect } from 'react'
import {Link, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Checkbox, Radio, FormControlLabel, RadioGroup} from '@mui/material'
import FormattedText from "./FormattedText"
import { trimMultilineText } from "../utils"


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

export const SimpleInput = ({label, type, name, placeholder, validation, valueTransform}) => {
    const { register } = useFormContext()

    if(valueTransform === undefined && type === 'text')
        valueTransform = trimMultilineText

    return (
        <InputWrapper label={label} name={name}>
            <input
                className="w-full p-4 font-medium border rounded-md border-slate-300 placeholder:opacity-60" 
                type={type}
                placeholder={placeholder}
                {...register(
                    name, {
                        ...validation,
                        setValueAs: valueTransform
                    }
                )}
            />
        </InputWrapper>
    )
}

export const TextAreaInput = ({label, name, placeholder, validation, valueTransform}) => {
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
                        setValueAs: valueTransform
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
