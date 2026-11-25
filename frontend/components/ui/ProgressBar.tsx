type ProgressBarProps = {
  value?: number;
};

export function ProgressBar({ value = 0 }: ProgressBarProps) {
  return <div>Progress: {value}%</div>;
}
