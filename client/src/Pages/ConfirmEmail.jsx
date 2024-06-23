import { useParams } from 'react-router-dom'
import Form from '../Components/Form'
import {SimpleInput} from '../Components/Input'
import { useState } from 'react'

export default function ConfirmEmail() {
    const { confKey } = useParams()
    const [error, setError] = useState(null)

    const codeValidation = {
        validate: {
            length: (val) => {
                return val.length == 6 || 'Длина кода не 6 символов'
            }
        }
    }

    const onSubmit = (data) => {
        fetch('http://localhost:5000/confirm_email', {
            method: 'POST',
            credentials: 'same-origin',
            body: JSON.stringify({
                confirmation_key: confKey, 
                confirmation_code: data.confCode
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(r => r.json())
        .then(r => {
            if (!r.success) 
                throw Error('could not confirm email')
            location.replace('/')
        })
        .catch(() => {
            setError('Не удалось подтвердить адрес')
        })
    }

    return (
        <Form errorMessage={error} onSubmit={onSubmit} submitButtonLabel="Подтвердить">
            <SimpleInput label="Код подтверждения" name="confCode" validation={codeValidation} type="text" placeholder="000000"/>
        </Form>
    )

}