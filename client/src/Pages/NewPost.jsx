import '../index.css'
import Form from '../Components/Form'
import { SimpleInput, TextAreaInput, FormattedTextInput } from '../Components/Input'
import { hostURL, jsonToFormData, trimMultilineText } from '../utils'
import Post from '../Components/Post'
import { useSearchParams } from "react-router-dom";
import {Link, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button} from '@mui/material'
import { useState, useEffect, useRef } from 'react'
import FormattedText from '../Components/FormattedText'
import MyFileUploader from '../Components/MyFileUploader'

const titleValidation = {
    maxLength: {
        value: 150,
        message: 'Превышен лимит в 150 символов'
    },
    setValueAs: v => trimMultilineText(v)
}


export default function NewPost() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [ fwdPost, setFwdPost ] = useState(null)

    const bodyValidation = {
        maxLength: {
            value: 2000,
            message: 'Превышен лимит в 2000 символов'
        },
        validate: {
            is_post_empty: (val, other) => {
                return Boolean(trimMultilineText(val)) || 
                    other.files.length > 0 || fwdPost && fwdPost.success || "Пост пустой"
            }
        },
        setValueAs: v => trimMultilineText(v)
    }

    useEffect(() => {
        const fwdId = searchParams.get('fwd_id')

        if(!fwdId) return

        setFwdPost({loading:true})

        fetch(hostURL('/post/json/' + fwdId), {credentials:'include'})
        .then(r => r.json())
        .then(post => {
            post.success = true
            setFwdPost(post)
        })
        .catch(() => {
            setFwdPost({error: true})
        })
    }, [])

    const onSubmit = (data) => {
        data['fwd_post_id'] = fwdPost? fwdPost.id ?? -1 : -1

        return fetch(hostURL('new_post'), {
            method: 'POST',
            body: jsonToFormData(data),
            credentials: 'include'
        }).then(r => r.json())
        .then(r => {
            if (r.success) {
                location.replace('/')
            }
            else
                throw Error('Cannot publish post')
        }).catch(() => {
            return 'Не удалось выложить пост'
        })
    }

    return (
        <Form
            onSubmit={onSubmit}
            submitButtonLabel="Публиковать"
            defaultValues={{
                title: '', body: '', files: []
            }}
        >
            <SimpleInput type="text" name="title" label="Заголовок" validation={titleValidation}/>
            <FormattedTextInput name="body" label="Основной текст" validation={bodyValidation}/>
            <MyFileUploader name="files" label="Прикрепить файлы" maxFiles={10} maxSizeMB={25 * 1024 * 1024} width={400} />
            {fwdPost && (
                <div className="flex flex-col gap-2 items-start">
                    <span>Вы хотите поделиться постом</span>
                    {fwdPost.loading && <span>Пост загружается...</span>}
                    {fwdPost.error && <span>Произошла ошибка.</span>}
                    {fwdPost.success && (
                        <Post isCompact={true} data={fwdPost}/>
                    )}
                    <Link component="button" onClick={() => setFwdPost(null)} underline="hover">Удалить</Link>
                </div>
            )}
        </Form>
    )
}
