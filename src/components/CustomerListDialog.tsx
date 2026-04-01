import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Table, TBody, Td, Th, THead } from "@/components/ui/table";
import type { Customer } from "@/types";
import type { ReactNode } from "react";

export function CustomerListDialog({
  open,
  onClose,
  title,
  description,
  customers,
  onSelectCustomer,
  actionHeader,
  renderRowActions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  customers: Customer[];
  onSelectCustomer: (c: Customer) => void;
  /** 행 오른쪽 액션 (콘텐츠 미리보기 등) */
  actionHeader?: string;
  renderRowActions?: (c: Customer) => ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      className="max-w-3xl"
    >
      <div className="-mx-1 overflow-x-auto">
        <Table className="border-0">
          <THead>
            <tr>
              <Th>고객</Th>
              <Th>세그먼트</Th>
              <Th>우선순위</Th>
              <Th>AI 배정 채널</Th>
              <Th className="min-w-[200px]">과제</Th>
              {renderRowActions ? <Th className="w-[100px]">{actionHeader ?? "액션"}</Th> : null}
            </tr>
          </THead>
          <TBody>
            {customers.map((c) => (
              <tr
                key={c.customerId}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => {
                  onSelectCustomer(c);
                  onClose();
                }}
              >
                <Td>
                  <div className="font-medium text-slate-900">{c.customerName}</div>
                  <div className="font-mono text-[11px] text-slate-500">{c.customerId}</div>
                </Td>
                <Td className="text-xs">{c.segment}</Td>
                <Td className="text-xs">{c.priority}</Td>
                <Td className="text-xs">{c.primaryChannel}</Td>
                <Td className="max-w-[280px] truncate text-xs text-slate-600">{c.targetTaskName}</Td>
                {renderRowActions ? (
                  <Td
                    className="align-middle"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    {renderRowActions(c)}
                  </Td>
                ) : null}
              </tr>
            ))}
          </TBody>
        </Table>
      </div>
      <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          닫기
        </Button>
      </div>
    </Dialog>
  );
}
