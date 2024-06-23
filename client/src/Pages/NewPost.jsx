import '../index.css'
import Form from '../Components/Form'
import { SimpleInput, SimpleMultipleFilesUploader, TextAreaInput } from '../Components/Input'
import { hostURL, jsonToFormData, trimMultilineText } from '../utils'

export default function NewPost() {

    const onSubmit = data => {
        return fetch(hostURL('new_post'), {
            method: 'POST',
            body: jsonToFormData(data),
            credentials: 'same-origin'
        }).then(r => r.json())
        .then(r => {
            if (r.success) {
                location.replace('/')
            }
            else
                throw Error('Cannot publish post')
        }).catch(() => {
            alert('Произошла ошибка...')
        })
    }

    const titleValidation = {
        maxLength: {
            value: 150,
            message: 'Превышен лимит в 150 символов'
        },
        setValueAs: v => trimMultilineText(v)
    }

    const bodyValidation = {
        maxLength: {
            value: 2000,
            message: 'Превышен лимит в 2000 символов'
        },
        validate: {
            is_post_empty: (val, other) => {
                return Boolean(trimMultilineText(val)) || other.files.length > 0 || "Пост пустой"
            }
        },
        setValueAs: v => trimMultilineText(v)
    }

    return (
        <Form onSubmit={onSubmit} submitButtonLabel="Публиковать">
            <SimpleInput type="text" name="title" label="Заголовок" validation={titleValidation}/>
            <TextAreaInput name="body" label="Основной текст" validation={bodyValidation}/>
            <SimpleMultipleFilesUploader name="files" label="Прикрепить файлы" maxFiles={10} maxSizeMB={25} />
        </Form>
    )
}
