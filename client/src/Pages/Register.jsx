import {SimpleInput} from '../Components/Input'
import Form from '../Components/Form'
import { hostURL } from '../utils'

export default function Register() {

    const nameValidation = {
        minLength: {
            value: 5,
            message: 'Имя должно быть от 5 до 30 символов'
        },
        maxLength: {
            value: 30,
            message: 'Имя должно быть от 5 до 30 символов'
        }
    }

    const tagValidation = {
        minLength: {
            value: 5,
            message: 'Тег должен быть от 5 до 20 символов'
        },
        maxLength: {
            value: 20,
            message: 'Тег должен быть от 5 до 20 символов'
        },
        pattern: {
            value: /^[A-Za-z0-9_]*$/,
            message: 'Тег должен состоять из цифр, латинских букв и "_"'
        },
        validate: {
            is_free: (val) => {
                return fetch(hostURL('is_tag_free?tag=' + val))
                .then(r => r.json()).then(r => {
                    if (!r.success)
                        throw Error('failed to check tag')
                    else if(!r.is_free)
                        return 'Этот тег занят'
                    return true
                })
                .catch(() => {
                    return 'Не удалось узнать, свободен ли тег'
                })
            }
        }
    }

    const emailValidation = {
        pattern: {
            value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
            message: 'Недействительный адрес'
        }
    }

    const passwordValidation = {
        minLength: {
            value: 4,
            message: 'Пароль должен быть не короче 4 символов'
        }
    }

    const passwordRepValidation = {
        validate: {
            correct_rep: (val, other) => {
                return val == other.password || 'Пароли не совпадают'
            }
        } 
    }

    const onSubmit = (data) => {
        console.log(data)
        return fetch(hostURL('register'), {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(r => r.json())
        .then(r => {
            if (!r.success)
                throw Error('could not register')
            location.replace('/confirm_email/' + r.confirmation_key)
        })
        .catch(() => {
            alert('Произошла ошибка...')
        })
    }

    return (
        <Form submitButtonLabel="Создать аккаунт" onSubmit={onSubmit}>
            <SimpleInput validation={nameValidation} label="Имя пользователя" name="name" type="text" placeholder="Илья Капибарыч"/>
            <SimpleInput validation={tagValidation} label="Тег аккаунта" name="tag" type="text" placeholder="ilya_capybara"/>
            <SimpleInput validation={emailValidation} label="Email" name="email" type="text" placeholder="ilya_capybara@cfx.ru"/>
            <SimpleInput validation={passwordValidation} label="Пароль" name="password" type="password" />
            <SimpleInput validation={passwordRepValidation} label="Повторите пароль" name="passwordRep" type="password"/>
        </Form>
    )


}