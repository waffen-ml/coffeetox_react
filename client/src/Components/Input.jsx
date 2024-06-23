import { useFormContext } from "react-hook-form"
import { findInputError, isFormInvalid } from "../utils"
import { useState, useRef, useEffect } from 'react'


export const SimpleInput = ({label, type, name, placeholder, validation}) => {
    const { register } = useFormContext()

    return (
        <InputWrapper label={label} name={name}>
            <input
                className="w-full p-5 font-medium border rounded-md border-slate-300 placeholder:opacity-60" 
                type={type}
                name={name}
                placeholder={placeholder}
                {...register(name, validation ?? {})}
            />
        </InputWrapper>
    )
}

export const TextAreaInput = ({label, name, placeholder, validation}) => {
    const {register} = useFormContext()

    return (
        <InputWrapper label={label} name={name}>
            <textarea
                className="w-full p-5 font-medium border rounded-md border-slate-300 placeholder:opacity-60" 
                name={name}
                placeholder={placeholder}
                {...register(name, validation ?? {})}
            >
            </textarea>
        </InputWrapper>
    )

}

export const SimpleMultipleFilesUploader = ({label, name, required, maxFiles, maxSizeMB}) => {
    const {register, setValue} = useFormContext()
    const [files, setFiles_] = useState([])

    useEffect(() => {
        setValue(name, [])
    }, [])

    register(name, {
        validate: {
            'file_limit_exceeded': (val) => !maxFiles || val.length <= maxFiles || `Превышен лимит в ${maxFiles} файлов`,
            'no_files': (val) => !required || val.length > 0 || 'Нужен хотя бы один файл',
            'memory_limit_exceeded': (val) => {
                let s = 0
                val.forEach(v => s += v.size / 1024 / 1024)
                return !maxSizeMB || s <= maxSizeMB || `Превышен лимит памяти в ${maxSizeMB}МБ`
            }
        }
    })

    const setFiles = (files_) => {
        setValue(name, files_)
        setFiles_(files_)
    }

    const addFiles = (newFiles) => {
        setFiles(files.concat(newFiles))
    }

    const onDragOver = (e) => {
        e.stopPropagation()
        e.preventDefault()
    }

    const onDragLeave = (e) => {
    }

    const onDrop = (e) => {
        e.stopPropagation()
        e.preventDefault()
        addFiles([...e.dataTransfer.files])
    }

    const deleteFile = (i) => {
        setFiles(files.slice(0, i).concat(files.slice(i + 1)))
    }

    const browseFiles = () => {
        const inp = document.createElement('input')
        inp.type = 'file'
        inp.multiple = true
        inp.addEventListener('change', () => {
            addFiles([...inp.files])
        })
        inp.click()
    }

    return (
        <InputWrapper label={label} name={name}>
            <div className="font-medium bg-gray-300 w-full p-3 rounded-md dragover:bg-gray-500" onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} >
                <ul>
                    {files.map((f, i) => <li key={i}>{f.name}  <a href="#" onClick={() => deleteFile(i)}>Удалить</a></li>)}
                </ul>
                <a href="#" onClick={browseFiles}>Добавить файлы</a>
            </div>
        </InputWrapper>
    )
}


const InputWrapper = ({name, label, children}) => {
    const { formState: { errors } } = useFormContext()
    const inputError = findInputError(errors, name)
    const isInvalid = isFormInvalid(inputError)

    return (
        <div className="flex flex-col w-full gap-2">
            <div className="flex justify-between">
                <span className="font-semibold capitalize">
                    {label}
                </span>
            </div>
            {children}
            {isInvalid && <span className="w-full red-800 font-medium font-semibold">{inputError.error.message}</span>}
        </div>
    )
}
