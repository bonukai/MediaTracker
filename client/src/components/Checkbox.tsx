import React, { FunctionComponent } from 'react';

export const CheckboxWithTitleAndDescription: FunctionComponent<{
  title: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}> = (props) => {
  const { title, description, checked, onChange } = props;

  return (
    <div>
      {description && (
        <div className="font-light text-gray-600 dark:text-slate-200">
          {description}
        </div>
      )}
      <div className="inline-block pb-2">
        <input
          className="mr-1"
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{title}</span>
      </div>
    </div>
  );
};
