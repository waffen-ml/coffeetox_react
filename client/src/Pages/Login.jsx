import {SimpleInput} from '../Components/Input'
import Form from '../Components/Form'
import { hostURL } from '../utils'
import { useRef } from 'react'

export default function Login() {
    const onSubmit = (data) => {
        return fetch(hostURL('login'), {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(r => r.json())
        .then((r) => {
            if(!r.success)
                throw Error()
            location.replace('/')
        })
        .catch(() => {
            return 'Не удалось войти.'
        })
    }
    const methodsRef = useRef(null)
    
    const hints = [
        {
            label: 'Создать аккаунт',
            url: '/register'
        },
        {
            label: 'Забыли пароль?',
            action: () => {
                if(!methodsRef.current)
                    return
                location.replace('/reset_password_start?tag=' + methodsRef.current.getValues('tag'))
            }
        }
    ]

    return (
        <Form
            submitButtonLabel="Войти"
            onSubmit={onSubmit}
            hints={hints}
            methodsRef={methodsRef}
        >
            <SimpleInput validation={{required:true}} label="Имя аккаунта" name="tag" type="text" placeholder="ilya_capybara"/>
            <SimpleInput validation={{required:true}} label="Пароль" name="password" type="password" />
        </Form>
    )

}