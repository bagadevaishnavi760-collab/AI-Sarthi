import Select from './Select';

export default function StateSelector({ value, onChange, options, label = 'State' }) {
  return <Select label={label} value={value} onChange={onChange} options={options} />;
}
