import Form from '../../Components/Form/Form'
import { AvatarInput, SimpleInput, CheckboxInput } from '../../Components/Form/Input'
import Page from '../../Components/Page'
import {hostURL, jsonToFormData} from '../../utils'

const nameValidation = {
    maxLength: {
        value: 100,
        message: 'Превышен лимит в 100 символов'
    },
    required: {
        value: true,
        message: 'Необходимо заполнить'
    }
}

export default function NewPlaylist() {
    
    const handleSubmit = (data) => {

        const toSend = {
            name: data.name,
            is_private: data.is_private
        }

        if (data.cover)
            toSend.cover = data.cover

        fetch(hostURL('/music/create_playlist'), {
            method: 'POST',
            credentials: 'include',
            body: jsonToFormData(toSend)
        })
        .then(r => r.json())
        .then(r => {
            if(!r.success)
                throw Error()
            location.replace('/')
        })
        .catch(() => "Не удалось создать плейлист.")

    }

    return (
        <Page title="Новый плейлист">
            <Form onSubmit={handleSubmit}>
                <SimpleInput label="Название" name="name" validation={nameValidation} />
                <AvatarInput label="Обложка" name="cover" maxSizeBytes={5 * 1024 * 1024}/>
                <CheckboxInput label="Приватный" name="is_private" />
            </Form>
        </Page>
    )
}