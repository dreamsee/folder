interface SimpleLineTableProps {
  text: string;
}

export default function SimpleLineTable({ text }: SimpleLineTableProps) {
  const lines = text.split('\n');

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700 w-16">
              줄
            </th>
            <th className="border-b px-3 py-2 text-left text-sm font-medium text-gray-700">
              내용
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="border-b px-3 py-2 text-sm text-gray-500 font-mono text-right">
                {index + 1}
              </td>
              <td className="border-b px-3 py-2 text-sm font-mono whitespace-pre-wrap">
                {line}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}