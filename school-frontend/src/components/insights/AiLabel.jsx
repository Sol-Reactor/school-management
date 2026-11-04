import { LuSparkles } from 'react-icons/lu';

/** Required disclosure on every AI-written text. */
const AiLabel = ({ canned }) => (
  <p className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
    <LuSparkles aria-hidden="true" className="h-3.5 w-3.5" />
    {canned ? 'Sample text (demo) · review before sharing' : 'AI-generated · review before sharing'}
  </p>
);

export default AiLabel;
