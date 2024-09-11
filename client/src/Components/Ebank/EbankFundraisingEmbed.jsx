import { useState, useEffect, useContext} from "react";
import { Button, Alert, AlertTitle } from "@mui/material";
import { CfxBox } from "../CfxBaseComponents";
import { labelEBL, quickFetch, cfxContext } from "../../utils";
import Form from "../Form/Form";
import { EBLInput, RadioGroupInput } from "../Form/Input";

export default function EbankFundraisingEmbed({id}) {
    const [data, setData] = useState(null)
    const [formEnabled, setFormEnabled] = useState(false)
    const {currentUser} = useContext(cfxContext)

    useEffect(() => {
        quickFetch('/ebank/fundraising/' + id)
        .then(r => setData(r))
        .catch(() => setData({error:'CATCH'}))
    }, [])

    console.log(data)

    if (data === null)
        return <CfxBox>Загрузка...</CfxBox>
    else if(data.error) {
        return (
            <CfxBox>
                <Alert severity="error">
                    <AlertTitle>Ошибка!</AlertTitle>
                    {data.error == 'CATCH' && 'Не удалось загрузить сбор средств.'}
                    {data.error == 'NOT_FOUND' && 'Не удалось найти данный сбор средств'}
                </Alert>
            </CfxBox>
        )
    }

    const handleSubmit = (formData) => {
        if(!currentUser)
            return
        else if(currentUser.id < 0) {
            alert('Войдите, чтобы жервовать ебаллы!')
            return
        }

        return quickFetch(`/ebank/donate_fundraising/${id}/${formData.amount.toFixed(2)}`)
        .then(r => {
            if (r.error == 'INVALID_AMOUNT')
                return {muiError: 'Некорректное число валюты для перевода!', alertDefaultTitle: true}
            else if(r.error == 'INSUFFICIENT_BALANCE')
                return {muiError: 'Недостаточно средств!', alertDefaultTitle: true}
            else if (r.error == 'FULLY_RAISED')
                return {muiInfo: 'Все средства уже собраны.'}
            else if(r.error)
                return {muiError: 'Неизвестная ошибка!', alertDefaultTitle: true}

            setData({
                fundraising: {
                    ...data.fundraising,
                    raised: r.raised
                }
            })

            return {
                muiSuccess: `Вы успешно пожертвовали ${labelEBL(r.amount)}`,
                alertDefaultTitle: true, 
                disableSubmit: data.fundraising.goal == r.raised
            }
        })
        .catch(() => {
            return {
                muiError: 'Разорвано соединение с сервером!',
                alertDefaultTitle: true
            }
        })
    } 

    return (
        <CfxBox className="flex flex-col gap-1">
            <div>
                {data.fundraising.title && <h1 className="text-2xl">{data.fundraising.title}</h1>}
                {data.fundraising.title && <span className="text-sm">Сбор средств</span>}
                {!data.fundraising.title && <h1 className="text-2xl">Сбор средств</h1>}
            </div>

            <span className="text-3xl">{labelEBL(data.fundraising.goal)}</span>
            <div className="flex gap-2 items-center max-w-[300px]">
                <input 
                    type="range"
                    readOnly
                    className="w-full"
                    min={0}
                    max={100}
                    value={Math.floor(data.fundraising.raised / data.fundraising.goal * 100)}
                />
                <span>
                    {Math.floor(data.fundraising.raised / data.fundraising.goal * 100)}%
                </span>
            </div>
            <span>Собрано {labelEBL(data.fundraising.raised)}</span>

            {currentUser && currentUser.id > 0 && currentUser.id != data.fundraising.creator.id && (
                <div className="mt-3">
                    {!formEnabled && data.fundraising.goal - data.fundraising.raised > 0.01 && (
                        <Button variant="contained" onClick={() => setFormEnabled(true)}>Хочу помочь</Button>
                    )}
                    {!formEnabled && data.fundraising.goal - data.fundraising.raised < 0.01 && (
                        <span>Все средства уже собраны.</span>
                    )}
                    {formEnabled && (
                        <Form
                            submitButtonLabel="Перевести"
                            onSubmit={handleSubmit}
                            defaultValues={{amount: (data.fundraising.goal - data.fundraising.raised).toPrecision(2)}}
                        >
                            <EBLInput
                                name="amount"
                                label="Сумма пожертвования"
                            />
                        </Form>
                    )}
                </div>
            )}

        </CfxBox>
    )
}