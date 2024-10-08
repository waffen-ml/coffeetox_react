import Form from '../../Components/Form/Form'
import { SimpleInput } from '../../Components/Form/Input'
import { quickFetchPostJSON, loadUserData, quickFetch} from '../../utils'
import { useRef, useState } from 'react'
import Page from '../../Components/Page'

export default function Login() {
    const methodsRef = useRef(null)
    const [resetBlocked, setResetBlocked] = useState(false)
    
    const onSubmit = (data) => {
        return quickFetchPostJSON('/auth/login', data)
        .then(r => {
            if (r.error) {
                return {
                    muiError: {
                        'ALREADY_AUTHORIZED': 'Вы уже авторизованы!',
                        'USER_NOT_FOUND': 'Пользователь не найден!',
                        'INCORRECT_PASSWORD': 'Неверный пароль!',
                    }[r.error] ?? 'Неизвестная ошибка',
                    alertDefaultTitle: true
                }
            }

            location.replace('/')

            return {
                muiSuccess: 'Вы успешно вошли!',
                disableSubmit: true
            }
        })
        .catch(() => {
            return {
                muiError: 'Потеряно соединение с сервером!',
                alertDefaultTitle: true
            }
        })
    }

    const handleResetPassword = () => {
        if(!methodsRef.current)
            return

        if (resetBlocked) {
            methodsRef.current.setResult({
                muiError: 'Письмо для восстановления доступа уже было отправлено.',
                alertDefaultTitle: true
            })
            return
        }

        methodsRef.current.setResult({
            muiInfo: 'Подождите...'
        })

        const tag = methodsRef.current.getValues('tag')

        setResetBlocked(true)

        quickFetch('/auth/send_reset_password_email/' + tag)
        .then(r => {
            if (r.error == 'USER_NOT_FOUND') {
                methodsRef.current.setResult({
                    muiError: 'Пользователя с таким тэгом не найдено!',
                    alertDefaultTitle: true
                })
                setResetBlocked(false)
                return
            }
            else if (r.error)
                throw Error()
            
            methodsRef.current.setResult({
                muiSuccess: 'На Вашу электронную почту отправлено письмо для восстановления доступа.',
                alertDefaultTitle: true
            })
        })
        .catch(() => {
            methodsRef.current.setResult({
                muiError: 'Не удалось отправить Вам письмо для восстановления доступа.',
                alertDefaultTitle: true
            })
            setResetBlocked(false)
        })
    }
    
    const hints = [
        {
            label: 'Создать аккаунт',
            url: '/register'
        },
        {
            label: 'Забыли пароль?',
            action: handleResetPassword
        }
    ]

    return (
        <Page title="Вход">
            <Form
                submitButtonLabel="Войти"
                onSubmit={onSubmit}
                hints={hints}
                methodsRef={methodsRef}
            >
                <SimpleInput validation={{required:true}} label="Имя аккаунта" name="tag" type="text" placeholder="ilya_capybara"/>
                <SimpleInput validation={{required:true}} label="Пароль" name="password" type="password" />
            </Form>
        </Page>

    )

}


