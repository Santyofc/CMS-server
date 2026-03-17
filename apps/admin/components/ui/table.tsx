import type { ReactNode } from "react";

export function DataTable({
  head,
  children
}: {
  head: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>{head}</thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
