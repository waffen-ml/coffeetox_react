import '../index.css'
import { useForm, FormProvider } from 'react-hook-form'

export default function Form({onSubmit, children, submitButtonLabel, errorMessage}) {
    const methods = useForm()
    const handledSubmit = methods.handleSubmit(onSubmit)

    return (
        <FormProvider {...methods}>
          <form
            onSubmit={e => e.preventDefault()}
            noValidate
            className="container"
          >
            <div className="flex flex-col gap-3">
                {children}
            </div>
            {errorMessage && <span>{errorMessage}</span>}
            <div className="mt-5">
              <button onClick={handledSubmit} className="flex items-center gap-1 p-5 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-800">{submitButtonLabel ?? 'Submit'}</button>
            </div>
          </form>
        </FormProvider>
    
      )
}
