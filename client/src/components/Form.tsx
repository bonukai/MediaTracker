import { ReactNode, useRef, useEffect, FC, useCallback } from 'react';
import { cx } from '../utils';

type ValidationResponseType =
  | {
      required: true;
    }
  | { message: string };

const GenericInput: FC<{
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  required?: boolean;
}> = (props) => {
  const { children, title, description, required } = props;

  return (
    <div className="pb-6">
      <div className="mb-1 font-semibold text-slate-800">
        {title}
        {required && <span className="text-red-500">*</span>}
      </div>
      {description && <div className="mb-1 text-slate-600">{description}</div>}
      {children}
    </div>
  );
};

export const Form = <
  T extends Record<string, string | number | boolean | null | undefined>,
>(props: {
  className?: string;
  onSubmit: (args: {
    data: T;
    clearForm: () => void;
    submitValidation: (
      args: {
        inputName: keyof T;
      } & ValidationResponseType
    ) => void;
  }) => void | Promise<void>;
  initialValues?: Partial<T>;
  validation?: Partial<{
    [Key in keyof T]: (value: T[Key]) => ValidationResponseType | undefined;
  }>;
  children: (args: {
    ref: (inputName: keyof T) => <InputType>(node: InputType) => void;
    TextInput: FC<{
      title: ReactNode;
      description?: ReactNode;
      disabled?: boolean;
      required?: boolean;
      autoFocus?: boolean;
      minLength?: number;
      maxLength?: number;
      inputName: keyof T;
      rows?: number;
    }>;
    PasswordInput: FC<{
      title: ReactNode;
      description?: ReactNode;
      required?: true;
      minLength?: number;
      maxLength?: number;
      disabled?: boolean;
      inputName: keyof T;
    }>;
    NumberInput: FC<{
      title: ReactNode;
      description?: ReactNode;
      disabled?: boolean;
      required?: boolean;
      autoFocus?: boolean;
      min?: number;
      max?: number;
      step?: number;
      inputName: keyof T;
    }>;
    SelectInput: FC<{
      title: ReactNode;
      description?: ReactNode;
      inputName: keyof T;
      options: { value: string; name: ReactNode }[];
    }>;
    CheckboxInput: FC<{
      title: ReactNode;
      description?: ReactNode;
      inputName: keyof T;
    }>;
    MultiCheckboxInput: FC<{
      title: ReactNode;
      description?: ReactNode;
      checkboxes: { inputName: keyof T; name: ReactNode }[];
    }>;
  }) => ReactNode;
  convertEmptyStringsToNull?: true;
}): React.JSX.Element => {
  const {
    children,
    onSubmit,
    validation,
    className,
    initialValues,
    convertEmptyStringsToNull,
  } = props;
  const refs = useRef<
    Partial<
      Record<
        keyof T,
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    >
  >({});

  useEffect(() => {
    if (!initialValues) {
      return;
    }

    for (const [key, initialValue] of Object.entries(initialValues)) {
      const node = refs.current[key];

      if (initialValue === undefined || initialValue === null) {
        continue;
      }

      if (!node) {
        console.error(`missing ref for ${key.toString()}`);
        continue;
      }

      if (node instanceof HTMLInputElement && node.type === 'checkbox') {
        node.checked = initialValue;
      } else {
        node.value = initialValue;
      }
    }
  }, []);

  const getData = () => {
    return Object.fromEntries(
      Object.entries(refs.current).map(([key, node]) => {
        if (node instanceof HTMLInputElement && node.type === 'checkbox') {
          return [key, node.checked];
        }

        if (typeof node?.value === 'string') {
          const value = node.value.trim();

          if (convertEmptyStringsToNull && value.length === 0) {
            return [key, null];
          }

          return [key, value];
        }

        return [key, node?.value];
      })
    );
  };

  const TextInput: FC<{
    title: ReactNode;
    description?: ReactNode;
    inputName: keyof T;
    required?: boolean;
    disabled?: boolean;
    autoFocus?: boolean;
    minLength?: number;
    maxLength?: number;
    rows?: number;
  }> = useCallback((props) => {
    const {
      inputName,
      required,
      minLength,
      maxLength,
      autoFocus,
      disabled,
      rows,
    } = props;

    return (
      <GenericInput {...props}>
        {rows ? (
          <textarea
            ref={(node) => node && (refs.current[inputName] = node)}
            name={inputName.toString()}
            className="w-80"
            required={required}
            disabled={disabled}
            autoFocus={autoFocus}
            minLength={minLength}
            maxLength={maxLength}
            rows={rows}
          />
        ) : (
          <input
            type="text"
            ref={(node) => node && (refs.current[inputName] = node)}
            name={inputName.toString()}
            className="w-80"
            required={required}
            disabled={disabled}
            autoFocus={autoFocus}
            minLength={minLength}
            maxLength={maxLength}
          />
        )}
      </GenericInput>
    );
  }, []);

  const PasswordInput: FC<{
    title: ReactNode;
    description?: ReactNode;
    inputName: keyof T;
    required?: true;
    disabled?: boolean;
    minLength?: number;
    maxLength?: number;
  }> = useCallback((props) => {
    const { inputName, required, minLength, maxLength, disabled } = props;

    return (
      <GenericInput {...props}>
        <input
          type="password"
          ref={(node) => node && (refs.current[inputName] = node)}
          name={inputName.toString()}
          className="w-80"
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          disabled={disabled}
        />
      </GenericInput>
    );
  }, []);

  const NumberInput: FC<{
    title: ReactNode;
    description?: ReactNode;
    disabled?: boolean;
    required?: boolean;
    autoFocus?: boolean;
    min?: number;
    max?: number;
    step?: number;
    inputName: keyof T;
  }> = useCallback((props) => {
    const { inputName, required, max, min, step } = props;

    return (
      <GenericInput {...props}>
        <input
          type="number"
          ref={(node) => node && (refs.current[inputName] = node)}
          name={inputName.toString()}
          // className="w-80"
          required={required}
          min={min}
          max={max}
          step={step}
        />
      </GenericInput>
    );
  }, []);

  const SelectInput: FC<{
    title: ReactNode;
    description?: ReactNode;
    inputName: keyof T;
    options: { value: string; name: ReactNode }[];
  }> = useCallback((props) => {
    const { inputName, options } = props;

    return (
      <GenericInput {...props}>
        <select
          ref={(node) => node && (refs.current[inputName] = node)}
          name={inputName.toString()}
          className="w-80"
        >
          {options.map(({ value, name }) => (
            <option key={[value, name?.toString()].toString()} value={value}>
              {name}
            </option>
          ))}
        </select>
      </GenericInput>
    );
  }, []);

  const CheckboxInput: FC<{
    title: ReactNode;
    description?: ReactNode;
    inputName: keyof T;
  }> = useCallback((props) => {
    const { inputName, title, description } = props;

    return (
      <div className="pb-6">
        <label>
          <input
            type="checkbox"
            ref={(node) => node && (refs.current[inputName] = node)}
            name={inputName.toString()}
          />

          <span className="inline ml-1 font-semibold select-none text-slate-800">
            {title}
          </span>
        </label>

        {description && (
          <div className="mt-1 text-slate-600">{description}</div>
        )}
      </div>
    );
  }, []);

  const MultiCheckboxInput: FC<{
    title: ReactNode;
    description?: ReactNode;
    checkboxes: { inputName: keyof T; name: ReactNode }[];
  }> = useCallback((props) => {
    const { checkboxes } = props;

    return (
      <GenericInput {...props}>
        {checkboxes.map(({ inputName, name }, index) => (
          <label
            key={inputName.toString()}
            className={cx('block', index < checkboxes.length - 1 && 'mb-1')}
          >
            <input
              type="checkbox"
              ref={(node) => node && (refs.current[inputName] = node)}
              name={inputName.toString()}
            />

            <span className="inline ml-1 select-none text-slate-600">
              {name}
            </span>
          </label>
        ))}
      </GenericInput>
    );
  }, []);

  return (
    <form
      className={className}
      onSubmit={async (e) => {
        e.preventDefault();

        const data = getData();

        if (validation) {
          for (const [key, validator] of Object.entries(validation)) {
            const node = refs.current[key];

            if (!node) {
              console.error(`missing ref for ${key.toString()}`);
              continue;
            }

            const value = data[key];
            const validation = validator(value);

            if (validation) {
              handleValidation({ node, validation });

              return;
            }
          }
        }

        const clearForm = () => {
          for (const node of Object.values(refs.current)) {
            if (
              node instanceof HTMLInputElement ||
              node instanceof HTMLTextAreaElement
            ) {
              node.value = '';
            }
          }
        };

        const submitValidation = (
          args: {
            inputName: keyof T;
          } & ValidationResponseType
        ): void => {
          const { inputName } = args;
          const node = refs.current[inputName];

          if (!node) {
            console.error(`missing ref for ${inputName.toString()}`);
            return;
          }

          handleValidation({ node, validation: args });
        };

        await onSubmit({
          data: data as T,
          clearForm,
          submitValidation,
        });
      }}
    >
      {children({
        ref: (inputName) => {
          return (node) => {
            if (node) {
              if (
                !(
                  node instanceof HTMLInputElement ||
                  node instanceof HTMLSelectElement ||
                  node instanceof HTMLTextAreaElement
                )
              ) {
                throw new Error(
                  `Form can only be used with <input>, <select> or <textarea>`
                );
              }

              refs.current[inputName] = node;
            } else {
              refs.current[inputName] = undefined;
            }
          };
        },
        TextInput,
        SelectInput,
        CheckboxInput,
        MultiCheckboxInput,
        PasswordInput,
        NumberInput,
      })}
    </form>
  );
};

const handleValidation = (args: {
  validation: ValidationResponseType;
  node: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
}) => {
  const { validation, node } = args;
  const initialRequiredValue = node.required;

  if ('required' in validation && validation.required) {
    node.required = true;
  } else if ('message' in validation && validation.message) {
    node.setCustomValidity(validation.message);
  }

  node.reportValidity();

  const onChangeHandler = () => {
    if ('required' in validation && validation.required) {
      node.required = initialRequiredValue;
    } else if ('message' in validation && validation.message) {
      node.setCustomValidity('');
    }

    node.removeEventListener('input', onChangeHandler);
  };

  node.addEventListener('input', onChangeHandler);
};
