import {SimpleInput} from '../Components/Input'
import Form from '../Components/Form'
import { hostURL } from '../utils'
import {usernameValidation, tagValidation, emailValidation, passwordValidation, passwordRepValidation} from '../utils'
import Page from '../Components/Page'

const hints = [
    {
        label: 'Уже есть аккаунт',
        url: '/login'
    },
    {
        label: 'Забыли пароль?',
        url: '#'
    }
]

export default function Register() {

    const onSubmit = (data) => {
        return fetch(hostURL('register'), {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: data.username,
                password: data.password,
                email: data.email,
                tag: data.tag
            })
        })
        .then(r => r.json())
        .then(r => {
            if(!r.success)
                throw Error()
            else if (r.confirmation)
                location.replace('/confirm_email/' + r.confirmation_key)
            else
                location.replace('/')
        })
        .catch(() => {
            return 'Не удалось создать аккаунт.'
        })
    }

    return (
        <Page title="Регистрация">
            <Form
                submitButtonLabel="Создать аккаунт"
                onSubmit={onSubmit}
                hints={hints}
            >
                <SimpleInput validation={usernameValidation} label="Имя пользователя" name="username" type="text" placeholder="Илья Капибарыч"/>
                <SimpleInput validation={tagValidation} label="Тег аккаунта" name="tag" type="text" placeholder="ilya_capybara"/>
                <SimpleInput validation={emailValidation} label="Email" name="email" type="text" placeholder="ilya_capybara@cfx.ru"/>
                <SimpleInput validation={passwordValidation} label="Пароль" name="password" type="password" />
                <SimpleInput validation={passwordRepValidation} label="Повторите пароль" name="passwordRep" type="password"/>
            </Form>
        </Page>
    )


}