import Form from '../Components/Form/Form'
import { SimpleInput, TextAreaInput, FormattedTextInput, CheckboxInput, InputWrapper} from '../Components/Form/Input'
import { hostURL, jsonToFormData, trimMultilineText } from '../utils'
import Post from '../Components/Post'
import { useSearchParams } from "react-router-dom";
import {Link, IconButton} from '@mui/material'
import { useState, useEffect, useRef, useMemo } from 'react'
import MyFileUploader from '../Components/Form/MyFileUploader'
import { useFormContext, Controller, useController } from "react-hook-form"
import ClearIcon from '@mui/icons-material/Clear';
import Page from '../Components/Page'
import {CfxBox} from '../Components/CfxBaseComponents.jsx'

const titleValidation = {
    maxLength: {
        value: 150,
        message: 'Превышен лимит в 150 символов'
    },
    setValueAs: v => trimMultilineText(v)
}

function toLocalShortISO(dt) {
    const tzoffset = dt.getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = (new Date(dt.getTime() - tzoffset)).toISOString()
    return localISOTime.split(':').slice(0, 2).join(':')
}

function PollConstructor() {
    const { control, setValue, getValues, unregister} = useFormContext()
    const {field} = useController({
        name: 'has_poll', control,
        defaultValue: false
    })
    const [optionCount, setOptionCount] = useState(2)

    const togglePoll = (w) => {
        setValue('has_poll', w)

        if(!w) {
            unregister('poll_is_anonymous')
            unregister('poll_options')
            unregister('poll_title')
            setOptionCount(3)
        }

    }

    const deleteOption = (i) => {
        if(optionCount <= 2)
            return

        for(let j = i; j < optionCount - 1; j++)
            setValue(`poll_options.${j}`, getValues(`poll_options.${j + 1}`))

        unregister(`poll_options.${optionCount - 1}`)
        setOptionCount(optionCount - 1)
    }

    if (!field.value)
        return <Link component="button" onClick={() => togglePoll(true)}>Прикрепить опрос</Link>

    return (
        <CfxBox className="flex flex-col gap-1 items-start max-w-full w-[400px]">
            <SimpleInput
                name="poll_title"
                label="Заголовок опроса"
                placeholder="Мой опрос"
                validation={{
                    maxLength: {
                        value: 100,
                        message: 'Превышен лимит в 100 символов'
                    }
                }}
            />

            <span>Варианты ответа</span>
            <ul className="w-full">

                {Array(optionCount).fill(0).map((_, i) => (
                    <li key={i} className="w-full flex justify-between gap-1 items-center">

                        <SimpleInput
                            type="text"
                            name={`poll_options.${i}`}
                            placeholder={`Вариант №${i + 1}`}
                            validation={{
                                required: {
                                    value: true,
                                    message: 'Пусто'
                                },
                                maxLength: {
                                    value: 100,
                                    message: 'Превышен лимит в 100 символов'
                                }
                            }}
                        />
                        
                        {optionCount > 2 && <IconButton onClick={() => deleteOption(i)}><ClearIcon/></IconButton>}
                    </li>
                ))}

            </ul>
            
            {optionCount < 10 && (
                <Link component="button" onClick={() => setOptionCount(optionCount + 1)}>Добавить вариант</Link>
            )}

            <CheckboxInput name="poll_is_anonymous" label="Анонимный опрос"/>
            <Link component="button" onClick={() => togglePoll(false)}>Удалить опрос</Link>
        </CfxBox>
    )

}

function PlanningManager() {
    const bounds = useMemo(() => {
        const min = new Date(Date.now() + 10 * 60 * 1000)
        const max = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)

        return { min, max }
    })
    const {register, unregister, setValue} = useFormContext()
    const [enabled, setEnabled] = useState(false)

    if(!enabled)
        return (
            <Link
                component="button"
                onClick={() => {
                    setValue('plan_datetime', toLocalShortISO(bounds.min))
                    setEnabled(true)
                }}
            >
                Запланировать публикацию
            </Link>
        )

    return (
        <CfxBox className="flex flex-col gap-1 items-start">
            
            <InputWrapper name="plan_datetime" label="Запланировать публикацию">
                <input
                    type="datetime-local"
                    name="plan_datetime"
                    min={toLocalShortISO(bounds.min)}
                    max={toLocalShortISO(bounds.max)}
                    {...register('plan_datetime', {
                        validate: {
                            tooEarly: (d) => {
                                return new Date(d).getTime() - bounds.min.getTime() >= 0 || 'Слишком рано!'
                            },
                            tooLate: (d) => {
                                return bounds.max.getTime() - new Date(d).getTime() >= 0 || 'Слишком поздно!'
                            }
                        }
                    })}
                />
            </InputWrapper>


            <Link
                component="button"
                onClick={() => {
                    unregister('plan_datetime')
                    setEnabled(false)
                }}
            >
                Отмена
            </Link>
        </CfxBox>
    )


    
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
                return Boolean(val) || other.has_poll || 
                    other.files.length > 0 || fwdPost && fwdPost.success || "Пост пустой"
            }
        }
    }

    useEffect(() => {
        const fwdId = searchParams.get('fwd_id')

        if(!fwdId) return

        setFwdPost({loading:true})

        fetch(hostURL('/posts/post/json/' + fwdId), {credentials:'include'})
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

        const toSend = {
            title: data.title,
            body: data.body,
            files: data.files,
            fwd_post_id: fwdPost? fwdPost.id ?? -1 : -1,
            poll_json: !data.has_poll? null :
                JSON.stringify({
                    title: data.poll_title,
                    options: data.poll_options,
                    is_anonymous: data.poll_is_anonymous
                }),
            plan_datetime: data.plan_datetime? new Date(data.plan_datetime).toISOString() : null
        }

        return fetch(hostURL('/posts/new_post'), {
            method: 'POST',
            body: jsonToFormData(toSend),
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
        <Page title="Новый пост">
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
                <PollConstructor/>
                <PlanningManager/>
            </Form>
        </Page>

    )
}
