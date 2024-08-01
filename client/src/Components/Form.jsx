import '../index.css'
import { useForm, FormProvider } from 'react-hook-form'
import {useState} from 'react'
import { Link } from '@mui/material'

export default function Form({onSubmit, children, submitButtonLabel, hints, methodsRef, defaultValues, values, className}) {
    const methods = useForm({
      defaultValues,
      values
    })
    const [message, setMessage] = useState(null)

    const handledSubmit = methods.handleSubmit((data) => {
      return Promise.resolve(onSubmit(data))
      .then(r => {
        if (r && typeof r === 'string')
          setMessage(r)
      })
    })

    if(methodsRef) {
        methodsRef.current = {
          getValues: methods.getValues
        }
    }

    return (
        <FormProvider {...methods}>
          <form
            onSubmit={e => e.preventDefault()}
            noValidate
            className={className}
          >
            <div className="flex flex-col gap-3">
                {children}
            </div>

            {message && <span>{message}</span>}

            {hints && hints.length && (
              <ul className="mt-5">
                {hints.map((h, i) => (
                  <li key={i}>
                    {h.action && <Link component="button" onClick={h.action}>{h.label}</Link>}
                    {!h.action && <Link href={h.url}>{h.label}</Link>}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5">
              <button onClick={handledSubmit} className="flex items-center gap-1 p-5 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-800">{submitButtonLabel ?? 'Submit'}</button>
            </div>
          </form>
        </FormProvider>
    
      )
}
