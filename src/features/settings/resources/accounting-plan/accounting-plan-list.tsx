import { useState } from "react";
import {
  DataTable,
  EditButton,
  List,
  TextField,
  useRecordContext,
} from "react-admin";
import { IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Account } from "@/types/accounting-plan";
import SubaccountsPanel from "./subaccounts-panel";
import SubaccountFormDrawer from "./subaccount-form-drawer";

interface DrawerState {
  open: boolean;
  mode: "create" | "edit";
  parentId: number;
  editRecord?: Account;
}

const AddSubaccountButton = ({
  onAdd,
}: {
  onAdd: (parentId: number) => void;
}) => {
  const record = useRecordContext<Account>();
  if (!record) return null;
  return (
    <IconButton
      size="small"
      title="Agregar subcuenta"
      onClick={(e) => {
        e.stopPropagation();
        onAdd(record.id as number);
      }}
    >
      <AddIcon fontSize="small" />
    </IconButton>
  );
};

export const AccountingPlanList = () => {
  const [drawerState, setDrawerState] = useState<DrawerState>({
    open: false,
    mode: "create",
    parentId: 0,
  });

  const handleAdd = (parentId: number) => {
    setDrawerState({ open: true, mode: "create", parentId });
  };

  const handleEdit = (record: Account) => {
    setDrawerState({
      open: true,
      mode: "edit",
      parentId: record.parentAccountId ?? 0,
      editRecord: record,
    });
  };

  const handleClose = () => {
    setDrawerState((prev) => ({ ...prev, open: false }));
  };

  return (
    <>
      <List filter={{ parentAccountId: null }}>
        <DataTable
          expand={<SubaccountsPanel onEdit={handleEdit} onAdd={handleAdd} />}
          expandSingle
          rowClick="expand"
          rowSx={() => ({
            backgroundColor: "action.selected",
            "& > td": { fontWeight: 600 },
          })}
        >
          <DataTable.Col source="code" label="Código" sx={{ width: "15%" }}>
            <TextField source="code" />
          </DataTable.Col>
          <DataTable.Col
            source="printCode"
            label="Cód. Impresión"
            sx={{ width: "15%" }}
          >
            <TextField source="printCode" />
          </DataTable.Col>
          <DataTable.Col source="name" label="Nombre" sx={{ width: "55%" }}>
            <TextField source="name" />
          </DataTable.Col>
          <DataTable.Col label="" sx={{ width: "15%", whiteSpace: "nowrap" }}>
            <EditButton />
            <AddSubaccountButton onAdd={handleAdd} />
          </DataTable.Col>
        </DataTable>
      </List>

      <SubaccountFormDrawer
        open={drawerState.open}
        onClose={handleClose}
        parentId={drawerState.parentId}
        record={
          drawerState.mode === "edit" ? drawerState.editRecord : undefined
        }
      />
    </>
  );
};
