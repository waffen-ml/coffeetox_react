import Form from '../../Components/Form/Form'
import { SimpleInput } from '../../Components/Form/Input'
import { quickFetchPostJSON, loadUserData, quickFetch} from '../../utils'
import { useRef, useState } from 'react'
import Page from '../../Components/Page'

export default function Login() {
    const methodsRef = useRef(null)
    const [emailSent, setEmailSent] = useState(false)
    
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

    const handleResetPassword = async () => {
        if(!methodsRef.current)
            return

        if (emailSent) {
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
        const user = await loadUserData(tag)

        if (!user) {
            methodsRef.current.setResult({
                muiError: 'Невозможно восстановить доступ, так как аккаунт не найден.',
                alertDefaultTitle: true
            })
            return
        }

        setEmailSent(true)

        quickFetch('/auth/send_reset_password_email/' + tag)
        .then(r => {
            if (r.error)
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
            setEmailSent(false)
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


