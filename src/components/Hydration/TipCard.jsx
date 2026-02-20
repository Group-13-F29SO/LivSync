export default function TipCard({ number, title, description, backgroundColor }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 ${backgroundColor} rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold`}>
        {number}
      </div>
      <div>
        <p className="font-semibold text-blue-900 dark:text-blue-200">{title}</p>
        <p className="text-sm text-blue-800 dark:text-blue-300">{description}</p>
      </div>
    </div>
  );
}
